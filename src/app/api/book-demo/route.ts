import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoBookings } from "@/lib/db/schema";
import { BOOKING, candidateSlots } from "@/lib/booking";
import { createDemoEvent } from "@/lib/google-calendar";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/ses-client";
import {
  demoBookedSubject,
  demoBookedEmailTemplate,
  demoBookedEmailText,
  demoBookedOpsSubject,
  demoBookedOpsEmailTemplate,
  demoBookedOpsEmailText,
} from "@/lib/email/templates/demo-booking-emails";

/**
 * Books one demo call.
 *
 * Public by design: a stranger books before they have an account, which is the
 * whole point of the page. Everything a public endpoint needs is here, IP rate
 * limit, hard validation, and no secret in any response.
 *
 * The slot is claimed by the unique index on demo_bookings(slot_start), not by
 * the availability check above it. Two people can pass the same check in the
 * same second; only one insert survives, and the loser is told plainly rather
 * than silently double-booked.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`book-demo:${getClientIP(request)}`, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.success) {
      return NextResponse.json(
        { error: "Too many bookings from this connection. Write to contact@linkedgrow.ai." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const slotStart = Number(body?.slotStart);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const website = typeof body?.website === "string" ? body.website.trim() : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const visitorTimezone = typeof body?.timezone === "string" ? body.timezone.slice(0, 64) : "";

    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Your name is required" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (note.length > 2000) {
      return NextResponse.json({ error: "That note is too long" }, { status: 400 });
    }
    // A visitor URL is parsed, never trusted as a string.
    let siteUrl: string | null = null;
    if (website) {
      try {
        const parsed = new URL(website.startsWith("http") ? website : `https://${website}`);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("scheme");
        siteUrl = parsed.toString().slice(0, 500);
      } catch {
        return NextResponse.json({ error: "That website address does not look right" }, { status: 400 });
      }
    }

    // The slot has to be one the host actually offers, whatever the client sent.
    const now = new Date();
    const horizon = new Date(now.getTime() + BOOKING.horizonDays * 86400_000);
    if (!Number.isFinite(slotStart) || !candidateSlots(now, horizon).includes(slotStart)) {
      return NextResponse.json({ error: "That time is no longer open" }, { status: 400 });
    }

    const cancelToken = randomBytes(24).toString("hex");
    const nowSeconds = Math.floor(Date.now() / 1000);
    try {
      await db.insert(demoBookings).values({
        id: randomUUID(),
        slotStart,
        durationMinutes: BOOKING.durationMinutes,
        name,
        email,
        website: siteUrl,
        note: note || null,
        visitorTimezone: visitorTimezone || null,
        status: "booked",
        cancelToken,
        createdAt: nowSeconds,
        updatedAt: nowSeconds,
      });
    } catch {
      // The unique index did its job: somebody else took this minute.
      return NextResponse.json(
        { error: "Somebody just took that time. Pick another one.", taken: true },
        { status: 409 }
      );
    }

    // Calendar and email are after the claim, never before: a booking that
    // exists nowhere is worse than one missing its invitation.
    const event = await createDemoEvent({
      startSeconds: slotStart,
      durationMinutes: BOOKING.durationMinutes,
      guestName: name,
      guestEmail: email,
      website: siteUrl,
      note: note || null,
    }).catch(() => null);

    if (event) {
      await db
        .update(demoBookings)
        .set({ googleEventId: event.eventId, meetUrl: event.meetUrl, updatedAt: nowSeconds })
        .where(and(eq(demoBookings.slotStart, slotStart), eq(demoBookings.status, "booked")));
    }

    // The same instant read in two clocks: the guest gets their own time, we
    // get ours. One shared string put the visitor's timezone in our inbox, so
    // a UK 12:00 booking read as 12:00 to us in Paris when it is 13:00 here.
    const formatWhen = (zone: string) =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(slotStart * 1000));

    const when = formatWhen(visitorTimezone || BOOKING.hostTimezone);
    const whenHost = formatWhen(BOOKING.hostTimezone);

    const firstName = name.split(" ")[0] || name;
    const emailArgs = {
      firstName,
      when,
      minutes: BOOKING.durationMinutes,
      meetUrl: event?.meetUrl ?? null,
      website: siteUrl,
    };
    await sendEmail({
      to: email,
      subject: demoBookedSubject(when),
      html: demoBookedEmailTemplate(emailArgs),
      text: demoBookedEmailText(emailArgs),
    }).catch(() => null);

    // Our copy shows our own time first, and the guest's time in brackets so
    // we know what they saw when we get on the call.
    const opsWhen =
      when === whenHost ? whenHost : `${whenHost} (their time: ${when})`;
    const opsArgs = {
      name,
      email,
      when: opsWhen,
      website: siteUrl,
      note: note || null,
      inCalendar: !!event,
      meetUrl: event?.meetUrl ?? null,
    };
    await sendEmail({
      to: "contact@linkedgrow.ai",
      subject: demoBookedOpsSubject(name, siteUrl),
      html: demoBookedOpsEmailTemplate(opsArgs),
      text: demoBookedOpsEmailText(opsArgs),
    }).catch(() => null);

    return NextResponse.json({ ok: true, meetUrl: event?.meetUrl ?? null });
  } catch (error) {
return NextResponse.json({ error: "The booking could not be saved" }, { status: 500 });
  }
}
