import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { abandonedCheckouts } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { PLANS } from "@/lib/plans";

const PLAN_PRICES: Record<string, number> = {
  starter: PLANS.starter.price,
  pro: PLANS.pro.price,
  business: PLANS.business.price,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status"); // pending, recovered, expired, unsubscribed
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get counts by status
    const [totalResult, pendingResult, recoveredResult, expiredResult, unsubscribedResult] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(abandonedCheckouts),
        db
          .select({ count: sql<number>`count(*)` })
          .from(abandonedCheckouts)
          .where(eq(abandonedCheckouts.status, "pending")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(abandonedCheckouts)
          .where(eq(abandonedCheckouts.status, "recovered")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(abandonedCheckouts)
          .where(eq(abandonedCheckouts.status, "expired")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(abandonedCheckouts)
          .where(eq(abandonedCheckouts.status, "unsubscribed")),
      ]);

    const total = totalResult[0]?.count || 0;
    const pending = pendingResult[0]?.count || 0;
    const recovered = recoveredResult[0]?.count || 0;
    const expired = expiredResult[0]?.count || 0;
    const unsubscribed = unsubscribedResult[0]?.count || 0;

    // Calculate revenue stats from individual records
    const allRecords = await db
      .select({
        planId: abandonedCheckouts.planId,
        status: abandonedCheckouts.status,
      })
      .from(abandonedCheckouts);

    let revenueRecovered = 0;
    let potentialRevenue = 0;
    const byPlan: Record<string, { total: number; recovered: number }> = {
      starter: { total: 0, recovered: 0 },
      pro: { total: 0, recovered: 0 },
      business: { total: 0, recovered: 0 },
    };

    for (const record of allRecords) {
      const price = PLAN_PRICES[record.planId] || 0;
      byPlan[record.planId] = byPlan[record.planId] || { total: 0, recovered: 0 };
      byPlan[record.planId].total++;

      if (record.status === "recovered") {
        revenueRecovered += price;
        byPlan[record.planId].recovered++;
      } else if (record.status === "pending") {
        potentialRevenue += price;
      }
    }

    // Average recovery time (hours) for recovered checkouts
    const recoveredRecords = await db
      .select({
        abandonedAt: abandonedCheckouts.abandonedAt,
        recoveredAt: abandonedCheckouts.recoveredAt,
      })
      .from(abandonedCheckouts)
      .where(eq(abandonedCheckouts.status, "recovered"));

    let avgRecoveryTimeHours = 0;
    if (recoveredRecords.length > 0) {
      const totalHours = recoveredRecords.reduce((sum, r) => {
        if (r.abandonedAt && r.recoveredAt) {
          return sum + (r.recoveredAt.getTime() - r.abandonedAt.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      avgRecoveryTimeHours = Math.round((totalHours / recoveredRecords.length) * 10) / 10;
    }

    // Get paginated records with optional status filter
    const countForFilter = status
      ? { pending, recovered, expired, unsubscribed }[status] || total
      : total;

    const records = await (status
      ? db
          .select()
          .from(abandonedCheckouts)
          .where(eq(abandonedCheckouts.status, status as "pending" | "recovered" | "expired" | "unsubscribed"))
          .orderBy(desc(abandonedCheckouts.abandonedAt))
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(abandonedCheckouts)
          .orderBy(desc(abandonedCheckouts.abandonedAt))
          .limit(limit)
          .offset(offset));

    return NextResponse.json({
      stats: {
        total,
        pending,
        recovered,
        expired,
        unsubscribed,
        recoveryRate: total > 0 ? Math.round((recovered / total) * 100) : 0,
        revenueRecovered,
        potentialRevenue,
        avgRecoveryTimeHours,
        byPlan,
      },
      records: {
        items: records.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          planId: r.planId,
          status: r.status,
          recoveryUrl: r.recoveryUrl,
          recoveryUrlExpiresAt: r.recoveryUrlExpiresAt?.toISOString() || null,
          recoveredAt: r.recoveredAt?.toISOString() || null,
          abandonedAt: r.abandonedAt?.toISOString() || null,
          createdAt: r.createdAt?.toISOString() || null,
        })),
        total: countForFilter,
        page,
        totalPages: Math.ceil(countForFilter / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch abandoned carts data" },
      { status: 500 }
    );
  }
}
