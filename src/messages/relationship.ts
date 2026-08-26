import { createHash } from "node:crypto";
import type { AgentContext } from "../config.ts";
import { generate, MODELS } from "../ai.ts";
import { validateMessage } from "./validate.ts";

/**
 * The relationship sequence. This is the product's differentiator, so the
 * reasoning behind every choice is written down here rather than living in
 * somebody's head.
 *
 * Every competitor opens with a pitch. LinkedGrow opens with a person, earns a
 * reply, answers it like a human, and only then raises the reason it is there.
 *
 * WHAT THE EVIDENCE SAYS, because most of this market runs on folklore:
 *
 * - A note on the connection request does not lift acceptance and slightly
 *   lowers it. Four independent datasets agree, including two vendors whose
 *   main feature is personalised notes at scale (Belkins 14,077 contacts,
 *   Expandi 15.1M touchpoints, Waalaxy 10,000+ invitations, sbl.so 47
 *   campaigns). So the invitation goes out bare.
 * - The message after the accept replies at roughly 3x a connection note,
 *   10.4% against 3.0% across 13.2 million requests, and the note's reply rate
 *   fell 37% over twelve months. The conversation belongs after the accept.
 * - Short wins. LinkedIn's own analysis of tens of millions of InMails: under
 *   400 characters responds 22% above average, over 1,200 responds 11% below.
 *   Every message here is a few lines.
 * - Follow-up questions increase liking (Huang et al., JPSP 2017, d = 0.27 to
 *   0.38 across two dyadic studies). Answering a question and asking one back
 *   is the single best-supported behaviour in the whole sequence.
 * - Asking for interest beats asking for time at the cold stage: Gong, 304,174
 *   emails. ROI language lowered success 15% in the same dataset.
 * - Foot-in-the-door backfires when the same requester asks again with no
 *   delay: 7% compliance against a 27% control (Chartrand, Pinckert & Burger
 *   1999, N = 181). The soft ask waits.
 *
 * THE OBJECTION, which is stronger than the usual one and shapes the design:
 *
 * Almost nobody credible argues "pitch on message one". What they argue is
 * narrower and harder to dismiss: concealing intent is the offence. Josh Braun,
 * on being run through exactly this flow: "People can handle a pitch. What they
 * don't like is feeling tricked into one." A CIO, more bluntly: "Don't assume a
 * relationship with me before we really have one."
 *
 * Two findings make it worse than a matter of taste. Grayson (Journal of
 * Marketing 2007, 685 agents) found the friendly-then-commercial direction is
 * the more damaging of the two, worse than a business relationship that becomes
 * friendly. And the FBI's own definition of a confidence scam is "develop a
 * relationship before introducing" the ask. A security-aware prospect
 * pattern-matches on the structure, not on the wording, so no amount of better
 * writing gets around it.
 *
 * A fifth pass went looking for the opposite case, that a warm opener with no
 * stated reason is read as a threat rather than as friendliness, and it found
 * the argument stated by the people who train professionals to spot it.
 *
 * The joint FBI, NSA and State Department advisory on DPRK social engineering
 * (CSA-20230601-1, 1 June 2023) tells recipients that "more often, the initial
 * spearphishing email does not contain any malicious links or attachments and
 * is instead intended to gain the trust of the victim", and lists as its first
 * red flag: "Initial communications are often seemingly innocuous with no
 * malicious links/attachments". A government agency instructing people to treat
 * a warm, no-ask opener as the higher-probability threat signature.
 *
 * LinkedIn says a narrower version of it themselves. Their own published list
 * of scam warning signs, in the help centre, includes "Messages that aren't
 * addressed to you personally". By the platform's own criteria a generic "hi,
 * nice to connect" is a scam indicator, which is the second reason step 3 has
 * to name the actual thing the person wrote.
 *
 * And Langer, Blank and Chanowitz (JPSP 1978, N=120) put a number on the cost
 * of withholding the reason. When the favour was small, compliance ran .60 with
 * no reason and .94 with a real one. When the favour cost the person something,
 * no reason and an empty reason both collapsed to .24 while a real reason held
 * at .42. A reply from a stranger is the second condition, not the first.
 *
 * SO THE RULE THIS FILE ENFORCES: the intro sells nothing and hides nothing.
 * It says who the sender is and what they do, in one plain clause, with no
 * offer and no ask attached. That is the difference between a warm opening and
 * a bait and switch, and it is the whole ethical load of the product. An agent
 * that reaches step 5 having concealed why it was ever there has earned every
 * bad reaction it gets.
 *
 * TWO FINDINGS THAT CUT THE OTHER WAY, kept here so nobody has to rediscover
 * them in an argument. Gong's 90,380 cold calls scored "How have you been?" at
 * 6.6x the baseline booking rate, the best opener in the set, though that is a
 * synchronous voice channel where the person cannot walk away mid-sentence.
 * And Dabbish et al. (CHI 2005) found purely social email content got 23% more
 * replies than other messages, while being rated less important. The defensible
 * claim is narrower than "warm openers fail". It is that on asynchronous text,
 * a message which costs a reply before disclosing why you wrote is both the
 * documented opening move of confidence fraud and the weakest message shape.
 *
 * WHAT THE EVIDENCE DOES NOT SAY, so nobody quotes a number we do not have:
 *
 * - There is no published A/B test of a no-pitch intro against a pitch on
 *   LinkedIn. Our architecture follows from the accept-versus-reply split, not
 *   from a trial of this exact idea.
 * - There is no clean evidence that liking a post before connecting lifts
 *   acceptance. Waalaxy states outright that profile views do nothing, and the
 *   famous 74% figure counts inbound requests in its denominator. We keep the
 *   like because it makes the invitation non-anonymous, and we never claim a
 *   number for it.
 * - Nobody has published how long to wait after an accept. Every figure below
 *   is a judgement, marked as one.
 */

/** The lifecycle, which is what makes the sequence different. */
export const RELATIONSHIP_STEPS = {
  /** Like their most recent post. Non-anonymous, no claim attached. */
  warm: "warm",
  /** The invitation, with no note on it. */
  invite: "invite",
  /**
   * The first message after the accept. Two lines, warm, specific, and it asks
   * for absolutely nothing. Not even a question mark. Its only job is to make
   * the next message land inside an open conversation instead of a cold one.
   */
  hello: "hello",
  /**
   * The real message. A person, with a reason for being there, still selling
   * nothing. Sent a few hours after they answer the hello, because a message
   * that lands in a live conversation is not cold outreach any more.
   */
  intro: "intro",
  /**
   * They answered. The agent answers back like a person: address what they
   * actually said, then one question. It does NOT pivot here, and this can
   * happen more than once.
   */
  converse: "converse",
  /**
   * The one soft ask. Sent whether or not they ever replied to the intro,
   * because a silent prospect has still had a message land and read.
   */
  ask: "ask",
  /** Done. Whatever happens next belongs to the customer. */
  handover: "handover",
} as const;

export type RelationshipStep =
  (typeof RELATIONSHIP_STEPS)[keyof typeof RELATIONSHIP_STEPS];

/**
 * Pacing, in days. Judgement rather than evidence: nobody has published this.
 *
 * The lower bounds come from the two findings that do exist. Chartrand showed
 * a same-requester follow-up with no delay backfiring, so nothing follows
 * immediately. Burger showed reciprocity gone by a week, so nothing waits
 * long enough to be forgotten either.
 */
export const PACING = {
  /** Between the like and the invitation. Long enough not to look like one script. */
  likeToInviteHours: [20, 44] as const,
  /** Between the accept and the hello. Same day, not the same minute. */
  acceptToHelloHours: [3, 26] as const,
  /** Between their answer to the hello and the real message. Same day. */
  helloReplyToIntroHours: [2, 9] as const,
  /** How long to wait for an answer to the hello before writing anyway. */
  helloSilenceToIntroDays: [3, 5] as const,
  /**
   * How fast to answer once they write. Fast, but never instant, and never the
   * same twice: dueAfterHours draws a delay from this range per prospect, so one
   * person waits 34 minutes and the next two hours ten, the way a person with a
   * day job answers rather than a bot that fires back on a fixed timer. Thirty
   * minutes floor because instant is the clearest tell there is; three hours
   * ceiling so a warm reply is never left cold.
   */
  replyDelayMinutes: [30, 180] as const,
  /** From the last exchange to the ask, when they did reply. */
  conversationToAskDays: [2, 4] as const,
  /** From the intro to the ask, when they never replied. */
  silenceToAskDays: [4, 7] as const,
  /** How many times the agent will answer before it must move to the ask. */
  maxConverseTurns: 3,
} as const;

const VOICE = `You are writing a LinkedIn direct message as a real person, not as a company and not as an assistant.

Hard rules, all of them:
- Two to four short lines. Never more. Under 400 characters.
- Write the way someone types on a phone: plain words, contractions, no formatting, no bullet points, no line of dashes.
- Never use an em dash or an en dash.
- Never use a colon or a semicolon. A person typing on a phone uses a comma or starts a
  new sentence (Nicolas, 2026-08-15: same family of tell as the em dash).
- No greeting formulas beyond a simple hello and their first name.
- Never mention a product name, a link, a price, a metric or a case study unless the step explicitly asks for it.
- Never say "I saw your post about", "I came across your profile", "I hope this finds you well", "just reaching out", "quick question", "resonated", "leverage", "synergies", "circle back", "touch base".
- Never compliment something generic. If you cannot name the actual thing they said, say nothing about them at all.
- BANNED, and this is the tell that gives an AI away fastest: a vague noun phrase standing in for the thing itself. "that part", "the part that", "that bit", "this piece", "the whole thing", "that side of it", "the hard part", "that stage". Name the actual thing or drop the sentence. "Months tracks, that part is never a weekend" is exactly the failure: it sounds knowing and says nothing.
- BANNED: agreeing with a one-word verdict before continuing. "Months tracks.", "Makes sense.", "Fair.", "Totally.", "Right." A real person either says something or does not.
- BANNED: chat-assistant fillers. "Fair enough", "great question", "good question", "love that",
  "totally get it". These are the vocabulary of a support bot, and one of them shipped in a live
  DM on 2026-08-15.
- Never dodge a direct question about yourself. "I'd rather not give you a generic answer" and
  "I'll spare you for now" both went out live, and both read the way a scammer avoiding
  questions reads. If this prompt gave you the fact, give it plainly; if it did not, say the
  small honest thing instead of deflecting.
- BANNED: the observation that flatters by generalising. "most people ship nothing", "nobody does that", "everyone gets this wrong". You do not know what most people do.
- Never open a reply by evaluating what they said. Answer it.
- Never claim to have read something you were not given.
- Never state where you live, who you work with, how big anything is, or any other fact about
  yourself that this prompt did not give you. If you were not told, say nothing rather than guess:
  a prospect checks the profile in one click. A live run invented a city out of nothing.
- NEVER sign your name, and never add a sign-off line of any kind. LinkedIn prints
  your name beside every message you send, so writing it again at the bottom is
  something only a mail merge does. This was a hard rule here and it was one of the
  two things making these read as automated (Nicolas, 2026-07-31).
- Never say "good to meet you", "nice to meet you" or any variant. You have not met.
- Never explain why you connected. "That is why I hit connect" and everything like it
  is a script justifying its own existence, and it is the single clearest tell.
- NEVER refer to how you found them or what you watched them do: their post, their
  comment, their reaction, their headline, their profile, their search visibility.
  "Saw your comment on that Calendly post" reads as one message; across a sending
  history it is the opening fingerprint of every LinkedIn automation, and it is what
  a spam classifier and an annoyed prospect both pattern-match on (Nicolas,
  2026-08-15: no human recites what they watched you do). What you know about them
  shapes the topic and the register; it is never recited as evidence.
- No trade jargon and no acronyms. Say it the way you would to somebody outside the
  industry, because a stranger reading an acronym knows a script wrote it.
- PLAIN WORDS, understood on first read, on a phone, half-distracted. No abstract noun
  stacks: a live DM asked about "provenance capture visible to the end user" and no human
  talks like that. Name who does what instead ("who checked it", "what happens when you
  hand it on"). When the prospect writes in jargon, answer in plain words anyway; echoing
  their jargon back is autocomplete, not conversation (Nicolas, 2026-08-17).
- One idea per sentence, and never more than 20 words in one sentence. The gate refuses
  anything longer.
- The transcript NEVER sets your register. Half of LinkedIn pastes a model's answer: long,
  stiff, cover-letter polite, stuffed with abstractions. The pull to answer in kind is
  strong, and it is exactly how an agent outs itself (a live thread on 2026-08-15 did this).
  Pick the one concrete thing they actually said, answer that in plain words from a phone,
  and let their filler go unanswered.
- Calendar talk comes only from the "Today is" line a prompt gives you. "It's only
  Wednesday" went out on a Monday (2026-08-17), and one wrong weekday outs the whole
  account. Never guess the day, how far into the week it is, or how the week feels.`;

/**
 * The shapes a first message may take, and the reason they are code rather than a prompt line.
 *
 * What matters is not the wording but that the STRUCTURE moves. Swapping only the first name inside
 * one fixed template leaves a pattern readable across a whole sending history, which is what an
 * automation classifier looks for and what a human notices on receiving the second one.
 *
 * This file used to carry the instruction "VARY THE SHAPE between messages" inside the prompt, which
 * cannot work: every message is an independent call with no memory of the previous ones, so the
 * model has nothing to vary against and settles on whichever shape it likes. The choice has to be
 * made outside the model and handed to it, which is what these pools do.
 */
export const HELLO_SHAPES = [
  "greeting with their first name, then one warm ordinary line that stands on its own",
  "the warm ordinary line first, then a short greeting with their first name",
  "a single easy sentence with their first name dropped inside it",
  "a congratulation on something that just changed for them",
  "plain empathy for the kind of situation they are in, in your words and none of theirs",
] as const;

/**
 * Openings for the intro and closings for the ask.
 *
 * The single-tenant agent shipped without these and the first live preview showed the pattern had
 * only moved down a message: two unrelated prospects both opened the second message with "I spend
 * my days scanning" and both closed the third with the same sentence. A fixed opener repeated
 * across a sending history is the same tell as a fixed template.
 */
const INTRO_OPENINGS = [
  "open on what you keep running into in situations like theirs, then say in one plain clause who you are and what you do",
  "open on the one plain clause about who you are and what you do, then tie it to the reality of their job",
  "open on the part of this that people usually get wrong, then say what you do as the reason you see it",
  "open on an honest remark about how long this normally goes unnoticed, then say what you do",
] as const;

const ASK_CLOSINGS = [
  "ask whether it would be a bad idea to send it over, and say plainly they can tell you to forget it",
  "offer to send it, and say straight out that no answer at all is a fine answer",
  "say you will send it only if they want it, and that silence means you drop it for good",
  "ask whether they would rather you send it or leave it, with no follow-up either way",
] as const;

/** The account's own weekday, so small talk about the calendar is never invented. */
function todayLine(ctx: AgentContext): string {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: ctx.timezone || "UTC",
  }).format(new Date());
  return `Today is ${day} where you are.`;
}

/** A different digest byte per slot, so the three choices never move together. */
function rotate<T>(pool: readonly T[], seed: string, slot: number): T {
  const digest = createHash("sha256").update(seed).digest();
  return pool[digest[slot % digest.length]! % pool.length]!;
}

/** Stable per prospect, so a regeneration after a rejected draft keeps the same shape. */
function seedFor(prospect: Prospect): string {
  return `${prospect.fullName ?? prospect.firstName}|${prospect.source ?? ""}`;
}

/**
 * Stable per prospect yet spread across people, and always a shape the signal can actually carry.
 * Congratulating somebody who just described a traffic collapse, or pitying somebody who merely
 * reacted to a post, both read worse than any template, so the pool narrows to what fits.
 */
export function pickHelloShape(prospect: Prospect): string {
  const kind = (prospect.source ?? "").split(":")[0] ?? "";
  const neutral = HELLO_SHAPES.slice(0, 3);
  const pool =
    kind === "jobchange" || kind === "newrole"
      ? [...neutral, HELLO_SHAPES[3]!]
      : kind === "intent" || kind === "question"
        ? [...neutral, HELLO_SHAPES[4]!]
        : neutral;
  return rotate(pool, seedFor(prospect), 0);
}

export interface Sender {
  firstName: string;
  /** What they sell, only used at the ask step. */
  companyInfo: string;
  /** Where they are, so small talk can be answered honestly. */
  location?: string;
}

export interface Prospect {
  firstName: string;
  /** Used with the source to seed the shape rotation, so two people never get the same structure. */
  fullName?: string;
  headline?: string;
  company?: string;
  /** How they were found, e.g. "reaction:calendly" or "intent:...". Narrows the shape pool. */
  source?: string;
  /** The thing they actually wrote that surfaced them, if there is one. */
  signalText?: string;
}

/** What a step hands back to the sequence: the text, and which step wrote it. */
export interface GeneratedMessage {
  body: string;
  angle: string;
}

export interface Turn {
  from: "us" | "them";
  body: string;
}

async function write(
  ctx: AgentContext,
  sender: Sender,
  prospect: Prospect,
  prompt: string,
  purpose: string
): Promise<string> {
  // The no-slop gate is the reason these do not read as AI, so a draft that
  // fails it is rewritten rather than sent. Bounded, because a pathological
  // prompt can fail forever.
  let failures: string[] = [];
  for (let attempt = 1; attempt <= 4; attempt++) {
    const body = (
      await generate(ctx, prompt + toneNote(ctx.tone) + failureNote(failures), {
        purpose,
        maxTokens: 220,
        model: MODELS.writer,
        systemPrompt: VOICE,
      })
    )
      .replace(/^["']|["']$/g, "")
      .trim();

    // The ported gate, unchanged. It is the reason these do not read as AI,
    // and 70 words is roughly the 400-character band LinkedIn's own InMail
    // data puts 22% above average.
    const result = validateMessage(body, {
      senderName: sender.firstName,
      // The hello is two sentences on a phone; the later steps carry an idea.
      step: purpose as "hello" | "intro" | "converse" | "ask",
      ...(prospect.headline ? { headline: prospect.headline } : {}),
      ...(prospect.fullName ? { prospectFullName: prospect.fullName } : {}),
      ...(prospect.signalText ? { contextText: prospect.signalText } : {}),
      maxWords: 70,
    });
    if (result.ok) return body;
    failures = result.reasons;
  }
  throw new Error("Could not write a message that passes the gate");
}

/**
 * How the customer asked the messages to sound.
 *
 * Deliberately a nudge rather than a rewrite of the voice: every hard rule above exists because
 * breaking it makes the message read as automated, and a tone setting must not be able to
 * override that. Professional does not mean formal enough to sound like a letter, and direct does
 * not mean blunt enough to sound rude.
 */
function toneNote(tone: "professional" | "conversational" | "direct"): string {
  if (tone === "professional") {
    return "\n\nTone: a shade more measured than casual. Still a person typing on a phone, still contractions, but no slang and no jokes.";
  }
  if (tone === "direct") {
    return "\n\nTone: get to the point sooner. Shorter sentences, no throat-clearing, no softeners like 'just' or 'quick'. Still warm, never curt.";
  }
  return "";
}

function failureNote(failures: string[]): string {
  if (!failures.length) return "";
  return `\n\nYour last attempt was rejected for: ${failures.join("; ")}. Fix those and keep everything else.`;
}

/**
 * Step 3: the hello.
 *
 * Two lines that ask for nothing at all. Nicolas's design, and the evidence
 * backs it over the version this file used to have.
 *
 * The rule that makes it work, and the one I had wrong: NO QUERY. Practitioner
 * guidance for the message straight after an accept converges on 2 to 3
 * sentences, under 400 characters, tied to a real detail, and explicitly "no
 * question marks, no would-you-be-open-to". The reasoning is that people accept
 * out of curiosity and reciprocity, and a first message that asks for anything
 * breaks that unspoken contract on the spot.
 *
 * That is also what separates this from the bare "thanks for connecting" that
 * sales communities mock. The mocked version is generic AND fishing for a
 * reply. This one is specific and fishing for nothing. Personalised requests
 * are reported at roughly 45% acceptance against 15% generic, so the specific
 * detail is the part that is doing the work.
 *
 * It is not trying to earn a reply. It is making the next message land inside
 * an open thread rather than a cold one.
 */
export function helloMessage(
  ctx: AgentContext,
  sender: Sender,
  prospect: Prospect
): Promise<string> {
  return write(
    ctx,
    sender,
    prospect,
    `You are ${sender.firstName}. ${prospect.firstName} just accepted your connection request on LinkedIn. This is the very first thing you say to them.
${todayLine(ctx)}

${prospect.signalText ? `Context you know and never mention: they recently wrote "${prospect.signalText}". It tells you what world they live in, nothing more.` : ""}
${prospect.headline ? `Context you know and never mention: their headline reads "${prospect.headline}".` : ""}

Write it.

- TWO LINES. Never three. Under 300 characters.
- The greeting is plain and contains their first name. "Glad we connected, Sarah", "Good to be connected, Tom". Never "nice to meet you", because you have not met.
- The other line is one warm, ordinary sentence a person types without thinking: the week, the season, being glad the invite went through. It stands entirely on its own and refers to nothing you watched them do.
- NEVER mention their post, their comment, a reaction, their profile, their headline, their company or how you found them. The context above sets your register only; reciting it is surveillance, and it is the one pattern every LinkedIn automation shares.
- The one exception: when the shape below is a congratulation or empathy, speak to the situation itself in your own plain words, never quoting theirs and never naming where you read about it.
- SHAPE FOR THIS ONE: ${pickHelloShape(prospect)}. Follow it exactly, so that two messages in a row never share an opening.
- Ordinary spoken word order. Never a clause that opens on a gerund and lands on the point, because nobody says "Owning a site end to end is why I hit connect" out loud.
- No trade jargon, no acronyms, no product vocabulary of any kind.
- ABSOLUTELY NO QUESTION. No question mark anywhere in this message. Not one.
- Ask for nothing. Offer nothing. Propose nothing. Mention no product, no company, no work of yours, no link.
- Do not say what you do for a living. That comes later and saying it here turns a hello into a pitch.
- Never write "thanks for connecting" on its own with nothing else. That is the message everyone deletes.
- It should read like something typed on a phone in ten seconds, because that is what it is.`,
    "hello"
  );
}

/**
 * Step 3: the introduction.
 *
 * It sells nothing. It is also not a bare greeting, and that distinction cost
 * a research pass to establish.
 *
 * A pure "thanks for connecting, nice to meet you" is the message sales
 * communities openly mock: the highest-scoring reactions to it on r/sales are
 * all rejections, and the one person who measured it reported a 3% response
 * rate. Nobody has ever published a denominatored reply rate for it. What does
 * get answered is a message that has a reason for existing which is not a
 * pitch, and closes with nothing being asked for.
 *
 * The two documented shapes:
 *  - Justin Welsh's passive DM, reported above 10% reply: one specific true
 *    thing about them, one line of who you are, and no ask at all.
 *  - The DM Josh Braun publicly said made him reply: a specific observation,
 *    one genuine question, and "either way, thanks for the great content".
 *
 * So: name the actual thing they wrote, say who you are in one clause, ask one
 * question they can answer in a line, and close so that ignoring it costs them
 * nothing. The zero-ask close is the load-bearing part.
 */
export function introMessage(
  ctx: AgentContext,
  sender: Sender,
  prospect: Prospect,
  thread: Turn[] = []
): Promise<string> {
  /**
   * What they already wrote, which this step used to be blind to.
   *
   * The intro is scheduled by status, so when the hello's answer carried a
   * real question ("How has building been going?"), the intro shipped its
   * prepared substance and ignored the question outright: Miracle Ohama,
   * 2026-08-26, and it read exactly like a bot changing the subject. The
   * thread rides along now, and answering it comes before everything else.
   */
  const theirs = thread.filter((t) => t.from === "them");
  const transcript =
    theirs.length > 0
      ? thread
          .map((t) => `${t.from === "us" ? sender.firstName : prospect.firstName}: ${t.body}`)
          .join("\n")
      : "";

  return write(
    ctx,
    sender,
    prospect,
    `You are ${sender.firstName}. You said hello to ${prospect.firstName} on LinkedIn after they accepted your invitation. This is your second message, and the first one with any substance in it.
${transcript ? `\nThe conversation so far:\n${transcript}\n\n- FIRST, before anything else in your message: answer what ${prospect.firstName} actually said or asked in their last messages, directly, honestly and specifically. If they asked about you, your work or what you are building, answer it plainly from what this prompt tells you about yourself; never change the subject past a direct question, that is what a bot does.` : ""}

${prospect.signalText ? `Context you know and never mention: they recently wrote "${prospect.signalText}". Use it only to know which world to speak to.` : ""}
${prospect.headline ? `Context you know and never mention: their headline reads "${prospect.headline}".` : ""}

Write it.

- Open with something of YOURS: one honest, specific line about what you keep running into, or quietly find hard, in the world the context above tells you they live in. Spoken from your own chair, about your own days. Give first: people open up to people who disclose something real, not to people who probe (turn-taking self-disclosure, Sprecher 2013).
- Say who you are AND what you do, in one plain clause, drawn from this and nothing else: ${sender.companyInfo}. Not a pitch, not a benefit, not an offer, just the honest frame: "I build X for Y" or "I run a small Z". This line is not optional. A message that hides why you are around is a bait and switch, and the reveal three messages later costs more trust than saying it now ever would.
- NEVER mention their post, their comment, a reaction, their headline, or how you found them. No "saw", no "noticed", no "came across", no "your point about". The context picks the topic; it never appears in the message.
- STRUCTURE FOR THIS ONE: ${rotate(INTRO_OPENINGS, seedFor(prospect), 7)}. Never open two messages the same way, and never with the words "I spend my days".
- Ask one question they can answer in a single line, about their side of that world.
- Close so that ignoring you costs them nothing. Something like "either way, good to be connected". This part matters more than the rest.
- Never say what you do for a living in a way that sounds like an offer. There is no offer in this message.
- Three lines. LinkedIn's own InMail data puts the shortest messages 22% above the average response rate and the longest 11% below it, and one question beats none by 50% across Boomerang's 40M emails. More than one question, or a fourth line, spends that.`,
    "intro"
  );
}

/**
 * Step 4: answering what they said.
 *
 * The rule that matters: answer their actual question first, in their own
 * terms, before anything else. If they asked where you are from, say where you
 * are from. Then one question back, because follow-up questions are the
 * best-evidenced behaviour available to us here.
 *
 * This step never mentions the product. Not once, not as a hint.
 */
export function converseMessage(
  ctx: AgentContext,
  sender: Sender,
  prospect: Prospect,
  thread: Turn[]
): Promise<string> {
  const transcript = thread
    .map((t) => `${t.from === "us" ? sender.firstName : prospect.firstName}: ${t.body}`)
    .join("\n");

  return write(
    ctx,
    sender,
    prospect,
    `You are ${sender.firstName}${sender.location ? `, based in ${sender.location}` : ""}. You are messaging ${prospect.firstName} on LinkedIn.
${todayLine(ctx)}
${sender.companyInfo ? `\nWhat you do, for when they ask and only then: ${sender.companyInfo}` : ""}

The conversation so far:
${transcript}

Write your next message.

- Answer what they actually said or asked, directly and specifically, in the first line. If they asked you a question, answer it honestly before anything else.
- Their message may itself be AI-written, because half of LinkedIn pastes a model's answer. Never mirror its length, its stiffness or its vocabulary: find the one concrete thing inside it, answer that like a person on a phone, and ignore the filler around it.
- If they asked what you do, what you want, or why you got in touch, answer it in one plain clause drawn from "what you do" above. No product name, no link, no offer, and never a dodge: a live run answered "so what you do" with "I'd rather not give you a generic answer", which is what a scammer sounds like, and the conversation died there.
- Give before you ask: somewhere in the message, one small true thing from your own side, drawn only from what this prompt gives you (what you do, where you are based, the ordinary reality of that work). An exchange where you only ask reads as an interview, and interviews get ghosted (turn-taking self-disclosure, Sprecher 2013).
- Match their energy. A two-word reply earns two short lines back, never three enthusiastic ones.
- If they sound short, suspicious or annoyed, skip the question back entirely. Answer straight, keep it to two lines, and leave them an easy way to end the chat.
- Otherwise ask them one question back, about them, that follows from what they just said.
- Never bring up what you do unprompted. It comes later in the sequence, and volunteering it here turns a conversation into a pitch.
- Two or three lines.`,
    "converse"
  );
}

/**
 * Step 5: the one ask.
 *
 * Sent whether or not they ever answered the intro. A prospect who read the
 * intro and said nothing has still seen the name; the ask is what the sequence
 * was for, and skipping it wastes the accept.
 *
 * Never a slot in their calendar. Gong's 304,174 emails put the interest ask
 * ahead at cold stage, because asking for time reads as asking for a resource,
 * and Textio measures a 25% drop when a message pushes for a specific date.
 *
 * The larger dataset disagrees about what beats it, and the disagreement is
 * worth knowing. Gong with 30MPC, across 85M+ cold emails, scored the effect on
 * reply rate: asking for a meeting -44%, asking about a problem -29%, asking
 * for interest +7%, and MAKING AN OFFER +28%. So the strongest version of this
 * message is not "are you interested", it is a concrete, small, free thing they
 * can accept or ignore. Buzzwords cost 57% in the same data.
 *
 * THIS IS THE ONLY STEP THE CUSTOMER'S GOAL CHANGES. Everything before it is
 * identical for both, because the evidence says a cold meeting ask is the worst
 * available move and no wording rescues it. An agent set to book calls proposes
 * two concrete windows, but only to somebody who has actually written back; to
 * a prospect who never replied it closes on interest like the other one, since
 * that is the 47% branch rather than the 27% one.
 */
/**
 * Why the close is shaped this way, kept out of the prompt because a model does not need the
 * citation to follow the instruction, and 150 tokens of it went out with every message.
 *
 * Gong Labs scored 304,174 emails on whether a meeting was booked within ten days. At the cold
 * stage an interest close succeeded 47% of the time, against 27% for a close naming a day and time
 * and 26% for an open-ended meeting ask. At deal stage the order reverses: 37% for the specific
 * time against 25% for interest.
 *
 * Two earlier versions of this note were wrong and the corrections are worth keeping. One credited
 * Voss's no-oriented question, whose published support is a single anecdote in a book. One quoted
 * reply-rate figures that appear in secondary write-ups but not in Gong's own post. Gong does not
 * state its denominator plainly, so read the numbers above as relative rather than absolute.
 */
export function askMessage(
  ctx: AgentContext,
  sender: Sender,
  prospect: Prospect,
  thread: Turn[]
): Promise<string> {
  return write(ctx, sender, prospect, askPrompt(ctx, sender, prospect, thread), "ask");
}

/**
 * The ask's prompt, separated from the model call so the goal branch can be tested.
 *
 * What the customer picked is the one thing that changes here, and it changed nothing at all until
 * now, so it is worth locking rather than trusting.
 */
export function askPrompt(
  ctx: AgentContext,
  sender: Sender,
  prospect: Prospect,
  thread: Turn[]
): string {
  const talked = thread.some((t) => t.from === "them");
  const transcript = thread
    .map((t) => `${t.from === "us" ? sender.firstName : prospect.firstName}: ${t.body}`)
    .join("\n");

  // The whole difference between the two goals, and it is deliberately this narrow.
  //
  // Gong's 304,174 emails say a specific-time ask wins at 37% once somebody is engaged and loses
  // at 27% while they are still cold, against 47% for an interest close. So "book calls" earns the
  // reply exactly like "start conversations" does, and only then spends it on a slot. An agent
  // that asked for a call before the prospect ever answered would be choosing the 27% branch on
  // purpose, which is why silence keeps the interest close whatever the customer picked.
  const wantsMeeting = ctx.goal === "meetings" && talked;

  return `You are ${sender.firstName}. You are messaging ${prospect.firstName} on LinkedIn${prospect.company ? ` at ${prospect.company}` : ""}.

${talked ? `The conversation so far:\n${transcript}\n\n- FIRST, if their last message said or asked anything that deserves an answer, answer it directly and honestly before the close below. A question ignored right before an ask reads as a script reaching its final line.` : `You introduced yourself a few days ago and they have not replied. This is your last message to them.`}

What you do, in your own words: ${sender.companyInfo}

Write the message where you finally say why you are around, as a person would.

- ${talked ? "Refer to something they actually said, in one short clause, then get to it." : "Do not pretend you have spoken. Go straight to it, lightly."}
- Say what you do in one plain sentence, the way you would to someone at a bar who asked. No product name unless it is unavoidable, no features, no numbers, no results, no case studies.
${wantsMeeting
  ? `- End by proposing a short call, and name two concrete windows rather than asking them to find time. Something like "Thursday afternoon or Friday morning, either works". No calendar link.
- Say the call is short and say what it is for, in the same breath. Fifteen or twenty minutes, and the reason.
- Make declining costless and say so plainly. "If the timing is wrong just say so" beats any nudge.`
  : `- End with a small concrete offer they can accept or ignore in one word. Something you would actually send them in two minutes. Never ask for a meeting, a call, a slot, or fifteen minutes of their time.
- CLOSE FOR THIS ONE: ${rotate(ASK_CLOSINGS, seedFor(prospect), 13)}. Do not reuse a closing you would send to everyone.`}
- Frame the close so that "no" is the easy answer. Say plainly that a no is fine, and mean it.
- Make it easy to say no in a word. Someone who feels cornered does not answer at all.
- Three lines at most.`;
}

/**
 * When a reply means the agent must stop, on the words alone.
 *
 * This used to be the whole decision and it was a list of keywords, which got
 * it wrong in both directions: it handed over on "nice meeting you" and kept
 * talking through "sounds great, send me more". Three leads on 2026-08-07
 * answered a hello with small talk and every one was marked over-to-you.
 *
 * What is left here is only what a word settles for certain. A refusal has to
 * stop the agent even if the model is down, and being asked whether you are a
 * bot is the one question an agent must never answer itself. Everything else,
 * including every buying signal, is now read by classifyReply.
 */
export function shouldHandOver(step: RelationshipStep, thread: Turn[]): boolean {
  if (step === RELATIONSHIP_STEPS.ask) return true;
  const last = [...thread].reverse().find((t) => t.from === "them");
  if (!last) return false;
  return BOT_QUESTION.test(last.body);
}

/**
 * A refusal ends the thread on the words alone, and it ends QUIETLY.
 *
 * It used to hand over instead, which put "Not interested, thanks" in the
 * customer's Yours-now list next to the real conversations. Nobody wants to
 * inherit a no: the human move is to let it die, so the agent does, without an
 * event and without an email. It must hold even when the model call fails.
 */
export function isHardRefusal(thread: Turn[]): boolean {
  const last = [...thread].reverse().find((t) => t.from === "them");
  if (!last) return false;
  return REFUSAL.test(last.body);
}

const REFUSAL =
  /\b(not interested|no thanks|no thank you|stop|unsubscribe|remove me|leave me alone)\b/i;

/**
 * Being asked whether this is automated is the one reply an agent must never
 * answer itself, so it is the one wording that still forces a handover here.
 */
const BOT_QUESTION =
  /\b(is this a bot|are you a bot|is this automated|are you a real person|are you human)\b/i;
