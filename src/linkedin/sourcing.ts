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
import { mineProfileViewers, mineSignal, minePeople } from "./sources.ts";
import { ensureTargeting } from "./derive.ts";

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

/** How many sources one pass will work through, so a pass stays bounded. */
const SOURCES_PER_PASS = 2;

/** How many to read on the very first pass, when time to the first lead is the whole game. */
const FIRST_RUN_SOURCES = 6;

/**
 * Reading allowance by how long the account has existed. A first pass finds
 * enough for a customer to see the thing working within minutes, without the
 * account looking like it woke up and read the whole site.
 */
function readingBudget(ctx: AgentContext): { perPost: number; posts: number } {
  const started = ctx.warmupStartedAt?.getTime() ?? Date.now();
  const days = Math.floor((Date.now() - started) / 86_400_000);
  if (days < 1) return { perPost: 15, posts: 2 };
  if (days < 7) return { perPost: 20, posts: 2 };
  if (days < 21) return { perPost: 25, posts: 3 };
  return { perPost: 25, posts: 4 };
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

async function markMined(sourceId: string, found: number): Promise<void> {
  await db().execute({
    sql: `UPDATE agent_sources
             SET last_mined_at = ?, leads_found = leads_found + ?
           WHERE id = ?`,
    args: [Math.floor(Date.now() / 1000), found, sourceId],
  });
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
export function signalSentence(
  signalType: string | null,
  sourceLabel: string
): string {
  const [kind, ...rest] = (signalType ?? "").split(":");
  const subject = rest.join(":").trim();
  const named = subject || sourceLabel;
  switch (kind) {
    case "comment":
      return `Commented on a post by ${named}`;
    case "reaction":
      return `Reacted to a post by ${named}`;
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

export async function sourcePass(
  ctx: AgentContext,
  page: Page,
  opts: { firstRun?: boolean } = {}
): Promise<number> {
  const sources = await loadSources(ctx);

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

  const budget = readingBudget(ctx);
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
  const take = opts.firstRun
    ? Math.min(FIRST_RUN_SOURCES, sources.length)
    : SOURCES_PER_PASS;
  const chosen = sources.slice(0, take);

  await recordEvent(
    ctx,
    "sourcing",
    opts.firstRun
      ? `Looking for your first leads across ${chosen.length} ${chosen.length === 1 ? "source" : "sources"}`
      : `Checking ${chosen.map((s) => s.label).join(" and ")} for new people`
  ).catch(() => {});

  let total = 0;

  for (const source of chosen) {
    const config = parseConfig(source.config);
    let found: Engager[] = [];

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
          const queries =
            Array.isArray(config.queries) && config.queries.length > 0
              ? (config.queries as string[])
              : [source.label];

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
          // Two shapes of the same idea: somebody just took the seat, or somebody is hiring for
          // the work. Both are searched by ROLE, which is why this source asks the customer for
          // nothing extra: the roles and industries they already gave are the query. It used to
          // search for the label of the button they clicked, so it looked for people announcing a
          // new job as a "High-intent signals".
          const roles = ctx.cfg.leads.icpKeywords.length
            ? ctx.cfg.leads.icpKeywords.slice(0, 4)
            : [source.label];
          // One row per kind, so a customer who only wants role changes gets only those. A row
          // without a kind predates the setting and means both.
          const kind = typeof config.kind === "string" ? config.kind : null;
          const wanted: Array<"jobchange" | "hiring"> =
            kind === "jobchange" || kind === "hiring" ? [kind] : ["jobchange", "hiring"];
          found = [];
          for (const k of wanted) {
            found.push(...(await mineSignal(ctx, page, ctx.cfg, k, roles, { maxPerQuery: budget.perPost })));
          }
          break;
        }
        case "brand": {
          // People who came to look at you without being asked.
          found = await mineProfileViewers(ctx, page, ctx.cfg);
          break;
        }
        case "csv":
          // Uploaded rather than mined; nothing to read on LinkedIn.
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
      await markMined(source.id, 0);
      continue;
    } finally {
      // Runs on every way out of the block, including the two `continue`s and
      // the error path, so no pulse is ever left beating on a finished source.
      clearInterval(alive);
    }

    const claimed = await claimAll(ctx, source.id, source.label, found);
    await markMined(source.id, claimed);
    total += claimed;

    log("source mined", { source: source.label, seen: found.length, claimed });
  }

  // The toggle the wizard calls "Keep looking when the topics run dry", finally doing what it says.
  //
  // It fires when the customer never gave the agent anything to search for, or when everything
  // they did give came back empty this pass. An agent that goes quiet because its one competitor is
  // exhausted is the failure the toggle exists to prevent, and it looks broken from the outside.
  if (ctx.smartLeadFinder && (!hasOwnQueries || total === 0)) {
    total += await fallbackPass(ctx, page, budget, hasOwnQueries);
  }

  await recordEvent(
    ctx,
    "sourcing",
    total > 0
      ? `${total} new ${total === 1 ? "person" : "people"} added to the queue`
      : "No new people this time. The sources will be checked again on the next run"
  ).catch(() => {});

  await scorePass(ctx);

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

async function scorePass(ctx: AgentContext): Promise<void> {
  const icp = ctx.cfg.leads.icp;
  if (!icp) return;

  const waiting = await unscoredLeads(ctx, SCORED_PER_PASS);
  if (waiting.length === 0) return;

  let done = 0;
  for (const row of waiting) {
    const name = String(row.full_name ?? "");
    const headline = String(row.headline ?? "");
    if (!name) continue;
    try {
      const { score, reason } = await scoreLead(ctx, icp, {
        name,
        headline,
        company: row.company ? String(row.company) : undefined,
      });
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
  if (done > 0) log("leads scored", { count: done });
}

/**
 * Searching from what the business is, rather than from what the customer typed.
 *
 * The queries are derived once per agent and cached on its row, so this costs one model call in the
 * lifetime of an agent rather than one per pass. Leads found here are claimed and deduplicated
 * exactly like any other, and they carry a source label saying where they came from, because a
 * customer looking at their queue deserves to know which of these they asked for.
 */
async function fallbackPass(
  ctx: AgentContext,
  page: Page,
  budget: { perPost: number; posts: number },
  hadOwnQueries: boolean
): Promise<number> {
  const targeting = await ensureTargeting(ctx);
  const queries = targeting.intentQueries.slice(0, 3);
  if (queries.length === 0) return 0;

  await recordEvent(
    ctx,
    "sourcing",
    hadOwnQueries
      ? "Your own topics came back empty, so the agent is widening the search"
      : "Working out what to search for from your business"
  ).catch(() => {});

  let found: Engager[] = [];
  await announce(ctx, "widening the search to", undefined, queries.join(", "));
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
