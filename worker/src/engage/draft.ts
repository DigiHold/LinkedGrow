import type { AgentContext } from "../config.ts";
import { generate, models } from "../ai.ts";
import { gate, type GateResult } from "./gate.ts";

/**
 * Writing one comment, and deciding not to write most of them.
 *
 * The refusal is the important half. LinkedIn announced on 2026-05-20 that it suppresses generic
 * AI comments rather than removing them, so a weak comment is invisible, unmeasurable, and costs
 * the account's budget for nothing. Skipping costs nothing at all. A skip rate near half is the
 * healthy state of this module, not a fault in it.
 */

/**
 * The only facts about Nicolas that may appear in a comment, authorised by him on 2026-09-06.
 *
 * The model does not invent a wrong fact, it invents a plausible one, which is why this list is
 * closed rather than indicative. On the first run it wrote "one bad batch cost us weeks" and
 * "agent number ten", both of which read perfectly and neither of which happened.
 */
/**
 * The fact sheet is DATA, not code, and it deliberately does not live in this file.
 *
 * It holds one person's biography: what they built, what it earned, what went wrong, the names of
 * the people around them. Two reasons that cannot sit in the repository. This one is published as
 * the open source product, so a hardcoded sheet is somebody's private history in a public git
 * history, where it does not come back out. And every self hosted instance would then run an agent
 * claiming to have built the same theme in 2016.
 *
 * So it is stored per agent and passed in. An agent with no sheet writes no personal claim at all,
 * which is the safe default rather than an error: opinions and questions still work without one.
 */
export const NO_FACTS = [
  "You have no verified facts on file.",
  "Say nothing about what you have built, measured, earned or lived through.",
  "You may still hold an opinion and ask a real question.",
].join("\n");

export function buildSystem(facts: string): string {
  return `
You are writing a LinkedIn comment as Nicolas Lecocq, under somebody else's post.

${facts.trim() || NO_FACTS}

## Decide whether to comment at all

Most posts do not deserve one. Skipping is the normal answer.

SKIP when any of these is true:
- You have nothing first hand to add. Agreement on its own is not a comment.
- The post is engagement bait: it asks for a keyword in the comments, or a DM, or it promises a
  video, a template or a file in exchange.
- The subject sits outside what you have actually done. You build products and you run agents.
- The post is about politics, regulation, a lawsuit or somebody's drama.
- Your comment would work just as well under a different post, which means you are answering the
  topic rather than this post.

When you skip, give the reason in one short line and write no comment.

## If you comment

Somebody who reads it should want to know who wrote it, click your name and land on your profile.
That is the entire goal.

- NEVER name LinkedGrow, Amabrik or OceanWP. Never pitch anything. Never mention a product at all.
- NEVER restate, quote or summarise the post. Not one clause. If it reads like proof that you read
  the post, delete it and start again.
- NEVER open with praise, and never open with This, Great, Love this, So true, Exactly, Spot on,
  Well said, 100%, Not.
- Bring one concrete thing: something you decided, something that broke, or a question only somebody
  who has done this would ask.
- You do not have to agree. Say so plainly when you don't, and give the reason. Never be rude,
  never be sarcastic, never mock the author or a company.
- No links, no hashtags, no tagging anybody.

## Length, which is the rule everyone breaks

You are typing with one thumb, in about eight seconds, while doing something else.

ONE sentence. Two only when the second is genuinely short. Under 20 words in total. It is one
unbroken block: no line break, ever, because nobody presses enter inside a LinkedIn comment.

The length you are given is a ceiling, not a target. Coming in well under it is good. Going over it
fails, however good the content is.

## Writing rules, all blocking

- START THE COMMENT WITH A CAPITAL LETTER. This is checked and a lowercase opening is thrown away,
  however good the comment is. Normal capitalisation throughout.
- Use contractions: don't, doesn't, can't, isn't.
- No em dashes, no en dashes, no hyphenated compounds. Write "cold calling", "real time".
- Commas and periods go outside closing quotes.
- No sentence under 6 words. No fragments.
- Never "it's not X, it's Y" in any spelling. Never three adjectives in a row.
- Never a colon used for drama. No "My take:", no "The result?".
- Never these words: leverage, utilize, delve, seamless, robust, crucial, pivotal, landscape,
  ecosystem, showcase, foster, empower, unlock, streamline, holistic, testament, transformative,
  resonate, journey, insights.
- Never the word "part", in any construction. Never the word "hit" as a verb.
- No aphorism at the end, no summary of your own comment.

## Output

Return only JSON and nothing else:
{"decision":"comment"|"skip","reason":"one short line","comment":"the comment, or empty when skipping"}
`.trim();
}

export interface Shape {
  shape: string;
  words: number;
  emoji: string | null;
}

/**
 * The length and the emoji are drawn here, never asked for in the prompt as a range.
 *
 * A model told "between 25 and 60 words" lands near the middle of that range on nearly every call,
 * and a hundred comments all sitting between 38 and 45 words is a signature a classifier reads at a
 * glance. The draw below is deliberately lumpy, and the prompt never learns the floor or ceiling.
 *
 * The emoji rate is the same problem. Left to the model it either never uses one or uses one every
 * time. Roughly one comment in six is what a person does.
 */
export function drawShape(rand: () => number = Math.random): Shape {
  const shapes = [
    { name: "disagree in one line, then the reason", weight: 18 },
    { name: "the one thing that broke when you tried this", weight: 20 },
    { name: "a question you would actually ask, nothing else", weight: 14 },
    { name: "where this stops working", weight: 16 },
    { name: "the detail the post left out", weight: 12 },
    { name: "what you do instead, in one sentence", weight: 20 },
  ];
  const total = shapes.reduce((s, x) => s + x.weight, 0);
  let pick = rand() * total;
  let chosen = shapes[shapes.length - 1]!;
  for (const s of shapes) {
    pick -= s.weight;
    if (pick <= 0) {
      chosen = s;
      break;
    }
  }

  const r = rand();
  let words: number;
  if (r < 0.38) words = 6 + Math.floor(rand() * 6);
  else if (r < 0.84) words = 12 + Math.floor(rand() * 7);
  else words = 19 + Math.floor(rand() * 5);

  /** Reactions a person types, never a marketing emoji. */
  const FACES = ["\u{1F642}", "\u{1F605}", "\u{1F440}", "\u{1F602}", "\u{1F62C}"];
  const emoji = rand() < 0.17 ? FACES[Math.floor(rand() * FACES.length)]! : null;

  return { shape: chosen.name, words, emoji };
}

export interface PostToAnswer {
  author: string;
  /** The author's profile address, which is the key analytics group by rather than their name. */
  authorUrl?: string;
  headline: string;
  text: string;
}

export interface Lesson {
  written: string;
  rewritten: string;
}

/**
 * What a person did with the last comments, put in front of the model before it writes the next.
 *
 * A rewrite is worth far more than an approval. Approval says the comment was acceptable; a rewrite
 * says what was wrong and what right looks like, in the same voice, on the same kind of post. This
 * is the only correction this feature gets, and it is why the approval step can eventually go.
 */
function lessonsBlock(lessons: readonly Lesson[]): string[] {
  if (lessons.length === 0) return [];
  const approved = lessons.filter((l) => !l.rewritten).slice(0, 6);
  const rewritten = lessons.filter((l) => l.rewritten).slice(0, 6);
  const out: string[] = [""];

  if (rewritten.length) {
    out.push("Comments of yours that were REWRITTEN before going up. Study these hardest: the second");
    out.push("line is what should have been written, in your own voice.");
    for (const l of rewritten) {
      out.push(`- you wrote: "${l.written}"`);
      out.push(`  it went up as: "${l.rewritten}"`);
    }
    out.push("");
  }
  if (approved.length) {
    out.push("Comments of yours that went up exactly as written. This is the target:");
    for (const l of approved) out.push(`- "${l.written}"`);
    out.push("");
  }
  return out;
}

export function buildPrompt(
  post: PostToAnswer,
  shape: Shape,
  recentOpenings: readonly string[],
  lessons: readonly Lesson[] = []
): string {
  return [
    `Post by ${post.author}${post.headline ? ` (${post.headline})` : ""}.`,
    "",
    "---",
    post.text.slice(0, 4000),
    "---",
    "",
    `Shape for this comment: ${shape.shape}`,
    `Ceiling: about ${shape.words} words.`,
    `Emoji: ${shape.emoji ? `${shape.emoji}, used once, where a person would put it` : "none, do not use any"}`,
    "",
    ...lessonsBlock(lessons),
    "Openings you have used recently. Yours must not resemble any of them:",
    recentOpenings.length ? recentOpenings.map((o) => `- "${o}"`).join("\n") : "- (none yet)",
  ].join("\n");
}

export interface Draft {
  decision: "comment" | "skip";
  reason: string;
  comment: string;
}

/**
 * Reads the model's answer, and treats anything it cannot read as a skip.
 *
 * A parse failure must never become a comment. The models fence their JSON about a third of the
 * time, and on Anthropic the answer arrives after a thinking block, so the text is taken from the
 * response rather than from its first element.
 */
export function parseDraft(raw: string): Draft {
  const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    const value = JSON.parse(cleaned) as Partial<Draft>;
    const decision = value.decision === "comment" ? "comment" : "skip";
    const comment = typeof value.comment === "string" ? value.comment.trim() : "";
    return {
      decision: decision === "comment" && comment ? "comment" : "skip",
      reason: typeof value.reason === "string" ? value.reason : "",
      comment: decision === "comment" ? comment : "",
    };
  } catch {
    return { decision: "skip", reason: "the model's answer could not be read", comment: "" };
  }
}

export interface DraftOutcome {
  posted: string | null;
  reason: string;
  attempts: number;
  rejections: string[][];
}

/**
 * One post in, one comment or nothing out.
 *
 * Two attempts at most. A third would be the model arguing with the gate rather than writing
 * something better, and there is always another post.
 */
export async function draftComment(
  ctx: AgentContext,
  post: PostToAnswer,
  opts: {
    facts: string;
    recentOpenings?: readonly string[];
    lessons?: readonly { written: string; rewritten: string }[];
    rand?: () => number;
  }
): Promise<DraftOutcome> {
  const recentOpenings = opts.recentOpenings ?? [];
  const rejections: string[][] = [];
  const m = await models();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const shape = drawShape(opts.rand);
    /**
     * 1500 rather than the 400 this started with.
     *
     * On the first live run the call came back as "anthropic returned an empty answer": the model
     * reasons before it writes, the reasoning spent the whole budget, and the response was cut off
     * before a single text block existed. The comment itself is twenty words, so the ceiling is not
     * about the answer, it is about what happens before it. Output is billed on what is produced,
     * so a high ceiling that is never reached costs nothing.
     */
    let raw: string;
    try {
      raw = await generate(ctx, buildPrompt(post, shape, recentOpenings, opts.lessons ?? []), {
        systemPrompt: buildSystem(opts.facts),
        maxTokens: 1500,
        purpose: "comment",
        model: m.writer,
      });
    } catch (error) {
      /**
       * A failed call is a skipped post, never a crash. There is always another post, and a tool
       * that dies here leaves a browser open on somebody's account.
       */
      rejections.push([`model call failed: ${error instanceof Error ? error.message : String(error)}`]);
      continue;
    }
    const draft = parseDraft(raw);
    if (draft.decision === "skip") {
      return { posted: null, reason: draft.reason || "nothing to add", attempts: attempt, rejections };
    }

    const verdict: GateResult = gate(draft.comment, {
      post: post.text,
      recentOpenings,
      emojiAllowed: shape.emoji ? 1 : 0,
    });
    if (verdict.ok) {
      return { posted: draft.comment, reason: draft.reason, attempts: attempt, rejections };
    }
    rejections.push(verdict.fails);
  }

  return { posted: null, reason: "every draft was refused by the gate", attempts: 2, rejections };
}
