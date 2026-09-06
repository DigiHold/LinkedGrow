import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";
import { dwell, scrollHuman } from "../browser/human.ts";
import type { AgentContext } from "../config.ts";
import { draftComment, type PostToAnswer } from "../engage/draft.ts";
import { inventsNothing } from "../engage/verify.ts";
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

/**
 * The post, as the agent would read it.
 *
 * The whole visible text of the article region, trimmed. A permalink puts the post above its
 * comments, so the first part of it is the post; the comments that follow are context the model is
 * allowed to see and is told never to answer.
 */
async function readPost(page: import("patchright").Page): Promise<PostToAnswer> {
  const text = await page
    .locator("main")
    .innerText()
    .catch(() => "");
  const cleaned = text.replace(/\n{3,}/g, "\n\n").trim();
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  return {
    author: lines[0] ?? "unknown",
    headline: lines[1] ?? "",
    text: cleaned.slice(0, 4000),
  };
}

async function main(): Promise<void> {
  const mode = (process.argv[2] ?? "").toLowerCase();
  const accountId = process.argv[3] ?? "";
  const postUrl = process.argv[4] ?? "";
  if (!["draft", "post"].includes(mode) || !accountId || !postUrl) {
    console.log("usage: engage-live-check.ts draft|post <accountId> <postUrl> [approved text]");
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
    console.log(`\n--- post as the agent reads it (${post.text.length} chars) ---`);
    console.log(post.text.slice(0, 1200));

    const { ctx, facts } = await contextFor(accountId, acct.workspaceId, acct.profileUrl);
    const outcome = await draftComment(ctx, post, { facts });
    console.log(`\n--- draft ---`);
    console.log(`attempts=${outcome.attempts}`);
    for (const fails of outcome.rejections) console.log(`gate refused: ${fails.join(" | ")}`);
    if (!outcome.posted) {
      console.log(`SKIP: ${outcome.reason}`);
      return;
    }

    const clean = await inventsNothing(ctx, outcome.posted, facts);
    console.log(`fact check: ${clean ? "CLEAN" : "INVENTED, refused"}`);
    if (!clean) {
      console.log("SKIP: the fact check refused it");
      return;
    }
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
