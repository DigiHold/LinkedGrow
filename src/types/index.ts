// User types
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  plan: 'free' | 'starter' | 'creator' | 'pro' | 'agency';
  planExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API Key types
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral';

export interface APIKey {
  id: string;
  userId: string;
  provider: AIProvider;
  encryptedKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Business Profile
export interface BusinessProfile {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  products?: string;
  niche?: string;
  targetAudience?: string;
  keyTopics?: string;
  doNotMention?: string;
  additionalContext?: string;
  createdAt: string;
  updatedAt: string;
}

// LinkedIn Connection
export interface LinkedInConnection {
  id: string;
  userId: string;
  linkedinId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  profileName?: string;
  profileEmail?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

// Post types
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type PostType = 'actionable' | 'inspiring' | 'introspective' | 'promotional';
export type PostSource = 'manual' | 'generator' | 'reddit' | 'ideas' | 'repurpose';

export interface Post {
  id: string;
  userId: string;
  content: string;
  status: PostStatus;
  postType?: PostType;
  postCategory?: string;
  scheduledAt?: string;
  publishedAt?: string;
  linkedinPostId?: string;
  mediaUrl?: string;
  mediaType?: string;
  firstComment?: string;
  firstCommentDelayMinutes: number;
  algorithmScore?: number;
  isFavorite: boolean;
  source?: PostSource;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Post Analytics
export interface PostAnalytics {
  id: string;
  postId: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
  fetchedAt: string;
}

// Content Ideas
export interface SavedIdea {
  id: string;
  userId: string;
  hook: string;
  postType?: string;
  postCategory?: string;
  theme?: string;
  engagementPrediction?: string;
  isUsed: boolean;
  createdAt: string;
}

// AI Generation types
export type PromptType = 'hooks' | 'posts' | 'ideas' | 'edit' | 'carousel' | 'repurpose';

export interface AIGeneration {
  id: string;
  userId: string;
  provider: AIProvider;
  model?: string;
  promptType: PromptType;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  createdAt: string;
}

// Engagement Tracking
export interface EngagementTracking {
  id: string;
  userId: string;
  date: string;
  likesGiven: number;
  commentsGiven: number;
  likesGoal: number;
  commentsGoal: number;
}

// User Settings
export interface UserSettings {
  id: string;
  userId: string;
  defaultAiProvider: AIProvider;
  defaultAiModel?: string;
  dailyLikesGoal: number;
  dailyCommentsGoal: number;
  preferredPostingTimes?: string[];
  timezone: string;
  emailNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

// Algorithm Score breakdown
export interface AlgorithmScore {
  total: number;
  hookStrength: number;
  length: number;
  formatting: number;
  engagement: number;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generation request types
export interface GenerateHooksRequest {
  content: string;
  count?: number;
}

export interface GeneratePostsRequest {
  hook: string;
  postType?: PostType;
  postCategory?: string;
  count?: number;
}

export interface GenerateIdeasRequest {
  theme: string;
  postType?: PostType;
  count?: number;
}

export interface EditPostRequest {
  content: string;
  instruction: string;
}
