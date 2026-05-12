/**
 * Daily cron that cross-posts blog articles to dev.to + Hashnode
 * 1+ days after they were published on linkedgrow.ai. Canonical
 * URLs are set back to linkedgrow.ai so Google ranks the original.
 *
 * Auth: QStash signature OR admin session (for manual curl).
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { crossPostArticle, isDevtoActive, isHashnodeActive, type CrossPostTarget } from "@/lib/cross-post";

export const maxDuration = 300;
export const runtime = "nodejs";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Cap how many articles get cross-posted per cron run. With ~38 existing
// articles, an unthrottled rollout would dump all of them on day 1 of
// activation — that burst pattern is itself a spam signal even from a
// trusted account. 1/day turns the backlog into a ~38-day drip and falls
// to no-op once we're caught up to the natural publishing rate.
const MAX_CROSS_POSTS_PER_RUN = 1;

async function runCrossPost(): Promise<{
  candidates: number;
  succeeded: string[];
  failed: Array<{ slug: string; error: string }>;
}> {
  const cutoff = new Date(Date.now() - ONE_DAY_MS);

  const devtoActive = isDevtoActive();
  const hashnodeActive = isHashnodeActive();

  // Both in warmup → cron is a no-op.
  if (!devtoActive && !hashnodeActive) {
    return { candidates: 0, succeeded: [], failed: [] };
  }

  // Look for articles missing AT LEAST ONE active-platform URL. Once a
  // platform activates, articles already posted to the other platform get
  // picked up here for backfill.
  const missingChecks = [];
  if (devtoActive) missingChecks.push(isNull(blogPosts.devtoUrl));
  if (hashnodeActive) missingChecks.push(isNull(blogPosts.hashnodeUrl));
  const missingPlatform =
    missingChecks.length === 1 ? missingChecks[0] : or(...missingChecks)!;

  // Pick which platform(s) the orchestrator should target this run.
  let onlyTarget: CrossPostTarget | undefined;
  if (devtoActive && !hashnodeActive) onlyTarget = "devto";
  else if (!devtoActive && hashnodeActive) onlyTarget = "hashnode";
  // else both active → no `only` filter

  // Newest first so recent articles ship before old backlog.
  const candidates = await db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, "published"),
        lte(blogPosts.publishedAt, cutoff),
        missingPlatform
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(MAX_CROSS_POSTS_PER_RUN);

  const succeeded: string[] = [];
  const failed: Array<{ slug: string; error: string }> = [];

  for (const row of candidates) {
    try {
      const result = await crossPostArticle(row.slug, { only: onlyTarget });
      const devOk = devtoActive ? result.devto.ok : true;
      const hashOk = hashnodeActive ? result.hashnode.ok : true;
      if (hashOk && devOk) {
        succeeded.push(row.slug);
      } else {
        const errs = [
          devtoActive && !result.devto.ok && `devto: ${result.devto.error}`,
          hashnodeActive && !result.hashnode.ok && `hashnode: ${result.hashnode.error}`,
        ]
          .filter(Boolean)
          .join("; ");
        failed.push({ slug: row.slug, error: errs });
      }
    } catch (err) {
      failed.push({
        slug: row.slug,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { candidates: candidates.length, succeeded, failed };
}

export async function POST(request: NextRequest) {
  let authorized = false;

  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";
    if (signature) {
      const isValid = await receiver.verify({
        body,
        signature,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/cross-post`,
      });
      if (isValid) authorized = true;
    }
  } catch {
    // Fall through to admin session check
  }

  if (!authorized) {
    const session = await auth();
    if (session?.user?.isAdmin) authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runCrossPost();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
