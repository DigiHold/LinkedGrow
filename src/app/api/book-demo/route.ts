import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoBookings } from "@/lib/db/schema";
import { BOOKING, candidateSlots } from "@/lib/booking";
import { createDemoEvent } from "@/lib/google-calendar";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/ses-client";
import { baseEmailTemplate } from "@/lib/email/templates/base-template";

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

    const when = new Intl.DateTimeFormat("en-US", {
      timeZone: visitorTimezone || BOOKING.hostTimezone,
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(slotStart * 1000));

    await sendEmail({
      to: email,
      subject: `Your LinkedGrow demo: ${when}`,
      html: baseEmailTemplate({
        preheader: `${when}, ${BOOKING.durationMinutes} minutes with Nicolas.`,
        content: `
          <h1 style="font-size:22px;margin:0 0 16px">You are booked in</h1>
          <p style="margin:0 0 14px">${when}, ${BOOKING.durationMinutes} minutes with Nicolas, founder of LinkedGrow.</p>
          <p style="margin:0 0 14px">We build an agent from your own website, tune who it goes after, and answer whatever you want to ask.${
            event?.meetUrl
              ? ` The Google Meet link is in the calendar invitation, and here: <a href="${event.meetUrl}">${event.meetUrl}</a>.`
              : " The Google Meet link follows in a separate calendar invitation."
          }</p>
          <p style="margin:0">Something came up? Reply to this email and we move it.</p>
        `,
      }),
      text: `You are booked in.\n\n${when}, ${BOOKING.durationMinutes} minutes with Nicolas, founder of LinkedGrow.${
        event?.meetUrl ? `\n\nGoogle Meet: ${event.meetUrl}` : ""
      }\n\nReply to this email to move it.`,
    }).catch(() => null);

    await sendEmail({
      to: "contact@linkedgrow.ai",
      subject: `Demo booked: ${name}${siteUrl ? ` (${siteUrl})` : ""}`,
      html: baseEmailTemplate({
        preheader: `${when}`,
        content: `
          <h1 style="font-size:20px;margin:0 0 14px">New demo booked</h1>
          <p style="margin:0 0 8px"><strong>${name}</strong>, ${email}</p>
          <p style="margin:0 0 8px">${when}</p>
          ${siteUrl ? `<p style="margin:0 0 8px">Website: <a href="${siteUrl}">${siteUrl}</a></p>` : ""}
          ${note ? `<p style="margin:0">What they want the agent to find: ${note}</p>` : ""}
          ${event ? "" : '<p style="margin:12px 0 0;color:#b45309">Not in your calendar: connect Google Calendar in the admin.</p>'}
        `,
      }),
      text: `${name} (${email}) booked ${when}.${siteUrl ? ` Website: ${siteUrl}.` : ""}${note ? ` Note: ${note}` : ""}`,
    }).catch(() => null);

    return NextResponse.json({ ok: true, meetUrl: event?.meetUrl ?? null });
  } catch (error) {
return NextResponse.json({ error: "The booking could not be saved" }, { status: 500 });
  }
}
