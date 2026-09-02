import type { Page } from "patchright";
import { log } from "../logger.ts";
import { dwell, sleep, randInt } from "../browser/human.ts";
import { type DB, getStyleSamplesFor, saveStyleSample } from "../store.ts";

/** Recent style samples (the account's own past DMs) for the generator's few-shot voice matching. */
export function getStyleSamples(db: DB, limit = 8): Promise<string[]> {
  return getStyleSamplesFor(db, limit);
}

/**
 * Harvests the account's OWN sent messages into style_samples, so the generator can match the
 * sender's real voice. NOT YET VERIFIED: the first real account had no message threads yet, so the
 * sent-bubble selectors below are best-effort and must be confirmed once there is message history.
 */
export async function harvestStyle(page: Page, db: DB, maxThreads = 15): Promise<number> {
  await page.goto("https://www.linkedin.com/messaging/", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
  await dwell(2000, 3500);

  const threadLinks = page.locator('a[href*="/messaging/thread/"]');
  const count = Math.min(await threadLinks.count().catch(() => 0), maxThreads);
  if (count === 0) {
    log("Style harvest: no message threads yet, nothing to sample.");
    return 0;
  }

  let saved = 0;
  for (let i = 0; i < count; i++) {
    await threadLinks.nth(i).click().catch(() => {});
    await dwell(1500, 3000);
    const mine = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".msg-s-event-listitem"));
      const sent: string[] = [];
      for (const el of items) {
        if (el.classList.contains("msg-s-event-listitem--other")) continue; // theirs, not ours
        const body = (el.querySelector(".msg-s-event-listitem__body") as HTMLElement | null)?.innerText ?? "";
        if (body.trim().length > 0) sent.push(body.trim().slice(0, 400));
      }
      return sent;
    });
    for (const body of mine) {
      await saveStyleSample(db, body);
      saved++;
    }
    await sleep(randInt(2000, 5000));
  }
  log(`Style harvest: saved ${saved} of the account's own messages as style samples.`);
  return saved;
}
