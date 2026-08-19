import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calendarConfigured, calendarConnected } from "@/lib/google-calendar";

/** Whether the demo booker can see the host's calendar. Admin only. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const configured = calendarConfigured();
  return NextResponse.json({
    configured,
    connected: configured ? await calendarConnected() : false,
  });
}
