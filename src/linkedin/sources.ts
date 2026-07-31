import type { Page } from "patchright";
import type { Config } from "../config.ts";
import { log } from "../logger.ts";
import { openSession, hasSessionCookie } from "../browser/driver.ts";
import { dwell, scrollHuman, sleep, randInt } from "../browser/human.ts";
import { actionDelayMs } from "../safety/envelope.ts";
import type { DB } from "../store.ts";
import { judgeAsking, judgeIcpFit } from "../messages/generate.ts";
import { AGENT } from "./agent-meta.ts";
import { type Engager, matchesIcp, parseCard, cardToEngager, searchPostCards, queueLeads, isAsking, dedupeByProfile } from "./miner.ts";

/**
 * Lead sources beyond competitor engagement. Each one reads a different intent signal, all through
 * ordinary logged-in browsing: no scraping tools, no Sales Navigator, nothing the account cannot do
 * by hand. Every source returns the same Engager shape, so the run can mix and rotate them freely.
 *
 * Two signals from the research were tried and dropped, because a normal account cannot act on them:
 * job listings expose no contactable person (the hiring team block is absent), and event attendee
 * lists are no longer public. People *posting* that they are hiring cover the first case instead.
 */

/** Everyone who viewed the account's profile recently. The warmest signal available: they came to us. */
export async function mineProfileViewers(ctx: DB, page: Page, cfg: Config, opts: { dryRun?: boolean } = {}): Promise<Engager[]> {
  // The session and the tenant are owned by the run loop and handed in. The
  // original opened its own browser and its own database because there was one
  // account; a worker running many cannot. Section 7g change 1.
  const db = ctx;
  const context = page.context();
  try {
    if (!(await hasSessionCookie(context, AGENT.cookieHost, AGENT.cookieName))) {
      throw new Error("Not logged in. Run npm run login and finish logging the account in.");
    }
    await page.goto("https://www.linkedin.com/analytics/profile-views/", { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
    await dwell(2500, 4000);
    await scrollHuman(page, randInt(2, 3));

    const rows = await page.evaluate(() => {
      const out: Array<{ href: string; text: string }> = [];
      const seen = new Set<string>();
      for (const a of Array.from(document.querySelectorAll('main a[href*="/in/"]')) as HTMLAnchorElement[]) {
        const href = a.href.split("?")[0] ?? a.href;
        if (seen.has(href)) continue;
        seen.add(href);
        const row = a.closest("li") ?? a.parentElement;
        out.push({ href, text: ((row as HTMLElement)?.innerText ?? "").trim() });
      }
      return out;
    });

    const leads: Engager[] = [];
    for (const r of rows) {
      const lead = toViewer(r);
      if (lead && matchesIcp(cfg.leads.icpKeywords, lead.headline ?? "", lead.context ?? "")) leads.push(lead);
    }
    // A free account names only a handful of the viewers it counts, so a small number here is normal.
    log(`Profile viewers: ${rows.length} named, ${leads.length} match the ICP.`);
    if (!opts.dryRun) log(`Queued ${queueLeads(db, leads)} new viewer leads.`);
    return leads;
  } finally {
  }
}

/**
 * A viewer row reads "<name> | · 1st | <headline>". Anonymous viewers have no profile link at all,
 * so anything that reaches here is a real, named person.
 */
export function toViewer(row: { href: string; text: string }): Engager | null {
  const id = row.href.match(/\/in\/([^/?#]+)/)?.[1];
  if (!id) return null;
  const lines = row.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^[•·]/.test(l) && !/^·?\s*\d+(st|nd|rd|th)\+?$/i.test(l) && !/^(view|message|connect|follow)\b/i.test(l));
  // LinkedIn prints the connection degree inside the name line on search
  // results, so leads were being stored as "Inga Fira-Jurkowska • 2nd" and
  // every message would have opened with it.
  const fullName = (lines[0] ?? "")
    .replace(/\s*[•·]\s*\d+(st|nd|rd|th)\+?\s*$/i, "")
    .replace(/\s*\b\d+(st|nd|rd|th)\+?\s*$/i, "")
    .trim();
  if (!fullName || fullName.length > 60) return null;
  return {
    profileId: id,
    profileUrl: `https://www.linkedin.com/in/${id}/`,
    fullName,
    firstName: fullName.split(/\s+/)[0] ?? fullName,
    headline: lines[1] ?? "",
    source: "viewer",
  };
}

/**
 * The people search, which is the source that was missing entirely.
 *
 * Everything else in this product finds people through something they WROTE:
 * a post asking for help, a comment under a competitor. Both are narrow by
 * construction, and for a niche audience in one country they legitimately
 * return nobody on most days. On 2026-07-31 a full agent run produced zero
 * leads with every filter behaving correctly, because the only two doors it
 * knows were both empty.
 *
 * This is the third door and the wide one: LinkedIn's own people search, which
 * answers "who matches this description" rather than "who happened to post
 * this week". A title and a country return pages of them.
 *
 * It reads only. Nothing is liked, invited or messaged while searching, and
 * the ICP filter still applies afterwards, so a wide door is not a loose one.
 */
export async function minePeople(
  ctx: DB,
  page: Page,
  cfg: Config,
  queries: string[],
  opts: { maxPerQuery?: number; dryRun?: boolean } = {}
): Promise<Engager[]> {
  const db = ctx;
  const maxPerQuery = opts.maxPerQuery ?? 10;
  const found: Engager[] = [];

  for (const query of queries) {
    const url = /^https?:\/\//i.test(query.trim())
      ? query.trim()
      : `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
    log(`Searching people: "${query}"`);
    await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
    // Wait for the results themselves. `main` arrives long before they do and
    // reading at that moment reports an empty search, which is the same bug
    // that made the content search look like a targeting problem for an hour.
    await page
      .waitForSelector('main a[href*="/in/"]', { timeout: 15_000 })
      .catch(() => {});
    await dwell(2500, 4000);
    await scrollHuman(page, randInt(2, 3));
    await dwell(1500, 2500);

    const rows = await page.evaluate(() => {
      const out: Array<{ href: string; text: string; photo: string }> = [];
      const seen = new Set<string>();
      for (const a of Array.from(
        document.querySelectorAll('main a[href*="/in/"]')
      ) as HTMLAnchorElement[]) {
        const href = a.href.split("?")[0] ?? a.href;
        if (seen.has(href)) continue;
        seen.add(href);
        const row = a.closest("li") ?? a.parentElement;
        /**
         * Climb until the face turns up.
         *
         * The picture is on the card but not reliably inside whatever element
         * the name link sits in: on the people-search results it is several
         * levels up, and looking only in the immediate row found nothing, so
         * the first leads this source produced had no avatar at all. Bounded
         * to five hops so it can never wander into the next person's card.
         */
        let photo = "";
        let hop: HTMLElement | null = row as HTMLElement | null;
        for (let i = 0; hop && i < 5 && !photo; i++) {
          for (const candidate of Array.from(hop.querySelectorAll("img"))) {
            const src = (candidate as HTMLImageElement).src ?? "";
            if (/licdn/.test(src) && !/company-logo|ghost/.test(src)) {
              photo = src;
              break;
            }
          }
          hop = hop.parentElement;
        }
        out.push({
          href,
          text: ((row as HTMLElement)?.innerText ?? "").trim(),
          photo,
        });
      }
      return out;
    });

    let kept = 0;
    let offIcp = 0;
    for (const row of rows) {
      const lead = toViewer(row);
      if (!lead) continue;
      if (!matchesIcp(cfg.leads.icpKeywords, lead.headline ?? "", lead.context ?? "")) {
        offIcp++;
        continue;
      }
      found.push({ ...lead, source: `search:${query}`, avatarUrl: row.photo || undefined });
      if (++kept >= maxPerQuery) break;
    }
    log(`  ${kept} kept for "${query}" (${rows.length} people, ${offIcp} off-ICP).`);
    await sleep(actionDelayMs(cfg));
  }

  const unique = dedupeByProfile(found);
  if (!opts.dryRun) {
    log(`Queued ${await queueLeads(db, unique)} new people-search leads.`);
  }
  return unique;
}

export type SignalKind = "hashtag" | "jobchange" | "hiring";

/**
 * Search-backed sources. They all read the same content-search surface, and differ only in what they
 * search for and how strictly they gate the result:
 *
 * - hashtag: posts under a topic tag. The topic alone is weak, so only people asking for help pass.
 * - jobchange: someone who just moved into a new seat. The move itself is the signal, and it decays
 *   fast, so no asking gate; the ICP filter keeps it to roles that buy what we sell.
 * - hiring: someone posting that they are hiring for work in our space, which means a live project.
 */
export async function mineSignal(
  ctx: DB,
  page: Page,
  cfg: Config,
  kind: SignalKind,
  queries: string[],
  opts: { dryRun?: boolean; maxPerQuery?: number } = {},
): Promise<Engager[]> {
  if (!queries.length) return [];
  const maxPerQuery = opts.maxPerQuery ?? 8;
  // The session and the tenant are owned by the run loop and handed in. The
  // original opened its own browser and its own database because there was one
  // account; a worker running many cannot. Section 7g change 1.
  const db = ctx;
  const context = page.context();
  const found: Engager[] = [];
  try {
    if (!(await hasSessionCookie(context, AGENT.cookieHost, AGENT.cookieName))) {
      throw new Error("Not logged in. Run npm run login and finish logging the account in.");
    }
    for (const query of queries) {
      log(`[${kind}] searching "${query}"`);
      const cards = await searchPostCards(page, query);
      let kept = 0;
      for (const card of cards) {
        const lead = await toSignalLead(ctx, cfg, kind, query, card);
        if (!lead) continue;
        found.push(lead);
        if (++kept >= maxPerQuery) break;
      }
      log(`  ${kept} kept from "${query}".`);
      await sleep(actionDelayMs(cfg));
    }
  } finally {
  }
  if (!opts.dryRun) log(`Queued ${queueLeads(db, found)} new ${kind} leads.`);
  return found;
}

type ParsedCard = { profileId: string; fullName: string; headline: string; body: string };

/**
 * The cheap, deterministic gates. They run before any model call so a search full of noise costs
 * nothing, and they are what the offline tests cover.
 */
export function passesSignalGates(cfg: Config, kind: SignalKind, parsed: ParsedCard): boolean {
  if (!matchesIcp(cfg.leads.icpKeywords, parsed.headline, parsed.body ?? "")) return false;
  // A job move or a hiring post only counts when the author could actually buy. Recruiters, HR and
  // juniors show up constantly on both searches and can decide nothing.
  if (kind !== "hashtag" && !looksLikeBuyer(parsed.headline)) return false;
  if (kind === "jobchange" && !JUST_MOVED.test(parsed.body)) return false;
  if (kind === "hiring" && !IS_HIRING.test(parsed.body)) return false;
  // A tag says what a post is about, never that its author needs help, so the asking gate applies.
  if (kind === "hashtag" && !isAsking(parsed.body)) return false;
  return true;
}

/** Applies every gate to one card, ending with the model judgement its signal calls for. */
export async function toSignalLead(
  ctx: DB,
  cfg: Config,
  kind: SignalKind,
  query: string,
  card: { href: string; text: string },
): Promise<Engager | null> {
  const parsed = parseCard(card, !ctx.skipConnected);
  if (!parsed || !passesSignalGates(cfg, kind, parsed)) return null;
  // A tag needs a genuine asker; a move or a hire says something happened, not that it happened to
  // the right person, and those two searches span every industry on earth.
  const judged =
    kind === "hashtag"
      ? await judgeAsking(ctx, parsed.body)
      : await judgeIcpFit(ctx, parsed.headline, parsed.body);
  return judged ? cardToEngager(parsed, `${kind}:${query}`) : null;
}

// Roles that own a website budget, and the ones that never do however senior they sound.
const DECIDES = /\b(founder|co-?founder|owner|ceo|cto|coo|cmo|president|partner|head of|vp\b|chief|director|lead\b|manager|marketer|marketing|growth|seo|agency|freelance|consultant|developer|engineer|ecommerce|e-commerce)\b/i;
const NEVER_BUYS = /\b(recruit|talent acquisition|human resources|\bhr\b|staffing|headhunt|student|intern\b|internship|junior|trainee|apprentice|assistant|open to work|seeking opportunities|job seeker)\b/i;

/** True when the headline reads like someone who could actually approve buying a tool for their site. */
export function looksLikeBuyer(headline: string): boolean {
  if (!headline) return false;
  if (NEVER_BUYS.test(headline)) return false;
  return DECIDES.test(headline);
}

// "Started a new position", "excited to join", "day one at": a new decision maker rebuilding a stack.
const JUST_MOVED = /\b(started a new (position|role|chapter)|excited to (share|announce) that i (have |'ve )?join|thrilled to join|joining .{2,40} as|new role at|day one at|first day at)\b/i;
// Someone announcing a project they need people for, which means budget and a live build.
const IS_HIRING = /\b(we('| a)re hiring|i(')?m hiring|hiring an?|looking to hire|looking for an? (freelance|contract)?\s*(developer|designer|dev\b)|need a (developer|dev|designer)|open (role|position)|join our team)\b/i;
