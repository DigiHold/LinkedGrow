import type { Page } from "patchright";
import { dwell, scrollHuman } from "../browser/human.ts";
import { log } from "../logger.ts";
import { toNumber } from "./summary-dom.ts";

/**
 * The two pages LinkedIn gives an author about their own account, read off its component keys.
 *
 * The first version of this file matched the visible labels, and it cost a Spanish customer five
 * days of an empty page: his LinkedIn says "Impresiones", so every number came back null and the
 * database recorded zeros, which read as an account nobody had seen. Adding languages would have
 * been the same mistake made wider.
 *
 * LinkedIn names these blocks itself. Verified on a live page 2026-09-13:
 *
 *   #impressionsBreakdownCA   the in and out of network split, inside the impressions tile
 *   #membersReachedFeatureCA  the members reached tile
 *   #demographicsFeatureCA    the audience breakdown on the content page
 *   #demographicsFeatureAA    the same on the audience page
 *   [componentkey$="followers_module_replaceable_component_ref"]  the follower tile
 *   [componentkey*="TOP_DEMOGRAPHICS"]  the ranked slices
 *
 * Those are identifiers, so they read the same in every language. Nothing below matches a word.
 *
 * The demographic CATEGORY names are the exception, and deliberately so: they are the content being
 * displayed rather than a control being found. They are stored and shown exactly as LinkedIn wrote
 * them, never matched against a list, so an account in Spanish shows Spanish categories instead of
 * showing nothing.
 */

/** A slice of the audience, in LinkedIn's own words because that is what gets displayed. */
export interface Demographic {
  category: string;
  label: string;
  percent: number;
}

export interface ContentAnalytics {
  impressions: number | null;
  membersReached: number | null;
  inNetworkPercent: number | null;
  demographics: Demographic[];
}

export interface AudienceAnalytics {
  followers: number | null;
  demographics: Demographic[];
}

/**
 * The browser side of the read, shared by both pages.
 *
 * Everything it returns is a string, so the parsing and the locale arithmetic happen in Node where
 * they can be tested without a browser.
 */
const SCRAPE = `(anchors) => {
  const firstCount = (root) => {
    if (!root) return null;
    for (const node of Array.from(root.querySelectorAll("*"))) {
      if (node.children.length > 0) continue;
      const text = (node.textContent || "").trim();
      if (!text || text.includes("%")) continue;
      if (/^[\\d\\s\\u00a0\\u202f.,]+[km]?$/i.test(text)) return text;
    }
    return null;
  };

  /** Climbs from a block until a bare count appears beside it, never further than the tile. */
  const countBeside = (el) => {
    let node = el ? el.parentElement : null;
    for (let i = 0; i < 4 && node; i += 1) {
      const found = firstCount(node);
      if (found) return found;
      node = node.parentElement;
    }
    return null;
  };

  /**
   * The ranked slices, read as a shape rather than as words: every percentage is preceded by its
   * label and that label by its category, so a percentage is the marker and the two leaves before
   * it are the answer.
   */
  const slices = (root) => {
    if (!root) return [];
    const leaves = Array.from(root.querySelectorAll("*"))
      .filter((n) => n.children.length === 0)
      .map((n) => (n.textContent || "").trim())
      .filter(Boolean);
    const out = [];
    for (let i = 2; i < leaves.length; i += 1) {
      const pct = /^(\\d[\\d.,]*)\\s*%$/.exec(leaves[i]);
      if (!pct) continue;
      const label = leaves[i - 1];
      const category = leaves[i - 2];
      if (/%$/.test(label) || /%$/.test(category)) continue;
      out.push({ category, label, percent: pct[1] });
    }
    return out;
  };

  const breakdown = document.querySelector(anchors.breakdown);
  const percent = breakdown
    ? (/(\\d[\\d.,]*)\\s*%/.exec(breakdown.innerText || "") || [null, null])[1]
    : null;

  return {
    impressions: countBeside(breakdown),
    membersReached: firstCount(document.querySelector(anchors.reached)),
    followers: countBeside(document.querySelector(anchors.followers)) ||
      firstCount(document.querySelector(anchors.followers)),
    inNetwork: percent,
    slices: slices(document.querySelector(anchors.demographics)),
    anchorsFound: Boolean(
      document.querySelector(anchors.breakdown) ||
      document.querySelector(anchors.reached) ||
      document.querySelector(anchors.followers) ||
      document.querySelector(anchors.demographics)
    ),
  };
}`;

const ANCHORS = {
  content: {
    breakdown: "#impressionsBreakdownCA",
    reached: "#membersReachedFeatureCA",
    followers: "#never-on-this-page",
    demographics: '[componentkey*="CA_TOP_DEMOGRAPHICS"]',
  },
  audience: {
    breakdown: "#never-on-this-page",
    reached: "#never-on-this-page",
    followers: '[componentkey$="followers_module_replaceable_component_ref"]',
    demographics: '[componentkey*="AA_TOP_DEMOGRAPHICS"]',
  },
} as const;

export const CREATOR_URLS = {
  content: "https://www.linkedin.com/analytics/creator/content/",
  audience: "https://www.linkedin.com/analytics/creator/audience/",
} as const;

interface Scraped {
  impressions: string | null;
  membersReached: string | null;
  followers: string | null;
  inNetwork: string | null;
  slices: { category: string; label: string; percent: string }[];
  anchorsFound: boolean;
}

export function toDemographics(raw: Scraped["slices"]): Demographic[] {
  const seen = new Set<string>();
  const out: Demographic[] = [];
  for (const s of raw) {
    const key = s.category.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    /** Number("") is 0 and 0 is finite, so an empty reading would become a real looking slice. */
    if (!/^\d/.test(s.percent.trim())) continue;
    const percent = Number(s.percent.replace(",", "."));
    if (!Number.isFinite(percent)) continue;
    out.push({ category: s.category, label: s.label, percent });
  }
  return out;
}

async function scrape(page: Page, url: string, anchors: Record<string, string>): Promise<Scraped | null> {
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  const main = await page.waitForSelector("main", { timeout: 20_000 }).catch(() => null);
  if (!main) return null;
  await dwell(2000, 4000);
  await scrollHuman(page, 1);
  await dwell(1200, 2600);

  const raw = (await page
    .evaluate(SCRAPE as unknown as string, anchors)
    .catch(() => null)) as Scraped | null;

  if (raw && !raw.anchorsFound) {
    // Said out loud rather than recorded as zero: a page that stopped carrying these keys and an
    // account nobody looked at are the same row otherwise, which is how this went unnoticed.
    log("a creator analytics page no longer carries the keys this reads", { url });
  }
  return raw;
}

export async function readCreatorContent(page: Page): Promise<ContentAnalytics | null> {
  const raw = await scrape(page, CREATOR_URLS.content, ANCHORS.content);
  if (!raw || !raw.anchorsFound) return null;
  return {
    impressions: raw.impressions === null ? null : toNumber(raw.impressions),
    membersReached: raw.membersReached === null ? null : toNumber(raw.membersReached),
    inNetworkPercent: raw.inNetwork === null ? null : Number(raw.inNetwork.replace(",", ".")),
    demographics: toDemographics(raw.slices),
  };
}

export async function readCreatorAudience(page: Page): Promise<AudienceAnalytics | null> {
  const raw = await scrape(page, CREATOR_URLS.audience, ANCHORS.audience);
  if (!raw || !raw.anchorsFound) return null;
  return {
    followers: raw.followers === null ? null : toNumber(raw.followers),
    demographics: toDemographics(raw.slices),
  };
}
