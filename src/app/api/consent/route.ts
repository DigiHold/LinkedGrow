import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookieConsents } from "@/lib/db/schema";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, analytics, marketing, status } = body;

    if (!visitorId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get IP and user agent from request
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get country from Vercel geo headers
    const country = request.headers.get("x-vercel-ip-country") || "unknown";

    // Insert consent record
    await db.insert(cookieConsents).values({
      id: nanoid(),
      visitorId,
      necessary: true,
      analytics: analytics ?? false,
      marketing: marketing ?? false,
      status,
      ipAddress,
      userAgent,
      country,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save consent" }, { status: 500 });
  }
}
