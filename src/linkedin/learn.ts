import type { AgentContext } from "../config.ts";
import { db } from "../db.ts";
import { generate, MODELS } from "../ai.ts";
import { log, logError } from "../logger.ts";

/**
 * The agent getting better at its own job.
 *
 * Sources were mined oldest-first, which is fair and stupid: on 2026-08-07 one
 * agent had eleven of them, and "indie SaaS founder" had produced seven of its
 * ten good leads while "vibe coding" had produced none at an average score of
 * nine, and both got exactly the same attention every pass. Three competitors
 * had produced literally nothing and were still being opened every day.
 *
 * Three things happen here, all of them from the agent's own results rather
 * than from anything anybody typed:
 *
 *   1. Every source is scored on what it actually produced.
 *   2. Attention goes to what works, with a slot kept for what has not been
 *      tried, so a good source can still be discovered.
 *   3. Dead sources are retired and winning ones have siblings written for
 *      them, from the headlines of the people who actually converted.
 *
 * All of it is per agent. Two agents on one LinkedIn account share its limits
 * and its inbox; they do not share what they have learned, because they may be
 * selling different products to different people.
 *
 * The third is the part that compounds. Turning "indie SaaS founder" into
 * "indie hacker" is a thesaurus; reading the headlines of the seven people that
 * query actually found and writing queries that would find more of them is the
 * agent learning who its customer's customer is.
 */

/** A reply is ground truth about fit. A match score is an opinion about it. */
const WEIGHT = { good: 1, accepted: 3, replied: 8 };

/** Below this a lead is noise the agent will never write to. */
const GOOD_SCORE = 70;

/** A source gets this many passes to show something before it can be retired. */
const PATIENCE = 8;

/** No agent should carry more than this, or every pass is spread too thin. */
const MAX_SOURCES = 24;

/** How many siblings one winning source may spawn, ever. */
const MAX_CHILDREN = 3;

export interface SourceScore {
  id: string;
  label: string;
  type: string;
  passes: number;
  leads: number;
  good: number;
  accepted: number;
  replied: number;
  /** Worth per pass. The number attention is allocated by. */
  yield: number;
  /** Never mined, so it has earned a try rather than a ranking. */
  untried: boolean;
}

/**
 * What each source has been worth, per pass.
 *
 * Per pass rather than in total, because a source mined twenty times for two
 * good leads is worse than one mined twice for two, and total counts hide
 * that completely. A source that has never run is not scored at all: it is
 * marked untried and the allocator owes it a turn.
 */
export async function scoreSources(ctx: AgentContext): Promise<SourceScore[]> {
  const { rows } = await db().execute({
    sql: `SELECT id, label, type, passes, leads_found, good_leads, accepted, replied
            FROM agent_sources
           WHERE agent_id = ? AND workspace_id = ? AND enabled = 1`,
    args: [ctx.agentId, ctx.workspaceId],
  });

  return rows.map((r) => {
    const passes = Number(r.passes ?? 0);
    const good = Number(r.good_leads ?? 0);
    const accepted = Number(r.accepted ?? 0);
    const replied = Number(r.replied ?? 0);
    const worth = good * WEIGHT.good + accepted * WEIGHT.accepted + replied * WEIGHT.replied;
    return {
      id: String(r.id),
      label: String(r.label),
      type: String(r.type),
      passes,
      leads: Number(r.leads_found ?? 0),
      good,
      accepted,
      replied,
      yield: passes > 0 ? worth / passes : 0,
      untried: passes === 0,
    };
  });
}

/**
 * The order to mine in: mostly what works, always something unproven.
 *
 * Straight exploitation would lock the agent onto whatever happened to work
 * first and it would never discover anything else, which is the same mistake as
 * oldest-first with the sign flipped. So the untried go first, they are the
 * cheapest information available, then the proven, then the rest by how long
 * since they last ran so nothing starves entirely.
 */
export function miningOrder<T extends { id: string }>(
  sources: T[],
  scores: SourceScore[],
  lastMined: Map<string, number>
): T[] {
  const by = new Map(scores.map((s) => [s.id, s]));
  return [...sources].sort((a, b) => {
    const sa = by.get(a.id);
    const sb = by.get(b.id);
    if (!sa || !sb) return 0;
    if (sa.untried !== sb.untried) return sa.untried ? -1 : 1;
    if (sb.yield !== sa.yield) return sb.yield - sa.yield;
    return (lastMined.get(a.id) ?? 0) - (lastMined.get(b.id) ?? 0);
  });
}

/** Counted after every pass, whatever the pass found, including nothing. */
export async function recordPass(sourceId: string, found: number, good: number): Promise<void> {
  await db().execute({
    sql: `UPDATE agent_sources
             SET passes = passes + 1,
                 leads_found = leads_found + ?,
                 good_leads = good_leads + ?,
                 last_mined_at = ?,
                 updated_at = ?
           WHERE id = ?`,
    args: [found, good, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), sourceId],
  });
}

/**
 * Stops mining what has never worked, and says why on the row.
 *
 * Disabled rather than deleted: the customer typed most of these and deleting
 * one behind their back is not the agent's decision to make. The dashboard can
 * show it greyed with its reason, and they can turn it back on.
 *
 * A source the customer added today is safe: retirement needs PATIENCE passes
 * of evidence, which is roughly a week of running.
 */
export async function retireDeadSources(ctx: AgentContext, scores: SourceScore[]): Promise<number> {
  const dead = scores.filter((s) => !s.untried && s.passes >= PATIENCE && s.good === 0 && s.replied === 0);
  if (dead.length === 0) return 0;

  // Never retire the last thing an agent has to look at. An agent with no
  // sources finds nobody, which is worse than mining something unproductive.
  const survivors = scores.length - dead.length;
  const toRetire = survivors >= 2 ? dead : dead.slice(0, Math.max(0, scores.length - 2));
  if (toRetire.length === 0) return 0;

  for (const s of toRetire) {
    await db().execute({
      sql: `UPDATE agent_sources
               SET enabled = 0, retired_at = ?, retired_reason = ?, updated_at = ?
             WHERE id = ? AND agent_id = ?`,
      args: [
        Math.floor(Date.now() / 1000),
        `Nothing worth writing to after ${s.passes} passes and ${s.leads} people read.`,
        Math.floor(Date.now() / 1000),
        s.id,
        ctx.agentId,
      ],
    });
    log("source retired", { agentId: ctx.agentId, label: s.label, passes: s.passes, leads: s.leads });
  }
  return toRetire.length;
}

/** The people a source actually found and scored well, in their own words. */
async function winningHeadlines(sourceId: string): Promise<string[]> {
  const { rows } = await db().execute({
    sql: `SELECT headline, job_title, company
            FROM agent_leads
           WHERE source_id = ? AND match_score >= ?
           ORDER BY match_score DESC
           LIMIT 12`,
    args: [sourceId, GOOD_SCORE],
  });
  return rows
    .map((r) => String(r.headline ?? [r.job_title, r.company].filter(Boolean).join(" at ")).trim())
    .filter((h) => h.length > 3);
}

/**
 * Writes sibling queries for a source that is working.
 *
 * Seeded by the headlines of the people it actually found rather than by its
 * own label, because the label is what the customer guessed and the headlines
 * are what turned out to be true. "indie SaaS founder" finding seven good
 * people whose headlines say "building in public", "solo founder" and
 * "bootstrapping" is the agent being told what to search for next, by its own
 * results, in the audience's own words.
 */
export async function growFrom(
  ctx: AgentContext,
  source: SourceScore
): Promise<number> {
  const headlines = await winningHeadlines(source.id);
  if (headlines.length < 3) return 0;

  const [{ rows: kids }, { rows: total }] = await Promise.all([
    db().execute({
      sql: `SELECT COUNT(*) n FROM agent_sources WHERE parent_id = ?`,
      args: [source.id],
    }),
    db().execute({
      sql: `SELECT COUNT(*) n FROM agent_sources WHERE agent_id = ? AND enabled = 1`,
      args: [ctx.agentId],
    }),
  ]);
  const room = Math.min(
    MAX_CHILDREN - Number(kids[0]?.n ?? 0),
    MAX_SOURCES - Number(total[0]?.n ?? 0)
  );
  if (room <= 0) return 0;

  let answer: string;
  try {
    answer = await generate(
      ctx,
      [
        `We sell to: ${ctx.cfg.leads.icp}`,
        `Searching LinkedIn for "${source.label}" found these people, and they were the good ones:`,
        ...headlines.map((h) => `- ${h}`),
        "",
        `Write up to ${room} more LinkedIn people-search queries that would find others like them.`,
        "One per line, nothing else. No numbering, no quotes, no explanation.",
      ].join("\n"),
      {
        purpose: "grow-source",
        maxTokens: 120,
        model: MODELS.fast,
        systemPrompt:
          "You turn a set of real LinkedIn headlines into search queries that would find more people like them.\n\n" +
          "A query is two to four words, the kind of thing a person types into LinkedIn's search box: a role, a way of describing themselves, or a role and a niche together.\n\n" +
          "Write what the audience calls itself, not what a marketer calls them. Never repeat the query you were given, and never write two that would obviously return the same people.\n\n" +
          "Write fewer than asked rather than padding with something weak.",
      }
    );
  } catch (error) {
    logError("could not grow a source", error, { agentId: ctx.agentId, label: source.label });
    return 0;
  }

  const existing = new Set(
    (
      await db().execute({
        sql: `SELECT lower(label) l FROM agent_sources WHERE agent_id = ?`,
        args: [ctx.agentId],
      })
    ).rows.map((r) => String(r.l))
  );

  const queries = answer
    .split("\n")
    .map((line) => line.replace(/^[\s\-*\d.)"']+/, "").replace(/["']+$/, "").trim())
    .filter((q) => q.length >= 3 && q.length <= 60)
    .filter((q) => !existing.has(q.toLowerCase()))
    .slice(0, room);

  for (const label of queries) {
    const now = Math.floor(Date.now() / 1000);
    await db().execute({
      sql: `INSERT INTO agent_sources
              (id, workspace_id, agent_id, type, label, enabled, origin, parent_id, created_at, updated_at)
            VALUES (?, ?, ?, 'keyword', ?, 1, 'learned', ?, ?, ?)`,
      args: [crypto.randomUUID(), ctx.workspaceId, ctx.agentId, label, source.id, now, now],
    });
    existing.add(label.toLowerCase());
    log("source learned", { agentId: ctx.agentId, from: source.label, label });
  }
  return queries.length;
}

/**
 * One learning pass. Cheap, and mostly SQL.
 *
 * Growing is the only part that costs a model call, and it is rationed: it
 * happens for one source at a time, the best one that has earned it and has not
 * already spawned its allowance.
 */
export async function learn(ctx: AgentContext): Promise<{
  retired: number;
  learned: number;
  best: string | null;
}> {
  const scores = await scoreSources(ctx);
  if (scores.length === 0) return { retired: 0, learned: 0, best: null };

  const retired = await retireDeadSources(ctx, scores);

  // Grow from the best source that has actually proven something. Yield alone
  // is not enough: a single lucky reply on one pass would score higher than a
  // source that has produced steadily, so it has to have found real people too.
  const candidates = scores
    .filter((s) => s.good >= 3 && s.passes >= 2)
    .sort((a, b) => b.yield - a.yield);

  let learned = 0;
  if (candidates[0]) learned = await growFrom(ctx, candidates[0]);

  return { retired, learned, best: candidates[0]?.label ?? null };
}
