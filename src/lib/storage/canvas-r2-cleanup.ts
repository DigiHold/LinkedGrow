/**
 * Shared utilities for extracting and cleaning up R2 images from Fabric.js canvas JSON.
 * Used by carousel and template API routes to prevent orphaned R2 files.
 */

import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { deleteFromR2 } from "@/lib/storage/r2";
import { getAppUrl } from "@/lib/app-url";

/**
 * Extract R2 storage key from a URL.
 * R2 URLs look like: https://pub-xxx.r2.dev/users/userId/uploads/timestamp-random-filename
 * Returns: users/userId/uploads/timestamp-random-filename
 */
export function extractR2KeyFromUrl(url: string): string | null {
  if (!url) return null;

  // The local driver serves its files from the app itself.
  const local = `${getAppUrl()}/uploads/`;
  if (url.startsWith(local)) {
    const key = url.slice(local.length).split(/[?#]/)[0];
    return key.startsWith("users/") ? key : null;
  }

  if (!url.includes("r2.dev") && !url.includes("r2.cloudflarestorage.com")) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1);
    if (key.startsWith("users/")) {
      return key;
    }
  } catch {
    const match = url.match(
      /r2\.(?:dev|cloudflarestorage\.com)\/(users\/[^?#]+)/
    );
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract all R2 storage keys from a single Fabric.js canvas JSON string.
 */
export function extractR2KeysFromCanvasJson(canvasJson: string): string[] {
  const keys: string[] = [];

  try {
    const canvas = JSON.parse(canvasJson);
    const objects = canvas.objects || [];

    for (const obj of objects) {
      if (obj.type === "image") {
        const src = obj.originalSrc || obj.src || "";
        const key = extractR2KeyFromUrl(src);
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
 * Extract all R2 keys from carousel slidesJson (array of slides with canvasJSON).
 */
export function extractR2KeysFromSlidesJson(slidesJson: string): string[] {
  const keys: string[] = [];

  try {
    const slides = JSON.parse(slidesJson);
    for (const slide of slides) {
      if (slide.canvasJSON) {
        keys.push(...extractR2KeysFromCanvasJson(slide.canvasJSON));
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
