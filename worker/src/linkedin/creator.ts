import type { Page } from "patchright";
import { dwell, scrollHuman } from "../browser/human.ts";
import { parseCount } from "./insights.ts";

/**
 * The three pages LinkedIn gives an author about their own account.
 *
 * Until now the worker learned about an account by opening every one of its posts, twice, every
 * three hours. These pages carry more than that in three loads a day, and they carry things no
 * post page has: profile viewers, search appearances, and who the followers actually are.
 *
 * The cost matters more than the extra data. Reading an account was hundreds of page loads a day
 * and is now three, against the exact counter that had a test account restricted in August for "an
 * unusually high volume of LinkedIn profile data". A feature that reads less and shows more is not
 * a trade.
 *
 * Every parser here is fed the visible text and is tested against captures taken off Nicolas's own
 * account on 2026-09-07. Nothing reads a class name, so a rename cannot zero anybody's page.
 */

/** A line that is nothing but a number. A percentage is deliberately not one. */
const NUMERIC_LINE = /^[\d.,\s ]+[km]?$/i;

const PERCENT_LINE = /^([\d.,]+)\s*%$/;

function linesOf(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * The number belonging to a label, whichever side LinkedIn put it on.
 *
 * These pages use both layouts at once: the headline tiles read "473 / Impressions" and the
 * engagement breakdown reads "Reactions / 22". The line after wins when both neighbours are
 * numeric, because the only labels with a number on each side are the stacked ones, where the
 * number above belongs to the label above.
 *
 * A label with no number on either side is skipped rather than answered, so a chart legend reading
 * "Impressions / Cumulative" does not shadow the tile below it.
 */
export function valueNear(lines: readonly string[], label: RegExp): number | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!label.test(lines[i] as string)) continue;
    const next = lines[i + 1];
    if (next && NUMERIC_LINE.test(next)) return parseCount(next);
    const previous = lines[i - 1];
    if (previous && NUMERIC_LINE.test(previous)) return parseCount(previous);
  }
  return null;
}

function percentNear(lines: readonly string[], label: RegExp): number | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!label.test(lines[i] as string)) continue;
    const next = PERCENT_LINE.exec(lines[i + 1] ?? "");
    if (next) return Number(next[1]?.replace(",", "."));
  }
  return null;
}

export interface ContentAnalytics {
  impressions: number | null;
  membersReached: number | null;
  /** Share of impressions from followers and connections, as a percentage. */
  inNetworkPercent: number | null;
  reactions: number | null;
  comments: number | null;
  reposts: number | null;
  saves: number | null;
  /** The posts LinkedIn itself picked out, with their own numbers. Free, no page per post. */
  topPosts: { impressions: number; engagements: number }[];
}

/** "94 impressions • 8 engagements", the line above each post in the top performing list. */
const TOP_POST = /^([\d.,]+)\s*impressions?\s*[•·|]\s*([\d.,]+)\s*engagements?$/i;

export function readContentAnalytics(text: string): ContentAnalytics {
  const lines = linesOf(text);
  return {
    impressions: valueNear(lines, /^impressions?$/i),
    membersReached: valueNear(lines, /^(members reached|membres touch[ée]s)$/i),
    inNetworkPercent: percentNear(lines, /^in-network/i),
    reactions: valueNear(lines, /^r[eé]actions?$/i),
    comments: valueNear(lines, /^comment(aire)?s?$/i),
    reposts: valueNear(lines, /^(reposts?|republications?)$/i),
    saves: valueNear(lines, /^(saves?|enregistrements?)$/i),
    topPosts: lines.flatMap((line) => {
      const m = TOP_POST.exec(line);
      return m ? [{ impressions: parseCount(m[1] as string), engagements: parseCount(m[2] as string) }] : [];
    }),
  };
}

/** One slice of the audience, as LinkedIn ranks it. */
export interface Demographic {
  category: string;
  label: string;
  percent: number;
}

/**
 * The categories LinkedIn breaks an audience into.
 *
 * Matched exactly, because each name appears twice on the page: once as a tab in the selector, and
 * once as the heading of its own result. The tabs are skipped because a tab is followed by another
 * tab, and a result is followed by a label and a percentage.
 */
const CATEGORIES = /^(job title|location|seniority|company|industry|company size)$/i;

export interface AudienceAnalytics {
  followers: number | null;
  demographics: Demographic[];
}

export function readAudienceAnalytics(text: string): AudienceAnalytics {
  const lines = linesOf(text);
  const demographics: Demographic[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length - 2; i += 1) {
    const category = lines[i] as string;
    if (!CATEGORIES.test(category)) continue;
    const label = lines[i + 1] as string;
    const percent = PERCENT_LINE.exec(lines[i + 2] as string);
    if (!percent || CATEGORIES.test(label)) continue;
    const key = category.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    demographics.push({
      category,
      label,
      percent: Number(percent[1]?.replace(",", ".")),
    });
  }

  return {
    followers: valueNear(lines, /^(total followers|abonn[ée]s au total)$/i),
    demographics,
  };
}

export interface DashboardStats {
  impressions7d: number | null;
  followers: number | null;
  profileViewers: number | null;
  searchAppearances: number | null;
}

/**
 * The account overview, which is the only place two of these numbers exist at all.
 *
 * Profile viewers and search appearances appear on no post page and in no API. They are also the
 * two an author actually watches, because they say whether the writing is making anybody look.
 */
export function readDashboardStats(text: string): DashboardStats {
  const lines = linesOf(text);
  return {
    impressions7d: valueNear(lines, /^post impressions( in \d+ days?)?$/i),
    followers: valueNear(lines, /^total followers$/i),
    profileViewers: valueNear(lines, /^profile viewers( in \d+ days?)?$/i),
    searchAppearances: valueNear(lines, /^search appearances/i),
  };
}

/** Opens a page, waits for it, and hands back its visible text. */
async function textOf(page: Page, url: string): Promise<string> {
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  const main = await page.waitForSelector("main", { timeout: 20_000 }).catch(() => null);
  if (!main) return "";
  await dwell(2000, 4000);
  await scrollHuman(page, 1);
  await dwell(1200, 2600);
  return page
    .locator("main")
    .innerText()
    .catch(() => "");
}

export const CREATOR_URLS = {
  content: "https://www.linkedin.com/analytics/creator/content/",
  audience: "https://www.linkedin.com/analytics/creator/audience/",
  dashboard: "https://www.linkedin.com/dashboard/",
} as const;

export async function readCreatorContent(page: Page): Promise<ContentAnalytics | null> {
  const text = await textOf(page, CREATOR_URLS.content);
  if (!/impressions?/i.test(text)) return null;
  return readContentAnalytics(text);
}

export async function readCreatorAudience(page: Page): Promise<AudienceAnalytics | null> {
  const text = await textOf(page, CREATOR_URLS.audience);
  if (!/followers?/i.test(text)) return null;
  return readAudienceAnalytics(text);
}

export async function readDashboard(page: Page): Promise<DashboardStats | null> {
  const text = await textOf(page, CREATOR_URLS.dashboard);
  if (!/impressions?|followers?/i.test(text)) return null;
  return readDashboardStats(text);
}
