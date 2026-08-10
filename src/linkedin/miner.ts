import type { Page } from "patchright";
import type { Config } from "../config.ts";
import { log } from "../logger.ts";
import { openSession, hasSessionCookie } from "../browser/driver.ts";
import { dwell, scrollHuman, clickHumanLocator, sleep, randInt } from "../browser/human.ts";
import { actionDelayMs } from "../safety/envelope.ts";
import { getMeta, setMeta, type DB } from "../store.ts";
import { claimLead } from "../db.ts";
import { judgeAsking } from "../messages/generate.ts";
import { resolveCompetitorUrls } from "./resolve.ts";
import { AGENT } from "./agent-meta.ts";

/** A person who engaged with a competitor's content, scored later against the ICP. */
export interface Engager {
  profileId: string;
  profileUrl: string;
  fullName: string;
  firstName: string;
  headline: string;
  /** Where we found them, e.g. "reaction:calendly" or "comment:calendly". */
  source: string;
  /** For intent leads, the question they posted, used to personalise the first message. */
  context?: string;
  /**
   * The face on the card, as LinkedIn served it.
   *
   * Stored as their URL first and copied into our own bucket afterwards, by the
   * insights pass. LinkedIn's media URLs expire, so the copy is what keeps a
   * lead from becoming faceless a week later; taking it here rather than later
   * is what avoids a profile visit per lead just to fetch a thumbnail.
   */
  avatarUrl?: string;
}

export interface MineOptions {
  /** Explicit competitor company "posts" pages or individual post URLs to mine. */
  targets?: string[];
  /** Competitor names to resolve to LinkedIn company URLs in-session, then mine. */
  competitorNames?: string[];
  /** True = extract and return only, never touch the db or LinkedIn beyond reading. */
  dryRun?: boolean;
  /** Cap engagers pulled per post, to stay light on the account. */
  maxPerPost?: number;
  /** Cap posts opened per target. */
  maxPostsPerTarget?: number;
}

const DEFAULTS = { maxPerPost: 25, maxPostsPerTarget: 2 };

/**
 * How far back down a feed a pass will walk before returning to the top.
 *
 * Twenty-four posts is a couple of months for a company that posts twice a
 * week, which is deep enough that the recent posts have fresh engagement by the
 * time the walk comes round again, and shallow enough that reaching the bottom
 * costs a handful of scrolls rather than a minute of them.
 */
const MAX_MINE_DEPTH = 24;

/**
 * How a post's reading allowance splits between the people who wrote something
 * and the people who clicked a button.
 *
 * The file has always said commenters carry more intent than reactors. The
 * budget never acted on it: both took `maxPerPost`, and since a post has a
 * handful of comments and hundreds of reactions, the cap only ever bound on
 * reactions. So reactions supplied most of the volume.
 *
 * Measured on 90 real leads from one agent, by how many reached the score a
 * lead needs before anybody writes to them:
 *
 *   comment    13 leads, 46% qualified, average score 46
 *   search     49 leads, 31% qualified, average score 28
 *   reaction   28 leads, 11% qualified, average score 17
 *
 * A like is worth roughly a quarter of a comment and it was supplying two
 * thirds of the people. Reactions now take about a third of a post's
 * allowance, and the allowance itself is spread over more posts, because every
 * extra post opened brings its own comment section with it.
 */
const REACTION_SHARE = 0.3;

/**
 * Every shape LinkedIn serves a modal in, native one first.
 *
 * The reactions list has been returning NOBODY. Read off the live account on
 * 2026-08-10: a Lovable pass logged "12 commenters on lovable-dev" and then
 * "Mined 5 unique engagers", with not one reactor among them, and the same
 * shape on every pass before it. The comments path uses its own mechanism and
 * kept working, which is why the failure looked like a thin day rather than a
 * broken selector.
 *
 * `div[role="dialog"]` never becomes visible on the current DOM, so
 * openReactionsModal timed out and returned false, and the loop `continue`d
 * without a word. A post carrying hundreds of reactions contributed zero
 * people, every time, and the reading budget the agent was fighting over was
 * never the thing holding it back.
 *
 * This is the SAME defect fixed in publish.ts on 2026-08-10 for the carousel,
 * where the native `<dialog>` had to go in front of the same list, and it was
 * not carried across. Both selectors are kept: nothing here says LinkedIn
 * stopped serving the old shape, only that it also serves a new one.
 */
const DIALOG = 'dialog[open], div[role="dialog"]';

/**
 * Mines engagement leads from competitor content. This is browser activity on the account, so it
 * moves at a human pace and reads only: it opens a post, opens its reactions and comments, and
 * extracts the people, never liking, commenting, connecting or messaging.
 *
 * In dryRun it returns the engagers without writing anything, which is the safe first test.
 */
export async function mine(ctx: DB, page: Page, cfg: Config, opts: MineOptions): Promise<Engager[]> {
  const maxPerPost = opts.maxPerPost ?? DEFAULTS.maxPerPost;
  const maxPostsPerTarget = opts.maxPostsPerTarget ?? DEFAULTS.maxPostsPerTarget;

  // The session and the tenant are owned by the run loop and handed in. The
  // original opened its own browser and its own database because there was one
  // account; a worker running many cannot. Section 7g change 1.
  const db = ctx;
  const context = page.context();
  const engagers: Engager[] = [];
  try {
    if (!(await hasSessionCookie(context, AGENT.cookieHost, AGENT.cookieName))) {
      throw new Error("Not logged in. Run npm run login and finish logging the account in.");
    }
    let targets = opts.targets ? [...opts.targets] : [];
    if (opts.competitorNames?.length) {
      const resolved = await resolveCompetitorUrls(page, opts.competitorNames, db);
      targets = [...targets, ...resolved];
    }
    if (targets.length === 0) log("No mining targets (pass targets or competitorNames).");
    for (const target of targets) {
      /**
       * How far down this company's feed to start, and why it moves.
       *
       * mineTarget opened the page, scrolled a little and read the first few
       * posts. Every pass, for ever. The people under those posts are claimed
       * on the first pass and every pass after it returns the same names, which
       * the deduplication then throws away, so the pass reports nothing found.
       *
       * That is not a theory. On the real agent between 2026-08-01 and
       * 2026-08-08, 54 of 65 sourcing passes found NOBODY, and the 11 that
       * found somebody were almost all on the first day. A competitor's feed
       * holds months of posts and the miner was reading the same four.
       *
       * So each pass starts where the last one stopped and walks back through
       * the feed, then returns to the top once it has gone deep enough, by
       * which time the recent posts carry engagement it has never seen.
       */
      const key = `mine_depth:${companyLabel(target)}`;
      const stored = Number(await getMeta(db, key));
      const skip = Number.isFinite(stored) && stored > 0 ? stored : 0;

      const found = await mineTarget(cfg, page, target, maxPerPost, maxPostsPerTarget, skip);
      engagers.push(...found);

      // Nothing at this depth means the feed is shorter than we thought, so the
      // next pass starts again at the top rather than walking further into
      // empty space.
      const next = found.length === 0 && skip > 0 ? 0 : skip + maxPostsPerTarget;
      await setMeta(db, key, String(next >= MAX_MINE_DEPTH ? 0 : next));
      await sleep(actionDelayMs(cfg));
    }
  } finally {
  }

  const unique = dedupeByProfile(engagers);

  // Compared against every competitor the customer named, not only the page they were found on,
  // because a LinkedIn slug and the brand people type rarely match: cybot is Cookiebot,
  // tryprofound is Profound.
  const rivals = knownCompetitors(cfg);
  const outsiders = unique.filter((e) => {
    const names = [e.source.split(":")[1] ?? "", ...rivals];
    return !names.some((n) => worksAtCompany(e.headline, n));
  });
  const insiders = unique.length - outsiders.length;
  if (insiders > 0) log(`Dropped ${insiders} people who work at the company whose posts we read.`);

  const onIcp = outsiders.filter((e) =>
    matchesIcp(cfg.leads.icpKeywords, e.headline ?? "", e.context ?? "")
  );
  // What was dropped, in their own words. "11 mined, 0 on ICP" is the same
  // line whether the filter is too narrow or the headlines came back empty
  // because a selector moved, and those need opposite fixes.
  if (onIcp.length === 0 && outsiders.length > 0) {
    log("nobody matched the ICP, here is what was read", {
      keywords: cfg.leads.icpKeywords.slice(0, 6),
      sample: outsiders.slice(0, 3).map((e) => ({
        name: e.fullName,
        headline: e.headline ?? "(empty)",
      })),
    });
  }
  log(`Mined ${unique.length} unique engagers; ${onIcp.length} match the ICP (dropped ${outsiders.length - onIcp.length} off-target).`);

  const asked = await promoteAskers(ctx, onIcp);
  if (asked) log(`${asked} of them asked a question under the post: queued as qualified leads.`);

  if (!opts.dryRun) {
    const inserted = await insertProspects(db, onIcp);
    log(`Queued ${inserted} new on-ICP prospects (skipping already-known profiles).`);
  }
  return onIcp;
}

/**
 * Upgrades commenters who asked a real question into qualified leads.
 *
 * An expert's post is bait: the people asking "how would that work on my site?" underneath it have
 * the problem right now, unlike the rest of the audience who merely reacted. Their comment becomes
 * the prospect's context so the first message can answer them. The cheap text test runs first and
 * the model only settles the genuine candidates, so this costs a couple of calls per run.
 */
async function promoteAskers(ctx: DB, engagers: Engager[]): Promise<number> {
  let promoted = 0;
  for (const e of engagers) {
    if (!e.context || !e.source.startsWith("comment:")) continue;
    if (!isAsking(e.context)) {
      e.context = undefined; // an ordinary comment is no basis for personalisation
      continue;
    }
    if (await judgeAsking(ctx, e.context)) {
      e.source = `question:${e.source.slice("comment:".length)}`;
      promoted++;
    } else {
      e.context = undefined;
    }
  }
  return promoted;
}

/**
 * Mines people who are ASKING about the problem right now, from recent LinkedIn posts.
 *
 * Intent beats demographics: someone posting "how do I make my site GDPR compliant" is a warmer lead
 * than someone who merely holds a matching title. LinkedIn's content search is fuzzy and returns
 * loosely related posts, so every hit must clear two gates: the post body has to really discuss the
 * query, and the author's headline has to fit the ICP. The question itself is stored as the
 * prospect's context so the first message can answer it instead of pitching.
 */
export async function mineIntent(ctx: DB, page: Page, cfg: Config, opts: { queries?: string[]; dryRun?: boolean; maxPerQuery?: number } = {}): Promise<Engager[]> {
  const queries = opts.queries?.length ? opts.queries : cfg.leads.intentQueries;
  const maxPerQuery = opts.maxPerQuery ?? 8;
  if (!queries?.length) {
    log("No intent queries configured (leads.intentQueries).");
    return [];
  }

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
      log(`Searching posts: "${query}"`);
      const cards = await searchPostCards(page, query);

      let kept = 0;
      let offIcp = 0;
      let notAsking = 0;
      for (const card of cards) {
        const lead = toIntentLead(card, query, !ctx.skipConnected);
        if (!lead) continue;
        // Counted, not enforced, and deliberately so.
        //
        // This function's own premise is that intent beats demographics:
        // somebody posting "how do I make my site GDPR compliant" is a warmer
        // lead than somebody who merely holds a matching title. Requiring a
        // job-title keyword on top of that contradicts it, and in practice it
        // emptied every run: a person writing about their broken cookie banner
        // does not put "Founder" or "Small business" in the sentence. On
        // 2026-07-31 it rejected both qualified askers on the only query that
        // returned any.
        //
        // The model below is the real qualifier and it is the one that can tell
        // a person with the problem from a consultant selling the cure, which
        // is the distinction the keyword list was reaching for and cannot make.
        // The gate stays where it belongs, on the demographic miner above.
        if (!matchesIcp(cfg.leads.icpKeywords, lead.headline, lead.context ?? "")) {
          offIcp++;
        }
        // Final authority: the model separates someone with the problem from a consultant selling
        // the cure. Keyword rules cannot, and contacting peers burns the account for nothing.
        if (!(await judgeAsking(ctx, lead.context ?? ""))) {
          notAsking++;
          continue;
        }
        found.push(lead);
        if (++kept >= maxPerQuery) break;
      }
      // Counted per gate, because "0 found" on its own says nothing about
      // which of the four filters emptied the page, and finding that out cost
      // an hour of live diagnosis on 2026-07-31.
      log(
        `  ${kept} askers kept for "${query}" (${cards.length} cards, ${offIcp} without an ICP keyword, ${notAsking} judged not asking).`
      );
      await sleep(actionDelayMs(cfg));
    }
  } finally {
  }

  const unique = dedupeByProfile(found);
  if (!opts.dryRun) {
    const inserted = await insertProspects(db, unique);
    log(`Queued ${inserted} new intent leads (skipping already-known profiles).`);
  }
  return unique;
}

/**
 * Splits a search result card into its author and post body, or null when it is not a member post.
 * Card text reads: "Feed post | <name> | · 3rd+ | <headline> | 1w · | Follow | <post>".
 */
export function parseCard(card: { href: string; text: string; photo?: string }, keepConnected = false): { profileId: string; fullName: string; headline: string; body: string } | null {
  const profileId = profileIdFromUrl(card.href);
  if (!profileId) return null;
  if (!keepConnected && isFirstDegree(card.text.split("\n").slice(0, 4).join(" "))) return null;

  const lines = card.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l !== "Feed post" && l !== "Follow" && !isRowNoise(l));
  if (lines.length < 2) return null;

  const fullName = lines[0] ?? "";
  if (!fullName || fullName.length > 60) return null;

  // The post body starts after the "Follow" row, which we dropped, so take everything past the
  // relative timestamp ("1w ·", "3d ·"). Fall back to the tail when no timestamp is present.
  const timeIdx = lines.findIndex((l) => /^\d+\s*(s|m|h|d|w|mo|y)\b/i.test(l));
  return {
    profileId,
    fullName,
    headline: lines[1] ?? "",
    body: (timeIdx >= 0 ? lines.slice(timeIdx + 1) : lines.slice(2)).join(" ").trim(),
  };
}

/** Builds an Engager from a parsed card. */
export function cardToEngager(
  parsed: { profileId: string; fullName: string; headline: string; body: string; photo?: string },
  source: string
): Engager {
  return {
    profileId: parsed.profileId,
    profileUrl: `https://www.linkedin.com/in/${parsed.profileId}/`,
    fullName: parsed.fullName,
    firstName: parsed.fullName.split(/\s+/)[0] ?? parsed.fullName,
    headline: parsed.headline,
    source,
    context: parsed.body.slice(0, 400) || undefined,
    avatarUrl: parsed.photo || undefined,
  };
}

/**
 * Turns a search result card into a lead, or null when it is not a real person genuinely discussing
 * the query and asking for help rather than teaching.
 */
export function toIntentLead(
  card: { href: string; text: string; photo?: string },
  query: string,
  keepConnected = false
): Engager | null {
  const parsed = parseCard(card, keepConnected);
  if (!parsed) return null;
  if (!onTopic(query, parsed.body)) return null;
  if (!isAsking(parsed.body)) return null;
  return cardToEngager(parsed, `intent:${query}`);
}

/** Runs a LinkedIn content search and returns the raw post cards. Shared by every search-backed source. */
/**
 * Opens a content search and reads the post cards off it.
 *
 * `query` is normally what to type, and the URL is built around it. A customer who pasted their own
 * LinkedIn or Sales Navigator search has already done that part, so a value that is already a URL
 * is opened as-is rather than searched for literally.
 */
export async function searchPostCards(
  page: Page,
  query: string
): Promise<Array<{ href: string; text: string; photo?: string }>> {
  const url = /^https?:\/\/(www\.)?linkedin\.com\//i.test(query.trim())
    ? query.trim()
    : `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&sortBy=%22date_posted%22`;
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
  // Wait for the results themselves, not for the shell around them.
  //
  // `main` appears long before the feed does, and the cards are rendered
  // asynchronously after it. Reading at that moment returned an empty page for
  // queries that plainly have results: "website security" reported 0 cards
  // twice on 2026-07-31 and 5 cards a minute later with nothing changed but the
  // wait. Silent, intermittent, and indistinguishable from a query nobody has
  // posted about, which is the worst shape a bug can take here.
  //
  // A genuinely empty result set costs this timeout once, and nothing else.
  await page.waitForSelector(POST_CARD_SELECTOR, { timeout: 15_000 }).catch(() => {});
  await dwell(2500, 4000);
  await scrollHuman(page, randInt(2, 3));
  // Scrolling loads more of them, and they arrive after the scroll settles.
  await dwell(1500, 2500);
  return page.evaluate((sel) => {
    const out: Array<{ href: string; text: string; photo: string }> = [];
    for (const c of Array.from(document.querySelectorAll(sel))) {
      const a = c.querySelector('a[href*="/in/"]') as HTMLAnchorElement | null;
      if (!a) continue; // company page posts have no member link
      // The picture is already rendered on the card, so taking it costs
      // nothing. Not taking it meant every lead in the dashboard was a name and
      // two grey initials, and going back for it later would mean a profile
      // visit per lead, which is real LinkedIn activity for a thumbnail.
      const img = (c as HTMLElement).querySelector("img");
      const photo = img && /licdn/.test(img.src) ? img.src : "";
      out.push({
        href: a.href.split("?")[0] ?? a.href,
        text: (c as HTMLElement).innerText ?? "",
        photo,
      });
    }
    return out;
  }, POST_CARD_SELECTOR);
}

/** Inserts leads and reports how many were new. Shared by every source. */
export function queueLeads(db: DB, leads: Engager[]): Promise<number> {
  return insertProspects(db, dedupeByProfile(leads));
}

const STOPWORDS = new Set(["how", "does", "what", "why", "for", "the", "and", "you", "your", "with", "from", "that", "this", "have", "need", "want", "looking", "about", "make", "get", "any", "are", "can", "should", "would", "there", "their", "site", "website", "tool", "best"]);

// Someone seeking help writes in the first person and either asks outright or says they are stuck.
const ASKING = /\b(any (advice|recommendations?|suggestions?|tips)|anyone (know|used|tried|recommend)|looking for|how do (i|we)|what do you use|which (tool|one)|need help|struggling|stuck on|not sure how|can'?t figure|has anyone)\b/i;
const FIRST_PERSON = /\b(i|i'?m|i'?ve|my|we|we'?re|we'?ve|our)\b/i;
// Broadcast and lead-magnet tells: the author is selling or teaching, so they are a peer, not a buyer.
const BROADCASTING = /\b(dm me|link in (the )?comments?|comment ["“]?\w+["”]?|follow for more|we help|our clients|book a (call|demo)|sign up|register now|here'?s (how|why)|thread|\d+\s+(tips|ways|reasons|lessons))\b/i;

/**
 * True when the post reads like someone asking for help rather than broadcasting expertise.
 *
 * Without this gate, topical searches mostly surface consultants and vendors teaching the subject.
 * They are peers, not buyers. A real lead writes in the first person and either asks a question or
 * says they are stuck.
 */
export function isAsking(body: string): boolean {
  if (BROADCASTING.test(body)) return false;
  if (ASKING.test(body)) return true; // an explicit request stands on its own ("has anyone used...")
  // A bare question mark only counts when the author is talking about their own situation, otherwise
  // it is the rhetorical hook every marketing post opens with.
  return /\?/.test(body) && FIRST_PERSON.test(body);
}

/** True when the post really discusses the query, not just a fuzzy search match. */
export function onTopic(query: string, body: string): boolean {
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  if (terms.length === 0) return false;
  const hay = body.toLowerCase();
  const hits = terms.filter((t) => hay.includes(t)).length;
  return hits >= Math.min(2, terms.length);
}

/**
 * True when a row belongs to someone already connected to the account.
 *
 * Existing connections must stay out of a cold campaign. They cannot be invited, so the connect step
 * is wasted on them, and worse, they are the account's real contacts: clients, partners, friends.
 * Opening with a stranger's script damages those relationships and earns spam reports, which is what
 * actually gets an account restricted. LinkedIn prints the degree in every row, so it is free to read.
 */
/**
 * Whether this agent should drop people it is already connected to.
 *
 * The toggle exists in the wizard and governed nothing: first-degree contacts were dropped
 * unconditionally, so turning it off changed nothing at all. The default stays on, because a cold
 * script sent to a real contact damages a real relationship, but the setting now means something.
 */
/**
 * The wizard's "skip people I am already connected to" toggle governed nothing: first-degree
 * contacts were dropped unconditionally, so turning it off changed nothing at all.
 *
 * The default stays on, because a cold script sent to a real contact damages a real relationship,
 * but the setting means something now. It is threaded as a flag rather than read from the context
 * because these three converters are pure and tested as such.
 */
export function isFirstDegree(text: string): boolean {
  return /(^|[\s·•|])1st\b/i.test(text) || /\b1st degree connection\b/i.test(text);
}

/**
 * Every competitor name this agent knows, which is the list of competitor sources its owner added.
 *
 * The single-tenant original also merged a cached inference from the business homepage. Here the
 * customer names them in the wizard, so the sources table is the whole truth and there is nothing
 * to infer.
 */
export function knownCompetitors(cfg: Config): string[] {
  return [
    ...new Set((cfg.leads.competitors ?? []).map((n) => n.trim()).filter((n) => n.length >= 3)),
  ];
}

/**
 * True when this person works at the company whose page we are mining.
 *
 * A competitor's posts are read by their own founders, staff and alumni, who all sit right at the
 * top of the reactions list. Pitching a LinkedIn tool to the founder of a LinkedIn tool, because he
 * reacted to his own company's post, is the kind of mistake that ends a conversation before it
 * starts. The company name in their headline is enough to spot them.
 */
export function worksAtCompany(headline: string, sourceLabel: string): boolean {
  const company = sourceLabel.replace(/[-_]+/g, " ").trim().toLowerCase();
  if (company.length < 3) return false;
  const hay = headline.toLowerCase();

  // A LinkedIn slug rarely matches the name people write in their headline: tryprofound is Profound,
  // cybot is Cookiebot. So compare the slug, its words, and the slug with a signup-era prefix
  // stripped, and also accept a headline word that the slug contains.
  const stripped = company.replace(/^(try|get|use|join|go|the|we?are)/, "");
  const parts = new Set<string>([company, stripped, ...company.split(" ")].filter((w) => w.length >= 4));
  for (const part of parts) {
    if (new RegExp(`(^|[^a-z0-9])${escapeRegex(part)}([^a-z0-9]|$)`, "i").test(hay)) return true;
  }
  // The other direction: a headline word long enough to be a brand, sitting inside the slug.
  return hay
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 5)
    .some((w) => company.includes(w));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keeps engagers who look like the ICP. An empty keyword list keeps everyone.
 *
 * Reads what the person WROTE as well as what their headline says, because the
 * headline is where people put their pitch and the post is where they say their
 * situation. Tested against a real search on 2026-07-31: of four people found
 * asking about website security, one introduced himself as "I'm the owner of
 * Apex Workforce" in the post itself and carried none of the ICP words in his
 * headline. Judging him off-target on that basis threw away the best lead on
 * the page, and the run reported nothing found.
 *
 * Still a gate rather than a scorer: what it keeps out is the consultant whose
 * headline and post are both about selling the same service. The model gets the
 * final say on that afterwards.
 */
export function matchesIcp(
  icpKeywords: string[],
  headline: string,
  context = ""
): boolean {
  if (!icpKeywords.length) return true;
  const hay = `${headline || ""}\n${context || ""}`.toLowerCase();
  return icpKeywords.some((k) => hay.includes(k.toLowerCase()));
}

/** Opens a target's recent posts and extracts engagers from each. */
async function mineTarget(
  cfg: Config,
  page: Page,
  target: string,
  maxPerPost: number,
  maxPosts: number,
  /** Posts to walk past before reading, so a later pass sees older posts. */
  skip = 0
): Promise<Engager[]> {
  const url = normalizeTarget(target);
  log(`Opening ${url}${skip > 0 ? ` from post ${skip + 1}` : ""}`);
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  await waitForFeed(page);
  // Deeper posts need more of the feed loaded before they exist in the page at
  // all. Roughly three posts arrive per scroll, so the depth buys its own.
  await scrollHuman(page, randInt(2, 4) + Math.ceil(skip / 3));
  await dwell(1500, 3500);

  const label = companyLabel(target);
  const engagers: Engager[] = [];

  // Commenters first: they carry more intent than reactors (they wrote about the topic), and
  // expanding comments in place is lighter than opening the reactions modal repeatedly.
  // Comments get the larger half and reactions the smaller one. Comments are
  // supply-limited anyway, so in practice this caps the likes and leaves the
  // written signal free to take everything a post has.
  const reactionCap = Math.max(2, Math.floor(maxPerPost * REACTION_SHARE));
  const commentCap = Math.max(3, maxPerPost - reactionCap);

  const commenters = await extractCommenters(cfg, page, label, maxPosts, commentCap, skip);
  engagers.push(...commenters);
  log(`  ${commenters.length} commenters on ${label}.`);

  const range = await postReactionRange(page, maxPosts, skip);
  if (range.length === 0 && commenters.length === 0) {
    log(`No reactions or comments visible on ${url}. The page may need a slug that has recent posts.`);
    return engagers;
  }
  let opened = 0;
  let reacted = 0;
  for (const i of range) {
    if (!(await openReactionsModal(page, i))) continue;
    opened += 1;
    const reactors = await extractFromDialog(page, `reaction:${label}`, reactionCap, !cfg.skipConnected);
    reacted += reactors.length;
    engagers.push(...reactors);
    await closeDialog(page);
    await sleep(actionDelayMs(cfg));
  }
  /**
   * Said out loud, because the silence is what hid this for days.
   *
   * The reactions list returned nobody on every pass and the loop `continue`d
   * without a word, so a post carrying hundreds of names looked exactly like a
   * quiet day. A count of zero opens against a range that had buttons in it is
   * a broken selector and nothing else.
   */
  log(`  ${reacted} reactors on ${label}, from ${opened} of ${range.length} reaction lists opened.`);
  if (range.length > 0 && opened === 0) {
    log(`the reactions list would not open on ${label}, so only its commenters were read`);
  }
  return engagers;
}

/**
 * Expands the comments under the first posts and reads the commenters. A commenter row is
 * structured differently from a reactor: the visible name and the headline live in dedicated
 * meta elements, and the comment body must be excluded from the headline. Selectors verified live.
 */
async function extractCommenters(
  cfg: Config,
  page: Page,
  label: string,
  maxPosts: number,
  maxPerPost: number,
  skip = 0
): Promise<Engager[]> {
  // The "N comments on X's post" count button loads the thread in place. The plain "Comment" button
  // only opens the composer, so we match the count button by its accessible name, not a class.
  const buttons = page.getByRole("button", { name: /comments? on /i });
  const range = reactionRange(await buttons.count(), maxPosts, skip);
  const engagers: Engager[] = [];
  for (const i of range) {
    const button = buttons.nth(i);
    try {
      await dwell(500, 1400);
      await clickHumanLocator(page, button);
    } catch {
      continue;
    }
    await dwell(1200, 2600);
    await scrollHuman(page, randInt(1, 2));
    const raw = await page.evaluate((sel) => {
      const items = Array.from(document.querySelectorAll(sel));
      const seen = new Set<string>();
      const rows: Array<{ href: string; name: string; headline: string; body: string; photo: string }> = [];
      for (const item of items) {
        const a = item.querySelector('a[href*="/in/"]') as HTMLAnchorElement | null;
        if (!a) continue;
        const href = (a.href.split("?")[0] ?? a.href) as string;
        if (seen.has(href)) continue;
        seen.add(href);
        const nameEl = item.querySelector(".comments-comment-meta__description-title") as HTMLElement | null;
        // The subtitle is the headline; the description h3 holds name + degree, so never fall back to it.
        const headlineEl = item.querySelector(".comments-comment-meta__description-subtitle") as HTMLElement | null;
        const bodyEl = item.querySelector(".comments-comment-item__main-content") as HTMLElement | null;
        rows.push({
          href,
          /**
           * The face, read the way the people search reads it.
           *
           * This took the first img in the row and accepted it only if its src
           * already held a licdn URL. On a company's own post that fails every
           * time: the avatar is lazy-loaded, so src is a placeholder until it
           * scrolls in, and the first image in the row can be the company's
           * own logo. Every lead mined from Lovable, Calendly and Cal.com
           * arrived with no picture at all while every lead from the people
           * search had one.
           *
           * So: every img rather than the first, the lazy attributes as well as
           * src, and company logos and ghosts rejected. The same picker lives
           * in the reactions extractor below and in minePeople in sources.ts.
           */
          photo: (() => {
            for (const el of Array.from(item.querySelectorAll("img"))) {
              const img = el as HTMLImageElement;
              const widest = (img.getAttribute("srcset") ?? "")
                .split(",")
                .map((part) => part.trim().split(/\s+/)[0] ?? "")
                .filter(Boolean)
                .pop();
              const src =
                img.getAttribute("data-delayed-url") ||
                widest ||
                img.src ||
                "";
              if (/licdn/.test(src) && !/company-logo|ghost/.test(src)) return src;
            }
            return "";
          })(),
          name: (nameEl?.innerText ?? a.getAttribute("aria-label") ?? "").trim(),
          headline: (headlineEl?.innerText ?? "").trim(),
          body: (bodyEl?.innerText ?? "").replace(/\s+/g, " ").trim(),
        });
      }
      return rows;
    }, COMMENT_ITEM_SELECTOR);

    for (const r of raw) {
      const engager = toCommenter(r, `comment:${label}`, !cfg.skipConnected);
      if (engager) engagers.push(engager);
      if (engagers.length >= maxPerPost * range.length) break;
    }
    await sleep(actionDelayMs(cfg));
  }
  return engagers;
}

/** Builds an Engager from a structured commenter row (name and headline already isolated). */
export function toCommenter(
  row: { href: string; name: string; headline: string; body?: string; photo?: string },
  source: string,
  keepConnected = false
): Engager | null {
  const profileId = profileIdFromUrl(row.href);
  if (!profileId) return null;
  if (!keepConnected && isFirstDegree(`${row.name} ${row.headline}`)) return null;
  const fullName = cleanName(row.name) || row.name.split("\n")[0]?.trim() || "";
  if (!fullName) return null;
  const headline = row.headline.split("\n")[0]?.trim() ?? "";
  const firstName = fullName.split(/\s+/)[0] ?? fullName;
  return {
    profileId,
    profileUrl: `https://www.linkedin.com/in/${profileId}/`,
    fullName,
    firstName,
    headline,
    source,
    context: row.body?.slice(0, 400) || undefined,
    avatarUrl: row.photo || undefined,
  };
}

/** LinkedIn is a single-page app, so wait for the main feed shell rather than network idle. */
async function waitForFeed(page: Page): Promise<void> {
  await page
    .waitForSelector("main, .scaffold-finite-scroll, .feed-shared-update-v2", { timeout: 15_000 })
    .catch(() => {});
}

/**
 * Counts (and thereby validates the presence of) the reaction summary buttons for the first posts.
 * Returns how many are available up to the cap.
 */
/**
 * Which reaction summaries to open, as indexes into the loaded feed.
 *
 * A range rather than a count, because a pass that starts at post 13 has to
 * click the 13th button and not the first one again.
 */
export function reactionRange(available: number, cap: number, skip: number): number[] {
  const start = Math.max(0, Math.min(skip, Math.max(0, available - 1)));
  const end = Math.min(available, start + Math.max(0, cap));
  const out: number[] = [];
  for (let i = start; i < end; i += 1) out.push(i);
  return out;
}

async function postReactionRange(page: Page, cap: number, skip: number): Promise<number[]> {
  const count = await page.evaluate(
    (sel) => document.querySelectorAll(sel).length,
    REACTION_BUTTON_SELECTOR
  );
  return reactionRange(count, cap, skip);
}

/** Clicks the nth reaction summary and waits for the reactors dialog. */
async function openReactionsModal(page: Page, index: number): Promise<boolean> {
  const buttons = page.locator(REACTION_BUTTON_SELECTOR);
  const button = buttons.nth(index);
  if ((await button.count()) === 0) return false;
  try {
    await dwell(600, 1600);
    await clickHumanLocator(page, button);
  } catch {
    return false;
  }
  const dialog = page.locator(DIALOG);
  try {
    await dialog.first().waitFor({ state: "visible", timeout: 8000 });
  } catch {
    return false;
  }
  await dwell(800, 1800);
  return true;
}

/** Scrolls the reactors list a few times, then reads structured people out of the dialog DOM. */
async function extractFromDialog(page: Page, source: string, maxPerPost: number, keepConnected = false): Promise<Engager[]> {
  const scrollable = page.locator(`${DIALOG} ul`).first();
  /**
   * Scrolled as deep as the allowance asks for, not four times whatever it is.
   *
   * LinkedIn loads roughly ten names per page of this list, so four scrolls
   * capped a post at about forty people however much room the visit had. The
   * budget is enforced by the caller and by `book`; this only stops the reader
   * stopping early and calling it a thin post.
   */
  const scrolls = Math.max(4, Math.min(20, Math.ceil(maxPerPost / 10) + 2));
  for (let i = 0; i < scrolls; i++) {
    await scrollable.evaluate((el) => el.scrollBy(0, el.clientHeight)).catch(() => {});
    await sleep(randInt(500, 1200));
  }
  const raw = await page.evaluate((sel) => {
    const dialog = document.querySelector(sel);
    if (!dialog) return [] as Array<{ href: string; text: string; aria: string; photo: string }>;
    const anchors = Array.from(dialog.querySelectorAll('a[href*="/in/"]')) as HTMLAnchorElement[];
    const seen = new Set<string>();
    const rows: Array<{ href: string; text: string; aria: string; photo: string }> = [];
    for (const a of anchors) {
      const href = a.href.split("?")[0] ?? a.href;
      if (seen.has(href)) continue;
      seen.add(href);
      const container = a.closest("li") ?? a.parentElement?.parentElement ?? a;
      // The face is already rendered on the row. The commenter path has always
      // taken it and this one never did, so every lead mined from a reactions
      // list arrived with no picture and the dashboard showed grey initials.
      // Going back for it later would cost a profile visit per lead.
      // Same picker as the commenter path above and minePeople in sources.ts:
      // every img rather than the first, the lazy attributes as well as src,
      // and company logos and ghosts rejected. Taking only img.src found
      // nothing on a company's post, where the avatar loads late.
      const photo = (() => {
        for (const el of Array.from((container as HTMLElement).querySelectorAll("img"))) {
          const candidate = el as HTMLImageElement;
          const widest = (candidate.getAttribute("srcset") ?? "")
            .split(",")
            .map((part) => part.trim().split(/\s+/)[0] ?? "")
            .filter(Boolean)
            .pop();
          const src =
            candidate.getAttribute("data-delayed-url") || widest || candidate.src || "";
          if (/licdn/.test(src) && !/company-logo|ghost/.test(src)) return src;
        }
        return "";
      })();
      rows.push({
        href,
        text: (container as HTMLElement).innerText ?? "",
        aria: a.getAttribute("aria-label") ?? "",
        photo,
      });
    }
    return rows;
  }, DIALOG);

  const engagers: Engager[] = [];
  for (const r of raw) {
    const engager = toEngager(r, source, keepConnected);
    if (engager) engagers.push(engager);
    if (engagers.length >= maxPerPost) break;
  }
  return engagers;
}

async function closeDialog(page: Page): Promise<void> {
  const close = page
    .locator(
      DIALOG.split(", ")
        .flatMap((d) => [`${d} button[aria-label*="Dismiss"]`, `${d} button[aria-label*="Close"]`])
        .join(", ")
    )
    .first();
  if ((await close.count()) > 0) {
    await clickHumanLocator(page, close).catch(async () => {
      await page.keyboard.press("Escape").catch(() => {});
    });
  } else {
    await page.keyboard.press("Escape").catch(() => {});
  }
  await dwell(500, 1200);
}

/**
 * Turns a raw reactor row into a clean Engager, or null when it is not a real person entry.
 * A reactor row's text looks like:
 *   "Sue Maisano\nView Sue Maisano's profile\n \n3rd degree connection\n· 3rd+\nTrusted Expert in ..."
 * so the name is the first real line and the headline is the first line after the profile link and
 * the connection-degree noise.
 */
export function toEngager(row: { href: string; text: string; aria: string; photo?: string }, source: string, keepConnected = false): Engager | null {
  const profileId = profileIdFromUrl(row.href);
  if (!profileId) return null;
  if (!keepConnected && isFirstDegree(row.text)) return null; // already a contact, never a cold prospect by default

  const lines = row.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !isRowNoise(l));

  const fullName = cleanName(row.aria) || lines[0] || "";
  if (!fullName) return null;
  const headline = lines.find((l) => l !== fullName) ?? "";
  const firstName = fullName.split(/\s+/)[0] ?? fullName;

  return {
    profileId,
    profileUrl: `https://www.linkedin.com/in/${profileId}/`,
    fullName,
    firstName,
    headline,
    source,
    avatarUrl: row.photo || undefined,
  };
}

/** Drops the UI chrome LinkedIn renders inside a reactor row: the profile link, action buttons and the connection degree. */
function isRowNoise(line: string): boolean {
  if (/^(view|message|connect|follow)\b/i.test(line)) return true; // "View X's profile", action buttons
  if (/degree connection/i.test(line)) return true; // "3rd degree connection"
  if (/^[•·]/.test(line)) return true; // "· 3rd+" (leading bullet or middot)
  if (/^·?\s*\d+(st|nd|rd|th)\+?$/i.test(line)) return true; // "3rd+", "· 1st"
  return false;
}

/** aria-label is often "View <Name>'s profile" or just the name; strip the wrapper. */
function cleanName(aria: string): string {
  if (!aria) return "";
  const m = aria.match(/^view\s+(.+?)(?:'s|’s)?\s+profile/i);
  return (m?.[1] ?? aria).trim();
}

function profileIdFromUrl(url: string): string | null {
  const m = url.match(/\/in\/([^/?#]+)/);
  return m?.[1] ?? null;
}

export function dedupeByProfile(engagers: Engager[]): Engager[] {
  const seen = new Set<string>();
  const out: Engager[] = [];
  for (const e of engagers) {
    if (!seen.has(e.profileId)) {
      seen.add(e.profileId);
      out.push(e);
    }
  }
  return out;
}

/**
 * Claims new prospects for the workspace, skipping anyone already in the pool.
 * Returns how many this call actually won.
 *
 * The original inserted into a local table with OR IGNORE inside one
 * transaction. Section 9c makes that the atomic claim across a whole workspace:
 * two agents mining overlapping markets will both find the same person, and the
 * unique index on (workspace_id, profile_id) decides it instead of a
 * read-then-write that races. A skipped row is the correct outcome, not a
 * failure. One statement at a time rather than a transaction, because a lost
 * race on one prospect must not roll back the rest.
 */
async function insertProspects(db: DB, engagers: Engager[]): Promise<number> {
  let added = 0;
  for (const e of engagers) {
    const won = await claimLead(db, {
      profileId: e.profileId,
      profileUrl: e.profileUrl,
      fullName: e.fullName,
      headline: e.headline,
      signalType: e.source,
      signalText: e.context ?? null,
    });
    if (won) added++;
  }
  return added;
}

/** Accepts a full URL, or a company slug, and returns a company "posts" URL. */
function normalizeTarget(target: string): string {
  if (target.startsWith("http")) return target;
  return `https://www.linkedin.com/company/${target}/posts/`;
}

export function companyLabel(target: string): string {
  const m = target.match(/company\/([^/?#]+)/);
  if (m?.[1]) return m[1];
  // A person's activity feed is a mining target too, and reading the host out
  // of it labelled every lead from the customer's own posts "www.linkedin.com".
  const person = target.match(/\/in\/([^/?#]+)/);
  if (person?.[1]) return person[1];
  return target.replace(/^https?:\/\//, "").split("/")[0] ?? target;
}

// The reactions summary button carries data-reaction-details and an aria-label like "50 reactions".
// The comments button shares the count-value class, so we key on data-reaction-details to open the
// reactors list and never the comments thread by mistake.
const REACTION_BUTTON_SELECTOR = "button[data-reaction-details]";

// A rendered comment is an article.comments-comment-entity; inside it the author's name is in
// .comments-comment-meta__description-title and the headline in .comments-comment-meta__description-subtitle.
// Verified against live LinkedIn DOM (2026-07).
const COMMENT_ITEM_SELECTOR = "article.comments-comment-entity, .comments-comment-item";

// A post card in content-search results. Verified against live LinkedIn DOM (2026-07); the older
// .feed-shared-update-v2 class is gone from this surface.
const POST_CARD_SELECTOR = "[data-view-name='feed-full-update']";
