import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPresignedUploadUrl, isR2Configured } from "@/lib/storage/r2";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB - LinkedIn image limit
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB - LinkedIn video limit
const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100MB - LinkedIn document limit

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

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fileName, contentType, fileSize, postId } = body;

    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "fileName, contentType, and fileSize are required" },
        { status: 400 }
      );
    }

    if (!ALL_ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: JPG, PNG, GIF, WebP, MP4, MOV, PDF" },
        { status: 400 }
      );
    }

    // Validate file size based on media type
    {
      if (ALLOWED_IMAGE_TYPES.includes(contentType) && fileSize > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Image must be less than 5MB (LinkedIn limit)" },
          { status: 400 }
        );
      }
      if (ALLOWED_VIDEO_TYPES.includes(contentType) && fileSize > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { error: "Video must be less than 200MB (LinkedIn limit)" },
          { status: 400 }
        );
      }
      if (ALLOWED_DOCUMENT_TYPES.includes(contentType) && fileSize > MAX_DOCUMENT_SIZE) {
        return NextResponse.json(
          { error: "Document must be less than 100MB (LinkedIn limit)" },
          { status: 400 }
        );
      }
    }

    const presigned = await getPresignedUploadUrl({
      fileName,
      contentType,
      userId: user.id,
      postId,
    });

    return NextResponse.json(presigned);
  } catch (error) {
return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
