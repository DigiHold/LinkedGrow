import type { AgentContext } from "./config.ts";
import { db, type ReplyIntent } from "./db.ts";
import { log } from "./logger.ts";
import { chat, type AgentProvider } from "../../shared/ai-client.ts";
import { AGENT_PROVIDERS, isAgentProvider, priceFor } from "../../shared/ai-models.ts";
import { instance } from "./instance.ts";

/**
 * Every model call in the worker goes through here.
 *
 * Three things the single-tenant original did not need, all mandatory now:
 *
 * 1. **API only.** Plan section 8b settles that subscription mode cannot serve
 *    a product. The CLI path is gone rather than disabled.
 * 2. **Routing.** Section 8c: the provider's fast model for classification,
 *    where volume is the cost driver and quality barely moves, its writer model
 *    for anything a human reads. Built naively this bill is five times larger
 *    for no gain.
 * 3. **Ceilings, checked before the call.** Section 8g: $1.00 a day and $12 a
 *    month per agent. Scoring is the one cost line LinkedIn's limits do not
 *    bound, so an agent pointed at fifteen broad sources could otherwise score
 *    tens of thousands of profiles while contacting the same 500 people.
 *
 * The spend is metered before the response is used, so a call whose cost cannot
 * be recorded is a call that does not happen.
 */

export interface AgentModels {
  provider: AgentProvider;
  /** Classification and scoring. Volume is the cost driver here. */
  fast: string;
  /** Anything a person will read: notes, DMs, comments. */
  writer: string;
  apiKey: string | null;
}

/**
 * Which provider, which two models and which key the agents run on.
 *
 * The cloud keeps Anthropic on the environment's key. The self hosted edition
 * runs on whatever the setup wizard stored: any of the five providers, the
 * stored model ids when the owner picked some, the provider's own pair
 * otherwise. Prices live in the shared table next to the client.
 */
export async function models(): Promise<AgentModels> {
  const inst = await instance();
  const provider: AgentProvider =
    inst.agentAiProvider && isAgentProvider(inst.agentAiProvider) ? inst.agentAiProvider : "anthropic";
  const defaults = AGENT_PROVIDERS[provider];
  return {
    provider,
    fast: inst.agentAiModelFast || defaults.fast,
    writer: inst.agentAiModelWriter || defaults.writer,
    apiKey: inst.agentAiKey,
  };
}

export const NO_AI_KEY_MESSAGE = "No AI key is configured for the agents. Add one in Settings, Instance.";

/** Thrown before any call when there is no key to call with. The agent is paused with this message. */
export class NoAiKeyError extends Error {
  constructor() {
    super(NO_AI_KEY_MESSAGE);
    this.name = "NoAiKeyError";
  }
}

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
  // The caps come from the instance: the wizard's two numbers on a self hosted
  // box, the constants above in the cloud.
  const [day, month, inst] = await Promise.all([
    spentSince(ctx.agentId, now - 86_400),
    accountSpentSince(ctx.linkedinAccountId, now - 30 * 86_400),
    instance(),
  ]);

  const pool = inst.accountMonthlyCapUsd * Math.max(1, ctx.agentsOnAccount);

  // Answering a person who wrote to you is not the same kind of spend as
  // looking for more people. When the pool runs low, discovery stops first and
  // the conversations already open keep running on the last 20%. Going silent
  // on a warm lead costs the customer far more than a thin month of mining.
  const conversation = purpose === "intro" || purpose === "converse" ||
    purpose === "ask" || purpose === "hello" || purpose === "classify-reply";
  const limit = conversation ? pool : pool * 0.8;

  if (day >= inst.agentDailyCapUsd) throw new BudgetExceededError("day", day);
  if (month >= limit) throw new BudgetExceededError("month", month);
}

function costOf(provider: AgentProvider, model: string, inputTokens: number, outputTokens: number): number {
  const price = priceFor(provider, model);
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

async function meter(
  ctx: AgentContext,
  provider: AgentProvider,
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
      costOf(provider, model, inputTokens, outputTokens),
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
 * On Anthropic the system prompt is sent with a cache breakpoint because it is
 * identical across thousands of scoring calls, and cached reads bill at roughly
 * a tenth of input. Section 8c: without caching the same workload costs several times
 * more, and that is the difference between the agent AI being affordable to
 * include and not.
 */
export async function generate(
  ctx: AgentContext,
  prompt: string,
  opts: GenerateOptions
): Promise<string> {
  await assertBudget(ctx, opts.purpose);
  const m = await models();
  if (!m.apiKey) throw new NoAiKeyError();
  const model = opts.model ?? m.writer;

  const result = await chat({
    provider: m.provider,
    apiKey: m.apiKey,
    model,
    system: opts.systemPrompt,
    cacheSystem: m.provider === "anthropic",
    messages: [{ role: "user", content: prompt }],
    maxTokens: opts.maxTokens ?? 1024,
  });

  await meter(ctx, m.provider, model, opts.purpose, result.inputTokens, result.outputTokens);
  return result.text;
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

  const m = await models();
  const answer = await generate(
    ctx,
    `Ideal customer: ${icp}\n\nPeople:\n${list}\n\nFor each number, answer keep or drop. One word per line, in order, nothing else.`,
    {
      model: m.fast,
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

/**
 * What a reply actually means, so the agent stops only when it should.
 *
 * The rule used to be a list of words. It handed the conversation over the
 * moment somebody wrote "nice meeting you" and kept going when they wrote
 * "sounds great, send me more". Neither is what a person would do, and the
 * first one is worse: three leads on 2026-08-07 answered a hello with small
 * talk and every one was marked over-to-you.
 *
 * One call on the cheap model, per inbound reply, so the cost is proportional
 * to the number of people who wrote rather than to the number contacted.
 *
 * It is asked one question and nothing else. "Is this person asking for
 * something only a human can give?" A question about who we are, a thank-you,
 * a bit of small talk and a question about their own business are all things
 * the agent answers. Wanting the product, a price, a call or a demo is not.
 */
/**
 * Two questions, one call, because they were being answered as if they were one.
 *
 * WHO ANSWERS NEXT is what this was built for. WHAT THE REPLY WAS WORTH is the
 * question the learning pass needs, and nothing was asking it, so every reply
 * counted the same at a weight of eight. On a live agent that meant an
 * executive coach, an AI newsletter, a bootcamp operator and the founder of a
 * directly competing product all registered as the strongest possible evidence
 * that their source was working, and the source that found the competitor rose
 * to the top of the mining queue.
 *
 * The two axes genuinely differ. "Not interested, thanks" hands over AND is
 * worthless. "What does it cost?" hands over AND is the best thing that can
 * happen. "Thanks for connecting!" does neither.
 */
export async function classifyReply(
  ctx: AgentContext,
  thread: { from: "us" | "them"; body: string }[],
  business: string
): Promise<{ handOver: boolean; why: string; intent: ReplyIntent }> {
  const transcript = thread
    .slice(-6)
    .map((t) => `${t.from === "us" ? "Us" : "Them"}: ${t.body.replace(/\s+/g, " ").trim()}`)
    .join("\n");

  const m = await models();
  const answer = await generate(
    ctx,
    `Our business: ${business || "a software product"}\n\nThe conversation so far:\n${transcript}\n\nAnswer on one line: HUMAN or AGENT, then INTERESTED, NEUTRAL or REFUSED, then a short reason.`,
    {
      /**
       * The writer model, not the fast one. A handful of replies a day makes
       * this the cheapest call in the whole product and the single
       * highest-stakes read: on 2026-08-15 the fast model's verdicts had
       * filled the customer's Yours-now list with greetings while a
       * co-founder solicitation sat there labelled as needing them.
       */
      model: m.writer,
      purpose: "classify-reply",
      maxTokens: 60,
      systemPrompt:
        "You read one LinkedIn conversation and answer two separate questions about the last message from the other person.\n\n" +
        "FIRST, who should answer it.\n" +
        "HUMAN only when they are moving toward buying or meeting US: they want to see the product, want a demo, a call or a meeting about what we do, ask what it costs or how it works because they might use it, want to buy, or raise a complaint that needs an owner.\n" +
        "HUMAN also, always, when they ask or imply in ANY wording that our messages might be automated, AI-written, or from a bot ('do you use AI', 'is this ChatGPT', 'sounds automated', 'am I talking to a bot'). That question is never answered by an assistant, and it never ends the thread on its own: a real person answers it.\n" +
        "AGENT for everything else, and everything else is most replies: thanks, hello, an emoji, small talk, telling you about their own work, asking who you are, where you are from, what you do or why you got in touch, asking a question about their own business or yours that does not commit anybody to anything, or saying they will be in touch later.\n" +
        "Never HUMAN for somebody working their own pipeline (see REFUSED below): their meeting request is their sales motion, not ours.\n" +
        "When unsure, answer AGENT. An assistant writing one more friendly message costs nothing; handing a warm conversation to a busy person who then leaves it unanswered for a week costs the relationship.\n\n" +
        "SECOND, what the reply is worth as a sales signal, which is a different question and often has the opposite answer.\n" +
        "INTERESTED: they want what we sell, ask what it does or costs, describe having the problem, or ask to continue the conversation about it.\n" +
        "REFUSED: they say no, ask to be left alone, say it is not relevant, or they are working their own pipeline instead of ours: pitching THEIR product or services, recruiting, fundraising, or asking us to be their co-founder or partner. A seller, a recruiter or a fundraiser is never a buyer, whatever they ask for.\n" +
        "NEUTRAL: everything else, and most replies are neutral. A greeting, a thank-you, small talk, politeness, or a friendly answer that says nothing about wanting the product is NEUTRAL, not interested.\n" +
        "Be strict. When unsure between INTERESTED and NEUTRAL, answer NEUTRAL.\n\n" +
        "Format: HUMAN or AGENT, a slash, INTERESTED or NEUTRAL or REFUSED, a dash, then at most eight words of reason. Example: AGENT / NEUTRAL - polite thanks, nothing asked.",
    }
  );

  const head = answer.trim().toUpperCase();
  const verdict = head.startsWith("HUMAN");
  const intent: ReplyIntent = /\bREFUSED\b/.test(head)
    ? "refused"
    : /\bINTERESTED\b/.test(head)
      ? "interested"
      : "neutral";
  const why = answer
    .replace(/^\s*(human|agent)\s*[/,|]?\s*(interested|neutral|refused)?\s*[-:]?\s*/i, "")
    .trim()
    .slice(0, 120);
  return { handOver: verdict, why: why || answer.trim().slice(0, 120), intent };
}

/** Full scoring, still on the fast model. The writer here is the biggest cost mistake available. */
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
    /**
     * How many DIFFERENT ways this person has turned up, and which.
     *
     * Somebody who commented under one rival, then came up in a search for the
     * role, then reacted to another rival is not the same prospect as somebody
     * seen once, and until now the second and third sightings were discarded by
     * the claim. It is the cheapest hard evidence the agent collects: nobody
     * writes a headline to impress us, and nobody engages three times by
     * accident.
     */
    hits?: number;
    kinds?: string;
  }
,
  /**
   * What this agent has learned about who actually converts.
   *
   * Passed in rather than read here, so ai.ts stays a thin layer over the model
   * and one pass reads the memory once instead of once per lead.
   */
  memory = ""
): Promise<{ score: number; reason: string }> {
  /**
   * What the customer sells, which this prompt never used to include.
   *
   * Without it the scorer could not see a collision it was being asked to
   * judge. On 2026-08-08 it scored the co-founder of a booking product as a
   * good match for a booking product, and the founder of a cookie consent
   * widget as a good match for a cookie consent widget, and both were messaged.
   * Neither was a mistake of judgement: the fact that decides it was not in the
   * prompt.
   */
  const sells = (ctx.cfg.business.description ?? "").trim().slice(0, 700);

  /**
   * The repetition, spelled out rather than left as a number.
   *
   * "3" next to a field called hits means nothing to a model reading a hundred
   * of these. The sentence says what actually happened, and what it implies.
   */
  const repeats =
    (profile.hits ?? 1) > 1
      ? `\nSeen ${profile.hits} separate times, through ${(profile.kinds ?? "")
          .split(",")
          .filter(Boolean)
          .join(", ")}. Turning up repeatedly through different routes is hard evidence of being active in this market, and it is worth more than any headline.`
      : "";

  const m = await models();
  const answer = await generate(
    ctx,
    `${sells ? `What our customer sells: ${sells}\n\n` : ""}Ideal customer: ${icp}
${memory ? `\n${memory}\n` : ""}

Prospect:
Name: ${profile.name}
Headline: ${profile.headline}
Company: ${profile.company ?? "unknown"}
${profile.signal ? `How they were found: ${profile.signal}` : ""}${repeats}
${profile.about ? `About: ${profile.about.slice(0, 600)}` : ""}

Score from 0 to 100. What they were doing when they were found is real evidence about their interest, so somebody asking about the problem beats the same headline found in a search. Reply with the score and a one-sentence reason.`,
    {
      model: m.fast,
      purpose: "score",
      maxTokens: 150,
      systemPrompt:
        // "Answer only as SCORE|reason" invited the model to repeat that line
        // before answering, which is what broke the parsing. Showing a filled
        // example instead of a template gives it nothing to echo.
        "You score how well a prospect matches an ideal customer profile. Be strict: 80 and above means they clearly are one.\n\n" +
        /**
         * The rule that was missing, and the line it replaces.
         *
         * The old prompt ended by saying that somebody engaging with a
         * competitor was a STRONGER match, which is true of a buyer comparing
         * options and exactly wrong for the person who runs the rival product
         * and is watching their own market. Under a competitor's post those two
         * sit in the same list of names.
         */
        "If the prospect builds, sells, co-founds or leads a product that does the same job as what our customer sells, they are a competitor and the score is 0, whatever they were doing when they were found and however well their title reads. A rival founder engaging with a competitor is watching their market, not shopping. Somebody who merely works in the same industry, or uses tools like this, is not a competitor and is often the right person.\n\n" +
        "Somebody whose profile reads as looking for a job scores 0 to 10 whatever else matches: open to work, seeking opportunities, aspiring anything, a recent graduate, between roles, or no current company to buy for. People buy tools for a business they run or a job they hold, not while hunting for one.\n\n" +
        "When the agent's own learning is given, it outranks the written profile: it is what happened rather than what somebody hoped would happen. Somebody matching a shape that has been contacted and ignored scores low however good the title reads.\n\n" +
        "Reply with one line and nothing else, a number then a pipe then the reason, like this: 72|Founder at a small SaaS, buys their own tools.",
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
    return { score, reason: cleanReason(best[2] ?? "") };
  }
  // No pipe anywhere. A bare number is still an answer; anything else is not,
  // and a lead left unscored is picked up again rather than stored as a zero.
  const bare = /(?:^|\n)\s*(\d{1,3})\s*$/m.exec(answer);
  if (bare) {
    return { score: Math.max(0, Math.min(100, Number(bare[1]))), reason: "No reason given" };
  }
  throw new Error(`The scorer answered in a shape nothing could read: ${answer.slice(0, 120)}`);
}

/**
 * The reason as a person should read it, with any echoed template cut off.
 *
 * A version of the parser above split on the FIRST pipe, so when the model
 * repeated its instructions before answering, parseInt("SCORE") was NaN and the
 * whole tail became the reason. Ten leads on a live account still show
 * "reason\n\n15|CSO role at established newsletter..." in the customer's
 * queue under "Why this person", and one of them is a person who has since
 * replied.
 *
 * The parser no longer produces that. This is the guard in front of the screen:
 * whatever shape an answer arrives in, anything before the last "number pipe"
 * is scaffolding and never the reason. Cheap, and it means a future model quirk
 * costs a log line rather than a column of nonsense in front of a customer.
 */
export function cleanReason(raw: string): string {
  let reason = (raw ?? "").trim();
  // An echoed template ends where the real answer begins, at the last pipe that
  // has a number in front of it.
  const echo = /^[\s\S]*?(?:^|\n)\s*\d{1,3}\s*\|\s*/.exec(reason);
  if (echo) reason = reason.slice(echo[0].length).trim();
  // A bare "SCORE|" or "reason|" opener, with no number to anchor on.
  reason = reason.replace(/^(score|reason|answer|r(?:é|e)ponse)\s*[:|]\s*/i, "").trim();
  return reason || "No reason given";
}

/** Logged rather than thrown, because a metering failure must not stop the run twice. */
export async function reportBudget(ctx: AgentContext, error: unknown): Promise<void> {
  if (error instanceof BudgetExceededError) {
    log(`agent ${ctx.agentId}: ${error.message}`);
  }
}
