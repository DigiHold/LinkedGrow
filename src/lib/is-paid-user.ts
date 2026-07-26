// Single source of truth for "is this user a paid customer?". Used by support
// gating (UI + API), chatbot routing, and anywhere else we need to distinguish
// paying users from trial / free users.
//
// Paid means ANY of:
//   1. Active Stripe subscription
//   2. Lifetime deal
//   3. Plan is pro/business AND not currently in an active trial
//      (covers manually granted accounts like internal/team/comp accounts
//      where there's no Stripe row but the user IS a real customer)
//
// NOT paid:
//   - plan === 'free' (post-trial paywall state)
//   - plan === 'pro' with trialEndedAt in the future and no Stripe / LTD
//     (active 7-day trial)

export interface PaidUserShape {
  plan?: string | null;
  stripeSubscriptionId?: string | null;
  isLifetimeDeal?: boolean | null;
  trialEndedAt?: number | Date | null;
}

export function isPaidUser(user: PaidUserShape | null | undefined): boolean {
  if (!user) return false;
  if (user.stripeSubscriptionId) return true;
  if (user.isLifetimeDeal) return true;
  if (!user.plan || user.plan === "free") return false;

  // Plan is pro/business with no Stripe + no LTD. Could be a manually
  // granted account OR an active trial. Trial = plan=='pro' with a future
  // trialEndedAt. Anything else with a non-free plan is treated as paid.
  if (user.plan === "pro" && user.trialEndedAt) {
    const ts = user.trialEndedAt instanceof Date ? user.trialEndedAt.getTime() : user.trialEndedAt;
    if (ts > Date.now()) return false; // active trial
  }
  return true;
}
