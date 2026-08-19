import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { demoBookings } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { BOOKING, candidateSlots, freeSlots } from "@/lib/booking";
import { busyRanges, eventStillLive } from "@/lib/google-calendar";
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
      .select({ id: demoBookings.id, slotStart: demoBookings.slotStart, googleEventId: demoBookings.googleEventId })
      .from(demoBookings)
      .where(
        and(
          eq(demoBookings.status, "booked"),
          gte(demoBookings.slotStart, first),
          lte(demoBookings.slotStart, last)
        )
      );

    /**
     * A demo deleted from the calendar is a cancelled demo.
     *
     * Google is where a human cancels: they open the event and delete it. Our
     * row is what blocks the slot, so it has to follow, or the time stays
     * unbookable for ever with nothing on screen explaining why.
     */
    const live: number[] = [];
    for (const row of rows) {
      if (!row.googleEventId || (await eventStillLive(row.googleEventId).catch(() => true))) {
        live.push(row.slotStart);
        continue;
      }
      await db
        .update(demoBookings)
        .set({ status: "cancelled", updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(demoBookings.id, row.id));
    }

    // The host's own calendar, when it is connected. A failure there must not
    // take the page down: worst case the host declines a slot by hand.
    const busy = await busyRanges(first, last + BOOKING.durationMinutes * 60).catch(() => []);

    return NextResponse.json({
      slots: freeSlots(candidates, live, busy),
      durationMinutes: BOOKING.durationMinutes,
      hostTimezone: BOOKING.hostTimezone,
    });
  } catch (error) {
return NextResponse.json({ error: "Could not load the calendar" }, { status: 500 });
  }
}
