import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedCarousels, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import {
  extractR2KeysFromSlidesJson,
  cleanupR2Keys,
  cleanupRemovedR2Keys,
} from "@/lib/storage/canvas-r2-cleanup";

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

    // Check plan access - carouselGenerator requires Business
    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "carouselGenerator")) {
      return NextResponse.json(
        { error: "Carousel Generator requires a Business plan. Please upgrade to access this feature." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, thumbnail, slidesJson, slideCount } = body;

    // Check ownership and fetch existing data for R2 cleanup
    const [existing] = await db
      .select({ id: savedCarousels.id, slidesJson: savedCarousels.slidesJson })
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
      .where(
        and(
          eq(savedCarousels.id, id),
          eq(savedCarousels.userId, session.user.id)
        )
      );

    // Clean up R2 images that were removed from slides
    if (slidesJson !== undefined && existing.slidesJson) {
      const newSlidesStr = typeof slidesJson === "string" ? slidesJson : JSON.stringify(slidesJson);
      const oldKeys = extractR2KeysFromSlidesJson(existing.slidesJson);
      const newKeys = extractR2KeysFromSlidesJson(newSlidesStr);
      // Fire and forget - don't block the response
      cleanupRemovedR2Keys(oldKeys, newKeys);
    }

    return NextResponse.json({ message: "Carousel updated successfully" });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to update carousel" },
      { status: 500 }
    );
  }
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
    const imageKeysToDelete = carousel.slidesJson
      ? extractR2KeysFromSlidesJson(carousel.slidesJson)
      : [];

    // Delete the carousel from database first
    await db.delete(savedCarousels).where(eq(savedCarousels.id, id));

    // Clean up R2 files + media records in the background
    if (imageKeysToDelete.length > 0) {
      cleanupR2Keys(imageKeysToDelete);
    }

    return NextResponse.json({ message: "Carousel deleted successfully" });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to delete carousel" },
      { status: 500 }
    );
  }
}
