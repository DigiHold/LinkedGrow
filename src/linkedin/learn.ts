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

/**
 * A reply is ground truth about fit. A match score is an opinion about it.
 *
 * The weights always said that, three times and eight times over. The two
 * columns they multiplied were never written by anything: on a live agent
 * running since July, accepted and replied were 0 on every source while four
 * people had actually replied. So the strongest evidence the product collects,
 * a human answering, reached the ranking at a weight of eight times zero, and
 * the agent was left learning from a cheap model's opinion of a headline.
 *
 * Both are derived from agent_leads now, the same way good is.
 */
const WEIGHT = { good: 1, accepted: 3, replied: 8 };

/**
 * What a prospect's state says about the source that found them.
 *
 * Cumulative, because a person who is conversing plainly also accepted. Read
 * off the sequence's own STATUS values; a lead that reached any of these did so
 * because a real human did something.
 */
const ACCEPTED_STATES = [
  "connected",
  "hello_sent",
  "hello_answered",
  "intro_sent",
  "conversing",
  "ask_sent",
  "handed_over",
];
const REPLIED_STATES = ["hello_answered", "conversing", "ask_sent", "handed_over"];

/** Turns a list of states into a SQL placeholder list, for the counts below. */
function placeholders(list: readonly string[]): string {
  return list.map(() => "?").join(", ");
}

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
  /**
   * Quality is counted off the leads themselves, not off the counter.
   *
   * good_leads was 0 on every source of a live agent while one of them had
   * produced 23 leads and 10 that cleared the bar. The counter was written by
   * recordPass at the end of the mining loop, and the scoring that decides what
   * is good runs fifty lines later, at the end of the whole pass. So the
   * quality of a batch was always measured before it existed, and every source
   * reported zero for ever.
   *
   * Everything downstream fed on that zero. The yield was zero, so miningOrder
   * had nothing to prefer and fell back to oldest-first, and growFrom had no
   * best source to make a variant of, which is why an agent that is supposed to
   * follow what works had not made a single one.
   *
   * Reading agent_leads instead cannot drift: it is the same table the customer
   * sees, and it makes the whole history count rather than only what happened
   * after the counter was fixed.
   */
  const { rows } = await db().execute({
    sql: `SELECT s.id, s.label, s.type, s.passes, s.last_mined_at,
                 COUNT(l.id) AS leads_found,
                 SUM(CASE WHEN l.match_score >= ? THEN 1 ELSE 0 END) AS good_leads,
                 SUM(CASE WHEN l.sequence_status IN (${placeholders(ACCEPTED_STATES)}) THEN 1 ELSE 0 END) AS accepted,
                 SUM(CASE WHEN l.sequence_status IN (${placeholders(REPLIED_STATES)}) THEN 1 ELSE 0 END) AS replied
            FROM agent_sources s
            LEFT JOIN agent_leads l
              ON l.source_id = s.id AND l.workspace_id = s.workspace_id
           WHERE s.agent_id = ? AND s.workspace_id = ? AND s.enabled = 1
           GROUP BY s.id`,
    args: [GOOD_SCORE, ...ACCEPTED_STATES, ...REPLIED_STATES, ctx.agentId, ctx.workspaceId],
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
      /**
       * Per pass where we know how many there were, otherwise the plain total.
       *
       * passes was never incremented on the rows that predate the fix, so
       * dividing by it threw away every source's whole history. A source with
       * ten good leads and no recorded passes is not worth zero.
       */
      yield: worth / Math.max(1, passes),
      /**
       * Never opened, rather than never counted.
       *
       * This read passes === 0, and passes was never incremented on any row
       * that predates the counter being fixed. So two competitors that had
       * been mined and had produced nobody were called untried and jumped the
       * queue on every single pass, ahead of the source with seven good leads.
       * Whether a page has ever been opened is a date, and the date is right.
       */
      untried: Number(r.leads_found ?? 0) === 0 && !r.last_mined_at,
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

/**
 * Puts the stored counters back in step with the leads themselves.
 *
 * recordPass counts the good ones at the end of the mining loop, and the
 * scoring that decides what is good runs at the end of the whole pass, so the
 * column was always one step behind and in practice always zero. The ranking no
 * longer reads it, but the row is shown to the customer and a column that says
 * zero next to a source with seven good leads is a lie on a screen.
 *
 * One statement, derived from agent_leads, so it cannot drift again.
 */
export async function refreshSourceCounters(ctx: AgentContext): Promise<void> {
  await db().execute({
    sql: `UPDATE agent_sources
             SET leads_found = (
                   SELECT COUNT(*) FROM agent_leads l
                    WHERE l.source_id = agent_sources.id AND l.workspace_id = agent_sources.workspace_id
                 ),
                 good_leads = (
                   SELECT COUNT(*) FROM agent_leads l
                    WHERE l.source_id = agent_sources.id AND l.workspace_id = agent_sources.workspace_id
                      AND l.match_score >= ?
                 ),
                 accepted = (
                   SELECT COUNT(*) FROM agent_leads l
                    WHERE l.source_id = agent_sources.id AND l.workspace_id = agent_sources.workspace_id
                      AND l.sequence_status IN (${placeholders(ACCEPTED_STATES)})
                 ),
                 replied = (
                   SELECT COUNT(*) FROM agent_leads l
                    WHERE l.source_id = agent_sources.id AND l.workspace_id = agent_sources.workspace_id
                      AND l.sequence_status IN (${placeholders(REPLIED_STATES)})
                 )
           WHERE agent_id = ? AND workspace_id = ?`,
    args: [GOOD_SCORE, ...ACCEPTED_STATES, ...REPLIED_STATES, ctx.agentId, ctx.workspaceId],
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

/**
 * Reads what the model proposed, and refuses anything it cannot place.
 *
 * A line is `company: Name` or `search: some words`. An unprefixed line is
 * taken as a search, because that is what every answer looked like before the
 * prompt asked for two kinds and an older model may still answer that way.
 *
 * Companies are sorted to the front of whatever room is left. They cost the
 * account nothing to mine and they qualify at roughly half again what a search
 * does, so when only one slot remains it should not go to the expensive one.
 */
export function parseGrown(
  answer: string,
  room: number,
  taken: Set<string>
): Array<{ type: "competitor" | "keyword"; label: string }> {
  const seen = new Set(taken);
  const out: Array<{ type: "competitor" | "keyword"; label: string }> = [];

  for (const raw of answer.split("\n")) {
    const line = raw.replace(/^[\s\-*\d.)"']+/, "").replace(/["']+$/, "").trim();
    if (!line) continue;

    const match = /^(company|search)\s*[:\-]\s*(.+)$/i.exec(line);
    const type = match && match[1]?.toLowerCase() === "company" ? "competitor" : "keyword";
    const label = (match ? match[2] ?? "" : line).replace(/["']+$/, "").trim();

    if (label.length < 3 || label.length > 60) continue;
    if (seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push({ type, label });
  }

  // Companies first, order otherwise preserved, then cut to what there is room for.
  return [...out.filter((i) => i.type === "competitor"), ...out.filter((i) => i.type === "keyword")]
    .slice(0, Math.max(0, room));
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
 * Writes siblings for a source that is working: companies first, then queries.
 *
 * Seeded by the headlines of the people it actually found rather than by its
 * own label, because the label is what the customer guessed and the headlines
 * are what turned out to be true. "indie SaaS founder" finding seven good
 * people whose headlines say "building in public", "solo founder" and
 * "bootstrapping" is the agent being told what to look at next, by its own
 * results, in the audience's own words.
 *
 * ## Why companies, and why they come first
 *
 * Every variant used to be a keyword search, and on this agent's own numbers
 * that is the wrong family to grow. Measured across 90 real leads:
 *
 *   comment under a competitor's post   46% qualified, some sources 67%
 *   keyword search                      31% qualified
 *
 * And the cost runs the other way. A keyword source carries three queries and
 * searches each twice, so it spends six of a free account's nine searches a
 * day, while opening a named company's posts by URL and reading who engaged
 * spends none at all. Growing only keywords therefore grew the expensive half
 * and the weaker half at once, and with a ceiling of nine searches a day an
 * agent could never run everything it had learned.
 *
 * So a winning source now spawns both, companies preferred, and the audience's
 * own headlines are what suggests them: people who describe themselves the same
 * way tend to gather under the same handful of posts.
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
        `Give up to ${room} new places to look for more people like them.`,
        "One per line. A company or creator whose posts this audience gathers under is written",
        "as `company: Name`. A LinkedIn people-search query is written as `search: the words`.",
        "Prefer companies: reading who engages with a post costs the account nothing, while a",
        "search is rationed. Nothing else on the line, no numbering, no quotes, no explanation.",
      ].join("\n"),
      {
        purpose: "grow-source",
        maxTokens: 120,
        model: MODELS.fast,
        systemPrompt:
          "You turn a set of real LinkedIn headlines into new places to find more people like them.\n\n" +
          "A company is a real business or creator on LinkedIn whose posts this audience reads and comments under: a tool they use, a rival to it, or somebody well known who writes for them. Give the name as LinkedIn shows it, nothing else. Never name the customer's own company.\n\n" +
          "A query is two to four words, the kind of thing a person types into LinkedIn's search box: a role, a way of describing themselves, or a role and a niche together.\n\n" +
          "Write what the audience calls itself, not what a marketer calls them. Never repeat what you were given, and never write two that would obviously return the same people.\n\n" +
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

  const learned = parseGrown(answer, room, existing);

  for (const item of learned) {
    const now = Math.floor(Date.now() / 1000);
    await db().execute({
      sql: `INSERT INTO agent_sources
              (id, workspace_id, agent_id, type, label, enabled, origin, parent_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, 'learned', ?, ?, ?)`,
      args: [
        crypto.randomUUID(), ctx.workspaceId, ctx.agentId,
        item.type, item.label, source.id, now, now,
      ],
    });
    existing.add(item.label.toLowerCase());
    log("source learned", {
      agentId: ctx.agentId,
      from: source.label,
      type: item.type,
      label: item.label,
    });
  }
  return learned.length;
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
    /**
     * Proven by what it produced, not by a counter that was never written.
     *
     * This asked for passes >= 2, and passes is 0 on every source that predates
     * the fix, so the guard could never pass and the agent had not written a
     * single variant in its life. Leads found is the same guarantee against a
     * one-off fluke and it is a number that actually exists: three good ones
     * out of at least five means the source is producing, not lucky.
     */
    .filter((s) => s.good >= 3 && s.leads >= 5)
    .sort((a, b) => b.yield - a.yield);

  let learned = 0;
  if (candidates[0]) learned = await growFrom(ctx, candidates[0]);

  return { retired, learned, best: candidates[0]?.label ?? null };
}
