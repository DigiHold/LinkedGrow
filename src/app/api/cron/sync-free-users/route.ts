/**
 * Daily cron - trial funnel synchronization.
 *
 *   1. Stuck Setup (#27): trial users on Day 2 who haven't connected
 *      LinkedIn or added an AI key get nudged. Removed automatically when
 *      they complete setup mid-trial.
 *
 *   2. Dormant (#29): users whose 7-day Pro trial expired 30+ days ago and
 *      who never upgraded get a re-engagement sequence. Excludes paid,
 *      LTD, and admin accounts.
 *
 * Paid users are never touched here (plan='free' filter).
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, lte, gte, isNotNull, isNull } from "drizzle-orm";
import {
  addToStuckSetupList,
  addToDormantList,
  removeFromStuckSetupList,
  removeFromDormantList,
  brevoDate,
} from "@/lib/newsletter";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - days);
  return d;
}

async function runSync(): Promise<{
  stuck_added: number;
  stuck_removed: number;
  dormant_added: number;
  dormant_removed: number;
  errors: number;
}> {
  const stats = {
    stuck_added: 0,
    stuck_removed: 0,
    dormant_added: 0,
    dormant_removed: 0,
    errors: 0,
  };

  // Day 2 of trial: window between 2 and 3 days ago (catches anyone who
  // signed up roughly 48 hours ago, before the 72-hour mark).
  const twoDaysAgoEnd = daysAgo(2);
  const threeDaysAgoStart = daysAgo(3);

  // 30 days after trial ended
  const thirtyDaysAgo = daysAgo(30);

  // ---------- 1. Stuck Setup (#27) - Day 2 of trial, setup incomplete ----------
  const stuckCandidates = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      linkedinAccessToken: users.linkedinAccessToken,
      openaiApiKey: users.openaiApiKey,
      anthropicApiKey: users.anthropicApiKey,
      googleApiKey: users.googleApiKey,
      grokApiKey: users.grokApiKey,
      perplexityApiKey: users.perplexityApiKey,
      kimiApiKey: users.kimiApiKey,
    })
    .from(users)
    .where(
      and(
        eq(users.plan, "pro"),
        isNull(users.stripeSubscriptionId),
        eq(users.isLifetimeDeal, false),
        eq(users.hasUsedTrial, false),
        isNotNull(users.trialStartedAt),
        lte(users.trialStartedAt, twoDaysAgoEnd),
        gte(users.trialStartedAt, threeDaysAgoStart),
        isNotNull(users.email)
      )
    );

  for (const user of stuckCandidates) {
    if (!user.email) continue;
    try {
      const hasAiKey = !!(
        user.openaiApiKey ||
        user.anthropicApiKey ||
        user.googleApiKey ||
        user.grokApiKey ||
        user.perplexityApiKey ||
        user.kimiApiKey
      );
      const hasLinkedIn = !!user.linkedinAccessToken;
      const setupComplete = hasLinkedIn && hasAiKey;

      if (!setupComplete) {
        const added = await addToStuckSetupList(user.email, {
          PLAN: "pro",
          IS_PAID: false,
          LINKEDIN_CONNECTED: hasLinkedIn,
          AI_KEY_ADDED: hasAiKey,
        });
        if (added) stats.stuck_added++;
      } else {
        // Setup complete mid-trial: ensure they're out of Stuck Setup as a
        // safety net (real-time hooks already remove them on connect).
        await removeFromStuckSetupList(user.email);
        stats.stuck_removed++;
      }
    } catch {
      stats.errors++;
    }
  }

  // ---------- 2. Dormant (#29) - trial ended 30+ days ago, never upgraded ----------
  const dormantCandidates = await db
    .select({
      id: users.id,
      email: users.email,
      trialEndedAt: users.trialEndedAt,
    })
    .from(users)
    .where(
      and(
        eq(users.plan, "free"),
        eq(users.hasUsedTrial, true),
        isNull(users.stripeSubscriptionId),
        eq(users.isLifetimeDeal, false),
        eq(users.isAdmin, false),
        isNotNull(users.trialEndedAt),
        lte(users.trialEndedAt, thirtyDaysAgo),
        isNotNull(users.email)
      )
    );

  for (const user of dormantCandidates) {
    if (!user.email) continue;
    try {
      const added = await addToDormantList(user.email, {
        PLAN: "free",
        IS_PAID: false,
        TRIAL_ENDED_DATE: user.trialEndedAt ? brevoDate(user.trialEndedAt) : null,
      });
      if (added) stats.dormant_added++;
    } catch {
      stats.errors++;
    }
  }

  // Anyone who upgraded mid-dormant gets removed via syncBrevoOnSubscription
  // already (it clears all free-user lists). No safety-net loop needed here.
  void removeFromDormantList; // keep import alive for future use

  return stats;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";

    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/sync-free-users`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    // Fall back to admin session so you can trigger manually from the
    // dashboard for testing.
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Sync failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
