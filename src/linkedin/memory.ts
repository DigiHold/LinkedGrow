import type { AgentContext } from "../config.ts";
import { db } from "../db.ts";
import { generate, MODELS } from "../ai.ts";
import { log, logError } from "../logger.ts";

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

/** Counts and a dozen headlines. Never the table. */
async function evidence(ctx: AgentContext, since: number) {
  const [good, poor, replies] = await Promise.all([
    db().execute({
      sql: `SELECT headline, job_title, company FROM agent_leads
             WHERE agent_id = ? AND match_score >= 70 AND created_at >= ?
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
      sql: `SELECT l.headline, l.job_title, l.company FROM agent_leads l
             WHERE l.agent_id = ? AND l.step IN ('replied','finished') LIMIT 8`,
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

  return { good: say(good.rows), ignored: say(poor.rows), replied: say(replies.rows) };
}

/** Has enough happened to be worth a model call? */
async function worthRevising(ctx: AgentContext, since: number): Promise<boolean> {
  const { rows } = await db().execute({
    sql: `SELECT
            SUM(CASE WHEN match_score >= 70 AND created_at >= ? THEN 1 ELSE 0 END) good,
            SUM(CASE WHEN step IN ('replied','finished') AND step_at >= ? THEN 1 ELSE 0 END) replies
          FROM agent_leads WHERE agent_id = ?`,
    args: [since, since, ctx.agentId],
  });
  const good = Number(rows[0]?.good ?? 0);
  const replies = Number(rows[0]?.replies ?? 0);
  return good >= ENOUGH.good || replies >= ENOUGH.replies;
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
  if (seen.good.length < 3 && seen.replied.length < 1) return null;

  let answer: string;
  try {
    answer = await generate(
      ctx,
      [
        `We sell to: ${ctx.cfg.leads.icp}`,
        current.rev > 0 ? `\nWhat this agent believed until now:\n${asPrompt(current)}` : "",
        seen.replied.length ? `\nThese people replied, which is the strongest evidence there is:\n${seen.replied.map((h) => `- ${h}`).join("\n")}` : "",
        seen.good.length ? `\nThese scored well recently:\n${seen.good.map((h) => `- ${h}`).join("\n")}` : "",
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
        model: MODELS.fast,
        systemPrompt:
          "You keep one short note about who is worth contacting for a business, and you rewrite it from scratch every time rather than adding to it.\n\n" +
          "Replace the previous note. Keep what the new evidence still supports, drop what it contradicts, and add what it teaches. The note must never grow: it is a few short lines and it stays that way however many revisions it has been through.\n\n" +
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

  const next: Memory = {
    rev: current.rev + 1,
    fits: trim(parsed.fits, CAP.fits),
    misses: trim(parsed.misses, CAP.misses),
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
