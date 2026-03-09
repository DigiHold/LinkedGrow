import { NextRequest } from "next/server";
import { db, posts, media } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  authenticateApiRequest,
  hasScope,
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/api-auth";
import { uploadToR2, deleteFromR2, isR2Configured } from "@/lib/storage/r2";
import { schedulePost, cancelScheduledPost } from "@/lib/qstash";
import { PLANS, PlanId } from "@/lib/plans";
import { users } from "@/lib/db/schema";
import sharp from "sharp";

// Allowed image types - no video allowed via API
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FIRST_COMMENT_LENGTH = 1250; // LinkedIn comment limit

// Serialize a post with its media for API response
function serializePost(
  post: typeof posts.$inferSelect,
  postMedia: (typeof media.$inferSelect)[]
) {
  return {
    id: post.id,
    content: post.content,
    status: post.status,
    postType: post.postType,
    firstComment: post.firstComment || null,
    scheduledAt: post.scheduledAt?.toISOString() || null,
    publishedAt: post.publishedAt?.toISOString() || null,
    linkedinPostId: post.linkedinPostId,
    linkedinPostUrl: post.linkedinPostUrl,
    metadata: post.metadata ? JSON.parse(post.metadata) : null,
    errorMessage: post.errorMessage,
    media: postMedia.map((m) => ({
      id: m.id,
      storageUrl: m.storageUrl,
      mimeType: m.mimeType,
      fileSize: m.fileSize,
      width: m.width,
      height: m.height,
      altText: m.altText,
    })),
    createdAt: post.createdAt?.toISOString() || null,
    updatedAt: post.updatedAt?.toISOString() || null,
  };
}

/**
 * Process and upload a base64 image securely.
 */
async function processAndUploadImage(
  base64Input: string,
  userId: string
): Promise<{ storageUrl: string; storageKey: string; mimeType: string; fileSize: number; width: number | null; height: number | null } | { error: string; status: number }> {
  if (!isR2Configured()) {
    return { error: "Storage not configured", status: 503 };
  }

  const base64Data = base64Input.replace(/^data:[^;]+;base64,/, "");

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
    return { error: "Invalid base64 data", status: 400 };
  }

  const inputBuffer = Buffer.from(base64Data, "base64");

  if (inputBuffer.length > MAX_IMAGE_SIZE) {
    return { error: "Image too large (max 10MB)", status: 400 };
  }

  if (inputBuffer.length === 0) {
    return { error: "Empty image data", status: 400 };
  }

  let inputMeta;
  try {
    inputMeta = await sharp(inputBuffer).metadata();
  } catch {
    return { error: "Invalid image data. Only JPEG, PNG, WebP, and GIF images are allowed", status: 400 };
  }

  const detectedMime = `image/${inputMeta.format}`;
  if (!ALLOWED_IMAGE_TYPES.includes(detectedMime)) {
    return { error: `Unsupported image format: ${inputMeta.format}. Allowed: JPEG, PNG, WebP, GIF`, status: 400 };
  }

  const optimizedBuffer = await sharp(inputBuffer)
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const finalMeta = await sharp(optimizedBuffer).metadata();

  const fileName = `post-image-${nanoid()}.webp`;

  const uploadResult = await uploadToR2(optimizedBuffer, {
    fileName,
    contentType: "image/webp",
    userId,
  });

  return {
    storageUrl: uploadResult.url,
    storageKey: uploadResult.key,
    mimeType: "image/webp",
    fileSize: uploadResult.size,
    width: finalMeta.width || null,
    height: finalMeta.height || null,
  };
}

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

    // Fetch media for this post
    const postMedia = await db
      .select()
      .from(media)
      .where(and(eq(media.postId, id), eq(media.status, "ready")))
      .orderBy(media.sortOrder);

    return apiSuccessResponse(serializePost(post, postMedia));
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
    const { content, status, scheduledAt, metadata, mediaData, firstComment } = body;

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

    // Validate firstComment
    if (firstComment !== undefined) {
      if (firstComment === null) {
        updates.firstComment = null;
      } else {
        if (typeof firstComment !== "string") {
          return apiErrorResponse("firstComment must be a string", 400);
        }
        if (firstComment.length > MAX_FIRST_COMMENT_LENGTH) {
          return apiErrorResponse(`firstComment must be ${MAX_FIRST_COMMENT_LENGTH} characters or less`, 400);
        }
        updates.firstComment = firstComment.trim();
      }
    }

    if (scheduledAt !== undefined) {
      if (scheduledAt === null) {
        updates.scheduledAt = null;
        // Cancel existing QStash schedule if any
        if (existingPost.qstashMessageId) {
          try {
            await cancelScheduledPost(existingPost.qstashMessageId);
          } catch {
            // Non-fatal - message may have already been delivered
          }
          updates.qstashMessageId = null;
        }
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

    // Handle scheduling status changes
    if (status === "scheduled" || (updates.scheduledAt && existingPost.status !== "scheduled")) {
      const finalScheduledAt = updates.scheduledAt || existingPost.scheduledAt;
      if (!finalScheduledAt) {
        return apiErrorResponse("scheduledAt is required for scheduled posts", 400);
      }
      // Cancel old schedule
      if (existingPost.qstashMessageId) {
        try {
          await cancelScheduledPost(existingPost.qstashMessageId);
        } catch {
          // Non-fatal
        }
      }
      // Create new schedule
      const newQstashId = await schedulePost(id, finalScheduledAt);
      updates.qstashMessageId = newQstashId;
      updates.status = "scheduled";
    }

    if (metadata !== undefined) {
      updates.metadata = metadata ? JSON.stringify(metadata) : null;
    }

    // Validate mediaData format if provided
    if (mediaData !== undefined && mediaData !== null) {
      if (typeof mediaData !== "object" || typeof mediaData.base64 !== "string") {
        return apiErrorResponse("mediaData must be an object with a base64 string field", 400);
      }
    }

    // Process new image if provided
    if (mediaData?.base64) {
      const uploadResult = await processAndUploadImage(mediaData.base64, auth.userId!);
      if ("error" in uploadResult) {
        return apiErrorResponse(uploadResult.error, uploadResult.status);
      }

      // Delete existing media for this post from R2 and DB
      const existingMedia = await db
        .select()
        .from(media)
        .where(eq(media.postId, id));

      for (const m of existingMedia) {
        try {
          await deleteFromR2(m.storageKey);
        } catch {
          // Non-fatal - continue with DB cleanup
        }
      }
      if (existingMedia.length > 0) {
        await db.delete(media).where(eq(media.postId, id));
      }

      // Insert new media record
      const mediaId = nanoid();
      await db.insert(media).values({
        id: mediaId,
        userId: auth.userId!,
        postId: id,
        storageKey: uploadResult.storageKey,
        storageUrl: uploadResult.storageUrl,
        fileName: `post-image-${id}.webp`,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        width: uploadResult.width,
        height: uploadResult.height,
        status: "ready",
        createdAt: new Date(),
      });

      updates.postType = "image";
    }

    // If mediaData is explicitly null, remove existing media
    if (mediaData === null) {
      const existingMedia = await db
        .select()
        .from(media)
        .where(eq(media.postId, id));

      for (const m of existingMedia) {
        try {
          await deleteFromR2(m.storageKey);
        } catch {
          // Non-fatal
        }
      }
      if (existingMedia.length > 0) {
        await db.delete(media).where(eq(media.postId, id));
      }

      updates.postType = "text";
    }

    // Update the post
    await db.update(posts).set(updates).where(eq(posts.id, id));

    // Fetch updated post with media
    const updatedPost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    const postMedia = await db
      .select()
      .from(media)
      .where(and(eq(media.postId, id), eq(media.status, "ready")))
      .orderBy(media.sortOrder);

    return apiSuccessResponse(serializePost(updatedPost!, postMedia));
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

    // Delete media from R2 first
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, id));

    for (const m of postMedia) {
      try {
        await deleteFromR2(m.storageKey);
      } catch {
        // Non-fatal - continue with deletion
      }
    }

    // Cancel QStash schedule if any
    if (existingPost.qstashMessageId) {
      try {
        await cancelScheduledPost(existingPost.qstashMessageId);
      } catch {
        // Non-fatal
      }
    }

    // Delete the post (media cascade-deletes via FK)
    await db.delete(posts).where(eq(posts.id, id));

    return apiSuccessResponse({ deleted: true, id });
  } catch (error) {
    console.error("API: Failed to delete post:", error);
    return apiErrorResponse("Failed to delete post", 500);
  }
}
