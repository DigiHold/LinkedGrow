import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedCarousels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

    await db.delete(savedCarousels).where(eq(savedCarousels.id, id));

    return NextResponse.json({ message: "Carousel deleted successfully" });
  } catch (error) {
    console.error("Failed to delete carousel:", error);
    return NextResponse.json(
      { error: "Failed to delete carousel" },
      { status: 500 }
    );
  }
}
