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
 * Post scheduling no longer creates a QStash job.
 *
 * v2 drops the LinkedIn API, so /api/qstash/publish-post, /auto-like and
 * /post-first-comment are gone and the helpers that targeted them went with
 * them. A scheduled post is now a row with a status and a time, which is the
 * user's calendar, and the browser publisher will read it when phase 12 builds
 * it. Queueing a job at a deleted URL would have failed silently at delivery
 * time, which is the worst place to find out.
 *
 * cancelScheduledPost stays: jobs created before the removal are still queued
 * upstream and deleting a user has to cancel them.
 */

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

export { qstash };
