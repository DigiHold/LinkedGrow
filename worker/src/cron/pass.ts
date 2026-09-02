import { log, logError } from "../logger.ts";
import { instance } from "../instance.ts";
import { EDITION } from "../edition.ts";

export interface CronJob {
  path: string;
  everyMs: number;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** What QStash does for the cloud, done here for a self hosted install. */
export const SCHEDULE: CronJob[] = [
  { path: "/api/cron/agent-alerts", everyMs: 15 * MIN },
  { path: "/api/cron/leads-digest", everyMs: 7 * DAY },
  { path: "/api/cron/proxy-watchdog", everyMs: DAY },
  { path: "/api/cron/selector-health", everyMs: DAY },
  { path: "/api/cron/cleanup-media", everyMs: DAY },
];

export function dueJobs(lastRun: Record<string, number>, now: number): CronJob[] {
  return SCHEDULE.filter((j) => now - (lastRun[j.path] ?? 0) >= j.everyMs);
}

/** Where the app answers from inside the same install; the public origin is the fallback. */
export async function appBaseUrl(): Promise<string> {
  const i = await instance();
  return (process.env.APP_INTERNAL_URL || i.appUrl || "http://app:3000").replace(/\/+$/, "");
}

const lastRun: Record<string, number> = {};

/** One tick: call every due route on the app with the instance secret. Failures are logged and retried next tick. */
export async function cronPass(fetchImpl: typeof fetch = fetch): Promise<void> {
  if (EDITION !== "self-hosted") return;
  const i = await instance();
  if (!i.cronSecret) {
    log("cron pass skipped: no cron secret in instance settings yet");
    return;
  }
  const base = await appBaseUrl();
  for (const job of dueJobs(lastRun, Date.now())) {
    try {
      const res = await fetchImpl(`${base}${job.path}`, {
        method: "POST",
        headers: { "x-linkedgrow-cron": i.cronSecret, "content-type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`answered ${res.status}`);
      lastRun[job.path] = Date.now();
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
