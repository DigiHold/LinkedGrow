import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { affiliates, affiliateCommissions, users } from "@/lib/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import {
  sendAffiliateApprovedEmail,
  sendAffiliateRejectedEmail,
} from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get all affiliates with user info and total earned
  const allAffiliates = await db
    .select({
      id: affiliates.id,
      userId: affiliates.userId,
      referralCode: affiliates.referralCode,
      status: affiliates.status,
      promotionPlan: affiliates.promotionPlan,
      paypalEmail: affiliates.paypalEmail,
      totalClicks: affiliates.totalClicks,
      totalSignups: affiliates.totalSignups,
      totalConversions: affiliates.totalConversions,
      createdAt: affiliates.createdAt,
      updatedAt: affiliates.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(affiliates)
    .leftJoin(users, eq(affiliates.userId, users.id))
    .orderBy(sql`${affiliates.createdAt} DESC`);

  // Get total earned per affiliate
  const earnings = await db
    .select({
      affiliateId: affiliateCommissions.affiliateId,
      totalEarned:
        sql<number>`SUM(${affiliateCommissions.commissionAmount})`,
    })
    .from(affiliateCommissions)
    .groupBy(affiliateCommissions.affiliateId);

  const earningsMap = new Map(
    earnings.map((e) => [e.affiliateId, e.totalEarned || 0])
  );

  // Get available balance per affiliate (unpaid commissions past hold period)
  const now = new Date();
  const available = await db
    .select({
      affiliateId: affiliateCommissions.affiliateId,
      availableBalance:
        sql<number>`SUM(${affiliateCommissions.commissionAmount})`,
    })
    .from(affiliateCommissions)
    .where(
      and(
        eq(affiliateCommissions.paidOut, false),
        lte(affiliateCommissions.availableAt, now)
      )
    )
    .groupBy(affiliateCommissions.affiliateId);

  const availableMap = new Map(
    available.map((e) => [e.affiliateId, e.availableBalance || 0])
  );

  const result = allAffiliates.map((a) => ({
    ...a,
    totalEarned: earningsMap.get(a.id) || 0,
    availableBalance: availableMap.get(a.id) || 0,
  }));

  return NextResponse.json({ affiliates: result });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { affiliateId, action } = body; // action: "approve" | "reject" | "suspend"

  if (!affiliateId || !action) {
    return NextResponse.json(
      { error: "affiliateId and action are required" },
      { status: 400 }
    );
  }

  const affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, affiliateId),
  });

  if (!affiliate) {
    return NextResponse.json(
      { error: "Affiliate not found" },
      { status: 404 }
    );
  }

  const statusMap: Record<string, "approved" | "rejected" | "suspended"> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await db
    .update(affiliates)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(affiliates.id, affiliateId));

  // Get user info for email
  const user = await db.query.users.findFirst({
    where: eq(users.id, affiliate.userId),
  });

  // Send email notification
  if (user?.email) {
    if (action === "approve") {
      sendAffiliateApprovedEmail({
        to: user.email,
        name: user.name || "there",
        referralCode: affiliate.referralCode,
      }).catch((err) =>
        console.error("Failed to send affiliate approved email:", err)
      );
    } else if (action === "reject") {
      sendAffiliateRejectedEmail({
        to: user.email,
        name: user.name || "there",
      }).catch((err) =>
        console.error("Failed to send affiliate rejected email:", err)
      );
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
