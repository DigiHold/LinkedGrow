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
 * The wider window sourcing is allowed to run in.
 *
 * Plan section 6: sourcing and scoring are mostly reading, so they run on a
 * wider window than outreach, which writes and must stay inside a human
 * schedule. Wider is not unlimited: an account that reads LinkedIn at 3am when
 * it never otherwise does is its own signal, so this is an extended day rather
 * than the clock.
 *
 * It matters most on the first evening. A customer who finishes the wizard at
 * 9pm should see their agent finding people within minutes, not the following
 * morning, and reading is the half that can honestly deliver that.
 */
const SOURCING_START_HOUR = 7;
const SOURCING_END_HOUR = 23;

export function isWithinSourcingHours(cfg: Config, at: Date = new Date()): boolean {
  const { hour } = tzClock(cfg.account.timezone, at);
  return hour >= SOURCING_START_HOUR && hour < SOURCING_END_HOUR;
}

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
