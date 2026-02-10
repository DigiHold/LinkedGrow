import { NextResponse } from "next/server";

// Server-side proxy for Google Fonts API to keep the API key secret
export async function GET() {
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
