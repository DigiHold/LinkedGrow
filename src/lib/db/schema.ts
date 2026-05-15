import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  password: text("password"), // Hashed password for credentials auth
  passwordChangedAt: text("password_changed_at"), // ISO timestamp - invalidates JWTs issued before this time

  // 2FA fields
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
  twoFactorSecret: text("two_factor_secret"),

  // Admin flag
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),

  // Subscription fields
  plan: text("plan", { enum: ["free", "starter", "pro", "business"] }).default("free"),
  isLifetimeDeal: integer("is_lifetime_deal", { mode: "boolean" }).default(false),
  // 7-day Pro trial lifecycle
  trialStartedAt: integer("trial_started_at", { mode: "timestamp" }),
  trialEndedAt: integer("trial_ended_at", { mode: "timestamp" }),
  hasUsedTrial: integer("has_used_trial", { mode: "boolean" }).default(false),
  ltdSource: text("ltd_source", { enum: ["stripe", "dealify", "dealmirror", "dealfuel"] }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  billingInterval: text("billing_interval", { enum: ["month", "year"] }),
  couponCode: text("coupon_code"), // Stored coupon code (e.g., "WELCOME10" for 10% off 3 months)
  referredBy: text("referred_by"), // Affiliate referral code that referred this user

  // LinkedIn connection
  linkedinAccessToken: text("linkedin_access_token"),
  linkedinRefreshToken: text("linkedin_refresh_token"),
  linkedinTokenExpiry: integer("linkedin_token_expiry", { mode: "timestamp" }),
  linkedinProfileId: text("linkedin_profile_id"),
  linkedinMemberId: text("linkedin_member_id"),
  linkedinProfileName: text("linkedin_profile_name"),
  linkedinHeadline: text("linkedin_headline"), // User's headline from r_basicprofile
  linkedinVanityName: text("linkedin_vanity_name"), // User's vanity name (e.g., "nicolas-lecocq")

  // LinkedIn posting target selection
  linkedinPostingTarget: text("linkedin_posting_target", { enum: ["profile", "organization"] }).default("profile"),
  linkedinSelectedOrgId: text("linkedin_selected_org_id"), // Organization URN ID if posting to company page
  linkedinSelectedOrgName: text("linkedin_selected_org_name"), // Organization name for display
  linkedinOrganizations: text("linkedin_organizations"), // JSON array of administered organizations [{id, name, logoUrl}]

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
  kimiApiKey: text("kimi_api_key"),
  kimiModel: text("kimi_model"),

  // Voice/style settings for AI content generation
  samplePosts: text("sample_posts"), // JSON array of sample posts for voice matching
  neverMention: text("never_mention"), // Topics/words AI should never mention
  businessDescription: text("business_description"), // Composite field for AI prompts (auto-built from fields below)
  businessName: text("business_name"), // Company or personal brand name
  businessNiche: text("business_niche"), // Industry / niche
  businessProducts: text("business_products"), // Products or services offered
  businessTopics: text("business_topics"), // Key topics for content
  businessContext: text("business_context"), // Additional context / FAQ
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
  brandColors: text("brand_colors"), // JSON array of hex strings e.g. '["#ff0000","#0891b2"]'

  // Timezone (for scheduling posts)
  timezone: text("timezone"), // IANA timezone (e.g., "America/Los_Angeles", "Europe/Paris")

  // Content generation language (overrides any language in samples/context)
  contentLanguage: text("content_language").default("en"),

  // Free plan usage counter (resets monthly via generations_period YYYY-MM)
  generationsUsed: integer("generations_used").default(0),
  generationsPeriod: text("generations_period"),

  // Publishing preferences
  autoLikeAfterPublish: integer("auto_like_after_publish", { mode: "boolean" }).default(true),

  // Onboarding
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false),
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
  linkedinImageUrl: text("linkedin_image_url"), // R2 URL of the post's image (synced from LinkedIn)
  syncedFromLinkedin: integer("synced_from_linkedin", { mode: "boolean" }).default(false),
  // QStash message ID for scheduled posts (used to cancel/reschedule)
  qstashMessageId: text("qstash_message_id"),
  // First comment to auto-post after publication (1-5 min delay)
  firstComment: text("first_comment"),
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

// Beta users table - separate from waitlist, for beta testers who get free business plan
export const betaUsers = sqliteTable("beta_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  converted: integer("converted", { mode: "boolean" }).default(false), // True when user signs up
  convertedAt: integer("converted_at", { mode: "timestamp" }), // When they signed up
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
  // Variant A stats
  variantAImpressions: integer("variant_a_impressions").default(0),
  variantAReactions: integer("variant_a_reactions").default(0),
  variantAComments: integer("variant_a_comments").default(0),
  variantAShares: integer("variant_a_shares").default(0),
  // Variant B stats
  variantBImpressions: integer("variant_b_impressions").default(0),
  variantBReactions: integer("variant_b_reactions").default(0),
  variantBComments: integer("variant_b_comments").default(0),
  variantBShares: integer("variant_b_shares").default(0),
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
  notifyOnCompanyPost: integer("notify_on_company_post", { mode: "boolean" }).default(true),
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
  commentContent: text("comment_content"),
  reactionType: text("reaction_type").default("LIKE"), // LIKE, PRAISE, APPRECIATION, EMPATHY, INTEREST, ENTERTAINMENT
  date: text("date").notNull(),
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
  postsPerProfile: integer("posts_per_profile").default(2),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

// ============================================
// NETWORK NOTIFICATIONS
// ============================================

export const networkNotificationGroups = sqliteTable("network_notification_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

export const networkNotificationMembers = sqliteTable("network_notification_members", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => networkNotificationGroups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  status: text("status", { enum: ["invited", "accepted", "declined"] }).default("invited"),
  inviteToken: text("invite_token").unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
});

export const networkNotificationPosts = sqliteTable("network_notification_posts", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => networkNotificationGroups.id, { onDelete: "cascade" }),
  postId: text("post_id")
    .references(() => posts.id, { onDelete: "cascade" }),
  linkedinPostId: text("linkedin_post_id").notNull(),
  publishedByUserId: text("published_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postContent: text("post_content").notNull(),
  notifiedAt: integer("notified_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// ============================================
// ABANDONED CART RECOVERY
// ============================================

// Track abandoned checkout sessions for email recovery sequence
export const abandonedCheckouts = sqliteTable("abandoned_checkouts", {
  id: text("id").primaryKey(),
  // User info
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  // Stripe info
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  planId: text("plan_id", { enum: ["starter", "pro", "business"] }).notNull(),
  recoveryUrl: text("recovery_url"), // Stripe recovery URL (valid for 30 days)
  recoveryUrlExpiresAt: integer("recovery_url_expires_at", { mode: "timestamp" }),
  // Status
  status: text("status", { enum: ["pending", "recovered", "expired", "unsubscribed"] }).default("pending"),
  recoveredAt: integer("recovered_at", { mode: "timestamp" }), // When they completed checkout
  // Timestamps
  abandonedAt: integer("abandoned_at", { mode: "timestamp" }).notNull(), // When checkout session expired
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
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

// User saved carousel templates
export const userTemplates = sqliteTable("user_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"), // Base64 or URL to thumbnail image
  canvasJson: text("canvas_json").notNull(), // Fabric.js canvas JSON
  category: text("category").default("custom"), // custom, or copied from template category
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

// User saved carousels (multi-slide)
export const savedCarousels = sqliteTable("saved_carousels", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"), // Base64 data URL of first slide preview
  slidesJson: text("slides_json").notNull(), // JSON array of all slides with their Fabric.js canvas data
  slideCount: integer("slide_count").default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

// ============================================
// BLOG
// ============================================

// Blog comments table
export const blogComments = sqliteTable("blog_comments", {
  id: text("id").primaryKey(),
  blogSlug: text("blog_slug").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  isApproved: integer("is_approved", { mode: "boolean" }).default(false),
  parentId: text("parent_id"),
  isTeam: integer("is_team", { mode: "boolean" }).default(false),
  createdAt: text("created_at"),
});

// ============================================
// AFFILIATE PROGRAM
// ============================================

// Affiliates table - partners who earn commission
export const affiliates = sqliteTable("affiliates", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  referralCode: text("referral_code").notNull().unique(),
  status: text("status", { enum: ["pending", "approved", "rejected", "suspended"] }).default("pending"),
  promotionPlan: text("promotion_plan"), // How they plan to promote LinkedGrow
  paypalEmail: text("paypal_email"),
  totalClicks: integer("total_clicks").default(0),
  totalSignups: integer("total_signups").default(0),
  totalConversions: integer("total_conversions").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

// Affiliate referrals - users who signed up via an affiliate link
export const affiliateReferrals = sqliteTable("affiliate_referrals", {
  id: text("id").primaryKey(),
  affiliateId: text("affiliate_id")
    .notNull()
    .references(() => affiliates.id, { onDelete: "cascade" }),
  referredUserId: text("referred_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["signed_up", "converted", "churned"] }).default("signed_up"),
  convertedAt: integer("converted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Affiliate commissions - earnings per invoice payment (actual amount paid)
export const affiliateCommissions = sqliteTable("affiliate_commissions", {
  id: text("id").primaryKey(),
  affiliateId: text("affiliate_id")
    .notNull()
    .references(() => affiliates.id, { onDelete: "cascade" }),
  referralId: text("referral_id")
    .notNull()
    .references(() => affiliateReferrals.id, { onDelete: "cascade" }),
  stripeInvoiceId: text("stripe_invoice_id").notNull(),
  invoiceAmount: integer("invoice_amount").notNull(), // cents - actual amount paid after discounts
  commissionAmount: integer("commission_amount").notNull(), // cents (30% of invoiceAmount)
  commissionRate: integer("commission_rate").default(30),
  availableAt: integer("available_at", { mode: "timestamp" }).notNull(), // 30 days after payment
  paidOut: integer("paid_out", { mode: "boolean" }).default(false),
  paidOutAt: integer("paid_out_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

// Affiliate payouts - manual PayPal payouts
export const affiliatePayouts = sqliteTable("affiliate_payouts", {
  id: text("id").primaryKey(),
  affiliateId: text("affiliate_id")
    .notNull()
    .references(() => affiliates.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // cents
  method: text("method").default("paypal"),
  paypalEmail: text("paypal_email").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
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
export type UserTemplate = typeof userTemplates.$inferSelect;
export type NewUserTemplate = typeof userTemplates.$inferInsert;
export type SavedCarousel = typeof savedCarousels.$inferSelect;
export type NewSavedCarousel = typeof savedCarousels.$inferInsert;
export type EngagementObjective = typeof engagementObjectives.$inferSelect;
export type NewEngagementObjective = typeof engagementObjectives.$inferInsert;
export type CookieConsent = typeof cookieConsents.$inferSelect;
export type NewCookieConsent = typeof cookieConsents.$inferInsert;
export type DataRemovalRequest = typeof dataRemovalRequests.$inferSelect;
export type NewDataRemovalRequest = typeof dataRemovalRequests.$inferInsert;
export type BetaUser = typeof betaUsers.$inferSelect;
export type NewBetaUser = typeof betaUsers.$inferInsert;
export type AbandonedCheckout = typeof abandonedCheckouts.$inferSelect;
export type NewAbandonedCheckout = typeof abandonedCheckouts.$inferInsert;
export type BlogComment = typeof blogComments.$inferSelect;
export type NewBlogComment = typeof blogComments.$inferInsert;

// Blog post status tracking (content stays in static page.tsx files)
export const blogPosts = sqliteTable("blog_posts", {
  slug: text("slug").primaryKey(),
  status: text("status", { enum: ["draft", "scheduled", "published"] }).default("draft").notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  qstashMessageId: text("qstash_message_id"),
  // Cross-posting (canonical points back to linkedgrow.ai)
  devtoUrl: text("devto_url"),
  devtoId: text("devto_id"),
  hashnodeUrl: text("hashnode_url"),
  hashnodeId: text("hashnode_id"),
  crossPostedAt: integer("cross_posted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export type BlogPostStatus = typeof blogPosts.$inferSelect;
export type NewBlogPostStatus = typeof blogPosts.$inferInsert;

// Docs feedback
export const docsFeedback = sqliteTable("docs_feedback", {
  id: text("id").primaryKey(),
  articleSlug: text("article_slug").notNull(),
  categorySlug: text("category_slug").notNull(),
  helpful: integer("helpful", { mode: "boolean" }).notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

export type DocsFeedback = typeof docsFeedback.$inferSelect;
export type NewDocsFeedback = typeof docsFeedback.$inferInsert;

// ============================================
// REDEMPTION CODES (marketplace LTDs)
// ============================================

export const redemptionCodes = sqliteTable("redemption_codes", {
  code: text("code").primaryKey(),
  batch: text("batch").notNull(),
  source: text("source", { enum: ["dealify", "dealmirror", "dealfuel"] }).notNull(),
  plan: text("plan", { enum: ["business"] }).notNull().default("business"),
  status: text("status", { enum: ["unused", "redeemed", "revoked"] }).notNull().default("unused"),
  redeemedBy: text("redeemed_by").references(() => users.id, { onDelete: "set null" }),
  redeemedAt: integer("redeemed_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type RedemptionCode = typeof redemptionCodes.$inferSelect;
export type NewRedemptionCode = typeof redemptionCodes.$inferInsert;

// ============================================
// SUPPORT TICKETS
// ============================================

export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  category: text("category", {
    enum: ["billing", "bug", "feature_request", "account", "other"],
  })
    .notNull()
    .default("other"),
  status: text("status", {
    enum: ["open", "in_progress", "resolved", "closed"],
  })
    .notNull()
    .default("open"),
  priority: text("priority", { enum: ["low", "normal", "high"] })
    .notNull()
    .default("normal"),
  // Tracks the source so chatbot-originated tickets can be distinguished from
  // dashboard-originated ones in the admin view.
  source: text("source", { enum: ["dashboard", "chatbot"] })
    .notNull()
    .default("dashboard"),
  // Set when the admin sends a review-request after resolving. Used to hide
  // the "Send review request" button on subsequent admin views (one ask per
  // ticket - we don't want to spam happy customers).
  reviewRequestSentAt: integer("review_request_sent_at", { mode: "timestamp" }),
  // Activity tracking - drives the 14-day auto-close cron and unread badges.
  lastUserReplyAt: integer("last_user_reply_at", { mode: "timestamp" }),
  lastAdminReplyAt: integer("last_admin_reply_at", { mode: "timestamp" }),
  hasUnreadForUser: integer("has_unread_for_user", { mode: "boolean" })
    .notNull()
    .default(false),
  hasUnreadForAdmin: integer("has_unread_for_admin", { mode: "boolean" })
    .notNull()
    .default(true),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const supportMessages = sqliteTable("support_messages", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  // senderId can be null for system messages (e.g. the auto-close template).
  senderId: text("sender_id").references(() => users.id, {
    onDelete: "set null",
  }),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  // System messages are admin-side templated messages (auto-close, review
  // request, thank-you) - rendered with a different style on the frontend.
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  // Drives the frontend renderer:
  //   text             -> plain prose (default for both user + admin replies)
  //   review_request   -> renders the 3 brand logo cards inline
  //   thank_you        -> renders a thank-you panel with "Open another" CTA
  //   auto_close       -> renders the 14-day auto-close notice
  kind: text("kind", { enum: ["text", "review_request", "thank_you", "auto_close"] })
    .notNull()
    .default("text"),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type NewSupportMessage = typeof supportMessages.$inferInsert;
export type Affiliate = typeof affiliates.$inferSelect;
export type NewAffiliate = typeof affiliates.$inferInsert;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type NewAffiliateReferral = typeof affiliateReferrals.$inferInsert;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type NewAffiliateCommission = typeof affiliateCommissions.$inferInsert;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type NewAffiliatePayout = typeof affiliatePayouts.$inferInsert;
