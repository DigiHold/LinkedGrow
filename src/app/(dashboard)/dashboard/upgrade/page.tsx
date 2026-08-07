"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Check,
  Zap,
  Loader2,
  ArrowRight,
  ArrowDown,
  X,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  BarChart3,
  Lightbulb,
  GitBranch,
  Code,
  Headphones,
  Anchor,
  UsersRound,
  TrendingUp,
  MessageSquare,
  Bell,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS, type PlanId, type PlanFeatures, FEATURE_INFO } from "@/lib/plans";

// Only show paid plans - 7-day Pro trial is shown via "Current plan" badge
const PLAN_ORDER: PlanId[] = ["pro", "business"];

// What each plan actually gets you, in the order someone reads it.
const planHighlights: Record<PlanId, string[]> = {
  free: ["Nothing until you pick a plan"],
  pro: [
    "2 LinkedIn agents, each with its own IP",
    "Lead finding, invites and follow-ups on autopilot",
    "Replies land in your inbox, never sent without you",
    "Every content feature: posts, images, carousels, calendar",
    "API access and the MCP server",
  ],
  business: [
    "Everything in Pro, with 3 agents",
    "Your whole team on one workspace",
    "A/B testing",
    "Advanced analytics and exportable reports",
    "Priority support",
  ],
};

export default function UpgradePage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan || "free") as PlanId;
  const userEmail = session?.user?.email || "";
  const userBillingInterval = session?.user?.billingInterval || null;
  const isLtd = session?.user?.isLifetimeDeal || false;

  /**
   * The lifetime holder's discount, read from Stripe through the billing route.
   *
   * Not computed here. The card and the checkout have to quote the same number
   * or somebody sees $99 on one screen and pays something else on the next,
   * which is the surprise this product cannot afford on a pricing page.
   */
  const [ltdOff, setLtdOff] = useState<{ percentOff: number | null; amountOff: number | null } | null>(null);

  useEffect(() => {
    if (!isLtd) return;
    fetch("/api/stripe/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLtdOff(d?.ltdDiscount ?? null))
      .catch(() => setLtdOff(null));
  }, [isLtd]);

  /** The list price after the lifetime discount, in whole dollars. */
  const afterLtd = (amount: number): number => {
    if (!ltdOff) return amount;
    if (ltdOff.percentOff) return Math.round(amount * (1 - ltdOff.percentOff / 100));
    if (ltdOff.amountOff) return Math.max(0, amount - Math.round(ltdOff.amountOff / 100));
    return amount;
  };
  const hasLtdOff = !!ltdOff && (!!ltdOff.percentOff || !!ltdOff.amountOff);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showError = (message: string) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // Full plan hierarchy for comparison (including free)
  const FULL_PLAN_HIERARCHY: PlanId[] = ["free", "pro", "business"];
  const currentPlanIndex = FULL_PLAN_HIERARCHY.indexOf(userPlan);
  const isOnHighestPlan = userPlan === "business";

  const handleCheckout = async (planId: PlanId) => {
    setLoadingPlan(planId);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          email: userEmail,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (error) {
showError("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan("manage");

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to open billing portal");
      }
    } catch (error) {
showError("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const isCurrentBillingMatch = userBillingInterval
    ? userBillingInterval === "month"
    : true; // Free users have no billing interval, always match

  const getPlanAction = (planId: PlanId) => {
    const planIndex = FULL_PLAN_HIERARCHY.indexOf(planId);

    // LTD users own Business forever - mark Business as current on both tabs
    if (isLtd && planId === "business") {
      return { type: "current", label: "Lifetime Deal" };
    }
    // LTD users can't downgrade
    if (isLtd) {
      return { type: "current", label: "Included" };
    }

    if (planId === userPlan && isCurrentBillingMatch) {
      return { type: "current", label: "Current Plan" };
    } else if (planId === userPlan && !isCurrentBillingMatch) {
      return { type: "switch", label: "Switch to Monthly" };
    } else if (planIndex > currentPlanIndex) {
      return { type: "upgrade", label: `Upgrade to ${PLANS[planId].name}` };
    } else {
      return { type: "downgrade", label: `Downgrade to ${PLANS[planId].name}` };
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[32px] dark:text-white">
          {isOnHighestPlan ? "You are on Business" : "Plans"}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          {isOnHighestPlan
            ? "Every feature is unlocked. Manage your subscription below, or look at the other plans."
            : "Change plan whenever you want, and the switch takes effect on your next invoice."}
        </p>
        {/* One quiet line rather than a badge: the reader already knows what
            they pay, they came here to compare. */}
        <p className="mt-4 text-[13px] text-slate-500 dark:text-slate-400">
          You are on{" "}
          <span className="font-medium text-slate-900 dark:text-white">
            {PLANS[userPlan].name}
          </span>{" "}
          {isLtd
            ? "(lifetime deal)"
            : userBillingInterval === "year"
            ? `at $${PLANS[userPlan].yearlyPrice} a year`
            : `at $${PLANS[userPlan].price} a month`}
        </p>
      </div>


      {/* Plans Grid */}
      <div className="mx-auto mb-10 grid max-w-3xl gap-4 md:grid-cols-2 lg:gap-6">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const action = getPlanAction(planId);
          const isCurrent = isLtd ? planId === "business" : (planId === userPlan && isCurrentBillingMatch);
          const isPopular = plan.popular;

          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 transition-all",
                isCurrent
                  ? "border-cyan-400 dark:border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 ring-2 ring-cyan-400/20"
                  : isPopular
                  ? "border-violet-300 dark:border-violet-700 bg-violet-50/30 dark:bg-violet-950/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              )}
            >
              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-semibold shadow-lg">
                    Current plan
                  </div>
                </div>
              )}

              {/* Popular Badge */}
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-3 py-1 rounded-full bg-violet-500 text-white text-xs font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className={cn("pt-2", (isCurrent || isPopular) && "pt-4")}>
                {/* Plan Name */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mt-4 mb-5">
                  <div className="flex items-baseline gap-1">
                    {hasLtdOff && plan.price > 0 && (
                      <span className="text-xl font-medium text-slate-400 line-through dark:text-slate-500">
                        ${plan.price}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      $
                      {afterLtd(
                        plan.price
                      )}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      /mo
                    </span>
                  </div>
                  {hasLtdOff && plan.price > 0 && (
                    <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Your lifetime price, for as long as you keep the plan
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {planHighlights[planId].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          isCurrent
                            ? "text-cyan-500"
                            : isPopular
                            ? "text-violet-500"
                            : "text-emerald-500"
                        )}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {action.type === "current" ? (
                  <Button
                    variant="outline"
                    className="w-full cursor-default"
                    disabled
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Current plan
                  </Button>
                ) : action.type === "switch" ? (
                  // Same plan, different billing period: Stripe Portal
                  <Button
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === "manage"}
                  >
                    {loadingPlan === "manage" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        {action.label}
                      </>
                    )}
                  </Button>
                ) : action.type === "upgrade" && userPlan === "free" ? (
                  // Free → Paid: Stripe Checkout (creates new subscription)
                  <Button
                    className={cn(
                      "w-full",
                      isPopular
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white"
                    )}
                    onClick={() => handleCheckout(planId)}
                    disabled={loadingPlan === planId}
                  >
                    {loadingPlan === planId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        {action.label}
                      </>
                    )}
                  </Button>
                ) : action.type === "upgrade" ? (
                  // Paid → Higher Paid: Stripe Portal (upgrades existing subscription with proration)
                  <Button
                    className={cn(
                      "w-full",
                      isPopular
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white"
                    )}
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === "manage"}
                  >
                    {loadingPlan === "manage" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        {action.label}
                      </>
                    )}
                  </Button>
                ) : (
                  // Downgrade: Stripe Portal
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === "manage"}
                  >
                    {loadingPlan === "manage" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-4 h-4 mr-2" />
                        {action.label}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Lifetime Deal card - 4th slot, dynamically priced by tier. Hidden for LTD owners. */}
      </div>

      {/* Manage Subscription Link */}
      {userPlan !== "free" && (
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={handleManageSubscription}
            disabled={loadingPlan === "manage"}
          >
            {loadingPlan === "manage" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Manage subscription, billing & invoices
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Every plan runs on your own AI key, so this belongs under the table
          rather than inside any one column. */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[15px] font-medium text-slate-900 dark:text-white">
              The agents come with their AI, your posts run on your own key
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Everything the agents write is included in the plan. Posts and
              images stay on your own OpenAI, Anthropic or Google key, so they
              are never capped, and most people spend $2-4 a month on it.
            </p>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <X className="w-5 h-5" />
            <span className="font-medium">{errorToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
