/**
 * One-time admin endpoint to resync Brevo attributes for trial / post-trial
 * users.
 *
 * Safe by design:
 *   - Only operates on users where plan = 'pro' (in trial) or plan = 'free'
 *     (post trial). Paid users (starter/business plus active Stripe sub)
 *     and LTD customers are never touched.
 *   - Only ADDS contacts to Brevo and updates attributes. Does not remove
 *     anyone from any list.
 *   - Idempotent: re-running simply re-computes attribute state.
 *
 * When to run:
 *   1. After the one-off Turso SQL backfill that converts existing free
 *      users into 7-day Pro trials.
 *   2. After changing attribute logic in newsletter.ts.
 *   3. After resetting Brevo lists for testing.
 *
 * How to run (either path):
 *   - QStash-signed POST from the trigger script.
 *   - Browser/curl while logged in as admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, posts } from "@/lib/db/schema";
import { eq, and, desc, isNotNull, count, or } from "drizzle-orm";
import {
  setBrevoAttributes,
  brevoDate,
} from "@/lib/newsletter";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
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
    total_processed: 0,
    attributes_synced: 0,
    errors: 0,
  };

  const batchSize = 200;
  let offset = 0;

  while (true) {
    const batch = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.plan, "pro"), eq(users.plan, "free")),
          eq(users.isLifetimeDeal, false),
          isNotNull(users.email)
        )
      )
      .limit(batchSize)
      .offset(offset);

    if (batch.length === 0) break;

    for (const user of batch) {
      if (!user.email) continue;
      // Skip paying customers (Pro on Stripe sub)
      if (user.stripeSubscriptionId) continue;
      stats.total_processed++;

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

        const [totalCreated] = await db
          .select({ count: count() })
          .from(posts)
          .where(eq(posts.userId, user.id));

        const [totalPublished] = await db
          .select({ count: count() })
          .from(posts)
          .where(and(eq(posts.userId, user.id), eq(posts.status, "published")));

        const [lastPost] = await db
          .select({ publishedAt: posts.publishedAt })
          .from(posts)
          .where(and(eq(posts.userId, user.id), eq(posts.status, "published")))
          .orderBy(desc(posts.publishedAt))
          .limit(1);

        const attributes: Record<string, unknown> = {
          PLAN: user.plan,
          IS_PAID: false,
          SIGNUP_DATE: user.createdAt ? brevoDate(user.createdAt) : null,
          TRIAL_STARTED_DATE: user.trialStartedAt ? brevoDate(user.trialStartedAt) : null,
          TRIAL_ENDS_DATE: user.trialEndedAt ? brevoDate(user.trialEndedAt) : null,
          LINKEDIN_CONNECTED: hasLinkedIn,
          AI_KEY_ADDED: hasAiKey,
          POSTS_CREATED: totalCreated?.count ?? 0,
          POSTS_PUBLISHED: totalPublished?.count ?? 0,
          LAST_POST_DATE: lastPost?.publishedAt ? brevoDate(lastPost.publishedAt) : null,
        };

        await setBrevoAttributes(user.email, attributes);
        stats.attributes_synced++;
      } catch {
        stats.errors++;
      }
    }

    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return NextResponse.json(stats);
}
