"use client";

import {
  Lock,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  Calendar,
  BarChart3,
  UsersRound,
  GitBranch,
  Code,
  Zap,
  Check,
  Anchor,
  PenLine,
  Headphones,
  TrendingUp,
  Loader2,
  MessageSquare,
  Bell,
  Lightbulb,
} from "lucide-react";
import {
  PlanId,
  PlanFeatures,
  PLANS,
  FEATURE_INFO,
  canAccessFeature,
  getRequiredPlanForFeature,
  getMissingFeatures,
  UPGRADE_PATH,
} from "@/lib/plans";
import { useSession } from "next-auth/react";
import { UpgradeButton } from "./upgrade-button";

const featureIcons: Record<keyof PlanFeatures, React.ElementType> = {
  abTesting: GitBranch,
  teamCollaboration: UsersRound,
  advancedAnalytics: TrendingUp,
};

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  const userPlan = (session?.user?.plan as PlanId) || "free";

  if (canAccessFeature(userPlan, feature)) {
    return <>{children}</>;
  }

  const requiredPlan = getRequiredPlanForFeature(feature);
  const featureInfo = FEATURE_INFO[feature];
  const Icon = featureIcons[feature];
  const planInfo = PLANS[requiredPlan];
  const unlockedFeatures = getMissingFeatures(userPlan, requiredPlan);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 py-12 sm:p-6 lg:p-8">
      <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
        {/* The icon states which feature is locked, so it stays neutral. The
            only saturated element on the card is the button you are meant to
            press. */}
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <Lock className="h-3 w-3" />
              {planInfo.name} plan
            </span>
            <h1 className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[26px] dark:text-white">
              {featureInfo.name}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
              {featureInfo.description}. It is part of the {planInfo.name} plan.
            </p>
          </div>
        </div>

        {unlockedFeatures.length > 0 && (
          <div className="mt-7 rounded-xl border border-border bg-slate-50/70 p-5 dark:bg-white/2">
            <p className="text-[13px] font-medium text-slate-900 dark:text-white">
              {planInfo.name} also unlocks
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {unlockedFeatures.map((featureKey) => (
                <div
                  key={featureKey}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <span className="truncate">
                    {FEATURE_INFO[featureKey].name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <UpgradeButton planName={planInfo.name} />
          <a
            href={UPGRADE_PATH}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Compare all plans
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        <p className="mt-5 border-t border-border pt-5 text-[13px] text-slate-500 dark:text-slate-400">
          You are on {PLANS[userPlan].name}.
        </p>
      </div>
    </div>
  );
}

// Simpler inline version for partial page gating
export function FeatureGateInline({ feature, children }: FeatureGateProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  const userPlan = (session?.user?.plan as PlanId) || "free";

  if (canAccessFeature(userPlan, feature)) {
    return <>{children}</>;
  }

  const requiredPlan = getRequiredPlanForFeature(feature);
  const featureInfo = FEATURE_INFO[feature];
  const planInfo = PLANS[requiredPlan];

  return (
    <div className="rounded-xl border border-border bg-slate-50/70 p-6 dark:bg-white/2">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[15px] font-medium text-slate-900 dark:text-white">
              {featureInfo.name}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Part of the {planInfo.name} plan.
            </p>
          </div>
        </div>
        <UpgradeButton planName={planInfo.name} variant="inline" />
      </div>
    </div>
  );
}
