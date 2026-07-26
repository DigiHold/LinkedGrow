export type PlanId = "free" | "starter" | "pro" | "business";

export interface PlanFeatures {
  postGeneration: boolean;
  ideas: boolean;
  imageGeneration: boolean;
  carouselGenerator: boolean;
  hooksGenerator: boolean;
  advancedEditor: boolean;
  calendar: boolean;
  scheduling: boolean;
  analytics: boolean;
  contentRepurposing: boolean;
  firstComment: boolean;
  algorithmOptimizer: boolean;
  networkNotifications: boolean;
  teamNotifications: boolean;
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
  imagesPerMonth: number; // -1 = unlimited
  features: PlanFeatures;
}

export interface PlanInfo {
  id: PlanId;
  name: string;
  description: string;
  price: number; // Monthly price in USD
  yearlyPrice: number; // Yearly total in USD (30% off monthly x 12)
  limits: PlanLimits;
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  free: {
    id: "free",
    name: "Trial Expired",
    description: "Your 7-day Pro trial ended - upgrade to keep posting",
    price: 0,
    yearlyPrice: 0,
    limits: {
      postsPerMonth: 0,
      scheduledPosts: 0,
      imagesPerMonth: 0,
      features: {
        postGeneration: false,
        ideas: false,
        imageGeneration: false,
        carouselGenerator: false,
        hooksGenerator: false,
        advancedEditor: false,
        calendar: false,
        scheduling: false,
        analytics: false,
        contentRepurposing: false,
        firstComment: false,
        algorithmOptimizer: false,
        networkNotifications: false,
        teamNotifications: false,
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
    yearlyPrice: 160,
    limits: {
      postsPerMonth: -1, // Unlimited with BYOK
      scheduledPosts: 10,
      imagesPerMonth: 0,
      features: {
        postGeneration: true,
        ideas: true,
        imageGeneration: false,
        carouselGenerator: false,
        hooksGenerator: false,
        advancedEditor: true,
        calendar: true,
        scheduling: true,
        analytics: false,
        contentRepurposing: true,
        firstComment: false,
        algorithmOptimizer: false,
        networkNotifications: false,
        teamNotifications: false,
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
    yearlyPrice: 328,
    popular: true,
    limits: {
      postsPerMonth: -1,
      scheduledPosts: -1,
      imagesPerMonth: -1, // Unlimited with BYOK
      features: {
        postGeneration: true,
        ideas: true,
        imageGeneration: true,
        carouselGenerator: false, // Business only
        hooksGenerator: true,
        advancedEditor: true,
        calendar: true,
        scheduling: true,
        analytics: true,
        contentRepurposing: true,
        firstComment: true,
        algorithmOptimizer: true,
        networkNotifications: true,
        teamNotifications: false,
        abTesting: false,
        teamCollaboration: false,
        advancedAnalytics: false,
        // Pro carries the API and the MCP server; Business keeps the team,
        // carousel and advanced-analytics side.
        apiAccess: true,
        prioritySupport: false,
      },
    },
  },
  business: {
    id: "business",
    name: "Business",
    description: "Everything unlocked",
    price: 79,
    yearlyPrice: 664,
    limits: {
      postsPerMonth: -1,
      scheduledPosts: -1,
      imagesPerMonth: -1,
      features: {
        postGeneration: true,
        ideas: true,
        imageGeneration: true,
        carouselGenerator: true, // Business exclusive
        hooksGenerator: true,
        advancedEditor: true,
        calendar: true,
        scheduling: true,
        analytics: true,
        contentRepurposing: true,
        firstComment: true,
        algorithmOptimizer: true,
        networkNotifications: true,
        teamNotifications: true,
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
    name: "Post generation",
    description: "Write LinkedIn posts with AI, without a monthly cap",
    icon: "sparkles",
  },
  ideas: {
    name: "Ideas",
    description: "Topics worth posting about, based on your niche",
    icon: "lightbulb",
  },
  imageGeneration: {
    name: "Image generation",
    // Providers verified against the AI settings page, which is the source of
    // truth for model names.
    description: "Make post images with Nano Banana, GPT Image or FLUX",
    icon: "image",
  },
  carouselGenerator: {
    name: "Carousel",
    description: "Build a multi-slide PDF carousel and post it as a document",
    icon: "layers",
  },
  hooksGenerator: {
    name: "Hooks",
    description: "Write several openings for a post and pick the one that lands",
    icon: "anchor",
  },
  advancedEditor: {
    name: "Advanced editor",
    description: "Rich text formatting and templates",
    icon: "edit",
  },
  calendar: {
    name: "Calendar",
    description: "See everything you have scheduled, and the gaps",
    icon: "calendar",
  },
  scheduling: {
    name: "Scheduling",
    description: "Queue a post for an exact date and time",
    icon: "clock",
  },
  analytics: {
    name: "Analytics",
    description: "Followers, impressions, reactions and how each post did",
    icon: "chart",
  },
  contentRepurposing: {
    name: "Repurpose",
    description: "Turn Reddit, YouTube, blogs and web pages into LinkedIn posts",
    icon: "repeat",
  },
  firstComment: {
    name: "First comment",
    description: "Post a follow-up comment a few minutes after publishing",
    icon: "message-square",
  },
  algorithmOptimizer: {
    name: "Algorithm optimizer",
    description: "Scores your draft on hook, length, formatting and replies",
    icon: "zap",
  },
  networkNotifications: {
    name: "Network notifications",
    description: "An email when someone you follow publishes on LinkedIn",
    icon: "bell",
  },
  teamNotifications: {
    name: "Team notifications",
    description: "An email to your team when the company page publishes",
    icon: "users-round",
  },
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
  apiAccess: {
    name: "API and MCP",
    description: "REST API keys, and the MCP server for ChatGPT or Claude Code",
    icon: "code",
  },
  prioritySupport: {
    name: "Priority support",
    // No hours are claimed here: LinkedGrow is two people and cannot promise
    // round-the-clock cover.
    description: "Your tickets go to the front of the queue",
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
  limitType: "postsPerMonth" | "scheduledPosts" | "imagesPerMonth",
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
