/**
 * Daily cron to sync free-user Brevo lists.
 *
 * Runs once per day via QStash. Responsibilities:
 *
 *   1. Add free users to Free Drip list (#26) when they signed up 5 days ago.
 *      (Welcome automation is 4 days, so we start the conversion drip day 5.)
 *
 *   2. Add free users to Stuck Setup list (#27) when they signed up 7 days
 *      ago AND LinkedIn is not connected OR no AI key is configured.
 *      Remove them if they've completed setup since last run.
 *
 *   3. Add free users to Dormant list (#29) when:
 *        - Setup is complete (LinkedIn + AI key)
 *        - They have published at least one post before
 *        - Their last published post is older than 30 days
 *      Remove them if they've posted since (the publish endpoints also
 *      handle real-time removal, so this is a safety net).
 *
 *   4. On the 1st of each month, clear the Limit Hit list (#28) because
 *      the 3-post-per-month free plan limit resets with the calendar month.
 *
 * Paid users are skipped entirely via the plan = 'free' filter.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, posts } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, isNotNull } from "drizzle-orm";
import {
  addToFreeDripList,
  addToStuckSetupList,
  addToDormantList,
  removeFromStuckSetupList,
  removeFromDormantList,
  clearLimitHitList,
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
  drip_added: number;
  stuck_added: number;
  stuck_removed: number;
  dormant_added: number;
  dormant_removed: number;
  limit_cleared: boolean;
  errors: number;
}> {
  const stats = {
    drip_added: 0,
    stuck_added: 0,
    stuck_removed: 0,
    dormant_added: 0,
    dormant_removed: 0,
    limit_cleared: false,
    errors: 0,
  };

  const now = new Date();
  const fiveDaysAgoStart = daysAgo(5);
  const fiveDaysAgoEnd = daysAgo(4);
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  // ---------- 1. Free Drip (#26) — signed up exactly 5 days ago ----------
  const dripCandidates = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
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
        eq(users.plan, "free"),
        gte(users.createdAt, fiveDaysAgoStart),
        lte(users.createdAt, fiveDaysAgoEnd),
        isNotNull(users.email)
      )
    );

  for (const user of dripCandidates) {
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
      const added = await addToFreeDripList(user.email, {
        LINKEDIN_CONNECTED: !!user.linkedinAccessToken,
        AI_KEY_ADDED: hasAiKey,
      });
      if (added) stats.drip_added++;
    } catch {
      stats.errors++;
    }
  }

  // ---------- 2. Stuck Setup (#27) — signed up 7+ days ago, incomplete ----------
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
        eq(users.plan, "free"),
        lte(users.createdAt, sevenDaysAgo),
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
          LINKEDIN_CONNECTED: hasLinkedIn,
          AI_KEY_ADDED: hasAiKey,
        });
        if (added) stats.stuck_added++;
      } else {
        // Setup complete - remove from Stuck Setup as a safety net
        // (real-time hooks already do this, but cron catches edge cases).
        await removeFromStuckSetupList(user.email);
        stats.stuck_removed++;
      }
    } catch {
      stats.errors++;
    }
  }

  // ---------- 3. Dormant (#29) — setup complete, no post in 30 days ----------
  const dormantCandidates = await db
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
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.plan, "free"),
        lte(users.createdAt, thirtyDaysAgo),
        isNotNull(users.linkedinAccessToken),
        isNotNull(users.email)
      )
    );

  for (const user of dormantCandidates) {
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
      if (!hasAiKey) continue;

      // Find this user's most recent published post
      const [lastPost] = await db
        .select({ publishedAt: posts.publishedAt })
        .from(posts)
        .where(and(eq(posts.userId, user.id), eq(posts.status, "published")))
        .orderBy(desc(posts.publishedAt))
        .limit(1);

      if (!lastPost || !lastPost.publishedAt) {
        // Never published. Count as dormant if they've been around > 30d.
        const added = await addToDormantList(user.email, {
          LAST_POST_DATE: null,
        });
        if (added) stats.dormant_added++;
        continue;
      }

      if (lastPost.publishedAt < thirtyDaysAgo) {
        const added = await addToDormantList(user.email, {
          LAST_POST_DATE: brevoDate(lastPost.publishedAt),
        });
        if (added) stats.dormant_added++;
      } else {
        // They've posted recently - ensure they're out of Dormant.
        await removeFromDormantList(user.email);
        stats.dormant_removed++;
      }
    } catch {
      stats.errors++;
    }
  }

  // ---------- 4. Clear Limit Hit list on the 1st of each month ----------
  if (now.getDate() === 1) {
    await clearLimitHitList();
    stats.limit_cleared = true;
  }

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
