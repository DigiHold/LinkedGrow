import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  password: text("password"), // Hashed password for credentials auth

  // 2FA fields
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
  twoFactorSecret: text("two_factor_secret"),

  // Admin flag
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),

  // Subscription fields
  plan: text("plan", { enum: ["free", "starter", "pro", "business"] }).default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  couponCode: text("coupon_code"), // Stored coupon code (e.g., "WELCOME10" for 10% off 3 months)

  // LinkedIn connection (Posting App)
  linkedinAccessToken: text("linkedin_access_token"),
  linkedinRefreshToken: text("linkedin_refresh_token"),
  linkedinTokenExpiry: integer("linkedin_token_expiry", { mode: "timestamp" }),
  linkedinProfileId: text("linkedin_profile_id"),
  linkedinProfileName: text("linkedin_profile_name"),

  // LinkedIn posting target selection
  linkedinPostingTarget: text("linkedin_posting_target", { enum: ["profile", "organization"] }).default("profile"),
  linkedinSelectedOrgId: text("linkedin_selected_org_id"), // Organization URN ID if posting to company page
  linkedinSelectedOrgName: text("linkedin_selected_org_name"), // Organization name for display
  linkedinOrganizations: text("linkedin_organizations"), // JSON array of administered organizations [{id, name, logoUrl}]

  // LinkedIn Community App (Engagement features)
  linkedinCommunityAccessToken: text("linkedin_community_access_token"),
  linkedinCommunityRefreshToken: text("linkedin_community_refresh_token"),
  linkedinCommunityTokenExpiry: integer("linkedin_community_token_expiry", { mode: "timestamp" }),

  // AI API keys (encrypted) - per-provider storage
  aiProvider: text("ai_provider"), // Currently selected provider
  // Per-provider API keys and models (all encrypted)
  openaiApiKey: text("openai_api_key"),
  openaiModel: text("openai_model"),
  anthropicApiKey: text("anthropic_api_key"),
  anthropicModel: text("anthropic_model"),
  googleApiKey: text("google_api_key"),
  googleModel: text("google_model"),
  grokApiKey: text("grok_api_key"),
  grokModel: text("grok_model"),
  perplexityApiKey: text("perplexity_api_key"),
  perplexityModel: text("perplexity_model"),

  // Voice/style settings for AI content generation
  samplePosts: text("sample_posts"), // JSON array of sample posts for voice matching
  neverMention: text("never_mention"), // Topics/words AI should never mention
  businessDescription: text("business_description"), // User's business/role description
  targetAudience: text("target_audience"), // Who they're writing for
  writingTone: text("writing_tone"), // e.g., "professional", "casual", "witty"

  // Image generation API keys (encrypted, BYOK) - per-provider storage
  imageProvider: text("image_provider"), // Currently selected: "google", "openai", "replicate"
  // Per-provider image settings (API key + model + settings)
  // Google AI
  googleImageApiKey: text("google_image_api_key"),
  googleImageModel: text("google_image_model"),
  googleImageResolution: text("google_image_resolution"),
  googleImageAspectRatio: text("google_image_aspect_ratio"),
  // OpenAI
  openaiImageApiKey: text("openai_image_api_key"),
  openaiImageModel: text("openai_image_model"),
  openaiImageResolution: text("openai_image_resolution"),
  openaiImageQuality: text("openai_image_quality"),
  openaiImageStyle: text("openai_image_style"),
  // Replicate
  replicateImageApiKey: text("replicate_image_api_key"),
  replicateImageModel: text("replicate_image_model"),
  replicateImageResolution: text("replicate_image_resolution"),
  replicateImageAspectRatio: text("replicate_image_aspect_ratio"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),

  // Custom branding (Business plan)
  brandLogoUrl: text("brand_logo_url"),
  brandPrimaryColor: text("brand_primary_color"), // hex color
  brandSecondaryColor: text("brand_secondary_color"), // hex color
  brandFontFamily: text("brand_font_family"),
});

// Sessions table for NextAuth
export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// Accounts table for OAuth providers
export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

// Verification tokens for email verification
export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Posts table
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "scheduled", "published", "failed"] }).default("draft"),
  postType: text("post_type", { enum: ["text", "image", "carousel", "video"] }).default("text"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  linkedinPostId: text("linkedin_post_id"),
  linkedinPostUrl: text("linkedin_post_url"),
  // Store metadata like formatting options, hashtags, etc.
  metadata: text("metadata"), // JSON string
  // Error message if publishing failed
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

// Media table for images, carousels, videos
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id")
    .references(() => posts.id, { onDelete: "cascade" }),
  // Storage info
  storageKey: text("storage_key").notNull(), // R2 object key
  storageUrl: text("storage_url").notNull(), // Public URL
  // File info
  fileName: text("file_name"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size"), // bytes
  width: integer("width"),
  height: integer("height"),
  // For carousels - order of slides
  sortOrder: integer("sort_order").default(0),
  // Metadata like alt text, captions
  altText: text("alt_text"),
  caption: text("caption"),
  // Status
  status: text("status", { enum: ["uploading", "ready", "deleted"] }).default("uploading"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Ideas table
export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  source: text("source"), // e.g., "reddit", "manual", "ai"
  sourceUrl: text("source_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Waitlist table for pre-launch email capture
export const waitlist = sqliteTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  status: text("status", { enum: ["pending", "invited", "converted"] }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Password reset tokens table
// Note: We store a hash of the token, not the token itself
// This way if the DB is breached, tokens can't be used directly
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(), // SHA-256 hash of the token
  expires: integer("expires", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// ============================================
// BUSINESS PLAN FEATURES
// ============================================

// A/B Testing table
export const abTests = sqliteTable("ab_tests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", { enum: ["draft", "running", "paused", "completed"] }).default("draft"),
  variantAContent: text("variant_a_content").notNull(),
  variantBContent: text("variant_b_content").notNull(),
  variantAPostId: text("variant_a_post_id").references(() => posts.id),
  variantBPostId: text("variant_b_post_id").references(() => posts.id),
  winningVariant: text("winning_variant", { enum: ["a", "b"] }),
  startedAt: integer("started_at", { mode: "timestamp" }),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Teams table
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Team members table
export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "admin", "member"] }).default("member"),
  invitedAt: integer("invited_at", { mode: "timestamp" }).default(new Date()),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
});

// Team invites table
export const teamInvites = sqliteTable("team_invites", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "member"] }).default("member"),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// API keys table
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(), // SHA-256 of the key
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification
  scopes: text("scopes"), // JSON array: ["posts:read", "posts:write", etc.]
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// API logs table
export const apiLogs = sqliteTable("api_logs", {
  id: text("id").primaryKey(),
  apiKeyId: text("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // ms
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Post analytics table (for advanced analytics)
export const postAnalytics = sqliteTable("post_analytics", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  impressions: integer("impressions").default(0),
  reactions: integer("reactions").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  clicks: integer("clicks").default(0),
  engagementRate: text("engagement_rate"), // stored as decimal string
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// ============================================
// ENGAGEMENT TRACKING
// ============================================

// Daily engagement actions tracking
export const engagementActions = sqliteTable("engagement_actions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["like", "comment"] }).notNull(),
  linkedinPostId: text("linkedin_post_id"), // The LinkedIn post URN that was liked/commented
  commentContent: text("comment_content"), // If type is comment, store the comment text
  date: text("date").notNull(), // YYYY-MM-DD format for easy daily grouping
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// User engagement objectives (settings)
export const engagementObjectives = sqliteTable("engagement_objectives", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  dailyLikes: integer("daily_likes").default(10),
  dailyComments: integer("daily_comments").default(5),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

// ============================================
// ADMIN FEATURES
// ============================================

// Cookie consent tracking table
export const cookieConsents = sqliteTable("cookie_consents", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(), // Anonymous visitor identifier
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }), // Optional if user is logged in
  // Consent choices
  necessary: integer("necessary", { mode: "boolean" }).default(true), // Always true
  analytics: integer("analytics", { mode: "boolean" }).default(false),
  marketing: integer("marketing", { mode: "boolean" }).default(false),
  // Status
  status: text("status", { enum: ["accepted_all", "rejected_all", "customized"] }).notNull(),
  // Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  country: text("country"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

// Data removal requests table
export const dataRemovalRequests = sqliteTable("data_removal_requests", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status", { enum: ["pending", "processing", "completed", "rejected"] }).default("pending"),
  reason: text("reason"), // Optional reason from user
  adminNotes: text("admin_notes"), // Admin notes about the request
  processedAt: integer("processed_at", { mode: "timestamp" }),
  processedBy: text("processed_by").references(() => users.id), // Admin who processed it
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type AbTest = typeof abTests.$inferSelect;
export type NewAbTest = typeof abTests.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamInvite = typeof teamInvites.$inferSelect;
export type NewTeamInvite = typeof teamInvites.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiLog = typeof apiLogs.$inferSelect;
export type NewApiLog = typeof apiLogs.$inferInsert;
export type PostAnalytics = typeof postAnalytics.$inferSelect;
export type NewPostAnalytics = typeof postAnalytics.$inferInsert;
export type EngagementAction = typeof engagementActions.$inferSelect;
export type NewEngagementAction = typeof engagementActions.$inferInsert;
export type EngagementObjective = typeof engagementObjectives.$inferSelect;
export type NewEngagementObjective = typeof engagementObjectives.$inferInsert;
export type CookieConsent = typeof cookieConsents.$inferSelect;
export type NewCookieConsent = typeof cookieConsents.$inferInsert;
export type DataRemovalRequest = typeof dataRemovalRequests.$inferSelect;
export type NewDataRemovalRequest = typeof dataRemovalRequests.$inferInsert;
