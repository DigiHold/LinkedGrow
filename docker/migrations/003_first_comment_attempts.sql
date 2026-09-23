-- The first comment is written after the post is published, so it never went
-- back through the publish queue and a failed one was simply lost. The sweep
-- that retries it counts its tries here.
ALTER TABLE posts ADD COLUMN first_comment_attempts INTEGER NOT NULL DEFAULT 0;
