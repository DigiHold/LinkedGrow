/**
 * How hard an agent is allowed to push, today.
 *
 * This mirrors `dailyConnectAllowance` in the worker's safety envelope
 * (linkedgrow-worker/src/safety/envelope.ts) and has to keep mirroring it. The
 * dashboard used to print the account's ceiling wherever it needed a number, so
 * an agent in the first week of its warm-up was described as sending 8
 * invitations a day while it was really sending 5, and the queue listed 8
 * people as "today" when only 5 of them were going anywhere.
 *
 * Three limits, answering three different questions, and the smallest wins:
 * our own ramp, LinkedIn's weekly allowance spread over the days the agent
 * works, and whatever per-day ceiling this account's tier carries.
 */

/** LinkedIn's own weekly ceiling on a free or Premium account, checked 2026-08-01. */
export const WEEKLY_INVITE_CEILING = 100;

/**
 * The ramp when an agent sets no override of its own.
 *
 * These have to equal DEFAULTS.warmup in linkedgrow-worker/src/config.ts. They
 * are the one thing on this page that is not read from the row, so when the
 * worker's ramp changed and these did not, an agent running at 10 a day was
 * described here as running at 5. The same class of bug as keeping the warm-up
 * start in two tables.
 */
export const RAMP = { startPerDay: 15, incrementPerWeek: 5, weeks: 2 } as const;

export type PaceInput = {
  warmupStartPerDay: number | null;
  warmupIncrementPerWeek: number | null;
  warmupWeeks: number | null;
  workdayDays: string;
  dailyInviteCap: number;
};

export function workingDays(raw: string): number[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((d): d is number => typeof d === "number")
      : [1, 2, 3, 4, 5];
  } catch {
    return [1, 2, 3, 4, 5];
  }
}

/** Which week of the ramp an account is in, 1-based. Null before it starts. */
export function warmupWeek(
  startedAt: Date | string | null,
  weeks: number
): { week: number; of: number } | null {
  if (!startedAt) return null;
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return null;
  const week = Math.max(1, Math.floor((Date.now() - started) / (7 * 86_400_000)) + 1);
  return week > weeks ? null : { week, of: weeks };
}

/** Invitations a day allowed in a given week of the ramp. */
export function dayPace(agent: PaceInput, week: number): number {
  const start = agent.warmupStartPerDay ?? RAMP.startPerDay;
  const step = agent.warmupIncrementPerWeek ?? RAMP.incrementPerWeek;
  const weeks = Math.max(1, agent.warmupWeeks ?? RAMP.weeks);
  const ramp = start + Math.min(Math.max(0, week - 1), weeks - 1) * step;
  const days = Math.max(1, workingDays(agent.workdayDays).length);
  return Math.max(
    0,
    Math.min(ramp, Math.floor(WEEKLY_INVITE_CEILING / days), agent.dailyInviteCap)
  );
}

/** What the agent may send today, given where its account is in the ramp. */
export function todaysPace(
  agent: PaceInput,
  warmupStartedAt: Date | string | null
): number {
  const weeks = Math.max(1, agent.warmupWeeks ?? RAMP.weeks);
  const ramp = warmupWeek(warmupStartedAt, weeks);
  return dayPace(agent, ramp ? ramp.week : weeks);
}
