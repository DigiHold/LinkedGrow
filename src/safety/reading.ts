import { db } from "../db.ts";
import { log } from "../logger.ts";
import { rampFloor, type Maturity } from "./maturity.ts";

/**
 * What an account is allowed to READ, and why there are two counters rather
 * than one.
 *
 * Everything else in this folder counts what an account sends. Nothing counted
 * what it reads, and reading is what got an account restricted on 2026-08-08:
 * "we detected that over time, it has accessed an unusually high volume of
 * LinkedIn profile data". Fifteen invitations had gone out in that account's
 * life, against a ceiling of a hundred a week. The outreach was never it.
 *
 * LinkedIn runs two separate systems and they punish different things, so a
 * single number cannot answer to both.
 *
 * **The commercial use limit** is documented, pooled and monthly. It counts
 * "searching for LinkedIn profiles", "browsing profiles using the People Also
 * Viewed section" and "viewing member profiles on the People tab of Pages", it
 * resets at midnight PST on the 1st, and hitting it blocks SEARCH rather than
 * restricting the account. LinkedIn refuses to publish the figure: "We are not
 * able to display the exact number of searches or views you have left." It also
 * warns that third-party tools blow through it "without actually seeing any of
 * the incremental warnings". Searches are the scarce resource here.
 *
 * **The anti-scraping detector** is what actually fired in August. It has no
 * published shape at all, it looks at total volume and at the pattern of it,
 * and it is the one that restricts an account outright.
 *
 * So: `searches` is a tight monthly pool, and `profiles` is a much wider one
 * covering every name and headline read, wherever it was read from.
 *
 * ## Why these numbers, after getting them wrong twice
 *
 * The first version capped profiles at a flat 60 a day, from the "80 a day on a
 * free account" that automation blogs repeat to each other. The second dropped
 * it to 200 a month, roughly 16 a day. Both were wrong, and the evidence
 * against them is better than the evidence for them:
 *
 *   - Nicolas has opened more than 60 profiles by hand in a day on a free
 *     account, repeatedly, and has never been restricted.
 *   - A free account connected to a competing tool has run far above 16 leads a
 *     day for months with no restriction.
 *   - 16 leads a day is roughly 10 qualified a week, which is not a product.
 *
 * The restriction was not caused by volume alone. It was caused by 189 evenly
 * spaced passes across sixteen hours, every day, which rhythm.ts now replaces
 * with three to five visits. A heavy human user reads 50 to 100 people a day
 * forever and nothing happens to them, so that is the envelope: a free account
 * gets around 96 on the days it runs, and it spends them inside a handful of
 * visits rather than dribbling them out around the clock.
 *
 * Searches stay tight regardless, because that is the one limit LinkedIn admits
 * exists. 9 a day on a free account sits under the 250 to 300 a month the
 * industry reports, and engagement mining costs none at all: opening a
 * competitor's post by its URL and reading who reacted runs no search and
 * visits no profile. That is deliberate pressure toward the source type that
 * both finds better people and costs the account least.
 */

export type AccountTier = "free" | "premium" | "sales_navigator";

/** The two counters, and which system each one answers to. */
export type ReadKind = "profiles" | "searches";

export interface ReadBudget {
  /** Every name and headline read, from a reactions list as much as from a profile. */
  profilesPerMonth: number;
  /** Searches run. This is the commercial use limit, and it is the tight one. */
  searchesPerMonth: number;
  /** A floor, so a pass is never so small it brings back nothing. */
  minProfilesPerDay: number;
}

const BUDGETS: Record<AccountTier, ReadBudget> = {
  // 96 people and 9 searches on a day it runs, which is a heavy human user and
  // no more. Across the 24 days rhythm.ts keeps, that is 2,304 of the 2,400.
  free: { profilesPerMonth: 2_400, searchesPerMonth: 240, minProfilesPerDay: 20 },
  // Premium Business and Recruiter Lite raise the commercial use allowance. By
  // how much is not published, so the search pool roughly triples rather than
  // being lifted: the profile pool is what the customer actually feels.
  premium: { profilesPerMonth: 4_500, searchesPerMonth: 700, minProfilesPerDay: 40 },
  // Sales Navigator lifts the commercial use limit off people search entirely.
  // What remains is the anti-scraping detector, which is about shape rather
  // than a number, so this stays a pace rather than becoming unlimited.
  sales_navigator: { profilesPerMonth: 9_000, searchesPerMonth: 3_000, minProfilesPerDay: 80 },
};

/**
 * How many days of a month the account actually opens LinkedIn.
 *
 * Not 30. rhythm.ts skips most Sundays, a good share of Saturdays and roughly
 * one working day a month, which leaves about 24 or 25 active days. Pricing the
 * daily pace at 30 therefore left a fifth of the pool unspent every month: the
 * exposure was unchanged and the customer simply found fewer people for no
 * reason. The monthly pool is still the hard backstop, so a month that happens
 * to run more days than this stops at the pool rather than overrunning it.
 */
const ACTIVE_DAYS_IN_MONTH = 25;

/**
 * Below this a visit is not worth opening a browser for.
 *
 * A source costs a page load and a post or two before it returns anybody, so
 * five people of room buys nothing and still shows up as a session. Rounding a
 * thin share up to this is fine; what is never fine is letting the rounding
 * push the DAY past its allowance, which is exactly the bug the day-level test
 * caught: five visits each rounded up by seven read 88 against a budget of 80.
 */
export const MIN_VISIT_READ = 10;

/**
 * What one day may spend of one pool.
 *
 * Flat rather than a share of what is left. A share reads a lot on the 1st and
 * almost nothing on the 28th, which is neither useful to the customer nor
 * human. The month is the backstop; the day is the pace.
 */
export function dayAllowance(
  tier: AccountTier,
  kind: ReadKind,
  spentThisMonth: number,
  ageDays: number,
  /**
   * How long the LinkedIn account itself has existed, which is not the same as
   * how long it has been ours.
   *
   * The ramp used to start every account at 0.35 whatever it was, so a profile
   * with ten years of jobs and 500+ connections spent the first week of its
   * owner's trial at a third of its pace. That is the week that decides whether
   * they pay. An established profile starts at 0.6 instead and still reaches
   * full pace over the same three weeks. Unknown means new, which is the
   * cautious reading and the right one when the profile could not be read.
   */
  maturity: Maturity = "new"
): number {
  const budget = budgetFor(tier);
  const pool = kind === "searches" ? budget.searchesPerMonth : budget.profilesPerMonth;
  const left = Math.max(0, pool - spentThisMonth);
  if (left <= 0) return 0;
  const floorRamp = rampFloor(maturity);
  const ramp = Math.min(1, floorRamp + (Math.max(0, ageDays) / 21) * (1 - floorRamp));
  const paced = Math.floor((pool / ACTIVE_DAYS_IN_MONTH) * ramp);
  const floor = kind === "searches" ? 2 : budget.minProfilesPerDay;
  return Math.min(left, Math.max(floor, paced));
}

export function budgetFor(tier: AccountTier): ReadBudget {
  return BUDGETS[tier] ?? BUDGETS.free;
}

export function tierOf(value: string | null | undefined): AccountTier {
  return value === "premium" || value === "sales_navigator" ? value : "free";
}

/**
 * Where this pass sits in the account's day, from rhythm.ts.
 *
 * Without it the first visit of the day spends the whole day's allowance in its
 * first pass, and the other three find an empty budget and do nothing. The
 * ceiling below is cumulative: by the end of visit k the account may have spent
 * at most its share of the day, which paces the reading without needing to
 * store anything per visit.
 */
export interface Pace {
  /** 0-based position of the current visit. */
  index: number;
  /** How many visits the day holds. */
  count: number;
}

/**
 * The most the account may have spent by the END of this visit.
 *
 * Cumulative rather than per-visit, so nothing has to be stored per visit: what
 * a visit may take is this ceiling minus what the day has already spent, which
 * self-corrects when one visit reads less than its share or when a first run
 * has already taken half the day.
 */
export function visitCeiling(allowance: number, pace?: Pace): number {
  if (!pace || pace.count <= 1) return allowance;
  const index = Math.max(0, Math.min(pace.index, pace.count - 1));
  return Math.ceil((allowance * (index + 1)) / pace.count);
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

/** Both pools, for this calendar month, which is the window LinkedIn counts in. */
export async function spentThisMonth(accountId: string, timeZone: string): Promise<Spent> {
  const month = today(timeZone).slice(0, 7);
  const { rows } = await db().execute({
    sql: `SELECT COALESCE(SUM(profiles), 0) AS p, COALESCE(SUM(searches), 0) AS s
            FROM account_reading
           WHERE linkedin_account_id = ? AND day LIKE ?`,
    args: [accountId, `${month}%`],
  });
  return { profiles: Number(rows[0]?.p ?? 0), searches: Number(rows[0]?.s ?? 0) };
}

export interface ReadingRoom {
  /** False only when there is no profile reading left at all, which stops the pass. */
  ok: boolean;
  /** Names and headlines this pass may still read. */
  profiles: number;
  /**
   * Searches this pass may still run. Zero is normal and not a failure: the
   * pass drops the sources that need one and mines engagement instead, which
   * costs no search and is the better source anyway.
   */
  searches: number;
  reason: string | null;
}

/**
 * How much this account may still read in this visit.
 *
 * Two numbers rather than one, because the two pools answer to different
 * systems inside LinkedIn and running out of searches must not stop an agent
 * that could happily keep reading a competitor's comment sections.
 */
export async function roomToRead(
  accountId: string,
  tier: AccountTier,
  timeZone: string,
  ageDays: number,
  pace?: Pace,
  maturity: Maturity = "new"
): Promise<ReadingRoom> {
  const [month, day] = await Promise.all([
    spentThisMonth(accountId, timeZone),
    spentToday(accountId, timeZone),
  ]);

  return roomFrom(
    dayAllowance(tier, "profiles", month.profiles, ageDays, maturity),
    dayAllowance(tier, "searches", month.searches, ageDays, maturity),
    day,
    pace
  );
}

/**
 * The arithmetic on its own, with no database under it.
 *
 * Split out because the version of this that lived inline was re-implemented in
 * a day-level test, the two drifted, and the drift hid a real overrun: five
 * visits each rounding their share up by seven read 88 people against a budget
 * of 80. A test that re-implements the thing it is testing tests nothing.
 */
export function roomFrom(
  profileDay: number,
  searchDay: number,
  spentToday: Spent,
  pace?: Pace
): ReadingRoom {
  // What the DAY has left is the hard ceiling. The visit's share sits under it,
  // and a share too thin to open a source is rounded up to something usable,
  // never past the day.
  const dayLeft = Math.max(0, profileDay - spentToday.profiles);
  const share = Math.max(0, visitCeiling(profileDay, pace) - spentToday.profiles);
  const profiles = Math.min(dayLeft, share > 0 ? Math.max(share, MIN_VISIT_READ) : 0);

  /**
   * Searches are paced by the day, not by the visit, and that is deliberate.
   *
   * Profiles are cut into visit-sized shares because volume inside one burst is
   * what the anti-scraping detector reads. Searches are not that: LinkedIn
   * pools them by the MONTH, and a person researching a market runs several in
   * one sitting rather than two an hour.
   *
   * Slicing them per visit had a cost nobody had measured. A keyword source
   * holds three queries and searches each twice, so it costs six, while a
   * quarter of a free account's nine-a-day is two. The best source on a live
   * agent, 23 leads and 10 of them good, could not fit into a single visit and
   * silently stopped running. The day and the month still bound this; only the
   * arbitrary intra-day slice is gone.
   */
  const searches = Math.max(0, searchDay - spentToday.searches);

  if (profileDay <= 0) {
    return { ok: false, profiles: 0, searches: 0, reason: "this month's reading allowance is spent" };
  }
  if (profiles < MIN_VISIT_READ) {
    return {
      ok: false,
      profiles: 0,
      searches,
      reason: dayLeft <= 0 ? "today's reading is done" : "this visit's share of the day is spent",
    };
  }
  return { ok: true, profiles, searches, reason: null };
}

/** Where an account stands against its month, in the log. */
export function reportReading(accountId: string, tier: AccountTier, spent: Spent): void {
  const budget = budgetFor(tier);
  log("reading this month", {
    accountId,
    tier,
    profiles: `${spent.profiles}/${budget.profilesPerMonth}`,
    searches: `${spent.searches}/${budget.searchesPerMonth}`,
  });
}
