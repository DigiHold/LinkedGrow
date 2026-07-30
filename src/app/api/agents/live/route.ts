import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentEvents, agents } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * The newest thing every agent in this workspace has done.
 *
 * Feeds the one live box in the dashboard. Deliberately small and cheap: it is polled every few
 * seconds from whatever page somebody happens to be on, so it reads a short window and nothing
 * else. Anything richer belongs on the agent's own activity tab.
 */

const LIMIT = 12;

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
    if (mine.length === 0) return NextResponse.json({ events: [] });

    const names = new Map(mine.map((a) => [a.id, a.name]));
    const rows = await db
      .select({
        id: agentEvents.id,
        agentId: agentEvents.agentId,
        type: agentEvents.type,
        message: agentEvents.message,
        createdAt: agentEvents.createdAt,
      })
      .from(agentEvents)
      .where(inArray(agentEvents.agentId, [...names.keys()]))
      .orderBy(desc(agentEvents.createdAt))
      .limit(LIMIT);

    return NextResponse.json({
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
