import type { Page } from "patchright";
import { log } from "../logger.ts";
import { dwell, sleep, randInt } from "../browser/human.ts";
import { getMeta, setMeta, type DB } from "../store.ts";

const CACHE_KEY = "competitor_urls";

/**
 * Resolves one competitor name to its LinkedIn company "posts" URL via search.
 * Verified live: the companies search page's first `/company/` link is the match. Null if none.
 */
export async function resolveCompetitorUrl(page: Page, name: string): Promise<string | null> {
  const url = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
  await dwell(1500, 3000);
  const href = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/company/"]') as HTMLAnchorElement | null;
    return a?.href ?? null;
  });
  const slug = href?.match(/\/company\/([^/?#]+)/)?.[1];
  return slug ? `https://www.linkedin.com/company/${slug}/posts/` : null;
}

/** Resolves competitor names to company posts URLs, cached in the db, human-paced between searches. */
export async function resolveCompetitorUrls(page: Page, names: string[], db: DB): Promise<string[]> {
  const cache = await readCache(db);
  const out: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    const hit = cache[key];
    if (hit) {
      out.push(hit);
      continue;
    }
    const resolved = await resolveCompetitorUrl(page, name);
    if (resolved) {
      cache[key] = resolved;
      out.push(resolved);
      log(`Resolved competitor "${name}" -> ${resolved}`);
    } else {
      log(`Could not resolve competitor "${name}" to a LinkedIn company.`);
    }
    await sleep(randInt(4000, 9000)); // human pace between searches
  }
  await writeCache(db, cache);
  return out;
}

async function readCache(db: DB): Promise<Record<string, string>> {
  const raw = await getMeta(db, CACHE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeCache(db: DB, cache: Record<string, string>): void {
  setMeta(db, CACHE_KEY, JSON.stringify(cache));
}
