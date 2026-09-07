import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";
import { sleep, randInt } from "../browser/human.ts";
import { readPostStats } from "../linkedin/insights.ts";
import { readCreatorContent, readCreatorAudience, readDashboard } from "../linkedin/creator.ts";
import { saveStats, saveAccountInsights } from "../insights/store.ts";

/**
 * Reads one account's numbers now, instead of waiting for its turn.
 *
 * The insights loop walks every account in series and leaves 40 to 120 seconds between actions, so
 * a fleet of six accounts takes well over an hour to come round. That pacing is the thing that
 * keeps these accounts alive and it is not going to change. But when somebody is looking at a page
 * of zeros and wants to know whether the fix worked, an hour is not an answer.
 *
 * So: one account, its own session, its own address, the same pacing between actions, and nothing
 * the loop would not have done. It only ever brings a reading forward.
 *
 *   node --experimental-strip-types src/tools/insights-live-check.ts <accountId>
 *
 * The worker must be stopped first. The slot lock lives in one process, so two processes can open
 * two Chromes on one profile, which corrupts it.
 */

async function account(accountId: string) {
  const { rows } = await db().execute({
    sql: `SELECT l.id, l.country, l.workspace_id,
                 p.host, p.port, p.username_encrypted, p.password_encrypted, p.last_exit_ip
            FROM linkedin_accounts l
            LEFT JOIN proxy_allocations p
              ON p.linkedin_account_id = l.id AND p.status = 'active'
           WHERE l.id = ? LIMIT 1`,
    args: [accountId],
  });
  const row = rows[0];
  if (!row) throw new Error(`No account ${accountId}`);
  if (!row.host) throw new Error("That account has no active address bound to it.");
  return {
    country: String(row.country ?? "FR"),
    workspaceId: String(row.workspace_id),
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")) ?? "",
      password: decryptSecret(String(row.password_encrypted ?? "")) ?? "",
      expectedIp: String(row.last_exit_ip ?? ""),
    },
  };
}

/** Its published posts that carry a LinkedIn address, newest first. */
async function postsOf(accountId: string, limit: number) {
  const { rows } = await db().execute({
    sql: `SELECT p.id, p.linkedin_post_url AS url
            FROM posts p
           WHERE p.status = 'published'
             AND p.linkedin_post_url IS NOT NULL
             AND p.linkedin_account_id = ?
           ORDER BY p.published_at DESC
           LIMIT ?`,
    args: [accountId, limit],
  });
  return rows.map((r) => ({ id: String(r.id), url: String(r.url) }));
}

async function main(): Promise<void> {
  const accountId = process.argv[2] ?? "";
  const limit = Number(process.argv[3] ?? 10);
  if (!accountId) {
    console.log("usage: insights-live-check.ts <accountId> [howManyPosts]");
    process.exit(1);
  }

  const acct = await account(accountId);
  console.log(`address ${acct.allocation.server} expecting ${acct.allocation.expectedIp}`);

  const session = await openSession(
    { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
    acct.allocation
  );
  try {
    if (!(await isSignedIn(session.context))) throw new Error("that account is signed out");
    const page = session.page;

    const content = await readCreatorContent(page);
    const audience = await readCreatorAudience(page);
    const dashboard = await readDashboard(page);
    if (content || audience || dashboard) {
      await saveAccountInsights(accountId, {
        impressions7d: content?.impressions ?? dashboard?.impressions7d ?? null,
        membersReached: content?.membersReached ?? null,
        inNetworkPercent: content?.inNetworkPercent ?? null,
        reactions: content?.reactions ?? null,
        comments: content?.comments ?? null,
        reposts: content?.reposts ?? null,
        saves: content?.saves ?? null,
        followers: audience?.followers ?? dashboard?.followers ?? null,
        profileViewers: dashboard?.profileViewers ?? null,
        searchAppearances: dashboard?.searchAppearances ?? null,
        demographics: audience?.demographics ?? [],
      });
      console.log(
        `account: ${content?.impressions ?? "?"} impressions, ${audience?.followers ?? "?"} followers, ` +
          `${dashboard?.profileViewers ?? "?"} profile viewers, ${audience?.demographics.length ?? 0} slices`
      );
    }

    const posts = await postsOf(accountId, limit);
    console.log(`${posts.length} posts to read`);
    for (const post of posts) {
      const stats = await readPostStats(page, post.url);
      if (!stats) {
        console.log(`  ${post.id}: the page did not answer`);
      } else {
        await saveStats(post.id, stats);
        console.log(
          `  ${post.id}: ${stats.impressions ?? "?"} impressions, ${stats.reactions} reactions, ` +
            `${stats.comments} comments${stats.imageUrl ? ", picture kept" : ""}`
        );
      }
      // The same gap the loop leaves, because the account cannot tell which process is driving it.
      await sleep(randInt(40_000, 120_000));
    }
  } finally {
    await closeSession(session).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
