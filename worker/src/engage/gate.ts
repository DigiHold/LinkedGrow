/**
 * What may actually be posted, checked after the model and before LinkedIn.
 *
 * Every rule below is also written in the prompt, and the model broke them anyway on roughly one
 * draft in three across four rounds of review with Nicolas on 2026-09-06: it used the banned word
 * "part", it wrote "it's not the address, it's whether the message feels aimed at them", and it
 * invented two incidents that never happened ("one bad batch cost us weeks", "agent number ten").
 * A rule that lives only in the prompt is a suggestion. This file is the enforcement.
 *
 * The rejection is cheap. A refused draft costs one more model call, or the post is skipped, and
 * skipping is the normal outcome anyway. A bad comment costs the account: LinkedIn announced on
 * 2026-05-20 that generic AI comments are suppressed rather than removed, which means a bad one is
 * invisible and unmeasurable, and the risk is taken for nothing.
 */

/**
 * Words that mark a text as machine written, plus the ones Nicolas has vetoed by hand.
 *
 * "part" and "hit" are his, not the industry's. "hit" and its family are banned in all of his
 * prose, and the model reached for it in the first sentence it wrote.
 */
const BANNED_WORDS = [
  "leverage", "utilize", "delve", "seamless", "seamlessly", "robust", "crucial", "pivotal",
  "landscape", "ecosystem", "showcase", "foster", "empower", "unlock", "streamline", "holistic",
  "testament", "underscore", "transformative", "resonate", "resonates", "journey", "insights",
  "additionally", "furthermore", "moreover", "consequently", "notably", "meticulous",
  "comprehensive", "innovative", "groundbreaking", "elevate", "harness", "cultivate",
  "part", "parts", "hit", "hits",
];

const BANNED_PHRASES = [
  "here's the thing", "the thing nobody", "what most people miss", "what nobody tells you",
  "game changer", "let's be honest", "hot take", "my take", "food for thought",
  "couldn't agree more", "spot on", "well said", "so true", "this is gold", "love this",
];

/**
 * The product names never appear.
 *
 * Nicolas, 2026-09-06: the comment is a shop window and the selling happens in DM. A comment that
 * names the product reads as somebody pushing their tool under every post, which is the thing the
 * whole feature exists to avoid looking like.
 */
const PRODUCTS = /\b(linkedgrow|amabrik|oceanwp)\b/i;

/**
 * "It's not X, it's Y" and the rest of the binary contrast family.
 *
 * Both spellings, because the draft that got through on 2026-09-06 used the contracted one: "The
 * block isn't about the sender address, it's about whether the message feels aimed at them". A
 * regex written for "is not" reads that as clean.
 */
const BINARY =
  /(?:\b(?:it|that|this)\s*(?:'|\u2019)?s?\s+(?:is\s+)?n(?:'|\u2019)?o?t\b|\b\w+\s+(?:is|are|was)n(?:'|\u2019)?t\b)[^.!?]{2,70}?,\s*(?:it|that|this)\s*(?:'|\u2019)?s\b/i;

/**
 * The same figure with the halves swapped: "Timing isn't the real issue, broken targeting is".
 *
 * The first regex looks for "it's" on the right hand side and this shape does not have one, so a
 * draft using it went through the gate untouched on 2026-09-06. Same tell, same ban.
 */
const BINARY_INVERTED =
  /\b\w+\s+(?:is|are|was)n(?:'|\u2019)?t\s+[^.!?]{2,70}?,\s*[^.!?]{2,60}?\b(?:is|are|was)\b/i;

/**
 * Numbers Nicolas has authorised, as digits and as the words the model reaches for instead.
 *
 * Anything else is a fabrication, and this check is the only one that catches it. The model does
 * not invent a wrong fact, it invents a plausible one, so no reader and no reviewer would notice.
 */
const ALLOWED_DIGITS = new Set(["2016", "2019", "500", "000", "500000", "15", "16", "91", "24", "200"]);
const COUNTED_CLAIM = /\b(three|four|five|six|seven|eight|nine|ten|dozens?|hundreds?|thousands?)\b/i;

/** Emoji ranges wide enough to catch the ones a person actually types. */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;

export interface GateInput {
  /** The post being answered, so a lifted phrase can be caught. */
  post: string;
  /** The opening words of recent comments, so two of them never start alike. */
  recentOpenings?: readonly string[];
  /** How many emojis this draft was told to use, drawn in code rather than by the model. */
  emojiAllowed?: number;
}

export interface GateResult {
  ok: boolean;
  fails: string[];
}

function words(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/).filter(Boolean);
}

function ngrams(list: string[], n: number): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + n <= list.length; i += 1) out.add(list.slice(i, i + n).join(" "));
  return out;
}

/**
 * A run of words taken straight out of the post.
 *
 * Five is the shortest run that two people writing about one subject do not produce by accident,
 * and it catches the paraphrase that keeps the post's own nouns in their original order. Nicolas's
 * first rule for this feature: never reprise a piece of the post to prove it was read.
 */
function liftedFrom(comment: string, post: string): string | null {
  const mine = ngrams(words(comment), 5);
  const theirs = ngrams(words(post), 5);
  for (const g of mine) if (theirs.has(g)) return g;
  return null;
}

export function gate(comment: string, input: GateInput): GateResult {
  const fails: string[] = [];
  const text = comment.trim();
  if (!text) return { ok: false, fails: ["empty"] };

  const w = text.split(/\s+/);

  /**
   * Length, which took four rounds to settle.
   *
   * Nicolas rejected a 30 word comment, then a 22 word one, and kept ones between 12 and 20. The
   * reason he gave is the one that matters: nobody types four sentences under somebody else's
   * post, so length is not a style preference here, it is the tell.
   */
  if (w.length < 6) fails.push(`too short: ${w.length} words`);
  if (w.length > 24) fails.push(`too long: ${w.length} words`);

  /** No line break, ever. Nicolas, 2026-09-06: no LinkedIn comment has one. */
  if (/[\r\n]/.test(text)) fails.push("line break");

  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2) fails.push(`${sentences.length} sentences, max is 2`);

  /** Normal capitalisation. The model drifted into lowercase openings to sound casual. */
  if (!/^[A-Z]/.test(text)) fails.push("does not start with a capital");

  if (PRODUCTS.test(text)) fails.push("names the product");
  if (BINARY.test(text) || BINARY_INVERTED.test(text)) fails.push("not X it's Y");
  if (/https?:\/\/|#\w/.test(text)) fails.push("link or hashtag");
  if (/[“”‘’]/.test(text)) fails.push("curly quotes");
  if (/[—–]|\s--\s/.test(text)) fails.push("em or en dash");

  const hyphenated = text.match(/\b[a-zA-Z]+-[a-zA-Z]+\b/g);
  if (hyphenated) fails.push(`hyphen compound: ${hyphenated.join(", ")}`);

  const emojis = text.match(EMOJI) ?? [];
  const allowed = input.emojiAllowed ?? 0;
  if (emojis.length > allowed) fails.push(`${emojis.length} emojis, ${allowed} allowed`);

  const lower = ` ${text.toLowerCase()} `;
  for (const p of BANNED_PHRASES) if (lower.includes(p)) fails.push(`banned phrase: ${p}`);
  const wordSet = new Set(words(text));
  for (const b of BANNED_WORDS) if (wordSet.has(b)) fails.push(`banned word: ${b}`);

  for (const s of sentences) {
    const n = s.trim().split(/\s+/).filter(Boolean).length;
    if (n > 0 && n < 6) fails.push(`sentence under 6 words: "${s.trim()}"`);
  }

  const opener = w.slice(0, 2).join(" ").toLowerCase().replace(/[^a-z\s]/g, "");
  if (/^(this|that|great|exactly|absolutely|honestly|totally|not)\b/.test(opener)) {
    fails.push(`weak opener: ${opener}`);
  }

  const lifted = liftedFrom(text, input.post);
  if (lifted) fails.push(`lifted from the post: "${lifted}"`);

  for (const digits of text.match(/\d[\d,.]*/g) ?? []) {
    const clean = digits.replace(/[,.]/g, "");
    if (!ALLOWED_DIGITS.has(clean)) fails.push(`number not on the fact sheet: ${digits}`);
  }
  const counted = text.match(COUNTED_CLAIM);
  if (counted) fails.push(`counted claim not on the fact sheet: ${counted[0]}`);

  const myOpening = words(text).slice(0, 4).join(" ");
  for (const prev of input.recentOpenings ?? []) {
    if (myOpening && words(prev).slice(0, 4).join(" ") === myOpening) {
      fails.push(`opening repeats a recent comment: ${myOpening}`);
    }
  }

  return { ok: fails.length === 0, fails };
}
