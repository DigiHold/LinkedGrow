import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, AUTH_RATE_LIMITS, getClientIP } from "@/lib/rate-limit";

// Server-side proxy for Google Fonts API to keep the API key secret
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIP = getClientIP(request);
  const rateLimitResult = rateLimit(`fonts-proxy:${clientIP}`, AUTH_RATE_LIMITS.fontsProxy);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Fonts API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity&subset=latin`
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch fonts" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch fonts" }, { status: 500 });
  }
}
