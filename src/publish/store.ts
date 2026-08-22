import { createHash } from "node:crypto";
import { db } from "../db.ts";
import { log } from "../logger.ts";
import { deleteObject } from "../storage/r2.ts";
import { timezoneForCountry } from "../browser/fingerprint.ts";

/**
 * The publish queue, which is the posts table itself.
 *
 * The app cannot publish any more: v2 has no Share API and a browser cannot be
 * driven from a serverless request, so the dashboard writes the intent and this
 * worker carries it out. A separate queue table was considered and dropped,
 * because it would have held a second copy of the status, the time, the URL and
 * the error, and the two copies disagree the first time a publish half fails.
 *
 * The states this file moves a post through:
 *
 *   queued      the user pressed Publish; due immediately
 *   scheduled   due once its slot has passed, plus a few minutes of jitter
 *   publishing  claimed here, browser open, lease running
 *   published   verified on LinkedIn, URL stored
 *   failed      three attempts spent, and the user is told
 */

/** How long a claim is good for. Past it the worker that took it is assumed dead. */
export const CLAIM_LEASE_MS = 20 * 60 * 1000;

/** Attempts before a post is given up on. Three covers a bad session and a slow upload. */
export const MAX_PUBLISH_ATTEMPTS = 3;

/**
 * Preparation rounds before LinkedIn's scheduler is left alone.
 *
 * Preparation is optional sugar: the direct path at the slot is the safety
 * net. Two failed rounds mean the picker is not cooperating tonight, and a
 * third composer session on the customer's account buys nothing but risk, so
 * past this the post waits quietly and goes out the direct way. It exists
 * because these rounds used to be billed as publish attempts, which killed a
 * post 5 hours before its own slot on 2026-08-22.
 */
export const PREPARE_TRY_BUDGET = 2;

/**
 * The widest a scheduled post may drift past its slot.
 *
 * Only reached by a post that missed its own preparation window, because a
 * scheduled post is normally handed to LinkedIn's scheduler hours earlier and
 * published by LinkedIn itself, to the second. This is the fallback path, and
 * on it a post that appears at exactly 09:00:00 from a session that opened at
 * 09:00 is the pattern worth breaking up.
 */
export const MAX_JITTER_MS = 4 * 60 * 1000;

/**
 * How far ahead of its slot a post is written into the composer.
 *
 * A person planning tomorrow's post writes it the evening before, or after
 * lunch, or whenever they happen to sit down; they do not write it ninety
 * seconds before it goes out, and they certainly do not do that every single
 * day at the same distance. Two to twenty hours, seeded per post so the same
 * post always has the same plan, spreads it the way a diary does.
 */
export const LEAD_MIN_MS = 2 * 60 * 60 * 1000;
export const LEAD_MAX_MS = 20 * 60 * 60 * 1000;

/**
 * Under this much notice, LinkedIn's own scheduler is not worth using.
 *
 * Its picker works in whole minutes and refuses times that are nearly now, and
 * a post handed over ninety seconds early gains nothing anyway. Below this the
 * post is published the direct way at its slot.
 */
export const MIN_NATIVE_LEAD_MS = 90 * 60 * 1000;

/** How long after the slot to wait before going to look for the post LinkedIn published. */
export const CONFIRM_GRACE_MS = 3 * 60 * 1000;

/**
 * The hours during which a post may be written.
 *
 * Composing at 04:00 is its own signal, and the whole reason for preparing
 * early is to look like somebody sitting down with their week. The window is
 * ignored inside the last few hours before a slot, because by then missing the
 * post is worse than writing it at an odd hour.
 */
export const AWAKE_HOURS = { start: 7, end: 23 };
const IGNORE_WINDOW_WITHIN_MS = 4 * 60 * 60 * 1000;

export interface DuePost {
  id: string;
  userId: string;
  workspaceId: string;
  content: string;
  postType: string;
  firstComment: string | null;
  firstCommentPostedAt: number | null;
  scheduledAt: number;
  attempts: number;
  /** Set by the dashboard for a publish-now, null for a post scheduled long ago. */
  linkedinAccountId: string | null;
  metadata: string | null;
  wasScheduled: boolean;
  /** When LinkedIn's own scheduler was given this post. Null means it has not been. */
  linkedinScheduledAt: number | null;
  /** The owner's "react to my own post after it goes out" switch, on by default. */
  autoLike: boolean;
}

export interface PublishAccount {
  id: string;
  workspaceId: string;
  country: string;
  timezone: string;
  /** Where the post is read back from. Null until the session layer has signed in once. */
  profileUrl: string | null;
}

export interface PublishMedia {
  url: string;
  mimeType: string;
  fileName: string;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * This post's own drift past its slot, the same every time it is asked.
 *
 * Derived from the id rather than drawn at random, because a random value read
 * once a minute would move the target every pass and the post would go up at
 * whichever minute happened to roll a low number. Seeded, it is one fixed
 * offset per post, which is what "a few minutes late, unpredictably" means.
 */
export function jitterMsFor(postId: string): number {
  const digest = createHash("sha256").update(postId).digest();
  return (digest.readUInt32BE(0) % (MAX_JITTER_MS + 1));
}

/**
 * How early the direct path opens its session before the slot.
 *
 * Composing takes 3 to 8 minutes at a human pace, and it used to START at the
 * slot, which put every directly published post that much past its hour.
 * Starting early moves all the slow work before the hour; the Post click
 * itself is held until the slot plus clickJitterMsFor, so the post appears
 * within a couple of minutes of the time the customer picked, never ten
 * (Nicolas, 2026-08-22).
 */
export const DIRECT_HEAD_START_MS = 10 * 60 * 1000;

/**
 * The pause between the slot and the actual Post click, seeded per post.
 *
 * 15 to 150 seconds: enough that no account ever posts on the exact second,
 * which is its own robot signature, and small enough that an 18:00 post still
 * reads as 18:00 on the feed.
 */
export function clickJitterMsFor(postId: string): number {
  return 15_000 + (jitterMsFor(postId) % 135_000);
}

/** How far ahead of its slot this particular post gets written. Fixed per post. */
export function leadMsFor(postId: string): number {
  const digest = createHash("sha256").update(`${postId}:lead`).digest();
  return LEAD_MIN_MS + (digest.readUInt32BE(0) % (LEAD_MAX_MS - LEAD_MIN_MS));
}

/** The hour of the day at a moment, in the account's own timezone. */
export function hourInZone(at: number, timeZone: string): number {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(new Date(at));
  return Number(value) % 24;
}

/**
 * What this post needs next, which is the whole scheduling policy in one place.
 *
 *   publish  write it into the composer and press Post now
 *   prepare  write it into the composer and hand it to LinkedIn's scheduler
 *   confirm  LinkedIn has published it by now, go and find it
 *   wait     nothing to do this minute
 *
 * The interesting case is a post scheduled for tomorrow morning. It is prepared
 * this evening, LinkedIn publishes it itself, and the only thing left to do at
 * the slot is read it back and leave the first comment. Nothing of ours opens a
 * browser at 09:00, which is exactly what makes it look like a person who
 * planned ahead rather than a machine that woke up.
 */
export type PostAction = "publish" | "prepare" | "confirm" | "wait";

export function actionFor(
  post: DuePost,
  timeZone: string,
  at: number = Date.now()
): PostAction {
  const slot = post.scheduledAt * 1000;

  // Somebody pressed Publish and is watching the screen.
  if (!post.wasScheduled) return slot <= at ? "publish" : "wait";

  // LinkedIn already has it. All that is left is to see it appear.
  if (post.linkedinScheduledAt !== null) {
    return slot + CONFIRM_GRACE_MS <= at ? "confirm" : "wait";
  }

  const untilSlot = slot - at;

  // Preparation has had its rounds. Leave the account alone and take the
  // direct path, opening early so the click can land at the slot.
  if (post.attempts >= PREPARE_TRY_BUDGET) {
    return slot - DIRECT_HEAD_START_MS <= at ? "publish" : "wait";
  }

  // Too close for LinkedIn's picker to be worth it, so it goes out the direct
  // way: the session opens ahead of the slot, the composing happens in that
  // head start, and publishPost holds the finished post until the slot plus
  // its own small click jitter.
  if (untilSlot <= MIN_NATIVE_LEAD_MS) {
    return slot - DIRECT_HEAD_START_MS <= at ? "publish" : "wait";
  }

  if (at < slot - leadMsFor(post.id)) return "wait";

  // Not in the middle of the night, unless the slot is close enough that
  // missing it would be the worse outcome.
  if (untilSlot > IGNORE_WINDOW_WITHIN_MS) {
    const hour = hourInZone(at, timeZone);
    if (hour < AWAKE_HOURS.start || hour >= AWAKE_HOURS.end) return "wait";
  }

  return "prepare";
}

/**
 * Frees posts whose worker died mid-publish.
 *
 * A crash between the claim and the result leaves a row reading "publishing"
 * for ever, which to the user is a post that never went up and never failed.
 * The attempt counter is not touched here: it was already spent by the claim,
 * so a dead worker costs the post one of its three tries rather than an
 * unlimited number of them.
 */
export async function releaseStaleClaims(): Promise<number> {
  const cutoff = Math.floor((Date.now() - CLAIM_LEASE_MS) / 1000);
  const now = nowSeconds();
  const results = await db().batch([
    {
      // Only a publish-now ever reaches the `publishing` status, so `queued` is
      // always the right place to put it back.
      sql: `UPDATE posts
               SET status = 'queued', publish_claimed_at = NULL, updated_at = ?
             WHERE status = 'publishing'
               AND (publish_claimed_at IS NULL OR publish_claimed_at <= ?)`,
      args: [now, cutoff],
    },
    {
      // A scheduled post keeps its status while it is being worked on, so
      // freeing it is only a matter of dropping the lock.
      sql: `UPDATE posts
               SET publish_claimed_at = NULL, updated_at = ?
             WHERE status = 'scheduled' AND publish_claimed_at <= ?`,
      args: [now, cutoff],
    },
  ]);
  return results.reduce((total, r) => total + Number(r.rowsAffected ?? 0), 0);
}

/**
 * Every post worth looking at this minute, across every customer.
 *
 * The horizon reaches forward as well as back, because a post scheduled for
 * tomorrow morning is written into LinkedIn's scheduler tonight and has to be
 * visible here before its slot arrives. `actionFor` decides which of them is
 * actually ready; this only bounds the read.
 *
 * The paywall is applied here rather than only in the dashboard: a post
 * scheduled last week by somebody whose trial has since ended must not go up,
 * and the app route they queued it through is not in the loop any more. The
 * condition is the one in src/proxy.ts, kept identical on purpose.
 */
export async function loadDuePosts(limit = 25): Promise<DuePost[]> {
  const { rows } = await db().execute({
    sql: `SELECT
            p.id                       AS id,
            p.user_id                  AS user_id,
            p.content                  AS content,
            p.post_type                AS post_type,
            p.first_comment            AS first_comment,
            p.first_comment_posted_at  AS first_comment_posted_at,
            p.scheduled_at             AS scheduled_at,
            p.publish_attempts         AS attempts,
            p.linkedin_account_id      AS linkedin_account_id,
            p.linkedin_scheduled_at    AS linkedin_scheduled_at,
            p.metadata                 AS metadata,
            p.status                   AS status,
            COALESCE(u.auto_like_after_publish, 1) AS auto_like,
            COALESCE(
              (SELECT t.owner_id
                 FROM team_members tm
                 JOIN teams t ON t.id = tm.team_id
                WHERE tm.user_id = p.user_id
                LIMIT 1),
              p.user_id
            )                          AS workspace_id
          FROM posts p
          JOIN users u ON u.id = p.user_id
         WHERE p.status IN ('queued', 'scheduled')
           AND p.scheduled_at IS NOT NULL
           AND p.scheduled_at <= ?
           AND p.scheduled_at >= ?
           -- The paywall, kept identical to the one in the app's src/proxy.ts.
           -- v2 dropped has_used_trial from it: the trial is granted by Stripe
           -- against a card, so an account that never trialled is one that
           -- never finished signing up and gets the same wall as one that
           -- cancelled. This copy still carried the v1 condition, which would
           -- have let a post go out for an account the dashboard refuses to
           -- open. Change one of these and change the other.
           AND NOT (
                 u.plan = 'free'
             AND (u.stripe_subscription_id IS NULL OR u.stripe_subscription_id = '')
             AND COALESCE(u.is_lifetime_deal, 0) = 0
           )
         ORDER BY p.scheduled_at ASC
         LIMIT ?`,
    args: [
      // Forward to the far edge of the preparation window, so tomorrow's post
      // is visible tonight.
      nowSeconds() + Math.floor(LEAD_MAX_MS / 1000),
      // And back only far enough to catch a post whose slot passed while the
      // worker was down. Older than a week is somebody's abandoned draft.
      nowSeconds() - 7 * 24 * 3600,
      limit,
    ],
  });

  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    workspaceId: String(row.workspace_id),
    content: String(row.content ?? ""),
    postType: String(row.post_type ?? "text"),
    firstComment: row.first_comment === null ? null : String(row.first_comment),
    firstCommentPostedAt:
      row.first_comment_posted_at === null ? null : Number(row.first_comment_posted_at),
    scheduledAt: Number(row.scheduled_at),
    attempts: Number(row.attempts ?? 0),
    linkedinAccountId:
      row.linkedin_account_id === null ? null : String(row.linkedin_account_id),
    metadata: row.metadata === null ? null : String(row.metadata),
    wasScheduled: String(row.status) === "scheduled",
    linkedinScheduledAt:
      row.linkedin_scheduled_at === null ? null : Number(row.linkedin_scheduled_at),
    autoLike: Number(row.auto_like ?? 1) === 1,
  }));
}

/**
 * Which LinkedIn account this post goes out from.
 *
 * A publish-now already carries the answer, chosen in the dashboard. A post
 * scheduled weeks ago does not, and the workspace may have connected or
 * disconnected accounts since, so the oldest connected one is used and written
 * back on the post. Null means the workspace has nothing to publish through,
 * which is a failure with a sentence the customer can act on rather than a
 * silent skip.
 */
/**
 * Is somebody sitting in front of a screen waiting for this account to post?
 *
 * The agent and the publisher share one browser slot per LinkedIn account, and
 * they took it first-come-first-served. Watching a live pass on 2026-08-08
 * showed what that costs: the agent held the slot for eighteen minutes while
 * the publish loop logged "no slot free, publishing on the next pass" every
 * sixty seconds. Nobody had pressed Publish that time. When somebody does, they
 * would sit in front of a spinner for a quarter of an hour with nothing wrong.
 *
 * So the agent asks this before it starts, and stands aside if the answer is
 * yes. Sourcing loses one pass out of a day; a person loses nothing. Only work
 * that is due RIGHT NOW counts: a post scheduled for tomorrow evening is not
 * somebody waiting, and it must not keep the agent off LinkedIn all day.
 */
export async function publishingIsWaiting(linkedinAccountId: string): Promise<boolean> {
  const { rows } = await db().execute({
    sql: `SELECT 1
            FROM posts p
           WHERE (
                   p.linkedin_account_id = ?
                   OR (p.linkedin_account_id IS NULL
                       AND p.user_id = (SELECT workspace_id FROM linkedin_accounts WHERE id = ?))
                 )
             AND (
                   p.status = 'queued'
                   OR (p.status = 'scheduled' AND p.scheduled_at <= ?)
                 )
           LIMIT 1`,
    args: [linkedinAccountId, linkedinAccountId, nowSeconds()],
  });
  return rows.length > 0;
}

export async function accountForPost(post: DuePost): Promise<PublishAccount | null> {
  if (post.linkedinAccountId) {
    const { rows } = await db().execute({
      sql: `SELECT la.id, la.workspace_id, la.country, la.profile_url, a.timezone AS timezone
              FROM linkedin_accounts la
              LEFT JOIN agents a ON a.linkedin_account_id = la.id
             WHERE la.id = ? AND la.workspace_id = ? AND la.status = 'active'
             LIMIT 1`,
      args: [post.linkedinAccountId, post.workspaceId],
    });
    const row = rows[0];
    if (row) {
      return {
        id: String(row.id),
        workspaceId: String(row.workspace_id),
        country: String(row.country),
        timezone: row.timezone ? String(row.timezone) : timezoneForCountry(String(row.country)),
        profileUrl: row.profile_url ? String(row.profile_url) : null,
      };
    }
  }

  const { rows } = await db().execute({
    sql: `SELECT la.id, la.workspace_id, la.country, la.profile_url, a.timezone AS timezone
            FROM linkedin_accounts la
            LEFT JOIN agents a ON a.linkedin_account_id = la.id
           WHERE la.workspace_id = ? AND la.status = 'active'
           ORDER BY la.created_at ASC
           LIMIT 1`,
    args: [post.workspaceId],
  });
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    country: String(row.country),
    timezone: row.timezone ? String(row.timezone) : timezoneForCountry(String(row.country)),
        profileUrl: row.profile_url ? String(row.profile_url) : null,
  };
}

/** The image, PDF or video attached to this post, if any. */
export async function mediaForPost(post: DuePost): Promise<PublishMedia | null> {
  const { rows } = await db().execute({
    sql: `SELECT storage_url, mime_type, file_name
            FROM media
           WHERE post_id = ? AND status = 'ready'
           ORDER BY sort_order ASC
           LIMIT 1`,
    args: [post.id],
  });
  const row = rows[0];
  if (row) {
    return {
      url: String(row.storage_url),
      mimeType: String(row.mime_type ?? "application/octet-stream"),
      fileName: String(row.file_name ?? "attachment"),
    };
  }

  // Videos never reach the media table: they are too large to keep, so they sit
  // in R2 as a pipe and the dashboard records the URL on the post instead.
  if (!post.metadata) return null;
  try {
    const parsed = JSON.parse(post.metadata) as {
      video?: { url?: unknown; mimeType?: unknown };
    };
    const url = parsed.video?.url;
    if (typeof url !== "string" || !url) return null;
    const mimeType =
      typeof parsed.video?.mimeType === "string" ? parsed.video.mimeType : "video/mp4";
    return { url, mimeType, fileName: "video.mp4" };
  } catch {
    return null;
  }
}

/**
 * Takes ownership of one post, or loses the race.
 *
 * The WHERE clause is the lock: two workers reaching the same row means exactly
 * one UPDATE changes a line, and the loser sees zero and moves on. The attempt
 * is counted at the claim rather than at the failure, so a worker killed
 * mid-publish still costs the post one try and cannot loop for ever.
 *
 * A **queued** post moves to `publishing`, because somebody is watching the
 * screen and deserves to see that it started. A **scheduled** post keeps its
 * status and is locked by the claim timestamp alone. That is not a detail: the
 * first version moved everything to `publishing` and put everything back as
 * `queued`, which turned a post scheduled for tomorrow into one due right now.
 * A single failed preparation would have published somebody's post a day early.
 */
export async function claimPost(post: DuePost, accountId: string): Promise<boolean> {
  const now = nowSeconds();
  const stale = Math.floor((Date.now() - CLAIM_LEASE_MS) / 1000);

  const result = post.wasScheduled
    ? await db().execute({
        sql: `UPDATE posts
                 SET publish_claimed_at = ?,
                     publish_attempts = publish_attempts + 1,
                     linkedin_account_id = ?,
                     updated_at = ?
               WHERE id = ? AND status = 'scheduled'
                 AND (publish_claimed_at IS NULL OR publish_claimed_at <= ?)`,
        args: [now, accountId, now, post.id, stale],
      })
    : await db().execute({
        sql: `UPDATE posts
                 SET status = 'publishing',
                     publish_claimed_at = ?,
                     publish_attempts = publish_attempts + 1,
                     linkedin_account_id = ?,
                     updated_at = ?
               WHERE id = ? AND status = 'queued'`,
        args: [now, accountId, now, post.id],
      });

  return Number(result.rowsAffected ?? 0) === 1;
}

/**
 * Drops the lock on a scheduled post and leaves everything else alone.
 *
 * Used when preparation could not happen: the composer had no Schedule control,
 * the session was signed out, the date field would not take the date. None of
 * those are failures of the post. It stays scheduled, un-handed-over, and
 * `actionFor` publishes it the direct way when its slot arrives.
 */
export async function releaseScheduled(
  postId: string,
  message: string | null,
  keepAttempt = false
): Promise<void> {
  const now = nowSeconds();
  await db().execute({
    sql: `UPDATE posts
             SET publish_claimed_at = NULL,
                 publish_attempts = ${keepAttempt ? "publish_attempts" : "MAX(0, publish_attempts - 1)"},
                 error_message = ?,
                 updated_at = ?
           WHERE id = ? AND status = 'scheduled'`,
    args: [message, now, postId],
  });
}

/**
 * The post went up.
 *
 * `note` carries the one case where that is not the whole truth: the composer
 * closed but the post could not be found on the account's feed afterwards. It
 * is not retried, because reposting on a doubt is how somebody publishes twice,
 * and it is not called a failure, because it almost certainly worked. The user
 * is told to check, which is the only honest thing to say when we do not know.
 */
export async function markPublished(
  postId: string,
  url: string | null,
  note: string | null = null
): Promise<void> {
  const now = nowSeconds();
  await db().execute({
    sql: `UPDATE posts
             SET status = 'published',
                 published_at = ?,
                 linkedin_post_url = ?,
                 publish_claimed_at = NULL,
                 error_message = ?,
                 updated_at = ?
           WHERE id = ?`,
    args: [now, url, note, now, postId],
  });
}

/**
 * Deletes the customer's video from our bucket, once LinkedIn has it.
 *
 * A video is up to 200MB and it never enters the media table, so the daily
 * orphan sweep on the app side has never been able to see one: every video
 * anybody has ever posted is still sitting in R2. LinkedIn keeps its own copy
 * from the moment the composer accepts the upload, so ours stops being needed
 * the second the post is confirmed live.
 *
 * The metadata entry goes with it. Leaving the URL behind would give the
 * dashboard a link to an object that no longer exists, and would make the next
 * pass try to download it again if the post were ever requeued.
 */
export async function releaseVideo(post: DuePost): Promise<boolean> {
  if (!post.metadata) return false;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(post.metadata) as Record<string, unknown>;
  } catch {
    return false;
  }

  const video = parsed.video as { storageKey?: unknown; url?: unknown } | undefined;
  const key = typeof video?.storageKey === "string" ? video.storageKey : null;
  if (!key) return false;

  const removed = await deleteObject(key);
  if (!removed) return false;

  // Keep everything else the post carried, and record that the file is gone
  // rather than silently dropping the fact there ever was one.
  const { video: _dropped, ...rest } = parsed;
  const next = { ...rest, videoReleasedAt: nowSeconds() };
  await db().execute({
    sql: `UPDATE posts SET metadata = ?, updated_at = ? WHERE id = ?`,
    args: [JSON.stringify(next), nowSeconds(), post.id],
  });
  log("video removed from storage", { postId: post.id, key });
  return true;
}

export async function markFirstCommentPosted(postId: string): Promise<void> {
  const now = nowSeconds();
  await db().execute({
    sql: `UPDATE posts SET first_comment_posted_at = ?, updated_at = ? WHERE id = ?`,
    args: [now, now, postId],
  });
}

/**
 * LinkedIn's scheduler now holds this post.
 *
 * It goes back to `scheduled`, which is what the customer already sees, with
 * the handover recorded so no pass writes it into the composer a second time.
 * The attempt counter is reset because preparing succeeded: confirming it after
 * the slot is a different job and deserves its own three tries.
 */
export async function markHandedToScheduler(postId: string): Promise<void> {
  const now = nowSeconds();
  await db().execute({
    sql: `UPDATE posts
             SET status = 'scheduled',
                 linkedin_scheduled_at = ?,
                 publish_claimed_at = NULL,
                 publish_attempts = 0,
                 error_message = NULL,
                 updated_at = ?
           WHERE id = ?`,
    args: [now, now, postId],
  });
}

/**
 * Hands a claimed post back without holding it against the post.
 *
 * Some reasons for not publishing are nothing to do with the post: the account
 * is signed out, the address is not ready. Counting those as attempts would
 * spend all three inside three minutes and mark somebody's post failed while
 * they were still walking to their phone to approve a sign-in. The attempt the
 * claim spent is given back.
 */
export async function unclaim(postId: string, message: string | null): Promise<void> {
  const now = nowSeconds();
  await db().execute({
    sql: `UPDATE posts
             SET status = 'queued',
                 publish_claimed_at = NULL,
                 publish_attempts = MAX(0, publish_attempts - 1),
                 error_message = ?,
                 updated_at = ?
           WHERE id = ? AND status = 'publishing'`,
    args: [message, now, postId],
  });
}

/**
 * A failed attempt: back in the queue, or given up on and said out loud.
 *
 * Never silent either way. A post the user believes went up and did not is the
 * worst outcome this system can produce, so the last attempt writes a sentence
 * they can read on the post itself.
 */
export async function failOrRequeue(
  post: { id: string; attempts: number; wasScheduled: boolean },
  message: string
): Promise<"failed" | "requeued"> {
  const now = nowSeconds();
  // A scheduled post may have spent PREPARE_TRY_BUDGET rounds on the native
  // scheduler before its slot ever arrived. Those rounds stay counted so
  // actionFor knows to stop preparing, and the cap grows by the same amount so
  // the direct path at the slot keeps its full three tries.
  const cap = post.wasScheduled
    ? MAX_PUBLISH_ATTEMPTS + PREPARE_TRY_BUDGET
    : MAX_PUBLISH_ATTEMPTS;
  if (post.attempts >= cap) {
    await db().execute({
      sql: `UPDATE posts
               SET status = 'failed', error_message = ?, publish_claimed_at = NULL, updated_at = ?
             WHERE id = ?`,
      args: [message, now, post.id],
    });
    return "failed";
  }

  // Back to where it came from, never to `queued` by default. A scheduled post
  // put back as queued would be published the moment the next pass looked at
  // it, which for a post due tomorrow morning means a day early.
  await db().execute({
    sql: post.wasScheduled
      ? `UPDATE posts
             SET publish_claimed_at = NULL, error_message = ?, updated_at = ?
           WHERE id = ? AND status = 'scheduled'`
      : `UPDATE posts
             SET status = 'queued', error_message = ?, publish_claimed_at = NULL, updated_at = ?
           WHERE id = ?`,
    args: [message, now, post.id],
  });
  return "requeued";
}

/** Gives up on a post outright, whatever state it was in. Only for reasons no retry can fix. */
export async function markFailed(postId: string, message: string): Promise<void> {
  const now = nowSeconds();
  await db().execute({
    sql: `UPDATE posts
             SET status = 'failed', error_message = ?, publish_claimed_at = NULL, updated_at = ?
           WHERE id = ?`,
    args: [message, now, postId],
  });
}
