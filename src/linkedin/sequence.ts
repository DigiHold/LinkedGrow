import type { Config } from "../config.ts";
import { log } from "../logger.ts";
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
      if (shouldHandOver(step, thread)) {
        await setProspectStatus(db, p.id, STATUS.handedOver);
        await deps.notify(`${label(p)} replied and it needs you. Over to you: ${p.profile_url}`);
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
  let budget = cfg.limits.dmPerDayMax - await countActionsSince(db, "dm", dayAgoIso());
  if (budget <= 0) return;

  // 1. Answer the people who wrote back, up to the cap on how many times the
  //    agent will answer before it has to come to the point.
  for (const p of await getProspects(db, STATUS.conversing)) {
    if (budget <= 0) break;
    if (!isDue(p, [PACING.replyDelayMinutes[0] / 60, PACING.replyDelayMinutes[1] / 60])) continue;

    const turns = await countOutboundStep(db, p.id, RELATIONSHIP_STEPS.converse);
    if (turns >= PACING.maxConverseTurns) continue; // the ask picks them up below

    if (await sendStep(db, deps, p, RELATIONSHIP_STEPS.converse, STATUS.conversing)) budget--;
    await pause();
  }

  // 2. The hello, once they have accepted. Same day, never the same minute.
  //    Two lines, no question, nothing asked for.
  for (const p of await getProspects(db, STATUS.connected)) {
    if (budget <= 0) break;
    if (!isDue(p, PACING.acceptToHelloHours)) continue;
    if (await sendStep(db, deps, p, RELATIONSHIP_STEPS.hello, STATUS.helloSent)) budget--;
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
    if (await sendStep(db, deps, p, RELATIONSHIP_STEPS.intro, STATUS.introSent)) budget--;
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
    if (await sendStep(db, deps, p, RELATIONSHIP_STEPS.ask, STATUS.askSent)) budget--;
    await pause();
  }

  // 5. The ask was the last message. After a reply window the agent is done
  //    with that person, and nothing re-opens them.
  for (const p of await getProspects(db, STATUS.askSent, { olderThan: daysAgoIso(cfg.sequence.waitBetweenDmsDays) })) {
    await setProspectStatus(db, p.id, STATUS.handedOver);
  }
}

/** Writes, validates and sends one message step; records it and advances the status. */
async function sendStep(
  db: DB,
  deps: SequenceDeps,
  p: ProspectRow,
  step: RelationshipStep,
  nextStatus: string
): Promise<boolean> {
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

  for (const p of await getProspects(db, STATUS.queued, { limit: budget })) {
    await announce(db, "liking a post by", subjectOf(p));
    await deps.actions.warmUp(p); // best-effort; a missed like does not block the connect
    await pause();
    await announce(db, "sending an invitation to", subjectOf(p));
    const sent = await deps.actions.sendConnect(p, "");
    if (!sent) {
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
