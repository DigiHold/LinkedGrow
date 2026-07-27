import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentEvents, agentLeads, agentMessages } from "@/lib/db/schema";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * The Activity tab, and the per-step counts the Messages tab shows beside each
 * step of the sequence.
 *
 * Events already carry a finished plain-English sentence, so this route joins
 * the lead's name and does no copywriting of its own.
 */

const PAGE_SIZE = 40;
const WINDOWS: Record<string, number> = { "7d": 7, "30d": 30, all: 0 };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const windowKey = url.searchParams.get("window") ?? "7d";
    const days = WINDOWS[windowKey] ?? 7;
    const page = Math.max(
      0,
      Math.min(200, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0)
    );

    const filters = [
      eq(agentEvents.agentId, id),
      eq(agentEvents.workspaceId, workspaceId),
    ];
    if (days > 0) {
      filters.push(
        gte(agentEvents.createdAt, new Date(Date.now() - days * 86400000))
      );
    }
    const where = and(...filters);

    const [rows, totals, steps] = await Promise.all([
      db
        .select({
          id: agentEvents.id,
          type: agentEvents.type,
          message: agentEvents.message,
          createdAt: agentEvents.createdAt,
          leadName: agentLeads.fullName,
          leadUrl: agentLeads.profileUrl,
          leadAvatar: agentLeads.avatarUrl,
        })
        .from(agentEvents)
        .leftJoin(agentLeads, eq(agentEvents.leadId, agentLeads.id))
        .where(where)
        .orderBy(desc(agentEvents.createdAt))
        .limit(PAGE_SIZE)
        .offset(page * PAGE_SIZE),
      db.select({ total: count() }).from(agentEvents).where(where),
      // What each step of the sequence has actually sent, for the Messages tab.
      db
        .select({ step: agentMessages.step, total: count() })
        .from(agentMessages)
        .where(
          and(
            eq(agentMessages.agentId, id),
            eq(agentMessages.workspaceId, workspaceId),
            eq(agentMessages.direction, "out")
          )
        )
        .groupBy(agentMessages.step),
    ]);

    const sent: Record<string, number> = {};
    for (const row of steps) if (row.step) sent[row.step] = row.total;

    const total = totals[0]?.total ?? 0;
    return NextResponse.json({
      events: rows,
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: (page + 1) * PAGE_SIZE < total,
      sent,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load the activity" }, { status: 500 });
  }
}
