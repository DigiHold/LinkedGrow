/**
 * The demo booking rules, in one place.
 *
 * Availability is DEFINED in the host's timezone and DISPLAYED in the
 * visitor's, which is the whole difficulty: a slot is an instant in time, and
 * every screen renders that instant in its own zone. So everything here works
 * in UTC seconds and only the browser formats.
 *
 * Double booking is prevented by the database, not by this file: a unique
 * index on demo_bookings(slot_start) where status = 'booked'. Two people
 * clicking the same minute produce one row and one refusal, whatever the
 * availability list said a second earlier.
 */

export const BOOKING = {
  /** Nicolas's own working window for demos. */
  hostTimezone: "Europe/Paris",
  /** Monday to Friday, as Date.getUTCDay values in the host's zone. */
  workdays: [1, 2, 3, 4, 5] as number[],
  startHour: 9,
  endHour: 17,
  durationMinutes: 15,
  /** Gap between two demos, so a call running over does not eat the next. */
  bufferMinutes: 15,
  /** Nobody books in the next two hours; the host needs to see it coming. */
  minNoticeHours: 2,
  /** How far ahead the calendar opens. */
  horizonDays: 45,
} as const;

/** The offset of a timezone at a given instant, in minutes (positive east). */
function offsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second")
  );
  return Math.round((asUtc - at.getTime()) / 60000);
}

/**
 * The UTC instant for a wall-clock time in the host's timezone.
 *
 * Two passes, because the offset itself depends on the instant: summer time
 * changes the answer and a naive single pass books an hour off twice a year.
 */
function hostWallClockToUtc(y: number, m: number, d: number, hour: number, minute: number): Date {
  const naive = Date.UTC(y, m - 1, d, hour, minute);
  let guess = new Date(naive - offsetMinutes(BOOKING.hostTimezone, new Date(naive)) * 60000);
  guess = new Date(naive - offsetMinutes(BOOKING.hostTimezone, guess) * 60000);
  return guess;
}

/** The host-zone calendar date of an instant, as {y, m, d} */
function hostDateOf(at: Date): { y: number; m: number; d: number; dow: number } {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING.hostTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = f.formatToParts(at);
  const val = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(val("year")),
    m: Number(val("month")),
    d: Number(val("day")),
    dow: dowMap[val("weekday")] ?? 0,
  };
}

/**
 * Every slot the host offers between two instants, before any booking or
 * calendar conflict is removed. Returned as UTC epoch seconds.
 */
export function candidateSlots(from: Date, to: Date): number[] {
  const step = BOOKING.durationMinutes + BOOKING.bufferMinutes;
  const earliest = Date.now() + BOOKING.minNoticeHours * 3600_000;
  const out: number[] = [];

  // Walk day by day in the host's zone rather than in UTC: the day boundary
  // that matters is his, not the server's.
  for (let cursor = new Date(from.getTime()); cursor <= to; cursor = new Date(cursor.getTime() + 86400_000)) {
    const { y, m, d, dow } = hostDateOf(cursor);
    if (!BOOKING.workdays.includes(dow)) continue;
    for (let minutes = BOOKING.startHour * 60; minutes + BOOKING.durationMinutes <= BOOKING.endHour * 60; minutes += step) {
      const at = hostWallClockToUtc(y, m, d, Math.floor(minutes / 60), minutes % 60);
      if (at.getTime() < earliest || at < from || at > to) continue;
      const secs = Math.floor(at.getTime() / 1000);
      if (!out.includes(secs)) out.push(secs);
    }
  }
  return out.sort((a, b) => a - b);
}

/** Slots left once taken ones and busy calendar ranges are removed. */
export function freeSlots(
  candidates: number[],
  takenStarts: number[],
  busy: Array<{ start: number; end: number }>
): number[] {
  const taken = new Set(takenStarts);
  const lengthSeconds = BOOKING.durationMinutes * 60;
  return candidates.filter((start) => {
    if (taken.has(start)) return false;
    const end = start + lengthSeconds;
    return !busy.some((b) => start < b.end && end > b.start);
  });
}
