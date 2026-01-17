import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookieConsents } from "@/lib/db/schema";
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
    const limit = 20;
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

    // Get consent records with pagination
    const totalRecords = totalConsents[0]?.count || 0;

    const records = await db
      .select()
      .from(cookieConsents)
      .orderBy(desc(cookieConsents.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      consentStats: {
        total: totalRecords,
        acceptedAll: acceptedAll[0]?.count || 0,
        rejectedAll: rejectedAll[0]?.count || 0,
        customized: customized[0]?.count || 0,
        analyticsAccepted: analyticsAccepted[0]?.count || 0,
        marketingAccepted: marketingAccepted[0]?.count || 0,
      },
      consentRecords: {
        items: records.map((r) => ({
          id: r.id,
          visitorId: r.visitorId,
          status: r.status,
          analytics: r.analytics,
          marketing: r.marketing,
          ipAddress: r.ipAddress,
          country: r.country,
          userAgent: r.userAgent,
          createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
        })),
        total: totalRecords,
        page,
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch site data" },
      { status: 500 }
    );
  }
}
