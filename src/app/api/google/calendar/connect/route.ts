import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CALENDAR_SCOPES, calendarConfigured } from "@/lib/google-calendar";

/**
 * Starts the one and only Google Calendar authorisation, admin only.
 *
 * `prompt=consent` and `access_type=offline` together are what make Google
 * hand back a refresh token; without both, a re-authorisation returns an
 * access token that dies in an hour and the booking page silently stops
 * seeing the calendar.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!calendarConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET are missing" },
      { status: 500 }
    );
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CALENDAR_CLIENT_ID as string);
  url.searchParams.set(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_APP_URL ?? "https://linkedgrow.ai"}/api/google/calendar/callback`
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", CALENDAR_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return NextResponse.redirect(url.toString());
}
