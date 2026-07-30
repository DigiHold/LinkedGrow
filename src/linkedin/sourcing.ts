import type { Page } from "patchright";
import type { AgentContext } from "../config.ts";
import { claimLead, db, loadSources, recordEvent } from "../db.ts";
import { log } from "../logger.ts";
import { mine, mineIntent, type Engager } from "./miner.ts";
import { mineProfileViewers, mineSignal } from "./sources.ts";
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
      signalType: person.source ?? null,
      signalText: person.context ?? null,
      sourceId,
    });
    if (!ok) continue; // Another agent already has them, which is the right outcome.
    claimed += 1;

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

  const budget = readingBudget(ctx);
  // The oldest-mined first, which loadSources already orders by, so attention
  // spreads rather than always landing on the same competitor.
  const take = opts.firstRun ? Math.min(2, sources.length) : SOURCES_PER_PASS;
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

    try {
      switch (source.type) {
        case "competitor": {
          const url = typeof config.url === "string" ? config.url : null;
          found = await mine(ctx, page, ctx.cfg, {
            ...(url ? { targets: [url] } : { competitorNames: [source.label] }),
            maxPerPost: budget.perPost,
            maxPostsPerTarget: budget.posts,
          });
          break;
        }
        case "keyword":
        case "market":
        case "linkedin_search": {
          const queries =
            Array.isArray(config.queries) && config.queries.length > 0
              ? (config.queries as string[])
              : [source.label];
          found = await mineIntent(ctx, page, ctx.cfg, {
            queries,
            maxPerQuery: budget.perPost,
          });
          break;
        }
        case "buying_event": {
          // Two shapes of the same idea: somebody just took the seat, or
          // somebody is hiring for the work.
          const moved = await mineSignal(ctx, page, ctx.cfg, "jobchange", [source.label], { maxPerQuery: budget.perPost });
          const hiring = await mineSignal(ctx, page, ctx.cfg, "hiring", [source.label], { maxPerQuery: budget.perPost });
          found = [...moved, ...hiring];
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

  return total;
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
  try {
    found = await mineIntent(ctx, page, ctx.cfg, { queries, maxPerQuery: budget.perPost });
  } catch (error) {
    log("the widened search could not be read", {
      reason: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }

  // Null rather than empty: source_id carries a foreign key onto agent_sources, and there is no
  // row to point at because nobody added one.
  const claimed = await claimAll(ctx, null, "a wider search", found);
  log("fallback mined", { queries: queries.length, seen: found.length, claimed });
  return claimed;
}
