/**
 * One-time admin endpoint to backfill existing free users into the
 * Brevo conversion funnel.
 *
 * Safe by design:
 *   - Only operates on users where plan = 'free'. Paid users are never
 *     touched.
 *   - Only ADDS contacts to lists 26/27/28/29 and updates the new
 *     custom attributes. Does not remove anyone from any list.
 *   - Idempotent: re-running simply re-computes state. Brevo's
 *     updateEnabled:true overwrites attributes without creating
 *     duplicate contacts.
 *
 * How to run:
 *   curl -X POST https://linkedgrow.ai/api/admin/backfill-free-users \
 *     -H "Cookie: <your admin session cookie>"
 *
 * Or call it from the browser while logged in as admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, posts } from "@/lib/db/schema";
import { eq, and, desc, isNotNull, count, gte } from "drizzle-orm";
import {
  setBrevoAttributes,
  addToFreeDripList,
  addToStuckSetupList,
  addToLimitHitList,
  addToDormantList,
  brevoDate,
} from "@/lib/newsletter";
import { PLANS } from "@/lib/plans";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  // Accept either a signed QStash request (for remote one-shot trigger)
  // or an admin session (for manual browser/curl invocation).
  let authorized = false;

  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";
    if (signature) {
      const isValid = await receiver.verify({
        body,
        signature,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/backfill-free-users`,
      });
      if (isValid) authorized = true;
    }
  } catch {
    // Fall through to admin session check
  }

  if (!authorized) {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const stats = {
    total_free_users: 0,
    attributes_synced: 0,
    added_to_drip: 0,
    added_to_stuck: 0,
    added_to_limit_hit: 0,
    added_to_dormant: 0,
    errors: 0,
  };

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const freePostLimit = PLANS.free.limits.postsPerMonth;

  // Page through free users to avoid loading everyone into memory.
  const batchSize = 200;
  let offset = 0;

  while (true) {
    const batch = await db
      .select()
      .from(users)
      .where(and(eq(users.plan, "free"), isNotNull(users.email)))
      .limit(batchSize)
      .offset(offset);

    if (batch.length === 0) break;

    for (const user of batch) {
      if (!user.email) continue;
      stats.total_free_users++;

      try {
        const hasLinkedIn = !!user.linkedinAccessToken;
        const hasAiKey = !!(
          user.openaiApiKey ||
          user.anthropicApiKey ||
          user.googleApiKey ||
          user.grokApiKey ||
          user.perplexityApiKey ||
          user.kimiApiKey
        );
        const setupComplete = hasLinkedIn && hasAiKey;

        // Counts
        const [totalCreated] = await db
          .select({ count: count() })
          .from(posts)
          .where(eq(posts.userId, user.id));

        const [totalPublished] = await db
          .select({ count: count() })
          .from(posts)
          .where(and(eq(posts.userId, user.id), eq(posts.status, "published")));

        const [monthCreated] = await db
          .select({ count: count() })
          .from(posts)
          .where(and(eq(posts.userId, user.id), gte(posts.createdAt, startOfMonth)));

        const [lastPost] = await db
          .select({ publishedAt: posts.publishedAt })
          .from(posts)
          .where(and(eq(posts.userId, user.id), eq(posts.status, "published")))
          .orderBy(desc(posts.publishedAt))
          .limit(1);

        const attributes: Record<string, unknown> = {
          PLAN: "free",
          IS_PAID: false,
          SIGNUP_DATE: user.createdAt ? brevoDate(user.createdAt) : null,
          LINKEDIN_CONNECTED: hasLinkedIn,
          AI_KEY_ADDED: hasAiKey,
          POSTS_CREATED: totalCreated?.count ?? 0,
          POSTS_PUBLISHED: totalPublished?.count ?? 0,
          LAST_POST_DATE: lastPost?.publishedAt ? brevoDate(lastPost.publishedAt) : null,
        };

        // Always sync attributes
        await setBrevoAttributes(user.email, attributes);
        stats.attributes_synced++;

        const signupOlderThan7Days = user.createdAt && user.createdAt <= sevenDaysAgo;
        const signupOlderThan30Days = user.createdAt && user.createdAt <= thirtyDaysAgo;

        // Active Drip (#26): every free user gets the main conversion drip,
        // regardless of how recently they signed up. Daily cron applies the
        // 5-day delay for new signups going forward; the backfill pushes
        // every existing free user in immediately.
        {
          const added = await addToFreeDripList(user.email, attributes);
          if (added) stats.added_to_drip++;
        }

        // Stuck Setup (#27): signed up 7+ days ago, incomplete
        if (signupOlderThan7Days && !setupComplete) {
          const added = await addToStuckSetupList(user.email, attributes);
          if (added) stats.added_to_stuck++;
        }

        // Limit Hit (#28): already hit monthly limit this month
        if (freePostLimit !== -1 && (monthCreated?.count ?? 0) >= freePostLimit) {
          const added = await addToLimitHitList(user.email, {
            ...attributes,
            LIMIT_HIT_DATE: brevoDate(now),
          });
          if (added) stats.added_to_limit_hit++;
        }

        // Dormant (#29): setup complete, signed up 30+ days ago, no recent post
        if (setupComplete && signupOlderThan30Days) {
          const hasRecentPost =
            lastPost?.publishedAt && lastPost.publishedAt >= thirtyDaysAgo;
          if (!hasRecentPost) {
            const added = await addToDormantList(user.email, attributes);
            if (added) stats.added_to_dormant++;
          }
        }
      } catch {
        stats.errors++;
      }
    }

    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return NextResponse.json(stats);
}
