import type { AgentContext } from "../config.ts";
import { generate, MODELS } from "../ai.ts";
import { db } from "../db.ts";
import { log } from "../logger.ts";

/**
 * What to search for when the customer did not say.
 *
 * The wizard has a toggle reading "Keep looking when the topics run dry", hinted with "Without this
 * the agent runs out of people and looks broken". It defaults to on, it is stored on every agent as
 * smartLeadFinder, and the worker never read it. An agent whose owner typed one competitor and
 * nothing else mined that competitor until it was exhausted and then found nobody, which is exactly
 * the failure the toggle promises to prevent.
 *
 * The customer's own words always win. This only ever fills gaps: an agent with keyword sources
 * searches those, and this is what it falls back on when there are none left.
 *
 * One model call per agent, cached on the row, because the answer changes when their business does
 * and not before.
 */

export interface Targeting {
  /** Phrases to search LinkedIn posts for, where somebody might be asking about the problem. */
  intentQueries: string[];
  /** Subjects the audience engages with, used to widen a dry competitor list. */
  topics: string[];
  /** Hashtags worth reading, each starting with #. */
  hashtags: string[];
  /** Rivals whose audiences overlap, so their commenters can be mined and their staff skipped. */
  competitors: string[];
  /**
   * Words this audience actually puts in their LinkedIn headline.
   *
   * The wizard collects job titles from a set of checkboxes, and those are the
   * words a marketer uses to describe a segment rather than the words the
   * segment uses to describe itself. Matching a headline against "Small
   * business" finds nobody: real headlines say founder, gérant, indépendante,
   * e-commerce, boutique, agency owner. On 2026-07-31 the demographic gate
   * dropped every one of three real people mined off a competitor's post for
   * exactly this reason.
   */
  icpKeywords: string[];
}

const EMPTY: Targeting = {
  intentQueries: [],
  topics: [],
  hashtags: [],
  competitors: [],
  icpKeywords: [],
};

/** Small on purpose. A long list is not more coverage, it is more chances to be wrong. */
const CAPS = { intentQueries: 8, topics: 8, hashtags: 6, competitors: 12, icpKeywords: 16 };

export async function ensureTargeting(ctx: AgentContext): Promise<Targeting> {
  if (!ctx.smartLeadFinder) return EMPTY;

  const cached = await readCache(ctx);
  if (cached) return cached;

  const site = await siteText(ctx.website);
  let raw: string;
  try {
    raw = await generate(ctx, prompt(ctx, site), {
      purpose: "derive-targeting",
      maxTokens: 900,
      model: MODELS.writer,
    });
  } catch (error) {
    // A failed derivation must never stop a run. The agent keeps working from whatever the
    // customer did configure, and the next pass tries again.
    log("could not derive targeting", {
      agentId: ctx.agentId,
      reason: error instanceof Error ? error.message : String(error),
    });
    return EMPTY;
  }

  const derived = normalise(raw);
  if (derived.intentQueries.length === 0 && derived.topics.length === 0) return EMPTY;

  await writeCache(ctx, derived);
  log("derived targeting from the business", {
    agentId: ctx.agentId,
    queries: derived.intentQueries.length,
    competitors: derived.competitors.length,
  });
  return derived;
}

async function readCache(ctx: AgentContext): Promise<Targeting | null> {
  const { rows } = await db().execute({
    sql: `SELECT derived_targeting FROM agents WHERE id = ? AND workspace_id = ?`,
    args: [ctx.agentId, ctx.workspaceId],
  });
  const stored = rows[0]?.derived_targeting;
  if (typeof stored !== "string" || !stored) return null;
  try {
    return normaliseObject(JSON.parse(stored) as Record<string, unknown>);
  } catch {
    return null; // a corrupt cache is worth one re-derivation, not a failed run
  }
}

async function writeCache(ctx: AgentContext, t: Targeting): Promise<void> {
  await db().execute({
    sql: `UPDATE agents SET derived_targeting = ?, updated_at = ? WHERE id = ? AND workspace_id = ?`,
    args: [JSON.stringify(t), Math.floor(Date.now() / 1000), ctx.agentId, ctx.workspaceId],
  });
}

/**
 * The customer's site, reduced to text. Failure is ordinary and non-fatal: plenty of agents are
 * created before the website field is filled, and the description alone is usually enough.
 */
async function siteText(url: string): Promise<string> {
  if (!url) return "";
  let parsed: URL;
  try {
    parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return "";
  }
  // A customer-supplied URL is fetched server-side, so the usual precautions apply.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
  if (/^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i.test(parsed.hostname)) {
    return "";
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(parsed.toString(), {
      headers: { "user-agent": "Mozilla/5.0 (LinkedGrow agent setup)" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch {
    return "";
  }
}

function prompt(ctx: AgentContext, site: string): string {
  return [
    "You are working out who a business should be talking to on LinkedIn, and what to search for to find them.",
    "",
    ctx.cfg.leads.icp ? `Who they sell to, in their own words: ${ctx.cfg.leads.icp}` : "",
    ctx.sender.companyInfo ? `What they do, in their own words: ${ctx.sender.companyInfo}` : "",
    ctx.cfg.leads.icpKeywords.length ? `Roles and industries they named: ${ctx.cfg.leads.icpKeywords.join(", ")}` : "",
    ctx.website ? `Their website: ${ctx.website}` : "",
    site ? `\nTheir homepage text, truncated:\n"""\n${site}\n"""` : "",
    "",
    "Return STRICT JSON and nothing else, no markdown fence, no prose:",
    '{"intentQueries": string[], "topics": string[], "hashtags": string[], "competitors": string[], "icpKeywords": string[]}',
    "",
    "Rules:",
    `- intentQueries: up to ${CAPS.intentQueries} search phrases of THREE TO SIX WORDS. Not sentences. These are typed into a search box, not spoken. Write the words that would appear inside a post from somebody with this problem, the way a person complains rather than the way a vendor markets. "cookie banner broken" and "website not secure" are right. "just found out my API key was exposed on my site" is wrong: it is a sentence, and LinkedIn returns nothing at all for it.`,
    `- icpKeywords: up to ${CAPS.icpKeywords} single words or two-word phrases that appear in THIS AUDIENCE'S OWN LinkedIn headline. Not the words a marketer uses for the segment. "small business" is wrong because nobody writes it about themselves; "founder", "owner", "gérant", "independent", "e-commerce", "boutique" are right. Lowercase. Include the words in the audience's own language as well as English.`,
    `- topics: up to ${CAPS.topics} subjects this audience posts about.`,
    `- hashtags: up to ${CAPS.hashtags} LinkedIn hashtags this audience follows, each starting with #.`,
    `- competitors: up to ${CAPS.competitors} real, well known company or brand names selling something similar. Names only, no descriptions. If you are not confident a company exists, leave it out.`,
    "- Never invent a company name. An empty list is better than a wrong one.",
    "- Everything in the language the audience writes in.",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalise(raw: string): Targeting {
  const text = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  try {
    return normaliseObject(JSON.parse(text) as Record<string, unknown>);
  } catch {
    return EMPTY;
  }
}

function normaliseObject(o: Record<string, unknown>): Targeting {
  const list = (v: unknown, cap: number): string[] =>
    Array.isArray(v)
      ? [...new Set(v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean))].slice(0, cap)
      : [];
  return {
    // Enforced rather than requested. The prompt asked for short phrases and
    // the model returned "just found out my API key was exposed on my site",
    // eleven words, which LinkedIn's content search answers with nothing at
    // all: on 2026-07-31 two of three derived queries returned zero cards. A
    // long query also defeats the on-topic test downstream, which needs two of
    // its terms to appear in the post.
    intentQueries: list(o.intentQueries, CAPS.intentQueries).filter(
      (q) => q.split(/\s+/).filter(Boolean).length <= 6
    ),
    topics: list(o.topics, CAPS.topics),
    hashtags: list(o.hashtags, CAPS.hashtags).map((h) => (h.startsWith("#") ? h : `#${h}`)),
    competitors: list(o.competitors, CAPS.competitors),
    icpKeywords: list(o.icpKeywords, CAPS.icpKeywords).map((k) => k.toLowerCase()),
  };
}
