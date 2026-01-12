// Single Post API - Get, Update, Delete a specific post
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, media, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteMultipleFromR2 } from "@/lib/storage/r2";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id] - Get a single post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get post (must belong to user)
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get media for this post
    const postMedia = await db
      .select()
      .from(media)
      .where(and(eq(media.postId, postId), eq(media.status, "ready")))
      .orderBy(media.sortOrder);

    return NextResponse.json({
      post: {
        ...post,
        metadata: post.metadata ? JSON.parse(post.metadata) : null,
        media: postMedia,
      },
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get existing post
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Can't edit published posts
    if (existingPost.status === "published") {
      return NextResponse.json(
        { error: "Cannot edit published posts" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, status, postType, scheduledAt, metadata } = body;

    // Validate scheduled posts have a future date
    if (status === "scheduled") {
      const scheduleDate = scheduledAt
        ? new Date(scheduledAt)
        : existingPost.scheduledAt;
      if (!scheduleDate || scheduleDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled date must be in the future" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (content !== undefined) updateData.content = content.trim();
    if (status !== undefined) updateData.status = status;
    if (postType !== undefined) updateData.postType = postType;
    if (scheduledAt !== undefined)
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (metadata !== undefined)
      updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    await db.update(posts).set(updateData).where(eq(posts.id, postId));

    // Fetch updated post
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    // Get media
    const postMedia = await db
      .select()
      .from(media)
      .where(and(eq(media.postId, postId), eq(media.status, "ready")))
      .orderBy(media.sortOrder);

    return NextResponse.json({
      post: {
        ...updatedPost,
        metadata: updatedPost.metadata ? JSON.parse(updatedPost.metadata) : null,
        media: postMedia,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get existing post
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get associated media to delete from R2
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId));

    // Delete media files from R2
    if (postMedia.length > 0) {
      const storageKeys = postMedia.map((m) => m.storageKey);
      try {
        await deleteMultipleFromR2(storageKeys);
      } catch (e) {
        console.error("Failed to delete media from R2:", e);
        // Continue with database deletion even if R2 fails
      }
    }

    // Delete media records (cascade will handle this, but being explicit)
    await db.delete(media).where(eq(media.postId, postId));

    // Delete post
    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
