import type { Config } from "../config.ts";
import { log, logError } from "../logger.ts";
import { sleep } from "../browser/human.ts";
import type { LinkedInActions } from "./actions.ts";
import {
  PACING,
  RELATIONSHIP_STEPS,
  shouldHandOver,
  type GeneratedMessage,
  type RelationshipStep,
  type Turn,
} from "../messages/relationship.ts";
import {
  type DB,
  type ProspectRow,
  getProspects,
  setProspectStatus,
  setProspectReplyIntent,
  revertProspectStatus,
  recordMessage,
  recordInbound,
  getThread,
  countOutboundStep,
  recordAction,
  countActionsSince,
  countProspectsByStatus,
  accountWarmupStart,
  announce,
  stopAnnouncing,
} from "../store.ts";
import {
  warmupWeekIndex,
  dailyConnectAllowance,
  applyDailyVariance,
  actionDelayMs,
} from "../safety/envelope.ts";
import { dayAgoIso, weekAgoIso, epochIso } from "../time.ts";
import { minimumScore } from "./competitor.ts";
import type { ReplyIntent } from "../db.ts";

/**
 * The prospect lifecycle.
 *
 * Forward-only, which is what caps the sequence by construction: exactly one
 * intro, at most PACING.maxConverseTurns answers, exactly one ask, then the
 * agent is done with that person for good.
 *
 * Two things here are the product rather than plumbing.
 *
 * `hello_sent` exists because the first message after an accept asks for
 * nothing at all. It is two lines and a real detail, and the message with
 * substance in it waits until that one has been answered, so it lands in an
 * open thread rather than as cold outreach. A prospect who never answers still
 * gets it, a few days later, because the accept is worth more than the silence.
 *
 * `conversing` exists because a reply used to end the sequence. It now moves
 * the prospect into a conversation the agent answers like a person, and the ask
 * comes later, whether or not they ever wrote back.
 */
export const STATUS = {
  queued: "queued",
  connectSent: "connect_sent",
  connected: "connected",
  helloSent: "hello_sent",
  /** They answered the hello. The real message is owed to them within hours. */
  helloAnswered: "hello_answered",
  introSent: "intro_sent",
  conversing: "conversing",
  askSent: "ask_sent",
  handedOver: "handed_over",
  stopped: "stopped",
  skipped: "skipped",
} as const;

/**
 * Where in the range a given prospect sits, from its id.
 *
 * Every message going out at exactly the minimum wait is a rhythm, and rhythm
 * is what an automation detector reads most easily. This spreads them across
 * the window while staying deterministic, so a prospect does not become due,
 * then not due, between two passes.
 */
function dueAfterHours(id: number, range: readonly [number, number]): number {
  const [min, max] = range;
  const spread = ((id * 2654435761) >>> 0) / 4294967296;
  return min + spread * (max - min);
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

/** True once this prospect's own wait, inside the range, has elapsed. */
function isDue(p: ProspectRow, range: readonly [number, number]): boolean {
  return p.updated_at <= hoursAgoIso(dueAfterHours(p.id, range));
}

/** Invites still unaccepted after this many days are given up on (stale-invite handling). */
const STALE_CONNECT_DAYS = 21;

export interface SequenceDeps {
  actions: LinkedInActions;
  /** What LinkedIn allows this account per day, so the warm-up ramp can never exceed it. */
  accountDailyCap?: number;
  /**
   * Writes a validated message for a prospect and step. The thread is passed
   * because the converse and ask steps answer what was actually said, and a
   * step that writes without reading is how an agent replies beside the point.
   */
  writeMessage: (
    p: ProspectRow,
    step: RelationshipStep,
    thread: Turn[]
  ) => Promise<GeneratedMessage>;
  /** Alerts Nicolas (Telegram in production, a log line until then). */
  notify: (message: string) => Promise<void> | void;
  /**
   * Reads an inbound reply and says whether it needs the customer.
   *
   * Optional, and its absence means the keyword layer decides alone: the
   * sequence has to keep working on a box with no model access, and a failed
   * classification must never stop a conversation the agent could have carried.
   */
  readReply?: (
    thread: Turn[]
  ) => Promise<{ handOver: boolean; why: string; intent: ReplyIntent }>;
  /** Pause between actions. Defaults to the human envelope delay; tests pass 0. */
  pauseMs?: (cfg: Config) => number;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function label(p: ProspectRow): string {
  return p.first_name || p.full_name || p.profile_url;
}

/** The person, in the shape the live ticker wants. */
function subjectOf(p: ProspectRow) {
  return {
    name: p.full_name ?? p.first_name,
    avatarUrl: p.avatar_url,
    profileUrl: p.profile_url,
  };
}

/**
 * What each message step is called while it is being written.
 *
 * Present tense and reading on from the agent's name, because that is how the
 * ticker prints it: "Writing the first message to Thomas Blanc".
 */
const WRITING: Record<string, string> = {
  hello: "writing a hello to",
  intro: "writing the first message to",
  converse: "writing a reply to",
  ask: "writing the one ask to",
};

/**
 * One bounded work pass: read replies first, promote accepted invites, move everyone who is due to
 * their next step, then send new invitations within the day's allowance. Every state change is
 * forward-only, so a prospect receives one intro, at most a few answers, and exactly one ask.
 */
export async function runSequence(cfg: Config, db: DB, deps: SequenceDeps): Promise<void> {
  const pause = () => sleep(deps.pauseMs ? deps.pauseMs(cfg) : actionDelayMs(cfg));
  const week = await currentWarmupWeek(db);

  // No acceptance-rate gate: acceptances take days, so a rate computed early is always low and would
  // deadlock the account. What LinkedIn actually penalises is a pile of pending invites, and
  // sweepAcceptances already withdraws any invite still unanswered after STALE_CONNECT_DAYS.

  // Order matters. Replies come first because they stop everything. Acceptances are picked up next
  // and messaged in the same pass: an acceptance is only noticed on a pass, and holding it for the
  // following one meant a Saturday acceptance waited until Monday. The person accepted at some
  // earlier point anyway, and the pause between actions keeps the pace human.
  // Each phase says what it is doing before it starts, so the dashboard can
  // narrate the pass in the present rather than reporting it afterwards.
  await announce(db, "checking the inbox for replies");
  await detectReplies(db, deps, pause);
  await announce(db, "checking who accepted an invitation");
  await sweepAcceptances(cfg, db, deps, pause);
  await advanceSequence(cfg, db, deps, pause);
  await sendNewConnects(cfg, db, deps, week, pause);
  await stopAnnouncing(db);
}

/**
 * Reads what came back and decides who answers it.
 *
 * A reply used to end the sequence. It no longer does, because the whole point
 * of the product is that the agent keeps talking like a person and only asks
 * later. Two things still end it immediately: a reply that needs a human, which
 * covers buying signals and refusals alike, and a reply that arrives after the
 * ask, because the ask is the last thing the agent ever sends.
 *
 * The inbox scan names the repliers in one page load. Only those threads are
 * opened, so the cost stays proportional to the number of people who wrote.
 */
async function detectReplies(db: DB, deps: SequenceDeps, pause: () => Promise<void>): Promise<void> {
  const repliers = await deps.actions.inboxRepliers();
  if (repliers.length === 0) return;
  const replied = new Set(repliers.map((n) => normalizeName(n)));
  const active = [
    STATUS.connected,
    STATUS.helloSent,
    STATUS.helloAnswered,
    STATUS.introSent,
    STATUS.conversing,
    STATUS.askSent,
  ];

  // Read every state up front. Walking them one at a time re-selected a
  // prospect the previous iteration had just advanced into a later state, and
  // the second pass overwrote the decision the first one had made.
  const candidates: { p: ProspectRow; status: string }[] = [];
  for (const status of active) {
    for (const p of await getProspects(db, status)) candidates.push({ p, status });
  }

  {
    for (const { p, status } of candidates) {
      const name = normalizeName(p.full_name ?? "");
      if (!name || !replied.has(name)) continue;

      const thread = await deps.actions.readThread(p);
      const theirs = thread.filter((t) => t.from === "them");
      if (theirs.length === 0) {
        // The inbox said they wrote, the thread does not show it. Trusting the
        // inbox here would have the agent answer a message it never read.
        log(`${label(p)} shows as a replier but the thread read empty, leaving them alone this pass.`);
        await pause();
        continue;
      }

      // Store only what is new, so a re-read does not duplicate the thread.
      const known = await getThread(db, p.id);
      const knownInbound = known.filter((t) => t.from === "them").length;
      for (const turn of theirs.slice(knownInbound)) {
        await recordInbound(db, p.id, turn.body);
      }
      await recordAction(db, p.id, "reply", p.profile_url);

      const step = status === STATUS.askSent ? RELATIONSHIP_STEPS.ask : RELATIONSHIP_STEPS.converse;

      /**
       * The words first, then the reading.
       *
       * A refusal stops the agent whatever a model would say, and the ask being
       * out means the agent has nothing left to send. Everything else is read:
       * most replies are a thank-you or a question the agent can answer, and
       * handing those over is how a warm thread goes cold in somebody's inbox.
       */
      let handOver = shouldHandOver(step, thread);
      let why = handOver ? "the words in the reply" : "";
      /**
       * What the reply was worth, which is a different question from who
       * answers it and was never being asked.
       *
       * A refusal caught by the words alone is already known to be worthless,
       * so it is recorded as such without a model call. Everything else is
       * read, and the default stays neutral: a reply is not evidence of
       * interest until something in it says so.
       */
      let intent: ReplyIntent = handOver ? "refused" : "neutral";
      if (!handOver && deps.readReply) {
        try {
          const read = await deps.readReply(thread);
          handOver = read.handOver;
          why = read.why;
          intent = read.intent;
        } catch (error) {
          // Keep talking. An extra friendly message costs nothing; a thread
          // parked on a busy person because a model call timed out costs the
          // relationship.
          logError("could not read the reply, the agent carries on", error, { prospect: label(p) });
        }
      }
      // Recorded whatever happens next, because this is the ground truth the
      // source ranking and the memory both feed on.
      await setProspectReplyIntent(db, p.id, intent).catch(() => {});

      if (handOver) {
        await setProspectStatus(db, p.id, STATUS.handedOver);
        await deps.notify(
          `${label(p)} replied and it needs you${why ? ` (${why})` : ""}. Over to you: ${p.profile_url}`
        );
      } else if (status === STATUS.helloSent) {
        // Answering a hello that asked nothing is not a conversation yet. What
        // it buys is an open thread for the message that has something in it.
        await setProspectStatus(db, p.id, STATUS.helloAnswered);
        log(`${label(p)} answered the hello. The real message goes out in a few hours.`);
      } else {
        await setProspectStatus(db, p.id, STATUS.conversing);
        log(`${label(p)} replied. The agent will answer on the next pass.`);
      }
      await pause();
    }
  }
}

/**
 * Promotes accepted invites to connected, and gives up on invites that went stale.
 *
 * Acceptances are read from the connections list in a single page load, on every pass. An earlier
 * version waited days before even looking, which meant the first message landed long after the
 * person had forgotten the invite. The useful window is the first day or two after they accept.
 */
async function sweepAcceptances(cfg: Config, db: DB, deps: SequenceDeps, pause: () => Promise<void>): Promise<void> {
  const pending = await getProspects(db, STATUS.connectSent);
  if (pending.length === 0) return;

  const connections = new Set((await deps.actions.recentConnections()).map(normalizeName));
  for (const p of pending) {
    const name = normalizeName(p.full_name ?? "");
    if (name && connections.has(name)) {
      await setProspectStatus(db, p.id, STATUS.connected);
      log(`${label(p)} accepted the invite.`);
      continue;
    }
    if (p.updated_at <= daysAgoIso(STALE_CONNECT_DAYS)) {
      await deps.actions.withdrawInvite(p);
      await setProspectStatus(db, p.id, STATUS.stopped);
      log(`Invite to ${label(p)} went stale after ${STALE_CONNECT_DAYS} days, withdrawn and stopped.`);
      await pause();
    }
  }
}

/** Names as LinkedIn renders them vary in accents, emoji and spacing, so compare a stripped form. */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Moves everyone who is due to their next step, inside the day's message cap.
 *
 * Order is deliberate. Answering someone who wrote to you comes before opening
 * a new conversation, and both come before the ask, because a queue that spends
 * its budget on asks leaves real replies waiting.
 */
async function advanceSequence(cfg: Config, db: DB, deps: SequenceDeps, pause: () => Promise<void>): Promise<void> {
  // Both ceilings, and the smaller one wins, the same way invitations are
  // bounded. Counted on the LinkedIn account rather than the agent, because the
  // limit is LinkedIn's and LinkedIn watches the profile.
  const today = cfg.limits.dmPerDayMax - (await countActionsSince(db, "dm", dayAgoIso()));
  const thisWeek = cfg.limits.dmPerWeekMax - (await countActionsSince(db, "dm", weekAgoIso()));
  let budget = Math.min(today, thisWeek);
  if (budget <= 0) return;

  // 1. Answer the people who wrote back, up to the cap on how many times the
  //    agent will answer before it has to come to the point.
  for (const p of await getProspects(db, STATUS.conversing)) {
    if (budget <= 0) break;
    if (!isDue(p, [PACING.replyDelayMinutes[0] / 60, PACING.replyDelayMinutes[1] / 60])) continue;

    const turns = await countOutboundStep(db, p.id, RELATIONSHIP_STEPS.converse);
    if (turns >= PACING.maxConverseTurns) continue; // the ask picks them up below

    if (await sendStep(cfg, db, deps, p, RELATIONSHIP_STEPS.converse, STATUS.conversing)) budget--;
    await pause();
  }

  // 2. The hello, once they have accepted. Same day, never the same minute.
  //    Two lines, no question, nothing asked for.
  for (const p of await getProspects(db, STATUS.connected)) {
    if (budget <= 0) break;
    if (!isDue(p, PACING.acceptToHelloHours)) continue;
    if (await sendStep(cfg, db, deps, p, RELATIONSHIP_STEPS.hello, STATUS.helloSent)) budget--;
    await pause();
  }

  // 3. The real message. It goes to the people who answered the hello within
  //    hours, and to the people who did not after a few days. Silence is worth
  //    less than a reply, and it is still worth more than nothing.
  const answered = (await getProspects(db, STATUS.helloAnswered)).filter((p) =>
    isDue(p, PACING.helloReplyToIntroHours)
  );
  const quiet = (await getProspects(db, STATUS.helloSent)).filter((p) =>
    isDue(p, [
      PACING.helloSilenceToIntroDays[0] * 24,
      PACING.helloSilenceToIntroDays[1] * 24,
    ])
  );
  for (const p of [...answered, ...quiet]) {
    if (budget <= 0) break;
    if (await sendStep(cfg, db, deps, p, RELATIONSHIP_STEPS.intro, STATUS.introSent)) budget--;
    await pause();
  }

  // 4. The one ask. It goes to two groups: people who talked, and people who
  //    never answered the intro. The second group is the one every other tool
  //    gives up on, and a silent prospect has still had a message land.
  const talked = (await getProspects(db, STATUS.conversing)).filter(
    (p) => isDue(p, [PACING.conversationToAskDays[0] * 24, PACING.conversationToAskDays[1] * 24])
  );
  const silent = (await getProspects(db, STATUS.introSent)).filter(
    (p) => isDue(p, [PACING.silenceToAskDays[0] * 24, PACING.silenceToAskDays[1] * 24])
  );
  for (const p of [...talked, ...silent]) {
    if (budget <= 0) break;
    if (await sendStep(cfg, db, deps, p, RELATIONSHIP_STEPS.ask, STATUS.askSent)) budget--;
    await pause();
  }

  // 5. The ask was the last message. After a reply window the agent is done
  //    with that person, and nothing re-opens them.
  for (const p of await getProspects(db, STATUS.askSent, { olderThan: daysAgoIso(cfg.sequence.waitBetweenDmsDays) })) {
    await setProspectStatus(db, p.id, STATUS.handedOver);
  }
}

/** Writes, validates and sends one message step; records it and advances the status. */
/**
 * The one gate every outbound message passes, at every step.
 *
 * A floor was added to leadsAtStep on 2026-08-08 and reported as the fix for
 * writing to competitors. leadsAtStep is called by nothing: the sequence reads
 * its people through getProspects at all seven steps, so the floor filtered
 * exactly nothing and the competitors kept moving down the funnel.
 *
 * ZHANYA QIN is the proof. "Founder at GDPRChecker | Cookie Consent & Privacy
 * Readiness", scored 0 with the reason "Founder of a compliance/privacy tool",
 * against a customer whose product includes a cookie consent banner. The scorer
 * caught her perfectly. She still received a hello, answered it, and was
 * sitting at hello_answered waiting for the next message.
 *
 * So it goes here, in sendStep, which is the single funnel every hello, intro,
 * conversation turn and ask goes through. One place, and it cannot be
 * forgotten at the eighth step somebody adds later.
 *
 * Somebody who has already written back is handed to the customer rather than
 * dropped: a human took the trouble to answer and deserves a human reading it,
 * even when they can never buy. Everybody else is simply skipped.
 */
function tooWeakToWriteTo(cfg: Config, db: DB, p: ProspectRow): boolean {
  /**
   * The config comes in as an argument rather than off db.cfg.
   *
   * runSequence is handed both, and the sequence tests build a DB whose cfg is
   * a stub. Reading the ICP off db.cfg made the whole gate silently inert
   * there, which is the same shape of mistake as guarding leadsAtStep: a check
   * that looks right and is wired to nothing.
   */
  // An agent with no ICP never scores anybody, and gating on a score that will
  // never arrive would silence it completely.
  if (!cfg.leads?.icp) return false;
  const score = p.match_score;
  if (score === null || score === undefined) return true;
  return score < minimumScore(db.matchLevel);
}

async function sendStep(
  cfg: Config,
  db: DB,
  deps: SequenceDeps,
  p: ProspectRow,
  step: RelationshipStep,
  nextStatus: string
): Promise<boolean> {
  if (tooWeakToWriteTo(cfg, db, p)) {
    const answered = p.status === STATUS.helloAnswered || p.status === STATUS.conversing;
    await setProspectStatus(db, p.id, answered ? STATUS.handedOver : STATUS.skipped);
    log(
      answered
        ? `${label(p)} scored ${p.match_score} and has written back, so it goes to you rather than to the agent.`
        : `${label(p)} scored ${p.match_score}, below the line, so nothing is sent.`
    );
    return false;
  }

  const thread = await getThread(db, p.id);
  let message: GeneratedMessage;
  await announce(db, WRITING[step] ?? "writing to", subjectOf(p));
  try {
    message = await deps.writeMessage(p, step, thread);
  } catch (err) {
    await setProspectStatus(db, p.id, STATUS.skipped);
    log(`Skipping ${label(p)}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
  await announce(db, "sending a message to", subjectOf(p));
  const sent = await deps.actions.sendDm(p, message.body);
  if (!sent) {
    log(`${step} to ${label(p)} was not sent (action returned false).`);
    /**
     * A hello that cannot be delivered means they never accepted.
     *
     * On 2026-08-08 three prospects sat at connected and every hello to them
     * failed. Their profiles say "2nd" with a Pending invitation, and a free
     * account writing to a second-degree connection is answered by LinkedIn
     * with a Premium upsell rather than a composer, which is what "could not
     * open a conversation" was really reporting.
     *
     * Whatever put them there, believing it a second time costs a profile
     * visit and a compose attempt on every pass, for ever. So the belief is
     * dropped and they go back to waiting on the invitation, where the sweep
     * will promote them again the moment they genuinely appear in the
     * connections list, and the stale check will withdraw the invite if they
     * never do.
     *
     * Only the hello. Every later step follows a message that was delivered,
     * so a failure there is a different problem and must not be papered over
     * by rewinding somebody who is plainly connected.
     */
    if (step === RELATIONSHIP_STEPS.hello) {
      await revertProspectStatus(db, p.id, STATUS.connectSent);
      log(`${label(p)} goes back to waiting on the invitation: no conversation could be opened.`);
    }
    return false;
  }
  await recordMessage(db, p.id, step, message.body, message.angle, true);
  await recordAction(db, p.id, "dm", step);
  // A converse turn stays in the same state on purpose: the status says where
  // the relationship is, and the turn count in agent_messages is what bounds it.
  await setProspectStatus(db, p.id, nextStatus, message.angle);
  return true;
}

/** Warm up then connect, up to the day's ramped allowance and the weekly ceiling. */
async function sendNewConnects(
  cfg: Config,
  db: DB,
  deps: SequenceDeps,
  week: number,
  pause: () => Promise<void>,
): Promise<void> {
  const target = applyDailyVariance(dailyConnectAllowance(cfg, week, deps.accountDailyCap));
  const sentToday = await countActionsSince(db, "connect", dayAgoIso());
  const sentWeek = await countActionsSince(db, "connect", weekAgoIso());
  const budget = Math.max(0, Math.min(target - sentToday, cfg.limits.connectPerWeekMax - sentWeek));
  if (budget <= 0) return;

  /**
   * An invitation is spent on somebody worth writing to, or not spent.
   *
   * The score floor was added to leadsAtStep and this path never had one, so a
   * prospect the scorer had judged 0, including one it had flagged as a
   * competitor who can never buy, still received an invitation. Sixteen a day
   * is the scarcest thing the account has.
   *
   * Unscored leads wait for their score rather than being invited blind, except
   * on an agent with no ICP written down, which never scores anybody and would
   * otherwise never invite anybody either.
   */
  const scoring = Boolean(cfg.leads?.icp);
  const waiting = await getProspects(db, STATUS.queued, {
    limit: budget,
    minScore: minimumScore(db.matchLevel),
    requireScored: scoring,
  });

  for (const p of waiting) {
    await announce(db, "liking a post by", subjectOf(p));
    await deps.actions.warmUp(p); // best-effort; a missed like does not block the connect
    await pause();
    await announce(db, "sending an invitation to", subjectOf(p));
    /**
     * Three outcomes, three different answers. This read one boolean.
     *
     * Measured on a live pass on 2026-08-10: of thirteen attempts, eleven came
     * back false. Six were profiles with no Connect control at all, which will
     * never change, and five already had an invitation pending from an earlier
     * pass. All eleven stayed queued and were tried again on the next pass, and
     * every pass after that, which is why the customer had been looking at the
     * same names in Today's queue since the agent started. Two real invitations
     * a day were going out against an allowance of sixteen.
     */
    const outcome = await deps.actions.sendConnect(p, "");

    if (outcome === "cannot-connect") {
      /**
       * No Connect control means one of two opposite things, and this treated
       * them as the same one.
       *
       * Follow-only profiles have no Connect and never will, so letting them go
       * is right. But somebody who is ALREADY a first-degree connection has no
       * Connect either, for the best possible reason, and they were being
       * marked skipped and never spoken to again. That is the warmest lead the
       * product can find: they engaged with the customer's own post and the two
       * are already connected, so there is nothing to wait for at all.
       *
       * canMessageNow reads the degree off the topcard, which is the same check
       * that decides whether a DM may be sent, so the two can never disagree.
       */
      const reachable = await deps.actions.canMessageNow(p).catch(() => false);
      if (reachable) {
        await setProspectStatus(db, p.id, STATUS.connected);
        log(`${label(p)} is already connected, so the agent skips the invitation and writes to them.`);
        await pause();
        continue;
      }
      // Retrying a follow-only profile costs a profile visit a pass for
      // nothing, so the queue lets them go and says why on the row.
      await setProspectStatus(db, p.id, STATUS.skipped);
      log(`${label(p)} cannot be invited: LinkedIn offers no Connect on that profile.`);
      await pause();
      continue;
    }

    if (outcome === "already-pending") {
      // An invitation is out there and only our record of it was lost. Moving
      // them on lets sweepAcceptances watch for the acceptance and the stale
      // check withdraw it, neither of which can happen while they sit queued.
      // No action is recorded: nothing was sent today.
      await setProspectStatus(db, p.id, STATUS.connectSent);
      log(`${label(p)} already had an invitation pending, so the record is caught up.`);
      await pause();
      continue;
    }

    if (outcome !== "sent") {
      await pause();
      continue;
    }
    await recordAction(db, p.id, "connect", p.profile_url);
    // Members with Open Profile can be messaged without being connected, so there is nothing to wait
    // for: they go straight into the messaging track and are written to on the next pass.
    const open = await deps.actions.canMessageNow(p).catch(() => false);
    await setProspectStatus(db, p.id, open ? STATUS.connected : STATUS.connectSent);
    if (open) log(`${label(p)} has an open profile: messaging without waiting for the invite.`);
    await pause();
  }
}

/** Warm-up week index, seeding the start timestamp on the first run. */
async function currentWarmupWeek(db: DB): Promise<number> {
  return warmupWeekIndex(await accountWarmupStart(db));
}
