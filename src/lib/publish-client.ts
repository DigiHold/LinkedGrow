/**
 * Publishing, from the browser's point of view.
 *
 * There is no synchronous publish any more. POST /api/linkedin/post queues the
 * post and the worker types it into the real composer a moment later, so the
 * dashboard asks, then watches the post's own row until it lands.
 *
 * Every screen that publishes shares this file. Four of them used to hold their
 * own copy of the fetch, and the honest version of it is longer than the old
 * one, so four copies would have drifted within a week.
 */

export type PublishStage = "queueing" | "waiting" | "publishing";

export type PublishOutcome =
  | { state: "published"; url: string | null }
  | { state: "failed"; message: string }
  /** Still going when we stopped watching. Not a failure: the row keeps updating. */
  | { state: "pending" };

export interface PublishRequest {
  postId: string;
  text: string;
  videoUrl?: string;
  videoMimeType?: string;
  videoStorageKey?: string;
  /** Only needed by a workspace with several connected accounts. */
  linkedinAccountId?: string;
}

/** How often to ask the post how it is doing. */
const POLL_MS = 3000;
/**
 * How long to keep watching. The worker looks for due posts every minute and a
 * session with a video in it is the slow case, so this is generous on purpose;
 * past it the user is told it is still running rather than told it broke.
 */
const WATCH_MS = 6 * 60 * 1000;

interface PostRow {
  status?: string;
  linkedinPostUrl?: string | null;
  errorMessage?: string | null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Queues the post. Throws with the server's own words when it refuses. */
export async function queuePost(input: PublishRequest): Promise<void> {
  const response = await fetch("/api/linkedin/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postId: input.postId,
      text: input.text,
      videoUrl: input.videoUrl,
      videoMimeType: input.videoMimeType,
      videoStorageKey: input.videoStorageKey,
      linkedinAccountId: input.linkedinAccountId,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Could not queue this post");
  }
}

/**
 * Watches one post until LinkedIn has it, or until it fails, or until we stop
 * looking. A poll that errors is ignored rather than fatal: a dropped request
 * on a phone changing network is not a failed post.
 */
export async function watchPost(
  postId: string,
  onStage?: (stage: PublishStage) => void
): Promise<PublishOutcome> {
  const until = Date.now() + WATCH_MS;
  let announced: PublishStage | null = null;

  while (Date.now() < until) {
    await wait(POLL_MS);

    const response = await fetch(`/api/posts/${postId}`, { cache: "no-store" }).catch(() => null);
    if (!response || !response.ok) continue;

    const body = (await response.json().catch(() => null)) as { post?: PostRow } | null;
    const post = body?.post;
    if (!post) continue;

    if (post.status === "published") {
      return { state: "published", url: post.linkedinPostUrl ?? null };
    }
    if (post.status === "failed") {
      return {
        state: "failed",
        message: post.errorMessage || "LinkedIn refused this post. Nothing was published.",
      };
    }
    // "publishing" means a browser is on the composer right now, which is worth
    // saying: it is the difference between waiting in a queue and being written.
    const stage: PublishStage = post.status === "publishing" ? "publishing" : "waiting";
    if (stage !== announced) {
      announced = stage;
      onStage?.(stage);
    }
  }

  return { state: "pending" };
}

/** Queue, then watch. What every publish button calls. */
export async function publishAndWatch(
  input: PublishRequest,
  onStage?: (stage: PublishStage) => void
): Promise<PublishOutcome> {
  onStage?.("queueing");
  await queuePost(input);
  return watchPost(input.postId, onStage);
}

/** The sentence to show for each stage, so four screens word it the same way. */
export function publishStageLabel(stage: PublishStage): string {
  if (stage === "queueing") return "Sending this to your LinkedIn session";
  if (stage === "publishing") return "Writing your post on LinkedIn";
  return "Waiting for your LinkedIn session to pick this up";
}

/** What to tell somebody when the watch ran out before the post landed. */
export const PUBLISH_STILL_RUNNING =
  "Still publishing. You can leave this page, it appears under Posts once it lands.";
