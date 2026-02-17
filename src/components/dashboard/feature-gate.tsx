"use client";

import {
  Lock,
  Crown,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  Calendar,
  BarChart3,
  Users,
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
} from "lucide-react";
import {
  PlanId,
  PlanFeatures,
  PLANS,
  FEATURE_INFO,
  canAccessFeature,
  getRequiredPlanForFeature,
  getMissingFeatures,
} from "@/lib/plans";
import { useSession } from "next-auth/react";
import { UpgradeButton } from "./upgrade-button";

const featureIcons: Record<keyof PlanFeatures, React.ElementType> = {
  postGeneration: Sparkles,
  imageGeneration: ImageIcon,
  carouselGenerator: Layers,
  hooksGenerator: Anchor,
  advancedEditor: PenLine,
  calendar: Calendar,
  scheduling: Calendar,
  analytics: BarChart3,
  redditIdeas: Sparkles,
  engagement: Users,
  algorithmOptimizer: Zap,
  abTesting: GitBranch,
  teamCollaboration: UsersRound,
  advancedAnalytics: TrendingUp,
  apiAccess: Code,
  prioritySupport: Headphones,
};

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
}

export function FeatureGate({
  feature,
  children,
}: FeatureGateProps) {
  const { data: session, status } = useSession();

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-linkedin" />
      </div>
    );
  }

  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasAccess = canAccessFeature(userPlan, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  const requiredPlan = getRequiredPlanForFeature(feature);
  const featureInfo = FEATURE_INFO[feature];
  const Icon = featureIcons[feature];
  const planInfo = PLANS[requiredPlan];

  // Get features user will unlock with this plan
  const unlockedFeatures = getMissingFeatures(userPlan, requiredPlan);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Main CTA Card */}
        <div className="bg-linear-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-linkedin/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-linkedin via-purple-600 to-pink-600 flex items-center justify-center mb-6 shadow-xl">
              <Icon className="w-10 h-10 text-white" />
            </div>

            {/* Lock Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium mb-4">
              <Lock className="w-4 h-4" />
              <span>Premium Feature</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">
              Unlock {featureInfo.name}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {featureInfo.description}. Upgrade to{" "}
              <span className="font-semibold text-foreground">{planInfo.name}</span>{" "}
              to access this and more powerful features.
            </p>

            {/* What you'll unlock */}
            {unlockedFeatures.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4" />
                  What you&apos;ll unlock with {planInfo.name}:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {unlockedFeatures.map((featureKey) => (
                    <div
                      key={featureKey}
                      className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{FEATURE_INFO[featureKey].name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <UpgradeButton
              planName={planInfo.name}
            />

            {/* All Plans Link */}
            <div className="mt-4">
              <a
                href="/dashboard/upgrade"
                className="text-sm text-linkedin hover:underline inline-flex items-center gap-1"
              >
                Compare all plans
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* Current plan info */}
            <p className="text-xs text-muted-foreground mt-3">
              Current plan: <span className="font-medium">{PLANS[userPlan].name}</span>
            </p>
          </div>
        </div>

        {/* Feature Preview (blurred) */}
        <div className="mt-8 relative">
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent z-10 rounded-xl" />
          <div className="blur-[2px] opacity-70 pointer-events-none bg-accent/30 rounded-xl p-6 h-48">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simpler inline version for partial page gating
export function FeatureGateInline({
  feature,
  children,
}: FeatureGateProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-linkedin" />
      </div>
    );
  }

  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasAccess = canAccessFeature(userPlan, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  const requiredPlan = getRequiredPlanForFeature(feature);
  const featureInfo = FEATURE_INFO[feature];
  const planInfo = PLANS[requiredPlan];

  return (
    <div className="relative rounded-xl border border-dashed border-amber-300 dark:border-amber-700 p-6 bg-amber-50/50 dark:bg-amber-950/20">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="font-semibold mb-1">{featureInfo.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Available on {planInfo.name} plan
        </p>
        <UpgradeButton
          planName={planInfo.name}
          variant="inline"
        />
      </div>
    </div>
  );
}
