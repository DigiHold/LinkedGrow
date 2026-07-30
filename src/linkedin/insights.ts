import type { Page } from "patchright";
import { dwell, scrollHuman } from "../browser/human.ts";

/**
 * Reading a post's own numbers off LinkedIn, since there is no API to ask.
 *
 * The analytics page in the dashboard has been showing zeros: v1 filled it from
 * the Share API, v2 dropped the API, and nothing replaced the writer. A page of
 * zeros is worse than no page, because it reads as "your posts did nothing".
 *
 * Everything here is reading. Opening your own post and looking at how it did
 * is the most ordinary thing a person does on LinkedIn, so it carries almost no
 * risk, but it still goes through the account's own session and address and it
 * still moves at a human pace.
 *
 * The counts are read out of the visible text rather than out of class names.
 * LinkedIn renames its classes constantly and translates its interface, so
 * "1,234 reactions" and "1 234 réactions" are both matched by a pattern on the
 * word, and a class rename cannot silently zero somebody's analytics.
 */

export interface PostStats {
  impressions: number | null;
  reactions: number;
  comments: number;
  reposts: number;
}

/**
 * Turns whatever LinkedIn printed into a number.
 *
 * It has to survive thousands separators in three conventions and the
 * abbreviations LinkedIn uses above a thousand, in both languages.
 */
export function parseCount(raw: string): number {
  const text = raw.replace(/[\s  ]/g, "").toLowerCase();
  if (!text) return 0;

  const suffix = /([km])$/.exec(text)?.[1];
  const digits = suffix ? text.slice(0, -1) : text;

  if (suffix) {
    // Abbreviated, so the last separator is a decimal point whichever glyph it is.
    const value = Number(digits.replace(",", "."));
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * (suffix === "k" ? 1_000 : 1_000_000));
  }

  const plain = Number(digits.replace(/[.,]/g, ""));
  return Number.isFinite(plain) ? plain : 0;
}

/**
 * Pulls the four numbers out of a block of interface text.
 *
 * Exported because it is the whole of the fragile part and the only piece worth
 * testing without a browser. English and French are both covered: an account's
 * LinkedIn language follows the member, not our browser locale, and Nicolas's
 * own accounts are French.
 */
export function readStatsFromText(text: string): PostStats {
  const flat = text.replace(/\s+/g, " ").toLowerCase();

  const find = (words: string): number | null => {
    // "1,234 reactions" and, for the counts LinkedIn puts after the word,
    // "reactions 1,234".
    const after = new RegExp(`([\\d.,\\s\\u00a0]+)\\s*(?:${words})`, "i").exec(flat);
    if (after?.[1]) return parseCount(after[1]);
    const before = new RegExp(`(?:${words})\\s*[:\\s]\\s*([\\d.,\\s\\u00a0]+)`, "i").exec(flat);
    if (before?.[1]) return parseCount(before[1]);
    return null;
  };

  return {
    impressions: find("impressions?|vues?|views?"),
    reactions: find("r[eé]actions?|likes?|j'aime") ?? 0,
    comments: find("comments?|commentaires?") ?? 0,
    reposts: find("reposts?|republications?|shares?|partages?") ?? 0,
  };
}

/**
 * The follower count printed on the account's own profile.
 *
 * The analytics page has a Followers card and a growth chart, and both were
 * showing zero because the number used to come from the API. It is written on
 * the profile in plain text, in whichever language the member uses, so it is
 * matched on the word rather than on markup.
 *
 * Null rather than zero when it cannot be found: an account genuinely at zero
 * followers and a page that did not load must not be recorded the same way, or
 * the growth chart grows a cliff every time a read fails.
 */
export async function readFollowerCount(page: Page, profileUrl: string): Promise<number | null> {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
  const main = await page.waitForSelector("main", { timeout: 20_000 }).catch(() => null);
  if (!main) return null;
  await dwell(1500, 3200);

  const text = await page
    .locator("main")
    .innerText()
    .catch(() => "");
  const match = /([\d.,\s ]+)\s*(followers?|abonn[ée]s?)/i.exec(text.replace(/\s+/g, " "));
  if (!match?.[1]) return null;
  const value = parseCount(match[1]);
  return value > 0 ? value : null;
}

/**
 * Opens one post and reads how it is doing.
 *
 * Returns null when the page did not render as a post, rather than zeros: a
 * post that failed to load and a post nobody engaged with must not look the
 * same in the database, or a bad session would quietly wipe somebody's history.
 */
export async function readPostStats(page: Page, postUrl: string): Promise<PostStats | null> {
  await page.goto(postUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
  const main = await page.waitForSelector("main", { timeout: 20_000 }).catch(() => null);
  if (!main) return null;
  await dwell(1800, 3600);
  // The counts sit below the post body, so the page has to be looked at.
  await scrollHuman(page, 1);
  await dwell(1200, 2600);

  const text = await page
    .locator("main")
    .innerText()
    .catch(() => "");
  if (!text || text.length < 40) return null;

  const stats = readStatsFromText(text);
  // A post page always names at least one of these, even at zero. Nothing at
  // all means the page is not the one we think it is.
  const looksLikeAPost = /reaction|réaction|comment|commentaire|repost|republication|impression/i.test(
    text
  );
  return looksLikeAPost ? stats : null;
}
