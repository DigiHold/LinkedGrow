/**
 * How old a LinkedIn post is, read from its own identifier.
 *
 * Commenting is worth doing in the minutes after a post goes up and worth very little an hour
 * later, so every decision this module makes starts with one number: how many minutes ago was
 * this published. LinkedIn shows that as "2h" or "il y a 2 h" next to the author, which is a
 * label, in the language of the account, and reading it would break the rule the rest of this
 * codebase is built on: a decision never depends on text a human is meant to read.
 *
 * It does not have to. LinkedIn's activity id is a Snowflake, and its high bits are the creation
 * time in milliseconds. Shift it right by 22 and the timestamp falls out.
 *
 * Verified on 2026-09-06 against eight identifiers taken from Nicolas's own notifications page:
 *
 *   7501619935706648576  ->  2026-09-04 12:39:26 UTC
 *   7501989520926593026  ->  2026-09-05 13:08:02 UTC
 *   7502221755894222848  ->  2026-09-06 04:30:51 UTC
 *   7499453470400348160  ->  2026-08-29 13:10:40 UTC
 *
 * All eight land inside the window his notifications actually covered. The check that settles it
 * is a pair: comment 7501995214723506176 was written on post 7501989520926593026, and it decodes
 * to 22 minutes after it. A coincidence does not order itself like that.
 *
 * So the age of a post is known before its page is opened, in any language, from the URL alone.
 */

/**
 * Snowflake ids are larger than a double can hold exactly.
 *
 * 7501619935706648576 is about 7.5e18 and Number.MAX_SAFE_INTEGER is 9.0e15, so parsing one with
 * Number() silently rounds it, and JavaScript's `>>` then coerces to a 32 bit integer and returns
 * something unrelated to the truth. BigInt is not a preference here, it is the only correct type,
 * and the id stays a string everywhere else so nothing can accidentally coerce it back.
 */
const TIMESTAMP_SHIFT = 22n;

/** Ids only ever appear as digits, and LinkedIn writes them 19 characters long today. */
const ACTIVITY = /urn:li:activity:(\d{6,25})/g;

/**
 * Pages that carry an id without ever meaning "somebody published this".
 *
 * The notifications page mixes three kinds of link, and only one is a post to read. Nicolas's
 * capture on 2026-09-06 held `/analytics/post-summary/urn:li:activity:...`, which is the account's
 * own post and its statistics, and `/analytics/profile-views`, which has no post at all. Following
 * either would have the agent commenting under its own posts.
 */
const NEVER = /\/analytics\//;

/** Every distinct activity id in one href, in the order they appear. */
export function activityIdsIn(href: string): string[] {
  if (!href) return [];

  /**
   * Decoded first, because the same id is written both ways on one page.
   *
   * A permalink arrives percent encoded, `/feed/update/urn%3Ali%3Aactivity%3A7501989520926593026`,
   * while the trending link writes it plainly in a query parameter. One regex over the decoded
   * string reads both. A malformed escape is not worth an exception: the raw string still matches
   * the plain form.
   */
  let text: string;
  try {
    text = decodeURIComponent(href);
  } catch {
    text = href;
  }

  if (NEVER.test(text)) return [];

  const seen = new Set<string>();
  for (const match of text.matchAll(ACTIVITY)) {
    const id = match[1];
    if (id) seen.add(id);
  }
  return [...seen];
}

/** When this post went up, from the id alone. */
export function publishedAt(activityId: string): Date {
  return new Date(Number(BigInt(activityId) >> TIMESTAMP_SHIFT));
}

/** Minutes since it went up. Negative is impossible in practice and is clamped to zero. */
export function minutesOld(activityId: string, now: Date = new Date()): number {
  const ms = now.getTime() - publishedAt(activityId).getTime();
  return Math.max(0, Math.floor(ms / 60_000));
}

/** The canonical page for a post, built rather than copied out of whatever link was followed. */
export function permalinkFor(activityId: string): string {
  return `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`;
}

export interface Candidate {
  activityId: string;
  minutesOld: number;
  url: string;
}

/**
 * The posts worth opening, newest first.
 *
 * `maxAgeMinutes` is the whole point of the module. A comment on a fifteen minute old post sits
 * near the top of the thread and rides whatever reach the post gets; the same comment two hours
 * later is somewhere below three hundred others and is read by nobody. So a post past the window
 * is not a lower priority, it is dropped.
 *
 * An id that is already in `seen` is dropped too. Notifications repeat: one post appeared three
 * times in Nicolas's capture, once as a permalink, once through a comment link and once through
 * its dash form, and commenting three times under one post is the single most obvious thing an
 * automated account can do.
 */
export function freshPosts(
  hrefs: readonly string[],
  opts: { maxAgeMinutes: number; now?: Date; seen?: ReadonlySet<string> }
): Candidate[] {
  const now = opts.now ?? new Date();
  const seen = opts.seen ?? new Set<string>();
  const found = new Map<string, Candidate>();

  for (const href of hrefs) {
    for (const activityId of activityIdsIn(href)) {
      if (seen.has(activityId) || found.has(activityId)) continue;
      const age = minutesOld(activityId, now);
      if (age > opts.maxAgeMinutes) continue;
      found.set(activityId, { activityId, minutesOld: age, url: permalinkFor(activityId) });
    }
  }

  return [...found.values()].sort((a, b) => a.minutesOld - b.minutesOld);
}
