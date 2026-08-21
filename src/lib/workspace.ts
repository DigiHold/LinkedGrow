import { loadSessionUser } from "@/lib/auth-user";
import { effectivePlan, hasAgentSubscription, type PlanId } from "@/lib/plans";

/**
 * The workspace owns agents, not the individual user, so a team member sees
 * the same agents as the owner. loadSessionUser is the cached read auth()
 * already performed for this request, so this costs no extra round trip.
 *
 * Lived inside the agents route until the drafts route needed the same
 * resolution; one copy here, both import it.
 */
export async function resolveWorkspace(userId: string) {
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return {
    workspaceId: data.teamOwnerId ?? data.user.id,
    // effectivePlan, not the raw column: an admin runs on the top plan and a
    // local copy of that rule is how the session and an API route end up
    // disagreeing about what someone is allowed to do.
    plan: effectivePlan({
      plan: data.owner?.plan ?? data.user.plan,
      isAdmin: data.user.isAdmin,
    }) as PlanId,
    // Add-on agents belong to whoever pays, so a team member reads the owner's
    // count rather than their own empty one.
    extraAgents: data.owner?.extraAgents ?? data.user.extraAgents ?? 0,
    // The add-on is billed on the plan's own cycle, so the upsell has to quote
    // the figure that will actually be charged.
    billingInterval:
      (data.owner?.billingInterval ?? data.user.billingInterval) === "year"
        ? ("year" as const)
        : ("month" as const),
    // The subscription belongs to whoever pays, so a team member reads the
    // owner's, same as the plan above.
    agentSubscription: hasAgentSubscription({
      stripeSubscriptionId:
        data.owner?.stripeSubscriptionId ?? data.user.stripeSubscriptionId,
      isAdmin: data.user.isAdmin,
    }),
  };
}
