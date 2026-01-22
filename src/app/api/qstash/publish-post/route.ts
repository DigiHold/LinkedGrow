import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db, posts, users, media } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createLinkedInPost, createLinkedInPostWithImage } from "@/lib/linkedin";

// Initialize QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();

    // Verify the request is from QStash
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = await receiver.verify({
      signature,
      body,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/publish-post`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the body
    const { postId } = JSON.parse(body);

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Get the post
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if post is still scheduled (not already published or cancelled)
    if (post.status !== "scheduled") {
      return NextResponse.json({
        success: true,
        message: `Post already ${post.status}, skipping`,
      });
    }

    // Get user's LinkedIn credentials
    const user = await db.query.users.findFirst({
      where: eq(users.id, post.userId),
      columns: {
        linkedinAccessToken: true,
        linkedinProfileId: true,
        linkedinTokenExpiry: true,
        linkedinPostingTarget: true,
        linkedinSelectedOrgId: true,
        linkedinSelectedOrgName: true,
      },
    });

    if (!user?.linkedinAccessToken || !user?.linkedinProfileId) {
      // Mark post as failed
      await db.update(posts)
        .set({
          status: "failed",
          errorMessage: "LinkedIn account not connected",
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    // Check if token has expired
    if (user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry) < new Date()) {
      await db.update(posts)
        .set({
          status: "failed",
          errorMessage: "LinkedIn token expired - please reconnect your account",
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      return NextResponse.json({ error: "LinkedIn token expired" }, { status: 400 });
    }

    // Determine posting target
    const isOrganization = user.linkedinPostingTarget === "organization" && user.linkedinSelectedOrgId;
    const authorId = isOrganization ? user.linkedinSelectedOrgId! : user.linkedinProfileId;
    const authorType: "person" | "organization" = isOrganization ? "organization" : "person";

    // Get attached media if any
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId));

    let result;
    const firstImage = postMedia.find(m => m.mimeType?.startsWith("image/"));

    if (firstImage?.storageUrl) {
      // Post with image
      result = await createLinkedInPostWithImage(
        user.linkedinAccessToken,
        authorId,
        post.content,
        firstImage.storageUrl,
        firstImage.altText || undefined,
        "PUBLIC",
        authorType
      );
    } else {
      // Text-only post
      result = await createLinkedInPost(
        user.linkedinAccessToken,
        authorId,
        post.content,
        "PUBLIC",
        authorType
      );
    }

    // Update post as published
    await db.update(posts)
      .set({
        status: "published",
        publishedAt: new Date(),
        linkedinPostId: result.id,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    console.log(`Post ${postId} published successfully to LinkedIn`);

    return NextResponse.json({
      success: true,
      postId,
      linkedinPostId: result.id,
    });

  } catch (error) {
    console.error("QStash publish error:", error);

    // Try to get postId from body to mark as failed
    try {
      const body = await request.clone().text();
      const { postId } = JSON.parse(body);
      if (postId) {
        await db.update(posts)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId));
      }
    } catch {
      // Ignore errors trying to mark post as failed
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish post" },
      { status: 500 }
    );
  }
}
