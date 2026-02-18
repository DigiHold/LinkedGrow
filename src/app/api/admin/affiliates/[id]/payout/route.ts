import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  affiliates,
  affiliateCommissions,
  affiliatePayouts,
} from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: affiliateId } = await params;

  const affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, affiliateId),
  });

  if (!affiliate) {
    return NextResponse.json(
      { error: "Affiliate not found" },
      { status: 404 }
    );
  }

  if (!affiliate.paypalEmail) {
    return NextResponse.json(
      { error: "Affiliate has no PayPal email configured" },
      { status: 400 }
    );
  }

  // Get all available (unpaid, past hold period) commissions
  const now = new Date();
  const availableCommissions = await db
    .select()
    .from(affiliateCommissions)
    .where(
      and(
        eq(affiliateCommissions.affiliateId, affiliateId),
        eq(affiliateCommissions.paidOut, false),
        lte(affiliateCommissions.availableAt, now)
      )
    );

  const totalAmount = availableCommissions.reduce(
    (sum, c) => sum + c.commissionAmount,
    0
  );

  if (totalAmount < 5000) {
    // $50 minimum
    return NextResponse.json(
      {
        error:
          "Minimum payout is $50. Current available: $" +
          (totalAmount / 100).toFixed(2),
      },
      { status: 400 }
    );
  }

  // Create payout record
  const payoutId = nanoid();
  await db.insert(affiliatePayouts).values({
    id: payoutId,
    affiliateId,
    amount: totalAmount,
    method: "paypal",
    paypalEmail: affiliate.paypalEmail,
    status: "pending",
    createdAt: new Date(),
  });

  // Mark commissions as paid out
  for (const commission of availableCommissions) {
    await db
      .update(affiliateCommissions)
      .set({ paidOut: true, paidOutAt: new Date() })
      .where(eq(affiliateCommissions.id, commission.id));
  }

  return NextResponse.json({
    success: true,
    payout: {
      id: payoutId,
      amount: totalAmount,
      paypalEmail: affiliate.paypalEmail,
      commissionsCount: availableCommissions.length,
    },
  });
}
