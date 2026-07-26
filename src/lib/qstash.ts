import { Client } from "@upstash/qstash";

// Initialize QStash client - US East 1 region.
// Built on first use for the same reason as src/lib/stripe.ts: constructing it
// at import time warns loudly during the build in any environment without a
// token, and couples every route that imports this file to QStash being
// configured.
const QSTASH_BASE_URL = process.env.QSTASH_URL || "https://qstash-us-east-1.upstash.io";

let client: Client | null = null;

function getQstash(): Client {
  if (!client) {
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
      throw new Error("QSTASH_TOKEN is not set in this environment");
    }
    client = new Client({ token, baseUrl: QSTASH_BASE_URL });
  }
  return client;
}

const qstash = new Proxy({} as Client, {
  get(_target, prop, receiver) {
    return Reflect.get(getQstash(), prop, receiver);
  },
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

export { qstash };
