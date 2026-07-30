/**
 * No-slop gate for generated messages. A message is rejected (and must be regenerated) if any
 * check fails. Rules are self-contained so the tool is shareable without external files.
 */

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
  "impressed by your", "impressive profile", "love what you", "big fan of your",
  "your profile stood out", "caught my eye", "your work is inspiring",
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
];

/** A short opening or closing pleasantry, which is allowed to be brief. */
const GREETING = /^(hi|hey|hello|glad|good|great|happy|congrats|nice one)\b/i;

function isGreeting(sentence: string): boolean {
  return GREETING.test(sentence.trim()) && words(sentence).length <= 8;
}

/** True when the last line is just the sender's name, which is the mail-merge tell. */
function endsWithSignoff(text: string, senderName: string): boolean {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  if (!last) return false;
  const first = senderName.trim().split(/\s+/)[0] ?? "";
  if (!first) return false;
  return (
    words(last).length <= 3 &&
    last.toLowerCase().includes(first.toLowerCase())
  );
}

function words(text: string): string[] {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
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
  if (ctx.headline && dumpsHeadline(text, ctx.headline)) {
    reasons.push("dumps the profile headline verbatim");
  }
  // Reciting somebody's own post back at them is worse than a template: they wrote it, so the only
  // thing it proves is that a script parsed it. The check existed here but ran on the Reddit path
  // only, and nothing ever passed the prospect's words to the DM path, so it was dead for months.
  if (ctx.contextText && echoesPost(text, ctx.contextText)) {
    reasons.push("restates their own words back at them instead of reacting to them");
  }
  for (const s of bodySentences(text, ctx.senderName)) {
    // A greeting is allowed to be short, because that is how people greet.
    // "Glad we connected, Sarah" is four words and forcing it to six is
    // exactly the stiffness this whole rule exists to prevent. Everything
    // that is not a greeting still has to carry its weight.
    if (isGreeting(s)) continue;
    if (words(s).length < 6) {
      reasons.push(`sentence under 6 words: "${s}"`);
      break;
    }
  }
  const wc = words(text).length;
  if (wc < minWords) reasons.push(`too short: ${wc} words (min ${minWords})`);
  if (wc > maxWords) reasons.push(`too long: ${wc} words (max ${maxWords})`);
  // No sign-off check. LinkedIn prints the sender's name beside every message,
  // so a name at the bottom is a mail-merge artefact rather than politeness.
  // This used to REQUIRE one, which is half of why these read as automated.
  if (endsWithSignoff(text, ctx.senderName)) {
    reasons.push("signs off with a name, which LinkedIn already shows");
  }

  return { ok: reasons.length === 0, reasons };
}

export interface CommentContext {
  /** The post being commented on, used to reject comments that parrot the post. */
  postText: string;
  minWords?: number;
  maxWords?: number;
}

/** True if any 6-word window of the post appears verbatim in the comment. */
function echoesPost(comment: string, postText: string): boolean {
  const p = words(postText.toLowerCase());
  if (p.length < 6) return false;
  const hay = comment.toLowerCase();
  for (let i = 0; i + 6 <= p.length; i++) {
    if (hay.includes(p.slice(i, i + 6).join(" "))) return true;
  }
  return false;
}

/**
 * No-slop gate for warm-up comments. A human comment responds to the post; it never quotes a
 * chunk of it to fake having read it, and never reads like AI filler.
 */
export function validateComment(text: string, ctx: CommentContext): ValidationResult {
  const reasons: string[] = [];
  const minWords = ctx.minWords ?? 8;
  const maxWords = ctx.maxWords ?? 45;
  const lower = text.toLowerCase();

  if (/\[|\]|\{|\}|firstname|first_name|company_name/i.test(text)) reasons.push("unresolved template token");
  if (/[—–]/.test(text)) reasons.push("em dash or en dash");
  // A colon or semicolon mid-sentence is a strong AI/formal tell; real Reddit comments do not use them.
  if (text.includes(":")) reasons.push("colon (not human in a casual comment)");
  if (text.includes(";")) reasons.push("semicolon (not human in a casual comment)");
  if (/[“”‘’]/.test(text)) reasons.push("curly quotes");
  reasons.push(...bannedWordReasons(text));
  for (const p of BANNED_PHRASES) {
    if (lower.includes(p)) reasons.push(`banned phrase: ${p}`);
  }
  if (echoesPost(text, ctx.postText)) reasons.push("echoes the post instead of responding to it");
  const sents = text.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  for (const s of sents) {
    if (words(s).length < 6) {
      reasons.push(`sentence under 6 words: "${s}"`);
      break;
    }
  }
  // Two short sentences in a row read as engineered AI staccato (no-slop §31), so reject them.
  for (let i = 0; i + 1 < sents.length; i++) {
    const a = sents[i] ?? "";
    const b = sents[i + 1] ?? "";
    if (words(a).length <= 8 && words(b).length <= 8) {
      reasons.push("two short choppy sentences in a row (staccato)");
      break;
    }
  }
  const wc = words(text).length;
  if (wc < minWords) reasons.push(`too short: ${wc} words (min ${minWords})`);
  if (wc > maxWords) reasons.push(`too long: ${wc} words (max ${maxWords})`);

  return { ok: reasons.length === 0, reasons };
}
