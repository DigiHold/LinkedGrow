/**
 * Cron job to clean up orphaned R2 media files.
 * Deletes media records (and their R2 files) that:
 * - Have no postId (not attached to a post)
 * - Are older than 24 hours
 * - Are not referenced in any saved carousel or user template
 *
 * Can be triggered via QStash schedule or manually by admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media, savedCarousels, userTemplates } from "@/lib/db/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import { deleteFromR2 } from "@/lib/storage/r2";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

async function runCleanup(): Promise<{ deleted: number; errors: number }> {
  // Find media records with no postId, older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orphanCandidates = await db
    .select({
      id: media.id,
      storageKey: media.storageKey,
      userId: media.userId,
    })
    .from(media)
    .where(
      and(
        isNull(media.postId),
        eq(media.status, "ready"),
        lt(media.createdAt, cutoff)
      )
    );

  if (orphanCandidates.length === 0) {
    return { deleted: 0, errors: 0 };
  }

  // Build a set of all R2 keys referenced in carousels and templates
  const referencedKeys = new Set<string>();

  // Get all carousel slidesJson for users who have orphan candidates
  const userIds = [...new Set(orphanCandidates.map((m) => m.userId))];

  for (const userId of userIds) {
    // Check carousels
    const carousels = await db
      .select({ slidesJson: savedCarousels.slidesJson })
      .from(savedCarousels)
      .where(eq(savedCarousels.userId, userId));

    for (const carousel of carousels) {
      if (carousel.slidesJson) {
        // Extract R2 URLs from all slides
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

    // Check templates
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

  // Filter to only truly orphaned files (not referenced anywhere)
  const orphans = orphanCandidates.filter(
    (m) => !referencedKeys.has(m.storageKey)
  );

  let deleted = 0;
  let errors = 0;

  // Delete orphans from R2 and media table
  for (const orphan of orphans) {
    try {
      await deleteFromR2(orphan.storageKey);
      await db.delete(media).where(eq(media.id, orphan.id));
      deleted++;
    } catch (err) {
      console.error(`Failed to clean up orphan ${orphan.id}:`, err);
      errors++;
    }
  }

  return { deleted, errors };
}

function extractKeysFromCanvas(
  canvasJson: string,
  keysSet: Set<string>
): void {
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
  if (
    !url ||
    (!url.includes("r2.dev") && !url.includes("r2.cloudflarestorage.com"))
  ) {
    return null;
  }
  try {
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1);
    return key.startsWith("users/") ? key : null;
  } catch {
    const match = url.match(
      /r2\.(?:dev|cloudflarestorage\.com)\/(users\/[^?#]+)/
    );
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
    console.log(`Media cleanup: deleted ${result.deleted}, errors ${result.errors}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Media cleanup failed:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
