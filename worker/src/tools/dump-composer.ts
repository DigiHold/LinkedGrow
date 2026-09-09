import "dotenv/config";
import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";

/**
 * What the open composer actually contains, from the editor outwards.
 *
 * Written on 2026-09-09, after three deploys failed to attach a picture on a
 * composer that was open and working. `dialog` in publish.ts falls back to
 * `page.locator("body")` when the composer is not a role="dialog", which it has
 * not been since 2026-07-31, so every media lookup searched the whole page and
 * matched the feed's own photo button sitting behind the composer. Nothing
 * opened, and the post failed with "LinkedIn would not accept the attachment".
 *
 * Fixing that needs to know what the composer subtree really holds, so this
 * opens the composer, walks up from the editor, and prints every control at
 * each level with its machine attributes. It never types and never posts.
 *
 *   node --experimental-strip-types src/tools/dump-composer.ts <accountId>
 */

async function account(accountId: string) {
  const { rows } = await db().execute({
    sql: `SELECT l.country, p.host, p.port, p.username_encrypted, p.password_encrypted, p.last_exit_ip
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
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")) ?? "",
      password: decryptSecret(String(row.password_encrypted ?? "")) ?? "",
      expectedIp: String(row.last_exit_ip ?? ""),
    },
  };
}

const EDITOR = '.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]';
const START = 'button.share-box-feed-entry__trigger, button:has-text("Start a post"), [role="button"]:has-text("Start a post"), .share-box-feed-entry__trigger';

/**
 * Read through Playwright, never through document.querySelector.
 *
 * The composer lives in a shadow root: a page.evaluate that walks the document
 * finds no editor, no dialog and no icons, which is exactly what the first run
 * of this tool printed and what made publish.ts believe the page held nothing.
 * Locators pierce it, so every reading here goes through one.
 */
const DESCRIBE = (els: Element[]) =>
  els.slice(0, 30).map((el) => {
    const svg = el.querySelector("svg[id], svg[data-test-icon]");
    return (
      `<${el.tagName.toLowerCase()}` +
      `${el.getAttribute("role") ? " role=" + el.getAttribute("role") : ""}>` +
      ` icon=${svg ? svg.getAttribute("data-test-icon") || svg.getAttribute("id") : "-"}` +
      ` view=${el.getAttribute("data-view-name") ?? "-"}` +
      ` label="${el.getAttribute("aria-label") ?? ""}"` +
      ` text="${((el as HTMLElement).innerText || "").replace(/\s+/g, " ").trim().slice(0, 24)}"`
    );
  });

const CONTROLS = 'button, a[href], [role="button"], [role="menuitem"]';

async function main(): Promise<void> {
  const accountId = process.argv[2];
  if (!accountId) throw new Error("Which account?");
  const acct = await account(accountId);
  const session = await openSession(
    { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
    acct.allocation
  );
  try {
    if (!(await isSignedIn(session.context))) throw new Error("Signed out, nothing to read.");
    const page = session.context.pages()[0] ?? (await session.context.newPage());
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(8_000);

    const trigger = page.locator(START).first();
    await trigger.click({ timeout: 20_000 });
    await page.waitForSelector(EDITOR, { state: "visible", timeout: 25_000 });
    await page.waitForTimeout(3_000);

    const editor = page.locator(EDITOR).first();

    console.log("\n########## every media-ish control the page offers, in DOM order");
    const anyMedia = page.locator(
      '[role="button"]:has(svg[data-test-icon="image-medium"]), button:has(svg[data-test-icon="image-medium"]), ' +
      '[role="button"]:has(svg[id="image-medium"]), button:has(svg[id="image-medium"])'
    );
    console.log(`  ${await anyMedia.count()} matches page wide`);
    for (const line of await anyMedia.evaluateAll(DESCRIBE)) console.log("    " + line);

    console.log("\n########## the editor's ancestors, and what each one holds");
    for (let up = 1; up <= 8; up++) {
      const ancestor = editor.locator(`xpath=ancestor::*[${up}]`);
      if ((await ancestor.count()) === 0) break;
      const [shape] = await ancestor.evaluateAll((els) =>
        els.slice(0, 1).map(
          (el) =>
            `<${el.tagName.toLowerCase()}${el.getAttribute("role") ? " role=" + el.getAttribute("role") : ""}>` +
            ` class="${(el.className || "").toString().slice(0, 60)}"` +
            ` view=${el.getAttribute("data-view-name") ?? "-"}`
        )
      );
      const controls = ancestor.locator(CONTROLS);
      const n = await controls.count();
      console.log(`--- level ${up}: ${shape} controls=${n}`);
      if (n > 0 && n <= 40) {
        for (const line of await controls.evaluateAll(DESCRIBE)) console.log("      " + line);
      }
    }

    console.log("\n########## file inputs before");
    console.log(`  ${await page.locator('input[type="file"]').count()} on the page`);

    /* The resolution the fix uses, run for real: composer scopes from the
       editor, nearest first, then the icon lookup inside them. Then press it
       and see whether a picker actually answers. Nothing is ever posted. */
    console.log("\n########## what the fix resolves, and what pressing it does");
    const PRESSABLE = 'button, a[href], [role="button"], [role="menuitem"]';
    const scopes = [];
    for (let up = 1; up <= 12; up++) {
      const ancestor = editor.locator(`xpath=ancestor::*[${up}]`);
      if ((await ancestor.count()) === 0) break;
      if ((await ancestor.locator(PRESSABLE).count()) > 0) scopes.push({ up, ancestor });
    }
    console.log(`  scopes: ${scopes.map((s) => s.up).join(", ") || "none"}`);
    let target = null;
    for (const { up, ancestor } of scopes) {
      const hit = ancestor
        .locator('button:has(svg[data-test-icon="image-medium"]), [role="button"]:has(svg[data-test-icon="image-medium"])')
        .first();
      if ((await hit.count()) > 0 && (await hit.isVisible().catch(() => false))) {
        console.log(`  resolved at level ${up}: ` + (await hit.evaluateAll(DESCRIBE))[0]);
        target = hit;
        break;
      }
    }
    if (!target) {
      console.log("  NOTHING RESOLVED");
    } else {
      const chooser = page.waitForEvent("filechooser", { timeout: 10_000 }).catch(() => null);
      await target.click({ timeout: 15_000 });
      const fired = await chooser;
      await page.waitForTimeout(2_500);
      console.log(`  native file chooser fired: ${fired ? "YES" : "no"}`);
      console.log(`  file inputs after the click: ${await page.locator('input[type="file"]').count()}`);
    }
  } finally {
    await closeSession(session);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
