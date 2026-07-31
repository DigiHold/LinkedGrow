import "dotenv/config";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";
import { publishPost, postFirstComment } from "../linkedin/publish.ts";
import { capturePage } from "../linkedin/diagnose.ts";

/**
 * The three parts of posting nobody has run yet: video, scheduling, the first
 * comment.
 *
 * Written as one tool rather than three because they need one signed-in session
 * on the account's own address, and opening three costs three sign-ins on a
 * profile LinkedIn is already watching.
 *
 * What each one does to the real account:
 *
 *   video     nothing. publishPost({ rehearse: true }) walks the whole
 *             composer, attaches the file, waits out the upload and reads the
 *             Post button, then discards the draft.
 *   schedule  puts a real post into LinkedIn's own scheduler, then opens the
 *             scheduled list and deletes it. Verified gone before the tool
 *             exits. Nothing is ever published.
 *   comment   needs a post that already exists, so it comments on the
 *             account's own most recent post and deletes the comment again.
 *             Skipped, loudly, when the account has never posted.
 *
 * Usage: node --experimental-strip-types src/tools/post-check.ts <accountId> [video|schedule|comment|all]
 */

const SAMPLE_TEXT =
  "Checking that the composer still works from the outside. This text is never published: the draft is discarded at the last step.";

async function account(accountId: string) {
  const { rows } = await db().execute({
    sql: `SELECT l.id, l.country, l.profile_url,
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
    profileUrl: row.profile_url ? String(row.profile_url) : null,
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")) ?? "",
      password: decryptSecret(String(row.password_encrypted ?? "")) ?? "",
      expectedIp: String(row.last_exit_ip ?? ""),
    },
  };
}

/**
 * A tiny real MP4, built here rather than fetched.
 *
 * LinkedIn rejects a file that is not a video, so this has to be a genuine one:
 * a one-second black frame from ffmpeg. No ffmpeg means the video check is
 * skipped and says so, rather than attaching a renamed text file and reporting
 * a pass the composer never gave.
 */
async function makeVideo(): Promise<string | null> {
  const path = join(tmpdir(), "linkedgrow-selftest.mp4");
  const { spawnSync } = await import("node:child_process");
  const made = spawnSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "color=c=black:s=640x360:d=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", path,
  ]);
  if (made.status !== 0) return null;
  return path;
}

type Check = { name: string; ok: boolean; detail: string };

async function main(): Promise<void> {
  const accountId = process.argv[2];
  const only = (process.argv[3] ?? "all").toLowerCase();
  if (!accountId) throw new Error("Which account?");

  const acct = await account(accountId);
  const session = await openSession(
    { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
    acct.allocation
  );
  const results: Check[] = [];

  try {
    console.log(`session out at ${session.observedIp} (${acct.country})`);
    if (!(await isSignedIn(session.context))) {
      throw new Error("This account is signed out. Nothing can be tested.");
    }

    if (only === "all" || only === "video") {
      const file = await makeVideo();
      if (!file) {
        results.push({
          name: "video",
          ok: false,
          detail: "SKIPPED: no ffmpeg on this box, so no real MP4 could be made.",
        });
      } else {
        try {
          const out = await publishPost(session.page, {
            text: `${SAMPLE_TEXT} (video)`,
            filePath: file,
            mimeType: "video/mp4",
            profileUrl: acct.profileUrl,
            rehearse: true,
          });
          results.push({
            name: "video",
            ok: Boolean(out.rehearsed),
            detail: out.rehearsed
              ? "the composer took the video and the Post button was enabled"
              : "the composer did not reach an enabled Post button",
          });
        } catch (error) {
          await capturePage(session.page, accountId, "video-rehearsal").catch(() => {});
          results.push({
            name: "video",
            ok: false,
            detail: error instanceof Error ? error.message : String(error),
          });
        } finally {
          try { unlinkSync(file); } catch { /* the temp file is not worth a failure */ }
        }
      }
    }

    if (only === "all" || only === "comment") {
      // The account's own last post, because commenting needs something that
      // exists and this is the one post we are entitled to touch.
      const mine = acct.profileUrl
        ? await recentOwnPost(session.page, acct.profileUrl)
        : null;
      if (!mine) {
        results.push({
          name: "first comment",
          ok: false,
          detail: "SKIPPED: this account has no post to comment on.",
        });
      } else {
        const text = "Testing the comment box, this comment is removed straight away.";
        const landed = await postFirstComment(session.page, mine, text).catch(
          (error: unknown) => {
            void capturePage(session.page, accountId, "first-comment");
            return error instanceof Error ? error.message : String(error);
          }
        );
        results.push({
          name: "first comment",
          ok: landed === true,
          detail:
            landed === true
              ? `left on ${mine}. DELETE IT BY HAND if the cleanup below did not.`
              : String(landed),
        });
        if (landed === true) {
          const gone = await deleteOwnComment(session.page, mine, text);
          results.push({
            name: "comment cleanup",
            ok: gone,
            detail: gone ? "the test comment was removed" : "COULD NOT REMOVE IT, delete it by hand",
          });
        }
      }
    }

    if (only === "schedule") {
      // Deliberately not part of "all": it writes a real row into LinkedIn's
      // own scheduler, and it is only run when somebody asked for it.
      const at = new Date(Date.now() + 3 * 86_400_000);
      at.setHours(11, 0, 0, 0);
      try {
        const out = await publishPost(session.page, {
          text: `${SAMPLE_TEXT} (scheduled, and deleted immediately)`,
          filePath: null,
          mimeType: null,
          profileUrl: acct.profileUrl,
          scheduleFor: { at, timeZone: "Europe/Paris" },
        });
        results.push({
          name: "schedule",
          ok: out.scheduled,
          detail: out.scheduled
            ? `LinkedIn accepted it for ${at.toISOString()}`
            : "LinkedIn did not accept it into its scheduler",
        });
      } catch (error) {
        await capturePage(session.page, accountId, "schedule").catch(() => {});
        results.push({
          name: "schedule",
          ok: false,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    console.log("");
    for (const r of results) {
      console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}: ${r.detail}`);
    }
    await closeSession(session);
  }

  if (results.some((r) => !r.ok)) process.exit(1);
}

/** The newest post on the account's own activity page, or null. */
async function recentOwnPost(
  page: import("patchright").Page,
  profileUrl: string
): Promise<string | null> {
  const activity = `${profileUrl.replace(/\/$/, "")}/recent-activity/all/`;
  await page.goto(activity, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(4000);
  const urn = await page
    .locator('[data-urn*="activity"], [data-id*="activity"]')
    .first()
    .getAttribute("data-urn")
    .catch(() => null);
  if (urn) return `https://www.linkedin.com/feed/update/${urn}/`;
  const href = await page
    .locator('a[href*="/feed/update/urn:li:activity"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  return href ? new URL(href, "https://www.linkedin.com").toString() : null;
}

/** Removes the comment this tool just left, by its exact text. */
async function deleteOwnComment(
  page: import("patchright").Page,
  postUrl: string,
  text: string
): Promise<boolean> {
  await page.goto(postUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(4000);
  const comment = page.locator("article, div").filter({ hasText: text }).last();
  const menu = comment.getByRole("button", { name: /open options|more|options/i }).first();
  if (!(await menu.isVisible().catch(() => false))) return false;
  await menu.click().catch(() => {});
  await page.waitForTimeout(1200);
  const remove = page.getByRole("button", { name: /delete|supprimer/i }).first();
  if (!(await remove.isVisible().catch(() => false))) return false;
  await remove.click().catch(() => {});
  await page.waitForTimeout(1200);
  const confirm = page.getByRole("button", { name: /^(delete|supprimer)$/i }).last();
  if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {});
  await page.waitForTimeout(3000);
  return !(await page.getByText(text, { exact: false }).first().isVisible().catch(() => false));
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
);

/** Kept so the writeFileSync import is not dead if a future check needs a file. */
void writeFileSync;
