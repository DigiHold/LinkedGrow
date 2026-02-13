import { Client } from "@upstash/qstash";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

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
    retries: 3,
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

export { qstash };
