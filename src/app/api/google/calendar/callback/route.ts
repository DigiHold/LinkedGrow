import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calendarConfigured, storeRefreshToken } from "@/lib/google-calendar";

/**
 * Where Google lands after the admin authorises the calendar.
 *
 * Under /api/google/, which the proxy lets through without a session, so the
 * admin check happens here rather than in middleware.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!calendarConfigured()) {
    return NextResponse.json({ error: "Calendar credentials are missing" }, { status: 500 });
  }

  const code = request.nextUrl.searchParams.get("code");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://linkedgrow.ai";
  if (!code) {
    return NextResponse.redirect(`${base}/dashboard/admin/calendar?error=denied`);
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET as string,
        redirect_uri: `${base}/api/google/calendar/callback`,
        grant_type: "authorization_code",
      }),
    });
    const data = (await res.json()) as { refresh_token?: string };
    if (!res.ok || !data.refresh_token) {
      // No refresh token means Google reused an earlier grant. Revoking the
      // app's access in the Google account and reconnecting fixes it.
      return NextResponse.redirect(`${base}/dashboard/admin/calendar?error=no_refresh_token`);
    }
    await storeRefreshToken(data.refresh_token);
    return NextResponse.redirect(`${base}/dashboard/admin/calendar?connected=1`);
  } catch {
    return NextResponse.redirect(`${base}/dashboard/admin/calendar?error=failed`);
  }
}
