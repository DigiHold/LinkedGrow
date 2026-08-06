import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "./config.ts";
import type { AgentContext } from "./config.ts";
import { db } from "./db.ts";
import { log } from "./logger.ts";

/**
 * Every model call in the worker goes through here.
 *
 * Three things the single-tenant original did not need, all mandatory now:
 *
 * 1. **API only.** Plan section 8b settles that subscription mode cannot serve
 *    a product. The CLI path is gone rather than disabled.
 * 2. **Routing.** Section 8c: Haiku for classification, where volume is the
 *    cost driver and quality barely moves, Sonnet for anything a human reads.
 *    Built naively this bill is five times larger for no gain.
 * 3. **Ceilings, checked before the call.** Section 8g: $1.00 a day and $12 a
 *    month per agent. Scoring is the one cost line LinkedIn's limits do not
 *    bound, so an agent pointed at fifteen broad sources could otherwise score
 *    tens of thousands of profiles while contacting the same 500 people.
 *
 * The spend is metered before the response is used, so a call whose cost cannot
 * be recorded is a call that does not happen.
 */

export const MODELS = {
  /** Classification and scoring. Volume is the cost driver here. */
  fast: "claude-haiku-4-5-20251001",
  /** Anything a person will read: notes, DMs, comments. */
  writer: "claude-sonnet-5",
} as const;

/** Standard pricing, dollars per million tokens. Sonnet's intro rate ended 2026-08-31. */
const PRICE = {
  [MODELS.fast]: { input: 1, output: 5 },
  [MODELS.writer]: { input: 3, output: 15 },
} as const;

export const DAILY_CEILING_USD = 1.0;

/**
 * The monthly ceiling is a WORKSPACE pool, not a per-agent allowance.
 *
 * It used to be $12 flat per agent, and that punished success. Measured cost is
 * $4.20 an agent a month at a normal 30% acceptance and 20% reply rate, but an
 * agent that genuinely works, 60% accepting and 40% replying, reaches $8.86.
 * A flat per-agent cap would throttle the best agent a customer has while the
 * one still warming up leaves most of its allowance unspent.
 *
 * Pooling fixes that at identical worst-case exposure: the same $12 an agent,
 * shared, so a hot agent borrows from a quiet one. That is what actually
 * happens, because ICPs are not equally good.
 */
export const MONTHLY_CEILING_PER_AGENT_USD = 12.0;

let client: Anthropic | null = null;

function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

export class BudgetExceededError extends Error {
  readonly window: "day" | "month";
  readonly spent: number;

  constructor(window: "day" | "month", spent: number) {
    super(
      window === "day"
        ? `This agent has spent $${spent.toFixed(2)} on AI today, which is its daily ceiling.`
        : `This agent has spent $${spent.toFixed(2)} on AI this month, which is its monthly ceiling.`
    );
    this.name = "BudgetExceededError";
    this.window = window;
    this.spent = spent;
  }
}

async function spentSince(agentId: string, sinceEpochSeconds: number): Promise<number> {
  const { rows } = await db().execute({
    sql: `SELECT COALESCE(SUM(cost_usd), 0) AS total
          FROM agent_ai_usage
          WHERE agent_id = ? AND created_at >= ?`,
    args: [agentId, sinceEpochSeconds],
  });
  return Number(rows[0]?.total ?? 0);
}

/**
 * Spend across every agent driving ONE LinkedIn account, which is the scope the
 * monthly pool is sized for.
 *
 * It used to measure the whole workspace while the pool was sized from the
 * agents on a single account, so a customer with two connected accounts was
 * throttled at half of what they had paid for.
 */
async function accountSpentSince(
  linkedinAccountId: string,
  sinceEpochSeconds: number
): Promise<number> {
  const { rows } = await db().execute({
    sql: `SELECT COALESCE(SUM(cost_usd), 0) AS total
          FROM agent_ai_usage
          WHERE linkedin_account_id = ? AND created_at >= ?`,
    args: [linkedinAccountId, sinceEpochSeconds],
  });
  return Number(rows[0]?.total ?? 0);
}

/**
 * Both windows, because they do different jobs: the daily figure bounds a
 * runaway to one day, the monthly one protects the margin.
 */
export async function assertBudget(ctx: AgentContext, purpose = ""): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const [day, month] = await Promise.all([
    spentSince(ctx.agentId, now - 86_400),
    accountSpentSince(ctx.linkedinAccountId, now - 30 * 86_400),
  ]);

  const pool = MONTHLY_CEILING_PER_AGENT_USD * Math.max(1, ctx.agentsOnAccount);

  // Answering a person who wrote to you is not the same kind of spend as
  // looking for more people. When the pool runs low, discovery stops first and
  // the conversations already open keep running on the last 20%. Going silent
  // on a warm lead costs the customer far more than a thin month of mining.
  const conversation = purpose === "intro" || purpose === "converse" ||
    purpose === "ask" || purpose === "hello";
  const limit = conversation ? pool : pool * 0.8;

  if (day >= DAILY_CEILING_USD) throw new BudgetExceededError("day", day);
  if (month >= limit) throw new BudgetExceededError("month", month);
}

function costOf(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICE[model as keyof typeof PRICE] ?? PRICE[MODELS.writer];
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

async function meter(
  ctx: AgentContext,
  model: string,
  purpose: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  await db().execute({
    sql: `INSERT INTO agent_ai_usage
            (id, workspace_id, agent_id, linkedin_account_id, model, purpose,
             input_tokens, output_tokens, cost_usd, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, ctx.linkedinAccountId,
      model, purpose, inputTokens, outputTokens,
      costOf(model, inputTokens, outputTokens),
      Math.floor(Date.now() / 1000),
    ],
  });
}

export interface GenerateOptions {
  maxTokens?: number;
  /** Named so the metering log can say which line of the bill this was. */
  purpose: string;
  /** Cached across calls: the ICP, the rubric, the product description. */
  systemPrompt?: string;
  model?: string;
}

/**
 * One model call, metered and capped.
 *
 * The system prompt is sent with a cache breakpoint because it is identical
 * across thousands of scoring calls, and cached reads bill at roughly a tenth
 * of input. Section 8c: without caching the same workload costs several times
 * more, and that is the difference between the agent AI being affordable to
 * include and not.
 */
export async function generate(
  ctx: AgentContext,
  prompt: string,
  opts: GenerateOptions
): Promise<string> {
  await assertBudget(ctx, opts.purpose);
  const model = opts.model ?? MODELS.writer;

  const message = await anthropic().messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1024,
    ...(opts.systemPrompt
      ? {
          system: [
            {
              type: "text" as const,
              text: opts.systemPrompt,
              cache_control: { type: "ephemeral" as const },
            },
          ],
        }
      : {}),
    messages: [{ role: "user", content: prompt }],
  });

  await meter(
    ctx,
    model,
    opts.purpose,
    message.usage.input_tokens,
    message.usage.output_tokens
  );

  const text = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
  if (!text) throw new Error("The model returned nothing");
  return text;
}

/**
 * Cheap classification: a headline and a name, in, a keep-or-drop decision out.
 *
 * Section 8c rule 1: the reactions list gives name and headline for free, so
 * rejecting 70 to 80% of candidates here means only the survivors cost a
 * profile fetch and a full scoring call. This one function is roughly three
 * quarters of the scoring saving.
 */
export async function prefilter(
  ctx: AgentContext,
  icp: string,
  candidates: { name: string; headline: string }[]
): Promise<boolean[]> {
  if (!candidates.length) return [];
  const list = candidates
    .map((c, i) => `${i + 1}. ${c.name} — ${c.headline}`)
    .join("\n");

  const answer = await generate(
    ctx,
    `Ideal customer: ${icp}\n\nPeople:\n${list}\n\nFor each number, answer keep or drop. One word per line, in order, nothing else.`,
    {
      model: MODELS.fast,
      purpose: "prefilter",
      maxTokens: Math.min(1000, candidates.length * 5 + 20),
      systemPrompt:
        "You screen prospects on a single line of text. Keep anyone who could plausibly be the ideal customer. Drop only clear mismatches. Answer with one word per line: keep or drop.",
    }
  );

  const verdicts = answer
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
  return candidates.map((_, i) => verdicts[i]?.startsWith("keep") ?? false);
}

/** Full scoring, still on the cheap model. Sonnet here is the biggest cost mistake available. */
export async function scoreLead(
  ctx: AgentContext,
  icp: string,
  /**
   * `signal` is why this person was found, and it is the strongest thing known
   * about them. It was collected at claim time and then not passed here, so the
   * scorer judged everybody off a headline alone: every reason it wrote said
   * "likely", and nothing ever scored above 85 because a headline cannot make a
   * model certain. Somebody who commented under a competitor's post is not
   * "likely" the audience.
   */
  profile: {
    name: string;
    headline: string;
    company?: string;
    about?: string;
    signal?: string;
  }
): Promise<{ score: number; reason: string }> {
  const answer = await generate(
    ctx,
    `Ideal customer: ${icp}

Prospect:
Name: ${profile.name}
Headline: ${profile.headline}
Company: ${profile.company ?? "unknown"}
${profile.signal ? `How they were found: ${profile.signal}` : ""}
${profile.about ? `About: ${profile.about.slice(0, 600)}` : ""}

Score from 0 to 100. What they were doing when they were found counts as much as their title: somebody engaging with a competitor or asking about the problem is a stronger match than the same headline found in a search. Reply with the score and a one-sentence reason.`,
    {
      model: MODELS.fast,
      purpose: "score",
      maxTokens: 150,
      systemPrompt:
        // "Answer only as SCORE|reason" invited the model to repeat that line
        // before answering, which is what broke the parsing. Showing a filled
        // example instead of a template gives it nothing to echo.
        "You score how well a prospect matches an ideal customer profile. Be strict: 80 and above means they clearly are one. Reply with one line and nothing else, a number then a pipe then the reason, like this: 72|Founder at a small SaaS, buys their own tools.",
    }
  );

  return parseScore(answer);
}

/**
 * Pulls the score and the reason out of whatever shape the answer arrives in.
 *
 * Splitting on the first pipe looked right and was wrong in the one way that
 * mattered: the model often repeats the format line before answering, so the
 * reply is "SCORE|reason\n\n72|Founder at a small SaaS". The first pipe then
 * belongs to the echoed template, parseInt("SCORE") is NaN, and every lead was
 * stored at 0 with "reason\n\n72|Founder at a small SaaS" as its reason. Ten
 * leads in a row scored 0 on the dashboard while the model had actually judged
 * them 72, 25 and 15.
 *
 * So it looks for the pattern rather than a position: a number of up to three
 * digits, a pipe, then text. The last match wins, because the echoed template
 * comes first and the real answer comes after it.
 */
export function parseScore(answer: string): { score: number; reason: string } {
  const matches = [...answer.matchAll(/(?:^|\n)\s*(\d{1,3})\s*\|\s*(.+)/g)];
  const best = matches[matches.length - 1];
  if (best) {
    const score = Math.max(0, Math.min(100, Number(best[1])));
    return { score, reason: (best[2] ?? "").trim() || "No reason given" };
  }
  // No pipe anywhere. A bare number is still an answer; anything else is not,
  // and a lead left unscored is picked up again rather than stored as a zero.
  const bare = /(?:^|\n)\s*(\d{1,3})\s*$/m.exec(answer);
  if (bare) {
    return { score: Math.max(0, Math.min(100, Number(bare[1]))), reason: "No reason given" };
  }
  throw new Error(`The scorer answered in a shape nothing could read: ${answer.slice(0, 120)}`);
}

/** Logged rather than thrown, because a metering failure must not stop the run twice. */
export async function reportBudget(ctx: AgentContext, error: unknown): Promise<void> {
  if (error instanceof BudgetExceededError) {
    log(`agent ${ctx.agentId}: ${error.message}`);
  }
}
