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
  await writeCache(db, CACHE_KEY, cache);
  return out;
}

const CREATOR_CACHE_KEY = "creator_urls";

/**
 * Resolves a person's name to their profile URL via the people search.
 *
 * A creator source mines the audience under one person's posts, which is the
 * densest room there is: people who stop to comment under a niche founder are
 * pre-sorted by the subject. The learner used to emit people as `company:`
 * lines, the companies search found nothing, and the source mined zero for
 * ever. Null when the search finds nobody, and the caller retires the source
 * with the reason instead of letting it book budget for nothing.
 */
export async function resolveCreatorUrl(page: Page, name: string, db: DB): Promise<string | null> {
  const cache = await readCache(db, CREATOR_CACHE_KEY);
  const key = name.toLowerCase();
  if (cache[key]) return cache[key];
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
  await dwell(1500, 3000);
  const href = await page.evaluate(() => {
    const a = document.querySelector('main a[href*="/in/"]') as HTMLAnchorElement | null;
    return a?.href ?? null;
  });
  const slug = href?.match(/\/in\/([^/?#]+)/)?.[1];
  if (!slug) {
    log(`Could not resolve creator "${name}" to a LinkedIn profile.`);
    return null;
  }
  const resolved = `https://www.linkedin.com/in/${slug}`;
  cache[key] = resolved;
  await writeCache(db, CREATOR_CACHE_KEY, cache);
  log(`Resolved creator "${name}" -> ${resolved}`);
  return resolved;
}

async function readCache(db: DB, key: string = CACHE_KEY): Promise<Record<string, string>> {
  const raw = await getMeta(db, key);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeCache(db: DB, key: string, cache: Record<string, string>): void {
  setMeta(db, key, JSON.stringify(cache));
}
