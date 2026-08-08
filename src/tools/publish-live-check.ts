import "dotenv/config";
import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";

/**
 * The one check no rehearsal can give: a post published for real.
 *
 * post-check walks the composer and throws the draft away, which proves the
 * hard parts of the upload and nothing about what happens after the button.
 * Pressing Post is where the read-back on the profile, the URL, the status and
 * the first comment all live, and none of it had ever run.
 *
 * Two modes, because the worker has to be up for one and down for the other,
 * and two browsers on one profile is the thing every slot in this codebase
 * exists to prevent.
 *
 *   queue   writes a queued row and waits for the running worker to publish it,
 *           the same row the app writes when somebody presses Publish. Prints
 *           the URL LinkedIn gave back.
 *   remove  opens its own session and deletes that post again. The worker must
 *           be stopped first.
 *
 * Usage:
 *   node --experimental-strip-types src/tools/publish-live-check.ts <accountId> queue
 *   node --experimental-strip-types src/tools/publish-live-check.ts <accountId> remove <postUrl>
 */

/** Short, true, and no worse than a typo if it is seen for a minute. */
const TEXT =
  "Testing our publishing pipeline this morning. This post is removed as soon as the check passes.";

const WAIT_MS = 9 * 60_000;
const POLL_MS = 5_000;

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
    profileUrl: row.profile_url ? String(row.profile_url) : null,
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")) ?? "",
      password: decryptSecret(String(row.password_encrypted ?? "")) ?? "",
      expectedIp: String(row.last_exit_ip ?? ""),
    },
  };
}

/** The row the app writes when somebody presses Publish, written by hand. */
async function queueAndWatch(accountId: string): Promise<void> {
  const acct = await account(accountId);
  const id = `livecheck-${Date.now()}`;
  const nowSec = Math.floor(Date.now() / 1000);

  await db().execute({
    sql: `INSERT INTO posts (id, user_id, content, status, scheduled_at,
                             linkedin_account_id, publish_attempts, created_at, updated_at)
          VALUES (?, ?, ?, 'queued', ?, ?, 0, ?, ?)`,
    args: [id, acct.workspaceId, TEXT, nowSec, accountId, nowSec, nowSec],
  });
  console.log(`queued ${id}, waiting for the worker to pick it up`);

  const until = Date.now() + WAIT_MS;
  let last = "";
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const { rows } = await db().execute({
      sql: `SELECT status, linkedin_post_url, error_message, first_comment_posted_at
              FROM posts WHERE id = ?`,
      args: [id],
    });
    const row = rows[0];
    if (!row) throw new Error("the row vanished");
    const status = String(row.status);
    if (status !== last) {
      console.log(`  ${new Date().toISOString()}  ${status}`);
      last = status;
    }
    if (status === "published") {
      console.log(`PUBLISHED ${row.linkedin_post_url ?? "(no url read back)"}`);
      console.log(`first comment at: ${row.first_comment_posted_at ?? "none set"}`);
      console.log(`REMOVE WITH: remove ${row.linkedin_post_url ?? ""}`);
      return;
    }
    if (status === "failed") {
      console.log(`FAILED ${row.error_message ?? "(no reason recorded)"}`);
      return;
    }
  }
  console.log(`STILL ${last} after ${WAIT_MS / 60000} minutes. Left in place on purpose.`);
}

/**
 * Takes it down again.
 *
 * A post left standing on a real profile is the worst outcome of this check, so
 * the failure to remove one is shouted rather than logged, and the URL is
 * printed for somebody to finish by hand.
 */
async function remove(accountId: string, postUrl: string): Promise<void> {
  const acct = await account(accountId);
  const session = await openSession(
    { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
    acct.allocation
  );
  try {
    if (!(await isSignedIn(session.context))) throw new Error("signed out");
    const page = session.page;
    await page.goto(postUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(5000);

    const menu = page
      .getByRole("button", { name: /open control menu|more actions|options|plus d'actions/i })
      .first();
    if (!(await menu.isVisible().catch(() => false))) {
      console.log(`COULD NOT OPEN THE MENU. Delete it by hand: ${postUrl}`);
      return;
    }
    await menu.click().catch(() => {});
    await page.waitForTimeout(1500);

    const del = page.getByRole("button", { name: /delete post|supprimer le post|delete|supprimer/i }).first();
    if (!(await del.isVisible().catch(() => false))) {
      console.log(`NO DELETE IN THE MENU. Delete it by hand: ${postUrl}`);
      return;
    }
    await del.click().catch(() => {});
    await page.waitForTimeout(1500);

    const confirm = page.getByRole("button", { name: /^(delete|supprimer)$/i }).last();
    if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {});
    await page.waitForTimeout(5000);

    // Read it back rather than trusting the click, the same way publishing does.
    await page.goto(postUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(4000);
    const stillThere = await page
      .getByText(TEXT.slice(0, 40), { exact: false })
      .first()
      .isVisible()
      .catch(() => false);
    console.log(stillThere ? `STILL VISIBLE. Delete it by hand: ${postUrl}` : "removed, and verified gone");
  } finally {
    await closeSession(session).catch(() => {});
  }
}

async function main(): Promise<void> {
  const accountId = process.argv[2];
  const mode = (process.argv[3] ?? "").toLowerCase();
  if (!accountId) throw new Error("Which account?");
  if (mode === "queue") return queueAndWatch(accountId);
  if (mode === "remove") {
    const url = process.argv[4];
    if (!url) throw new Error("Which post?");
    return remove(accountId, url);
  }
  throw new Error("Mode is queue or remove");
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
);
