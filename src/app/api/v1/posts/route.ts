import { NextRequest } from "next/server";
import { db, posts, media } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  authenticateApiRequest,
  hasScope,
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/api-auth";

// GET /api/v1/posts - List posts
export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await authenticateApiRequest(request);
  if (!auth.success) {
    return apiErrorResponse(auth.error!, auth.statusCode!);
  }

  // Check scope
  if (!hasScope(auth.scopes!, "posts:read")) {
    return apiErrorResponse("Missing required scope: posts:read", 403);
  }

  try {
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let whereClause = eq(posts.userId, auth.userId!);
    if (status) {
      whereClause = and(whereClause, eq(posts.status, status as "draft" | "scheduled" | "published" | "failed"))!;
    }

    // Fetch posts
    const userPosts = await db.query.posts.findMany({
      where: whereClause,
      orderBy: [desc(posts.createdAt)],
      limit,
      offset,
    });

    // Get total count
    const allPosts = await db.query.posts.findMany({
      where: whereClause,
    });

    return apiSuccessResponse({
      posts: userPosts.map((post) => ({
        id: post.id,
        content: post.content,
        status: post.status,
        postType: post.postType,
        scheduledAt: post.scheduledAt?.toISOString() || null,
        publishedAt: post.publishedAt?.toISOString() || null,
        linkedinPostId: post.linkedinPostId,
        linkedinPostUrl: post.linkedinPostUrl,
        metadata: post.metadata ? JSON.parse(post.metadata) : null,
        createdAt: post.createdAt?.toISOString() || null,
        updatedAt: post.updatedAt?.toISOString() || null,
      })),
      pagination: {
        total: allPosts.length,
        limit,
        offset,
        hasMore: offset + limit < allPosts.length,
      },
    });
  } catch (error) {
    console.error("API: Failed to fetch posts:", error);
    return apiErrorResponse("Failed to fetch posts", 500);
  }
}

// POST /api/v1/posts - Create a new post
export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateApiRequest(request);
  if (!auth.success) {
    return apiErrorResponse(auth.error!, auth.statusCode!);
  }

  // Check scope
  if (!hasScope(auth.scopes!, "posts:write")) {
    return apiErrorResponse("Missing required scope: posts:write", 403);
  }

  try {
    const body = await request.json();
    const { content, status = "draft", postType = "text", scheduledAt, metadata } = body;

    // Validate required fields
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return apiErrorResponse("Content is required", 400);
    }

    if (content.length > 3000) {
      return apiErrorResponse("Content must be 3000 characters or less", 400);
    }

    // Validate status
    const validStatuses = ["draft", "scheduled", "published", "failed"];
    if (!validStatuses.includes(status)) {
      return apiErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    // Validate postType
    const validPostTypes = ["text", "image", "carousel", "video"];
    if (!validPostTypes.includes(postType)) {
      return apiErrorResponse(`Invalid postType. Must be one of: ${validPostTypes.join(", ")}`, 400);
    }

    // Validate scheduledAt for scheduled posts
    if (status === "scheduled") {
      if (!scheduledAt) {
        return apiErrorResponse("scheduledAt is required for scheduled posts", 400);
      }
      const scheduleDate = new Date(scheduledAt);
      if (isNaN(scheduleDate.getTime())) {
        return apiErrorResponse("Invalid scheduledAt date format", 400);
      }
      if (scheduleDate <= new Date()) {
        return apiErrorResponse("scheduledAt must be in the future", 400);
      }
    }

    // Create post
    const postId = nanoid();
    const now = new Date();

    await db.insert(posts).values({
      id: postId,
      userId: auth.userId!,
      content: content.trim(),
      status: status as "draft" | "scheduled" | "published" | "failed",
      postType: postType as "text" | "image" | "carousel" | "video",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Fetch the created post
    const newPost = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    return apiSuccessResponse(
      {
        id: newPost!.id,
        content: newPost!.content,
        status: newPost!.status,
        postType: newPost!.postType,
        scheduledAt: newPost!.scheduledAt?.toISOString() || null,
        createdAt: newPost!.createdAt?.toISOString() || null,
      },
      201
    );
  } catch (error) {
    console.error("API: Failed to create post:", error);
    return apiErrorResponse("Failed to create post", 500);
  }
}
