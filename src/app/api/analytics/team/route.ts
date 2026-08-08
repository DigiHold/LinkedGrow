import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentLeads, agentMessages, agents } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";
import { workspaceMembers } from "@/lib/team-utils";
import { canAccessFeature, effectivePlan } from "@/lib/plans";

/**
 * What each agent produced, and what each person is carrying.
 *
 * Two different questions, so two different windows. An agent is judged over a
 * period, because it works every day and last month's numbers say nothing about
 * this one. A person is judged on what is on their desk right now: a
 * conversation handed to them in March and still unanswered is a fact about
 * today, not about March.
 *
 * Everything here is counted off rows the product already writes. Nothing is
 * estimated and nothing is averaged.
 */

/** The steps that mean an invitation went out, cumulative rather than current. */
const CONTACTED = ["invited", "accepted", "messaged", "replied", "finished"];
const ACCEPTED = ["accepted", "messaged", "replied", "finished"];
const REPLIED = ["replied", "finished"];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    const plan = effectivePlan({
      plan: data.owner?.plan ?? data.user.plan,
      isAdmin: data.user.isAdmin,
    });
    if (!canAccessFeature(plan, "advancedAnalytics")) {
      return NextResponse.json(
        { error: "Team reporting is on the Business plan.", feature: "advancedAnalytics" },
        { status: 403 }
      );
    }

    const raw = Number(request.nextUrl.searchParams.get("days"));
    const days = Number.isFinite(raw) && raw >= 1 && raw <= 90 ? Math.trunc(raw) : 30;
    const since = new Date(Date.now() - days * 86_400_000);

    const [funnel, roster, owned, waiting, mine] = await Promise.all([
      // One row per agent per step, which is the whole funnel in a single pass.
      db
        .select({
          agentId: agentLeads.agentId,
          step: agentLeads.step,
          total: count(),
        })
        .from(agentLeads)
        .where(and(eq(agentLeads.workspaceId, workspaceId), gte(agentLeads.foundAt, since)))
        .groupBy(agentLeads.agentId, agentLeads.step),

      workspaceMembers(workspaceId),

      // Conversations that have an owner, split by whether the agent still has them.
      db
        .select({
          assignedTo: agentLeads.assignedTo,
          handedOver: sql<number>`sum(case when ${agentLeads.sequenceStatus} = 'handed_over' then 1 else 0 end)`,
          total: count(),
        })
        .from(agentLeads)
        .where(
          and(eq(agentLeads.workspaceId, workspaceId), isNotNull(agentLeads.assignedTo))
        )
        .groupBy(agentLeads.assignedTo),

      // An answer nobody has opened yet, on a conversation somebody owns. This
      // is the number a team lead actually reads the page for.
      db
        .select({ assignedTo: agentLeads.assignedTo, total: count() })
        .from(agentMessages)
        .innerJoin(agentLeads, eq(agentLeads.id, agentMessages.leadId))
        .where(
          and(
            eq(agentMessages.workspaceId, workspaceId),
            eq(agentMessages.direction, "in"),
            isNull(agentMessages.readAt),
            isNotNull(agentLeads.assignedTo)
          )
        )
        .groupBy(agentLeads.assignedTo),

      db
        .select({ id: agents.id, name: agents.name })
        .from(agents)
        .where(eq(agents.workspaceId, workspaceId)),
    ]);

    const byAgent = new Map(
      mine.map((a) => [
        a.id,
        { id: a.id, name: a.name, found: 0, contacted: 0, accepted: 0, replied: 0 },
      ])
    );
    for (const row of funnel) {
      if (!row.agentId) continue;
      const bucket = byAgent.get(row.agentId);
      if (!bucket) continue;
      bucket.found += row.total;
      if (CONTACTED.includes(row.step)) bucket.contacted += row.total;
      if (ACCEPTED.includes(row.step)) bucket.accepted += row.total;
      if (REPLIED.includes(row.step)) bucket.replied += row.total;
    }

    const ownedBy = new Map(owned.map((r) => [r.assignedTo, r]));
    const waitingBy = new Map(waiting.map((r) => [r.assignedTo, r.total]));

    const people = roster.map((m) => {
      const row = ownedBy.get(m.id);
      const total = row?.total ?? 0;
      const handedOver = Number(row?.handedOver ?? 0);
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        image: m.image,
        isOwner: m.isOwner,
        conversations: total,
        /** Handed over means the agent has stopped, so this one is theirs alone. */
        theirsAlone: handedOver,
        unread: waitingBy.get(m.id) ?? 0,
      };
    });

    const unassigned = await db
      .select({ total: count() })
      .from(agentLeads)
      .where(
        and(
          eq(agentLeads.workspaceId, workspaceId),
          isNull(agentLeads.assignedTo),
          eq(agentLeads.sequenceStatus, "handed_over")
        )
      );

    return NextResponse.json({
      days,
      agents: [...byAgent.values()].sort((a, b) => b.replied - a.replied),
      people: people.sort((a, b) => b.unread - a.unread || b.conversations - a.conversations),
      /** Threads the agent has finished with and nobody has picked up. */
      unclaimed: unassigned[0]?.total ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load team reporting" }, { status: 500 });
  }
}
