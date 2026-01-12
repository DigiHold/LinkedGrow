// Media API - Upload and manage media files
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media, users, posts } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  uploadToR2,
  uploadBase64ToR2,
  getPresignedUploadUrl,
  isR2Configured,
} from "@/lib/storage/r2";
import sharp from "sharp";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// GET /api/media - Get all media for current user (or specific post)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const conditions = [eq(media.userId, user.id), eq(media.status, "ready")];

    if (postId) {
      conditions.push(eq(media.postId, postId));
    }

    const userMedia = await db
      .select()
      .from(media)
      .where(and(...conditions))
      .orderBy(media.sortOrder)
      .limit(limit);

    return NextResponse.json({ media: userMedia });
  } catch (error) {
    console.error("Get media error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST /api/media - Upload media (supports multipart form or base64 JSON)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";

    let uploadResult;
    let fileName: string;
    let mimeType: string;
    let postId: string | undefined;
    let sortOrder = 0;
    let altText: string | undefined;
    let caption: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large (max 10MB)" },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type" },
          { status: 400 }
        );
      }

      fileName = file.name;
      mimeType = file.type;
      postId = formData.get("postId")?.toString();
      sortOrder = parseInt(formData.get("sortOrder")?.toString() || "0");
      altText = formData.get("altText")?.toString();
      caption = formData.get("caption")?.toString();

      // Verify post belongs to user if postId provided
      if (postId) {
        const [post] = await db
          .select()
          .from(posts)
          .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
          .limit(1);

        if (!post) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }
      }

      // Convert to buffer and optimize
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Optimize image with sharp
      const optimizedBuffer = await sharp(inputBuffer)
        .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      mimeType = "image/webp";
      fileName = fileName.replace(/\.[^.]+$/, ".webp");

      uploadResult = await uploadToR2(optimizedBuffer, {
        fileName,
        contentType: mimeType,
        userId: user.id,
        postId,
      });

      // Store dimensions
      const finalMeta = await sharp(optimizedBuffer).metadata();

      // Create media record
      const mediaId = nanoid();
      await db.insert(media).values({
        id: mediaId,
        userId: user.id,
        postId: postId || null,
        storageKey: uploadResult.key,
        storageUrl: uploadResult.url,
        fileName,
        mimeType,
        fileSize: uploadResult.size,
        width: finalMeta.width || null,
        height: finalMeta.height || null,
        sortOrder,
        altText: altText || null,
        caption: caption || null,
        status: "ready",
        createdAt: new Date(),
      });

      // Fetch created record
      const [newMedia] = await db
        .select()
        .from(media)
        .where(eq(media.id, mediaId))
        .limit(1);

      return NextResponse.json({ media: newMedia });
    } else {
      // Handle JSON with base64 data
      const body = await request.json();
      const { base64, fileName: providedFileName, postId: providedPostId, sortOrder: providedSortOrder, altText: providedAltText, caption: providedCaption } = body;

      if (!base64) {
        return NextResponse.json(
          { error: "No image data provided" },
          { status: 400 }
        );
      }

      fileName = providedFileName || `image-${Date.now()}.webp`;
      postId = providedPostId;
      sortOrder = providedSortOrder || 0;
      altText = providedAltText;
      caption = providedCaption;

      // Verify post belongs to user if postId provided
      if (postId) {
        const [post] = await db
          .select()
          .from(posts)
          .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
          .limit(1);

        if (!post) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }
      }

      // Decode base64 and optimize
      const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
      const inputBuffer = Buffer.from(base64Data, "base64");

      if (inputBuffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large (max 10MB)" },
          { status: 400 }
        );
      }

      // Optimize with sharp
      const optimizedBuffer = await sharp(inputBuffer)
        .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      mimeType = "image/webp";
      fileName = fileName.replace(/\.[^.]+$/, ".webp");

      uploadResult = await uploadToR2(optimizedBuffer, {
        fileName,
        contentType: mimeType,
        userId: user.id,
        postId,
      });

      const finalMeta = await sharp(optimizedBuffer).metadata();

      // Create media record
      const mediaId = nanoid();
      await db.insert(media).values({
        id: mediaId,
        userId: user.id,
        postId: postId || null,
        storageKey: uploadResult.key,
        storageUrl: uploadResult.url,
        fileName,
        mimeType,
        fileSize: uploadResult.size,
        width: finalMeta.width || null,
        height: finalMeta.height || null,
        sortOrder,
        altText: altText || null,
        caption: caption || null,
        status: "ready",
        createdAt: new Date(),
      });

      // Fetch created record
      const [newMedia] = await db
        .select()
        .from(media)
        .where(eq(media.id, mediaId))
        .limit(1);

      return NextResponse.json({ media: newMedia });
    }
  } catch (error) {
    console.error("Upload media error:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}

// POST /api/media/presign - Get presigned URL for direct upload
export async function presignedUrl(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fileName, contentType, postId } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const presigned = await getPresignedUploadUrl({
      fileName,
      contentType,
      userId: user.id,
      postId,
    });

    return NextResponse.json(presigned);
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
