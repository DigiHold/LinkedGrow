import type { Page } from "patchright";
import type { AgentContext } from "../config.ts";
import {
  claimLead,
  db,
  loadSources,
  recordEvent,
  setLeadScore,
  unscoredLeads,
} from "../db.ts";
import { BudgetExceededError, scoreLead } from "../ai.ts";
import { announce, keepAlive } from "../store.ts";
import { log } from "../logger.ts";
import { mine, mineIntent, type Engager } from "./miner.ts";
import {
  disableSource,
  learn,
  miningOrder,
  recordPass,
  refreshSourceCounters,
  scoreSources,
} from "./learn.ts";
import { asPrompt, readMemory, reviseMemory } from "./memory.ts";
import {
  mineProfileViewers,
  mineSignal,
  minePeople,
  mineOwnPosts,
  mineGroup,
  queriesForSignal,
  unsupportedSearch,
  type SignalKind,
} from "./sources.ts";
import { ensureTargeting } from "./derive.ts";
import { competesWith, rivalryReason } from "./competitor.ts";
import { book, roomToRead, tierOf, MIN_VISIT_READ, type Pace } from "../safety/reading.ts";
import { maturityOf } from "../safety/maturity.ts";

/**
 * Finding the people, which is the half the product is actually bought for.
 *
 * The engine for this was ported from `outreach-agent` months ago with its
 * tests, and until now **nothing called it**. `runSequence` worked through
 * prospects sitting in `agent_leads` and nobody put any there, so an agent
 * would have run forever and found nobody. This is the missing wire.
 *
 * Four kinds of source, in the order they earn their keep:
 *
 * **Competitor engagement** is the workhorse. Open a competitor's posts, take
 * the commenters first because they wrote something and a written sentence
 * carries more intent than a reaction, then the reactors. It reads only: it
 * never likes, comments, connects or messages while mining.
 *
 * **Intent search** looks for posts where somebody is asking about the problem
 * rather than broadcasting about it, which is a distinction a keyword cannot
 * make and a cheap model can.
 *
 * **Buying events** are role changes and hiring posts, because somebody newly
 * in the seat that owns your problem has both a budget and a reason.
 *
 * **Profile viewers** already raised their hand without being asked.
 *
 * The budget is deliberately small per pass. Sourcing is reading rather than
 * writing, so it is far safer than outreach, but a brand-new account that opens
 * fifty posts in its first hour is still a pattern. The allowance grows with the
 * account's warm-up rather than starting at full speed.
 */

/**
 * The most sources one visit will work through, however much room it has.
 *
 * A ceiling rather than a target: the real bound is the reading budget, and
 * this only stops a single visit from touching an agent's whole list at once,
 * which would leave nothing for the visits after it and read like a sweep.
 */
const MAX_SOURCES_PER_PASS = 8;

/** How many to read on the very first pass, when time to the first lead is the whole game. */
const FIRST_RUN_SOURCES = 6;

/**
 * Below this a source is not worth opening: the page load buys almost nobody.
 * The same number bounds a visit, and it lives in reading.ts so the two agree.
 */
const MIN_PROFILES_PER_SOURCE = MIN_VISIT_READ;

/**
 * What a source costs against the commercial use limit.
 *
 * The limit counts searches and out-of-network profile views, and nothing else.
 * Opening a competitor's page by its URL, opening one of its posts and reading
 * who reacted underneath costs zero: no search is run and no profile is
 * visited. A keyword source runs two searches, one over posts and one over
 * people, and a buying-event source runs the same pair.
 *
 * Charging all of them one search flat, which is what this did, both
 * over-charged the cheap sources and under-charged the expensive ones by half.
 * It matters because searches are the scarce pool: on a free account there are
 * eight a day against eighty people to read.
 */
export function searchCost(type: string, queries = 1): number {
  const n = Math.max(1, queries);
  switch (type) {
    case "keyword":
    case "market":
    case "linkedin_search":
      // One search over posts and one over people, for EVERY query the source
      // carries. Charging a flat 2 per source undercounted by the number of
      // queries: on 2026-08-08 a live pass ran 12 searches and booked 4.
      return 2 * n;
    case "buying_event":
      // One search per role, for each of the two kinds of buying event.
      return 2 * n;
    default:
      // A company page and its posts, the profile-views page, a group, or the
      // customer's own activity feed. Opening a URL is not a search, and the
      // commercial use limit does not count it.
      return 0;
  }
}

/**
 * How many searches a source will really run, read off its own configuration.
 *
 * A keyword source stores its queries in `config.queries` and falls back to its
 * label, and a buying-event source searches the customer's roles rather than
 * anything stored on the row. Both were charged as if they ran one.
 */
export function queriesIn(type: string, config: Record<string, unknown>, roles: number): number {
  if (type === "buying_event") {
    // One kind per pass, rotated, for the same reason a keyword source runs one
    // query per pass. Four kinds at four roles was 32 searches against a day
    // that holds seven.
    void config;
    void roles;
    return QUERIES_PER_PASS;
  }
  // One query per pass, rotated. See QUERIES_PER_PASS.
  const queries = config.queries;
  return Array.isArray(queries) && queries.length > 0 ? QUERIES_PER_PASS : 1;
}

/**
 * How many of a source's queries one visit runs, and why it is one.
 *
 * A keyword source carries up to three queries and searched each of them twice,
 * over posts and over people, so it cost six. Measured on the live account on
 * 2026-08-10: a free established profile is allowed SEVEN searches in a day,
 * and it had spent all seven. One source had eaten the day, every other keyword
 * source was locked out until tomorrow, and the agent found two people.
 *
 * Running one query per visit costs two instead of six, so three keyword
 * sources fit in a day where one used to. Nothing is lost: the queries rotate
 * by the source's own pass counter, so all three still run, spread across the
 * day rather than fired in one burst, which is also closer to how a person
 * searches.
 */
const QUERIES_PER_PASS = 1;

/**
 * Which of a source's queries this pass takes, rotating by how often it has run.
 *
 * Deterministic rather than random, so the second query genuinely gets its turn
 * instead of the first coming up three times by chance.
 */
export function queryTurn<T>(queries: T[], passes: number): T[] {
  if (queries.length <= 1) return queries;
  const at = ((passes % queries.length) + queries.length) % queries.length;
  return [queries[at] as T];
}

/** Every shape of "something just changed here" the agent knows how to search for. */
export const BUYING_EVENT_KINDS = ["jobchange", "hiring", "funding", "event"] as const;

/**
 * How deep to read one source, given what the visit is allowed to spend.
 *
 * Both numbers move, which is the fix. Holding posts at four and squeezing only
 * the people per post is what made the arithmetic lie: four posts at the floor
 * of five is twenty people whatever the allowance said, so a visit with ten to
 * spend quietly read twice that and the budget it was checked against was
 * fiction.
 */
export function readingShape(
  perSource: number,
  base: { perPost: number; posts: number }
): { perPost: number; posts: number } {
  const room = Math.max(MIN_PROFILES_PER_SOURCE, perSource);
  /**
   * Posts first up to the cap, then depth on each of them.
   *
   * The divisor used to be six, which spread every allowance thinly across as
   * many posts as it could reach and left five or six people per post. One
   * reactions modal holds hundreds and costs a single open, so once there are
   * enough posts the cheap thing to buy is more of the list already on screen,
   * not another page load.
   */
  const posts = Math.max(1, Math.min(base.posts, Math.ceil(room / 25)));
  const perPost = Math.max(5, Math.min(base.perPost, Math.floor(room / posts)));
  return { perPost, posts };
}

/**
 * Reading allowance by how long the account has existed. A first pass finds
 * enough for a customer to see the thing working within minutes, without the
 * account looking like it woke up and read the whole site.
 */
function readingBudget(ctx: AgentContext): { perPost: number; posts: number } {
  const started = ctx.warmupStartedAt?.getTime() ?? Date.now();
  const days = Math.floor((Date.now() - started) / 86_400_000);
  /**
   * More posts, fewer people from each, which is the same total spent better.
   *
   * A post's comment section is small and its reactions list is not, so the
   * old shape of four posts at twenty-five people each filled itself with
   * likes: measured across 90 real leads, a reaction qualifies at 11% and a
   * comment at 46%. Opening eight posts at twelve people each costs the
   * account the same and harvests twice as many comment sections.
   */
  if (days < 1) return { perPost: 40, posts: 4 };
  if (days < 7) return { perPost: 60, posts: 5 };
  if (days < 21) return { perPost: 80, posts: 6 };
  return { perPost: 100, posts: 6 };
}

function parseConfig(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * How many of what a source just claimed are worth writing to.
 *
 * Counted here rather than derived later, because a lead's score can be
 * rewritten and the question this answers is "what did this source produce on
 * the day it ran", which is the only honest basis for ranking it.
 */
async function goodAmong(sourceId: string, since: number): Promise<number> {
  const { rows } = await db().execute({
    sql: `SELECT COUNT(*) n FROM agent_leads
           WHERE source_id = ? AND created_at >= ? AND match_score >= 70`,
    args: [sourceId, since],
  });
  return Number(rows[0]?.n ?? 0);
}

/** Turns whatever a miner returned into claimed rows, and says so out loud. */
/**
 * Why this person is in the list, in a sentence the customer can read.
 *
 * The column existed and was empty for every lead that was not an intent lead,
 * because the sentence was only ever taken from the question somebody had
 * posted. Everything else carried a machine string in signal_type and nothing
 * in signal_text, so the Signal column on the leads table and the "Why this
 * person" column on the queue were blank down the page. This costs no model
 * call: the shape is already in the type.
 */
/** A LinkedIn company slug, made readable: "cal-com" becomes "Cal Com". */
export function humanCompanyName(slug: string): string {
  return slug
    .replace(/-(dev|com|inc|io|hq|app|official)$/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

export function signalSentence(
  signalType: string | null,
  sourceLabel: string
): string {
  const [kind, ...rest] = (signalType ?? "").split(":");
  const subject = rest.join(":").trim();
  const named = subject || sourceLabel;
  /**
   * A company is called by its name, never by its URL.
   *
   * The subject carried on a reaction or a comment is the slug out of the
   * company page address, and a real message went out on 2026-08-08 saying "you
   * reacted to that lovable-dev post". Nobody writes that. Worse, the slug is
   * often not even the name: Cursor's page is /company/anysphere, so the same
   * sentence would have told somebody they reacted to a post by anysphere,
   * which is simply untrue. The source's own label is the human name, so it
   * wins, and the slug is only tidied up when there is no label at all.
   */
  const company = sourceLabel.trim() || humanCompanyName(subject);
  switch (kind) {
    case "comment":
      return `Commented on a post by ${company}`;
    case "reaction":
      return `Reacted to a post by ${company}`;
    case "search":
      return `Came up in a search for "${named}"`;
    case "question":
      return `Asked a question about ${named}`;
    case "intent":
      return `Posted about ${named}`;
    case "jobchange":
      return `Started a new role, ${named}`;
    case "hiring":
      return `Hiring for ${named}`;
    case "viewer":
      return "Viewed your profile";
    default:
      return sourceLabel ? `Found through ${sourceLabel}` : "Found by the agent";
  }
}

async function claimAll(
  ctx: AgentContext,
  sourceId: string | null,
  sourceLabel: string,
  found: Engager[]
): Promise<number> {
  let claimed = 0;
  for (const person of found) {
    const ok = await claimLead(ctx, {
      profileId: person.profileId,
      profileUrl: person.profileUrl,
      fullName: person.fullName,
      headline: person.headline ?? null,
      // Split out of the headline, which already carries both.
      ...splitHeadline(person.headline ?? null),
      // As LinkedIn served it. The insights pass copies it into our own bucket
      // afterwards, because these URLs expire and a lead should not lose its
      // face a week after it was found.
      avatarUrl: person.avatarUrl ?? null,
      // Kept on the row so the customer sees where somebody is, and so the
      // location filter has something to read on a later pass.
      location: person.location ?? null,
      signalType: person.source ?? null,
      // The question they posted when there is one, because their own words
      // beat any sentence of ours. Otherwise the sentence built from the shape
      // of the signal, so the column is never blank.
      signalText: person.context ?? signalSentence(person.source ?? null, sourceLabel),
      sourceId,
    });
    if (!ok) continue; // Another agent already has them, which is the right outcome.
    claimed += 1;

    // A found person is the one thing on the live line worth interrupting
    // somebody for, so it takes the line off whichever source was mining and
    // says who, with their face.
    await announce(ctx, "adding a new lead:", {
      name: person.fullName,
      avatarUrl: person.avatarUrl ?? null,
      profileUrl: person.profileUrl,
    });

    // One event per person, because this is what the customer watches during
    // the first hour and a silent agent reads as a broken one.
    await recordEvent(
      ctx,
      "lead",
      `Found ${person.fullName}${person.headline ? `, ${person.headline}` : ""}, via ${sourceLabel}`
    ).catch(() => {});
  }
  return claimed;
}

/**
 * One sourcing pass for one agent.
 *
 * Runs inside the session the caller already opened, so it costs no extra
 * sign-in and shares the address and the pacing of everything else.
 */
/**
 * The job title and the company, read out of the headline.
 *
 * They have their own columns and nothing ever filled them, so every lead
 * arrived with a headline and two empty fields, and the dashboard could not
 * group or sort by either. The headline already carries both in the shape
 * people write it: "Senior Software Engineer @Brainstormforce", "Fondateur de
 * schoolsWP | Formateur WordPress", "Head of Growth at Acme".
 *
 * Read rather than guessed: no separator means no company, and the title is
 * whatever came before it. Nothing here visits a profile.
 */
export function splitHeadline(headline: string | null): {
  jobTitle: string | null;
  company: string | null;
} {
  const raw = (headline ?? "").trim();
  if (!raw) return { jobTitle: null, company: null };

  // Everything up to the first separator is the role people lead with.
  //
  // Cleaned at both ends first. Headlines routinely open with an emoji, a flag
  // or a bare separator, and taking the segment as-is stored job titles like
  // "| WordPress" and "🚀". Anything left with no letters in it is not a title.
  const cleaned = raw
    .replace(/^[\s|·•\-–—/]+/, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .trim();
  const first = (cleaned.split(/\s*[|·•]\s*|\s[-–—]\s/)[0] ?? cleaned)
    .replace(/^[\s|·•\-–—/]+|[\s|·•\-–—/]+$/g, "")
    .trim();
  if (!/\p{L}/u.test(first)) return { jobTitle: null, company: null };

  // "@Acme" carries no space after the sign; "at Acme" needs one, or every
  // headline containing the word "at" would lose half its title.
  const at =
    /\s@\s*(.+)$/.exec(first) ?? /\s(?:at|chez|bei|presso)\s+(.+)$/i.exec(first);
  if (at) {
    const company = (at[1] ?? "").trim().replace(/[.,;]$/, "");
    const title = first.slice(0, at.index).trim();
    return {
      jobTitle: title.slice(0, 120) || null,
      company: company.slice(0, 120) || null,
    };
  }
  // "Fondateur de schoolsWP": the same shape with a different preposition.
  const of = /^(.+?)\s+(?:de|du|of)\s+(.+)$/i.exec(first);
  if (of && (of[2] ?? "").length <= 40) {
    return {
      jobTitle: (of[1] ?? "").trim().slice(0, 120) || null,
      company: (of[2] ?? "").trim().slice(0, 120) || null,
    };
  }
  return { jobTitle: first.slice(0, 120) || null, company: null };
}

/**
 * The sources every agent should have whether or not anybody thought to add them.
 *
 * Both are free: they open a URL, they run no search, and they read the two
 * audiences the customer already owns. Leaving them to the wizard meant an
 * agent created before they existed would never get them, and an agent created
 * after would only get them if somebody ticked a box, which is the wrong way
 * round for the warmest signal on the platform.
 *
 * Created disabled-safe: an account with no profile address stored yet simply
 * skips the source at mining time and picks it up once sign-in has read one.
 */
async function ensureCoreSources(ctx: AgentContext): Promise<void> {
  const wanted: Array<{ type: string; label: string }> = [
    { type: "own_posts", label: "People who engage with your posts" },
    { type: "brand", label: "People who viewed your profile" },
  ];
  const { rows } = await db().execute({
    sql: `SELECT type FROM agent_sources WHERE agent_id = ? AND workspace_id = ?`,
    args: [ctx.agentId, ctx.workspaceId],
  });
  const have = new Set(rows.map((r) => String(r.type)));

  for (const source of wanted) {
    if (have.has(source.type)) continue;
    const now = Math.floor(Date.now() / 1000);
    await db().execute({
      sql: `INSERT INTO agent_sources
              (id, workspace_id, agent_id, type, label, enabled, origin, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, 'built-in', ?, ?)`,
      args: [crypto.randomUUID(), ctx.workspaceId, ctx.agentId, source.type, source.label, now, now],
    });
    log("added a built-in source", { agentId: ctx.agentId, type: source.type });
  }
}

export async function sourcePass(
  ctx: AgentContext,
  page: Page,
  opts: { firstRun?: boolean; pace?: Pace } = {}
): Promise<number> {
  await ensureCoreSources(ctx).catch(() => {});
  const all = await loadSources(ctx);

  /**
   * Attention follows results.
   *
   * This used to be whatever loadSources returned, oldest-mined first, so a
   * query that had produced seven good leads and one that had produced none
   * were opened equally often. Untried sources still come first: they are the
   * cheapest information the agent can buy.
   */
  const scores = await scoreSources(ctx);
  // How often each source has run, so its queries can take turns rather than
  // the first one being searched on every single pass.
  const passesOf = new Map(scores.map((s) => [s.id, s.passes]));
  const sources = miningOrder(
    all,
    scores,
    new Map(all.map((s) => [s.id, s.lastMinedAt ? s.lastMinedAt.getTime() : 0]))
  );

  // What the customer typed always goes first. This only decides whether there is anything left to
  // do once their own sources are exhausted, which for an agent set up with one competitor and
  // nothing else is the second day.
  const hasOwnQueries = sources.some(
    (s) => s.type === "keyword" || s.type === "market" || s.type === "linkedin_search"
  );

  if (sources.length === 0 && !ctx.smartLeadFinder) {
    log("no sources configured and the fallback is off", { agentId: ctx.agentId });
    return 0;
  }

  // Widen the headline filter with the words this audience uses about itself.
  //
  // The wizard collects job titles from checkboxes, and a headline is matched
  // against them literally, so an audience described as "Small business" and
  // "Founder" matches almost nobody: people write gérant, indépendante,
  // e-commerce, agency owner. On 2026-07-31 the demographic gate dropped all
  // three real people mined off a competitor's post, and the run reported
  // nothing found.
  //
  // Added to what the customer chose rather than replacing it. Their words are
  // the intent; these are the synonyms they should not have to think of.
  if (ctx.smartLeadFinder) {
    const derived = await ensureTargeting(ctx);
    if (derived.icpKeywords.length) {
      ctx.cfg.leads.icpKeywords = [
        ...new Set([...ctx.cfg.leads.icpKeywords, ...derived.icpKeywords]),
      ];
      log("widened the headline filter", {
        agentId: ctx.agentId,
        from: ctx.cfg.leads.icpKeywords.length - derived.icpKeywords.length,
        now: ctx.cfg.leads.icpKeywords.length,
      });
    }
  }

  const budget = { ...readingBudget(ctx) };
  // The oldest-mined first, which loadSources already orders by, so attention
  // spreads rather than always landing on the same competitor.
  /**
   * The first run reads wider, because it is the one somebody is watching.
   *
   * Two sources per pass spreads attention over the week, which is right once
   * an agent is established and wrong on the day it is created: with a dozen
   * sources it takes half an hour before the first one that actually produces
   * anything comes up, and the customer sees an empty list and concludes the
   * product does not work. Reading is the safe half of what an agent does, so
   * a wider first pass costs nothing on the account.
   */
  /**
   * What the account is still allowed to read today.
   *
   * Sourcing is reading, and reading was the one thing nothing counted. An
   * account restricted on 2026-08-08 for "an unusually high volume of profile
   * data" had sent fifteen invitations in its life and opened on the order of a
   * hundred searches a day. The pass now fits inside the day's allowance rather
   * than running as often as the loop happens to come round.
   */
  const tier = tierOf(ctx.tier);
  const ageDays = Math.floor(
    (Date.now() - (ctx.warmupStartedAt?.getTime() ?? Date.now())) / 86_400_000
  );
  const room = await roomToRead(
    ctx.linkedinAccountId,
    tier,
    ctx.timezone,
    ageDays,
    opts.pace,
    maturityOf(ctx.maturity)
  );
  if (!room.ok) {
    // Not an error and not worth an event every five minutes: the account has
    // read its share for this visit and the next one is hours away. The
    // sequence still runs after this returns, so the pass is not wasted.
    log(`sourcing paused: ${room.reason}`, { accountId: ctx.linkedinAccountId, tier });
    return 0;
  }

  /**
   * As many sources as this visit's share of the day can actually pay for.
   *
   * This was two, flat, and two is what made the whole engine look broken.
   * Measured on the live account on 2026-08-10: the day allowed 395 profile
   * reads and 50 were used, 13%, while the customer watched it find two people
   * in six hours. The visit was handed a share of about a hundred and spent
   * half of it, because the cap said two sources whatever the room.
   *
   * The safety envelope is not weakened by this. What LinkedIn reads is volume,
   * and volume is still bounded exactly where it was: `book` charges every
   * source against the day and the month before its pages are opened, and
   * `roomToRead` refuses the visit once the share is gone. This only stops the
   * agent leaving most of a budget it is allowed to use on the table.
   *
   * Divided by a useful depth rather than the bare floor. One reactions modal
   * holds hundreds of names for a single page load, so a source is worth
   * opening at about twenty-five and splitting a visit into ten slices of ten
   * would buy breadth by throwing away every comment section.
   */
  const USEFUL_DEPTH = 25;
  const affordable = Math.max(1, Math.floor(room.profiles / USEFUL_DEPTH));
  const wanted = opts.firstRun
    ? Math.min(FIRST_RUN_SOURCES, sources.length)
    : Math.min(MAX_SOURCES_PER_PASS, affordable);

  /**
   * Sources are picked to fit both pools, not just the first few in the order.
   *
   * A source that needs a search is skipped once the search pool is empty, and
   * the ones that cost nothing keep going. That is the whole point of counting
   * the two separately: an account out of searches can still read every
   * comment section its competitors have, which is the better source anyway.
   */
  const maxSources = Math.max(
    1,
    Math.min(wanted, Math.floor(room.profiles / MIN_PROFILES_PER_SOURCE))
  );
  const roles = ctx.cfg.leads.icpKeywords.length;
  const costOf = (source: (typeof sources)[number]): number =>
    searchCost(source.type, queriesIn(source.type, parseConfig(source.config), roles));

  const chosen: typeof sources = [];
  let searchesLeft = room.searches;
  for (const source of sources) {
    if (chosen.length >= maxSources) break;
    const cost = costOf(source);
    if (cost > searchesLeft) continue;
    searchesLeft -= cost;
    chosen.push(source);
  }

  if (chosen.length === 0) {
    log("every source left needs a search and there are none left today", {
      accountId: ctx.linkedinAccountId,
      tier,
    });
    return 0;
  }

  await recordEvent(
    ctx,
    "sourcing",
    opts.firstRun
      ? `Looking for your first leads across ${chosen.length} ${chosen.length === 1 ? "source" : "sources"}`
      : `Checking ${chosen.map((s) => s.label).join(" and ")} for new people`
  ).catch(() => {});

  // Spread what the visit has across the sources it is about to open, so one
  // source cannot eat the visit.
  const shape = readingShape(Math.floor(room.profiles / chosen.length), budget);
  budget.posts = shape.posts;
  budget.perPost = shape.perPost;

  let total = 0;

  for (const source of chosen) {
    const config = parseConfig(source.config);
    let found: Engager[] = [];

    /* Booked before the pages are opened, not after they are counted. A pass
       that dies halfway has still been seen by LinkedIn, and a counter that
       only credits finished work lets a crash loop read all day for free. */
    await book(ctx.linkedinAccountId, ctx.timezone, {
      searches: costOf(source),
      profiles: budget.posts * budget.perPost,
    }).catch(() => {});

    // Mining one source takes minutes, so this is the line the dashboard shows
    // for most of a working day. It says which source, in the present.
    await announce(
      ctx,
      source.type === "competitor"
        ? "reading who engaged with"
        : source.type === "brand"
          ? "reading who viewed the profile:"
          : "looking for people posting about",
      undefined,
      source.label
    );

    // Mining one source runs for minutes at a human pace, which is longer than
    // the dashboard will believe a single claim. A pulse every half minute is
    // what keeps the line on screen for as long as the work is really running.
    const alive = setInterval(() => {
      void keepAlive(ctx);
    }, 30_000);

    try {
      switch (source.type) {
        case "competitor": {
          const url = typeof config.url === "string" ? config.url : null;
          /**
           * dryRun, so claimAll below does the insert.
           *
           * Left to insert itself, this path went through insertProspects,
           * which writes a name and a profile and nothing else: no source, no
           * job title, no company, no picture and no signal sentence. Every
           * lead from a competitor therefore arrived faceless with an empty
           * Signal column while every lead from a keyword had both, and the
           * fixes made to claimAll never reached them. The keyword sources
           * were converted months ago and this one was missed.
           */
          found = await mine(ctx, page, ctx.cfg, {
            ...(url ? { targets: [url] } : { competitorNames: [source.label] }),
            maxPerPost: budget.perPost,
            maxPostsPerTarget: budget.posts,
            dryRun: true,
          });
          break;
        }
        case "keyword":
        case "market":
        case "linkedin_search": {
          // A pasted search URL needs no special case: searchPostCards opens a URL as a
          // destination and searches for anything else.
          // One of them this pass, the next one next time. Running all three
          // cost six of a free account's seven searches for the whole day.
          const queries = queryTurn(
            Array.isArray(config.queries) && config.queries.length > 0
              ? (config.queries as string[])
              : [source.label],
            passesOf.get(source.id) ?? 0
          );

          /**
           * A pasted address the agent genuinely cannot work, said out loud.
           *
           * A Sales Navigator list used to load, match nothing, and report an
           * empty search like any quiet day, so a customer could leave their
           * best list in there for weeks. The source is turned off with the
           * reason on the row, which the dashboard shows, rather than being
           * mined for ever against a selector that can never match.
           */
          const blocked = queries.map(unsupportedSearch).find(Boolean);
          if (blocked) {
            await disableSource(source.id, ctx.agentId, blocked);
            await recordEvent(ctx, "sourcing", `${source.label} was turned off. ${blocked}`).catch(
              () => {}
            );
            log("source cannot be worked", { source: source.label, reason: blocked });
            continue;
          }

          /**
           * Both doors, not one.
           *
           * A keyword source used to mean "find posts about this", and only
           * that. It answers "who is talking about this right now", which is a
           * narrow question: for a niche audience in one country it returns
           * nobody most days, and on 2026-07-31 a whole agent run produced zero
           * leads with every filter behaving correctly.
           *
           * The people search answers the other question, "who matches this
           * description", and it is the wide one. A title and a country return
           * pages of them. The two are complementary rather than alternatives,
           * so a source runs both and the results are deduplicated by profile.
           */
          // dryRun on both, because the caller below is what actually claims
          // them. Left to insert themselves, they went in through a thinner
          // path that sets no source, no job title, no company and no picture,
          // and the richer insert afterwards was then ignored as a duplicate.
          const [asking, matching] = [
            await mineIntent(ctx, page, ctx.cfg, {
              queries,
              maxPerQuery: budget.perPost,
              dryRun: true,
            }),
            await minePeople(ctx, page, ctx.cfg, queries, {
              maxPerQuery: budget.perPost,
              dryRun: true,
            }),
          ];
          found = [...asking, ...matching];
          break;
        }
        case "buying_event": {
          // Four shapes of the same idea: somebody just took the seat, somebody is hiring for the
          // work, somebody just put money in the bank, or somebody is standing in a room full of
          // their own market. All searched from what the customer already gave us, which is why
          // this source asks them for nothing extra. It used to search for the label of the button
          // they clicked, so it looked for people announcing a new job as a "High-intent signals".
          const roles = ctx.cfg.leads.icpKeywords.length
            ? ctx.cfg.leads.icpKeywords.slice(0, 4)
            : [source.label];
          // One row per kind, so a customer who only wants role changes gets only those. A row
          // without a kind predates the setting and means all of them.
          const kind = typeof config.kind === "string" ? config.kind : null;
          // One kind per pass, rotated, for the same reason as a keyword source.
          // Four kinds against four roles was 32 searches in a day that holds 7.
          const wanted = (BUYING_EVENT_KINDS as readonly string[]).includes(kind ?? "")
            ? [kind as SignalKind]
            : queryTurn([...BUYING_EVENT_KINDS], passesOf.get(source.id) ?? 0);
          found = [];
          for (const k of wanted) {
            found.push(
              ...(await mineSignal(
                ctx,
                page,
                ctx.cfg,
                k,
                queryTurn(queriesForSignal(k, roles), passesOf.get(source.id) ?? 0),
                { maxPerQuery: budget.perPost }
              ))
            );
          }
          break;
        }
        case "brand": {
          // People who came to look at you without being asked.
          found = await mineProfileViewers(ctx, page, ctx.cfg);
          break;
        }
        case "own_posts": {
          /**
           * The audience of the customer's own content, which is the warmest
           * room they have and the one the agent had never walked into.
           *
           * LinkedGrow publishes these posts. Somebody who stops to comment
           * under one has read the customer's words, in public, on purpose, and
           * they cost the account nothing to find. Every rival signal product
           * sells this and we were the only one not reading it.
           */
          if (!ctx.ownProfileUrl) {
            log("the account has no profile address stored yet, so its own posts are skipped", {
              agentId: ctx.agentId,
            });
            continue;
          }
          found = await mineOwnPosts(ctx, page, ctx.cfg, ctx.ownProfileUrl, {
            maxPerPost: budget.perPost,
            maxPosts: budget.posts,
            dryRun: true,
          });
          break;
        }
        case "group": {
          // A room the customer already joined, gathered around one subject.
          const url = typeof config.url === "string" ? config.url : source.label;
          found = await mineGroup(ctx, page, ctx.cfg, url, {
            maxPerPost: budget.perPost,
            maxPosts: budget.posts,
            dryRun: true,
          });
          break;
        }
        case "csv":
          // Uploaded rather than mined. The rows are inserted straight into
          // agent_leads by the import endpoint, so there is nothing on LinkedIn
          // to read and reaching this source is not a failure.
          continue;
        default:
          log("unknown source type, skipped", { type: source.type });
          continue;
      }
    } catch (error) {
      // One broken source must not stop the others. A competitor page that
      // moved, or a search that returned nothing, is ordinary.
      log("a source could not be read", {
        source: source.label,
        reason: error instanceof Error ? error.message : String(error),
      });
      await recordPass(source.id, 0, 0);
      continue;
    } finally {
      // Runs on every way out of the block, including the two `continue`s and
      // the error path, so no pulse is ever left beating on a finished source.
      clearInterval(alive);
    }

    /**
     * Claiming is inside the guard too, and that is the whole point.
     *
     * It used to sit outside, so a database error while storing one person
     * escaped the loop and killed the entire pass. Everything that runs
     * afterwards runs afterwards for a reason: the scoring, the source ranking
     * and the memory all read what the pass just found. Losing the pass loses
     * all three.
     *
     * That is not hypothetical. A single comment with an emoji cut in half by a
     * 400-character slice was rejected by the database with an unnamed 400, on
     * every pass that reached it, 36 times in five days. Every lead found in
     * those passes stayed unscored and the customer saw an empty Match column.
     */
    const startedAt = Math.floor(Date.now() / 1000) - 1;
    let claimed = 0;
    try {
      claimed = await claimAll(ctx, source.id, source.label, found);
      const good = claimed > 0 ? await goodAmong(source.id, startedAt) : 0;
      await recordPass(source.id, claimed, good);
      log("source mined", { source: source.label, seen: found.length, claimed, good });
    } catch (error) {
      log("a source could not be stored", {
        source: source.label,
        reason: error instanceof Error ? error.message : String(error),
      });
      await recordPass(source.id, claimed, 0).catch(() => {});
    }
    total += claimed;
  }

  /**
   * The agent thinking about its own results, once per pass.
   *
   * At the end rather than the start, so it judges what just happened. Both
   * halves are rationed: retiring and ranking are SQL, growing costs one model
   * call and only when a source has earned it, and the memory is revised only
   * once enough new evidence has landed to change it.
   */
  try {
    const lesson = await learn(ctx);
    if (lesson.retired || lesson.learned) {
      log("the agent adjusted its sources", {
        agentId: ctx.agentId,
        retired: lesson.retired,
        learned: lesson.learned,
        best: lesson.best,
      });
    }
    await reviseMemory(ctx);
  } catch (error) {
    // Learning is an improvement, never a dependency. A pass that found people
    // has already done its job.
    log("the learning pass did not complete", {
      agentId: ctx.agentId,
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  // The toggle the wizard calls "Keep looking when the topics run dry", finally doing what it says.
  //
  // It fires when the customer never gave the agent anything to search for, or when everything
  // they did give came back empty this pass. An agent that goes quiet because its one competitor is
  // exhausted is the failure the toggle exists to prevent, and it looks broken from the outside.
  if (ctx.smartLeadFinder && (!hasOwnQueries || total === 0)) {
    total += await fallbackPass(ctx, page, budget, hasOwnQueries, searchesLeft);
  }

  await recordEvent(
    ctx,
    "sourcing",
    total > 0
      ? `${total} new ${total === 1 ? "person" : "people"} added to the queue`
      : "No new people this time. The sources will be checked again on the next run"
  ).catch(() => {});

  /**
   * Scoring runs whatever happened above.
   *
   * An unscored lead is invisible: the Match column is blank, the invitation
   * queue holds it back because it refuses to write to somebody nobody has
   * judged, and the source that found it counts for nothing in the ranking. One
   * source failing must never cost the whole pass its scoring.
   */
  try {
    await scorePass(ctx);
  } catch (error) {
    if (error instanceof BudgetExceededError) throw error;
    log("the scoring pass did not complete", {
      agentId: ctx.agentId,
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  // Now that the leads carry scores, put the source counters back in step with
  // them. Before this the column said zero next to a source with seven good
  // leads, because it was written before the scoring that produces the number.
  await refreshSourceCounters(ctx).catch(() => {});

  return total;
}

/**
 * How well each new person matches, and why, in one line.
 *
 * Capped per pass because this is the one cost line LinkedIn's own limits do
 * not bound: an agent pointed at wide sources could otherwise score hundreds of
 * people in an afternoon. Anything left over is picked up on the next pass,
 * oldest first, so a backlog drains rather than being dropped.
 *
 * It reads the headline and the company rather than opening the profile. A
 * visit per lead just to score it would cost a page load each and show up in
 * "who viewed your profile" for people the agent has decided nothing about yet.
 */
const SCORED_PER_PASS = 20;

export async function scorePass(ctx: AgentContext): Promise<void> {
  const icp = ctx.cfg.leads.icp;
  if (!icp) return;

  const waiting = await unscoredLeads(ctx, SCORED_PER_PASS);
  if (waiting.length === 0) return;

  // Read once for the whole pass, not once per lead. It is a few hundred bytes
  // and it is the same for all twenty of them.
  const memory = asPrompt(await readMemory(ctx));

  // What the customer sells, read once. It is what the rival check compares a
  // headline against, and the scorer needs it for the same reason.
  const sells = ctx.cfg.business.description ?? "";

  let done = 0;
  let rivals = 0;
  for (const row of waiting) {
    const name = String(row.full_name ?? "");
    const headline = String(row.headline ?? "");
    if (!name) continue;

    /**
     * Somebody who sells what the customer sells, caught before the model call.
     *
     * The scorer is told the rule too, and the rule in the prompt is the main
     * defence. This is the deterministic half: it costs nothing, it cannot have
     * an off day, and it holds the two headlines that were really messaged on
     * 2026-08-08 as tests. It fires only when the person both owns a product
     * and shares a category phrase with ours.
     */
    const rivalry = competesWith(headline, sells);
    if (rivalry.competes) {
      await setLeadScore(ctx, String(row.id), 0, rivalryReason(rivalry.overlap));
      rivals += 1;
      continue;
    }

    try {
      const { score, reason } = await scoreLead(
        ctx,
        icp,
        {
          name,
          headline,
          company: row.company ? String(row.company) : undefined,
          signal: row.signal_text ? String(row.signal_text) : undefined,
          // How many different doors this person has come through. The claim
          // used to throw the second and third away entirely.
          hits: Number(row.signal_hits ?? 1),
          kinds: row.signal_kinds ? String(row.signal_kinds) : undefined,
        },
        memory
      );
      await setLeadScore(ctx, String(row.id), score, reason);
      done += 1;
    } catch (error) {
      // A budget ceiling stops the whole pass; anything else is one lead that
      // stays unscored and is picked up next time.
      if (error instanceof BudgetExceededError) throw error;
      log("could not score a lead", {
        lead: name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (done > 0 || rivals > 0) log("leads scored", { count: done, competitors: rivals });
}

/**
 * Working from what the business is, rather than from what the customer typed.
 *
 * The targeting is derived once per agent and cached on its row, so this costs one model call in the
 * lifetime of an agent rather than one per pass. Leads found here are claimed and deduplicated
 * exactly like any other, and they carry a source label saying where they came from, because a
 * customer looking at their queue deserves to know which of these they asked for.
 *
 * ## Rivals first, search second, and the order is the point
 *
 * This used to go straight to an intent search, which is the worst of the two
 * options on both counts that matter.
 *
 * It is the expensive one. A search feeds LinkedIn's commercial use limit;
 * opening a named company's posts by URL and reading who reacted underneath
 * feeds nothing, because no search is run and no profile is visited.
 *
 * And it is the polluted one. The people who talk most about "cookie consent"
 * on LinkedIn are the people selling cookie consent, which is how the founder
 * of a rival cookie-consent widget ended up being messaged on 2026-08-08. Under
 * a competitor's post you find the same category of person having already shown
 * interest in it, without the keyword selecting for vendors.
 */
async function fallbackPass(
  ctx: AgentContext,
  page: Page,
  budget: { perPost: number; posts: number },
  hadOwnQueries: boolean,
  searchesLeft: number
): Promise<number> {
  const targeting = await ensureTargeting(ctx);

  const rivals = targeting.competitors.slice(0, 3);
  if (rivals.length > 0) {
    await recordEvent(
      ctx,
      "sourcing",
      hadOwnQueries
        ? "Your own topics came back empty, so the agent is reading who engages with similar companies"
        : "Working out who to read from your business, starting with similar companies"
    ).catch(() => {});
    await announce(ctx, "reading who engages with", undefined, rivals.join(", "));
    // One search covers resolving a name we have not seen before. After that
    // the company URL is cached on the account and mining it costs none.
    await book(ctx.linkedinAccountId, ctx.timezone, {
      searches: 1,
      profiles: budget.posts * budget.perPost,
    }).catch(() => {});
    try {
      const engaged = await mine(ctx, page, ctx.cfg, {
        competitorNames: rivals,
        maxPerPost: budget.perPost,
        maxPostsPerTarget: budget.posts,
        dryRun: true,
      });
      const claimed = await claimAll(ctx, null, "a similar company's audience", engaged);
      log("fallback mined engagement", { rivals: rivals.length, seen: engaged.length, claimed });
      // Enough. Widening into a search on top of this would spend the scarce
      // pool for the weaker source.
      if (claimed > 0) return claimed;
    } catch (error) {
      log("the similar-company pass could not be read", {
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const queries = targeting.intentQueries.slice(0, 3);
  if (queries.length === 0) return 0;
  // A search is the last resort, and it waits when the pool is out rather than
  // quietly running one more on top of the day's allowance.
  if (searchesLeft < queries.length) {
    log("no searches left today, so the widened search waits", { agentId: ctx.agentId });
    return 0;
  }

  await recordEvent(
    ctx,
    "sourcing",
    hadOwnQueries
      ? "Your own topics came back empty, so the agent is widening the search"
      : "Working out what to search for from your business"
  ).catch(() => {});

  let found: Engager[] = [];
  await announce(ctx, "widening the search to", undefined, queries.join(", "));
  await book(ctx.linkedinAccountId, ctx.timezone, {
    searches: queries.length,
    profiles: queries.length * budget.perPost,
  }).catch(() => {});
  const alive = setInterval(() => {
    void keepAlive(ctx);
  }, 30_000);
  try {
    found = await mineIntent(ctx, page, ctx.cfg, { queries, maxPerQuery: budget.perPost });
  } catch (error) {
    log("the widened search could not be read", {
      reason: error instanceof Error ? error.message : String(error),
    });
    return 0;
  } finally {
    clearInterval(alive);
  }

  // Null rather than empty: source_id carries a foreign key onto agent_sources, and there is no
  // row to point at because nobody added one.
  const claimed = await claimAll(ctx, null, "a wider search", found);
  log("fallback mined", { queries: queries.length, seen: found.length, claimed });
  return claimed;
}
