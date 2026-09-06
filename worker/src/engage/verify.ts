import type { AgentContext } from "../config.ts";
import { generate, models } from "../ai.ts";
import { NO_FACTS } from "./draft.ts";

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

export function buildVerifyPrompt(comment: string, facts: string): string {
  return [
    "Below is a closed list of true facts about a person, then a comment written in their name.",
    "",
    "FACTS",
    facts.trim() || NO_FACTS,
    "",
    "COMMENT",
    comment,
    "",
    "Compare only the sentences where the person speaks about THEMSELVES.",
    "",
    "CLEAN when either is true:",
    "- the comment makes no first person claim at all: a question, an opinion, a remark about the",
    "  post's subject. There is nothing to check, so it is clean. This is common and it is fine.",
    "- every first person claim restates something in the list. Different words are fine. Saying it",
    "  more briefly is fine. It does not have to match the wording.",
    "",
    "INVENTED only when a first person claim ADDS something the list does not contain:",
    "- a number, a date, a duration, a count or a price that is not in the list",
    "- a named customer, tool, company or product that is not in the list",
    "- an outcome or a result the list does not state",
    "- an action taken that the list does not describe, such as capping, limiting or switching to",
    "  something, when the list only gives a fact around it",
    "",
    "Do not refuse a faithful restatement because it is worded differently. Do not refuse a comment",
    "for saying nothing about the person. Refuse it when it says something extra.",
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

export async function inventsNothing(
  ctx: AgentContext,
  comment: string,
  facts: string
): Promise<boolean> {
  try {
    const m = await models();
    const raw = await generate(ctx, buildVerifyPrompt(comment, facts), {
      maxTokens: 8,
      purpose: "comment-verify",
      model: m.fast,
    });
    return readVerdict(raw);
  } catch {
    return false;
  }
}
