import type { AgentContext } from "../config.ts";
import { log } from "../logger.ts";
import { generate, MODELS } from "../ai.ts";
import { validateMessage, validateComment } from "./validate.ts";

/** The prospect fields a message is written from. Matches the miner's Engager shape. */
export interface MessageProspect {
  firstName: string;
  fullName: string;
  headline: string;
  /** Where we found them, e.g. "reaction:cookiebot" or "intent:<query>". */
  source: string;
  /** For intent leads, the question they posted. The first message should answer it, not pitch. */
  context?: string;
}

/** What a written message hands back to the sequence. */
export interface GeneratedMessage {
  body: string;
  angle: string;
}

const MAX_ATTEMPTS = 4;


/**
 * Matches free text to one core Amabrik angle (security / AI visibility / GDPR), or null when none
 * of the core problems is present. Used to route both prospects and Reddit threads.
 */
export function matchCoreAngle(ctx: AgentContext, text: string): string | null {
  const hay = text.toLowerCase();
  const props = ctx.cfg.product.valueProps;
  const find = (re: RegExp): string | null => props.find((p) => re.test(p)) ?? null;

  if (/secur|vuln|pentest|infosec|ciso|devsecops|appsec|api key|breach|hack/.test(hay)) return find(/secur/i);
  if (/gdpr|privacy|consent|cookie|complian|dpo|data protection|legal/.test(hay)) return find(/gdpr|consent|compli/i);
  if (/seo|aeo|geo|ai search|marketing|growth|content|brand|visib|generative|demand gen/.test(hay)) return find(/ai visib|aeo/i);
  return null;
}

/** Picks the single Amabrik angle that best fits the prospect, biased to the core three features. */
export function pickAngle(ctx: AgentContext, prospect: MessageProspect): string {
  return matchCoreAngle(ctx, `${prospect.headline} ${prospect.source}`) ?? ctx.cfg.product.valueProps[0] ?? ctx.cfg.product.name;
}

/** One product's keyword-to-value-prop mapping, matched against Reddit threads. */
export interface RedditProduct {
  name: string;
  angles: Array<{ topic: string; match: string; valueProp: string }>;
}

/**
 * The product (and value prop to raise) a thread is genuinely relevant to, or null. First match
 * wins, so order products by priority. Keeps the Reddit tool product-agnostic.
 */
export function matchProduct(products: RedditProduct[], text: string): { name: string; topic: string; angle: string } | null {
  const hay = text.toLowerCase();
  for (const p of products) {
    for (const a of p.angles) {
      if (new RegExp(a.match, "i").test(hay)) return { name: p.name, topic: a.topic, angle: a.valueProp };
    }
  }
  return null;
}

/** Turns the raw engagement signal into a natural clause for the prompt, never a creepy "I watched you". */
function describeSignal(prospect: MessageProspect): string {
  const [kind, rest] = prospect.source.split(":");
  if (kind === "intent") return "they posted publicly asking about exactly this problem";
  if (kind === "question") return "they asked a question about this exact problem under someone else's post";
  if (kind === "reaction" && rest) return `you engaged with content from ${rest} in the same space`;
  if (kind === "comment" && rest) return `you commented on content from ${rest} in the same space`;
  return "you are active in this space";
}

/** Strips code fences, wrapping quotes and stray preamble the model sometimes adds. */
function cleanOutput(raw: string): string {
  let t = raw.trim();
  const fence = t.match(/^```[a-z]*\n([\s\S]*?)\n```$/i);
  if (fence?.[1]) t = fence[1].trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) t = t.slice(1, -1).trim();
  return t;
}

/**
 * Decides whether a LinkedIn post is someone asking for help or a professional broadcasting
 * expertise. Keyword rules cannot separate the two on long posts, because a consultant's article
 * eventually contains a question mark and a first-person word, and those are exactly the people we
 * must not contact: they sell what we sell. One cheap model call per candidate settles it.
 */
export async function judgeAsking(ctx: AgentContext, postText: string): Promise<boolean> {
  const prompt = [
    "Read this LinkedIn post and classify the author.",
    "",
    `Post: ${postText.slice(0, 1200)}`,
    "",
    "Answer with exactly one word:",
    "ASKING - they have this problem themselves and are looking for help, tools or advice.",
    "SHARING - they are teaching, giving their opinion, telling a story, promoting, or selling. This includes consultants and vendors who work in this field.",
    "When it is not clearly someone with the problem, answer SHARING.",
  ].join("\n");
  try {
    const raw = await generate(ctx, prompt, { maxTokens: 8, purpose: "judge", model: MODELS.fast });
    return /^\s*asking/i.test(cleanOutput(raw));
  } catch {
    return false; // never contact someone on a failed judgement
  }
}

/**
 * Decides whether a person actually fits the ICP, judged against the plain-English description in
 * the config rather than a keyword list. Keyword rules pass anyone whose title contains "marketing",
 * which is how a supermarket planning assistant ends up in a queue meant for website owners.
 */
export async function judgeIcpFit(ctx: AgentContext, headline: string, context: string): Promise<boolean> {
  const prompt = [
    `We sell to: ${ctx.cfg.leads.icp}`,
    "",
    `Person's headline: ${headline}`,
    context ? `What they posted: ${context.slice(0, 500)}` : "",
    "",
    "Could this specific person plausibly decide to add a tool to their company website, or influence that decision?",
    "Answer with exactly one word, FIT or SKIP.",
    "Answer SKIP when they are junior, when their field is unrelated, or when they work at a large company",
    "or consultancy where a whole department owns the website and no individual could add a tool to it.",
    "Answer FIT mainly for small businesses, startups, agencies and independents who run their own site.",
    "When unsure, answer SKIP.",
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const raw = await generate(ctx, prompt, { maxTokens: 8, purpose: "judge", model: MODELS.fast });
    return /^\s*fit/i.test(cleanOutput(raw));
  } catch {
    return false;
  }
}

/** A Reddit help-request thread the comment generator writes a reply to. */
export interface RedditThread {
  title: string;
  body: string;
  subreddit: string;
  url: string;
  /** How old the post is, in days, so the model can skip stale threads a reply would no longer reach. */
  ageDays?: number;
}

// Reddit comments read short. Keep replies tight: a couple of sentences, never an essay.
const COMMENT_BOUNDS = { minWords: 12, maxWords: 45 };

/**
 * Judges whether a thread even deserves a comment, and if so writes a sincere, specific one. The
 * model returns exactly SKIP for low-effort, off-topic, already-answered or stale posts, so the agent
 * only ever comments where it can genuinely help. When a product is passed it may mention it in one
 * honest sentence, but ONLY if it truly fits the poster's problem; otherwise it just helps. The body
 * still runs through the no-slop validator (which rejects parroting the post) and regenerates on fail.
 */
export async function generateComment(
  ctx: AgentContext,
  thread: RedditThread,
  opts: { relevance: string; product: { name: string; topic: string; angle: string } | null; mayMention: boolean },
): Promise<{ skip: boolean; body: string }> {
  let failures: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const prompt = buildCommentPrompt(thread, opts, failures);
    const raw = await generate(ctx, prompt, { maxTokens: 360, purpose: "comment" });
    const body = cleanOutput(raw);
    if (isSkip(body)) return { skip: true, body: "" };
    const result = validateComment(body, {
      postText: `${thread.title} ${thread.body}`,
      minWords: COMMENT_BOUNDS.minWords,
      maxWords: COMMENT_BOUNDS.maxWords,
    });
    if (result.ok) return { skip: false, body };
    failures = result.reasons;
    log(`comment attempt ${attempt}/${MAX_ATTEMPTS} in r/${thread.subreddit} rejected: ${failures.join("; ")}`);
  }
  throw new Error(`Could not write a clean comment for r/${thread.subreddit} after ${MAX_ATTEMPTS} tries: ${failures.join("; ")}`);
}

/** True when the model chose to skip: its first non-empty line is exactly "skip". */
function isSkip(body: string): boolean {
  const firstLine = body.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return firstLine.toLowerCase().replace(/[.!]$/, "") === "skip";
}

function buildCommentPrompt(
  thread: RedditThread,
  opts: { relevance: string; product: { name: string; topic: string; angle: string } | null; mayMention: boolean },
  failures: string[],
): string {
  const retry = failures.length ? `\nThe previous attempt was rejected for: ${failures.join("; ")}. Fix all of these.\n` : "";
  const age = typeof thread.ageDays === "number" ? ` This post is about ${Math.round(thread.ageDays)} day(s) old.` : "";
  const promo =
    opts.product && opts.mayMention
      ? [
          `This post relates to ${opts.product.topic}. If ${opts.product.name} genuinely fits their exact problem, you MAY mention it in one honest, plain sentence as an option, with no link and no overselling. If it does not clearly fit, do not mention it and just help.`,
        ]
      : ["Give pure help. Do NOT mention any product or tool of your own, and include no link."];
  return [
    `You are a real person replying in r/${thread.subreddit}.${age}`,
    `Thread title: ${thread.title}`,
    thread.body ? `Thread body: ${thread.body}` : "",
    "",
    `You are someone who builds and runs websites and software. You reply only where your real experience genuinely helps. Your world: ${opts.relevance}.`,
    "Reply only if this is a real question or discussion where a builder's specific, useful answer adds value.",
    "Reply with exactly SKIP (nothing else) if it is a consumer support gripe, a billing or subscription complaint, a 'look what the AI generated' or screenshot post, a rant, a meme, a job or personal-life post, off your world, already well answered, or too old to matter.",
    "Write it like a real person typing a quick reply. Hard rules:",
    `- Short, ${COMMENT_BOUNDS.minWords} to ${COMMENT_BOUNDS.maxWords} words. No preamble and no sign-off.`,
    "- Address their specific detail. Never generic advice that would fit any post.",
    "- Do not quote or paste chunks of their post back at them.",
    "- No colons or semicolons anywhere in the comment. No em or en dashes. Straight quotes only.",
    "- No three-item lists (no 'X, Y, and Z' triads). No 'not just X but Y'. No hype or corporate words.",
    "- Write flowing sentences that vary in length. Do NOT stack short choppy sentences, especially at the start; that reads like AI. Every sentence at least 6 words.",
    "- Use contractions. Be specific and a little blunt.",
    ...promo.map((l) => `- ${l}`),
    "- Output ONLY the comment text, or exactly SKIP.",
    retry,
  ]
    .filter(Boolean)
    .join("\n");
}
