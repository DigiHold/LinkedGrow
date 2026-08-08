import "dotenv/config";
import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";
import { putObject } from "../storage/r2.ts";
import { deflateSync } from "node:zlib";

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

const CAROUSEL_TEXT =
  "Two slides, checking that documents still upload and schedule correctly. Removed once the check passes.";

const IMAGE_TEXT =
  "Checking that an image still uploads and publishes correctly. This post is removed as soon as the check passes.";

const WAIT_MS = 9 * 60_000;
const POLL_MS = 5_000;

/**
 * A picture, generated rather than shipped.
 *
 * The check needs a real image file that a real LinkedIn upload will accept,
 * and committing a binary to test a binary path is how a repository fills up
 * with fixtures nobody can regenerate. A PNG is a signature, a header, one
 * zlib-compressed block of scanlines and a CRC, all of which Node can produce
 * from its own standard library.
 *
 * Deliberately a plain dark gradient with no text on it. It is seen for a few
 * minutes on somebody's real profile, so it should look like nothing rather
 * than like a mistake.
 */
function testPng(width = 1200, height = 627): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let at = 0;
  for (let y = 0; y < height; y += 1) {
    raw[at++] = 0; // no per-scanline filter
    for (let x = 0; x < width; x += 1) {
      const across = x / width;
      const down = y / height;
      raw[at++] = Math.round(12 + across * 18 + down * 8);
      raw[at++] = Math.round(18 + across * 34 + down * 14);
      raw[at++] = Math.round(34 + across * 62 + down * 26);
    }
  }

  const chunk = (type: string, body: Buffer): Buffer => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.length);
    const typed = Buffer.concat([Buffer.from(type, "ascii"), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typed));
    return Buffer.concat([length, typed, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = (CRC_TABLE[(c ^ byte) & 0xff] as number) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

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

/**
 * Publish now, with a picture, which is the path nothing had ever exercised.
 *
 * The plain text check proves the composer and the button. An image adds the
 * file input, the upload wait and the Next screen, and those are three separate
 * places a redesign breaks. The picture is generated and uploaded to the same
 * bucket the dashboard uses, so the media row is the same shape the app writes.
 */
async function queueWithImage(accountId: string): Promise<void> {
  const acct = await account(accountId);
  const id = `livecheck-image-${Date.now()}`;
  const nowSec = Math.floor(Date.now() / 1000);

  const png = testPng();
  const key = `checks/${id}.png`;
  const url = await putObject(key, png, "image/png");
  if (!url) throw new Error("no bucket configured, so there is nowhere to put the picture");
  console.log(`uploaded ${png.length} bytes to ${url}`);

  await db().execute({
    sql: `INSERT INTO posts (id, user_id, content, status, scheduled_at,
                             linkedin_account_id, publish_attempts, created_at, updated_at)
          VALUES (?, ?, ?, 'queued', ?, ?, 0, ?, ?)`,
    args: [id, acct.workspaceId, IMAGE_TEXT, nowSec, accountId, nowSec, nowSec],
  });
  await db().execute({
    sql: `INSERT INTO media (id, user_id, post_id, storage_key, storage_url,
                             file_name, mime_type, file_size, sort_order, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'image/png', ?, 0, 'ready', ?)`,
    args: [`${id}-png`, acct.workspaceId, id, key, url, "check-image.png", png.length, nowSec],
  });

  console.log(`queued ${id} with an image, waiting for the worker to publish it`);
  await watch(id, 10, "published");
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
 * Looks at what was actually published, and at the composer, in one session.
 *
 * The status column says a post went out and the URL proves it exists. Neither
 * says the picture made it, and "published a shell with no media in it" is a
 * failure this composer has produced before. A screenshot is the only answer
 * that is not an inference.
 *
 * The composer shot is here for a second reason. On 2026-08-08 a carousel fell
 * back from LinkedIn's own scheduler with "the composer has no Schedule control
 * on this account", and whether that is LinkedIn removing it or a selector that
 * moved cannot be settled from a log line.
 *
 * Everything here reads. Nothing is posted and nothing is deleted.
 */
async function inspect(accountId: string, urls: string[]): Promise<void> {
  const acct = await account(accountId);
  const session = await openSession(
    { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
    acct.allocation
  );
  try {
    if (!(await isSignedIn(session.context))) throw new Error("signed out");
    const page = session.page;
    for (const [i, url] of urls.entries()) {
      await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(6000);
      const path = `/tmp/check-post-${i + 1}.png`;
      await page.screenshot({ path, fullPage: false });
      console.log(`SHOT ${path}  <-  ${url}`);
    }

    // And the composer, to settle the missing Schedule control.
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(4000);
    const start = page
      .getByRole("button", { name: /start a post|créer un post|commencer un post/i })
      .first();
    if (await start.isVisible().catch(() => false)) {
      await start.click().catch(() => {});
      await page.waitForTimeout(4000);
      await page.screenshot({ path: "/tmp/check-composer.png", fullPage: false });
      console.log("SHOT /tmp/check-composer.png  <-  the composer");
      const controls = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[role="dialog"] button'))
          .map((b) => (b.getAttribute("aria-label") || (b as HTMLElement).innerText || "").trim())
          .filter(Boolean)
          .slice(0, 40)
      );
      console.log("COMPOSER BUTTONS:", JSON.stringify(controls));
    } else {
      console.log("could not open the composer to look at it");
    }
  } finally {
    await closeSession(session).catch(() => {});
  }
}

/**
 * Walks the carousel flow one step at a time and photographs each one.
 *
 * The carousel failed three times on 2026-08-08 with "the attachment did not
 * finish uploading, the composer says: Maria LECOCQ", while an image published
 * fine two minutes earlier and the PDF is a valid two-page document. The same
 * file's own comments record six attempts spent guessing at this flow, so this
 * looks instead: every step is photographed and every button in the dialog is
 * printed, which is what a moved selector looks like from the outside.
 *
 * It attaches a file and never presses Post. The composer is discarded at the
 * end, so nothing reaches the profile.
 */
async function carouselProbe(accountId: string): Promise<void> {
  const acct = await account(accountId);
  const session = await openSession(
    { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
    acct.allocation
  );
  const page = session.page;
  let step = 0;

  /** Everything the composer offers, by the name a selector would have to use. */
  const dump = async (what: string) => {
    step += 1;
    const path = `/tmp/carousel-${String(step).padStart(2, "0")}-${what}.png`;
    await page.screenshot({ path }).catch(() => {});
    const state = await page
      .evaluate(() => {
        const open = document.querySelector("dialog[open]");
        const roled = document.querySelectorAll('div[role="dialog"]').length;
        const label = (el: Element) =>
          (el.getAttribute("aria-label") || (el as HTMLElement).innerText || "")
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 40);
        const inside = open
          ? Array.from(open.querySelectorAll("button,[role='button'],input"))
              .map((el) => `${el.tagName.toLowerCase()}:${label(el) || "(unnamed)"}`)
              .filter((s) => !s.endsWith("(unnamed)"))
              .slice(0, 40)
          : [];
        return {
          nativeDialog: Boolean(open),
          divRoleDialogs: roled,
          editors: document.querySelectorAll('div[role="textbox"][contenteditable="true"]').length,
          fileInputs: document.querySelectorAll('input[type="file"]').length,
          progressBars: document.querySelectorAll('[role="progressbar"]').length,
          controls: inside,
        };
      })
      .catch(() => null);
    console.log(`\n[${step}] ${what}  ->  ${path}`);
    console.log("    " + JSON.stringify(state));
  };

  try {
    if (!(await isSignedIn(session.context))) throw new Error("signed out");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    const start = page.getByRole("button", { name: /start a post|créer un post/i }).first();
    if (!(await start.isVisible().catch(() => false))) throw new Error("no Start a post control");
    await start.click();
    await page.waitForTimeout(4000);
    await dump("composer-open");

    const expand = page.locator('[aria-label*="Expand content types" i]').first();
    if (await expand.isVisible().catch(() => false)) {
      await expand.click();
      await page.waitForTimeout(2500);
      await dump("expanded");
    }

    // Scoped to the open dialog, never the page: the feed behind the composer
    // holds a document carousel of its own whose paging buttons are called
    // "Go to next page of document", and an unscoped name match takes those.
    const doc = page.locator('dialog[open] [aria-label="Document" i]').first();
    const visible = await doc.isVisible().catch(() => false);
    console.log(`    document entry inside the dialog: ${visible}`);
    if (visible) {
      await doc.click();
      await page.waitForTimeout(3500);
      await dump("document-screen");
    }

    const chooser = page.locator('dialog[open] [aria-label*="Choose file" i], dialog[open] button:has-text("Choose file")').first();
    if (await chooser.isVisible().catch(() => false)) {
      console.log("    a Choose file control is present, so the input arrives on click");
    }

    const { writeFileSync, mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const res = await fetch(
      "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/checks/carousel-check.pdf"
    );
    const file = join(mkdtempSync(join(tmpdir(), "probe-")), "carousel-check.pdf");
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));

    if ((await page.locator('input[type="file"]').count()) > 0) {
      await page.locator('input[type="file"]').first().setInputFiles(file);
    } else if (await chooser.isVisible().catch(() => false)) {
      const [picker] = await Promise.all([page.waitForEvent("filechooser"), chooser.click()]);
      await picker.setFiles(file);
    } else {
      console.log("    NO WAY IN: neither a file input nor a Choose file control");
      return;
    }
    console.log("    PDF handed over");

    for (const wait of [6000, 8000, 10000]) {
      await page.waitForTimeout(wait);
      await dump(`after-upload-${wait}ms`);
    }
  } finally {
    await dump("final").catch(() => {});
    await closeSession(session).catch(() => {});
  }
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
    // Any of the three check texts, because remove is called on whichever post
    // the run just published and they do not share an opening sentence.
    let stillThere = false;
    for (const text of [TEXT, IMAGE_TEXT, CAROUSEL_TEXT]) {
      const seen = await page
        .getByText(text.slice(0, 40), { exact: false })
        .first()
        .isVisible()
        .catch(() => false);
      if (seen) stillThere = true;
    }
    console.log(stillThere ? `STILL VISIBLE. Delete it by hand: ${postUrl}` : "removed, and verified gone");
  } finally {
    await closeSession(session).catch(() => {});
  }
}

/**
 * A carousel handed to LinkedIn's own scheduler.
 *
 * The slot has to clear two rules in actionFor, or this tests something else
 * entirely: more than 90 minutes away, or the post goes out the direct way at
 * its slot and the native picker is never touched; and within four hours, or
 * the composing window refuses to write anything before 07:00.
 */
async function scheduleCarousel(accountId: string, atSeconds: number): Promise<string> {
  const acct = await account(accountId);
  const id = `livecheck-carousel-${Date.now()}`;
  const nowSec = Math.floor(Date.now() / 1000);
  const minutes = Math.round((atSeconds * 1000 - Date.now()) / 60000);

  await db().execute({
    sql: `INSERT INTO posts (id, user_id, content, post_type, status, scheduled_at,
                             linkedin_account_id, publish_attempts, created_at, updated_at)
          VALUES (?, ?, ?, 'carousel', 'scheduled', ?, ?, 0, ?, ?)`,
    args: [id, acct.workspaceId, CAROUSEL_TEXT, atSeconds, accountId, nowSec, nowSec],
  });
  await db().execute({
    sql: `INSERT INTO media (id, user_id, post_id, storage_key, storage_url,
                             file_name, mime_type, file_size, sort_order, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'application/pdf', 896, 0, 'ready', ?)`,
    args: [
      `${id}-pdf`, acct.workspaceId, id, "checks/carousel-check.pdf",
      "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/checks/carousel-check.pdf",
      "carousel-check.pdf", nowSec,
    ],
  });
  console.log(`scheduled ${id} for ${new Date(atSeconds * 1000).toISOString()} (${minutes} minutes out)`);
  console.log(minutes > 90 ? "  over 90 minutes, so the native scheduler is the path" : "  UNDER 90 MINUTES: this will publish directly at the slot instead");
  return id;
}

/** Waits for one row to reach a state, printing every change on the way. */
async function watch(postId: string, minutes: number, want: "prepared" | "published"): Promise<void> {
  const until = Date.now() + minutes * 60_000;
  let last = "";
  while (Date.now() < until) {
    const { rows } = await db().execute({
      sql: `SELECT status, linkedin_scheduled_at, linkedin_post_url, error_message,
                   first_comment_posted_at, publish_attempts
              FROM posts WHERE id = ?`,
      args: [postId],
    });
    const row = rows[0];
    if (!row) throw new Error("the row vanished");
    const line = `${row.status} native=${row.linkedin_scheduled_at ?? "no"} attempts=${row.publish_attempts}`;
    if (line !== last) {
      console.log(`  ${new Date().toISOString()}  ${line}`);
      last = line;
    }
    if (want === "prepared" && row.linkedin_scheduled_at !== null) {
      console.log("PREPARED: LinkedIn's own scheduler has it");
      return;
    }
    if (String(row.status) === "published") {
      console.log(`PUBLISHED ${row.linkedin_post_url ?? "(no url read back)"}`);
      console.log(`first comment at: ${row.first_comment_posted_at ?? "none set"}`);
      console.log(`REMOVE WITH: remove ${row.linkedin_post_url ?? ""}`);
      return;
    }
    if (String(row.status) === "failed") {
      console.log(`FAILED ${row.error_message ?? "(no reason recorded)"}`);
      return;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  console.log(`TIMED OUT after ${minutes} minutes, last seen ${last}`);
}

async function main(): Promise<void> {
  const accountId = process.argv[2];
  const mode = (process.argv[3] ?? "").toLowerCase();
  if (!accountId) throw new Error("Which account?");
  if (mode === "queue") return queueAndWatch(accountId);
  if (mode === "queue-image") return queueWithImage(accountId);
  if (mode === "inspect") return inspect(accountId, process.argv.slice(4).filter(Boolean));
  if (mode === "carousel-probe") return carouselProbe(accountId);
  if (mode === "schedule-carousel") {
    const at = Number(process.argv[4]);
    if (!Number.isFinite(at)) throw new Error("Give the slot as epoch seconds");
    const id = await scheduleCarousel(accountId, at);
    console.log(`CAROUSEL ID: ${id}`);
    await watch(id, Number(process.argv[5] ?? 8), "prepared");
    return;
  }
  if (mode === "watch") {
    const id = process.argv[4];
    if (!id) throw new Error("Which post?");
    return watch(id, Number(process.argv[5] ?? 10), "published");
  }
  if (mode === "remove") {
    const url = process.argv[4];
    if (!url) throw new Error("Which post?");
    return remove(accountId, url);
  }
  throw new Error("Mode is queue, queue-image, schedule-carousel, watch, inspect, carousel-probe or remove");
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
);
