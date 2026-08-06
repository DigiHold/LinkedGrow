export type PlanId = "free" | "pro" | "business";

/**
 * Three Business-only switches, and that is the whole matrix.
 *
 * v2 has two paid plans and cancelling removes every feature rather than
 * demoting you, so "is this person paying" is answered by the middleware
 * paywall in src/proxy.ts, not by a boolean per feature. What is left is the
 * short list a solo operator genuinely does not need and a team cannot work
 * without. Agent count is a quota, not a flag: see agentQuotaFor().
 */
export interface PlanFeatures {
  abTesting: boolean;
  teamCollaboration: boolean;
  advancedAnalytics: boolean;
}

export interface PlanLimits {
  postsPerMonth: number; // -1 = unlimited
  scheduledPosts: number; // -1 = unlimited
  imagesPerMonth: number; // -1 = unlimited
  /** LinkedIn agents included, each with its own account, proxy and warm-up. */
  agents: number;
  features: PlanFeatures;
}

export interface PlanInfo {
  id: PlanId;
  name: string;
  description: string;
  price: number; // Monthly price in USD
  yearlyPrice: number; // Yearly total in USD (pay 10 months, get 12)
  limits: PlanLimits;
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  // Not a tier. This is the state an account lands in when the trial ends or
  // a subscription is cancelled, and it grants nothing.
  free: {
    id: "free",
    name: "No plan",
    description: "Your trial ended. Pick a plan to start again.",
    price: 0,
    yearlyPrice: 0,
    limits: {
      postsPerMonth: 0,
      scheduledPosts: 0,
      imagesPerMonth: 0,
      agents: 0,
      features: {
        abTesting: false,
        teamCollaboration: false,
        advancedAnalytics: false,
      },
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Two agents finding and messaging your leads every day",
    price: 99,
    yearlyPrice: 990,
    popular: true,
    limits: {
      postsPerMonth: -1,
      scheduledPosts: -1,
      imagesPerMonth: -1,
      agents: 2,
      features: {
        abTesting: false,
        teamCollaboration: false,
        advancedAnalytics: false,
      },
    },
  },
  business: {
    id: "business",
    name: "Business",
    description: "Three agents, your whole team, and the reporting behind it",
    price: 179,
    yearlyPrice: 1790,
    limits: {
      postsPerMonth: -1,
      scheduledPosts: -1,
      imagesPerMonth: -1,
      agents: 3,
      features: {
        abTesting: true,
        teamCollaboration: true,
        advancedAnalytics: true,
      },
    },
  },
};

/**
 * How long the trial runs.
 *
 * Stripe owns the clock: the length is passed to Checkout as
 * `trial_period_days` and the dates on the user row are a mirror the webhook
 * writes. Nothing else may set them, because two clocks disagree the first time
 * somebody upgrades mid-trial.
 */
export const TRIAL_DAYS = 7;

/**
 * How long a failed payment has before the agents stop.
 *
 * Pausing rather than deleting: it stops the LinkedIn activity and therefore
 * our per-agent cost, while the leads, the sequences and the history stay where
 * they are so a recovered card resumes instantly.
 */
export const DUNNING_GRACE_DAYS = 2;

/**
 * How long an account may sit with no card before it is deleted.
 *
 * Signup creates a row that can reach nothing. Keeping those for ever fills the
 * table with people who never finished, so they go after 2 weeks with a warning
 * email first.
 */
export const UNCARDED_DELETE_DAYS = 14;

/** Price per extra agent, on either plan. Monthly only, by decision. */
export const EXTRA_AGENT_PRICE = 49;

export const FEATURE_INFO: Record<keyof PlanFeatures, { name: string; description: string; icon: string }> = {
  abTesting: {
    name: "A/B testing",
    description: "Run two versions of a post and keep the one that performs",
    icon: "split",
  },
  teamCollaboration: {
    name: "Team",
    description: "Invite people to the workspace and set what they can do",
    icon: "users-round",
  },
  advancedAnalytics: {
    name: "Advanced analytics",
    description: "Posting heatmap, demographics and exportable reports",
    icon: "trending-up",
  },
};

/**
 * The plan a gate should actually be evaluated against.
 *
 * Admins run on the top plan so they can open every screen to support
 * customers on it. That rule lives in the session (src/lib/auth.ts) and it has
 * to hold on the server too: a route re-reading users.plan from the database
 * would answer "pro" while the UI showed Business, which is how A/B testing
 * 403'd for an admin on 2026-07-26.
 */
export function effectivePlan(user: {
  plan?: string | null;
  isAdmin?: boolean | null;
}): PlanId {
  if (user.isAdmin) return "business";
  const plan = user.plan;
  return plan === "pro" || plan === "business" ? plan : "free";
}

export function canAccessFeature(
  userPlan: PlanId,
  feature: keyof PlanFeatures
): boolean {
  return PLANS[userPlan].limits.features[feature];
}

export function getRequiredPlanForFeature(
  feature: keyof PlanFeatures
): PlanId {
  if (PLANS.pro.limits.features[feature]) return "pro";
  return "business";
}

export function isWithinLimit(
  userPlan: PlanId,
  limitType: "postsPerMonth" | "scheduledPosts" | "imagesPerMonth",
  currentUsage: number
): boolean {
  const limit = PLANS[userPlan].limits[limitType];
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
}

/** Agents included before the $49 add-on. */
export function agentQuotaFor(plan: PlanId): number {
  return PLANS[plan].limits.agents;
}

/** How many agents may run in total: the plan, plus whatever was bought on top. */
export function effectiveAgentQuota(plan: PlanId, extraAgents = 0): number {
  // A cancelled account keeps nothing, whatever it once paid for as an add-on:
  // the add-on item dies with the subscription it hangs off.
  if (plan === "free") return 0;
  const extra = Number.isFinite(extraAgents) ? Math.max(0, Math.trunc(extraAgents)) : 0;
  return agentQuotaFor(plan) + Math.min(extra, MAX_EXTRA_AGENTS);
}

/**
 * The ceiling on add-on agents.
 *
 * Each one is a real LinkedIn account behind its own residential address, so a
 * runaway quantity is a bill we pay before the customer does.
 */
export const MAX_EXTRA_AGENTS = 10;

export function getUpgradePath(currentPlan: PlanId): PlanId | null {
  const order: PlanId[] = ["free", "pro", "business"];
  const currentIndex = order.indexOf(currentPlan);
  if (currentIndex < order.length - 1) {
    return order[currentIndex + 1];
  }
  return null; // Already on highest plan
}

export function getMissingFeatures(
  currentPlan: PlanId,
  targetPlan: PlanId
): (keyof PlanFeatures)[] {
  const currentFeatures = PLANS[currentPlan].limits.features;
  const targetFeatures = PLANS[targetPlan].limits.features;

  return (Object.keys(targetFeatures) as (keyof PlanFeatures)[]).filter(
    (feature) => targetFeatures[feature] && !currentFeatures[feature]
  );
}
