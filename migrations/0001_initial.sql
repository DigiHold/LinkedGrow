-- LinkedGrow Database Schema
-- Initial migration for Cloudflare D1

-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'starter', 'creator', 'pro', 'agency')),
  plan_expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- AI API Keys (encrypted)
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('openai', 'anthropic', 'google', 'groq', 'mistral')),
  encrypted_key TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Business Profiles
CREATE TABLE IF NOT EXISTS business_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  products TEXT,
  niche TEXT,
  target_audience TEXT,
  key_topics TEXT,
  do_not_mention TEXT,
  additional_context TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);

-- LinkedIn Connections
CREATE TABLE IF NOT EXISTS linkedin_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TEXT,
  profile_name TEXT,
  profile_email TEXT,
  profile_picture TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_linkedin_connections_user_id ON linkedin_connections(user_id);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'published', 'failed')),
  post_type TEXT CHECK(post_type IN ('actionable', 'inspiring', 'introspective', 'promotional')),
  post_category TEXT,
  scheduled_at TEXT,
  published_at TEXT,
  linkedin_post_id TEXT,
  media_url TEXT,
  media_type TEXT,
  first_comment TEXT,
  first_comment_delay_minutes INTEGER DEFAULT 0,
  algorithm_score INTEGER,
  is_favorite INTEGER DEFAULT 0,
  source TEXT CHECK(source IN ('manual', 'generator', 'reddit', 'ideas', 'repurpose')),
  source_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_user_status ON posts(user_id, status);

-- Post Analytics
CREATE TABLE IF NOT EXISTS post_analytics (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_post_analytics_post_id ON post_analytics(post_id);

-- Content Ideas (saved)
CREATE TABLE IF NOT EXISTS saved_ideas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hook TEXT NOT NULL,
  post_type TEXT,
  post_category TEXT,
  theme TEXT,
  engagement_prediction TEXT,
  is_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_saved_ideas_user_id ON saved_ideas(user_id);

-- AI Generation History (for analytics)
CREATE TABLE IF NOT EXISTS ai_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT,
  prompt_type TEXT CHECK(prompt_type IN ('hooks', 'posts', 'ideas', 'edit', 'carousel', 'repurpose')),
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at);

-- Engagement Tracking
CREATE TABLE IF NOT EXISTS engagement_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  likes_given INTEGER DEFAULT 0,
  comments_given INTEGER DEFAULT 0,
  likes_goal INTEGER DEFAULT 10,
  comments_goal INTEGER DEFAULT 5,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_engagement_tracking_user_date ON engagement_tracking(user_id, date);

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_ai_provider TEXT DEFAULT 'openai',
  default_ai_model TEXT,
  daily_likes_goal INTEGER DEFAULT 10,
  daily_comments_goal INTEGER DEFAULT 5,
  preferred_posting_times TEXT, -- JSON array
  timezone TEXT DEFAULT 'UTC',
  email_notifications INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
