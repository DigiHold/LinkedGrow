import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentLeads, agentSources } from "@/lib/db/schema";
import { and, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * The Leads tab.
 *
 * Paginated because an agent that has run for a month holds thousands of rows,
 * and the tab header shows a total the user recognises. Filtering happens in
 * SQL rather than in the browser for the same reason.
 */

const PAGE_SIZE = 25;

const STEPS = [
  "found",
  "queued",
  "invited",
  "accepted",
  "messaged",
  "replied",
  "finished",
  "skipped",
  "excluded",
] as const;

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

    // Ownership is proved on the agent before any lead is read.
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").trim().slice(0, 80);
    const stepParam = url.searchParams.get("step") ?? "";
    const sourceParam = (url.searchParams.get("source") ?? "").slice(0, 64);
    const page = Math.max(
      0,
      Math.min(400, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0)
    );

    // Both conditions, so a lead read never rests on the check above alone.
    const filters: SQL[] = [
      eq(agentLeads.agentId, id),
      eq(agentLeads.workspaceId, workspaceId),
    ];
    if ((STEPS as readonly string[]).includes(stepParam)) {
      filters.push(
        eq(agentLeads.step, stepParam as (typeof STEPS)[number])
      );
    }
    if (sourceParam) filters.push(eq(agentLeads.sourceId, sourceParam));
    if (search) {
      const term = `%${search.replace(/[%_]/g, "")}%`;
      const match = or(
        like(agentLeads.fullName, term),
        like(agentLeads.company, term),
        like(agentLeads.jobTitle, term)
      );
      if (match) filters.push(match);
    }
    const where = and(...filters);

    const [rows, totals, byStep, sources] = await Promise.all([
      db
        .select({
          id: agentLeads.id,
          fullName: agentLeads.fullName,
          headline: agentLeads.headline,
          jobTitle: agentLeads.jobTitle,
          company: agentLeads.company,
          location: agentLeads.location,
          avatarUrl: agentLeads.avatarUrl,
          profileUrl: agentLeads.profileUrl,
          matchScore: agentLeads.matchScore,
          matchReason: agentLeads.matchReason,
          signalText: agentLeads.signalText,
          signalUrl: agentLeads.signalUrl,
          sourceId: agentLeads.sourceId,
          step: agentLeads.step,
          stepAt: agentLeads.stepAt,
          foundAt: agentLeads.foundAt,
        })
        .from(agentLeads)
        .where(where)
        .orderBy(desc(agentLeads.foundAt))
        .limit(PAGE_SIZE)
        .offset(page * PAGE_SIZE),
      db.select({ total: count() }).from(agentLeads).where(where),
      db
        .select({ step: agentLeads.step, total: count() })
        .from(agentLeads)
        .where(
          and(
            eq(agentLeads.agentId, id),
            eq(agentLeads.workspaceId, workspaceId)
          )
        )
        .groupBy(agentLeads.step),
      db
        .select({ id: agentSources.id, label: agentSources.label })
        .from(agentSources)
        .where(eq(agentSources.agentId, id)),
    ]);

    const steps: Record<string, number> = {};
    for (const row of byStep) steps[row.step] = row.total;

    const total = totals[0]?.total ?? 0;
    return NextResponse.json({
      leads: rows,
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: (page + 1) * PAGE_SIZE < total,
      steps,
      sources,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
