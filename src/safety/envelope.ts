import type { Config } from "../config.ts";

/** Day of week (1=Mon..7=Sun) and hour (0..23) in the given timezone. */
export function tzClock(tz: string, at: Date = new Date()): { weekday: number; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, weekday: "short", hour: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0; // some locales render midnight as 24
  return { weekday: map[parts.weekday ?? ""] ?? 0, hour };
}

export function isWithinBusinessHours(cfg: Config, at: Date = new Date()): boolean {
  const { weekday, hour } = tzClock(cfg.account.timezone, at);
  return (
    cfg.businessHours.days.includes(weekday) &&
    hour >= cfg.businessHours.startHour &&
    hour < cfg.businessHours.endHour
  );
}

/**
 * There is deliberately no sourcing window here any more.
 *
 * There used to be one, reading 07:00 to 23:00, on the reasoning that sourcing
 * is mostly reading and reading is the safe half. The reasoning was right and
 * the conclusion was wrong: sixteen hours of availability multiplied by a
 * five-minute loop is 189 passes a day at five and six minute intervals, and on
 * 2026-08-08 LinkedIn restricted a customer's account for exactly that. The
 * account had sent fifteen invitations in its life.
 *
 * A window says when an account MAY act. What it never said is how often, and
 * that is the number LinkedIn reads. safety/rhythm.ts answers both at once by
 * planning a handful of irregular visits a day, so the replacement for this is
 * currentVisit, not a wider or narrower pair of hours.
 */

/** 0-based warm-up week since the first enabled run. */
export function warmupWeekIndex(startedAt: Date, now: Date = new Date()): number {
  const days = Math.floor((now.getTime() - startedAt.getTime()) / 86_400_000);
  return Math.max(0, Math.floor(days / 7));
}

/** How many connection requests are allowed today, given the warm-up ramp and weekly ceiling. */
export function dailyConnectAllowance(
  cfg: Config,
  weekIndex: number,
  /**
   * What LinkedIn itself allows this account per day, detected from its tier.
   *
   * It was read from the database into every agent's context and then used nowhere, so an account
   * LinkedIn had put on a tight ceiling was invited to ignore it. The lowest of the three limits
   * wins, because they answer different questions and only the smallest is safe.
   */
  accountDailyCap?: number
): number {
  const w = Math.min(weekIndex, Math.max(0, cfg.warmup.weeks - 1));
  const ramp = cfg.warmup.startPerDay + w * cfg.warmup.incrementPerWeek;
  const workDays = Math.max(1, cfg.businessHours.days.length);
  const weeklyDailyCap = Math.floor(cfg.limits.connectPerWeekMax / workDays);
  const ceilings = [ramp, weeklyDailyCap];
  if (typeof accountDailyCap === "number" && accountDailyCap > 0) ceilings.push(accountDailyCap);
  return Math.max(0, Math.min(...ceilings));
}

/** Adds +/-20% so the daily number is never identical two days in a row. */
export function applyDailyVariance(n: number): number {
  if (n <= 0) return 0;
  const factor = 0.8 + Math.random() * 0.4;
  return Math.max(1, Math.round(n * factor));
}

/** Randomized delay between two actions, in milliseconds. */
export function actionDelayMs(cfg: Config): number {
  const { minAction, maxAction } = cfg.delaysMs;
  return minAction + Math.random() * (maxAction - minAction);
}

export function acceptanceRate(connectSent: number, connected: number): number {
  if (connectSent <= 0) return 1;
  return connected / connectSent;
}

// There is deliberately no acceptance-rate circuit breaker. Acceptances arrive days after an invite,
// so any early rate reads as near zero and would pause a perfectly healthy account. Pending-invite
// volume is what LinkedIn actually penalises, and the sequence handles that by withdrawing invites
// that stay unanswered. The rate stays available above purely as a reporting number.
