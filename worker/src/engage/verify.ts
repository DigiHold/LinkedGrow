import type { AgentContext } from "../config.ts";
import { generate, models } from "../ai.ts";
import { FACTS } from "./draft.ts";

/**
 * The check no regular expression can perform: is anything in this comment made up.
 *
 * gate.ts refuses forbidden words, forbidden shapes and numbers that are not on the fact sheet, and
 * it caught every one of those. What it cannot see is a claim that is perfectly worded, carries no
 * number, and never happened. On 2026-09-06 the same invented anecdote came back twice across two
 * separate runs, "one bad batch cost us weeks" and then "one bad batch taught me that early", and
 * both sailed through the gate because there is nothing in them to match.
 *
 * So a second model reads the comment against the closed list of facts and answers one word. It
 * runs on the fast model, because this is a classification and the volume is one call per surviving
 * draft, which is a few cents a month.
 *
 * It fails CLOSED. A call that errors, times out or answers something unexpected rejects the
 * comment. Publishing a fabricated story under somebody else's post in Nicolas's name is worse than
 * publishing nothing, and there is always another post.
 */

export function buildVerifyPrompt(comment: string): string {
  return [
    "Below is a closed list of true facts about a person, then a comment written in their name.",
    "",
    "FACTS",
    FACTS,
    "",
    "COMMENT",
    comment,
    "",
    "Does the comment state, imply or hint at any experience, event, result, quantity or outcome",
    "that is NOT in the list above? Opinions, questions and general statements about the world are",
    "fine and are not claims about the person. Only what the person says they did, saw, built,",
    "measured or lived through has to appear in the list.",
    "",
    "Answer with exactly one word:",
    "CLEAN - every personal claim is in the list, or the comment makes no personal claim at all.",
    "INVENTED - at least one personal claim is not in the list.",
    "When you are unsure, answer INVENTED.",
  ].join("\n");
}

/**
 * True when the comment invents nothing. Anything unexpected is treated as an invention.
 *
 * The whole answer has to be the word, not start with it. A first version used a word boundary and
 * accepted "CLEAN-ISH", which is the exact shape of a model hedging, and hedging is not permission.
 */
export function readVerdict(raw: string): boolean {
  const answer = raw
    .replace(/```\w*/g, "")
    .replace(/[`*_]/g, "")
    .trim();
  return /^clean[.!]?$/i.test(answer);
}

export async function inventsNothing(ctx: AgentContext, comment: string): Promise<boolean> {
  try {
    const m = await models();
    const raw = await generate(ctx, buildVerifyPrompt(comment), {
      maxTokens: 8,
      purpose: "comment-verify",
      model: m.fast,
    });
    return readVerdict(raw);
  } catch {
    return false;
  }
}
