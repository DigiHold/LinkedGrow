import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentSources } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";
import { parseLinkedInSource, sourceHint } from "@/lib/agent-sources";

/**
 * Adding a place for an agent to hunt, after it was created.
 *
 * The wizard collected the first sources and then there was no way to add a
 * competitor whose page went quiet, or the creator whose comment section is
 * full of your buyers. A person's audience is the densest room on LinkedIn,
 * and until now it could only be chosen on day one.
 */

const TYPES = ["competitor", "creator", "keyword", "buying_event"] as const;
const EVENTS = ["jobchange", "hiring", "funding", "event"] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await loadSessionUser(session.user.id);
    if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const workspaceId = data.teamOwnerId ?? data.user.id;

    // Ownership in the WHERE clause, so somebody else's agent id finds nothing.
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    /**
     * The same ceiling the wizard applies, enforced where it actually counts.
     *
     * The worker reads at most 8 sources a visit, so a list of fifty does not
     * find more: it starves the ones that work, since each waits its turn
     * behind the rest, and it slows the learning that needs several passes per
     * source before it can tell a good room from a bad one.
     */
    const MAX_ENABLED_SOURCES = 15;
    const [{ count: enabledCount } = { count: 0 }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agentSources)
      .where(and(eq(agentSources.agentId, id), eq(agentSources.enabled, true)));
    if (Number(enabledCount) >= MAX_ENABLED_SOURCES) {
      return NextResponse.json(
        {
          error: `An agent works best with ${MAX_ENABLED_SOURCES} live sources at most, and this one is there. Turn one off before adding another.`,
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const type = typeof body?.type === "string" ? body.type : "";
    const value = typeof body?.value === "string" ? body.value.trim() : "";
    if (!TYPES.includes(type as (typeof TYPES)[number])) {
      return NextResponse.json({ error: "Unknown source type" }, { status: 400 });
    }
    if (!value || value.length > 300) {
      return NextResponse.json({ error: "Fill the field in" }, { status: 400 });
    }

    let label = value;
    let config: Record<string, unknown> = {};

    if (type === "competitor" || type === "creator") {
      // Addresses only. A name would send the worker hunting through LinkedIn
      // search, which costs a search and misses every profile whose slug
      // carries digits.
      const parsed = parseLinkedInSource(value, type);
      if (!parsed) {
        return NextResponse.json(
          { error: `Paste ${sourceHint(type)}` },
          { status: 400 }
        );
      }
      config = { url: parsed.url };
      label = parsed.label;
    } else if (type === "keyword") {
      const queries = value
        .split(",")
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0)
        .slice(0, 6);
      if (queries.length === 0) {
        return NextResponse.json({ error: "Give at least one phrase" }, { status: 400 });
      }
      config = { queries };
      label = queries[0] as string;
    } else {
      if (!EVENTS.includes(value as (typeof EVENTS)[number])) {
        return NextResponse.json({ error: "Unknown event" }, { status: 400 });
      }
      const EVENT_LABEL: Record<string, string> = {
        jobchange: "Just changed role",
        hiring: "Hiring for the work",
        funding: "Just raised money",
        event: "Going to an event",
      };
      config = { kind: value };
      label = EVENT_LABEL[value] ?? value;
    }

    const now = new Date();
    const sourceId = randomUUID();
    await db.insert(agentSources).values({
      id: sourceId,
      workspaceId,
      agentId: id,
      type,
      label: label.slice(0, 120),
      config: JSON.stringify(config),
      enabled: true,
      origin: "customer",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: sourceId, label, type }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The source could not be added" }, { status: 500 });
  }
}
