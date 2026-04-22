import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

// Prevent any caching - always fresh data
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Counter only reflects direct sales via Stripe. Marketplace LTDs
    // (dealify / dealmirror) are tracked separately and do not draw down
    // the 500-license counter on /lifetime-deal.
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(eq(users.isLifetimeDeal, true), eq(users.ltdSource, "stripe")));

    const sales = result[0]?.count || 0;

    // Overall counter: 500 total licenses (1 sale = 1 license)
    const counter = Math.max(0, 500 - sales);

    // Tier transitions:
    // Early Bird: 0-99 -> 100 spots
    // Regular: 100-249 -> 150 spots
    // Final Call: 250-499 -> 250 spots
    let currentTier: "early-bird" | "regular" | "final-call";
    let tierSpotsLeft: number;

    if (sales < 100) {
      currentTier = "early-bird";
      tierSpotsLeft = 100 - sales;
    } else if (sales < 250) {
      currentTier = "regular";
      tierSpotsLeft = 250 - sales;
    } else {
      currentTier = "final-call";
      tierSpotsLeft = Math.max(0, 500 - sales);
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
