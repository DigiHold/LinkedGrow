/**
 * When the account is on LinkedIn, and when it is not there at all.
 *
 * This is the file that exists because of 2026-08-08. A customer's account was
 * restricted for "an unusually high volume of LinkedIn profile data" after
 * fifteen invitations in its entire life, so the outreach was never the
 * problem. Our own tables held the real one. Sourcing passes per hour, that
 * day, in the account's own timezone:
 *
 *   07h:16  08h:20  09h:10  10h:10  11h:11  12h:11  13h:19  14h:13  15h:17
 *   16h:10  17h:14  18h:13  19h:14  20h:13  21h:13  22h:13  23h:2
 *
 * Fifty-four of the gaps between two consecutive passes were exactly six
 * minutes and forty-three were exactly five. Sixteen hours a day, every day,
 * on a metronome. A dedicated address, a real Chrome profile and human typing
 * delays hide none of that, because none of them are what the shape gives away.
 * The old window was a pair of constants reading 7 and 23, and the agent loop
 * came round every five minutes inside it.
 *
 * A person does not do that. A person opens LinkedIn a few times a day, stays
 * for a while, does a batch of things and closes it. The times move around, the
 * weekend is quieter, and some days they never open it at all. So the account
 * gets a day plan: three to five visits, drawn at irregular times, each lasting
 * tens of minutes rather than seconds, and outside them nothing opens a browser.
 *
 * Two properties matter as much as the shape itself.
 *
 * It is **deterministic** per account and per local day. A worker restart, a
 * deploy or a second process must all read the same plan, or the plan is not a
 * plan and the day quietly fills back up with passes.
 *
 * It is **per account, not per agent**. Every limit LinkedIn enforces belongs to
 * the person, so two agents sharing a profile share its day.
 *
 * The volume is deliberately NOT reduced here. Depth per visit replaces
 * frequency: reading a hundred people across four visits is ordinary, reading
 * the same hundred across a hundred and ninety evenly spaced wake-ups is not.
 * How much may be read is reading.ts, and it paces itself across these visits.
 */

/** Minutes from local midnight. */
export interface Visit {
  startMin: number;
  /** Exclusive. */
  endMin: number;
}

export interface CurrentVisit extends Visit {
  /** 0-based position in the day, so the reading budget can pace across it. */
  index: number;
  /** How many visits this day holds in total. */
  count: number;
}

/**
 * The bands a person actually opens LinkedIn in.
 *
 * Four rather than a uniform spread over the day, because the times somebody
 * checks a professional network are not uniform: the first coffee, around
 * lunch, some point in the afternoon, and the evening scroll. A start is drawn
 * inside a band rather than at its edge, so two accounts never share a minute.
 */
const BANDS: ReadonlyArray<Visit> = [
  { startMin: 8 * 60 + 10, endMin: 10 * 60 + 30 },
  { startMin: 11 * 60 + 30, endMin: 13 * 60 + 40 },
  { startMin: 14 * 60 + 20, endMin: 17 * 60 + 10 },
  { startMin: 18 * 60 + 40, endMin: 21 * 60 + 30 },
];

/** A visit runs for tens of minutes, which is what makes it a visit. */
const MIN_LENGTH = 16;
const MAX_LENGTH = 42;

/** Two visits back to back are one long visit, and one long visit is a session. */
const MIN_GAP = 40;

/** Nothing starts or runs past this, because an account reading at 1am is its own signal. */
const LAST_MINUTE = 22 * 60 + 30;

/** How long the very first visit lasts, for somebody who is watching the screen. */
const FIRST_RUN_LENGTH = 30;

/** FNV-1a, so the same account and the same day always produce the same plan. */
function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32. Small, seedable, and good enough to place a few visits a day. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function between(rnd: () => number, from: number, to: number): number {
  return from + Math.floor(rnd() * Math.max(1, to - from));
}

/** The account's own day, its weekday and how far into it we are. */
export function localClock(
  tz: string,
  at: Date = new Date()
): { day: string; weekday: number; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      hour12: false,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  );
  const names: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: names[String(parts.weekday)] ?? 0,
    minutes: hour * 60 + Number(parts.minute),
  };
}

/**
 * How many times this account opens LinkedIn on this day.
 *
 * Weekends are quieter rather than dead, because plenty of the people this
 * sells to work on a Saturday, and an agent that stops for two days out of
 * seven reads as broken to somebody paying by the month. Whole days are skipped
 * on purpose: a profile that has never missed a single day in a year is a
 * profile that nobody is sitting behind.
 */
function visitCount(rnd: () => number, weekday: number): number {
  // Sunday off, always. Nicolas's call on 2026-08-08, and it is what a business
  // account looks like anyway: silent on a Sunday is the normal shape, not a
  // suspicious one.
  if (weekday === 7) return 0;
  // Saturday works, a little lighter than a weekday. Plenty of the people this
  // sells to work then, and losing a sixth of a seven-day trial to the calendar
  // costs leads on the days somebody is deciding whether to pay.
  if (weekday === 6) {
    if (rnd() < 0.05) return 0;
    return 2 + Math.floor(rnd() * 2);
  }
  if (rnd() < 0.07) return 0; // roughly one working day a month, off entirely
  return 3 + Math.floor(rnd() * 3);
}

function shuffled(rnd: () => number, n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const a = order[i] as number;
    order[i] = order[j] as number;
    order[j] = a;
  }
  return order;
}

/**
 * One account's day, as a list of visits.
 *
 * Exported so it can be printed and read by a person. A plan nobody can look at
 * is a plan nobody can check, and this one has to be checkable: it is the
 * difference between an account that survives and the account that did not.
 */
export function dayPlan(accountId: string, day: string, weekday: number): Visit[] {
  const rnd = rng(seedOf(`${accountId}:${day}`));
  const count = visitCount(rnd, weekday);
  if (count === 0) return [];

  // More visits than bands means one band is used twice, which is what a busy
  // day looks like anyway. The gap rule below keeps the pair apart.
  const order = shuffled(rnd, BANDS.length);
  const drawn: Visit[] = [];
  for (let i = 0; i < count; i += 1) {
    const band = BANDS[order[i % order.length] as number] as Visit;
    const start = between(rnd, band.startMin, band.endMin);
    drawn.push({ startMin: start, endMin: start + between(rnd, MIN_LENGTH, MAX_LENGTH + 1) });
  }
  drawn.sort((a, b) => a.startMin - b.startMin);

  const plan: Visit[] = [];
  let previousEnd = -Infinity;
  for (const visit of drawn) {
    const start = Math.max(visit.startMin, previousEnd + MIN_GAP);
    const end = start + (visit.endMin - visit.startMin);
    if (end > LAST_MINUTE) break; // Pushed past the evening, so it simply does not happen.
    plan.push({ startMin: start, endMin: end });
    previousEnd = end;
  }
  return plan;
}

/**
 * The visit happening right now, or null when the account is not on LinkedIn.
 *
 * Null is the normal answer for most of the day, and it means no browser opens
 * at all: not to read, not to write, not to check whether there is anything to
 * do. Checking whether there is anything to do was itself half the passes.
 */
export function currentVisit(
  accountId: string,
  tz: string,
  opts: { firstRun?: boolean } = {},
  at: Date = new Date()
): CurrentVisit | null {
  const clock = localClock(tz, at);

  /**
   * The one exception, and it is a human one.
   *
   * Somebody who has just finished the wizard is watching the screen, and
   * telling them to come back at 14:20 tomorrow is how a product gets refunded
   * in its first ten minutes. A person who has just signed up for something
   * does use it immediately, whatever time it is, exactly once. The pace below
   * treats it as half a day's reading so the rest of the day still has room.
   */
  if (opts.firstRun) {
    return {
      startMin: clock.minutes,
      endMin: Math.min(LAST_MINUTE, clock.minutes + FIRST_RUN_LENGTH),
      index: 0,
      count: 2,
    };
  }

  const plan = dayPlan(accountId, clock.day, clock.weekday);
  const index = plan.findIndex((v) => clock.minutes >= v.startMin && clock.minutes < v.endMin);
  if (index < 0) return null;
  return { ...(plan[index] as Visit), index, count: plan.length };
}

/** When the account next opens LinkedIn, for the log and for the dashboard. */
export function nextVisit(accountId: string, tz: string, at: Date = new Date()): Visit | null {
  const clock = localClock(tz, at);
  const today = dayPlan(accountId, clock.day, clock.weekday).find(
    (v) => v.startMin > clock.minutes
  );
  return today ?? null;
}

/** "14:35", for a log line a person reads. */
export function clockLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
