import type { AgentContext } from "../config.ts";
import { generate, MODELS } from "../ai.ts";

/**
 * The two model calls that decide whether a person is worth contacting at all.
 *
 * This file used to carry the message writer, an Amabrik-specific angle router and a Reddit
 * commenter, all inherited from the single-tenant agent and none of them ever called here. The
 * writing lives in relationship.ts; the rest was deleted rather than left to be mistaken for
 * something the product does.
 */

/** Strips code fences and wrapping quotes a model sometimes adds around a one-word answer. */
function cleanOutput(raw: string): string {
  let t = raw.trim();
  const fence = t.match(/^```[a-z]*\n([\s\S]*?)```$/i);
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
export async function judgeIcpFit(
  ctx: AgentContext,
  headline: string,
  context: string,
  memory = ""
): Promise<boolean> {
  // Volume skips the judgement entirely: the customer asked for reach and the headline gate has
  // already run. Precision and balanced differ in what the model is told to do when it hesitates.
  if (ctx.matchLevel === "volume") return true;

  const prompt = [
    `We sell to: ${ctx.cfg.leads.icp}`,
    memory,
    ctx.companySizes.length ? `Company sizes worth having: ${ctx.companySizes.join(", ")}` : "",
    // The markets and the places the customer named. Both were collected by the
    // wizard and reached no judgement at all: industries were being matched
    // against headlines as if they were job titles, and locations were used
    // only to tell the writer where the SENDER lives.
    ctx.cfg.leads.industries?.length
      ? `Industries worth having: ${ctx.cfg.leads.industries.join(", ")}`
      : "",
    ctx.cfg.leads.locations?.length
      ? `Where the buyers should be: ${ctx.cfg.leads.locations.join(", ")}. Somebody clearly outside this is a weaker match however good their title reads.`
      : "",
    "",
    `Person's headline: ${headline}`,
    context ? `What they posted: ${context.slice(0, 500)}` : "",
    "",
    "Could this specific person plausibly decide to add a tool to their company website, or influence that decision?",
    "Answer with exactly one word, FIT or SKIP.",
    "Answer SKIP when they are junior, when their field is unrelated, or when they work at a large company",
    "or consultancy where a whole department owns the website and no individual could add a tool to it.",
    "Answer FIT mainly for small businesses, startups, agencies and independents who run their own site.",
    ctx.matchLevel === "precision"
      ? "Answer FIT only when you are confident. Anything you would have to argue for is a SKIP."
      : "When unsure, answer SKIP.",
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
