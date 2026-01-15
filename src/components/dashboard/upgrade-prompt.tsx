"use client";

import {
  Lock,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  Edit3,
  Calendar,
  Clock,
  BarChart3,
  Lightbulb,
  Users,
  Zap,
  GitBranch,
  Code,
  Headphones,
  Check,
  Crown,
  Anchor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PlanId,
  PlanFeatures,
  PLANS,
  FEATURE_INFO,
  getRequiredPlanForFeature,
  getMissingFeatures,
  getUpgradePath,
} from "@/lib/plans";
import { redirectToCheckout } from "@/lib/checkout";

interface UpgradePromptProps {
  feature?: keyof PlanFeatures;
  currentPlan?: PlanId;
  userEmail?: string;
  variant?: "card" | "inline" | "overlay" | "fullPage";
}

const featureIcons: Record<keyof PlanFeatures, React.ElementType> = {
  postGeneration: Sparkles,
  imageGeneration: ImageIcon,
  carouselGenerator: Layers,
  hooksGenerator: Anchor,
  advancedEditor: Edit3,
  calendar: Calendar,
  scheduling: Clock,
  analytics: BarChart3,
  redditIdeas: Lightbulb,
  engagement: Users,
  algorithmOptimizer: Zap,
  abTesting: GitBranch,
  apiAccess: Code,
  prioritySupport: Headphones,
};

export function UpgradePrompt({
  feature,
  currentPlan = "free",
  userEmail = "",
  variant = "card",
}: UpgradePromptProps) {
  const nextPlan = getUpgradePath(currentPlan);
  const requiredPlan = feature ? getRequiredPlanForFeature(feature) : nextPlan || "starter";
  const featureInfo = feature ? FEATURE_INFO[feature] : null;
  const planInfo = PLANS[requiredPlan];

  // Get missing features for full page variant
  const missingFeatures = nextPlan ? getMissingFeatures(currentPlan, nextPlan) : [];
  const allMissingFeatures = getMissingFeatures(currentPlan, "business");

  if (variant === "overlay") {
    const Icon = feature ? featureIcons[feature] : Lock;
    return (
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-linkedin to-purple-600 flex items-center justify-center mb-6 shadow-lg">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">{featureInfo?.name || "Premium Feature"}</h3>
          <p className="text-muted-foreground mb-6">
            {featureInfo?.description || `This feature requires the ${planInfo.name} plan or higher.`}
          </p>
          <Button
            variant="linkedin"
            size="lg"
            className="shadow-lg"
            onClick={() => redirectToCheckout(requiredPlan, userEmail)}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to {planInfo.name} - ${planInfo.price}/mo
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <span className="font-medium text-amber-900 dark:text-amber-100">
            {featureInfo?.name || "Premium Feature"}
          </span>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Available on {planInfo.name} plan
          </p>
        </div>
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => redirectToCheckout(requiredPlan, userEmail)}
        >
          Upgrade
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  }

  // Full page variant - shows all missing features beautifully
  if (variant === "fullPage") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-linkedin via-purple-600 to-pink-600 flex items-center justify-center mb-6 shadow-xl">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Unlock Your Full Potential
            </h2>
            <p className="text-lg text-muted-foreground">
              Upgrade to access premium features and supercharge your LinkedIn growth
            </p>
          </div>

          {/* Current Plan Info */}
          <div className="bg-accent/30 rounded-xl p-4 mb-6 text-center">
            <span className="text-sm text-muted-foreground">Current plan: </span>
            <span className="font-semibold">{PLANS[currentPlan].name}</span>
            {currentPlan === "free" && (
              <span className="text-sm text-muted-foreground ml-2">
                ({PLANS.free.limits.postsPerMonth} posts remaining)
              </span>
            )}
          </div>

          {/* Missing Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {allMissingFeatures.slice(0, 8).map((featureKey) => {
              const info = FEATURE_INFO[featureKey];
              const Icon = featureIcons[featureKey];
              const requiredFor = getRequiredPlanForFeature(featureKey);
              return (
                <div
                  key={featureKey}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-border/50 hover:border-linkedin/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-linkedin/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-linkedin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{info.name}</p>
                    <p className="text-xs text-muted-foreground">{PLANS[requiredFor].name}+</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upgrade Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nextPlan && nextPlan !== "business" && (
              <div
                className="p-5 rounded-xl border-2 border-border hover:border-linkedin/50 transition-all bg-white dark:bg-gray-800 cursor-pointer"
                onClick={() => redirectToCheckout(nextPlan, userEmail)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{PLANS[nextPlan].name}</h3>
                  <span className="text-lg font-bold text-linkedin">
                    ${PLANS[nextPlan].price}/mo
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {PLANS[nextPlan].description}
                </p>
                <Button variant="outline" className="w-full">
                  Upgrade to {PLANS[nextPlan].name}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            <div
              className="p-5 rounded-xl border-2 border-linkedin bg-linkedin/5 hover:bg-linkedin/10 transition-all relative overflow-hidden cursor-pointer"
              onClick={() => redirectToCheckout("pro", userEmail)}
            >
              <div className="absolute top-0 right-0 bg-linkedin text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                POPULAR
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">{PLANS.pro.name}</h3>
                <span className="text-lg font-bold text-linkedin">
                  ${PLANS.pro.price}/mo
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {PLANS.pro.description}
              </p>
              <Button variant="linkedin" className="w-full text-white">
                <Crown className="w-4 h-4 mr-2" />
                Go Pro
              </Button>
            </div>
          </div>

          {/* What you get */}
          {nextPlan && missingFeatures.length > 0 && (
            <div className="mt-8 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Unlock with {PLANS[nextPlan].name}:
              </h4>
              <div className="flex flex-wrap gap-2">
                {missingFeatures.map((featureKey) => (
                  <span
                    key={featureKey}
                    className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                  >
                    {FEATURE_INFO[featureKey].name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  const Icon = feature ? featureIcons[feature] : Lock;
  return (
    <div className="bg-linear-to-br from-linkedin/5 via-purple-500/5 to-pink-500/5 rounded-2xl p-6 border border-linkedin/10 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-linear-to-br from-linkedin to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">
            {featureInfo?.name || "Premium Feature"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {featureInfo?.description || `Upgrade to ${planInfo.name} to unlock this feature and more.`}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="linkedin"
              size="sm"
              className="shadow-md text-white"
              onClick={() => redirectToCheckout(requiredPlan, userEmail)}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to {planInfo.name}
            </Button>
            <span className="text-sm text-muted-foreground">
              ${planInfo.price}/mo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for showing in lists
export function UpgradeBadge({ feature, currentPlan = "free" }: { feature: keyof PlanFeatures; currentPlan?: PlanId }) {
  const requiredPlan = getRequiredPlanForFeature(feature);
  if (PLANS[currentPlan].limits.features[feature]) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">
      <Lock className="w-3 h-3" />
      {PLANS[requiredPlan].name}
    </span>
  );
}
