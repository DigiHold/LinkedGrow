import { NextResponse } from "next/server";
import { desc, eq, gte, inArray, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentActivity, agentEvents, agents } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * What the agents are doing right now, and what they have just done.
 *
 * Two things, in that order of importance. `doing` is the present: a row the
 * worker writes before it acts and overwrites as it goes, so the dashboard can
 * say "the agent is liking a post by Thomas Blanc" while it is happening.
 * `events` is the recent past, which is what the ticker falls back to when
 * every agent is idle.
 *
 * Deliberately small and cheap: it is polled every few seconds from whatever
 * page somebody happens to be on. Anything richer belongs on the agent's own
 * activity tab.
 */

const LIMIT = 12;

/**
 * How long a "doing" record is believed.
 *
 * The pacing layer means a single action takes tens of seconds and a sourcing
 * pass takes minutes, so this has to be generous. It also has to expire: when
 * the watchdog kills a hung session the row is left behind, and without a
 * window the dashboard would claim for hours that the agent is still liking a
 * post it abandoned.
 */
const DOING_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await loadSessionUser(session.user.id);
    if (!data) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspaceId = data.teamOwnerId ?? data.user.id;

    // Ownership in the WHERE, and the agent names come from the same query so the box can say who
    // did what without a second round trip.
    const mine = await db
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(eq(agents.workspaceId, workspaceId));
    if (mine.length === 0) {
      return NextResponse.json({ doing: [], events: [] });
    }

    const names = new Map(mine.map((a) => [a.id, a.name]));
    const ids = [...names.keys()];

    const [doing, rows] = await Promise.all([
      db
        .select({
          agentId: agentActivity.agentId,
          verb: agentActivity.verb,
          subjectName: agentActivity.subjectName,
          subjectAvatar: agentActivity.subjectAvatar,
          subjectUrl: agentActivity.subjectUrl,
          detail: agentActivity.detail,
          startedAt: agentActivity.startedAt,
        })
        .from(agentActivity)
        .where(
          and(
            inArray(agentActivity.agentId, ids),
            gte(agentActivity.startedAt, new Date(Date.now() - DOING_MS))
          )
        )
        .orderBy(desc(agentActivity.startedAt)),
      db
        .select({
          id: agentEvents.id,
          agentId: agentEvents.agentId,
          type: agentEvents.type,
          message: agentEvents.message,
          createdAt: agentEvents.createdAt,
        })
        .from(agentEvents)
        .where(inArray(agentEvents.agentId, ids))
        .orderBy(desc(agentEvents.createdAt))
        .limit(LIMIT),
    ]);

    return NextResponse.json({
      doing: doing.map((d) => ({
        agentId: d.agentId,
        agentName: names.get(d.agentId) ?? "Agent",
        verb: d.verb,
        subjectName: d.subjectName,
        subjectAvatar: d.subjectAvatar,
        subjectUrl: d.subjectUrl,
        detail: d.detail,
        startedAt: d.startedAt,
      })),
      events: rows.map((r) => ({
        id: r.id,
        agentId: r.agentId,
        agentName: names.get(r.agentId) ?? "Agent",
        type: r.type,
        message: r.message,
        createdAt: r.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
