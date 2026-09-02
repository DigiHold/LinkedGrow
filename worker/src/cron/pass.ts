import { db } from "../db.ts";
import { log, logError } from "../logger.ts";
import { instance } from "../instance.ts";
import { EDITION } from "../edition.ts";
import { notifyOps } from "../notify.ts";
import { renewProxiesPass } from "../tools/renew-proxies.ts";
import { balanceTopupPass } from "../tools/balance-topup.ts";

/** Sunday is 0, the way `Date` counts. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CronJob {
  path: string;
  /** Due again this long after the last run. */
  everyMs?: number;
  /** Due once a week, from this hour of this weekday in the instance timezone. */
  weekly?: { weekday: Weekday; hour: number };
  /** Runs inside the worker instead of calling the app. Needs the proxy supplier key. */
  run?: () => Promise<unknown>;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * What QStash does for the cloud, done here for a self hosted install. The
 * two worker: entries are what cron.d runs on the cloud box: the supplier's
 * API is reached from the worker, never from the app. The digest goes out on
 * Monday morning in the instance's own timezone rather than seven days after
 * whenever the worker last happened to start.
 */
export const SCHEDULE: CronJob[] = [
  { path: "/api/cron/agent-alerts", everyMs: 15 * MIN },
  { path: "/api/cron/leads-digest", weekly: { weekday: 1, hour: 8 } },
  { path: "/api/cron/proxy-watchdog", everyMs: DAY },
  { path: "/api/cron/selector-health", everyMs: DAY },
  { path: "/api/cron/cleanup-media", everyMs: DAY },
  { path: "worker:renew-proxies", everyMs: DAY, run: renewProxiesPass },
  { path: "worker:balance-topup", everyMs: DAY, run: balanceTopupPass },
];

interface LocalTime {
  weekday: Weekday;
  /** Days since the epoch of the local calendar date. */
  day: number;
  hour: number;
}

const WEEKDAYS: Record<string, Weekday> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** The wall clock at `at` in `timeZone`; an unknown zone reads as UTC rather than stopping the loop. */
export function localTime(at: number, timeZone: string): LocalTime {
  let format: Intl.DateTimeFormat;
  try {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return localTime(at, "UTC");
  }
  const parts: Record<string, string> = {};
  for (const part of format.formatToParts(new Date(at))) parts[part.type] = part.value;
  const hour = Number(parts.hour) % 24;
  const day = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / DAY;
  return { weekday: WEEKDAYS[parts.weekday ?? ""] ?? 0, day, hour };
}

/**
 * The local date on which the weekly window containing `at` opened. A Monday
 * before 08:00 still belongs to the week before, so a digest that went out
 * last Monday morning is not sent again at 07:59 the next.
 */
function weekOf(at: number, timeZone: string, weekly: NonNullable<CronJob["weekly"]>): number {
  const local = localTime(at, timeZone);
  let back = (local.weekday - weekly.weekday + 7) % 7;
  if (back === 0 && local.hour < weekly.hour) back = 7;
  return local.day - back;
}

function isDue(job: CronJob, last: number | undefined, now: number, timeZone: string): boolean {
  if (job.weekly) {
    const local = localTime(now, timeZone);
    if (local.weekday !== job.weekly.weekday || local.hour < job.weekly.hour) return false;
    return last === undefined || weekOf(last, timeZone, job.weekly) !== weekOf(now, timeZone, job.weekly);
  }
  return now - (last ?? 0) >= (job.everyMs ?? 0);
}

export function dueJobs(lastRun: Record<string, number>, now: number, timezone = "UTC"): CronJob[] {
  return SCHEDULE.filter((j) => isDue(j, lastRun[j.path], now, timezone));
}

const FLAG_PREFIX = "cron-last-run:";

/**
 * The last run of every job, as the previous process left it. Kept in
 * `worker_flags` so a restart carries on from where the schedule was, instead
 * of firing every job on its first tick and mailing the weekly digest again.
 */
export async function loadLastRuns(): Promise<Record<string, number>> {
  const { rows } = await db().execute({
    sql: `SELECT key, value FROM worker_flags WHERE key LIKE ?`,
    args: [`${FLAG_PREFIX}%`],
  });
  const runs: Record<string, number> = {};
  for (const row of rows) {
    const at = Number(row.value);
    if (typeof row.key === "string" && Number.isFinite(at) && at > 0) runs[row.key.slice(FLAG_PREFIX.length)] = at;
  }
  return runs;
}

export async function saveLastRun(path: string, at: number): Promise<void> {
  await db().execute({
    sql: `INSERT INTO worker_flags (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [`${FLAG_PREFIX}${path}`, String(at), Math.floor(at / 1000)],
  });
}

/** Where the app answers from inside the same install; the public origin is the fallback. */
export async function appBaseUrl(): Promise<string> {
  const i = await instance();
  return (process.env.APP_INTERNAL_URL || i.appUrl || "http://app:3000").replace(/\/+$/, "");
}

let lastRun: Record<string, number> | null = null;

/** Marks the job run now, in memory first so a flag write that fails cannot make it fire twice. */
async function markRun(runs: Record<string, number>, path: string): Promise<void> {
  const at = Date.now();
  runs[path] = at;
  try {
    await saveLastRun(path, at);
  } catch (error) {
    logError("cron last run not persisted", error, { path });
  }
}

/**
 * One tick: call every due route on the app with the instance secret, and run
 * the in process jobs. A route failure is logged and retried next tick. An in
 * process job is daily whatever happens, like its cron.d twin: a failure is
 * logged and mailed, and the next try is tomorrow rather than in a minute
 * against the supplier's API.
 */
export async function cronPass(fetchImpl: typeof fetch = fetch): Promise<void> {
  if (EDITION !== "self-hosted") return;
  const i = await instance();
  if (!i.cronSecret) {
    log("cron pass skipped: no cron secret in instance settings yet");
    return;
  }
  const runs = (lastRun ??= await loadLastRuns());
  const base = await appBaseUrl();
  for (const job of dueJobs(runs, Date.now(), i.timezone ?? "UTC")) {
    if (job.run) {
      await markRun(runs, job.path);
      if (!i.proxySellerKey) {
        log("cron job skipped: no proxy supplier key in instance settings", { path: job.path });
        continue;
      }
      try {
        await job.run();
        log("cron job done", { path: job.path });
      } catch (error) {
        logError("cron job failed", error, { path: job.path });
        await notifyOps(`Worker job ${job.path} failed`, [String(error)]);
      }
      continue;
    }
    try {
      const res = await fetchImpl(`${base}${job.path}`, {
        method: "POST",
        headers: { "x-linkedgrow-cron": i.cronSecret, "content-type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`answered ${res.status}`);
      await markRun(runs, job.path);
      log("cron job done", { path: job.path });
    } catch (error) {
      logError("cron job failed", error, { path: job.path });
    }
  }
}

/** Ticks every minute until asked to stop; each tick only calls what is due. */
export async function cronLoop(sleep: (ms: number) => Promise<void>, stopping: () => boolean = () => false): Promise<void> {
  for (;;) {
    if (stopping()) return;
    try {
      await cronPass();
    } catch (error) {
      logError("cron pass failed", error);
    }
    await sleep(MIN);
  }
}
