import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { demoBookings } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { BOOKING, candidateSlots, freeSlots } from "@/lib/booking";
import { busyRanges } from "@/lib/google-calendar";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * The open slots for the demo booker, as UTC epoch seconds.
 *
 * Public on purpose: the page is a landing page and asking a stranger to sign
 * in before seeing a calendar loses the meeting. Nothing here reveals what the
 * host is doing, only which quarters of an hour are free.
 */
export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(`book-slots:${getClientIP(request)}`, {
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (!limited.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const now = new Date();
    const horizon = new Date(now.getTime() + BOOKING.horizonDays * 86400_000);

    const candidates = candidateSlots(now, horizon);
    if (candidates.length === 0) {
      return NextResponse.json({ slots: [], durationMinutes: BOOKING.durationMinutes });
    }

    const first = candidates[0] as number;
    const last = candidates[candidates.length - 1] as number;

    const rows = await db
      .select({ slotStart: demoBookings.slotStart })
      .from(demoBookings)
      .where(
        and(
          eq(demoBookings.status, "booked"),
          gte(demoBookings.slotStart, first),
          lte(demoBookings.slotStart, last)
        )
      );

    // The host's own calendar, when it is connected. A failure there must not
    // take the page down: worst case the host declines a slot by hand.
    const busy = await busyRanges(first, last + BOOKING.durationMinutes * 60).catch(() => []);

    return NextResponse.json({
      slots: freeSlots(candidates, rows.map((r) => r.slotStart), busy),
      durationMinutes: BOOKING.durationMinutes,
      hostTimezone: BOOKING.hostTimezone,
    });
  } catch (error) {
return NextResponse.json({ error: "Could not load the calendar" }, { status: 500 });
  }
}
