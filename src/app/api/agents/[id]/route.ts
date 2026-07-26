import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  agents,
  agentLeads,
  agentSources,
  agentEvents,
  agentQueue,
  linkedinAccounts,
} from "@/lib/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

async function resolveWorkspaceId(userId: string) {
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return data.teamOwnerId ?? data.user.id;
}

// GET /api/agents/[id] - the agent, its sources, its queue and its recent events
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

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ownership lives in the WHERE clause, so a wrong id is a 404 rather than
    // someone else's agent.
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        pausedReason: agents.pausedReason,
        icpSummary: agents.icpSummary,
        goal: agents.goal,
        tone: agents.tone,
        matchLevel: agents.matchLevel,
        skipConnected: agents.skipConnected,
        reviewMode: agents.reviewMode,
        smartLeadFinder: agents.smartLeadFinder,
        dailyInviteCap: agents.dailyInviteCap,
        timezone: agents.timezone,
        workdayStart: agents.workdayStart,
        workdayEnd: agents.workdayEnd,
        warmupStartedAt: agents.warmupStartedAt,
        lastRunAt: agents.lastRunAt,
        createdAt: agents.createdAt,
        accountName: linkedinAccounts.fullName,
        accountAvatar: linkedinAccounts.avatarUrl,
        accountHeadline: linkedinAccounts.headline,
        accountStatus: linkedinAccounts.status,
        accountCountry: linkedinAccounts.country,
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

    // Four independent reads, so they go together rather than in sequence.
    const [sources, funnel, events, queued] = await Promise.all([
      db
        .select()
        .from(agentSources)
        .where(eq(agentSources.agentId, id)),
      db
        .select({ step: agentLeads.step, total: count() })
        .from(agentLeads)
        .where(eq(agentLeads.agentId, id))
        .groupBy(agentLeads.step),
      db
        .select()
        .from(agentEvents)
        .where(eq(agentEvents.agentId, id))
        .orderBy(desc(agentEvents.createdAt))
        .limit(20),
      db
        .select({ total: count() })
        .from(agentQueue)
        .where(and(eq(agentQueue.agentId, id), eq(agentQueue.state, "pending"))),
    ]);

    const steps: Record<string, number> = {};
    for (const row of funnel) steps[row.step] = row.total;

    return NextResponse.json({
      agent,
      sources,
      steps,
      events,
      queuedToday: queued[0]?.total ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load agent" },
      { status: 500 }
    );
  }
}

const EDITABLE = [
  "name",
  "icpSummary",
  "goal",
  "tone",
  "matchLevel",
  "skipConnected",
  "reviewMode",
  "smartLeadFinder",
  "timezone",
] as const;

// PATCH /api/agents/[id] - settings, and start or pause
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

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const patch: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of EDITABLE) {
      if (!(field in body)) continue;
      const value = body[field];
      if (field === "name") {
        if (typeof value !== "string" || !value.trim() || value.length > 80) {
          return NextResponse.json(
            { error: "Name must be between 1 and 80 characters" },
            { status: 400 }
          );
        }
        patch.name = value.trim();
      } else if (typeof value === "boolean" || typeof value === "string") {
        patch[field] = value;
      }
    }

    // Status is separate: it is an action, not a field, and it is the one
    // change that has real-world consequences.
    if (typeof body.status === "string") {
      if (!["active", "paused"].includes(body.status)) {
        return NextResponse.json(
          { error: "Status must be active or paused" },
          { status: 400 }
        );
      }
      patch.status = body.status;
      patch.pausedReason = body.status === "paused" ? "Paused by you" : null;
      // The warm-up ramp starts the first time an agent is switched on and
      // never restarts, otherwise pausing would be a way to reset the caps.
      if (body.status === "active") {
        const [current] = await db
          .select({ warmupStartedAt: agents.warmupStartedAt })
          .from(agents)
          .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
          .limit(1);
        if (current && !current.warmupStartedAt) {
          patch.warmupStartedAt = new Date();
          patch.status = "warming";
        }
      }
    }

    const result = await db
      .update(agents)
      .set(patch)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .returning({ id: agents.id, status: agents.status });

    if (result.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ id: result[0].id, status: result[0].status });
  } catch {
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await db
      .delete(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .returning({ id: agents.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Leads survive on purpose: they are workspace-scoped and carry the
    // contact history that section 9c's dedup depends on. Deleting an agent
    // must not make its prospects contactable again by another one.
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
