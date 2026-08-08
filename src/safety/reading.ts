import { db } from "../db.ts";
import { log } from "../logger.ts";

/**
 * What an account is allowed to READ, and why the shape of this matters more
 * than the numbers in it.
 *
 * Everything else in this folder counts what an account sends. Nothing counted
 * what it reads, and reading is what got an account restricted on 2026-08-08:
 * "we detected that over time, it has accessed an unusually high volume of
 * LinkedIn profile data". Fifteen invitations had gone out in that account's
 * life, against a ceiling of a hundred a week. The outreach was never the
 * problem.
 *
 * The first version of this file capped profiles per day at a flat 60, taken
 * from the "80 a day on a free account" that every automation blog repeats.
 * That number is the wrong shape, and LinkedIn's own help page says so.
 *
 * What LinkedIn actually operates is the **commercial use limit**: one pooled
 * monthly counter, reset at midnight PST on the 1st, fed by "searching for
 * LinkedIn profiles", "browsing profiles using the People Also Viewed section"
 * and "viewing member profiles on the People tab of Pages". Searching and
 * viewing share one allowance rather than having a cap each. LinkedIn states
 * plainly that it will not say what the number is: "We are not able to display
 * the exact number of searches or views you have left." Premium Business,
 * Recruiter Lite and Sales Navigator raise it, and some Premium tiers do not.
 *
 * That is why a person can open eighty profiles in an afternoon and never hear
 * about it. The counter is monthly, most of what a person opens is inside their
 * own network, and the warnings appear long before anything is enforced. A tool
 * gets none of that: LinkedIn's other help page warns that third-party plug-ins
 * "may run searches and view profiles in the background, which can cause you to
 * surpass the limit without actually seeing any of the incremental warnings".
 *
 * So the model here is a **monthly pool with a daily pace**, not a daily cap:
 *
 *   - a month's allowance per tier, spent by searches and by profile reads
 *     together, because LinkedIn pools them
 *   - a day may spend at most a share of what is left, so a single day cannot
 *     empty the month and the account never shows a spike
 *   - the pace grows with the account's age, because a profile that has done
 *     this for two months is read differently from one that started yesterday
 *
 * The monthly numbers are an estimate. LinkedIn publishes none, the figure
 * repeated across the industry for a free account is 250 to 350 actions, and
 * these sit under the bottom of that. They are the floor of a range, chosen so
 * that being wrong costs a slower month rather than a customer's account.
 */

export type AccountTier = "free" | "premium" | "sales_navigator";

export interface ReadBudget {
  /** Searches and non-connection profile reads together, per calendar month. */
  actionsPerMonth: number;
  /** The most one day may take out of the month, as a share of what is left. */
  dailyShare: number;
  /** A floor, so a nearly empty month still brings somebody back. */
  minPerDay: number;
}

const BUDGETS: Record<AccountTier, ReadBudget> = {
  // Under the 250 that the industry puts at the bottom of the free range.
  free: { actionsPerMonth: 200, dailyShare: 0.08, minPerDay: 10 },
  // Premium Business and Recruiter Lite raise the allowance. By how much is not
  // published, so this is deliberately timid: twice the free pool, not ten times.
  premium: { actionsPerMonth: 450, dailyShare: 0.08, minPerDay: 20 },
  // Sales Navigator removes the commercial use limit for people search. The
  // ceiling that remains is the anti-scraping detector, which is about pattern
  // rather than a number, so this stays a pace rather than becoming unlimited.
  sales_navigator: { actionsPerMonth: 3000, dailyShare: 0.08, minPerDay: 60 },
};

/**
 * What one day may spend: a share of what the month has left, never less than
 * the floor, and never more than the whole remainder.
 *
 * A share rather than a fixed daily number is what keeps the shape human. An
 * account that has been quiet has more to spend and spends it gradually; one
 * that has been busy slows down on its own, without anybody deciding to.
 */
export function dayAllowance(tier: AccountTier, spentThisMonth: number, ageDays: number): number {
  const budget = budgetFor(tier);
  const left = Math.max(0, budget.actionsPerMonth - spentThisMonth);
  if (left <= 0) return 0;
  // A new account reads less, and reaches its full pace over three weeks.
  const ramp = Math.min(1, 0.35 + (Math.max(0, ageDays) / 21) * 0.65);
  const share = Math.floor(left * budget.dailyShare * ramp);
  return Math.max(0, Math.min(left, Math.max(budget.minPerDay, share)));
}

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

/** Everything spent this calendar month, which is the pool LinkedIn counts. */
export async function spentThisMonth(accountId: string, timeZone: string): Promise<number> {
  const month = today(timeZone).slice(0, 7);
  const { rows } = await db().execute({
    sql: `SELECT COALESCE(SUM(profiles), 0) AS p, COALESCE(SUM(searches), 0) AS s
            FROM account_reading
           WHERE linkedin_account_id = ? AND day LIKE ?`,
    args: [accountId, `${month}%`],
  });
  return Number(rows[0]?.p ?? 0) + Number(rows[0]?.s ?? 0);
}

export interface ReadingRoom {
  ok: boolean;
  /** Searches and profile reads together, because LinkedIn pools them. */
  actions: number;
  reason: string | null;
}

/**
 * How much this account may still read today.
 *
 * One number rather than two, because the commercial use limit does not
 * separate a search from a profile view: both come out of the same monthly
 * allowance. The caller shrinks its own plan to fit rather than being refused,
 * so an account near its pace still brings a few people back.
 */
export async function roomToRead(
  accountId: string,
  tier: AccountTier,
  timeZone: string,
  ageDays: number
): Promise<ReadingRoom> {
  const [month, day] = await Promise.all([
    spentThisMonth(accountId, timeZone),
    spentToday(accountId, timeZone),
  ]);
  const allowance = dayAllowance(tier, month, ageDays);
  const usedToday = day.profiles + day.searches;
  const left = Math.max(0, allowance - usedToday);

  if (allowance <= 0) {
    return { ok: false, actions: 0, reason: "this month's reading allowance is spent" };
  }
  if (left <= 0) {
    return { ok: false, actions: 0, reason: "today's share of the month is spent" };
  }
  return { ok: true, actions: left, reason: null };
}

/** Where an account stands against its month, in the log. */
export function reportReading(
  accountId: string,
  tier: AccountTier,
  spentMonth: number
): void {
  log("reading this month", {
    accountId,
    tier,
    spent: `${spentMonth}/${budgetFor(tier).actionsPerMonth}`,
  });
}
