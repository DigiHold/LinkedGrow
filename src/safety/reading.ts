import { db } from "../db.ts";
import { log } from "../logger.ts";

/**
 * What an account is allowed to READ in a day.
 *
 * Everything else in this folder counts what the account sends. Nothing counted
 * what it reads, and on 2026-08-08 that is what got an account restricted:
 * "we detected that over time, it has accessed an unusually high volume of
 * LinkedIn profile data". Not one invitation was involved. Fifteen had gone out
 * in total, against a ceiling of a hundred a week.
 *
 * What had gone out of control was sourcing. Two sources a pass, four to eight
 * posts opened, their reaction and comment lists expanded, up to 25 people read
 * from each, and the pass ran every few minutes: 56 to 75 passes on the days
 * before the restriction, which is on the order of a hundred searches a day and
 * thousands of profile records.
 *
 * The ceilings below are the ones the tooling industry converges on, checked
 * 2026-08-08. LinkedIn publishes none of them.
 *
 *   free              80 profile views a day, and a commercial use limit of
 *                     roughly 250 to 350 searches a month
 *   premium           150 a day, and the same monthly search limit: Premium
 *                     does not lift it
 *   sales navigator   150 a day on linkedin.com, far more inside Sales
 *                     Navigator itself, and no commercial use limit
 *
 * What this module allows is deliberately under those, because they are the
 * line at which accounts get restricted rather than a target to aim at, and
 * because a restriction lands on the customer's own account rather than on us.
 */

export type AccountTier = "free" | "premium" | "sales_navigator";

export interface ReadBudget {
  /** Profile records read: a search row, a reaction, a commenter, all of them. */
  profilesPerDay: number;
  /** Searches opened. The monthly commercial use limit divided into days. */
  searchesPerDay: number;
}

const BUDGETS: Record<AccountTier, ReadBudget> = {
  // 240 searches a month against a limit of 250 to 350, and 60 profiles a day
  // against 80. Both leave room for the customer's own browsing on the account.
  free: { profilesPerDay: 60, searchesPerDay: 8 },
  // Premium doubles the profile allowance and changes nothing about search.
  premium: { profilesPerDay: 110, searchesPerDay: 8 },
  // No commercial use limit, and the higher view ceiling.
  sales_navigator: { profilesPerDay: 400, searchesPerDay: 30 },
};

export function budgetFor(tier: AccountTier): ReadBudget {
  return BUDGETS[tier] ?? BUDGETS.free;
}

export function tierOf(value: string | null | undefined): AccountTier {
  return value === "premium" || value === "sales_navigator" ? value : "free";
}

/** The account's own day, so a budget resets at midnight where the person lives. */
function today(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export interface Spent {
  profiles: number;
  searches: number;
}

export async function spentToday(accountId: string, timeZone: string): Promise<Spent> {
  const { rows } = await db().execute({
    sql: `SELECT profiles, searches FROM account_reading
           WHERE linkedin_account_id = ? AND day = ?`,
    args: [accountId, today(timeZone)],
  });
  const row = rows[0];
  return {
    profiles: Number(row?.profiles ?? 0),
    searches: Number(row?.searches ?? 0),
  };
}

/**
 * Books what a pass is about to read, before it reads it.
 *
 * Booked in advance rather than counted afterwards, because a pass that dies
 * halfway has still opened the pages, and a counter that only credits finished
 * work lets a crash loop read all day for free.
 */
export async function book(
  accountId: string,
  timeZone: string,
  cost: Partial<Spent>
): Promise<void> {
  const day = today(timeZone);
  await db().execute({
    sql: `INSERT INTO account_reading (linkedin_account_id, day, profiles, searches, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(linkedin_account_id, day) DO UPDATE SET
            profiles = profiles + excluded.profiles,
            searches = searches + excluded.searches,
            updated_at = excluded.updated_at`,
    args: [accountId, day, cost.profiles ?? 0, cost.searches ?? 0, Math.floor(Date.now() / 1000)],
  });
}

export interface ReadingRoom {
  ok: boolean;
  /** How many profile records are still allowed today. Zero when spent. */
  profiles: number;
  searches: number;
  reason: string | null;
}

/**
 * Whether there is room to read at all, and how much.
 *
 * The caller shrinks its own plan to fit rather than being refused outright,
 * so an account near its ceiling still brings back a few people instead of
 * nothing at all.
 */
export async function roomToRead(
  accountId: string,
  tier: AccountTier,
  timeZone: string
): Promise<ReadingRoom> {
  const budget = budgetFor(tier);
  const spent = await spentToday(accountId, timeZone);
  const profiles = Math.max(0, budget.profilesPerDay - spent.profiles);
  const searches = Math.max(0, budget.searchesPerDay - spent.searches);

  if (searches <= 0) {
    return { ok: false, profiles, searches: 0, reason: "the searches for today are spent" };
  }
  if (profiles <= 0) {
    return { ok: false, profiles: 0, searches, reason: "the reading allowance for today is spent" };
  }
  return { ok: true, profiles, searches, reason: null };
}

/** Says once a day, in the log, where an account stands against its ceiling. */
export function reportReading(accountId: string, tier: AccountTier, spent: Spent): void {
  const budget = budgetFor(tier);
  log("reading so far today", {
    accountId,
    tier,
    profiles: `${spent.profiles}/${budget.profilesPerDay}`,
    searches: `${spent.searches}/${budget.searchesPerDay}`,
  });
}
