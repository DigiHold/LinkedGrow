/**
 * Whether this LinkedIn account has been around for years or was made last week.
 *
 * The reading budget ramps up over three weeks from a fraction of its full
 * pace, which is right for an account nobody has ever used and wrong for the
 * one it was actually applied to. A profile with a decade of jobs on it and
 * five hundred connections is not new. It is new to US, which is a different
 * thing and not what LinkedIn's detector is looking at.
 *
 * That distinction was costing the seven-day trial about half its leads, on the
 * exact days a customer decides whether to pay.
 *
 * LinkedIn does not publish a join date anywhere on a profile. What it does
 * show, on the page the worker already loads to read the account's own name, is
 * enough to answer the question:
 *
 *   - the connection count, which LinkedIn stops counting out loud at "500+"
 *   - the follower count
 *   - the start year of the oldest job or degree on the profile
 *
 * None of them is a join date and none has to be. A profile carrying 500+
 * connections and a job that started in 2014 was not created this month, and
 * that is the only claim being made.
 */

export type Maturity = "new" | "young" | "established";

export interface MaturitySignals {
  /** As displayed. LinkedIn shows "500+" rather than a number past that point. */
  connections: number | null;
  followers: number | null;
  /** The earliest year appearing in the experience and education sections. */
  oldestYear: number | null;
}

/**
 * How much of its full reading pace an account starts at.
 *
 * The old floor was 0.35 for everybody, which on a free account is 33 people a
 * day on the first day of a trial. An established profile starts at 0.60
 * instead, and still reaches full pace over the same three weeks: the ramp
 * exists so that a sudden change of behaviour on a quiet profile is gradual,
 * and starting a mature profile at two thirds is still gradual.
 *
 * A genuinely new account keeps the cautious floor. That is the case the ramp
 * was written for, and it is rare: somebody who signs up to a LinkedIn tool
 * almost always already has a LinkedIn.
 */
export function rampFloor(maturity: Maturity): number {
  switch (maturity) {
    case "established":
      return 0.6;
    case "young":
      return 0.45;
    default:
      return 0.35;
  }
}

/**
 * Reads the age of an account off what its own profile shows.
 *
 * Any one signal is enough, because they are independent and all of them are
 * hard to have by accident. Missing everything returns "new", which is the
 * cautious answer and the correct one when a selector has stopped matching.
 */
export function accountMaturity(signals: MaturitySignals, thisYear: number): Maturity {
  const connections = signals.connections ?? 0;
  const followers = signals.followers ?? 0;
  const age = signals.oldestYear ? thisYear - signals.oldestYear : 0;

  // 500+ is the number LinkedIn stops counting at, so it means "a long time".
  // Three years of history on the profile says the same thing another way.
  if (connections >= 500 || followers >= 500 || age >= 3) return "established";
  if (connections >= 100 || followers >= 100 || age >= 1) return "young";
  return "new";
}

export function maturityOf(value: string | null | undefined): Maturity {
  return value === "established" || value === "young" ? value : "new";
}

/**
 * Pulls a count out of the text LinkedIn writes next to it.
 *
 * It is written a dozen ways across locales and formats: "500+ connections",
 * "1,234 followers", "2 456 abonnés", "500+ relations". Thousands separators
 * are a comma, a space or a narrow no-break space depending on the language, so
 * every non-digit between digits is dropped rather than matched.
 */
export function countNear(text: string, words: RegExp): number | null {
  const match = new RegExp(
    `([0-9][0-9  .,  ]*)\\s*\\+?\\s*(?:${words.source})`,
    "i"
  ).exec(text);
  if (!match) return null;
  const digits = (match[1] ?? "").replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export const CONNECTION_WORDS = /connections?|relations?|kontakte|contatti|contactos|conexões/;
export const FOLLOWER_WORDS = /followers?|abonn(?:é|e)s?|follower|seguaci|seguidores/;

/** The earliest four-digit year in a profile, which is the start of its oldest entry. */
export function oldestYearIn(text: string, thisYear: number): number | null {
  const years = [...text.matchAll(/\b(19[7-9]\d|20[0-4]\d)\b/g)]
    .map((m) => Number(m[1]))
    .filter((y) => y >= 1975 && y <= thisYear);
  if (years.length === 0) return null;
  return Math.min(...years);
}
