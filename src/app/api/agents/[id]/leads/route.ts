import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentLeads, agentQueue, agentSources } from "@/lib/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  or,
  type SQL,
} from "drizzle-orm";
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

/**
 * The funnel counters on the overview, expressed as sets of steps.
 *
 * A single `step` cannot say "contacted", because contacted means invited or
 * anything after it: somebody who has since accepted and replied was still
 * contacted. The overview counts them that way, so clicking the counter has to
 * filter the same way or the page shows 1 person where the tile said 30.
 */
const STAGES: Record<string, readonly string[]> = {
  contacted: ["invited", "accepted", "messaged", "replied", "finished"],
  accepted: ["accepted", "messaged", "replied", "finished"],
  replied: ["replied", "finished"],
};

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
    const stageParam = url.searchParams.get("stage") ?? "";
    const stage = STAGES[stageParam];
    // The one the funnel counts off sequence_status rather than off the step.
    if (stageParam === "needs-you") {
      filters.push(eq(agentLeads.sequenceStatus, "handed_over"));
    } else if (stage) {
      filters.push(
        inArray(agentLeads.step, stage as unknown as (typeof STEPS)[number][])
      );
    } else if ((STEPS as readonly string[]).includes(stepParam)) {
      filters.push(
        eq(agentLeads.step, stepParam as (typeof STEPS)[number])
      );
    }
    if (sourceParam) filters.push(eq(agentLeads.sourceId, sourceParam));
    // "70 and up" on the toolbar. A lead with no score at all drops out of a
    // score filter, which is the honest reading of it.
    const minScore = Number.parseInt(url.searchParams.get("minScore") ?? "", 10);
    if (Number.isInteger(minScore) && minScore > 0 && minScore <= 100) {
      filters.push(gte(agentLeads.matchScore, minScore));
    }
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
          signalAuthor: agentLeads.signalAuthor,
          sourceId: agentLeads.sourceId,
          step: agentLeads.step,
          stepAt: agentLeads.stepAt,
          foundAt: agentLeads.foundAt,
          excludedReason: agentLeads.excludedReason,
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
        .select({
          id: agentSources.id,
          label: agentSources.label,
          type: agentSources.type,
        })
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

/**
 * Reject one lead.
 *
 * The row is kept rather than deleted, and this is deliberate: the unique index
 * on (workspace, profile) is what stops a second agent contacting the same
 * person, so removing the row would hand the prospect straight back to another
 * agent. Excluding it drops whatever was queued for them and leaves the claim.
 */
export async function PATCH(
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

    const body = await request.json();
    if (body.action !== "reject") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    const leadId = typeof body.leadId === "string" ? body.leadId : "";
    if (!leadId || leadId.length > 64) {
      return NextResponse.json({ error: "Which lead?" }, { status: 400 });
    }

    const now = new Date();
    // Ownership and the agent both live in the WHERE, so a lead id from another
    // workspace matches nothing rather than being rejected on their behalf.
    const rejected = await db
      .update(agentLeads)
      .set({
        step: "excluded",
        stepAt: now,
        rejectedAt: now,
        excludedReason: "You rejected this person",
        updatedAt: now,
      })
      .where(
        and(
          eq(agentLeads.id, leadId),
          eq(agentLeads.agentId, id),
          eq(agentLeads.workspaceId, workspaceId)
        )
      )
      .returning({ id: agentLeads.id });

    if (rejected.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Anything already queued for them stops. Rejecting somebody and then
    // watching the agent message them an hour later is the worst version of it.
    await db
      .update(agentQueue)
      .set({ state: "skipped", updatedAt: now })
      .where(
        and(
          eq(agentQueue.leadId, leadId),
          eq(agentQueue.workspaceId, workspaceId),
          inArray(agentQueue.state, ["pending", "approved"])
        )
      );

    return NextResponse.json({ rejected: true });
  } catch {
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
