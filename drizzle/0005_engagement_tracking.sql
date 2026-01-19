-- Engagement tracking tables for daily likes/comments goals
CREATE TABLE `engagement_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`linkedin_post_id` text,
	`comment_content` text,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `engagement_objectives` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_likes` integer DEFAULT 10,
	`daily_comments` integer DEFAULT 5,
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `engagement_objectives_user_id_unique` ON `engagement_objectives` (`user_id`);
--> statement-breakpoint
CREATE INDEX `engagement_actions_user_date_idx` ON `engagement_actions` (`user_id`, `date`);
--> statement-breakpoint
CREATE INDEX `engagement_actions_user_type_date_idx` ON `engagement_actions` (`user_id`, `type`, `date`);
