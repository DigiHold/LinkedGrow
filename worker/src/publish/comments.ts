import { log, logError } from "../logger.ts";
import { closeSession, isSignedIn, openSession, ProxyMismatchError } from "../browser/driver.ts";
import type { Session } from "../browser/driver.ts";
import { allocationFor, isProduction } from "../proxy/allocation.ts";
import { NoSlotError, takeSlot } from "../safety/slots.ts";
import { withWatchdog } from "../safety/watchdog.ts";
import { currentRun } from "../safety/run-context.ts";
import { groupKey, withAddress } from "../safety/ip-lock.ts";
import { dwell, randInt, sleep } from "../browser/human.ts";
import { ensureProfileCaptured } from "../linkedin/profile.ts";
import { db } from "../db.ts";
import { findPublishedUrl, postFirstComment } from "../linkedin/publish.ts";
import {
  accountForPost,
  loadPendingFirstComments,
  markFirstCommentPosted,
  MAX_FIRST_COMMENT_ATTEMPTS,
  noteFirstCommentAttempt,
  noteFirstCommentGaveUp,
  recordPostUrl,
  type PendingComment,
  type PublishAccount,
} from "./store.ts";

/**
 * The first comment, for the posts whose own session did not manage it.
 *
 * It is a sweep of its own rather than a fourth action inside the publish pass,
 * and the reason is the one rule this side of the product cannot break: these
 * posts are already published. Every state-writing call in that pass
 * (`claimPost`, `failOrRequeue`, `releaseScheduled`, `unclaim`) moves a post
 * back towards the queue, and a published post that re-enters the queue is
 * published twice. Nothing in this file can reach any of them. It writes
 * exactly three things: the attempt counter, the URL when it was missing, and
 * the timestamp once the comment is up.
 *
 * What it fixes, from 2026-09-22 and 2026-09-23 on the live worker:
 *
 *   - a post published while the profile feed still lagged came back with no
 *     URL, and the comment step was skipped outright because there was nothing
 *     to open. The post is on the profile by the next pass, so the URL is found
 *     and the comment goes up.
 *   - "first comment: the box did not take the comment, leaving it", which is
 *     the same TipTap mount that makes the post composer miss, and which the
 *     post itself survives by being requeued. The comment had no such retry.
 */

/** Posts served per sweep, across all accounts. */
const SWEEP_LIMIT = 10;

/** Comments written in one session, so a backlog cannot hold a browser open. */
const MAX_COMMENTS_PER_SESSION = 2;

type Address = Awaited<ReturnType<typeof allocationFor>>;

interface AccountWork {
  account: PublishAccount;
  posts: PendingComment[];
}

async function commentOne(
  session: Session,
  account: PublishAccount,
  post: PendingComment
): Promise<void> {
  let url = post.postUrl;
  if (!url && !account.profileUrl) {
    // No URL and no profile to look for one on. Nothing was attempted, so
    // nothing is counted: this post waits for the pass that knows the profile.
    log("first comment retry: no profile to read the post back from", { postId: post.id });
    return;
  }

  // The try is spent before it is made. A crash mid-attempt then costs a try
  // rather than looping on this post forever.
  await noteFirstCommentAttempt(post.id);
  const spent = post.attempts + 1;
  // The last one that fails is the one that has to say so on the post.
  const giveUpIfDone = async () => {
    if (spent >= MAX_FIRST_COMMENT_ATTEMPTS) await noteFirstCommentGaveUp(post.id);
  };

  if (!url) {
    url = await findPublishedUrl(session.page, account.profileUrl as string, post.content);
    if (!url) {
      log("first comment retry: the post is still not on the profile", { postId: post.id });
      await giveUpIfDone();
      return;
    }
    await recordPostUrl(post.id, url);
    log("first comment retry: found the post that had no URL", { postId: post.id, url });
  }

  const landed = await postFirstComment(session.page, url, post.firstComment).catch(
    (error: unknown) => {
      logError("first comment retry failed", error, { postId: post.id });
      return false;
    }
  );
  if (landed) {
    await markFirstCommentPosted(post.id);
    log("first comment posted on a later pass", { postId: post.id });
    return;
  }
  await giveUpIfDone();
}

async function runAccount(work: AccountWork, address: Address): Promise<void> {
  let { account } = work;
  const session = await openSession(
    { linkedinAccountId: account.id, country: account.country, timezone: account.timezone },
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
    // A session that has ended is not this post's problem, and there is nothing
    // to release: the post is published and staying published. The publish pass
    // is what asks for the account back.
    if (!(await isSignedIn(session.context))) return;

    // The profile URL is how a post with no URL is found again, and an account
    // with no agent has nothing else that ever learns it.
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
    const serve = work.posts.slice(0, MAX_COMMENTS_PER_SESSION);
    for (let i = 0; i < serve.length; i++) {
      const post = serve[i];
      if (!post) continue;
      // The same address lock the agent and the publisher take, so a comment
      // and an invitation never leave this household in the same instant.
      await withAddress(key, () => commentOne(session, account, post)).catch((error: unknown) =>
        logError("first comment retry failed", error, { postId: post.id })
      );
      if (i < serve.length - 1) await sleep(randInt(45_000, 120_000));
    }
    await dwell(1500, 3500);
  } finally {
    await closeOnce();
  }
}

/** One sweep: whose comment is missing, on which account, and go and write it. */
export async function firstCommentPass(): Promise<void> {
  const pending = await loadPendingFirstComments(SWEEP_LIMIT);
  if (!pending.length) return;

  const byAccount = new Map<string, AccountWork>();
  for (const post of pending) {
    const { account } = await accountForPost(post);
    // No account, or one that is out: the post keeps its comment and its tries
    // for a pass where the account is back.
    if (!account) continue;
    const existing = byAccount.get(account.id);
    if (existing) existing.posts.push(post);
    else byAccount.set(account.id, { account, posts: [post] });
  }
  if (!byAccount.size) return;

  log("first comment sweep starting", {
    accounts: byAccount.size,
    posts: [...byAccount.values()].reduce((n, w) => n + w.posts.length, 0),
  });

  await Promise.all(
    [...byAccount.values()].map(async (work) => {
      const address = await allocationFor(work.account.id);
      if (!address && isProduction()) return;

      let lease;
      try {
        lease = takeSlot(work.account.id);
      } catch (error) {
        // The account is busy publishing or running its agent. The comment is
        // owed by a post that is already up, so it can wait for the next pass.
        if (error instanceof NoSlotError) return;
        throw error;
      }

      try {
        await withWatchdog(() => runAccount(work, address));
      } catch (error) {
        if (error instanceof ProxyMismatchError) {
          log("first comment sweep deferred: the address could not be verified", {
            accountId: work.account.id,
          });
        } else {
          logError("first comment sweep failed", error, { accountId: work.account.id });
        }
      } finally {
        lease.release();
      }
    })
  );
}
