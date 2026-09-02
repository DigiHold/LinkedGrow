-- LinkedGrow initial schema. Generated 2026-09-02 from the live database DDL (54 tables, 33 indexes).
-- Applied once by the migration runner; every later change is a numbered file next to this one.
CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ab_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  variant_a_content TEXT NOT NULL,
  variant_b_content TEXT NOT NULL,
  variant_a_post_id TEXT REFERENCES posts(id),
  variant_b_post_id TEXT REFERENCES posts(id),
  winning_variant TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
, variant_a_impressions INTEGER DEFAULT 0, variant_a_reactions INTEGER DEFAULT 0, variant_a_comments INTEGER DEFAULT 0, variant_a_shares INTEGER DEFAULT 0, variant_b_impressions INTEGER DEFAULT 0, variant_b_reactions INTEGER DEFAULT 0, variant_b_comments INTEGER DEFAULT 0, variant_b_shares INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS abandoned_checkouts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  stripe_session_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL CHECK(plan_id IN ('starter', 'pro', 'business')),
  recovery_url TEXT,
  recovery_url_expires_at INTEGER,
  email1_sent_at INTEGER,
  email2_sent_at INTEGER,
  email3_sent_at INTEGER,
  email1_qstash_id TEXT,
  email2_qstash_id TEXT,
  email3_qstash_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'recovered', 'expired', 'unsubscribed')),
  recovered_at INTEGER,
  abandoned_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS account_followers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  linkedin_account_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  count INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS account_reading (
     linkedin_account_id TEXT NOT NULL,
     day TEXT NOT NULL,
     profiles INTEGER NOT NULL DEFAULT 0,
     searches INTEGER NOT NULL DEFAULT 0,
     updated_at INTEGER,
     PRIMARY KEY (linkedin_account_id, day)
   );
CREATE TABLE IF NOT EXISTS `accounts` (
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
CREATE TABLE IF NOT EXISTS affiliate_commissions (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL REFERENCES affiliates(id), referral_id TEXT NOT NULL REFERENCES affiliate_referrals(id), stripe_invoice_id TEXT NOT NULL, invoice_amount INTEGER NOT NULL, commission_amount INTEGER NOT NULL, commission_rate INTEGER NOT NULL DEFAULT 30, available_at INTEGER NOT NULL, paid_out INTEGER NOT NULL DEFAULT 0, paid_out_at INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS affiliate_payouts (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL REFERENCES affiliates(id), amount INTEGER NOT NULL, method TEXT NOT NULL DEFAULT 'paypal', paypal_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', notes TEXT, created_at INTEGER NOT NULL, completed_at INTEGER);
CREATE TABLE IF NOT EXISTS affiliate_referrals (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL REFERENCES affiliates(id), referred_user_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'signed_up', converted_at INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS affiliates (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES users(id), referral_code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending', promotion_plan TEXT, paypal_email TEXT, total_clicks INTEGER NOT NULL DEFAULT 0, total_signups INTEGER NOT NULL DEFAULT 0, total_conversions INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS agent_actions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  linkedin_account_id TEXT NOT NULL REFERENCES linkedin_accounts(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES agent_leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_activity (
  agent_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  verb TEXT NOT NULL,
  subject_name TEXT,
  subject_avatar TEXT,
  subject_url TEXT,
  detail TEXT,
  started_at INTEGER NOT NULL
, beat_at INTEGER);
CREATE TABLE IF NOT EXISTS agent_ai_usage (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  purpose TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  created_at INTEGER NOT NULL
, linkedin_account_id TEXT);
CREATE TABLE IF NOT EXISTS agent_drafts (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL UNIQUE, created_by TEXT NOT NULL, name TEXT, config TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS agent_events (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  lead_id      TEXT REFERENCES agent_leads(id) ON DELETE SET NULL,
  type         TEXT NOT NULL,
  message      TEXT NOT NULL,
  created_at   INTEGER NOT NULL
, notified_at INTEGER);
CREATE TABLE IF NOT EXISTS agent_leads (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id        TEXT REFERENCES agents(id) ON DELETE SET NULL,
  source_id       TEXT REFERENCES agent_sources(id) ON DELETE SET NULL,
  profile_id      TEXT NOT NULL,
  profile_url     TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  headline        TEXT,
  job_title       TEXT,
  company         TEXT,
  location        TEXT,
  avatar_url      TEXT,
  match_score     INTEGER,
  match_reason    TEXT,
  signal_type     TEXT,
  signal_text     TEXT,
  signal_url      TEXT,
  signal_author   TEXT,
  step            TEXT NOT NULL DEFAULT 'found',
  step_at         INTEGER,
  found_at        INTEGER NOT NULL,
  rejected_at     INTEGER,
  excluded_reason TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
, sequence_status TEXT NOT NULL DEFAULT 'queued', angle TEXT, first_name TEXT, assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL, assigned_at INTEGER, reply_intent TEXT, signal_hits INTEGER NOT NULL DEFAULT 1, signal_kinds TEXT, outcome TEXT, outcome_at INTEGER);
CREATE TABLE IF NOT EXISTS agent_messages (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  lead_id      TEXT NOT NULL REFERENCES agent_leads(id) ON DELETE CASCADE,
  direction    TEXT NOT NULL,
  step         TEXT,
  body         TEXT NOT NULL,
  sent_at      INTEGER NOT NULL,
  read_at      INTEGER,
  created_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_meta (
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (agent_id, key)
);
CREATE TABLE IF NOT EXISTS agent_queue (
  id             TEXT PRIMARY KEY,
  workspace_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  lead_id        TEXT NOT NULL REFERENCES agent_leads(id) ON DELETE CASCADE,
  action         TEXT NOT NULL,
  scheduled_at   INTEGER NOT NULL,
  message_body   TEXT,
  state          TEXT NOT NULL DEFAULT 'pending',
  approved_at    INTEGER,
  sent_at        INTEGER,
  failure_reason TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_sources (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id      TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  label         TEXT NOT NULL,
  config        TEXT,
  enabled       INTEGER NOT NULL DEFAULT 1,
  leads_found   INTEGER NOT NULL DEFAULT 0,
  contacted     INTEGER NOT NULL DEFAULT 0,
  accepted      INTEGER NOT NULL DEFAULT 0,
  replied       INTEGER NOT NULL DEFAULT 0,
  last_mined_at INTEGER,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
, good_leads INTEGER NOT NULL DEFAULT 0, passes INTEGER NOT NULL DEFAULT 0, origin TEXT NOT NULL DEFAULT 'customer', parent_id TEXT, retired_at INTEGER, retired_reason TEXT);
CREATE TABLE IF NOT EXISTS agent_style_samples (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_account_id TEXT NOT NULL REFERENCES linkedin_accounts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  captured_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS agents (
  id                   TEXT PRIMARY KEY,
  workspace_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_account_id  TEXT NOT NULL REFERENCES linkedin_accounts(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'paused',
  paused_reason        TEXT,
  icp_summary          TEXT,
  job_roles            TEXT,
  industries           TEXT,
  locations            TEXT,
  company_sizes        TEXT,
  match_level          TEXT NOT NULL DEFAULT 'balanced',
  goal                 TEXT NOT NULL DEFAULT 'conversations',
  tone                 TEXT NOT NULL DEFAULT 'conversational',
  company_info         TEXT,
  sequence             TEXT,
  skip_connected       INTEGER NOT NULL DEFAULT 1,
  review_mode          INTEGER NOT NULL DEFAULT 0,
  smart_lead_finder    INTEGER NOT NULL DEFAULT 1,
  timezone             TEXT NOT NULL DEFAULT 'Europe/Zurich',
  workday_start        INTEGER NOT NULL DEFAULT 540,
  workday_end          INTEGER NOT NULL DEFAULT 1080,
  last_run_at          INTEGER,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
, website TEXT, derived_targeting TEXT, observe_only INTEGER NOT NULL DEFAULT 0, test_recipients TEXT, workday_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]', warmup_start_per_day INTEGER, warmup_increment_per_week INTEGER, warmup_weeks INTEGER, memory TEXT, memory_rev INTEGER NOT NULL DEFAULT 0, memory_at INTEGER);
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT,
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS api_logs (
  id TEXT PRIMARY KEY,
  api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS beta_users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT, converted INTEGER DEFAULT 0, converted_at INTEGER, created_at INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS blog_comments (id TEXT PRIMARY KEY, blog_slug TEXT NOT NULL, author_name TEXT NOT NULL, author_email TEXT NOT NULL, content TEXT NOT NULL, is_approved INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), parent_id TEXT, is_team INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS blog_posts (slug TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'published')), scheduled_at INTEGER, published_at INTEGER, qstash_message_id TEXT, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS cookie_consents (id TEXT PRIMARY KEY NOT NULL, visitor_id TEXT NOT NULL, user_id TEXT, necessary INTEGER DEFAULT 1, analytics INTEGER DEFAULT 0, marketing INTEGER DEFAULT 0, status TEXT NOT NULL, ip_address TEXT, user_agent TEXT, country TEXT, created_at INTEGER, updated_at INTEGER);
CREATE TABLE IF NOT EXISTS data_removal_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  admin_notes TEXT,
  processed_at INTEGER,
  processed_by TEXT REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS docs_feedback (id TEXT PRIMARY KEY NOT NULL, article_slug TEXT NOT NULL, category_slug TEXT NOT NULL, helpful INTEGER NOT NULL, reason TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS engagement_actions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, linkedin_post_id TEXT, comment_content TEXT, date TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()), reaction_type TEXT DEFAULT 'LIKE');
CREATE TABLE IF NOT EXISTS engagement_objectives (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, daily_likes INTEGER DEFAULT 10, daily_comments INTEGER DEFAULT 5, updated_at INTEGER DEFAULT (unixepoch()), posts_per_profile INTEGER DEFAULT 2);
CREATE TABLE IF NOT EXISTS `ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`source` text,
	`source_url` text,
	`created_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS linkedin_accounts (
  id                     TEXT PRIMARY KEY,
  workspace_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email                  TEXT NOT NULL,
  password_encrypted     TEXT NOT NULL,
  totp_secret_encrypted  TEXT,
  profile_id             TEXT,
  profile_url            TEXT,
  full_name              TEXT,
  headline               TEXT,
  avatar_url             TEXT,
  country                TEXT NOT NULL,
  proxy_allocation_id    TEXT REFERENCES proxy_allocations(id),
  session_ref            TEXT,
  status                 TEXT NOT NULL DEFAULT 'pending',
  status_reason          TEXT,
  last_check_at          INTEGER,
  created_at             INTEGER NOT NULL,
  updated_at             INTEGER NOT NULL
, warmup_started_at INTEGER, daily_invite_cap INTEGER NOT NULL DEFAULT 8, country_changes INTEGER NOT NULL DEFAULT 0, last_country_change_at INTEGER, challenge_state TEXT NOT NULL DEFAULT 'none', challenge_kind TEXT, challenge_code_encrypted TEXT, challenge_asked_at INTEGER, sign_in_attempts INTEGER NOT NULL DEFAULT 0, last_challenge_at INTEGER, tier TEXT DEFAULT 'free', tier_checked_on TEXT, tier_downgrades INTEGER DEFAULT 0, maturity TEXT, connections INTEGER);
CREATE TABLE IF NOT EXISTS `media` (
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
	`created_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "network_notification_groups" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS "network_notification_members" (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES "network_notification_groups"(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'invited',
  invite_token TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch()),
  accepted_at INTEGER
);
CREATE TABLE IF NOT EXISTS "network_notification_posts" (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES "network_notification_groups"(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  linkedin_post_id TEXT NOT NULL,
  published_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_content TEXT NOT NULL,
  notified_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`used` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS post_analytics (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  date INTEGER NOT NULL,
  impressions INTEGER DEFAULT 0,
  reactions INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS `posts` (
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
	`created_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"',
	`updated_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"', qstash_message_id TEXT, first_comment TEXT, linkedin_image_url TEXT, synced_from_linkedin INTEGER DEFAULT 0, linkedin_account_id TEXT, publish_attempts INTEGER NOT NULL DEFAULT 0, publish_claimed_at INTEGER, first_comment_posted_at INTEGER, linkedin_scheduled_at INTEGER,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS proxy_allocations (
  id                  TEXT PRIMARY KEY,
  workspace_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country             TEXT NOT NULL,
  provider            TEXT NOT NULL,
  host                TEXT NOT NULL,
  port                INTEGER NOT NULL,
  username_encrypted  TEXT NOT NULL,
  password_encrypted  TEXT NOT NULL,
  provider_ref        TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  account_count       INTEGER NOT NULL DEFAULT 0,
  burned_at           INTEGER,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
, source TEXT NOT NULL DEFAULT 'managed', linkedin_account_id TEXT, expires_at INTEGER, auto_renew INTEGER NOT NULL DEFAULT 1, last_checked_at INTEGER, last_exit_ip TEXT, last_asn TEXT, last_asn_org TEXT, exit_looks_hosted INTEGER NOT NULL DEFAULT 0, registry_country TEXT);
CREATE TABLE IF NOT EXISTS redemption_codes (
  code TEXT PRIMARY KEY,
  batch TEXT NOT NULL,
  source TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'business',
  status TEXT NOT NULL DEFAULT 'unused',
  redeemed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at INTEGER,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS saved_carousels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  slides_json TEXT NOT NULL,
  slide_count INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
, kind TEXT NOT NULL DEFAULT 'text');
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  source TEXT NOT NULL DEFAULT 'dashboard',
  review_request_sent_at INTEGER,
  last_user_reply_at INTEGER,
  last_admin_reply_at INTEGER,
  has_unread_for_user INTEGER NOT NULL DEFAULT 0,
  has_unread_for_admin INTEGER NOT NULL DEFAULT 1,
  resolved_at INTEGER,
  closed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS team_invites (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  invited_at INTEGER DEFAULT (unixepoch()),
  accepted_at INTEGER
, notify_on_company_post INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS user_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  canvas_json TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS `users` (
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
	`created_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"',
	`updated_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"'
, coupon_code TEXT, linkedin_posting_target TEXT DEFAULT 'profile', linkedin_selected_org_id TEXT, linkedin_selected_org_name TEXT, linkedin_organizations TEXT, linkedin_community_access_token TEXT, linkedin_community_refresh_token TEXT, linkedin_community_token_expiry INTEGER, sample_posts TEXT, never_mention TEXT, business_description TEXT, target_audience TEXT, writing_tone TEXT, brand_logo_url TEXT, openai_api_key TEXT, openai_model TEXT, anthropic_api_key TEXT, anthropic_model TEXT, google_api_key TEXT, google_model TEXT, grok_api_key TEXT, grok_model TEXT, perplexity_api_key TEXT, perplexity_model TEXT, google_image_api_key TEXT, google_image_model TEXT, google_image_resolution TEXT, google_image_aspect_ratio TEXT, openai_image_api_key TEXT, openai_image_model TEXT, openai_image_resolution TEXT, openai_image_quality TEXT, openai_image_style TEXT, replicate_image_api_key TEXT, replicate_image_model TEXT, replicate_image_resolution TEXT, image_provider TEXT, replicate_image_aspect_ratio TEXT, linkedin_headline TEXT, business_name TEXT DEFAULT NULL, business_niche TEXT DEFAULT NULL, business_products TEXT DEFAULT NULL, business_topics TEXT DEFAULT NULL, business_context TEXT DEFAULT NULL, timezone TEXT, referred_by TEXT, kimi_api_key TEXT, kimi_model TEXT, brand_colors TEXT, linkedin_vanity_name TEXT, linkedin_member_id TEXT, onboarding_completed INTEGER DEFAULT 0, password_changed_at TEXT, auto_like_after_publish INTEGER DEFAULT 1, is_lifetime_deal INTEGER DEFAULT 0, billing_interval TEXT, content_language TEXT DEFAULT 'en', generations_used INTEGER DEFAULT 0, generations_period TEXT, ltd_source TEXT, trial_started_at INTEGER, trial_ended_at INTEGER, has_used_trial INTEGER DEFAULT 0, churned_at INTEGER, churn_stage INTEGER DEFAULT 0, payment_failed_at INTEGER, onboarding_stage INTEGER DEFAULT 0, uncarded_warned_at INTEGER, extra_agents INTEGER DEFAULT 0, abandon_emailed_at INTEGER);
CREATE TABLE IF NOT EXISTS `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
CREATE TABLE IF NOT EXISTS `waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`status` text DEFAULT 'pending',
	`created_at` integer DEFAULT '"2026-01-14T20:16:36.062Z"'
);
CREATE TABLE IF NOT EXISTS worker_flags (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_actions_account_type_time ON agent_actions(linkedin_account_id, type, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_type_time ON agent_actions(agent_id, type, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_ai_usage_agent_time ON agent_ai_usage(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent_time ON agent_events(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_leads_agent_found ON agent_leads(agent_id, found_at);
CREATE INDEX IF NOT EXISTS idx_agent_leads_agent_step ON agent_leads(agent_id, step);
CREATE INDEX IF NOT EXISTS idx_agent_messages_lead ON agent_messages(lead_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_agent_messages_unread
  ON agent_messages(workspace_id, read_at) WHERE direction = 'in' AND read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_queue_agent_time ON agent_queue(agent_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_agent_queue_state ON agent_queue(state, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_agent_sources_agent ON agent_sources(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_workspace ON agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_slug ON blog_comments(blog_slug);
CREATE INDEX IF NOT EXISTS idx_li_accounts_workspace ON linkedin_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posts_publish_due ON posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_proxy_alloc_account ON proxy_allocations(linkedin_account_id);
CREATE INDEX IF NOT EXISTS idx_proxy_alloc_free ON proxy_allocations(status, country);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_batch ON redemption_codes(batch);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_redeemed_by ON redemption_codes(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_source ON redemption_codes(source);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_status ON redemption_codes(status);
CREATE INDEX IF NOT EXISTS idx_style_account_time ON agent_style_samples(linkedin_account_id, captured_at);
CREATE UNIQUE INDEX IF NOT EXISTS `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx ON support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_updated_idx ON support_tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON support_tickets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_account_followers_day ON account_followers(linkedin_account_id, day);
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_leads_workspace_profile
  ON agent_leads(workspace_id, profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_li_accounts_workspace_profile
  ON linkedin_accounts(workspace_id, profile_id) WHERE profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_proxy_account_active ON proxy_allocations(linkedin_account_id) WHERE status = 'active' AND linkedin_account_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX IF NOT EXISTS `waitlist_email_unique` ON `waitlist` (`email`);
