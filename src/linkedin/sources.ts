import type { Page } from "patchright";
import type { Config } from "../config.ts";
import { log } from "../logger.ts";
import { openSession, hasSessionCookie } from "../browser/driver.ts";
import { dwell, scrollHuman, sleep, randInt } from "../browser/human.ts";
import { actionDelayMs } from "../safety/envelope.ts";
import { book } from "../safety/reading.ts";
import type { DB } from "../store.ts";
import { judgeAsking, judgeIcpFit } from "../messages/generate.ts";
import { AGENT } from "./agent-meta.ts";
import { mine, type Engager, matchesIcp, matchesLocation, parseCard, cardToEngager, searchPostCards, queueLeads, isAsking, dedupeByProfile, readMeter } from "./miner.ts";

/**
 * Lead sources beyond competitor engagement. Each one reads a different intent signal, all through
 * ordinary logged-in browsing: no scraping tools, no Sales Navigator, nothing the account cannot do
 * by hand. Every source returns the same Engager shape, so the run can mix and rotate them freely.
 *
 * Two signals from the research were tried and dropped, because a normal account cannot act on them:
 * job listings expose no contactable person (the hiring team block is absent), and event attendee
 * lists are no longer public. People *posting* that they are hiring cover the first case instead.
 */

/**
 * The people who commented on and reacted to the customer's OWN posts.
 *
 * The warmest signal on LinkedIn and the one this product had no excuse for
 * missing: LinkedGrow publishes those posts, so the agent is reading the
 * audience of content the customer already paid to create. It costs the
 * account nothing against the commercial use limit, because a profile's
 * activity feed is opened by URL and no search is run.
 *
 * Two things are deliberately different from mining a competitor.
 *
 * Connected people are KEPT. Everywhere else an existing first-degree
 * connection is noise, because the product's job is to meet new people. Here it
 * is the best outcome available: they already know the customer, they just
 * engaged with them in public, and there is no invitation to wait for. The
 * sequence writes to them directly.
 *
 * And the account owner is dropped, because a customer replying under their own
 * post is not a lead and would otherwise be claimed as one every single pass.
 */
export async function mineOwnPosts(
  ctx: DB,
  page: Page,
  cfg: Config,
  ownProfileUrl: string,
  opts: { maxPerPost?: number; maxPosts?: number; dryRun?: boolean } = {}
): Promise<Engager[]> {
  const base = ownProfileUrl.trim().replace(/\/+$/, "");
  if (!/\/in\/[^/]+$/.test(base)) {
    log("no profile URL on the account, so its own posts cannot be read", { url: ownProfileUrl });
    return [];
  }
  const ownId = base.match(/\/in\/([^/?#]+)/)?.[1] ?? "";

  const engaged = await mine(
    ctx,
    page,
    // Their own audience, so somebody already connected is the point rather
    // than a duplicate. Everything else about the read is identical.
    { ...cfg, skipConnected: false },
    {
      targets: [`${base}/recent-activity/all/`],
      maxPerPost: opts.maxPerPost ?? 40,
      maxPostsPerTarget: opts.maxPosts ?? 5,
      dryRun: true,
    }
  );

  /**
   * Relabelled to `own:`, which is what puts them at the top of the queue.
   *
   * The miner names a signal after the page it was read from, so these would
   * arrive as `comment:maria-lecocq` and rank like any other commenter. The
   * ordering in HOT_FIRST looks for the `own:` prefix, and the sentence the
   * customer reads on the row is built from the same string.
   */
  const leads = engaged
    .filter((e) => e.profileId && e.profileId !== ownId)
    .map((e) => ({
      ...e,
      source: e.source.startsWith("comment:") ? "own:comment" : "own:reaction",
    }));

  log(`Own posts: ${engaged.length} engaged, ${leads.length} worth keeping.`);
  if (!opts.dryRun) log(`Queued ${await queueLeads(ctx, leads)} new leads from your own posts.`);
  return leads;
}

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
      const out: Array<{ href: string; text: string; photo: string }> = [];
      const seen = new Set<string>();
      for (const a of Array.from(document.querySelectorAll('main a[href*="/in/"]')) as HTMLAnchorElement[]) {
        const href = a.href.split("?")[0] ?? a.href;
        if (seen.has(href)) continue;
        seen.add(href);
        const row = a.closest("li") ?? a.parentElement;
        // The face, same picker as the people search: climb a few levels for an
        // img whose src is a real member photo, rejecting company logos and the
        // grey ghost. Viewer leads arrived faceless because this was never read.
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
        out.push({ href, text: ((row as HTMLElement)?.innerText ?? "").trim(), photo });
      }
      return out;
    });

    readMeter.names += rows.length;
    const leads: Engager[] = [];
    for (const r of rows) {
      const lead = toViewer(r);
      if (lead && matchesIcp(cfg.leads.icpKeywords, lead.headline ?? "", lead.context ?? "")) {
        leads.push({ ...lead, avatarUrl: r.photo || undefined });
      }
    }
    // A free account names only a handful of the viewers it counts, so a small number here is normal.
    log(`Profile viewers: ${rows.length} named, ${leads.length} match the ICP.`);
    if (!opts.dryRun) log(`Queued ${await queueLeads(db, leads)} new viewer leads.`);
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
    /**
     * The third line of a people-search row, which is the place.
     *
     * "Lyon, Auvergne-Rhone-Alpes, France", "Greater Paris Metropolitan
     * Region", "Zurich, Switzerland". Profile-viewer rows do not carry one and
     * neither do reaction rows, so this is often absent, and matchesLocation
     * treats absent as passing rather than throwing the person away.
     */
    location: lines[2] ?? undefined,
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
/**
 * Why a pasted address cannot be worked, in a sentence, or null when it can.
 *
 * A Sales Navigator list addresses its people as `/sales/lead/<urn>` and never
 * gives the public `/in/` slug the rest of the product runs on, so there is no
 * profile to visit, invite or message. The wizard offered it anyway, the
 * extraction found nothing, and the source reported an empty search exactly
 * like a quiet day. Silence is the bug: a customer who pasted their best list
 * had no way to know it was never going to work.
 *
 * A regular people search does everything a saved list does here, including
 * every filter a Premium or Sales Navigator subscription unlocks, so the answer
 * is to say so rather than to fail quietly.
 */
export function unsupportedSearch(query: string): string | null {
  if (/linkedin\.com\/sales\//i.test(query)) {
    return "A Sales Navigator list hides the public profile addresses, so the agent cannot open, invite or message anybody on it. Paste a normal LinkedIn people search instead: the filters you set in Sales Navigator all exist there, and the agent can work it.";
  }
  if (/linkedin\.com\/(feed|messaging|notifications|jobs)\b/i.test(query)) {
    return "That is one of your own LinkedIn pages rather than a search, so there is nobody on it to find.";
  }
  return null;
}

/**
 * Whether a people search should turn the page.
 *
 * One page holds about ten cards, and one page was all it ever read: the most
 * productive source type on the live agent got eight names per query and gave
 * the rest of the results back to nobody. Page 2 of a query that just proved
 * itself beats page 1 of a weaker one, so the pass pays one more search for it,
 * booked before the page opens. A page that came back thin says the query is
 * exhausted, and a second page of nothing is a search wasted.
 */
export function wantsNextPage(kept: number, rowsOnPage: number, still: number): boolean {
  return still > 0 && kept >= 2 && rowsOnPage >= 5;
}

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
    let kept = 0;
    let offIcp = 0;
    let offPlace = 0;
    for (let pageNo = 1; pageNo <= 2; pageNo++) {
      if (pageNo > 1) {
        // The next page of results is another search against the commercial
        // pool, so it is paid for before it opens, like the first one was.
        await book(ctx.linkedinAccountId, ctx.timezone, { searches: 1 }).catch(() => {});
      }
      const pageUrl =
        pageNo === 1 ? url : `${url}${url.includes("?") ? "&" : "?"}page=${pageNo}`;
      await page.goto(pageUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
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
      /**
       * Both shapes of person link, because there are two.
       *
       * The wizard offers "work through a search or a Sales Navigator list" and
       * this selector only ever matched `/in/`. Sales Navigator addresses its
       * people as `/sales/lead/<urn>`, so a customer who pasted their saved
       * list got zero leads, no error and no explanation: the page loaded, the
       * query found nothing, and the source reported an empty search like any
       * other quiet day.
       */
      for (const a of Array.from(
        document.querySelectorAll('main a[href*="/in/"], main a[href*="/sales/lead/"]')
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

    readMeter.names += rows.length;
    for (const row of rows) {
      const lead = toViewer(row);
      if (!lead) continue;
      if (!matchesIcp(cfg.leads.icpKeywords, lead.headline ?? "", lead.context ?? "")) {
        offIcp++;
        continue;
      }
      // Where the customer said their buyers are. A people-search row is the one
      // card that carries a place, and it is also the widest door the agent has.
      if (!matchesLocation(cfg.leads.locations ?? [], lead.location)) {
        offPlace++;
        continue;
      }
      found.push({ ...lead, source: `search:${query}`, avatarUrl: row.photo || undefined });
      if (++kept >= maxPerQuery) break;
    }
    log(`  ${kept} kept for "${query}" so far (page ${pageNo}: ${rows.length} people, ${offIcp} off-ICP, ${offPlace} off-location).`);
    if (!wantsNextPage(kept, rows.length, maxPerQuery - kept)) break;
    await sleep(actionDelayMs(cfg));
    }
    await sleep(actionDelayMs(cfg));
  }

  const unique = dedupeByProfile(found);
  if (!opts.dryRun) {
    log(`Queued ${await queueLeads(db, unique)} new people-search leads.`);
  }
  return unique;
}

/**
 * A LinkedIn group the customer belongs to, read as a feed.
 *
 * The last free room on LinkedIn where a self-selected audience gathers around
 * one subject, and one of the two signals Gojiberry lists that we had nothing
 * for. It costs no search, because the group is opened by its own URL, and the
 * membership requirement is a feature rather than an obstacle: the account has
 * to have joined, which is exactly what a person doing this by hand would do.
 *
 * Read like any other feed. The people are in the comments under the posts, and
 * the same asking gate applies, because being in a group about a subject says
 * far less than posting a question about it.
 */
export async function mineGroup(
  ctx: DB,
  page: Page,
  cfg: Config,
  groupUrl: string,
  opts: { maxPerPost?: number; maxPosts?: number; dryRun?: boolean } = {}
): Promise<Engager[]> {
  const url = groupUrl.trim();
  if (!/linkedin\.com\/groups\/\d+/.test(url)) {
    log("that does not look like a LinkedIn group address", { url });
    return [];
  }

  const engaged = await mine(ctx, page, cfg, {
    targets: [url.replace(/\/+$/, "")],
    maxPerPost: opts.maxPerPost ?? 30,
    maxPostsPerTarget: opts.maxPosts ?? 5,
    dryRun: true,
  });

  const groupId = url.match(/groups\/(\d+)/)?.[1] ?? "group";
  const leads = engaged.map((e) => ({ ...e, source: `group:${groupId}` }));
  log(`Group ${groupId}: ${leads.length} people on the ICP.`);
  if (!opts.dryRun) log(`Queued ${await queueLeads(ctx, leads)} new leads from the group.`);
  return leads;
}

export type SignalKind = "hashtag" | "jobchange" | "hiring" | "funding" | "event";

/**
 * Search-backed sources. They all read the same content-search surface, and differ only in what they
 * search for and how strictly they gate the result:
 *
 * - hashtag: posts under a topic tag. The topic alone is weak, so only people asking for help pass.
 * - jobchange: someone who just moved into a new seat. The move itself is the signal, and it decays
 *   fast, so no asking gate; the ICP filter keeps it to roles that buy what we sell.
 * - hiring: someone posting that they are hiring for work in our space, which means a live project.
 * - funding: someone announcing money in the bank. The clearest budget signal that exists, and the
 *   one competitors advertise most loudly. It needs no external data provider: founders announce it
 *   themselves, on LinkedIn, in the same breath as thanking their investors.
 * - event: someone attending or speaking at something in our space. Attendee LISTS stopped being
 *   readable, which is why this was dropped once, but the posts about attending never went anywhere
 *   and they carry the same signal with a name attached.
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
  if (!opts.dryRun) log(`Queued ${await queueLeads(db, found)} new ${kind} leads.`);
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
  if (kind === "funding" && !JUST_RAISED.test(parsed.body)) return false;
  if (kind === "event" && !AT_AN_EVENT.test(parsed.body)) return false;
  // A tag says what a post is about, never that its author needs help, so the asking gate applies.
  if (kind === "hashtag" && !isAsking(parsed.body)) return false;
  return true;
}

/**
 * The queries each buying event is searched with, built from the customer's own roles.
 *
 * A job move or a hire is about the person, so the role is the query and the
 * regex does the rest. Money and events are about the company, and searching
 * "founder" against a funding regex returns almost nothing, so those two carry
 * their own words and use the role only to narrow the field.
 */
export function queriesForSignal(kind: SignalKind, roles: string[]): string[] {
  const some = roles.slice(0, 4);
  if (kind === "funding") {
    return some.length
      ? some.slice(0, 2).flatMap((r) => [`${r} raised funding`, `${r} seed round`])
      : ["raised funding", "seed round"];
  }
  if (kind === "event") {
    return some.length
      ? some.slice(0, 2).flatMap((r) => [`${r} speaking at`, `${r} attending conference`])
      : ["speaking at conference", "attending conference"];
  }
  return some;
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
/**
 * Money that has just landed, which is the budget signal every rival advertises.
 *
 * Deliberately narrow. "Funding" and "investment" on their own match every
 * fundraising consultant and VC newsletter on the platform, and those are the
 * two populations that must not come through this door. What is matched here is
 * somebody saying it happened to THEM, in the shapes founders actually write.
 */
const JUST_RAISED =
  /\b(we(')?ve raised|we raised|i(')?ve raised|just raised|closed our (pre-?seed|seed|series [a-d]|round|funding)|announcing our (pre-?seed|seed|series [a-d])|our (pre-?seed|seed|series [a-d]) (round|funding) (is|has|closed)|newly backed by)\b/i;
/**
 * Somebody standing in a room full of their own market.
 *
 * The attendee lists themselves stopped being public, which is why this signal
 * was dropped once and recorded as impossible. It is not: people post that they
 * are going, and a post carries a name, a headline and a reason to write to
 * them that no list ever did.
 */
const AT_AN_EVENT =
  /\b(speaking at|i(')?ll be at|we(')?ll be at|see you at|excited to (attend|speak|join)|attending|joining us at|booth \d+|our talk at|presenting at|panel at)\b/i;
