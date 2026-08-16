/**
 * No-slop gate for generated messages. A message is rejected (and must be regenerated) if any
 * check fails. Rules are self-contained so the tool is shareable without external files.
 */

import { namesSomebodyElse } from "../names.ts";

export interface ValidateContext {
  /** The sender's first name, used to strip a stray sign-off before counting. */
  senderName: string;
  /**
   * Which step is being written.
   *
   * The first message after an acceptance is two sentences typed on a phone,
   * and the later ones carry an idea. Holding both to one length and one
   * sentence floor is what produced the stiff opener Nicolas rejected on
   * 2026-07-31.
   */
  step?: "hello" | "intro" | "converse" | "ask";
  /** The prospect's headline, used to reject verbatim headline dumps. */
  headline?: string;
  /**
   * The prospect's name as LinkedIn has it, used to reject a message that
   * greets somebody else. On 2026-08-06 a DM to "Mr Happiness - Sasho
   * Jovanovski" went out addressed to Marija, because the prompt carried an
   * empty first name and the model filled the hole itself.
   */
  prospectFullName?: string;
  /** What the prospect themselves wrote, used to reject a message that recites it back to them. */
  contextText?: string;
  minWords?: number;
  maxWords?: number;
}

export interface ValidationResult {
  ok: boolean;
  reasons: string[];
}

// Distilled from the no-slop banned vocabulary. Whole-word, case-insensitive.
const BANNED_WORDS = [
  "additionally", "delve", "tapestry", "pivotal", "vibrant", "meticulous", "testament",
  "underscore", "intricate", "intricacies", "interplay", "garner", "bolster", "foster",
  "showcase", "emphasize", "enduring", "crucial", "enhance", "renowned", "groundbreaking",
  "profound", "comprehensive", "multifaceted", "leverage", "utilize", "facilitate",
  "encompasses", "spearhead", "harness", "elevate", "streamline", "robust", "seamless",
  "holistic", "synergy", "paradigm", "resonate", "supercharge", "unlock", "thrilled",
  "excited", "amazing", "incredible", "landscape", "ecosystem", "highlight",
];

const BANNED_PHRASES = [
  "marks a pivotal moment", "represents a significant shift", "not just", "not only",
  "it's not", "let's explore", "let us delve", "in today's", "at the heart of",
  "it is worth noting", "a testament to", "paving the way", "plays a crucial role",
  "in an era where", "the intersection of", "a beacon of", "game-changer", "game changer",
  "pick your brain", "circle back", "touch base", "hope this finds you", "hope you are well",
  "hope you're well",
  // Conversational-hook and false-authority tells (no-slop §33, humanizer §27, §33).
  "here's the thing", "the thing is", "let's be honest", "real talk", "at its core",
  "the real question", "cut through the noise", "cut through the hype", "dive into", "deep dive",
  // Remaining banned phrases from the no-slop list.
  "indelible mark", "deeply rooted", "rich history", "natural beauty", "nestled in",
  "boasts a", "serves as a", "stands as a", "sends a strong message", "it remains to be seen",
  "despite its",
  // The first-message tells, added 2026-07-31 after Nicolas received one that
  // read as pure AI. The template that caused it lived in a prompt, so banning
  // the output is what stops it returning through a prompt edit years from now
  // that forgets why the rule existed.
  "is why i hit connect", "why i hit connect", "made me hit connect",
  "is why i connected", "is why i wanted to connect", "why i reached out",
  // You have not met them.
  "good to meet you", "great to meet you", "nice to meet you",
  "pleasure to meet you", "lovely to meet you",
  // Compliments that would fit anybody, which is what makes them worth nothing.
  "impressed by your", "impressive profile", "impressive background", "love what you",
  "big fan of your", "your profile stood out", "caught my eye", "your work is inspiring",
  // Vague gestures the VAGUE_REFERENT pattern cannot reach, because a following "of" is exactly
  // what makes most of these phrases legitimate elsewhere. The pattern covers the rest of the
  // family, so nothing is listed twice.
  "that side of things", "on that front", "in that space", "that world",
  // The rest of the cold-DM tells, from the 2026 write-ups on messages that read as automated
  // (Kondo, Hiration, Origami) plus the phrasings Nicolas rejected in his own outbound.
  "made me press connect", "explore synergies", "potential synergies", "mutually beneficial",
  "have you in my network", "expand my network", "hope this message finds you",
  // Chat-assistant fillers and question-dodges, all shipped in live DMs on
  // 2026-08-15: "Fair enough, wanted to see...", "I'd rather not give you a
  // generic answer", "I'll spare you for now". The fillers are support-bot
  // vocabulary; the dodges read the way a scammer avoiding a question reads.
  "fair enough", "great question", "good question", "love that", "totally get it",
  "i'd rather not", "i'll spare you", "rather not give you a generic",
  // The surveillance openers, banned outright on 2026-08-15: reciting what the
  // prospect posted, commented, reacted to or how they were found. One of these
  // reads fine in isolation; a sending history of them is the fingerprint of
  // every LinkedIn automation, and Nicolas's verdict was that no human recites
  // what they watched you do. The signal picks the topic; it never gets cited.
  "saw your comment", "saw your post", "saw you comment", "saw you react",
  "noticed you react", "noticed your comment", "caught your comment",
  "your comment on", "you reacted to", "reacted to that", "popped up",
  "my feed", "turned up when", "when i searched", "i was searching",
  "showing up under", "your point about", "your take on", "your profile came up",
];

/** Banned words matched with their common inflections (foster/fostering, showcase/showcasing, seamless/seamlessly). */
function bannedWordReasons(text: string): string[] {
  const out: string[] = [];
  for (const w of BANNED_WORDS) {
    const stem = w.replace(/e$/, "");
    if (new RegExp(`\\b${stem}(s|e|es|ed|ing|ly|ely)?\\b`, "i").test(text)) out.push(`banned word: ${w}`);
  }
  return out;
}

// Generic slop openers, matched at the start of the message.
const BANNED_OPENERS = [
  "i saw your", "i came across", "i noticed you", "i love your content", "i've been following",
  "i have been following", "hope you", "hope this", "just wanted to reach out", "i want to reach out",
  // A bare thank-you for connecting is the message sales communities openly mock.
  "thanks for connecting", "thank you for connecting", "thanks for accepting",
  "thanks for the add",
];

/** A short opening or closing pleasantry, which is allowed to be brief. */
const GREETING = /^(hi|hey|hello|glad|good|great|happy|congrats|nice one)\b/i;

function isGreeting(sentence: string): boolean {
  return GREETING.test(sentence.trim()) && words(sentence).length <= 8;
}

/**
 * True when the message closes on a signature: the sender's name alone on the last line, or a
 * sign-off word followed by it. Nothing else is a sign-off, so "Glad we connected, Jonathan." with
 * the recipient's name mid-sentence stays valid.
 *
 * The earlier version here only caught a bare name, so "Cheers," and "Best, Maria" walked through.
 */
function signsOff(text: string, senderName: string): boolean {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const last = (lines[lines.length - 1] ?? "").toLowerCase().replace(/[.,!]+$/, "");
  if (!last) return false;
  const first = senderName.split(/\s+/)[0]?.toLowerCase() ?? "";
  const names = [senderName.toLowerCase(), first].filter(Boolean);
  if (names.includes(last)) return true;
  return /^(best|cheers|thanks|thank you|regards|kind regards|warmly|talk soon|speak soon)\b/.test(last)
    && (names.some((n) => last.includes(n)) || words(last).length <= 4);
}

/**
 * A vague noun phrase standing in for the thing itself.
 *
 * "the annoying part", "the tricky bit", "that whole side of it". A person names what they mean; a
 * model gestures at it and sounds knowing while saying nothing. The banned-phrase list caught the
 * bare demonstratives and missed every adjective variant, which is how "that question from the
 * client is the annoying part" shipped in a live run. A pattern covers the family instead.
 *
 * The noun has to be doing the standing-in, so only the empty head nouns count.
 *
 * The "of" carve-out is narrow on purpose. "the best part of the job" names something and passes,
 * while "that whole side of things" names nothing and does not, so a complement only rescues the
 * phrase when it is a real noun rather than another empty one.
 */
const VAGUE_REFERENT =
  /\b(?:the|that|this)\s+(?:\w+\s+)?(?:part|bit|piece|side|aspect|thing|stage)\b(?:\s+of\s+(?:it|this|that|these|those|things|stuff)\b|(?!\s+(?:of|about|where|which|you|i|we|they|he|she|it)\b))/i;

function words(text: string): string[] {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
}

/** True if any 6-word window of what they wrote appears verbatim in our message. */
function echoesPost(message: string, theirText: string): boolean {
  const p = words(theirText.toLowerCase());
  if (p.length < 6) return false;
  const hay = message.toLowerCase();
  for (let i = 0; i + 6 <= p.length; i++) {
    if (hay.includes(p.slice(i, i + 6).join(" "))) return true;
  }
  return false;
}

/** Removes the sign-off block (best/cheers/thanks/name) when it sits in the tail of the message. */
function stripSignoff(text: string, senderName: string): string {
  const markers = [senderName, "best,", "best regards", "cheers", "thanks,", "thank you", "regards", "warmly", "talk soon"];
  const lower = text.toLowerCase();
  let cut = text.length;
  for (const m of markers) {
    const idx = lower.indexOf(m.toLowerCase());
    if (idx >= 0 && idx >= text.length * 0.5) cut = Math.min(cut, idx);
  }
  return text.slice(0, cut);
}

/** Sentences excluding the greeting line and everything from the sign-off onward. */
function bodySentences(text: string, senderName: string): string[] {
  const body = stripSignoff(text, senderName);
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const isGreeting = (l: string) => /^(hey|hi|hello|bonjour|salut)\b.{0,40}$/i.test(l);
  const kept = lines.filter((l, i) => !(i === 0 && isGreeting(l)));
  return kept
    .join(" ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True if any 6-word window of the headline appears verbatim in the message. */
function dumpsHeadline(text: string, headline: string): boolean {
  const h = words(headline.toLowerCase());
  if (h.length < 6) return false;
  const hay = text.toLowerCase();
  for (let i = 0; i + 6 <= h.length; i++) {
    if (hay.includes(h.slice(i, i + 6).join(" "))) return true;
  }
  return false;
}

export function validateMessage(text: string, ctx: ValidateContext): ValidationResult {
  const reasons: string[] = [];
  // A hello is deliberately short. Anything longer than three sentences after
  // an acceptance is a pitch wearing a greeting.
  const isHello = ctx.step === "hello";
  const minWords = ctx.minWords ?? (isHello ? 14 : 25);
  const maxWords = ctx.maxWords ?? 100;
  const lower = text.toLowerCase();

  if (/\[|\]|\{|\}|firstname|first_name|company_name|\{\{|\}\}/i.test(text)) {
    reasons.push("unresolved template token");
  }
  if (/[—–]/.test(text)) {
    reasons.push("em dash or en dash");
  }
  // A colon or semicolon inside a message is a formal/AI tell; a human DM never uses them.
  if (/[:;]/.test(text)) reasons.push("colon or semicolon (not human)");
  if (/[“”‘’]/.test(text)) reasons.push("curly quotes");
  reasons.push(...bannedWordReasons(text));
  for (const p of BANNED_PHRASES) {
    if (lower.includes(p)) reasons.push(`banned phrase: ${p}`);
  }
  const head = lower.replace(/^[^a-z]*/, "").slice(0, 40);
  for (const o of BANNED_OPENERS) {
    if (head.startsWith(o)) reasons.push(`generic opener: ${o}`);
  }
  const vague = text.match(VAGUE_REFERENT);
  if (vague) reasons.push(`vague noun standing in for the thing: "${vague[0]}"`);
  const wrongName = namesSomebodyElse(text, ctx.prospectFullName ?? null, ctx.senderName);
  if (wrongName) {
    reasons.push(`greets somebody who is not the prospect: "${wrongName}"`);
  }
  if (ctx.headline && dumpsHeadline(text, ctx.headline)) {
    reasons.push("dumps the profile headline verbatim");
  }
  // Reciting somebody's own post back at them is worse than a template: they wrote it, so the only
  // thing it proves is that a script parsed it. The check existed here but ran on the Reddit path
  // only, and nothing ever passed the prospect's words to the DM path, so it was dead for months.
  if (ctx.contextText && echoesPost(text, ctx.contextText)) {
    reasons.push("restates their own words back at them instead of reacting to them");
  }
  // A greeting with nobody's name in it is colder than no greeting at all, and it turned up as its
  // own repeated pattern across the live preview ("Hey." opening three messages out of six).
  if (/^\s*(hey|hi|hello|good morning|good afternoon)\s*[.,!]?\s*$/im.test(text)) {
    reasons.push("bare greeting with no name (say their name or skip the greeting)");
  }
  // A DM is typed on a phone, so a greeting is allowed to be short: "Glad we connected, Sarah" is
  // four words and forcing it to six produces exactly the stiffness this rule exists to prevent.
  // Everything that is not a greeting still carries its weight, and a second short one is staccato.
  const shortGreetings: string[] = [];
  for (const s of bodySentences(text, ctx.senderName)) {
    if (words(s).length >= 6) continue;
    if (isGreeting(s)) {
      shortGreetings.push(s);
      continue;
    }
    reasons.push(`sentence under 6 words: "${s}"`);
    break;
  }
  if (shortGreetings.length > 1) {
    reasons.push(`more than one sentence under 6 words: "${shortGreetings[1]}"`);
  }
  const wc = words(text).length;
  if (wc < minWords) reasons.push(`too short: ${wc} words (min ${minWords})`);
  if (wc > maxWords) reasons.push(`too long: ${wc} words (max ${maxWords})`);
  // No sign-off check. LinkedIn prints the sender's name beside every message,
  // so a name at the bottom is a mail-merge artefact rather than politeness.
  // This used to REQUIRE one, which is half of why these read as automated.
  if (signsOff(text, ctx.senderName)) {
    reasons.push("signs off with a name or a sign-off line (LinkedIn already shows who is writing)");
  }

  return { ok: reasons.length === 0, reasons };
}
