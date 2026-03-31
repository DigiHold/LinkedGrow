import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db, posts, media } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createLinkedInPost, createLinkedInPostWithImage, createLinkedInPostWithVideo, createLinkedInPostWithDocument, ensureFreshTokens } from "@/lib/linkedin";
import { getLinkedInUser } from "@/lib/team-utils";
import { scheduleFirstComment, scheduleAutoLike } from "@/lib/qstash";
import { triggerTeamAutoEngagement } from "@/lib/team-engagement";

// Initialize QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  let parsedPostId: string | null = null;
  try {
    // Get the raw body for signature verification
    const body = await request.text();

    // Verify the request is from QStash
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.error("QStash publish-post: missing upstash-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/publish-post`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch (verifyError) {
      // URL mismatch is the most common cause - retry without URL binding
      console.warn("QStash publish-post: URL-bound verify failed, retrying without URL:", {
        verifyUrl,
        error: verifyError instanceof Error ? verifyError.message : verifyError,
      });
      try {
        isValid = await receiver.verify({ signature, body });
      } catch (fallbackError) {
        console.error("QStash publish-post: signature verification failed completely:", {
          verifyUrl,
          error: fallbackError instanceof Error ? fallbackError.message : fallbackError,
          bodyPreview: body.substring(0, 200),
        });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (!isValid) {
      console.error("QStash publish-post: signature returned invalid", { verifyUrl });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the body
    const { postId } = JSON.parse(body);
    parsedPostId = postId;

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

    // Get LinkedIn credentials (uses team owner's credentials for team members)
    // Also validates team membership - returns null if user was removed from team
    const result = await getLinkedInUser(post.userId);

    if (!result) {
      // User not found or was removed from team
      await db.update(posts)
        .set({
          status: "failed",
          errorMessage: "User not found or team membership revoked",
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { user: postingUser, linkedInUser } = result;

    if (!linkedInUser?.linkedinProfileId) {
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

    // Auto-refresh tokens if expired
    const { token } = await ensureFreshTokens(linkedInUser.id);
    if (!token) {
      await db.update(posts)
        .set({
          status: "failed",
          errorMessage: "LinkedIn token expired and could not be refreshed - please reconnect your account",
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      return NextResponse.json({ error: "LinkedIn token expired" }, { status: 400 });
    }

    // Determine posting target (uses owner's settings for team members)
    const isOrganization = linkedInUser.linkedinPostingTarget === "organization" && linkedInUser.linkedinSelectedOrgId;
    const authorId = isOrganization ? linkedInUser.linkedinSelectedOrgId! : linkedInUser.linkedinProfileId;
    const authorType: "person" | "organization" = isOrganization ? "organization" : "person";

    // Get attached media if any
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId));

    let postResult;
    const firstDocument = postMedia.find(m => m.mimeType === "application/pdf");
    const firstVideo = postMedia.find(m => m.mimeType?.startsWith("video/"));
    const firstImage = postMedia.find(m => m.mimeType?.startsWith("image/"));

    if (firstDocument?.storageUrl) {
      // Post with document/PDF (carousel) from R2
      postResult = await createLinkedInPostWithDocument(
        token,
        authorId,
        post.content,
        firstDocument.storageUrl,
        firstDocument.altText || "Carousel",
        "PUBLIC",
        authorType
      );
    } else if (firstVideo?.storageUrl) {
      // Post with video from R2
      postResult = await createLinkedInPostWithVideo(
        token,
        authorId,
        post.content,
        firstVideo.storageUrl,
        firstVideo.mimeType,
        firstVideo.altText || undefined,
        "PUBLIC",
        authorType
      );
    } else if (firstImage?.storageUrl) {
      // Post with image from R2
      postResult = await createLinkedInPostWithImage(
        token,
        authorId,
        post.content,
        firstImage.storageUrl,
        firstImage.altText || undefined,
        "PUBLIC",
        authorType
      );
    } else {
      // Text-only post
      postResult = await createLinkedInPost(
        token,
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
        linkedinPostId: postResult.id,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    // Auto-like own post if enabled in user settings (random 10s-2min delay)
    if (postingUser.autoLikeAfterPublish !== false) {
      try {
        const likeDelay = Math.floor(Math.random() * 111) + 10; // 10-120 seconds
        await scheduleAutoLike(postId, likeDelay);
      } catch (error) {
        console.error("Failed to schedule auto-like:", error);
      }
    }

    // Schedule first comment if present (random 1-5 min delay)
    if (post.firstComment) {
      try {
        const delaySeconds = Math.floor(Math.random() * 241) + 60;
        await scheduleFirstComment(postId, delaySeconds);
      } catch (error) {
        console.error("Failed to schedule first comment:", error);
      }
    }

    // Schedule team auto-engagement for company page posts
    if (isOrganization) {
      try {
        await triggerTeamAutoEngagement(postId, postResult.id, linkedInUser.id);
      } catch (error) {
        console.error("Failed to schedule team engagement:", error);
      }
    }

    return NextResponse.json({
      success: true,
      postId,
      linkedinPostId: postResult.id,
    });

  } catch (error) {
    console.error("QStash publish error:", error);

    // Mark post as failed using the postId we extracted earlier
    if (parsedPostId) {
      try {
        await db.update(posts)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(posts.id, parsedPostId));
      } catch {
        // Ignore errors trying to mark post as failed
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish post" },
      { status: 500 }
    );
  }
}
