import type { Page } from "patchright";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { optionalEnv } from "../config.ts";
import { log } from "../logger.ts";

/**
 * What LinkedIn was actually showing when something failed.
 *
 * Selector maintenance is the standing cost of driving a real browser, and the
 * expensive part of it is not fixing the selector, it is finding out what the
 * page looked like. Without this the only evidence a failure leaves is a line
 * like "Sign-in did not reach a signed-in page", which is true of a captcha, a
 * wrong password, an interstitial and a renamed class alike. Diagnosing it by
 * trying again is the one thing that must not happen: every extra attempt is
 * another login on somebody's real account.
 *
 * So one failure has to be enough. This writes down the address, the title, the
 * visible text and a screenshot, and says in the log where they went.
 *
 * The directory sits beside the profiles, inside the only path the unit lets
 * the service write to, and is pruned so it cannot grow without bound. It can
 * hold an email address and whatever the page was showing, so it is created
 * private and stays on the box.
 */

const DEBUG_ROOT =
  optionalEnv("DEBUG_ROOT") ??
  resolve(optionalEnv("PROFILE_ROOT") ?? "profiles", "..", "debug");

/** How many captures to keep per account. Enough to compare, not enough to pile up. */
const KEEP_PER_ACCOUNT = 5;

function prune(dir: string, prefix: string): void {
  const mine = readdirSync(dir)
    .filter((name) => name.startsWith(prefix))
    .sort();
  for (const name of mine.slice(0, Math.max(0, mine.length - KEEP_PER_ACCOUNT * 3))) {
    rmSync(resolve(dir, name), { force: true });
  }
}

/**
 * Records the page behind a failure and returns a one-line summary for the log.
 *
 * Never throws. A capture that fails must not replace the error that caused it.
 */
export async function capturePage(
  page: Page,
  accountId: string,
  why: string
): Promise<string> {
  try {
    mkdirSync(DEBUG_ROOT, { recursive: true, mode: 0o700 });
    // Sortable, second resolution, and safe in a filename on any filesystem.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const base = `${accountId}-${stamp}`;

    const url = page.url();
    const title = await page.title().catch(() => "");
    const text = await page
      .locator("body")
      .first()
      .innerText()
      .catch(() => "");

    writeFileSync(
      resolve(DEBUG_ROOT, `${base}.txt`),
      `why: ${why}\nurl: ${url}\ntitle: ${title}\n\n${text.slice(0, 8000)}\n`,
      { mode: 0o600 }
    );
    await page
      .screenshot({ path: resolve(DEBUG_ROOT, `${base}.png`), fullPage: false })
      .catch(() => {});
    writeFileSync(
      resolve(DEBUG_ROOT, `${base}.html`),
      (await page.content().catch(() => "")).slice(0, 400_000),
      { mode: 0o600 }
    );

    prune(DEBUG_ROOT, accountId);

    // The first line of the page is usually the whole answer: "Let's do a quick
    // security check", "That's not the right password", "Verify it's you".
    const firstLine = text.split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? "";
    log("captured the page behind a failure", {
      accountId,
      why,
      url,
      title,
      says: firstLine.slice(0, 160),
      saved: resolve(DEBUG_ROOT, base),
    });
    return firstLine;
  } catch (error) {
    log("could not capture the page behind a failure", {
      accountId,
      reason: error instanceof Error ? error.message : String(error),
    });
    return "";
  }
}
