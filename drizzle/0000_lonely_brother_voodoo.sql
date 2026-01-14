CREATE TABLE `accounts` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `provider_account_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`source` text,
	`source_url` text,
	`created_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media` (
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
	`created_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`used` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `posts` (
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
	`created_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"',
	`updated_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
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
	`linkedin_access_token` text,
	`linkedin_refresh_token` text,
	`linkedin_token_expiry` integer,
	`linkedin_profile_id` text,
	`linkedin_profile_name` text,
	`ai_provider` text,
	`ai_api_key` text,
	`created_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"',
	`updated_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`status` text DEFAULT 'pending',
	`created_at` integer DEFAULT '"2026-01-14T19:47:05.024Z"'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_unique` ON `waitlist` (`email`);