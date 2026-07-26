import type { Config } from "../config.ts";
import { log } from "../logger.ts";
import { sleep } from "../browser/human.ts";
import type { LinkedInActions } from "./actions.ts";
import type { GeneratedMessage, Step } from "../messages/generate.ts";
import {
  type DB,
  type ProspectRow,
  getProspects,
  setProspectStatus,
  recordMessage,
  recordAction,
  countActionsSince,
  countProspectsByStatus,
  getMeta,
  setMeta,
} from "../store.ts";
import {
  warmupWeekIndex,
  dailyConnectAllowance,
  applyDailyVariance,
  actionDelayMs,
} from "../safety/envelope.ts";
import { dayAgoIso, weekAgoIso, epochIso } from "../time.ts";

/** The prospect lifecycle. Transitions only ever move forward, which caps DMs at two by construction. */
export const STATUS = {
  queued: "queued",
  connectSent: "connect_sent",
  connected: "connected",
  dm1Sent: "dm1_sent",
  dm2Sent: "dm2_sent",
  replied: "replied",
  stopped: "stopped",
  skipped: "skipped",
} as const;

/** Invites still unaccepted after this many days are given up on (stale-invite handling). */
const STALE_CONNECT_DAYS = 21;

export interface SequenceDeps {
  actions: LinkedInActions;
  /** Writes a validated message for a prospect and step (wired to the generator; faked in tests). */
  writeMessage: (p: ProspectRow, step: Step) => Promise<GeneratedMessage>;
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

/**
 * One bounded work pass: detect replies first, advance accepted invites to DMs, then send new
 * connects within the day's allowance. Every state change is forward-only, so a prospect can never
 * receive more than two DMs and any reply hands the thread to Nicolas and stops the sequence.
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
  await detectReplies(db, deps, pause);
  await sweepAcceptances(cfg, db, deps, pause);
  await advanceDms(cfg, db, deps, pause);
  await sendNewConnects(cfg, db, deps, week, pause);
}

/**
 * Any inbound reply stops the sequence for that prospect and alerts Nicolas. Runs first, always.
 * Reads the messaging inbox once and matches the repliers against active prospects by name, rather
 * than visiting each prospect's profile.
 */
async function detectReplies(db: DB, deps: SequenceDeps, pause: () => Promise<void>): Promise<void> {
  const repliers = await deps.actions.inboxRepliers();
  if (repliers.length === 0) return;
  const replied = new Set(repliers.map((n) => n.trim().toLowerCase()));
  const active = [STATUS.connected, STATUS.dm1Sent, STATUS.dm2Sent];
  for (const status of active) {
    for (const p of await getProspects(db, status)) {
      const name = (p.full_name ?? "").trim().toLowerCase();
      if (name && replied.has(name)) {
        await setProspectStatus(db, p.id, STATUS.replied);
        await recordAction(db, p.id, "reply", p.profile_url);
        await deps.notify(`${label(p)} replied. Over to you: ${p.profile_url}`);
        await pause();
      }
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

/** DM1 for freshly connected prospects, then DM2 for those who never replied, within the daily DM cap. */
async function advanceDms(cfg: Config, db: DB, deps: SequenceDeps, pause: () => Promise<void>): Promise<void> {
  let budget = cfg.limits.dmPerDayMax - await countActionsSince(db, "dm", dayAgoIso());
  if (budget <= 0) return;

  for (const p of await getProspects(db, STATUS.connected)) {
    if (budget <= 0) break;
    if (await sendStep(db, deps, p, "dm1", STATUS.dm1Sent)) budget--;
    await pause();
  }

  const due = await getProspects(db, STATUS.dm1Sent, { olderThan: daysAgoIso(cfg.sequence.waitBetweenDmsDays) });
  for (const p of due) {
    if (budget <= 0) break;
    if (await sendStep(db, deps, p, "dm2", STATUS.dm2Sent)) budget--;
    await pause();
  }

  // After DM2 and a reply window, the sequence is complete with no reply.
  for (const p of await getProspects(db, STATUS.dm2Sent, { olderThan: daysAgoIso(cfg.sequence.waitBetweenDmsDays) })) {
    await setProspectStatus(db, p.id, STATUS.stopped);
  }
}

/** Writes, validates and sends one message step; records it and advances the status. */
async function sendStep(db: DB, deps: SequenceDeps, p: ProspectRow, step: Step, nextStatus: string): Promise<boolean> {
  let message: GeneratedMessage;
  try {
    message = await deps.writeMessage(p, step);
  } catch (err) {
    await setProspectStatus(db, p.id, STATUS.skipped);
    log(`Skipping ${label(p)}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
  const sent = await deps.actions.sendDm(p, message.body);
  if (!sent) {
    log(`${step} to ${label(p)} was not sent (action returned false).`);
    return false;
  }
  await recordMessage(db, p.id, step, message.body, message.angle, true);
  await recordAction(db, p.id, "dm", step);
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
  const target = applyDailyVariance(dailyConnectAllowance(cfg, week));
  const sentToday = await countActionsSince(db, "connect", dayAgoIso());
  const sentWeek = await countActionsSince(db, "connect", weekAgoIso());
  const budget = Math.max(0, Math.min(target - sentToday, cfg.limits.connectPerWeekMax - sentWeek));
  if (budget <= 0) return;

  for (const p of await getProspects(db, STATUS.queued, { limit: budget })) {
    await deps.actions.warmUp(p); // best-effort; a missed like does not block the connect
    await pause();
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
  let startedAt = await getMeta(db, "warmup_started_at");
  if (!startedAt) {
    startedAt = new Date().toISOString();
    await setMeta(db, "warmup_started_at", startedAt);
  }
  return warmupWeekIndex(new Date(startedAt));
}
