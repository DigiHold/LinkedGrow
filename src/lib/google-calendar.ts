import { db } from "@/lib/db";
import { workerFlags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptApiKey, encryptApiKey } from "@/lib/encryption";

/**
 * The host's Google Calendar, read for availability and written for the demo.
 *
 * One account only, Nicolas's, authorised once from the admin. The refresh
 * token is encrypted with the same key as every other secret in this codebase
 * and lives in worker_flags, which is the one table meant for single rows of
 * operational state.
 *
 * Two scopes are enough and nothing wider should ever be asked for:
 *   calendar.freebusy  read when he is busy, never what he is doing
 *   calendar.events    create the demo and its Meet link
 *
 * Every function here fails soft. A calendar that cannot be reached must not
 * take the booking page down: the database still prevents double booking, and
 * a clash with a personal appointment is a call he moves by hand.
 */

const TOKEN_FLAG = "google-calendar-refresh-token";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_ID = "primary";

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export function calendarConfigured(): boolean {
  return !!process.env.GOOGLE_CALENDAR_CLIENT_ID && !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
}

export async function storeRefreshToken(token: string): Promise<void> {
  const sealed = encryptApiKey(token);
  if (!sealed) throw new Error("ENCRYPTION_KEY is not configured");
  const now = new Date();
  await db
    .insert(workerFlags)
    .values({ key: TOKEN_FLAG, value: sealed, updatedAt: now })
    .onConflictDoUpdate({
      target: workerFlags.key,
      set: { value: sealed, updatedAt: now },
    });
}

export async function calendarConnected(): Promise<boolean> {
  const [row] = await db
    .select({ value: workerFlags.value })
    .from(workerFlags)
    .where(eq(workerFlags.key, TOKEN_FLAG))
    .limit(1);
  return !!row?.value;
}

/** A short-lived access token, or null when the calendar is not connected. */
async function accessToken(): Promise<string | null> {
  if (!calendarConfigured()) return null;
  const [row] = await db
    .select({ value: workerFlags.value })
    .from(workerFlags)
    .where(eq(workerFlags.key, TOKEN_FLAG))
    .limit(1);
  if (!row?.value) return null;

  const refresh = decryptApiKey(row.value);
  if (!refresh) return null;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET as string,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/** When the host is already busy, as UTC second ranges. Empty when unknown. */
export async function busyRanges(
  fromSeconds: number,
  toSeconds: number
): Promise<Array<{ start: number; end: number }>> {
  const token = await accessToken();
  if (!token) return [];

  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: new Date(fromSeconds * 1000).toISOString(),
      timeMax: new Date(toSeconds * 1000).toISOString(),
      items: [{ id: CALENDAR_ID }],
    }),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
  };
  const busy = data.calendars?.[CALENDAR_ID]?.busy ?? [];
  return busy.map((b) => ({
    start: Math.floor(new Date(b.start).getTime() / 1000),
    end: Math.floor(new Date(b.end).getTime() / 1000),
  }));
}

/**
 * Puts the demo in the host's calendar and returns its Meet link.
 *
 * Google invites the guest itself, which is why no separate invitation is
 * sent from here. A null return means the call is booked in our database and
 * simply missing from his calendar, which the confirmation email says nothing
 * about: the ops alert is what tells him.
 */
export async function createDemoEvent(params: {
  startSeconds: number;
  durationMinutes: number;
  guestName: string;
  guestEmail: string;
  website?: string | null;
  note?: string | null;
}): Promise<{ eventId: string; meetUrl: string | null } | null> {
  const token = await accessToken();
  if (!token) return null;

  const start = new Date(params.startSeconds * 1000).toISOString();
  const end = new Date((params.startSeconds + params.durationMinutes * 60) * 1000).toISOString();
  const description = [
    params.website ? `Website: ${params.website}` : null,
    params.note ? `What they want the agent to find:\n${params.note}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: `LinkedGrow demo, ${params.guestName}`,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        attendees: [{ email: params.guestEmail, displayName: params.guestName }],
        conferenceData: {
          createRequest: {
            requestId: `lg-${params.startSeconds}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );
  if (!res.ok) return null;

  const data = (await res.json()) as { id?: string; hangoutLink?: string };
  if (!data.id) return null;
  return { eventId: data.id, meetUrl: data.hangoutLink ?? null };
}

/**
 * Whether a demo we created is still in the host's calendar.
 *
 * Deleting the event in Google is how a human cancels a call, and it has to
 * free the slot. Our own row is what blocks the booker, so it has to be told.
 * An unknown answer (no calendar, a network failure) counts as still live: a
 * slot wrongly held is an annoyance, a slot wrongly freed is two people on the
 * same call.
 */
export async function eventStillLive(eventId: string): Promise<boolean> {
  const token = await accessToken();
  if (!token) return true;
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 404 || res.status === 410) return false;
  if (!res.ok) return true;
  const data = (await res.json()) as { status?: string };
  return data.status !== "cancelled";
}
