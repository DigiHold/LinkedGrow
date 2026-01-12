import { NextResponse } from "next/server";
import { isUserInEEA } from "@/lib/cookies/geo";

// Force dynamic rendering since we use headers() for IP detection
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const geo = await isUserInEEA();

    return NextResponse.json(geo, {
      headers: {
        // Cache for 1 hour client-side, 24 hours on CDN
        "Cache-Control": "public, s-maxage=86400, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Geo API error:", error);
    // Default to EEA for privacy safety
    return NextResponse.json(
      {
        isEEA: true,
        countryCode: "",
        countryName: "Unknown",
      },
      { status: 200 }
    );
  }
}
