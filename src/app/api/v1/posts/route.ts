import { NextRequest } from "next/server";
import { db, posts, media, linkedinAccounts } from "@/lib/db";
import { loadSessionUser } from "@/lib/auth-user";
import { eq, desc, and, inArray, count, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  authenticateApiRequest,
  hasScope,
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/api-auth";
import { uploadToR2, isR2Configured } from "@/lib/storage/r2";
import { PLANS, PlanId } from "@/lib/plans";
import { users } from "@/lib/db/schema";
import sharp from "sharp";

// Allowed image types - no video allowed via API (same as main app upload)
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
    linkedinAccountId: post.linkedinAccountId || null,
    metadata: post.metadata ? JSON.parse(post.metadata) : null,
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
 * - Strips data URL prefix
 * - Validates size (max 10MB)
 * - Validates it's actually a valid image via Sharp (rejects non-image data)
 * - Converts to WebP, resizes to max 2048x2048
 * - Uploads to R2
 */
async function processAndUploadImage(
  base64Input: string,
  userId: string
): Promise<{ storageUrl: string; storageKey: string; mimeType: string; fileSize: number; width: number | null; height: number | null } | { error: string; status: number }> {
  if (!isR2Configured()) {
    return { error: "Storage not configured", status: 503 };
  }

  // Strip data URL prefix if present
  const base64Data = base64Input.replace(/^data:[^;]+;base64,/, "");

  // Validate base64 format - reject if it contains non-base64 characters
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
    return { error: "Invalid base64 data", status: 400 };
  }

  const inputBuffer = Buffer.from(base64Data, "base64");

  // Validate size before processing
  if (inputBuffer.length > MAX_IMAGE_SIZE) {
    return { error: "Image too large (max 10MB)", status: 400 };
  }

  if (inputBuffer.length === 0) {
    return { error: "Empty image data", status: 400 };
  }

  // Validate mime type by reading the image metadata with Sharp
  // This rejects any non-image data (prevents uploading scripts, executables, etc.)
  let inputMeta;
  try {
    inputMeta = await sharp(inputBuffer).metadata();
  } catch {
    return { error: "Invalid image data. Only JPEG, PNG, WebP, and GIF images are allowed", status: 400 };
  }

  // Verify the detected format is in our allowed list
  const detectedMime = `image/${inputMeta.format}`;
  if (!ALLOWED_IMAGE_TYPES.includes(detectedMime)) {
    return { error: `Unsupported image format: ${inputMeta.format}. Allowed: JPEG, PNG, WebP, GIF`, status: 400 };
  }

  // Optimize: resize and convert to WebP
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
      columns: { id: true },
    });

    // Fetch media for all posts in one query
    const postIds = userPosts.map((p) => p.id);
    const postMedia = postIds.length > 0
      ? await db
          .select()
          .from(media)
          .where(and(inArray(media.postId, postIds), eq(media.status, "ready")))
          .orderBy(media.sortOrder)
      : [];

    return apiSuccessResponse({
      posts: userPosts.map((post) =>
        serializePost(post, postMedia.filter((m) => m.postId === post.id))
      ),
      pagination: {
        total: allPosts.length,
        limit,
        offset,
        hasMore: offset + limit < allPosts.length,
      },
    });
  } catch (error) {
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
    const {
      content,
      status = "draft",
      scheduledAt,
      metadata,
      mediaData, // { base64, mimeType? } - base64 image to upload
      firstComment, // Auto-comment after publication
      linkedinAccountId, // Which connected LinkedIn account publishes this post
    } = body;

    // Validate required fields
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return apiErrorResponse("Content is required", 400);
    }

    if (content.length > 3000) {
      return apiErrorResponse("Content must be 3000 characters or less", 400);
    }

    // Validate status
    const validStatuses = ["draft", "scheduled"];
    if (!validStatuses.includes(status)) {
      return apiErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    // Validate firstComment
    if (firstComment !== undefined && firstComment !== null) {
      if (typeof firstComment !== "string") {
        return apiErrorResponse("firstComment must be a string", 400);
      }
      if (firstComment.length > MAX_FIRST_COMMENT_LENGTH) {
        return apiErrorResponse(`firstComment must be ${MAX_FIRST_COMMENT_LENGTH} characters or less`, 400);
      }
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

    // Validate mediaData format if provided
    if (mediaData !== undefined && mediaData !== null) {
      if (typeof mediaData !== "object" || typeof mediaData.base64 !== "string") {
        return apiErrorResponse("mediaData must be an object with a base64 string field", 400);
      }
    }

    // The account choice is checked against the workspace, the same rule the
    // dashboard editor applies: an unknown or disconnected id is refused
    // rather than silently publishing on whichever account is the default.
    let chosenAccountId: string | null = null;
    if (linkedinAccountId !== undefined && linkedinAccountId !== null) {
      if (typeof linkedinAccountId !== "string" || linkedinAccountId.length > 64) {
        return apiErrorResponse("Invalid linkedinAccountId", 400);
      }
      const sessionData = await loadSessionUser(auth.userId!);
      const workspaceId = sessionData?.teamOwnerId ?? auth.userId!;
      const [owned] = await db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.id, linkedinAccountId),
            eq(linkedinAccounts.workspaceId, workspaceId),
            eq(linkedinAccounts.status, "active")
          )
        )
        .limit(1);
      if (!owned) {
        return apiErrorResponse(
          "That LinkedIn account is not connected to this workspace (list yours via GET /api/v1/accounts)",
          400
        );
      }
      chosenAccountId = owned.id;
    }

    // One connected account means no ambiguity: the post is pinned to it
    // right away, so the editor and the API show the account it will
    // publish from instead of a blank that resolves at publish time.
    if (chosenAccountId === null) {
      const sessionData = await loadSessionUser(auth.userId!);
      const workspaceId = sessionData?.teamOwnerId ?? auth.userId!;
      const active = await db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.workspaceId, workspaceId),
            eq(linkedinAccounts.status, "active")
          )
        )
        .limit(2);
      if (active.length === 1) chosenAccountId = active[0]!.id;
    }

    // Get user for plan checks
    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId!),
    });

    if (!user) {
      return apiErrorResponse("User not found", 404);
    }

    const userPlan = (user.plan || "free") as PlanId;

    // Check monthly post creation limit
    const postsPerMonthLimit = PLANS[userPlan].limits.postsPerMonth;
    if (postsPerMonthLimit !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [postCount] = await db
        .select({ count: count() })
        .from(posts)
        .where(and(eq(posts.userId, auth.userId!), gte(posts.createdAt, startOfMonth)));

      if (postCount.count >= postsPerMonthLimit) {
        return apiErrorResponse(
          `Monthly post limit reached (${postsPerMonthLimit}). Pick a plan for unlimited posts.`,
          403
        );
      }
    }

    // Check scheduled posts limit
    if (status === "scheduled") {
      const scheduledPostsLimit = PLANS[userPlan].limits.scheduledPosts;
      if (scheduledPostsLimit !== -1) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [scheduledCount] = await db
          .select({ count: count() })
          .from(posts)
          .where(
            and(
              eq(posts.userId, auth.userId!),
              eq(posts.status, "scheduled"),
              gte(posts.createdAt, startOfMonth)
            )
          );

        if (scheduledCount.count >= scheduledPostsLimit) {
          return apiErrorResponse(
            `Monthly scheduled post limit reached (${scheduledPostsLimit}). Upgrade to Pro for unlimited scheduling.`,
            403
          );
        }
      }
    }

    // Process image if provided
    let uploadedMediaResult: Awaited<ReturnType<typeof processAndUploadImage>> | null = null;
    if (mediaData?.base64) {
      uploadedMediaResult = await processAndUploadImage(mediaData.base64, auth.userId!);
      if ("error" in uploadedMediaResult) {
        return apiErrorResponse(uploadedMediaResult.error, uploadedMediaResult.status);
      }
    }

    // Determine post type based on media
    const postType = uploadedMediaResult && !("error" in uploadedMediaResult) ? "image" : "text";

    // Create post
    const postId = nanoid();
    const now = new Date();

    await db.insert(posts).values({
      id: postId,
      userId: auth.userId!,
      content: content.trim(),
      firstComment: firstComment?.trim() || null,
      status: status as "draft" | "scheduled",
      postType: postType as "text" | "image",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      linkedinAccountId: chosenAccountId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Create media record if image was uploaded
    let postMediaRecords: (typeof media.$inferSelect)[] = [];
    if (uploadedMediaResult && !("error" in uploadedMediaResult)) {
      const mediaId = nanoid();
      await db.insert(media).values({
        id: mediaId,
        userId: auth.userId!,
        postId,
        storageKey: uploadedMediaResult.storageKey,
        storageUrl: uploadedMediaResult.storageUrl,
        fileName: `post-image-${postId}.webp`,
        mimeType: uploadedMediaResult.mimeType,
        fileSize: uploadedMediaResult.fileSize,
        width: uploadedMediaResult.width,
        height: uploadedMediaResult.height,
        status: "ready",
        createdAt: now,
      });

      const [newMedia] = await db
        .select()
        .from(media)
        .where(eq(media.id, mediaId))
        .limit(1);
      if (newMedia) postMediaRecords.push(newMedia);
    }

    // Fetch the created post
    const newPost = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    return apiSuccessResponse(serializePost(newPost!, postMediaRecords), 201);
  } catch (error) {
return apiErrorResponse("Failed to create post", 500);
  }
}
