import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  agents,
  agentLeads,
  agentMessages,
  linkedinAccounts,
} from "@/lib/db/schema";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import type { PlanId } from "@/lib/plans";

/**
 * The workspace owns agents, not the individual user, so a team member sees
 * the same agents as the owner. loadSessionUser is the cached read auth()
 * already performed for this request, so this costs no extra round trip.
 */
async function resolveWorkspace(userId: string) {
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return {
    workspaceId: data.teamOwnerId ?? data.user.id,
    plan: (data.owner?.plan ?? data.user.plan) as PlanId,
  };
}

/** Pro carries 2 agents, Business 3. Section 5c and the 2026-07-26 decision. */
function agentQuotaFor(plan: PlanId): number {
  if (plan === "business") return 3;
  if (plan === "pro") return 2;
  return 0;
}

// GET /api/agents - every agent in the workspace, with its funnel counts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        pausedReason: agents.pausedReason,
        icpSummary: agents.icpSummary,
        dailyInviteCap: agents.dailyInviteCap,
        warmupStartedAt: linkedinAccounts.warmupStartedAt,
        lastRunAt: agents.lastRunAt,
        createdAt: agents.createdAt,
        accountId: linkedinAccounts.id,
        accountName: linkedinAccounts.fullName,
        accountAvatar: linkedinAccounts.avatarUrl,
        accountStatus: linkedinAccounts.status,
        accountCountry: linkedinAccounts.country,
      })
      .from(agents)
      .innerJoin(
        linkedinAccounts,
        eq(linkedinAccounts.id, agents.linkedinAccountId)
      )
      .where(eq(agents.workspaceId, workspace.workspaceId));

    if (rows.length === 0) {
      return NextResponse.json({
        agents: [],
        quota: { used: 0, limit: agentQuotaFor(workspace.plan) },
      });
    }

    // One grouped query for the funnel rather than four per agent. The list
    // page shows found / contacted / accepted / replied for every row, and
    // doing that per agent would be a round trip each.
    const ids = rows.map((r) => r.id);
    const [funnel, unread] = await Promise.all([
      db
        .select({
          agentId: agentLeads.agentId,
          step: agentLeads.step,
          total: count(),
        })
        .from(agentLeads)
        .where(inArray(agentLeads.agentId, ids))
        .groupBy(agentLeads.agentId, agentLeads.step),
      db
        .select({ agentId: agentMessages.agentId, total: count() })
        .from(agentMessages)
        .where(
          and(
            inArray(agentMessages.agentId, ids),
            eq(agentMessages.direction, "in"),
            isNull(agentMessages.readAt)
          )
        )
        .groupBy(agentMessages.agentId),
    ]);

    const CONTACTED = ["invited", "accepted", "messaged", "replied", "finished"];
    const ACCEPTED = ["accepted", "messaged", "replied", "finished"];

    const byAgent = new Map(
      ids.map((id) => [
        id,
        { found: 0, contacted: 0, accepted: 0, replied: 0, unread: 0 },
      ])
    );
    for (const row of funnel) {
      if (!row.agentId) continue;
      const bucket = byAgent.get(row.agentId);
      if (!bucket) continue;
      bucket.found += row.total;
      if (CONTACTED.includes(row.step)) bucket.contacted += row.total;
      if (ACCEPTED.includes(row.step)) bucket.accepted += row.total;
      if (row.step === "replied") bucket.replied += row.total;
    }
    for (const row of unread) {
      const bucket = byAgent.get(row.agentId);
      if (bucket) bucket.unread = row.total;
    }

    return NextResponse.json({
      agents: rows.map((row) => ({
        ...row,
        // The IP itself is never exposed, only the country it sits in.
        funnel: byAgent.get(row.id),
      })),
      quota: { used: rows.length, limit: agentQuotaFor(workspace.plan) },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load agents" },
      { status: 500 }
    );
  }
}

// POST /api/agents - create an agent against an already connected account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const linkedinAccountId =
      typeof body?.linkedinAccountId === "string" ? body.linkedinAccountId : "";

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Name is required and must be 80 characters or fewer" },
        { status: 400 }
      );
    }
    if (!linkedinAccountId) {
      return NextResponse.json(
        { error: "A connected LinkedIn account is required" },
        { status: 400 }
      );
    }

    const limit = agentQuotaFor(workspace.plan);
    if (limit === 0) {
      return NextResponse.json(
        { error: "Agents require the Pro plan", feature: "agents" },
        { status: 403 }
      );
    }

    // Ownership is in the WHERE clause, never a check after the fetch.
    const [[existing], [account]] = await Promise.all([
      db
        .select({ total: count() })
        .from(agents)
        .where(eq(agents.workspaceId, workspace.workspaceId)),
      db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.id, linkedinAccountId),
            eq(linkedinAccounts.workspaceId, workspace.workspaceId)
          )
        )
        .limit(1),
    ]);

    if (!account) {
      return NextResponse.json(
        { error: "LinkedIn account not found" },
        { status: 404 }
      );
    }
    if ((existing?.total ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: `Your plan includes ${limit} agent${limit === 1 ? "" : "s"}`,
          quota: { used: existing?.total ?? 0, limit },
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const id = crypto.randomUUID();

    try {
      await db.insert(agents).values({
        id,
        workspaceId: workspace.workspaceId,
        createdBy: session.user.id,
        linkedinAccountId,
        name,
        // Agents are always created paused. Activating is a separate,
        // deliberate action, per section 7b.
        status: "paused",
        createdAt: now,
        updatedAt: now,
      });
    } catch {
      // uq_agents_linkedin_account: one agent per connected account, enforced
      // by the database rather than by a read-then-write that can race.
      return NextResponse.json(
        { error: "That LinkedIn account already has an agent" },
        { status: 409 }
      );
    }

    return NextResponse.json({ id, status: "paused" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
