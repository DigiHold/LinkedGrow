/**
 * When this person's own posts do best, or nothing at all.
 *
 * The card this feeds used to fall back to a sentence beginning "Based on
 * LinkedIn industry data", with a day and an hour attached. Nobody could say
 * where that number came from, which makes it exactly the kind of claim this
 * project has been burned by before. So there is no fallback: either there are
 * enough of the user's own posts to say something true, or the card says there
 * are not yet.
 */

/** Below this many measured posts, any pattern is noise. */
const MIN_POSTS = 8;

/** And below this many in a single slot, that slot is one lucky post. */
const MIN_PER_SLOT = 2;

export interface TimedPost {
  publishedAt: Date | string | null;
  impressions: number | null;
  engagements: number;
}

export interface BestPostingTime {
  bestDay: string;
  bestHour: string;
  insight: string;
  source: "personal";
  postCount: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hourLabel(hour: number): string {
  const start = hour % 12 === 0 ? 12 : hour % 12;
  const end = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  const endSuffix = hour + 1 < 12 || hour + 1 === 24 ? "AM" : "PM";
  return suffix === endSuffix ? `${start} - ${end} ${suffix}` : `${start} ${suffix} - ${end} ${endSuffix}`;
}

/** The weekday and hour of a moment, in the reader's own timezone. */
function localSlot(at: Date, timeZone: string): { day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return { day: index < 0 ? 0 : index, hour };
}

export function bestPostingTime(
  input: TimedPost[],
  timeZone: string
): BestPostingTime | undefined {
  // Only posts we actually have a reading for. A post with no impressions
  // recorded has not been measured, which is not the same as having done badly.
  const measured = input.filter(
    (p): p is TimedPost & { publishedAt: Date | string } =>
      p.publishedAt !== null && (p.impressions ?? 0) > 0
  );
  if (measured.length < MIN_POSTS) return undefined;

  const byDay = new Map<number, { rate: number; n: number }>();
  const byHour = new Map<number, { rate: number; n: number }>();

  for (const post of measured) {
    const at = new Date(post.publishedAt);
    if (Number.isNaN(at.getTime())) continue;
    const { day, hour } = localSlot(at, timeZone);
    const rate = post.engagements / (post.impressions as number);

    const d = byDay.get(day) ?? { rate: 0, n: 0 };
    byDay.set(day, { rate: d.rate + rate, n: d.n + 1 });
    const h = byHour.get(hour) ?? { rate: 0, n: 0 };
    byHour.set(hour, { rate: h.rate + rate, n: h.n + 1 });
  }

  const pick = (m: Map<number, { rate: number; n: number }>): number | null => {
    let best: { key: number; mean: number } | null = null;
    for (const [key, v] of m) {
      if (v.n < MIN_PER_SLOT) continue;
      const mean = v.rate / v.n;
      if (!best || mean > best.mean) best = { key, mean };
    }
    return best?.key ?? null;
  };

  const day = pick(byDay);
  const hour = pick(byHour);
  if (day === null || hour === null) return undefined;

  return {
    bestDay: DAYS[day] ?? "",
    bestHour: hourLabel(hour),
    insight: `Across your last ${measured.length} measured posts, the ones you published on ${DAYS[day]} and around ${hourLabel(hour)} earned the most engagement for the reach they got.`,
    source: "personal",
    postCount: measured.length,
  };
}
