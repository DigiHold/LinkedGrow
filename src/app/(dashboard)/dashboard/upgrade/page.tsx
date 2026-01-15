"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Crown,
  Check,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Calendar,
  Clock,
  BarChart3,
  Lightbulb,
  Users,
  Zap,
  GitBranch,
  Code,
  Headphones,
  Loader2,
  ArrowRight,
  Anchor,
  UsersRound,
  Palette,
  TrendingUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS, PlanId, PlanFeatures, FEATURE_INFO } from "@/lib/plans";

// Only show paid plans - Free plan is shown via "Current plan" badge
const PLAN_ORDER: PlanId[] = ["starter", "pro", "business"];

const featureIcons: Record<keyof PlanFeatures, React.ElementType> = {
  postGeneration: Sparkles,
  imageGeneration: ImageIcon,
  carouselGenerator: Layers,
  hooksGenerator: Anchor,
  advancedEditor: Sparkles,
  calendar: Calendar,
  scheduling: Clock,
  analytics: BarChart3,
  redditIdeas: Lightbulb,
  engagement: Users,
  algorithmOptimizer: Zap,
  abTesting: GitBranch,
  apiAccess: Code,
  prioritySupport: Headphones,
  teamCollaboration: UsersRound,
  customBranding: Palette,
  advancedAnalytics: TrendingUp,
};

// Features to display for each plan (curated list)
const planHighlights: Record<PlanId, string[]> = {
  free: [
    "3 posts per month",
    "Basic post editor",
    "Bring your own AI key",
  ],
  starter: [
    "Unlimited posts",
    "Advanced editor",
    "10 scheduled posts",
    "Content calendar",
    "Reddit ideas finder",
  ],
  pro: [
    "Everything in Starter",
    "Unlimited scheduling",
    "AI image generation",
    "Carousel generator",
    "Analytics dashboard",
    "Engagement tools",
    "Algorithm optimizer",
  ],
  business: [
    "Everything in Pro",
    "A/B testing",
    "Team collaboration",
    "Custom branding",
    "Advanced analytics",
    "API access",
    "Priority support",
  ],
};

export default function UpgradePage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan || "free") as PlanId;
  const userEmail = session?.user?.email || "";

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Full plan hierarchy for comparison (including free)
  const FULL_PLAN_HIERARCHY: PlanId[] = ["free", "starter", "pro", "business"];
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
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
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
      console.error("Portal error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanAction = (planId: PlanId) => {
    const planIndex = FULL_PLAN_HIERARCHY.indexOf(planId);

    if (planId === userPlan) {
      return { type: "current", label: "Current Plan" };
    } else if (planIndex > currentPlanIndex) {
      return { type: "upgrade", label: `Upgrade to ${PLANS[planId].name}` };
    } else {
      return { type: "downgrade", label: `Downgrade to ${PLANS[planId].name}` };
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium mb-4">
          <Crown className="w-4 h-4" />
          <span>{isOnHighestPlan ? "Your Plans" : "Upgrade Your Plan"}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {isOnHighestPlan
            ? "You're on the Business plan"
            : "Unlock More Features"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          {isOnHighestPlan
            ? "You have access to all features. Manage your subscription or view other plans."
            : "Choose the plan that best fits your needs. Upgrade or downgrade anytime."}
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <span className="text-sm">Current plan:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {PLANS[userPlan].name}
          </span>
          <span className="text-sm text-slate-500">
            (${PLANS[userPlan].price}/mo)
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-4 lg:gap-6 mb-10 max-w-4xl mx-auto">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const action = getPlanAction(planId);
          const isCurrent = planId === userPlan;
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
                    Current Plan
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
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      /month
                    </span>
                  </div>
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
                    Current Plan
                  </Button>
                ) : action.type === "upgrade" ? (
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
                ) : (
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

      {/* BYOK Notice */}
      <div className="mt-10 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Bring Your Own AI Key
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              All plans support BYOK - connect your own OpenAI, Anthropic, or Google API key.
              Pay only for what you use (typically $0.01-0.05 per post).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
