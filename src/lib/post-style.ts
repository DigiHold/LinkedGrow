/**
 * What a LinkedGrow post is allowed to look like.
 *
 * On 2026-07-30 LinkedIn shipped a "seems like AI slop" report button, said the
 * reports will train its classifiers, and started using those classifiers to
 * cut how far flagged content travels outside the author's own network. It also
 * retired its own AI writing feature and replaced it with a proofreader. The
 * direction is not ambiguous.
 *
 * Until now this product asked the model for exactly the shape people are about
 * to report: emoji bullets, Unicode bold headers, arrow lists, and a closing
 * "Save this for later". Two prompts said so in as many words. That is the
 * canonical machine-written LinkedIn post, and it is the opposite of what
 * Nicolas will publish under his own name.
 *
 * Two layers here, and both are needed. `POST_STYLE_RULES` is what the model is
 * told, which it will mostly follow. `stripSlop` is what happens to the output
 * whether it followed or not, because a prompt is a request and a customer's
 * post going out with a ♻️ on it is a real cost to their reach.
 */

/**
 * The block every post-writing prompt includes, verbatim.
 *
 * One copy. The generate prompt and the edit prompt had drifted apart already,
 * one banning three emoji and the other five, which is how a rule quietly stops
 * applying to half the product.
 */
export const POST_STYLE_RULES = `=== HOW IT HAS TO READ ===

LinkedIn now lets readers report a post as "AI slop" and uses those reports to
train classifiers that cut how far a post travels. Write something a person
would not think to report.

NEVER, these are the markers people recognise instantly:
- No emoji. Not as bullets, not as decoration, not in the closing line. None.
- No Unicode bold or italic letters (the 𝗕𝗼𝗹𝗱 𝗹𝗼𝗼𝗸). It marks a post as
  machine-made and screen readers cannot read it at all.
- No arrow bullets, no check-mark bullets, no bullet symbols of any kind.
- No horizontal separators made of dashes, equals signs or underscores.
- No em dashes or en dashes. Use a comma, a full stop, or a hyphen with spaces.
- No engagement bait: no "Save this for later", no "Repost if this helped", no
  "Follow for more", no "Comment YES below", no "Agree?", no "Thoughts?".
- No hashtags.
- No markdown. LinkedIn renders none of it.

NEVER, these are the sentence habits that read as machine-written:
- No one-line-per-sentence staccato. Write paragraphs of two to four sentences.
- No sentence under six words. After a short sentence, the next one runs long.
- No "Here's the thing", "Here's what nobody tells you", "Here's why", "The
  truth is", "Let that sink in", "Read that again", "Plot twist".
- No "It's not X. It's Y." and no "not only X but also Y".
- No three-item lists used for rhythm. Two or four is fine, three sounds staged.
- No opening that announces the point instead of making it.

NEVER these words, they are the ones that give it away:
leverage, utilize, delve, seamless, robust, holistic, synergy, ecosystem,
tapestry, landscape (figurative), pivotal, crucial, testament, underscore,
showcase, foster, garner, bolster, elevate, streamline, harness, facilitate,
comprehensive, groundbreaking, game-changer, unlock, supercharge, transform,
empower, journey (figurative), dive deep, at the end of the day.

DO:
- Open with the thing itself: a fact, a number, a name, something that happened.
- Use plain words. Short common words beat impressive ones every time.
- Be specific. One real detail is worth five general claims.
- Vary sentence length the way speech does.
- Contractions are fine and usually better.
- Say one thing well rather than four things thinly.
- End when the point is made. A post is allowed to just stop.`;

/**
 * The two-line opening, which is its own problem.
 *
 * The hook is the only part of a post most people see, and the shape this
 * product used to ask for ("I did X. / Here's the Y that changed everything.")
 * is the single most parodied thing on LinkedIn. Kept separate because only the
 * prompts that write hooks need it.
 */
export const HOOK_RULES = `=== THE OPENING ===

The first two lines are all most people see, so they carry the post. They are
also where a reader decides whether this was written by a person.

- Line 1 is a statement, under 100 characters, and it says something real. A
  number, a name, a thing that happened, a claim somebody could disagree with.
- Line 2 follows immediately with no blank line between them, and gives the
  reader a reason to open the rest without promising a revelation.
- Never the "I did X for N days. Here's what I learned." formula.
- Never "Here's the strategy that actually worked", "changed everything",
  "nobody talks about this", "this will blow your mind", "the results shocked me".
- Never a question whose only purpose is to be answered by clicking.
- No emoji anywhere in either line.`;

/* ── the guarantee, applied to whatever the model actually returned ────────── */

/**
 * Unicode bold and italic letters, mapped back to the letters they imitate.
 *
 * The Mathematical Alphanumeric Symbols block is what "𝗕𝗼𝗹𝗱 𝘁𝗲𝘅𝘁 𝗼𝗻 𝗟𝗶𝗻𝗸𝗲𝗱𝗜𝗻"
 * is made of. It is not formatting, it is a different set of characters that
 * happen to look like letters, which is why search does not find them and
 * screen readers read them out as gibberish or skip them entirely.
 */
const FANCY_RANGES: Array<{ start: number; end: number; base: string }> = [
  { start: 0x1d400, end: 0x1d419, base: "A" }, // bold
  { start: 0x1d41a, end: 0x1d433, base: "a" },
  { start: 0x1d468, end: 0x1d481, base: "A" }, // bold italic
  { start: 0x1d482, end: 0x1d49b, base: "a" },
  { start: 0x1d5d4, end: 0x1d5ed, base: "A" }, // sans-serif bold
  { start: 0x1d5ee, end: 0x1d607, base: "a" },
  { start: 0x1d63c, end: 0x1d655, base: "A" }, // sans-serif bold italic
  { start: 0x1d656, end: 0x1d66f, base: "a" },
  { start: 0x1d7ce, end: 0x1d7d7, base: "0" }, // bold digits
  { start: 0x1d7ec, end: 0x1d7f5, base: "0" }, // sans-serif bold digits
];

export function unfancy(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const range = FANCY_RANGES.find((r) => code >= r.start && code <= r.end);
    out += range
      ? String.fromCharCode((range.base.codePointAt(0) as number) + (code - range.start))
      : char;
  }
  return out;
}

/** Every emoji and pictograph, including the variation selectors that follow them. */
const EMOJI =
  /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}\u{2190}-\u{21FF}\u{2B05}-\u{2B07}]/gu;

/** Closing lines whose only job is to ask for a reaction. */
const BAIT =
  /^\s*(?:save\s+this|repost\s+if|share\s+if|follow\s+(?:me\s+)?for\s+more|comment\s+["“]?\w+["”]?\s+below|drop\s+a\s+\w+\s+below|agree\?|thoughts\?|what\s+do\s+you\s+think\?|let\s+me\s+know\s+(?:in\s+the\s+comments|below))\b/i;

/**
 * Strips the markers a reader recognises, whatever the model was told.
 *
 * Deliberately conservative: it removes things that are unambiguously the
 * machine-written look and leaves the writing alone. It cannot fix a post that
 * reads badly, which is what the prompt rules are for.
 */
export function stripSlop(text: string): string {
  let out = unfancy(text);

  // Dashes first, before anything else looks at line shapes.
  out = out.replace(/—/g, " - ").replace(/–/g, " - ");

  // Separator lines.
  out = out.replace(/^\s*[-=_*]{3,}\s*$/gm, "");

  const lines = out.split("\n").map((line) => {
    // A bullet symbol at the start of a line, with or without an emoji.
    let cleaned = line.replace(/^\s*(?:[•▪▫◦‣⁃]|->|=>)\s+/u, "");
    cleaned = cleaned.replace(new RegExp(`^\\s*(?:${EMOJI.source})+\\s*`, "u"), "");
    return cleaned;
  });

  // Drop closing bait, and any blank lines it leaves behind.
  while (lines.length > 0) {
    const last = lines[lines.length - 1] ?? "";
    if (last.trim() === "" || BAIT.test(last)) {
      lines.pop();
      continue;
    }
    break;
  }

  out = lines.join("\n");
  // Emoji anywhere else in the text, now that line starts are handled.
  out = out.replace(EMOJI, "");
  // Whatever spacing the removals left behind.
  out = out.replace(/[ \t]+$/gm, "");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

/**
 * What is still wrong after stripping, for a caller that wants to say so.
 *
 * Nothing uses it to block a generation: refusing to give somebody their post
 * because a sentence is five words long would be worse than the sentence. It
 * exists so the editor can point at the line.
 */
export function slopWarnings(text: string): string[] {
  const warnings: string[] = [];
  const body = text.trim();

  const sentences = body
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const tiny = sentences.filter((s) => s.split(/\s+/).length < 6 && /[a-z]/i.test(s));
  if (tiny.length >= 3) {
    warnings.push(`${tiny.length} sentences are under six words, which reads as machine-written`);
  }

  const openers =
    /\b(here'?s (the thing|what nobody|why)|the truth is|let that sink in|read that again|plot twist)\b/i;
  if (openers.test(body)) warnings.push("it opens by announcing the point instead of making it");

  if (/\b(leverage|utilize|delve|seamless|synergy|game.?changer|supercharge)\b/i.test(body)) {
    warnings.push("it uses at least one of the words that mark a post as AI-written");
  }

  if (/\bit'?s not .{2,40}\. it'?s\b/i.test(body)) {
    warnings.push('it uses the "it is not X, it is Y" construction');
  }

  return warnings;
}
