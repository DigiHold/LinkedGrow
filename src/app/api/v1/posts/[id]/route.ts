import { NextRequest } from "next/server";
import { db, posts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  authenticateApiRequest,
  hasScope,
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/api-auth";

// GET /api/v1/posts/:id - Get a single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate
  const auth = await authenticateApiRequest(request);
  if (!auth.success) {
    return apiErrorResponse(auth.error!, auth.statusCode!);
  }

  // Check scope
  if (!hasScope(auth.scopes!, "posts:read")) {
    return apiErrorResponse("Missing required scope: posts:read", 403);
  }

  const { id } = await params;

  try {
    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.userId, auth.userId!)),
    });

    if (!post) {
      return apiErrorResponse("Post not found", 404);
    }

    return apiSuccessResponse({
      id: post.id,
      content: post.content,
      status: post.status,
      postType: post.postType,
      scheduledAt: post.scheduledAt?.toISOString() || null,
      publishedAt: post.publishedAt?.toISOString() || null,
      linkedinPostId: post.linkedinPostId,
      linkedinPostUrl: post.linkedinPostUrl,
      metadata: post.metadata ? JSON.parse(post.metadata) : null,
      errorMessage: post.errorMessage,
      createdAt: post.createdAt?.toISOString() || null,
      updatedAt: post.updatedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("API: Failed to fetch post:", error);
    return apiErrorResponse("Failed to fetch post", 500);
  }
}

// PATCH /api/v1/posts/:id - Update a post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate
  const auth = await authenticateApiRequest(request);
  if (!auth.success) {
    return apiErrorResponse(auth.error!, auth.statusCode!);
  }

  // Check scope
  if (!hasScope(auth.scopes!, "posts:write")) {
    return apiErrorResponse("Missing required scope: posts:write", 403);
  }

  const { id } = await params;

  try {
    // Find existing post
    const existingPost = await db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.userId, auth.userId!)),
    });

    if (!existingPost) {
      return apiErrorResponse("Post not found", 404);
    }

    // Can't edit published posts
    if (existingPost.status === "published") {
      return apiErrorResponse("Cannot edit published posts", 400);
    }

    const body = await request.json();
    const { content, status, postType, scheduledAt, metadata } = body;

    // Build update object
    const updates: Partial<typeof posts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length === 0) {
        return apiErrorResponse("Content must be a non-empty string", 400);
      }
      if (content.length > 3000) {
        return apiErrorResponse("Content must be 3000 characters or less", 400);
      }
      updates.content = content.trim();
    }

    if (status !== undefined) {
      const validStatuses = ["draft", "scheduled"];
      if (!validStatuses.includes(status)) {
        return apiErrorResponse(`Invalid status for update. Must be one of: ${validStatuses.join(", ")}`, 400);
      }
      updates.status = status;
    }

    if (postType !== undefined) {
      const validPostTypes = ["text", "image", "carousel", "video"];
      if (!validPostTypes.includes(postType)) {
        return apiErrorResponse(`Invalid postType. Must be one of: ${validPostTypes.join(", ")}`, 400);
      }
      updates.postType = postType;
    }

    if (scheduledAt !== undefined) {
      if (scheduledAt === null) {
        updates.scheduledAt = null;
      } else {
        const scheduleDate = new Date(scheduledAt);
        if (isNaN(scheduleDate.getTime())) {
          return apiErrorResponse("Invalid scheduledAt date format", 400);
        }
        if (scheduleDate <= new Date()) {
          return apiErrorResponse("scheduledAt must be in the future", 400);
        }
        updates.scheduledAt = scheduleDate;
      }
    }

    if (metadata !== undefined) {
      updates.metadata = metadata ? JSON.stringify(metadata) : null;
    }

    // Update the post
    await db.update(posts).set(updates).where(eq(posts.id, id));

    // Fetch updated post
    const updatedPost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    return apiSuccessResponse({
      id: updatedPost!.id,
      content: updatedPost!.content,
      status: updatedPost!.status,
      postType: updatedPost!.postType,
      scheduledAt: updatedPost!.scheduledAt?.toISOString() || null,
      metadata: updatedPost!.metadata ? JSON.parse(updatedPost!.metadata) : null,
      updatedAt: updatedPost!.updatedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("API: Failed to update post:", error);
    return apiErrorResponse("Failed to update post", 500);
  }
}

// DELETE /api/v1/posts/:id - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate
  const auth = await authenticateApiRequest(request);
  if (!auth.success) {
    return apiErrorResponse(auth.error!, auth.statusCode!);
  }

  // Check scope
  if (!hasScope(auth.scopes!, "posts:delete")) {
    return apiErrorResponse("Missing required scope: posts:delete", 403);
  }

  const { id } = await params;

  try {
    // Find existing post
    const existingPost = await db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.userId, auth.userId!)),
    });

    if (!existingPost) {
      return apiErrorResponse("Post not found", 404);
    }

    // Delete the post
    await db.delete(posts).where(eq(posts.id, id));

    return apiSuccessResponse({ deleted: true, id });
  } catch (error) {
    console.error("API: Failed to delete post:", error);
    return apiErrorResponse("Failed to delete post", 500);
  }
}
