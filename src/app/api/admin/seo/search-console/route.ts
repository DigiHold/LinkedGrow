import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSiteOverview,
  getDailyTrend,
  getPagePerformance,
  getTopQueries,
} from "@/lib/search-console";

// GET - Fetch Search Console performance data (last 28 days)
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_INDEXING_CREDENTIALS) {
    return NextResponse.json(
      { error: "GOOGLE_INDEXING_CREDENTIALS not configured" },
      { status: 503 }
    );
  }

  try {
    // Last 28 days (Search Console data has ~2-3 day delay)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2); // Skip last 2 days (incomplete data)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 27);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Run all queries in parallel
    const [overview, dailyTrend, pagePerformance, topQueries] =
      await Promise.all([
        getSiteOverview(start, end),
        getDailyTrend(start, end),
        getPagePerformance(start, end),
        getTopQueries(start, end),
      ]);

    // Calculate totals from overview (single row without dimensions)
    const totals = overview.rows?.[0] || {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };

    return NextResponse.json({
      dateRange: { start, end },
      totals: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: totals.ctr,
        position: totals.position,
      },
      dailyTrend:
        dailyTrend.rows?.map((row) => ({
          date: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })) || [],
      pages:
        pagePerformance.rows?.map((row) => ({
          page: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })) || [],
      topQueries:
        topQueries.rows?.map((row) => ({
          query: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })) || [],
    });
  } catch (error) {
    console.error("Search Console API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Search Console data",
      },
      { status: 500 }
    );
  }
}
