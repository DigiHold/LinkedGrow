// Single Media API - Delete media
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFromR2 } from "@/lib/storage/r2";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/media/[id] - Delete a media file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: mediaId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get media record (must belong to user)
    const [mediaRecord] = await db
      .select()
      .from(media)
      .where(and(eq(media.id, mediaId), eq(media.userId, user.id)))
      .limit(1);

    if (!mediaRecord) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete from R2
    try {
      await deleteFromR2(mediaRecord.storageKey);
    } catch (e) {
      console.error("Failed to delete from R2:", e);
      // Continue with database deletion
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, mediaId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}

// PATCH /api/media/[id] - Update media metadata (alt text, caption, order)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: mediaId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get media record
    const [mediaRecord] = await db
      .select()
      .from(media)
      .where(and(eq(media.id, mediaId), eq(media.userId, user.id)))
      .limit(1);

    if (!mediaRecord) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const body = await request.json();
    const { altText, caption, sortOrder, postId } = body;

    const updateData: Record<string, unknown> = {};

    if (altText !== undefined) updateData.altText = altText;
    if (caption !== undefined) updateData.caption = caption;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (postId !== undefined) updateData.postId = postId || null;

    if (Object.keys(updateData).length > 0) {
      await db.update(media).set(updateData).where(eq(media.id, mediaId));
    }

    // Fetch updated record
    const [updated] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    return NextResponse.json({ media: updated });
  } catch (error) {
    console.error("Update media error:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}
