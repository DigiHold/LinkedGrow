-- Add qstash_message_id column to posts table for tracking scheduled posts
ALTER TABLE posts ADD COLUMN qstash_message_id TEXT;
