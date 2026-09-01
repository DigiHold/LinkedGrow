import { log, logError } from "../logger.ts";
import { requestReSignIn } from "../db.ts";
import { closeSession, isSignedIn, openSession } from "../browser/driver.ts";
import type { Session } from "../browser/driver.ts";
import { allocationFor, isProduction } from "../proxy/allocation.ts";
import { NoSlotError, takeSlot } from "../safety/slots.ts";
import { withWatchdog } from "../safety/watchdog.ts";
import { currentVisit } from "../safety/rhythm.ts";
import { currentRun } from "../safety/run-context.ts";
import { withAddress, groupKey } from "../safety/ip-lock.ts";
import { dwell, randInt, sleep } from "../browser/human.ts";
import { readFollowerCount, readPostStats } from "../linkedin/insights.ts";
import { ensureProfileCaptured, storeAvatar } from "../linkedin/profile.ts";
import { db } from "../db.ts";
import { timezoneForCountry } from "../browser/fingerprint.ts";
import {
  forgetLeadFace,
  loadLeadFaces,
  loadPostsNeedingStats,
  needsFollowerReading,
  saveLeadFace,
  saveFollowerCount,
  saveStats,
  type StalePost,
} from "./store.ts";

/**
 * Keeping the analytics page true.
 *
 * The third loop, and the slowest, because nothing here is urgent. It opens
 * each account's session at most every half hour, only when a post's numbers
 * have actually gone stale, reads them, and closes. An account with no recent
 * posts never opens a browser at all.
 *
 * It is all reading, and reading your own posts is the most ordinary thing
 * anybody does on LinkedIn. It still takes the account's slot, still goes out
 * through the account's own address, and still moves at a human pace, because
 * the rule is about the session rather than about the risk of one action.
 */

/** How many posts one session looks at. Beyond this it stops looking like browsing. */
const MAX_POSTS_PER_SESSION = 8;

/** How many lead pictures one session copies. It is a background chore, not the job. */
const MAX_FACES_PER_SESSION = 30;

/** Between two posts, the pause of somebody clicking through their own history. */
const BETWEEN_POSTS_MS = { min: 6_000, max: 20_000 };

interface Account {
  id: string;
  workspaceId: string;
  country: string;
  timezone: string;
  profileUrl: string | null;
}

async function accountsFor(posts: StalePost[]): Promise<Map<string, Account>> {
  const wanted = new Set(posts.map((p) => p.linkedinAccountId).filter(Boolean) as string[]);
  const workspaces = new Set(posts.filter((p) => !p.linkedinAccountId).map((p) => p.workspaceId));
  const found = new Map<string, Account>();

  const rows = await db().execute({
    sql: `SELECT la.id, la.workspace_id, la.country, la.profile_url, a.timezone AS timezone
            FROM linkedin_accounts la
            LEFT JOIN agents a ON a.linkedin_account_id = la.id
           WHERE la.status = 'active'`,
  });

  const byWorkspace = new Map<string, Account>();
  for (const row of rows.rows) {
    const account: Account = {
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      country: String(row.country),
      timezone: row.timezone ? String(row.timezone) : timezoneForCountry(String(row.country)),
      profileUrl: row.profile_url ? String(row.profile_url) : null,
    };
    if (wanted.has(account.id)) found.set(account.id, account);
    // The oldest connected account of a workspace, for posts that predate the
    // column recording which one published them.
    if (workspaces.has(String(row.workspace_id)) && !byWorkspace.has(String(row.workspace_id))) {
      byWorkspace.set(String(row.workspace_id), account);
      found.set(`workspace:${String(row.workspace_id)}`, account);
    }
  }
  return found;
}

async function readAccount(account: Account, posts: StalePost[]): Promise<void> {
  const address = await allocationFor(account.id);
  if (!address && isProduction()) {
    log("insights deferred: no address allocated yet", { accountId: account.id });
    return;
  }

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
    if (!(await isSignedIn(session.context))) {
      // This used to return silently, on the belief that "publishing already
      // tells the customer". Publishing only ever wrote a line onto a post, so
      // an account with nothing queued was told nothing at all and its numbers
      // simply stopped moving. Ask for the session back here too: this loop
      // often meets the dead session first, hours before the next post is due.
      await requestReSignIn(
        account.id,
        "The session ended, so we are signing back in on this account's own address."
      );
      return;
    }

    await ensureProfileCaptured(session.page, account.id);

    const key = groupKey(account.id);

    // Once a day, the follower count off the profile. It is the Followers card
    // and the growth chart, both of which were reading zero, and it costs one
    // page load on a session that is already open.
    if (account.profileUrl && (await needsFollowerReading(account.id))) {
      try {
        const count = await withAddress(key, () =>
          readFollowerCount(session.page, account.profileUrl as string)
        );
        if (count !== null) await saveFollowerCount(account.workspaceId, account.id, count);
      } catch (error) {
        logError("reading the follower count failed", error, { accountId: account.id });
      }
    }

    // The leads found since the last pass still wear a LinkedIn URL for a face.
    // Copying them costs one fetch each and no page load, so it rides along on
    // a session that is already open.
    await copyLeadFaces(session);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      if (!post) continue;
      try {
        const stats = await withAddress(key, () => readPostStats(session.page, post.url));
        if (!stats) {
          log("could not read this post's numbers", { postId: post.postId });
          continue;
        }
        await saveStats(post.postId, stats);
      } catch (error) {
        logError("reading a post's numbers failed", error, { postId: post.postId });
      }
      if (i < posts.length - 1) {
        await sleep(randInt(BETWEEN_POSTS_MS.min, BETWEEN_POSTS_MS.max));
      }
    }
    await dwell(1500, 3000);
  } finally {
    await closeOnce();
  }
}

/**
 * Copies the faces the miner collected into our own bucket.
 *
 * Bounded per session, because it is a nice-to-have riding on a session that
 * exists for another reason, and a hundred image fetches in a row is not what
 * somebody reading their own analytics looks like.
 */
export async function copyLeadFaces(session: Session): Promise<void> {
  const faces = await loadLeadFaces(MAX_FACES_PER_SESSION);
  for (const face of faces) {
    try {
      const stored = await storeAvatar(session.page, face.remoteUrl, `linkedin/leads/${face.profileId}`);
      if (stored) await saveLeadFace(face.leadId, stored);
      else await forgetLeadFace(face.leadId);
    } catch (error) {
      logError("could not copy a lead's picture", error, { lead: face.leadId });
      await forgetLeadFace(face.leadId).catch(() => {});
    }
    await sleep(randInt(400, 1400));
  }
  if (faces.length) log("lead pictures copied", { count: faces.length });
}

export async function insightsPass(): Promise<void> {
  const stale = await loadPostsNeedingStats();
  // Faces are not post statistics and must not depend on them.
  //
  // This returned here whenever there was nothing to re-read, which for an
  // account that has never published is always. copyLeadFaces sits further
  // down this same function, so lead pictures were never copied into the
  // bucket on any account doing outreach and no posting: every lead kept a
  // LinkedIn URL that expires within days, and the dashboard showed grey
  // initials for ever. Found 2026-07-31 after Nicolas asked why 23 leads had
  // no avatar.
  if (!stale.length) return;

  const accounts = await accountsFor(stale);
  const byAccount = new Map<string, { account: Account; posts: StalePost[] }>();
  for (const post of stale) {
    const account =
      (post.linkedinAccountId ? accounts.get(post.linkedinAccountId) : undefined) ??
      accounts.get(`workspace:${post.workspaceId}`);
    if (!account) continue;
    const entry = byAccount.get(account.id);
    if (entry) entry.posts.push(post);
    else byAccount.set(account.id, { account, posts: [post] });
  }
  if (!byAccount.size) return;

  log("insights pass starting", { accounts: byAccount.size, posts: stale.length });

  await Promise.all(
    [...byAccount.values()].map(async ({ account, posts }) => {
      /**
       * Only while the account is on LinkedIn anyway.
       *
       * This loop was left out of the rhythm fix and it showed: on 2026-08-08,
       * the first day the new pacing ran, this opened a session at 13:58, then
       * 14:58, then 16:59, then 17:59, none of them inside a planned visit. A
       * browser opening on the hour, every hour, is a smaller version of the
       * exact pattern that got a customer's account restricted, and no proxy
       * hides it either.
       *
       * Nothing here is urgent. How a post did three hours ago is the same
       * number it will be at the next visit, and the numbers move slowly by
       * their nature. So it waits, and it costs the customer nothing.
       */
      if (!currentVisit(account.id, account.timezone)) return;

      let lease;
      try {
        lease = takeSlot(account.id);
      } catch (error) {
        if (error instanceof NoSlotError) return;
        throw error;
      }
      try {
        await withWatchdog(() => readAccount(account, posts.slice(0, MAX_POSTS_PER_SESSION)));
      } catch (error) {
        logError("insights account failed", error, { accountId: account.id });
      } finally {
        lease.release();
      }
    })
  );
}
