import { log, logError } from "../logger.ts";
import { closeSession, isSignedIn, openSession, ProxyMismatchError } from "../browser/driver.ts";
import type { Session } from "../browser/driver.ts";
import { allocationFor, isProduction } from "../proxy/allocation.ts";
import { NoSlotError, takeSlot } from "../safety/slots.ts";
import { withWatchdog, RunStalled } from "../safety/watchdog.ts";
import { currentRun } from "../safety/run-context.ts";
import { withAddress, groupKey } from "../safety/ip-lock.ts";
import { dwell, randInt, sleep } from "../browser/human.ts";
import { ensureProfileCaptured } from "../linkedin/profile.ts";
import { db } from "../db.ts";
import {
  downloadAttachment,
  findPublishedUrl,
  likePost,
  postFirstComment,
  publishPost,
  PublishError,
  ScheduleUnavailableError,
} from "../linkedin/publish.ts";
import {
  MAX_PUBLISH_ATTEMPTS,
  accountForPost,
  actionFor,
  claimPost,
  failOrRequeue,
  loadDuePosts,
  markFailed,
  markFirstCommentPosted,
  markHandedToScheduler,
  releaseVideo,
  markPublished,
  mediaForPost,
  releaseScheduled,
  releaseStaleClaims,
  unclaim,
  type DuePost,
  type PostAction,
  type PublishAccount,
} from "./store.ts";

/**
 * The publishing half of the worker.
 *
 * It is a second loop rather than a step inside the agent pass, and the two
 * differences are the reason. It runs every minute instead of every five,
 * because somebody who presses Publish is watching the screen; and it runs for
 * accounts that have no agent at all, which the agent pass by definition never
 * looks at.
 *
 * What it does not do is open a second browser. Slots are per LinkedIn account
 * and re-entrant, so an account already being driven by its agent is skipped
 * this minute and served the next one. Two Chromes on one profile is the single
 * easiest thing for LinkedIn to spot, and no feature is worth it.
 *
 * Three jobs come through here, decided by `actionFor`:
 *
 *   publish  somebody pressed Publish, or a scheduled post missed its window
 *   prepare  write tomorrow's post tonight and let LinkedIn's own scheduler hold it
 *   confirm  LinkedIn has published a scheduled one, go and find it and comment
 */

/** A pause between two posts from the same account, because nobody posts twice in a second. */
const BETWEEN_POSTS_MS = { min: 45_000, max: 120_000 };

/**
 * How long to wait before the first comment.
 *
 * Never in the same breath as the post: LinkedIn measures the gap, a comment
 * that lands in the same second reads as automation, and a person who wants to
 * add a link goes and does it a minute or two later.
 */
const FIRST_COMMENT_DELAY_MS = { min: 60_000, max: 210_000 };

/**
 * How many posts one account works on per session.
 *
 * Two reasons for a small number. A session has a 90 minute ceiling from the
 * watchdog, and a video upload plus a comment delay plus the gap between posts
 * can each run to minutes, so a long backlog would hit that ceiling and be cut
 * off mid-post. And nobody publishes twenty times in an hour. The rest waits
 * for the next pass, which is a minute away.
 */
const MAX_POSTS_PER_SESSION = 3;

const SIGNED_OUT_MESSAGE =
  "Your LinkedIn session has expired. Sign in once from the dashboard and this post goes out on its own.";

const UNVERIFIED_NOTE =
  "This went to LinkedIn but we could not find it on your feed afterwards. Check your profile before posting it again.";

interface Job {
  post: DuePost;
  action: PostAction;
}

interface AccountWork {
  account: PublishAccount;
  jobs: Job[];
}

type Address = Awaited<ReturnType<typeof allocationFor>>;

/**
 * Writes one post: either published now, or handed to LinkedIn's scheduler.
 *
 * The order is deliberate. The post is marked published the moment it is
 * confirmed, before the first comment is attempted, so a comment that fails
 * never costs a post that succeeded and never causes it to be written twice.
 */
async function writeOne(
  session: Session,
  account: PublishAccount,
  post: DuePost,
  action: "publish" | "prepare",
  address: Address
): Promise<void> {
  const media = await mediaForPost(post);
  let cleanup: (() => void) | null = null;

  try {
    let filePath: string | null = null;
    if (media) {
      const file = await downloadAttachment(media.url, media.fileName, address);
      filePath = file.path;
      cleanup = file.cleanup;
    }

    const result = await publishPost(session.page, {
      text: post.content,
      filePath,
      mimeType: media?.mimeType ?? null,
      profileUrl: account.profileUrl,
      scheduleFor:
        action === "prepare"
          ? { at: new Date(post.scheduledAt * 1000), timeZone: account.timezone }
          : undefined,
    });

    if (result.scheduled) {
      await markHandedToScheduler(post.id);
      log("post handed to LinkedIn's scheduler", {
        postId: post.id,
        slot: new Date(post.scheduledAt * 1000).toISOString(),
      });
      // LinkedIn took the upload when it accepted the schedule, so it holds the
      // video from here and there is no path back through this function that
      // would need ours again.
      await releaseVideo(post).catch((error: unknown) =>
        logError("could not remove the video from storage", error, { postId: post.id })
      );
      return;
    }

    await markPublished(post.id, result.url, result.verified ? null : UNVERIFIED_NOTE);
    log("post published", { postId: post.id, verified: result.verified, url: result.url });
    // LinkedIn holds its own copy now, so ours is 200MB of dead weight. Done
    // after the post is marked published, never before: a delete that raced a
    // failed publish would leave a retry with nothing to upload.
    await releaseVideo(post).catch((error: unknown) =>
      logError("could not remove the video from storage", error, { postId: post.id })
    );
    await afterPublishing(session, post, result.url);
  } finally {
    cleanup?.();
  }
}

/**
 * The first comment, after the post is already safely marked published.
 *
 * Skipped when there is no URL, because a comment can only be left on a post we
 * can actually open, and guessing which post to comment on is how a comment
 * ends up under the wrong one.
 */
async function afterPublishing(
  session: Session,
  post: DuePost,
  url: string | null
): Promise<void> {
  if (!url) return;
  const wantsComment = Boolean(post.firstComment) && !post.firstCommentPostedAt;
  if (!wantsComment && !post.autoLike) return;

  // One trip back to the post, a minute or two later, which is when somebody
  // returns to it. Both things happen on that visit rather than each on its own.
  await sleep(randInt(FIRST_COMMENT_DELAY_MS.min, FIRST_COMMENT_DELAY_MS.max));

  if (wantsComment) {
    const landed = await postFirstComment(
      session.page,
      url,
      post.firstComment as string
    ).catch((error: unknown) => {
      logError("first comment failed", error, { postId: post.id });
      return false;
    });
    if (landed) await markFirstCommentPosted(post.id);
    await sleep(randInt(8_000, 25_000));
  }

  if (post.autoLike) {
    await likePost(session.page, url).catch((error: unknown) => {
      logError("reacting to the post failed", error, { postId: post.id });
      return false;
    });
  }
}

/**
 * Goes to look for a post LinkedIn published on its own, at the time it said.
 *
 * Nothing is written here: the post is already live, put there by LinkedIn's
 * scheduler hours after we handed it over. This reads it back so the dashboard
 * has its URL, and then leaves the first comment, which could not happen
 * earlier because there was no post to comment on.
 */
async function confirmOne(session: Session, account: PublishAccount, post: DuePost): Promise<void> {
  if (!account.profileUrl) {
    // Nothing to read back from. It went to LinkedIn's scheduler and LinkedIn
    // will have published it, so say so rather than pretending it failed.
    await markPublished(post.id, null, UNVERIFIED_NOTE);
    return;
  }

  const url = await findPublishedUrl(session.page, account.profileUrl, post.content);
  if (!url) {
    if (post.attempts >= MAX_PUBLISH_ATTEMPTS) {
      // LinkedIn accepted the schedule, so it almost certainly went up and we
      // simply cannot see it. Marking it failed would have the user post it
      // again by hand, which is the one outcome worse than not having the URL.
      await markPublished(post.id, null, UNVERIFIED_NOTE);
      return;
    }
    await releaseScheduled(
      post.id,
      "Waiting for LinkedIn to show this post on your profile.",
      true
    );
    return;
  }

  await markPublished(post.id, url, null);
  log("scheduled post confirmed on LinkedIn", { postId: post.id, url });
  // Second chance at it: the delete at hand-off is the one that normally runs,
  // and this catches the pass where the bucket was briefly unreachable.
  await releaseVideo(post).catch((error: unknown) =>
    logError("could not remove the video from storage", error, { postId: post.id })
  );
  await afterPublishing(session, post, url);
}

/** Everything one account has to do this minute, in one session. */
async function runAccount(work: AccountWork, address: Address): Promise<void> {
  let { account } = work;
  const { jobs } = work;

  const session = await openSession(
    {
      linkedinAccountId: account.id,
      country: account.country,
      timezone: account.timezone,
    },
    address
  );

  const run = currentRun();
  let closed = false;
  const closeOnce = async () => {
    if (closed) return;
    closed = true;
    await closeSession(session);
  };
  if (run) run.closeBrowser = closeOnce;

  try {
    if (!(await isSignedIn(session.context))) {
      // Not the post's fault, so it costs the post nothing. Counting this would
      // burn all three attempts inside three minutes and mark somebody's post
      // failed while they were still walking to their phone to approve a code.
      for (const { post } of jobs) {
        if (post.wasScheduled) await releaseScheduled(post.id, SIGNED_OUT_MESSAGE);
        else await unclaim(post.id, SIGNED_OUT_MESSAGE);
      }
      return;
    }

    // A content-only customer has no agent, so this is the only place that ever
    // learns their profile URL, and without it a published post can never be
    // read back and confirmed.
    await ensureProfileCaptured(session.page, account.id);
    if (!account.profileUrl) {
      const { rows } = await db().execute({
        sql: `SELECT profile_url FROM linkedin_accounts WHERE id = ? LIMIT 1`,
        args: [account.id],
      });
      const found = rows[0]?.profile_url;
      if (found) account = { ...account, profileUrl: String(found) };
    }

    const key = groupKey(account.id);
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      if (!job) continue;
      const { post, action } = job;
      try {
        // The address lock, the same one the agent actions take, so a post and
        // an invitation never leave this household in the same instant.
        await withAddress(key, async () => {
          if (action === "confirm") return confirmOne(session, account, post);
          if (action === "wait") return;
          return writeOne(session, account, post, action, address);
        });
      } catch (error) {
        await handleJobFailure(post, action, error);
      }
      if (i < jobs.length - 1) {
        await sleep(randInt(BETWEEN_POSTS_MS.min, BETWEEN_POSTS_MS.max));
      }
    }
    await dwell(1500, 3500);
  } finally {
    await closeOnce();
  }
}

/**
 * What a failed job costs the post, which depends entirely on what failed.
 *
 * A scheduler that could not be driven costs nothing at all: the post is not
 * due yet, it stays scheduled, and it goes out the direct way at its slot. That
 * distinction is the safety property of the whole feature, because the
 * alternative reading of "scheduling failed" is "publish it now", and now is
 * hours before the customer asked.
 */
async function handleJobFailure(
  post: DuePost,
  action: PostAction,
  error: unknown
): Promise<void> {
  if (error instanceof ScheduleUnavailableError) {
    logError("LinkedIn's scheduler could not be used, falling back to posting at the slot", error, {
      postId: post.id,
    });
    await releaseScheduled(post.id, null).catch(() => {});
    return;
  }

  const message =
    error instanceof PublishError
      ? error.message
      : "Something went wrong while publishing this post. It will try again shortly.";
  const outcome = await failOrRequeue(post, message);
  logError("publish attempt failed", error, { postId: post.id, action, outcome });
}

/**
 * One sweep: free the dead claims, work out what each post needs, do it.
 *
 * Grouped by account and parallel across accounts, the same shape as the agent
 * pass, because the constraint is identical: one browser per LinkedIn account
 * at a time, and no waiting between customers.
 */
export async function publishPass(): Promise<void> {
  const freed = await releaseStaleClaims();
  if (freed > 0) log("freed posts left claimed by a dead worker", { count: freed });

  const candidates = await loadDuePosts();
  if (!candidates.length) return;

  const byAccount = new Map<string, AccountWork>();
  let waitingForAccount = 0;
  for (const post of candidates) {
    const account = await accountForPost(post);
    if (!account) {
      // The owner has no connected LinkedIn account right now. The promise
      // made at the v2 cutover is that a scheduled post WAITS for its owner
      // to reconnect, so the row stays scheduled and a later pass, possibly
      // days from now, finds the account and publishes at the slot. Failing
      // it here would kill a post whose slot has not even arrived.
      waitingForAccount += 1;
      continue;
    }
    // The account's own clock decides whether now is a reasonable hour to be
    // writing a post, so the decision needs the account, not just the post.
    const action = actionFor(post, account.timezone);
    if (action === "wait") continue;

    const existing = byAccount.get(account.id);
    if (existing) existing.jobs.push({ post, action });
    else byAccount.set(account.id, { account, jobs: [{ post, action }] });
  }
  if (waitingForAccount > 0) {
    log("posts waiting for a LinkedIn reconnection", { count: waitingForAccount });
  }
  if (!byAccount.size) return;

  log("publish pass starting", {
    accounts: byAccount.size,
    jobs: [...byAccount.values()].reduce((n, w) => n + w.jobs.length, 0),
  });

  await Promise.all(
    [...byAccount.values()].map(async (work) => {
      // The address comes before the claim. In production an account without
      // one waits rather than publishing from the server's own IP, and a post
      // that waits must not have spent an attempt doing it.
      const address = await allocationFor(work.account.id);
      if (!address && isProduction()) {
        log("publish deferred: no address allocated yet", { accountId: work.account.id });
        return;
      }

      let lease;
      try {
        lease = takeSlot(work.account.id);
      } catch (error) {
        if (error instanceof NoSlotError) {
          log("no slot free, publishing on the next pass", { accountId: work.account.id });
          return;
        }
        throw error;
      }

      // Claim inside the slot, not before it: a post claimed and then skipped
      // for want of a browser would have spent one of its three attempts. And
      // only as many as one session should carry, so the rest stay untouched in
      // the queue rather than claimed and then abandoned at the time ceiling.
      const claimed: Job[] = [];
      for (const job of work.jobs.slice(0, MAX_POSTS_PER_SESSION)) {
        if (await claimPost(job.post, work.account.id)) {
          claimed.push({ ...job, post: { ...job.post, attempts: job.post.attempts + 1 } });
        }
      }
      if (work.jobs.length > MAX_POSTS_PER_SESSION) {
        log("more posts than one session carries, the rest go next pass", {
          accountId: work.account.id,
          deferred: work.jobs.length - MAX_POSTS_PER_SESSION,
        });
      }

      if (!claimed.length) {
        lease.release();
        return;
      }

      try {
        await withWatchdog(() => runAccount({ account: work.account, jobs: claimed }, address));
      } catch (error) {
        const message =
          error instanceof RunStalled
            ? "Publishing stopped responding and was cut off. It will try again shortly."
            : error instanceof ProxyMismatchError
              ? "The dedicated address for this account could not be verified, so nothing was published."
              : "Something went wrong while publishing. It will try again shortly.";
        logError("publish account failed", error, { accountId: work.account.id });
        for (const { post } of claimed) {
          await failOrRequeue(post, message).catch(() => {});
        }
      } finally {
        lease.release();
      }
    })
  );
}
