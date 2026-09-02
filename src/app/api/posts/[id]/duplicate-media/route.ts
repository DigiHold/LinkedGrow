// Duplicate-media API: copies the source post's R2 file to a fresh key so a
// duplicated post owns its own media. Without this, deleting the source
// would also break the duplicate's image/PDF/video (both rows would point
// at the same R2 object).
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, media, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { copyR2Object, isR2Configured } from "@/lib/storage/r2";
import { canUserAccessPost } from "@/lib/post-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isR2Configured())) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    const { id: sourcePostId } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [sourcePost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, sourcePostId))
      .limit(1);
    if (!sourcePost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!(await canUserAccessPost(user.id, sourcePost.userId))) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const sourceMedia = await db
      .select()
      .from(media)
      .where(and(eq(media.postId, sourcePostId), eq(media.status, "ready")));

    if (sourceMedia.length === 0) {
      return NextResponse.json({ media: null });
    }

    // Mirror the publish-post precedence: PDF > video > image. Only copy
    // the one media item that will actually be sent to LinkedIn so we
    // don't waste R2 PUTs on items the publisher will ignore.
    const pickMedia =
      sourceMedia.find((m) => m.mimeType === "application/pdf") ||
      sourceMedia.find((m) => m.mimeType?.startsWith("video/")) ||
      sourceMedia.find((m) => m.mimeType?.startsWith("image/")) ||
      sourceMedia[0];

    const ext = pickMedia.fileName?.split(".").pop() || pickMedia.mimeType?.split("/")[1] || "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const destinationKey = `users/${user.id}/uploads/${timestamp}-${random}-duplicate.${ext}`;

    const copied = await copyR2Object(pickMedia.storageKey, destinationKey);

    return NextResponse.json({
      media: {
        storageUrl: copied.url,
        storageKey: copied.key,
        mimeType: pickMedia.mimeType,
        fileSize: pickMedia.fileSize,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate media" },
      { status: 500 }
    );
  }
}
