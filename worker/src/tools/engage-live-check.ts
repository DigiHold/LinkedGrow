import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";
import { dwell, scrollHuman } from "../browser/human.ts";
import type { AgentContext } from "../config.ts";
import { draftComment } from "../engage/draft.ts";
import { readPost } from "../engage/read.ts";
import { readLanguage } from "../engage/language.ts";
import { freshPosts } from "../engage/urn.ts";
import { commentPass } from "../engage/pass.ts";
import { checkFacts } from "../engage/verify.ts";
import { engagePost } from "../engage/act.ts";

/**
 * The supervised rehearsal for commenting, and then the one approved comment.
 *
 * Two modes on purpose, because Nicolas approves the text and not the intention. `draft` opens the
 * post on his own account through his own address, reads it, writes a comment, runs the gate and
 * the fact check, and prints it. It writes nothing to LinkedIn. `post` takes the exact text that
 * came back and puts THAT on the page. It never redrafts, because a second draft is not the one
 * that was approved.
 *
 *   node --experimental-strip-types src/tools/engage-live-check.ts draft <accountId> <postUrl>
 *   node --experimental-strip-types src/tools/engage-live-check.ts post  <accountId> <postUrl> "<text>"
 */

async function account(accountId: string) {
  const { rows } = await db().execute({
    sql: `SELECT l.id, l.country, l.profile_url, l.workspace_id,
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
    profileUrl: row.profile_url ? String(row.profile_url) : "",
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")) ?? "",
      password: decryptSecret(String(row.password_encrypted ?? "")) ?? "",
      expectedIp: String(row.last_exit_ip ?? ""),
    },
  };
}

/** An agent on this account, so the model spend is metered where it belongs rather than nowhere. */
async function contextFor(
  accountId: string,
  workspaceId: string,
  profileUrl: string
): Promise<{ ctx: AgentContext; facts: string }> {
  const { rows } = await db().execute({
    sql: `SELECT id, comment_facts, comment_enabled FROM agents
           WHERE linkedin_account_id = ? ORDER BY created_at LIMIT 1`,
    args: [accountId],
  });
  const row = rows[0];
  const agentId = row ? String(row.id) : "";
  if (!agentId) throw new Error("That account has no agent, so there is nothing to meter against.");
  if (!Number(row?.comment_enabled ?? 0)) {
    throw new Error("comment_enabled is 0 on that agent. The feature is off for it, on purpose.");
  }
  const facts = row?.comment_facts ? String(row.comment_facts) : "";
  if (!facts.trim()) {
    console.log("WARNING: this agent has no fact sheet, so it may make no personal claim at all.");
  }
  return {
    facts,
    ctx: {
      agentId,
      workspaceId,
      linkedinAccountId: accountId,
      ownProfileUrl: profileUrl,
      country: "FR",
      tier: "free",
      agentsOnAccount: 1,
    } as AgentContext,
  };
}

async function main(): Promise<void> {
  const mode = (process.argv[2] ?? "").toLowerCase();
  const accountId = process.argv[3] ?? "";
  const postUrl = process.argv[4] ?? "";
  if (!["draft", "post", "feed", "pass"].includes(mode) || !accountId || (["draft", "post"].includes(mode) && !postUrl)) {
    console.log("usage: engage-live-check.ts feed|pass|draft|post <accountId> [postUrl] [approved text]");
    process.exit(1);
  }

  /**
   * One whole pass, outside the rhythm, with somebody watching.
   *
   * Everything the loop does: publish what was already approved, read the notifications, draft for
   * the freshest posts, and mail the owner. It opens its own session, so it is not run alongside
   * the worker.
   */
  if (mode === "pass") {
    /**
     * pass <accountId> [maxAgeMinutes] [postUrl]
     *
     * argv[4] is the fourth argument, which the earlier version read as argv[5] and therefore never
     * saw: the wide window that looked like it worked was the 45 minute default all along.
     */
    const maxAge = Number(process.argv[4] ?? 0);
    const only = process.argv[5] ?? "";
    await commentPass({
      ignoreVisit: true,
      onlyAccountId: accountId,
      ...(maxAge > 0 ? { maxAgeMinutes: maxAge } : {}),
      ...(only ? { onlyPostUrl: only } : {}),
    });
    console.log("pass finished. Check /dashboard/comments and your inbox.");
    return;
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

    /**
     * What is on the feed right now, newest first, with the age taken from each post's own
     * identifier rather than from the "2h" LinkedIn writes in the reader's language.
     *
     * Read only: it opens one page, scrolls it the way a person does, and prints. This is the shape
     * discover.ts will take, proven on the real page before it becomes a loop.
     */
    if (mode === "feed") {
      /**
       * Both pages, because only one of them answers.
       *
       * The feed on the rebuilt build carries exactly one identifier for a whole page of posts, so
       * it cannot be the source. The notifications page puts one in the href of every card, which
       * is why the bell is not a convenience here but the mechanism itself.
       */
      const pages = [
        "https://www.linkedin.com/notifications/",
        "https://www.linkedin.com/feed/",
      ];
      const carriers = new Set<string>();
      for (const url of pages) {
        await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
        await dwell(2500, 4500);
        await scrollHuman(page, 3);
        await dwell(1500, 3000);
        const found = await page.evaluate(() => {
          const hits = new Set<string>();
          const add = (value: string) => {
            let text = value;
            try {
              text = decodeURIComponent(value);
            } catch {
              /* a malformed escape still matches the plain form below */
            }
            for (const hit of text.match(/urn:li:activity:\d{6,25}/g) ?? []) hits.add(hit);
          };
          for (const el of Array.from(document.querySelectorAll("*"))) {
            for (const attr of Array.from(el.attributes)) add(attr.value);
          }
          return [...hits];
        });
        console.log(`${url} -> ${found.length} identifiers`);
        for (const hit of found) carriers.add(hit);
      }
      const fresh = freshPosts([...carriers], { maxAgeMinutes: 60 * 48 });
      console.log(`\n${carriers.size} identifiers in total, ${fresh.length} under 48h:\n`);
      for (const p of fresh.slice(0, 25)) {
        console.log(`${String(p.minutesOld).padStart(5)} min  ${p.url}`);
      }
      return;
    }

    if (mode === "post") {
      const approved = process.argv[5] ?? "";
      if (!approved.trim()) throw new Error("post mode needs the approved text as the last argument");
      const result = await engagePost(page, postUrl, approved);
      console.log(`commented=${result.commented} liked=${result.liked}`);
      return;
    }

    await page.goto(postUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
    await dwell(2500, 5000);
    await scrollHuman(page, 1);
    await dwell(1500, 3000);

    const post = await readPost(page);
    if (!post) {
      console.log("SKIP: the post block could not be found, so nothing was read and nothing written.");
      return;
    }
    console.log(`\n--- post as the agent reads it (${post.text.length} chars) ---`);
    console.log(`author: ${post.author}`);
    console.log(post.text.slice(0, 1200));

    const language = readLanguage(post.text);
    console.log(`\nlanguage: ${language.english ? "English" : "not English"} (${language.reason})`);
    if (!language.english) {
      console.log("SKIP: the agent only comments in English, under English posts.");
      return;
    }

    const { ctx, facts } = await contextFor(accountId, acct.workspaceId, acct.profileUrl);
    const outcome = await draftComment(ctx, post, { facts });
    console.log(`\n--- draft ---`);
    console.log(`attempts=${outcome.attempts}`);
    for (const fails of outcome.rejections) console.log(`gate refused: ${fails.join(" | ")}`);
    if (!outcome.posted) {
      console.log(`SKIP: ${outcome.reason}`);
      return;
    }

    const verdict = await checkFacts(ctx, outcome.posted, facts);
    console.log(`fact check: ${verdict.clean ? "CLEAN" : `unsure. ${verdict.note}`}`);
    console.log(`\nCOMMENT (${outcome.posted.split(/\s+/).length} words):\n${outcome.posted}\n`);
    console.log("Nothing was posted. Run the same command with `post` and this exact text to publish it.");
  } finally {
    await closeSession(session).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
