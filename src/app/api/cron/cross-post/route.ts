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
import { and, eq, isNull, lte } from "drizzle-orm";
import { crossPostArticle } from "@/lib/cross-post";

export const maxDuration = 300;
export const runtime = "nodejs";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function runCrossPost(): Promise<{
  candidates: number;
  succeeded: string[];
  failed: Array<{ slug: string; error: string }>;
}> {
  const cutoff = new Date(Date.now() - ONE_DAY_MS);

  const candidates = await db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, "published"),
        lte(blogPosts.publishedAt, cutoff),
        isNull(blogPosts.crossPostedAt)
      )
    );

  const succeeded: string[] = [];
  const failed: Array<{ slug: string; error: string }> = [];

  for (const row of candidates) {
    try {
      const result = await crossPostArticle(row.slug);
      if (result.devto.ok && result.hashnode.ok) {
        succeeded.push(row.slug);
      } else {
        const errs = [
          !result.devto.ok && `devto: ${result.devto.error}`,
          !result.hashnode.ok && `hashnode: ${result.hashnode.error}`,
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
