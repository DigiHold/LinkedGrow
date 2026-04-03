import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// Prevent any caching - always fresh data
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.isLifetimeDeal, true));

    const realSales = result[0]?.count || 0;

    // Every 5 real sales = 1 displayed sale
    const displayedSales = Math.floor(realSales / 5);

    // Overall counter: 500 total displayed licenses
    const counter = Math.max(0, 500 - displayedSales);

    // Tier transitions based on displayed count:
    // Early Bird: displayed 0-99 (real 0-499) -> 100 displayed spots
    // Regular: displayed 100-249 (real 500-1249) -> 150 displayed spots
    // Final Call: displayed 250-499 (real 1250-2499) -> 250 displayed spots
    let currentTier: "early-bird" | "regular" | "final-call";
    let tierSpotsLeft: number;

    if (displayedSales < 100) {
      currentTier = "early-bird";
      tierSpotsLeft = 100 - displayedSales;
    } else if (displayedSales < 250) {
      currentTier = "regular";
      tierSpotsLeft = 250 - displayedSales;
    } else {
      currentTier = "final-call";
      tierSpotsLeft = Math.max(0, 500 - displayedSales);
    }

    return NextResponse.json({
      counter,
      currentTier,
      tierSpotsLeft,
    });
  } catch {
    // Always return valid data so users can always purchase
    return NextResponse.json(
      { counter: 500, currentTier: "early-bird", tierSpotsLeft: 100 },
      { status: 200 }
    );
  }
}
