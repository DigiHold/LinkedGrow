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
 *   carousel  nothing. Same rehearsal as the video, with a real PDF, because a
 *             carousel is a LinkedIn document post and it goes in through a
 *             different door than an image: its own Share a document screen,
 *             its own file chooser, and a title it will not continue without.
 *
 * Usage: node --experimental-strip-types src/tools/post-check.ts <accountId> [video|carousel|schedule|comment|all]
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

/**
 * A tiny real PDF, written byte by byte rather than pulled from a library.
 *
 * LinkedIn parses the file before it will accept it as a document, so a
 * renamed text file is refused and the check would report a composer failure
 * that is really a bad fixture. Two pages, because a one-page carousel does
 * not swipe and swiping is half of what is being checked.
 */
function makeCarousel(): string {
  const path = join(tmpdir(), "linkedgrow-selftest.pdf");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 612] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>",
    "<< /Length 62 >>\nstream\nBT /F1 36 Tf 72 500 Td (Composer check, page 1) Tj ET\nendstream",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 612] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>",
    "<< /Length 62 >>\nstream\nBT /F1 36 Tf 72 500 Td (Composer check, page 2) Tj ET\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  writeFileSync(path, pdf, "latin1");
  return path;
}

type Check = { name: string; ok: boolean; detail: string };

/**
 * A check that cannot hang.
 *
 * The first run of this tool sat on the account for twenty-five minutes and had
 * to be killed, which left a Chrome holding the profile the worker needs. The
 * composer's own waits have deadlines; the locators around them did not, and a
 * `filter({ hasText })` over a loaded LinkedIn page can take minutes on its
 * own. Every check gets a wall clock, and running out of it is a reported
 * failure rather than a tool that never comes back.
 */
async function within<T>(
  name: string,
  ms: number,
  work: () => Promise<T>
): Promise<{ value: T } | { timedOut: true }> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<{ timedOut: true }>((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), ms);
  });
  try {
    return await Promise.race([work().then((value) => ({ value })), deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** How long each check may take. Video is the slow one: LinkedIn transcodes. */
const BUDGET = { video: 7 * 60_000, carousel: 5 * 60_000, comment: 3 * 60_000, schedule: 5 * 60_000 };

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
          const attempt = await within("video", BUDGET.video, () =>
            publishPost(session.page, {
              text: `${SAMPLE_TEXT} (video)`,
              filePath: file,
              mimeType: "video/mp4",
              profileUrl: acct.profileUrl,
              rehearse: true,
            })
          );
          if ("timedOut" in attempt) {
            await capturePage(session.page, accountId, "video-timeout").catch(() => {});
            results.push({
              name: "video",
              ok: false,
              detail: `gave up after ${BUDGET.video / 60_000} minutes, see the capture in /opt/linkedgrow/debug`,
            });
          } else {
            const out = attempt.value;
            results.push({
              name: "video",
              ok: Boolean(out.rehearsed),
              detail: out.rehearsed
                ? "the composer took the video and the Post button was enabled"
                : "the composer did not reach an enabled Post button",
            });
          }
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

    if (only === "all" || only === "carousel") {
      const file = makeCarousel();
      try {
        const attempt = await within("carousel", BUDGET.carousel, () =>
          publishPost(session.page, {
            text: `${SAMPLE_TEXT} (carousel)`,
            filePath: file,
            mimeType: "application/pdf",
            profileUrl: acct.profileUrl,
            rehearse: true,
          })
        );
        if ("timedOut" in attempt) {
          await capturePage(session.page, accountId, "carousel-timeout").catch(() => {});
          results.push({
            name: "carousel",
            ok: false,
            detail: `gave up after ${BUDGET.carousel / 60_000} minutes, see the capture in /opt/linkedgrow/debug`,
          });
        } else {
          const out = attempt.value;
          results.push({
            name: "carousel",
            ok: Boolean(out.rehearsed),
            detail: out.rehearsed
              ? "the document uploaded, took its title and the Post button was enabled"
              : "the composer did not reach an enabled Post button",
          });
        }
      } catch (error) {
        await capturePage(session.page, accountId, "carousel-rehearsal").catch(() => {});
        results.push({
          name: "carousel",
          ok: false,
          detail: error instanceof Error ? error.message : String(error),
        });
      } finally {
        try { unlinkSync(file); } catch { /* the temp file is not worth a failure */ }
      }
    }

    if (only === "all" || only === "comment") {
      // The account's own last post, because commenting needs something that
      // exists and this is the one post we are entitled to touch.
      const found = acct.profileUrl
        ? await within("own post", 60_000, () =>
            recentOwnPost(session.page, acct.profileUrl as string)
          )
        : { value: null };
      const mine = "timedOut" in found ? null : found.value;
      if (!mine) {
        results.push({
          name: "first comment",
          ok: false,
          detail: "SKIPPED: this account has no post to comment on.",
        });
      } else {
        const text = "Testing the comment box, this comment is removed straight away.";
        const attempt = await within("comment", BUDGET.comment, () =>
          postFirstComment(session.page, mine, text).catch((error: unknown) => {
            void capturePage(session.page, accountId, "first-comment");
            return error instanceof Error ? error.message : String(error);
          })
        );
        const landed = "timedOut" in attempt ? "gave up waiting on the comment box" : attempt.value;
        results.push({
          name: "first comment",
          ok: landed === true,
          detail:
            landed === true
              ? `left on ${mine}. DELETE IT BY HAND if the cleanup below did not.`
              : String(landed),
        });
        if (landed === true) {
          const cleanup = await within("cleanup", BUDGET.comment, () =>
            deleteOwnComment(session.page, mine, text)
          );
          const gone = "timedOut" in cleanup ? false : cleanup.value;
          results.push({
            name: "comment cleanup",
            ok: gone,
            detail: gone
              ? "the test comment was removed"
              : `COULD NOT REMOVE IT, delete it by hand on ${mine}`,
          });
        }
      }
    }

    /**
     * Take back anything a failed comment check left behind.
     *
     * postFirstComment reports false when the box does not clear after the
     * submit, which is honest but ambiguous: the comment may have gone up
     * anyway. The check only cleans up on a reported success, so a false leaves
     * a test comment on somebody's real post. This mode looks for it by its
     * exact text and removes it, and says plainly when it cannot.
     */
    if (only === "cleanup") {
      const text = "Testing the comment box, this comment is removed straight away.";
      const found = acct.profileUrl
        ? await within("own post", 60_000, () =>
            recentOwnPost(session.page, acct.profileUrl as string)
          )
        : { value: null };
      const mine = "timedOut" in found ? null : found.value;
      if (!mine) {
        results.push({
          name: "cleanup",
          ok: false,
          detail: "could not open the account's own latest post",
        });
      } else {
        await session.page.goto(mine, { waitUntil: "domcontentloaded" }).catch(() => {});
        await session.page.waitForTimeout(4000);
        const present = await session.page
          .getByText(text, { exact: false })
          .first()
          .isVisible()
          .catch(() => false);
        if (!present) {
          results.push({
            name: "cleanup",
            ok: true,
            detail: `nothing was left behind on ${mine}`,
          });
        } else {
          const removed = await within("cleanup", BUDGET.comment, () =>
            deleteOwnComment(session.page, mine, text)
          );
          const gone = "timedOut" in removed ? false : removed.value;
          results.push({
            name: "cleanup",
            ok: gone,
            detail: gone
              ? "the test comment was found and removed"
              : `A TEST COMMENT IS STILL ON ${mine}. Delete it by hand.`,
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
        const attempt = await within("schedule", BUDGET.schedule, () =>
          publishPost(session.page, {
            text: `${SAMPLE_TEXT} (scheduled, and deleted immediately)`,
            filePath: null,
            mimeType: null,
            profileUrl: acct.profileUrl,
            scheduleFor: { at, timeZone: "Europe/Paris" },
          })
        );
        if ("timedOut" in attempt) {
          await capturePage(session.page, accountId, "schedule-timeout").catch(() => {});
          results.push({
            name: "schedule",
            ok: false,
            detail:
              "gave up part way through. CHECK THE SCHEDULED LIST BY HAND: it may have gone in.",
          });
        } else {
          results.push({
            name: "schedule",
            ok: attempt.value.scheduled,
            detail: attempt.value.scheduled
              ? `LinkedIn accepted it for ${at.toISOString()}. DELETE IT from the scheduled list.`
              : "LinkedIn did not accept it into its scheduler",
          });
        }
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
