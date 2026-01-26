import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedCarousels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFromR2 } from "@/lib/storage/r2";

// GET - Get a single carousel with full slide data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [carousel] = await db
      .select()
      .from(savedCarousels)
      .where(
        and(
          eq(savedCarousels.id, id),
          eq(savedCarousels.userId, session.user.id)
        )
      );

    if (!carousel) {
      return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
    }

    return NextResponse.json({ carousel });
  } catch (error) {
    console.error("Failed to fetch carousel:", error);
    return NextResponse.json(
      { error: "Failed to fetch carousel" },
      { status: 500 }
    );
  }
}

// PUT - Update a carousel
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, thumbnail, slidesJson, slideCount } = body;

    // Check ownership
    const [existing] = await db
      .select({ id: savedCarousels.id })
      .from(savedCarousels)
      .where(
        and(
          eq(savedCarousels.id, id),
          eq(savedCarousels.userId, session.user.id)
        )
      );

    if (!existing) {
      return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;
    if (slidesJson !== undefined) {
      updates.slidesJson = typeof slidesJson === "string" ? slidesJson : JSON.stringify(slidesJson);
    }
    if (slideCount !== undefined) updates.slideCount = slideCount;

    await db
      .update(savedCarousels)
      .set(updates)
      .where(eq(savedCarousels.id, id));

    return NextResponse.json({ message: "Carousel updated successfully" });
  } catch (error) {
    console.error("Failed to update carousel:", error);
    return NextResponse.json(
      { error: "Failed to update carousel" },
      { status: 500 }
    );
  }
}

/**
 * Extract R2 storage keys from Fabric.js canvas JSON
 * Looks for image objects and extracts R2 URLs, converting them to storage keys
 */
function extractR2KeysFromCanvasJson(canvasJson: string): string[] {
  const keys: string[] = [];

  try {
    const canvas = JSON.parse(canvasJson);
    const objects = canvas.objects || [];

    for (const obj of objects) {
      // Check for image objects
      if (obj.type === 'image') {
        // Check originalSrc first (we store original R2 URL there)
        const src = obj.originalSrc || obj.src || '';
        const key = extractR2KeyFromUrl(src);
        if (key) {
          keys.push(key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse canvas JSON for image extraction:', error);
  }

  return keys;
}

/**
 * Extract R2 storage key from a URL
 * R2 URLs look like: https://pub-xxx.r2.dev/users/userId/uploads/timestamp-random-filename
 * We need to extract: users/userId/uploads/timestamp-random-filename
 */
function extractR2KeyFromUrl(url: string): string | null {
  if (!url) return null;

  // Check if it's an R2 URL
  if (!url.includes('r2.dev') && !url.includes('r2.cloudflarestorage.com')) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    // The pathname starts with /, so remove it
    const key = urlObj.pathname.slice(1);
    // Only return if it looks like a valid key (starts with users/)
    if (key.startsWith('users/')) {
      return key;
    }
  } catch {
    // URL parsing failed, try regex fallback
    const match = url.match(/r2\.(?:dev|cloudflarestorage\.com)\/(users\/[^?#]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// DELETE - Delete a carousel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the carousel with slidesJson to extract image URLs for cleanup
    const [carousel] = await db
      .select({
        id: savedCarousels.id,
        slidesJson: savedCarousels.slidesJson,
      })
      .from(savedCarousels)
      .where(
        and(
          eq(savedCarousels.id, id),
          eq(savedCarousels.userId, session.user.id)
        )
      );

    if (!carousel) {
      return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
    }

    // Extract all R2 image keys from the slides
    const imageKeysToDelete: string[] = [];

    if (carousel.slidesJson) {
      try {
        const slides = JSON.parse(carousel.slidesJson);
        for (const slide of slides) {
          if (slide.canvasJSON) {
            const keys = extractR2KeysFromCanvasJson(slide.canvasJSON);
            imageKeysToDelete.push(...keys);
          }
        }
      } catch (error) {
        console.error('Failed to parse slides JSON:', error);
      }
    }

    // Delete the carousel from database first
    await db.delete(savedCarousels).where(eq(savedCarousels.id, id));

    // Clean up R2 images in the background (don't block the response)
    if (imageKeysToDelete.length > 0) {
      // Use Promise.allSettled to not fail if some deletions fail
      Promise.allSettled(
        imageKeysToDelete.map(key => {
          console.log('Deleting R2 image:', key);
          return deleteFromR2(key);
        })
      ).then(results => {
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length}/${imageKeysToDelete.length} R2 images`);
        } else {
          console.log(`Successfully deleted ${imageKeysToDelete.length} R2 images`);
        }
      });
    }

    return NextResponse.json({ message: "Carousel deleted successfully" });
  } catch (error) {
    console.error("Failed to delete carousel:", error);
    return NextResponse.json(
      { error: "Failed to delete carousel" },
      { status: 500 }
    );
  }
}
