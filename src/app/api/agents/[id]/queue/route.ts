import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentLeads, agentQueue } from "@/lib/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * Today's queue.
 *
 * The promise the product makes is that nothing is sent that the user could not
 * have read first, so this route serves the exact stored body and lets it be
 * edited or dropped before the worker picks it up. Rows already sent are
 * immutable here; editing history would make the activity log a lie.
 */

const MAX_BODY = 1200;

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
      .select({ id: agents.id, reviewMode: agents.reviewMode })
      .from(agents)
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

    return NextResponse.json({ queue: rows, reviewMode: agent.reviewMode });
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
