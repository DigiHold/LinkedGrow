CREATE TABLE `ab_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'draft',
	`variant_a_content` text NOT NULL,
	`variant_b_content` text NOT NULL,
	`variant_a_post_id` text,
	`variant_b_post_id` text,
	`winning_variant` text,
	`started_at` integer,
	`ended_at` integer,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_a_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_b_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`key_prefix` text NOT NULL,
	`scopes` text,
	`last_used_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `api_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`api_key_id` text,
	`user_id` text,
	`endpoint` text NOT NULL,
	`method` text NOT NULL,
	`status_code` integer,
	`response_time` integer,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`date` integer NOT NULL,
	`impressions` integer DEFAULT 0,
	`reactions` integer DEFAULT 0,
	`comments` integer DEFAULT 0,
	`shares` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`engagement_rate` text,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member',
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_invites_token_unique` ON `team_invites` (`token`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member',
	`invited_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	`accepted_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`source` text,
	`source_url` text,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ideas`("id", "user_id", "title", "content", "source", "source_url", "created_at") SELECT "id", "user_id", "title", "content", "source", "source_url", "created_at" FROM `ideas`;--> statement-breakpoint
DROP TABLE `ideas`;--> statement-breakpoint
ALTER TABLE `__new_ideas` RENAME TO `ideas`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_media` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`post_id` text,
	`storage_key` text NOT NULL,
	`storage_url` text NOT NULL,
	`file_name` text,
	`mime_type` text NOT NULL,
	`file_size` integer,
	`width` integer,
	`height` integer,
	`sort_order` integer DEFAULT 0,
	`alt_text` text,
	`caption` text,
	`status` text DEFAULT 'uploading',
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_media`("id", "user_id", "post_id", "storage_key", "storage_url", "file_name", "mime_type", "file_size", "width", "height", "sort_order", "alt_text", "caption", "status", "created_at") SELECT "id", "user_id", "post_id", "storage_key", "storage_url", "file_name", "mime_type", "file_size", "width", "height", "sort_order", "alt_text", "caption", "status", "created_at" FROM `media`;--> statement-breakpoint
DROP TABLE `media`;--> statement-breakpoint
ALTER TABLE `__new_media` RENAME TO `media`;--> statement-breakpoint
CREATE TABLE `__new_password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`used` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_password_reset_tokens`("id", "user_id", "token_hash", "expires", "used", "created_at") SELECT "id", "user_id", "token_hash", "expires", "used", "created_at" FROM `password_reset_tokens`;--> statement-breakpoint
DROP TABLE `password_reset_tokens`;--> statement-breakpoint
ALTER TABLE `__new_password_reset_tokens` RENAME TO `password_reset_tokens`;--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft',
	`post_type` text DEFAULT 'text',
	`scheduled_at` integer,
	`published_at` integer,
	`linkedin_post_id` text,
	`linkedin_post_url` text,
	`metadata` text,
	`error_message` text,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	`updated_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "user_id", "content", "status", "post_type", "scheduled_at", "published_at", "linkedin_post_id", "linkedin_post_url", "metadata", "error_message", "created_at", "updated_at") SELECT "id", "user_id", "content", "status", "post_type", "scheduled_at", "published_at", "linkedin_post_id", "linkedin_post_url", "metadata", "error_message", "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer,
	`image` text,
	`password` text,
	`two_factor_enabled` integer DEFAULT false,
	`two_factor_secret` text,
	`is_admin` integer DEFAULT false,
	`plan` text DEFAULT 'free',
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`coupon_code` text,
	`linkedin_access_token` text,
	`linkedin_refresh_token` text,
	`linkedin_token_expiry` integer,
	`linkedin_profile_id` text,
	`linkedin_profile_name` text,
	`linkedin_posting_target` text DEFAULT 'profile',
	`linkedin_selected_org_id` text,
	`linkedin_selected_org_name` text,
	`linkedin_organizations` text,
	`linkedin_community_access_token` text,
	`linkedin_community_refresh_token` text,
	`linkedin_community_token_expiry` integer,
	`ai_provider` text,
	`ai_api_key` text,
	`ai_model` text,
	`sample_posts` text,
	`never_mention` text,
	`business_description` text,
	`target_audience` text,
	`writing_tone` text,
	`image_provider` text,
	`image_api_key` text,
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.092Z"',
	`updated_at` integer DEFAULT '"2026-01-17T16:09:27.092Z"',
	`brand_logo_url` text,
	`brand_primary_color` text,
	`brand_secondary_color` text,
	`brand_font_family` text
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "email_verified", "image", "password", "two_factor_enabled", "two_factor_secret", "is_admin", "plan", "stripe_customer_id", "stripe_subscription_id", "coupon_code", "linkedin_access_token", "linkedin_refresh_token", "linkedin_token_expiry", "linkedin_profile_id", "linkedin_profile_name", "linkedin_posting_target", "linkedin_selected_org_id", "linkedin_selected_org_name", "linkedin_organizations", "linkedin_community_access_token", "linkedin_community_refresh_token", "linkedin_community_token_expiry", "ai_provider", "ai_api_key", "ai_model", "sample_posts", "never_mention", "business_description", "target_audience", "writing_tone", "image_provider", "image_api_key", "created_at", "updated_at", "brand_logo_url", "brand_primary_color", "brand_secondary_color", "brand_font_family") SELECT "id", "name", "email", "email_verified", "image", "password", "two_factor_enabled", "two_factor_secret", "is_admin", "plan", "stripe_customer_id", "stripe_subscription_id", "coupon_code", "linkedin_access_token", "linkedin_refresh_token", "linkedin_token_expiry", "linkedin_profile_id", "linkedin_profile_name", "linkedin_posting_target", "linkedin_selected_org_id", "linkedin_selected_org_name", "linkedin_organizations", "linkedin_community_access_token", "linkedin_community_refresh_token", "linkedin_community_token_expiry", "ai_provider", "ai_api_key", "ai_model", "sample_posts", "never_mention", "business_description", "target_audience", "writing_tone", "image_provider", "image_api_key", "created_at", "updated_at", "brand_logo_url", "brand_primary_color", "brand_secondary_color", "brand_font_family" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`status` text DEFAULT 'pending',
	`created_at` integer DEFAULT '"2026-01-17T16:09:27.093Z"'
);
--> statement-breakpoint
INSERT INTO `__new_waitlist`("id", "email", "name", "status", "created_at") SELECT "id", "email", "name", "status", "created_at" FROM `waitlist`;--> statement-breakpoint
DROP TABLE `waitlist`;--> statement-breakpoint
ALTER TABLE `__new_waitlist` RENAME TO `waitlist`;--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_unique` ON `waitlist` (`email`);