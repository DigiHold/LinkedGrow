export type PlanId = "free" | "starter" | "pro" | "business";

export interface PlanFeatures {
  postGeneration: boolean;
  imageGeneration: boolean;
  carouselGenerator: boolean;
  hooksGenerator: boolean;
  advancedEditor: boolean;
  calendar: boolean;
  scheduling: boolean;
  analytics: boolean;
  redditIdeas: boolean;
  engagement: boolean;
  algorithmOptimizer: boolean;
  // Business-only features
  abTesting: boolean;
  teamCollaboration: boolean;
  advancedAnalytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface PlanLimits {
  postsPerMonth: number; // -1 = unlimited
  scheduledPosts: number; // -1 = unlimited
  savedIdeas: number; // -1 = unlimited
  imagesPerMonth: number; // -1 = unlimited
  features: PlanFeatures;
}

export interface PlanInfo {
  id: PlanId;
  name: string;
  description: string;
  price: number; // Monthly price in USD
  limits: PlanLimits;
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  free: {
    id: "free",
    name: "Free",
    description: "Try LinkedGrow with basic features",
    price: 0,
    limits: {
      postsPerMonth: 3,
      scheduledPosts: 0,
      savedIdeas: 5,
      imagesPerMonth: 0,
      features: {
        postGeneration: true,
        imageGeneration: false,
        carouselGenerator: false,
        hooksGenerator: false,
        advancedEditor: false,
        calendar: false,
        scheduling: false,
        analytics: false,
        redditIdeas: false,
        engagement: false,
        algorithmOptimizer: false,
        abTesting: false,
        teamCollaboration: false,
                advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
      },
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for getting started",
    price: 19,
    limits: {
      postsPerMonth: -1, // Unlimited with BYOK
      scheduledPosts: 10,
      savedIdeas: 50,
      imagesPerMonth: 0,
      features: {
        postGeneration: true,
        imageGeneration: false,
        carouselGenerator: false,
        hooksGenerator: false,
        advancedEditor: true,
        calendar: true,
        scheduling: true,
        analytics: false,
        redditIdeas: true,
        engagement: false,
        algorithmOptimizer: false,
        abTesting: false,
        teamCollaboration: false,
                advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
      },
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For serious content creators",
    price: 39,
    popular: true,
    limits: {
      postsPerMonth: -1,
      scheduledPosts: -1,
      savedIdeas: -1,
      imagesPerMonth: -1, // Unlimited with BYOK
      features: {
        postGeneration: true,
        imageGeneration: true,
        carouselGenerator: false, // Business only
        hooksGenerator: true,
        advancedEditor: true,
        calendar: true,
        scheduling: true,
        analytics: true,
        redditIdeas: true,
        engagement: true,
        algorithmOptimizer: true,
        abTesting: false,
        teamCollaboration: false,
                advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
      },
    },
  },
  business: {
    id: "business",
    name: "Business",
    description: "Everything unlocked",
    price: 79,
    limits: {
      postsPerMonth: -1,
      scheduledPosts: -1,
      savedIdeas: -1,
      imagesPerMonth: -1,
      features: {
        postGeneration: true,
        imageGeneration: true,
        carouselGenerator: true, // Business exclusive
        hooksGenerator: true,
        advancedEditor: true,
        calendar: true,
        scheduling: true,
        analytics: true,
        redditIdeas: true,
        engagement: true,
        algorithmOptimizer: true,
        abTesting: true,
        teamCollaboration: true,
        advancedAnalytics: true,
        apiAccess: true,
        prioritySupport: true,
      },
    },
  },
};

// Feature display info for upgrade prompts
export const FEATURE_INFO: Record<keyof PlanFeatures, { name: string; description: string; icon: string }> = {
  postGeneration: {
    name: "Post Generation",
    description: "Generate unlimited LinkedIn posts with AI",
    icon: "sparkles",
  },
  imageGeneration: {
    name: "AI Image Generation",
    description: "Create stunning images with DALL-E, Flux, and more",
    icon: "image",
  },
  carouselGenerator: {
    name: "Carousel Generator",
    description: "Create engaging carousel posts that go viral",
    icon: "layers",
  },
  hooksGenerator: {
    name: "Hooks Generator",
    description: "Generate attention-grabbing hooks for your posts",
    icon: "anchor",
  },
  advancedEditor: {
    name: "Advanced Editor",
    description: "Rich text formatting, templates, and more",
    icon: "edit",
  },
  calendar: {
    name: "Content Calendar",
    description: "Plan and visualize your content strategy",
    icon: "calendar",
  },
  scheduling: {
    name: "Post Scheduling",
    description: "Schedule posts for optimal engagement times",
    icon: "clock",
  },
  analytics: {
    name: "Analytics Dashboard",
    description: "Track performance and optimize your content",
    icon: "chart",
  },
  redditIdeas: {
    name: "Reddit Ideas",
    description: "Find trending topics from Reddit communities",
    icon: "lightbulb",
  },
  engagement: {
    name: "Engagement Tools",
    description: "Manage comments and grow your network",
    icon: "users",
  },
  algorithmOptimizer: {
    name: "Algorithm Optimizer",
    description: "AI-powered tips to maximize reach",
    icon: "zap",
  },
  abTesting: {
    name: "A/B Testing",
    description: "Test different versions of your content",
    icon: "split",
  },
  teamCollaboration: {
    name: "Team Collaboration",
    description: "Invite team members and collaborate on content",
    icon: "users-round",
  },
  advancedAnalytics: {
    name: "Advanced Analytics",
    description: "Deep insights with trends, heatmaps, and exports",
    icon: "trending-up",
  },
  apiAccess: {
    name: "API Access",
    description: "Secure REST API for integrations and automation",
    icon: "code",
  },
  prioritySupport: {
    name: "Priority Support",
    description: "24/7 priority email and chat support",
    icon: "headphones",
  },
};

export function canAccessFeature(
  userPlan: PlanId,
  feature: keyof PlanFeatures
): boolean {
  return PLANS[userPlan].limits.features[feature];
}

export function getRequiredPlanForFeature(
  feature: keyof PlanFeatures
): PlanId {
  if (PLANS.free.limits.features[feature]) return "free";
  if (PLANS.starter.limits.features[feature]) return "starter";
  if (PLANS.pro.limits.features[feature]) return "pro";
  return "business";
}

export function isWithinLimit(
  userPlan: PlanId,
  limitType: "postsPerMonth" | "scheduledPosts" | "savedIdeas" | "imagesPerMonth",
  currentUsage: number
): boolean {
  const limit = PLANS[userPlan].limits[limitType];
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
}

export function getUpgradePath(currentPlan: PlanId): PlanId | null {
  const order: PlanId[] = ["free", "starter", "pro", "business"];
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
