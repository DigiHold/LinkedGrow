import type { AgentContext } from "../config.ts";
import { db } from "../db.ts";
import { generate, models } from "../ai.ts";
import { log, logError } from "../logger.ts";
import { competesWith } from "./competitor.ts";

/**
 * What an agent has learned about who actually converts.
 *
 * The obvious way to give an agent a memory is to keep its history and feed it
 * back in. That gets slower, more expensive and worse every week: a prompt full
 * of six months of leads costs a fortune and buries the signal in the middle,
 * where models attend to it least.
 *
 * So this memory is **bounded and rewritten, never appended**. It is a few
 * short lines, capped in code, and every revision replaces the last one: the
 * model is handed the previous memory plus what has happened since and asked
 * for a new one of the same size. Nothing accumulates, so revision two hundred
 * costs exactly what revision one cost, and it is two hundred rounds of
 * evidence deep rather than two hundred times longer.
 *
 * It is fed aggregates and a dozen headlines, never the lead table. It is
 * revised on evidence rather than on a clock, so a quiet agent costs nothing.
 * And it is used in the three places that decide quality: scoring a lead,
 * judging fit before writing, and inventing the next search.
 *
 * **One memory per agent, never per account and never per workspace.** Two
 * agents can drive the same LinkedIn account and they share everything that
 * belongs to that account, the invitation ceilings, the daily counts, the
 * conversations. They must not share this. A customer running one agent for a
 * booking widget and another for a cookie banner is selling two different
 * things to two different audiences, and a memory pooled across them would
 * teach each one the other's customer. Every query in this file is keyed on
 * ctx.agentId for that reason.
 */

/** Hard caps. A memory that can grow is a memory that will. */
const CAP = { fits: 4, misses: 4, words: 8, line: 70, total: 1200 };

/** Revised once this much new evidence has landed since the last revision. */
const ENOUGH = { good: 8, replies: 2 };

export interface Memory {
  rev: number;
  /** Who turned out to be worth writing to, in the audience's own words. */
  fits: string[];
  /** Who looked right and was not. The expensive half of the lesson. */
  misses: string[];
  /** Phrases these people put in their own headlines. Seeds the next search. */
  words: string[];
}

const BLANK: Memory = { rev: 0, fits: [], misses: [], words: [] };

function trim(list: unknown, max: number): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, CAP.line))
    .filter((v) => v.length > 2)
    .slice(0, max);
}

export function parseMemory(raw: string | null | undefined): Memory {
  if (!raw) return BLANK;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      rev: Number(p.rev ?? 0),
      fits: trim(p.fits, CAP.fits),
      misses: trim(p.misses, CAP.misses),
      words: trim(p.words, CAP.words),
    };
  } catch {
    return BLANK;
  }
}

export async function readMemory(ctx: AgentContext): Promise<Memory> {
  const { rows } = await db().execute({
    sql: `SELECT memory FROM agents WHERE id = ? AND workspace_id = ?`,
    args: [ctx.agentId, ctx.workspaceId],
  });
  return parseMemory(rows[0]?.memory as string | null);
}

/**
 * The memory as a few lines of prompt, or nothing at all.
 *
 * Returns an empty string on a blank memory rather than a heading with nothing
 * under it: an empty section reads as "we found nobody" and skews the very
 * judgement it is supposed to sharpen.
 */
export function asPrompt(m: Memory): string {
  if (!m.fits.length && !m.misses.length) return "";
  const lines = ["What this agent has learned from its own results so far:"];
  if (m.fits.length) lines.push(`Worth writing to: ${m.fits.join("; ")}`);
  if (m.misses.length) lines.push(`Looked right and was not: ${m.misses.join("; ")}`);
  if (m.words.length) lines.push(`Words this audience uses about itself: ${m.words.join(", ")}`);
  return lines.join("\n");
}

/**
 * Counts and a dozen headlines. Never the table.
 *
 * ## The reply that taught an agent to hunt its customer's competitor
 *
 * `replied` used to be every lead at step 'replied' or 'finished', and it was
 * handed to the model under the line "these people replied, which is the
 * strongest evidence there is". On the live account six people had replied and
 * four of them could never buy: a coach, a newsletter, a bootcamp and the
 * founder of a directly competing product. Revision 3 of that agent's memory
 * duly listed "Founder of GDPRChecker, cookie consent and privacy readiness
 * tool" under `fits`, and that memory is injected into the scoring of every
 * lead afterwards, where it argues against the competitor rule sitting in the
 * same prompt.
 *
 * So the strongest evidence is no longer "answered" but "wanted it", and the
 * refusals now come back as their own kind of lesson rather than being counted
 * as wins. What the customer marked as a meeting or a customer outranks all of
 * it, because that is the only column here that is not a proxy.
 */
async function evidence(ctx: AgentContext, since: number) {
  const [won, good, poor, refused, rejected] = await Promise.all([
    // The only rows that are not a proxy for anything.
    db().execute({
      sql: `SELECT headline, job_title, company FROM agent_leads
             WHERE agent_id = ? AND (outcome IN ('meeting','customer') OR reply_intent = 'interested')
             ORDER BY CASE outcome WHEN 'customer' THEN 0 WHEN 'meeting' THEN 1 ELSE 2 END
             LIMIT 8`,
      args: [ctx.agentId],
    }),
    db().execute({
      sql: `SELECT headline, job_title, company FROM agent_leads
             WHERE agent_id = ? AND match_score >= 70 AND created_at >= ?
               AND rejected_at IS NULL AND COALESCE(reply_intent,'') <> 'refused'
             ORDER BY match_score DESC LIMIT 12`,
      args: [ctx.agentId, since],
    }),
    // The expensive mistakes: scored well enough to be written to, and the
    // invitation was never accepted. A memory built only on wins learns half.
    db().execute({
      sql: `SELECT headline, job_title, company FROM agent_leads
             WHERE agent_id = ? AND match_score >= 70 AND step = 'invited'
               AND step_at <= ? LIMIT 8`,
      args: [ctx.agentId, Math.floor(Date.now() / 1000) - 14 * 86400],
    }),
    db().execute({
      sql: `SELECT headline, job_title, company FROM agent_leads
             WHERE agent_id = ? AND reply_intent = 'refused' LIMIT 8`,
      args: [ctx.agentId],
    }),
    // The customer saying so in as many words. Nothing outranks this as a miss.
    db().execute({
      sql: `SELECT headline, job_title, company FROM agent_leads
             WHERE agent_id = ? AND (rejected_at IS NOT NULL OR outcome = 'not_a_fit')
             ORDER BY COALESCE(outcome_at, rejected_at) DESC LIMIT 8`,
      args: [ctx.agentId],
    }),
  ]);

  const say = (rows: Array<Record<string, unknown>>) =>
    rows
      .map((r) =>
        String(r.headline ?? [r.job_title, r.company].filter(Boolean).join(" at ")).trim()
      )
      .filter((h) => h.length > 3)
      .slice(0, 12);

  return {
    won: say(won.rows),
    good: say(good.rows),
    ignored: say(poor.rows),
    refused: say(refused.rows),
    rejected: say(rejected.rows),
  };
}

/**
 * Has enough happened to be worth a model call?
 *
 * A single word from the customer counts on its own. They have just told us the
 * agent is wrong about somebody, or right about somebody, and making them wait
 * for seven more leads before the agent takes it in would be the product
 * ignoring the one person it works for.
 */
async function worthRevising(ctx: AgentContext, since: number): Promise<boolean> {
  const { rows } = await db().execute({
    sql: `SELECT
            SUM(CASE WHEN match_score >= 70 AND created_at >= ? THEN 1 ELSE 0 END) good,
            SUM(CASE WHEN reply_intent = 'interested' AND updated_at >= ? THEN 1 ELSE 0 END) wanted,
            SUM(CASE WHEN rejected_at >= ? OR outcome_at >= ? THEN 1 ELSE 0 END) judged
          FROM agent_leads WHERE agent_id = ?`,
    args: [since, since, since, since, ctx.agentId],
  });
  const good = Number(rows[0]?.good ?? 0);
  const wanted = Number(rows[0]?.wanted ?? 0);
  const judged = Number(rows[0]?.judged ?? 0);
  return judged >= 1 || wanted >= ENOUGH.replies || good >= ENOUGH.good;
}

/**
 * One revision: the old memory plus what has happened, in, a new memory out.
 *
 * Same size going out as coming in, which is the whole design. The model is
 * told to replace rather than extend, and everything it returns is capped again
 * on the way to the database, because a prompt is a request and a cap is a
 * guarantee.
 */
export async function reviseMemory(ctx: AgentContext): Promise<Memory | null> {
  const { rows } = await db().execute({
    sql: `SELECT memory, memory_rev, memory_at FROM agents WHERE id = ? AND workspace_id = ?`,
    args: [ctx.agentId, ctx.workspaceId],
  });
  if (!rows[0]) return null;

  const current = parseMemory(rows[0].memory as string | null);
  const since = Number(rows[0].memory_at ?? 0);
  if (!(await worthRevising(ctx, since))) return null;

  const seen = await evidence(ctx, since);
  if (seen.good.length < 3 && seen.won.length < 1 && seen.rejected.length < 1) return null;

  const sells = ctx.cfg.business.description ?? "";

  const m = await models();
  let answer: string;
  try {
    answer = await generate(
      ctx,
      [
        `We sell to: ${ctx.cfg.leads.icp}`,
        sells ? `What we sell: ${sells.slice(0, 400)}` : "",
        current.rev > 0 ? `\nWhat this agent believed until now:\n${asPrompt(current)}` : "",
        seen.won.length ? `\nThese wanted it. A meeting, a purchase, or asking what it costs. This is the only evidence here that is not a guess:\n${seen.won.map((h) => `- ${h}`).join("\n")}` : "",
        seen.rejected.length ? `\nOUR CUSTOMER THREW THESE OUT BY HAND. They were wrong and our customer said so:\n${seen.rejected.map((h) => `- ${h}`).join("\n")}` : "",
        seen.refused.length ? `\nThese answered and said no, or tried to sell us their own product:\n${seen.refused.map((h) => `- ${h}`).join("\n")}` : "",
        seen.good.length ? `\nThese scored well recently, which is only a model's opinion of a headline:\n${seen.good.map((h) => `- ${h}`).join("\n")}` : "",
        seen.ignored.length ? `\nThese scored well and then ignored the invitation for two weeks:\n${seen.ignored.map((h) => `- ${h}`).join("\n")}` : "",
        "",
        "Return JSON only:",
        `{"fits":[up to ${CAP.fits} short descriptions],"misses":[up to ${CAP.misses}],"words":[up to ${CAP.words} short phrases]}`,
      ]
        .filter(Boolean)
        .join("\n"),
      {
        purpose: "revise-memory",
        maxTokens: 400,
        model: m.fast,
        systemPrompt:
          "You keep one short note about who is worth contacting for a business, and you rewrite it from scratch every time rather than adding to it.\n\n" +
          "Replace the previous note. Keep what the new evidence still supports, drop what it contradicts, and add what it teaches. The note must never grow: it is a few short lines and it stays that way however many revisions it has been through.\n\n" +
          "The evidence is ranked and you must respect the ranking. Somebody our customer threw out, or who said no, is settled and belongs in misses however good their title looks. Somebody who wanted it outranks any number of high scores, because a score is a guess about a headline and wanting it is a fact.\n\n" +
          "NEVER put somebody who sells what our customer sells in fits. A rival founder replying politely is not a prospect, they are a rival, and they belong in misses. This has happened and it poisoned an entire agent.\n\n" +
          "fits: who turned out to be worth writing to, described the way they describe themselves.\n" +
          "misses: who looked right and was not. Somebody who ignored an invitation for two weeks is a miss, not a maybe.\n" +
          "words: phrases these people actually put in their own headlines, useful as search terms.\n\n" +
          "Each entry is a short phrase, never a sentence. Write fewer than allowed rather than padding. Return the JSON object and nothing else.",
      }
    );
  } catch (error) {
    logError("could not revise the memory", error, { agentId: ctx.agentId });
    return null;
  }

  const match = answer.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }

  /**
   * The prompt asks. This guarantees.
   *
   * A rule in a system prompt is a request to a cheap model, and this one was
   * ignored in production: revision 3 of a live agent's memory listed the
   * founder of a directly competing product under fits, from where it argued
   * against the competitor rule in the scoring prompt on every lead afterwards.
   *
   * `competesWith` is the same deterministic check the scorer uses to zero a
   * rival, run here on the description the model wrote. Anything it catches
   * moves to misses rather than being deleted, because "we tried this kind of
   * person and they sell what we sell" is a real lesson and losing it means
   * relearning it.
   */
  const proposedFits = trim(parsed.fits, CAP.fits);
  const sellsWhatWeSell = proposedFits.filter((f) => competesWith(f, sells).competes);
  const cleanFits = proposedFits.filter((f) => !sellsWhatWeSell.includes(f));
  if (sellsWhatWeSell.length) {
    log("kept a rival out of the memory", {
      agentId: ctx.agentId,
      dropped: sellsWhatWeSell,
    });
  }

  const next: Memory = {
    rev: current.rev + 1,
    fits: cleanFits,
    misses: trim([...sellsWhatWeSell, ...(Array.isArray(parsed.misses) ? parsed.misses : [])], CAP.misses),
    words: trim(parsed.words, CAP.words),
  };
  if (!next.fits.length && !next.misses.length) return null;

  // The cap is enforced here and not only asked for. A model that ignores the
  // instruction must not be able to grow the row.
  const encoded = JSON.stringify(next).slice(0, CAP.total);
  await db().execute({
    sql: `UPDATE agents SET memory = ?, memory_rev = ?, memory_at = ?, updated_at = ?
           WHERE id = ? AND workspace_id = ?`,
    args: [
      encoded,
      next.rev,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000),
      ctx.agentId,
      ctx.workspaceId,
    ],
  });

  log("memory revised", {
    agentId: ctx.agentId,
    rev: next.rev,
    fits: next.fits.length,
    misses: next.misses.length,
    bytes: encoded.length,
  });
  return next;
}
