import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookieConsents, dataRemovalRequests } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    // Get cookie consent stats
    const totalConsents = await db
      .select({ count: sql<number>`count(*)` })
      .from(cookieConsents);

    const acceptedAll = await db
      .select({ count: sql<number>`count(*)` })
      .from(cookieConsents)
      .where(eq(cookieConsents.status, "accepted_all"));

    const rejectedAll = await db
      .select({ count: sql<number>`count(*)` })
      .from(cookieConsents)
      .where(eq(cookieConsents.status, "rejected_all"));

    const customized = await db
      .select({ count: sql<number>`count(*)` })
      .from(cookieConsents)
      .where(eq(cookieConsents.status, "customized"));

    const analyticsAccepted = await db
      .select({ count: sql<number>`count(*)` })
      .from(cookieConsents)
      .where(eq(cookieConsents.analytics, true));

    const marketingAccepted = await db
      .select({ count: sql<number>`count(*)` })
      .from(cookieConsents)
      .where(eq(cookieConsents.marketing, true));

    // Get data removal requests
    const totalRequests = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataRemovalRequests);

    const requests = await db
      .select()
      .from(dataRemovalRequests)
      .orderBy(desc(dataRemovalRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const total = totalRequests[0]?.count || 0;

    return NextResponse.json({
      consentStats: {
        total: totalConsents[0]?.count || 0,
        acceptedAll: acceptedAll[0]?.count || 0,
        rejectedAll: rejectedAll[0]?.count || 0,
        customized: customized[0]?.count || 0,
        analyticsAccepted: analyticsAccepted[0]?.count || 0,
        marketingAccepted: marketingAccepted[0]?.count || 0,
      },
      removalRequests: {
        items: requests.map((r) => ({
          ...r,
          createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
          processedAt: r.processedAt?.toISOString() || null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching site data:", error);
    return NextResponse.json(
      { error: "Failed to fetch site data" },
      { status: 500 }
    );
  }
}
