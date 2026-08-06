/**
 * Cron job to clean up orphaned R2 media files.
 * Runs daily via QStash. Processes in batches of 50 with delays
 * between batches to avoid R2 rate limits and Vercel timeouts.
 *
 * Deletes media records (and their R2 files) that:
 * - Have no postId (not attached to a post)
 * - Are older than 24 hours
 * - Are not referenced in any saved carousel or user template
 *
 * Then a second pass for the videos, which never enter the media table at all:
 * they are too large to keep so the dashboard writes their key onto the post
 * instead, which means this sweep could not see a single one of them. The
 * worker deletes a video the moment LinkedIn has it; this catches the ones
 * where that failed, and the ones on posts that were never published.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media, posts, savedCarousels, userTemplates } from "@/lib/db/schema";
import { eq, and, isNull, isNotNull, lt, inArray, notInArray } from "drizzle-orm";
import { deleteFromR2 } from "@/lib/storage/r2";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 500;

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCleanup(): Promise<{
  deleted: number;
  errors: number;
  scanned: number;
  batches: number;
}> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find media records with no postId, older than 24 hours
  const orphanCandidates = await db
    .select({
      id: media.id,
      storageKey: media.storageKey,
      userId: media.userId,
    })
    .from(media)
    .where(
      and(isNull(media.postId), eq(media.status, "ready"), lt(media.createdAt, cutoff))
    );

  if (orphanCandidates.length === 0) {
    return { deleted: 0, errors: 0, scanned: 0, batches: 0 };
  }

  // Build a set of all R2 keys referenced in carousels and templates
  const referencedKeys = new Set<string>();
  const userIds = [...new Set(orphanCandidates.map((m) => m.userId))];

  for (const userId of userIds) {
    const carousels = await db
      .select({ slidesJson: savedCarousels.slidesJson })
      .from(savedCarousels)
      .where(eq(savedCarousels.userId, userId));

    for (const carousel of carousels) {
      if (carousel.slidesJson) {
        try {
          const slides = JSON.parse(carousel.slidesJson);
          for (const slide of slides) {
            if (slide.canvasJSON) {
              extractKeysFromCanvas(slide.canvasJSON, referencedKeys);
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    const templates = await db
      .select({ canvasJson: userTemplates.canvasJson })
      .from(userTemplates)
      .where(eq(userTemplates.userId, userId));

    for (const template of templates) {
      if (template.canvasJson) {
        extractKeysFromCanvas(template.canvasJson, referencedKeys);
      }
    }
  }

  // Filter to only truly orphaned files
  const orphans = orphanCandidates.filter((m) => !referencedKeys.has(m.storageKey));

  if (orphans.length === 0) {
    return { deleted: 0, errors: 0, scanned: orphanCandidates.length, batches: 0 };
  }

  let deleted = 0;
  let errors = 0;
  let batches = 0;

  // Process in batches
  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    const batch = orphans.slice(i, i + BATCH_SIZE);
    batches++;

    // Delete R2 files concurrently within the batch
    const r2Results = await Promise.allSettled(
      batch.map((orphan) => deleteFromR2(orphan.storageKey))
    );

    // Collect IDs of successfully deleted R2 files
    const deletedIds: string[] = [];
    for (let j = 0; j < r2Results.length; j++) {
      if (r2Results[j].status === "fulfilled") {
        deletedIds.push(batch[j].id);
      } else {
        errors++;
      }
    }

    // Batch delete media records for successful R2 deletions
    if (deletedIds.length > 0) {
      try {
        await db.delete(media).where(inArray(media.id, deletedIds));
        deleted += deletedIds.length;
      } catch {
        errors += deletedIds.length;
        deleted -= deletedIds.length;
      }
    }

    // Delay between batches (skip after the last one)
    if (i + BATCH_SIZE < orphans.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { deleted, errors, scanned: orphanCandidates.length, batches };
}

/** How long a video may sit on a post that never went out. */
const ABANDONED_VIDEO_DAYS = 30;

/**
 * Frees the videos nothing will ever read again.
 *
 * Two cases. A published post whose video the worker could not delete, usually
 * because the bucket was briefly unreachable, and a post that was written with
 * a video and never sent: a draft somebody forgot, or a publish that failed for
 * good. Anything queued, publishing or scheduled is left alone, because the
 * worker is going to need that file.
 */
async function releaseVideos(): Promise<{ freed: number; failed: number; scanned: number }> {
  const abandonedBefore = new Date(Date.now() - ABANDONED_VIDEO_DAYS * 86400000);

  const candidates = await db
    .select({
      id: posts.id,
      status: posts.status,
      metadata: posts.metadata,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(
      and(
        isNotNull(posts.metadata),
        notInArray(posts.status, ["queued", "publishing", "scheduled"])
      )
    );

  let freed = 0;
  let failed = 0;
  let scanned = 0;

  for (const post of candidates) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(post.metadata as string) as Record<string, unknown>;
    } catch {
      continue;
    }
    const video = parsed.video as { storageKey?: unknown } | undefined;
    const key = typeof video?.storageKey === "string" ? video.storageKey : null;
    if (!key) continue;

    // A draft still being written keeps its video until it is clearly forgotten.
    const stale = !post.updatedAt || post.updatedAt < abandonedBefore;
    if (post.status !== "published" && !stale) continue;

    scanned++;
    try {
      await deleteFromR2(key);
      const { video: _gone, ...rest } = parsed;
      await db
        .update(posts)
        .set({
          metadata: JSON.stringify({ ...rest, videoReleasedAt: Math.floor(Date.now() / 1000) }),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, post.id));
      freed++;
    } catch {
      failed++;
    }
  }

  return { freed, failed, scanned };
}

function extractKeysFromCanvas(canvasJson: string, keysSet: Set<string>): void {
  try {
    const canvas = JSON.parse(canvasJson);
    const objects = canvas.objects || [];
    for (const obj of objects) {
      if (obj.type === "image") {
        const src = obj.originalSrc || obj.src || "";
        const key = extractKeyFromUrl(src);
        if (key) keysSet.add(key);
      }
    }
  } catch {
    // Skip malformed canvas JSON
  }
}

function extractKeyFromUrl(url: string): string | null {
  if (!url || (!url.includes("r2.dev") && !url.includes("r2.cloudflarestorage.com"))) {
    return null;
  }
  try {
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1);
    return key.startsWith("users/") ? key : null;
  } catch {
    const match = url.match(/r2\.(?:dev|cloudflarestorage\.com)\/(users\/[^?#]+)/);
    return match ? match[1] : null;
  }
}

export async function POST(request: NextRequest) {
  // Verify QStash signature
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";

    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/cleanup-media`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    // If QStash verification fails, check for admin session
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runCleanup();
    const videos = await releaseVideos();
    // Surfaced with its own counts rather than folded into `deleted`: a video
    // is up to 200MB and an image is under 5, so one number covering both says
    // nothing about how much space came back.
    return NextResponse.json({ ...result, videos });
  } catch {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
