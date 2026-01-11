"use client";

import Link from "next/link";
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
  GitBranch,
  Code,
  Zap,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PlanId,
  PlanFeatures,
  PLANS,
  FEATURE_INFO,
  canAccessFeature,
  getRequiredPlanForFeature,
  getMissingFeatures,
} from "@/lib/plans";

const featureIcons: Record<keyof PlanFeatures, React.ElementType> = {
  postGeneration: Sparkles,
  imageGeneration: ImageIcon,
  carouselGenerator: Layers,
  advancedEditor: Sparkles,
  calendar: Calendar,
  scheduling: Calendar,
  analytics: BarChart3,
  redditIdeas: Sparkles,
  engagement: Users,
  algorithmOptimizer: Zap,
  abTesting: GitBranch,
  apiAccess: Code,
  prioritySupport: Users,
};

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  userPlan?: PlanId;
  children: React.ReactNode;
}

export function FeatureGate({
  feature,
  userPlan = "free",
  children,
}: FeatureGateProps) {
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
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-linkedin/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-linkedin via-purple-600 to-pink-600 flex items-center justify-center mb-6 shadow-xl">
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
                  {unlockedFeatures.slice(0, 6).map((featureKey) => (
                    <div
                      key={featureKey}
                      className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400"
                    >
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{FEATURE_INFO[featureKey].name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <Link href="/#pricing">
              <Button variant="linkedin" size="xl" className="shadow-lg w-full sm:w-auto">
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to {planInfo.name} - ${planInfo.price}/mo
              </Button>
            </Link>

            {/* Current plan info */}
            <p className="text-xs text-muted-foreground mt-4">
              Current plan: <span className="font-medium">{PLANS[userPlan].name}</span>
            </p>
          </div>
        </div>

        {/* Feature Preview (blurred) */}
        <div className="mt-8 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 rounded-xl" />
          <div className="blur-sm opacity-50 pointer-events-none bg-accent/30 rounded-xl p-6 h-48">
            {/* Placeholder preview content */}
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

        {/* All Plans Link */}
        <div className="text-center mt-6">
          <Link
            href="/#pricing"
            className="text-sm text-linkedin hover:underline inline-flex items-center gap-1"
          >
            Compare all plans
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Simpler inline version for partial page gating
export function FeatureGateInline({
  feature,
  userPlan = "free",
  children,
}: FeatureGateProps) {
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
        <Link href="/#pricing">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            <Crown className="w-4 h-4 mr-1" />
            Upgrade to unlock
          </Button>
        </Link>
      </div>
    </div>
  );
}
