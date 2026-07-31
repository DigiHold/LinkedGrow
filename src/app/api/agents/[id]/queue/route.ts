import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentLeads, agentQueue, linkedinAccounts } from "@/lib/db/schema";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { todaysPace } from "@/lib/agent-pace";

/**
 * Today's queue.
 *
 * The promise the product makes is that nothing is sent that the user could not
 * have read first, so this route serves the exact stored body and lets it be
 * edited or dropped before the worker picks it up. Rows already sent are
 * immutable here; editing history would make the activity log a lie.
 *
 * Two lists, because the sequence works in two ways. A message is written by
 * the model shortly before it goes, and that draft lands in agent_queue, which
 * is what `queue` holds. An invitation has no text to write, so the people
 * waiting for one are simply the next in line: `nextUp` is that line, in the
 * order the worker itself takes them, cut to what the day's ramp allows.
 */

const MAX_BODY = 1200;

/**
 * The worker's own ordering, copied deliberately rather than approximated.
 *
 * Somebody who asked a question out loud is worth contacting before somebody
 * who merely reacted to a post, and inside each tier the oldest goes first so
 * that nobody waits forever. If this ordering drifts from the worker's, the tab
 * names people the agent is not about to contact, which is worse than no tab.
 */
const WORKER_PRIORITY = sql`CASE WHEN ${agentLeads.signalType} LIKE 'question:%' OR ${agentLeads.signalType} LIKE 'intent:%' THEN 0 ELSE 1 END`;

export async function GET(
  _request: NextRequest,
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
      .select({
        id: agents.id,
        reviewMode: agents.reviewMode,
        observeOnly: agents.observeOnly,
        status: agents.status,
        timezone: agents.timezone,
        workdayStart: agents.workdayStart,
        workdayEnd: agents.workdayEnd,
        workdayDays: agents.workdayDays,
        warmupStartPerDay: agents.warmupStartPerDay,
        warmupIncrementPerWeek: agents.warmupIncrementPerWeek,
        warmupWeeks: agents.warmupWeeks,
        warmupStartedAt: linkedinAccounts.warmupStartedAt,
        dailyInviteCap: linkedinAccounts.dailyInviteCap,
      })
      .from(agents)
      .innerJoin(
        linkedinAccounts,
        eq(linkedinAccounts.id, agents.linkedinAccountId)
      )
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: agentQueue.id,
        action: agentQueue.action,
        state: agentQueue.state,
        scheduledAt: agentQueue.scheduledAt,
        messageBody: agentQueue.messageBody,
        failureReason: agentQueue.failureReason,
        leadId: agentLeads.id,
        fullName: agentLeads.fullName,
        headline: agentLeads.headline,
        company: agentLeads.company,
        avatarUrl: agentLeads.avatarUrl,
        profileUrl: agentLeads.profileUrl,
        matchScore: agentLeads.matchScore,
        matchReason: agentLeads.matchReason,
        signalText: agentLeads.signalText,
        signalUrl: agentLeads.signalUrl,
      })
      .from(agentQueue)
      .innerJoin(agentLeads, eq(agentQueue.leadId, agentLeads.id))
      .where(
        and(
          eq(agentQueue.agentId, id),
          eq(agentQueue.workspaceId, workspaceId),
          inArray(agentQueue.state, ["pending", "approved"])
        )
      )
      .orderBy(asc(agentQueue.scheduledAt));

    // What the agent may really send today: its ramp this week, not the
    // account's eventual ceiling. Listing eight people as "today" while the
    // engine sends five is the same lie in a smaller size.
    const pace = todaysPace(agent, agent.warmupStartedAt);

    // The people waiting for an invitation, in the order the worker takes them.
    // Capped at the day's allowance, because listing 400 people as "today" when
    // five go out would be a lie the customer notices within a day.
    const nextUp = await db
      .select({
        leadId: agentLeads.id,
        fullName: agentLeads.fullName,
        headline: agentLeads.headline,
        jobTitle: agentLeads.jobTitle,
        company: agentLeads.company,
        avatarUrl: agentLeads.avatarUrl,
        profileUrl: agentLeads.profileUrl,
        matchScore: agentLeads.matchScore,
        matchReason: agentLeads.matchReason,
        signalText: agentLeads.signalText,
        signalUrl: agentLeads.signalUrl,
      })
      .from(agentLeads)
      .where(
        and(
          eq(agentLeads.agentId, id),
          eq(agentLeads.workspaceId, workspaceId),
          eq(agentLeads.sequenceStatus, "queued")
        )
      )
      .orderBy(WORKER_PRIORITY, asc(agentLeads.updatedAt))
      .limit(Math.max(1, Math.min(50, pace)));

    // How many more are behind today's, so the tab can say so instead of
    // pretending the line ends where it was cut.
    const [waiting] = await db
      .select({ total: count() })
      .from(agentLeads)
      .where(
        and(
          eq(agentLeads.agentId, id),
          eq(agentLeads.workspaceId, workspaceId),
          eq(agentLeads.sequenceStatus, "queued")
        )
      );

    return NextResponse.json({
      queue: rows,
      nextUp,
      laterCount: Math.max(0, (waiting?.total ?? 0) - nextUp.length),
      reviewMode: agent.reviewMode,
      observeOnly: agent.observeOnly,
      status: agent.status,
      timezone: agent.timezone,
      workdayStart: agent.workdayStart,
      workdayEnd: agent.workdayEnd,
      todaysPace: pace,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load the queue" }, { status: 500 });
  }
}

/**
 * PATCH: approve, skip, or rewrite one queued item, or approve everything
 * pending in one call. Anything already sent or failed is out of reach.
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

    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "";
    const now = new Date();

    if (action === "approveAll") {
      await db
        .update(agentQueue)
        .set({ state: "approved", approvedAt: now, updatedAt: now })
        .where(
          and(
            eq(agentQueue.agentId, id),
            eq(agentQueue.workspaceId, workspaceId),
            eq(agentQueue.state, "pending")
          )
        );
      return NextResponse.json({ ok: true });
    }

    const itemId = typeof body?.itemId === "string" ? body.itemId : "";
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }
    if (!["approve", "skip", "edit"].includes(action)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const patch: {
      state?: "approved" | "skipped";
      approvedAt?: Date;
      messageBody?: string;
      updatedAt: Date;
    } = { updatedAt: now };

    if (action === "approve") {
      patch.state = "approved";
      patch.approvedAt = now;
    }
    if (action === "skip") patch.state = "skipped";
    if (action === "edit") {
      const text = typeof body?.messageBody === "string" ? body.messageBody.trim() : "";
      if (!text || text.length > MAX_BODY) {
        return NextResponse.json(
          { error: `The message has to be between 1 and ${MAX_BODY} characters.` },
          { status: 400 }
        );
      }
      patch.messageBody = text;
    }

    // Ownership and the not-yet-sent condition are both in the WHERE, so a
    // race against the worker loses instead of overwriting a sent message.
    const updated = await db
      .update(agentQueue)
      .set(patch)
      .where(
        and(
          eq(agentQueue.id, itemId),
          eq(agentQueue.agentId, id),
          eq(agentQueue.workspaceId, workspaceId),
          inArray(agentQueue.state, ["pending", "approved"])
        )
      )
      .returning({ id: agentQueue.id });

    if (!updated.length) {
      return NextResponse.json(
        { error: "That item has already gone out." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update the queue" }, { status: 500 });
  }
}
