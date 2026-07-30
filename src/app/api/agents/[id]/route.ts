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
        observeOnly: agents.observeOnly,
        testRecipients: agents.testRecipients,
        dailyInviteCap: linkedinAccounts.dailyInviteCap,
        timezone: agents.timezone,
        workdayStart: agents.workdayStart,
        workdayEnd: agents.workdayEnd,
        warmupStartedAt: linkedinAccounts.warmupStartedAt,
        lastRunAt: agents.lastRunAt,
        createdAt: agents.createdAt,
        accountName: linkedinAccounts.fullName,
        accountAvatar: linkedinAccounts.avatarUrl,
        accountHeadline: linkedinAccounts.headline,
        accountStatus: linkedinAccounts.status,
        accountCountry: linkedinAccounts.country,
        accountId: linkedinAccounts.id,
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

    // Five independent reads, so they go together rather than in sequence.
    const [sources, funnel, events, queued, siblings] = await Promise.all([
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
      // How many agents send from the same LinkedIn account. They divide its
      // daily budget, so the screen cannot present the cap as this agent's own.
      db
        .select({ total: count() })
        .from(agents)
        .where(
          and(
            eq(agents.linkedinAccountId, agent.accountId),
            eq(agents.workspaceId, workspaceId)
          )
        ),
    ]);

    const steps: Record<string, number> = {};
    for (const row of funnel) steps[row.step] = row.total;

    return NextResponse.json({
      agent: { ...agent, accountAgentCount: siblings[0]?.total ?? 1 },
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
  "observeOnly",
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
      // Warm-up is a property of the LinkedIn ACCOUNT, not of the agent.
      // LinkedIn watches the account, so an account that already served its
      // month keeps the pace it earned even if you delete the agent and make
      // a new one. Only a freshly connected account starts the ramp.
      if (body.status === "active") {
        const [current] = await db
          .select({
            accountId: agents.linkedinAccountId,
            warmupStartedAt: linkedinAccounts.warmupStartedAt,
          })
          .from(agents)
          .innerJoin(
            linkedinAccounts,
            eq(linkedinAccounts.id, agents.linkedinAccountId)
          )
          .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
          .limit(1);

        if (current && !current.warmupStartedAt) {
          await db
            .update(linkedinAccounts)
            .set({ warmupStartedAt: new Date(), updatedAt: new Date() })
            .where(eq(linkedinAccounts.id, current.accountId));
          patch.status = "warming";
        }
      }
    }

    // The sending account can be swapped after creation. Freezing it only
    // pushed people to delete the agent and build a new one, which threw away
    // its leads and its earned pace to change one field.
    if (typeof body.linkedinAccountId === "string" && body.linkedinAccountId) {
      if (body.linkedinAccountId.length > 64) {
        return NextResponse.json({ error: "Invalid account" }, { status: 400 });
      }
      const [account] = await db
        .select({
          id: linkedinAccounts.id,
          warmupStartedAt: linkedinAccounts.warmupStartedAt,
        })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.id, body.linkedinAccountId),
            // Ownership sits in the WHERE: an id posted by a client must never
            // reach another workspace's account.
            eq(linkedinAccounts.workspaceId, workspaceId)
          )
        )
        .limit(1);
      if (!account) {
        return NextResponse.json(
          { error: "That account is not one of yours" },
          { status: 404 }
        );
      }
      patch.linkedinAccountId = account.id;

      // Warm-up belongs to the account, so an agent moved onto an account that
      // has never run starts that account's ramp now instead of inheriting the
      // pace the previous one had earned.
      const [existing] = await db
        .select({ status: agents.status })
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
        .limit(1);
      if (!existing) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      const nextStatus = (patch.status as string | undefined) ?? existing.status;
      if (
        (nextStatus === "active" || nextStatus === "warming") &&
        !account.warmupStartedAt
      ) {
        await db
          .update(linkedinAccounts)
          .set({ warmupStartedAt: new Date(), updatedAt: new Date() })
          .where(eq(linkedinAccounts.id, account.id));
        patch.status = "warming";
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
