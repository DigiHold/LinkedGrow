/**
 * Shared utilities for extracting and cleaning up stored images from Fabric.js canvas JSON.
 * Used by carousel and template API routes to prevent orphaned files.
 */

import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { deleteFromR2 } from "@/lib/storage/r2";
import { getStorage } from "@/lib/storage";

/**
 * The storage key behind one of our own URLs, whichever driver serves it:
 * users/userId/uploads/timestamp-random-filename. Null for a foreign URL, and
 * for a file of ours that is not under a user's prefix.
 */
export async function extractR2KeyFromUrl(url: string): Promise<string | null> {
  if (!url) return null;
  const key = (await getStorage()).keyFromUrl(url);
  return key && key.startsWith("users/") ? key : null;
}

/**
 * Extract all storage keys from a single Fabric.js canvas JSON string.
 */
export async function extractR2KeysFromCanvasJson(canvasJson: string): Promise<string[]> {
  const keys: string[] = [];

  try {
    const canvas = JSON.parse(canvasJson);
    const objects = canvas.objects || [];

    for (const obj of objects) {
      if (obj.type === "image") {
        const src = obj.originalSrc || obj.src || "";
        const key = await extractR2KeyFromUrl(src);
        if (key) {
          keys.push(key);
        }
      }
    }
  } catch {
    // Skip malformed canvas JSON
  }

  return keys;
}

/**
 * Extract all storage keys from carousel slidesJson (array of slides with canvasJSON).
 */
export async function extractR2KeysFromSlidesJson(slidesJson: string): Promise<string[]> {
  const keys: string[] = [];

  try {
    const slides = JSON.parse(slidesJson);
    for (const slide of slides) {
      if (slide.canvasJSON) {
        keys.push(...(await extractR2KeysFromCanvasJson(slide.canvasJSON)));
      }
    }
  } catch {
    // Skip malformed slides JSON
  }

  return keys;
}

/**
 * Delete R2 files and their corresponding media table records.
 * Non-blocking - logs errors but doesn't throw.
 */
export async function cleanupR2Keys(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const uniqueKeys = [...new Set(keys)];

  // Delete from R2 and media table in parallel
  await Promise.allSettled([
    // Delete R2 files
    ...uniqueKeys.map((key) =>
      deleteFromR2(key).catch(() => {})
    ),
    // Delete matching media records
    db
      .delete(media)
      .where(inArray(media.storageKey, uniqueKeys))
      .catch(() => {}),
  ]);
}

/**
 * Given old and new canvas/slides JSON, find R2 keys that were removed
 * and clean them up from R2 + media table.
 */
export async function cleanupRemovedR2Keys(
  oldKeys: string[],
  newKeys: string[]
): Promise<void> {
  const newKeySet = new Set(newKeys);
  const removedKeys = oldKeys.filter((key) => !newKeySet.has(key));
  await cleanupR2Keys(removedKeys);
}
