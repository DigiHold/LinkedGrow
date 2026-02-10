"use client";

import { Crown, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlanId, PLANS, isWithinLimit, getUpgradePath } from "@/lib/plans";
import { redirectToCheckout } from "@/lib/checkout";

interface UsageLimitProps {
  userPlan: PlanId;
  currentUsage: number;
  limitType: "postsPerMonth" | "scheduledPosts" | "imagesPerMonth";
  userEmail?: string;
  onLimitReached?: () => void;
}

const limitLabels: Record<UsageLimitProps["limitType"], string> = {
  postsPerMonth: "Posts",
  scheduledPosts: "Scheduled Posts",
  imagesPerMonth: "Images",
};

export function UsageLimit({
  userPlan,
  currentUsage,
  limitType,
  userEmail = "",
  onLimitReached,
}: UsageLimitProps) {
  const limit = PLANS[userPlan].limits[limitType];
  const isUnlimited = limit === -1;
  const withinLimit = isWithinLimit(userPlan, limitType, currentUsage);
  const nextPlan = getUpgradePath(userPlan);

  if (isUnlimited) {
    return null; // Don't show anything for unlimited plans
  }

  const percentage = Math.min((currentUsage / limit) * 100, 100);
  const remaining = Math.max(limit - currentUsage, 0);
  const isNearLimit = percentage >= 80;
  const isAtLimit = !withinLimit;

  // Trigger callback when limit is reached
  if (isAtLimit && onLimitReached) {
    onLimitReached();
  }

  return (
    <div
      className={`p-4 rounded-xl border ${
        isAtLimit
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          : isNearLimit
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          : "bg-accent/30 border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          {isAtLimit && <AlertTriangle className="w-4 h-4 text-red-500" />}
          {limitLabels[limitType]}
        </span>
        <span
          className={`text-sm font-semibold ${
            isAtLimit
              ? "text-red-600 dark:text-red-400"
              : isNearLimit
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          {currentUsage} / {limit}
        </span>
      </div>

      <Progress
        value={percentage}
        className={`h-2 ${
          isAtLimit
            ? "[&>div]:bg-red-500"
            : isNearLimit
            ? "[&>div]:bg-amber-500"
            : ""
        }`}
      />

      {isAtLimit ? (
        <div className="mt-3">
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            You&apos;ve reached your monthly limit. Upgrade to continue creating content.
          </p>
          {nextPlan && (
            <Button
              size="sm"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => redirectToCheckout(nextPlan, userEmail)}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to {PLANS[nextPlan].name}
            </Button>
          )}
        </div>
      ) : isNearLimit ? (
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
          {remaining} {limitLabels[limitType].toLowerCase()} remaining this month
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">
          {remaining} remaining this month
        </p>
      )}
    </div>
  );
}

// Blocking overlay when limit is reached
interface LimitReachedOverlayProps {
  userPlan: PlanId;
  limitType: "postsPerMonth" | "scheduledPosts" | "imagesPerMonth";
  userEmail?: string;
}

export function LimitReachedOverlay({ userPlan, limitType, userEmail = "" }: LimitReachedOverlayProps) {
  const nextPlan = getUpgradePath(userPlan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Limit Reached</h2>
        <p className="text-muted-foreground mb-6">
          You&apos;ve used all your free {limitLabels[limitType].toLowerCase()} this month.
          Upgrade to continue growing your LinkedIn presence!
        </p>

        <div className="space-y-3">
          {nextPlan && (
            <Button
              variant="linkedin"
              size="lg"
              className="w-full text-white"
              onClick={() => redirectToCheckout(nextPlan, userEmail)}
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to {PLANS[nextPlan].name} - ${PLANS[nextPlan].price}/mo
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => window.location.href = "/dashboard"}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* What you'll get */}
        {nextPlan && (
          <div className="mt-6 pt-6 border-t border-border text-left">
            <p className="text-sm font-medium mb-2">
              With {PLANS[nextPlan].name} you get:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-linkedin" />
                {PLANS[nextPlan].limits.postsPerMonth === -1
                  ? "Unlimited posts"
                  : `${PLANS[nextPlan].limits.postsPerMonth} posts per month`}
              </li>
              {PLANS[nextPlan].limits.scheduledPosts > 0 && (
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-linkedin" />
                  {PLANS[nextPlan].limits.scheduledPosts === -1
                    ? "Unlimited scheduling"
                    : `${PLANS[nextPlan].limits.scheduledPosts} scheduled posts`}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Small usage badge for headers
export function UsageBadge({
  userPlan,
  currentUsage,
  limitType,
  userEmail = "",
}: Omit<UsageLimitProps, "onLimitReached">) {
  const limit = PLANS[userPlan].limits[limitType];
  const nextPlan = getUpgradePath(userPlan);
  if (limit === -1) return null;

  const remaining = Math.max(limit - currentUsage, 0);
  const isAtLimit = remaining === 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
        isAtLimit
          ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
          : "bg-accent text-muted-foreground"
      }`}
    >
      {remaining}/{limit} left
      {isAtLimit && nextPlan && (
        <button
          onClick={() => redirectToCheckout(nextPlan, userEmail)}
          className="text-red-600 hover:underline"
        >
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
