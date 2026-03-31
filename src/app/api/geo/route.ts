import { NextResponse } from "next/server";
import { isUserInEEA } from "@/lib/cookies/geo";

// Force dynamic rendering since we use headers() for IP detection
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const geo = await isUserInEEA();

    return NextResponse.json(geo, {
      headers: {
        // Don't cache - user's location can change (VPN, travel)
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
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
