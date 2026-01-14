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

  // LinkedIn connection
  linkedinAccessToken: text("linkedin_access_token"),
  linkedinRefreshToken: text("linkedin_refresh_token"),
  linkedinTokenExpiry: integer("linkedin_token_expiry", { mode: "timestamp" }),
  linkedinProfileId: text("linkedin_profile_id"),
  linkedinProfileName: text("linkedin_profile_name"),

  // AI API keys (encrypted)
  aiProvider: text("ai_provider"),
  aiApiKey: text("ai_api_key"), // Should be encrypted in production

  // Image generation API keys (encrypted, BYOK)
  imageProvider: text("image_provider"), // "gemini-image", "openai-dalle"
  imageApiKey: text("image_api_key"), // User's own API key, encrypted

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
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
