import { Client } from "@upstash/qstash";

// Initialize QStash client - US East 1 region
const QSTASH_BASE_URL = process.env.QSTASH_URL || "https://qstash-us-east-1.upstash.io";
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: QSTASH_BASE_URL,
});

// Always use production URL for QStash webhooks - staging deployments have
// Vercel deployment protection that blocks QStash callbacks with 401
const APP_URL = "https://linkedgrow.ai";

/**
 * Schedule a post to be published at a specific time
 * @param postId - The ID of the post to publish
 * @param scheduledAt - The exact Date/time to publish
 * @returns The QStash message ID for tracking/cancellation
 */
export async function schedulePost(postId: string, scheduledAt: Date): Promise<string> {
  const response = await qstash.publishJSON({
    url: `${APP_URL}/api/qstash/publish-post`,
    body: { postId },
    notBefore: Math.floor(scheduledAt.getTime() / 1000), // Unix timestamp in seconds
    retries: 5,
  });

  return response.messageId;
}

/**
 * Cancel a scheduled post
 * @param messageId - The QStash message ID returned from schedulePost
 */
export async function cancelScheduledPost(messageId: string): Promise<void> {
  try {
    await qstash.messages.delete(messageId);
  } catch (error) {
    // Message might already be delivered or not exist
    console.error("Failed to cancel scheduled post:", error);
  }
}

/**
 * Reschedule a post to a new time
 * @param oldMessageId - The existing QStash message ID to cancel
 * @param postId - The post ID
 * @param newScheduledAt - The new scheduled time
 * @returns The new QStash message ID
 */
export async function reschedulePost(
  oldMessageId: string,
  postId: string,
  newScheduledAt: Date
): Promise<string> {
  // Cancel the old scheduled message
  await cancelScheduledPost(oldMessageId);

  // Schedule a new one
  return schedulePost(postId, newScheduledAt);
}

/**
 * Schedule an auto-like on the user's own post after publication
 * @param postId - The ID of the post to like
 * @param delaySeconds - Random delay in seconds (10-120)
 * @returns The QStash message ID
 */
export async function scheduleAutoLike(
  postId: string,
  delaySeconds: number
): Promise<string> {
  const response = await qstash.publishJSON({
    url: `${APP_URL}/api/qstash/auto-like`,
    body: { postId },
    delay: delaySeconds,
    retries: 3,
  });

  return response.messageId;
}

/**
 * Schedule a first comment to be posted after publication
 * @param postId - The ID of the post to comment on
 * @param delaySeconds - Random delay in seconds (60-300)
 * @returns The QStash message ID
 */
export async function scheduleFirstComment(
  postId: string,
  delaySeconds: number
): Promise<string> {
  const response = await qstash.publishJSON({
    url: `${APP_URL}/api/qstash/post-first-comment`,
    body: { postId },
    delay: delaySeconds,
    retries: 3,
  });

  return response.messageId;
}

/**
 * Schedule team auto-engagement jobs (like, comment, share) with staggered delays.
 * Each job is sent to QStash with a unique delay so team members engage naturally over time.
 */
export async function scheduleTeamEngagement(
  postId: string,
  linkedinPostId: string,
  jobs: Array<{
    jobId: string;
    userId: string;
    actionType: string;
    delaySeconds: number;
    commentText?: string;
  }>
): Promise<void> {
  // Import here to avoid circular dependency (team-engagement.ts imports from qstash.ts)
  const { db } = await import("@/lib/db");
  const { teamEngagementJobs } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  for (const job of jobs) {
    try {
      const response = await qstash.publishJSON({
        url: `${APP_URL}/api/qstash/team-engage`,
        body: {
          jobId: job.jobId,
          postId,
          linkedinPostId,
          userId: job.userId,
          actionType: job.actionType,
          commentText: job.commentText,
        },
        delay: job.delaySeconds,
        retries: 3,
      });

      // Update the job record with the QStash message ID
      await db
        .update(teamEngagementJobs)
        .set({ qstashMessageId: response.messageId })
        .where(eq(teamEngagementJobs.id, job.jobId));
    } catch (error) {
      console.error(`[Team Engage QStash] Failed to schedule job ${job.jobId}:`, error);
    }
  }
}

export { qstash };
