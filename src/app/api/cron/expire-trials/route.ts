/**
 * Daily cron - flip expired 7-day Pro trials to the post-trial paywall state.
 *
 * Targets users who:
 *   - plan = 'pro'
 *   - trialEndedAt is in the past
 *   - no Stripe subscription
 *   - not a Lifetime Deal customer
 *
 * Action: set plan='free', hasUsedTrial=true. Middleware then redirects them
 * from dashboard pages to /dashboard/upgrade.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, lte, isNull, isNotNull } from "drizzle-orm";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

async function runExpireTrials(): Promise<{ expired: number }> {
  const now = new Date();

  // Fetch IDs first so we can return an accurate count regardless of dialect.
  const candidates = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.plan, "pro"),
        eq(users.hasUsedTrial, false),
        isNotNull(users.trialEndedAt),
        lte(users.trialEndedAt, now),
        isNull(users.stripeSubscriptionId),
        eq(users.isLifetimeDeal, false)
      )
    );

  if (candidates.length === 0) return { expired: 0 };

  await db
    .update(users)
    .set({
      plan: "free",
      hasUsedTrial: true,
      updatedAt: now,
    })
    .where(
      and(
        eq(users.plan, "pro"),
        eq(users.hasUsedTrial, false),
        isNotNull(users.trialEndedAt),
        lte(users.trialEndedAt, now),
        isNull(users.stripeSubscriptionId),
        eq(users.isLifetimeDeal, false)
      )
    );

  return { expired: candidates.length };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";

    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/expire-trials`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runExpireTrials();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Expire-trials failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}

