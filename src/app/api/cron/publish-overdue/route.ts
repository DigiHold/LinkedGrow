import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts, posts, media } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notifySearchEngines } from "@/lib/search-indexing";
import {
  createLinkedInPost,
  createLinkedInPostWithImage,
  createLinkedInPostWithVideo,
  createLinkedInPostWithDocument,
} from "@/lib/linkedin";
import { getLinkedInUser } from "@/lib/team-utils";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

/**
 * Vercel Cron fallback - runs every 5 minutes.
 * Catches any scheduled blog posts or LinkedIn posts that QStash failed to deliver.
 * Uses CRON_SECRET auth (independent of QStash).
 */
export async function GET(request: NextRequest) {
  // Verify Vercel cron auth
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("[Cron] publish-overdue: unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    blogPostsPublished: [] as string[],
    blogPostsFailed: [] as string[],
    linkedInPostsPublished: [] as string[],
    linkedInPostsFailed: [] as string[],
  };

  // --- 1. Publish overdue blog posts ---
  try {
    const overdueBlogPosts = await db
      .select()
      .from(blogPosts)
      .where(
        and(eq(blogPosts.status, "scheduled"), lte(blogPosts.scheduledAt, now))
      );

    for (const post of overdueBlogPosts) {
      try {
        await db
          .update(blogPosts)
          .set({
            status: "published",
            publishedAt: now,
            qstashMessageId: null,
            updatedAt: now,
          })
          .where(eq(blogPosts.slug, post.slug));

        revalidatePath(`/blog/${post.slug}`);
        revalidatePath("/blog");

        // Notify search engines
        try {
          await notifySearchEngines([`${BASE_URL}/blog/${post.slug}`]);
        } catch {
          // Non-critical, don't fail the publish
        }

        results.blogPostsPublished.push(post.slug);
        console.log(`[Cron] Published overdue blog post: ${post.slug}`);
      } catch (err) {
        results.blogPostsFailed.push(post.slug);
        console.error(`[Cron] Failed to publish blog post ${post.slug}:`, err);
      }
    }
  } catch (err) {
    console.error("[Cron] Error querying overdue blog posts:", err);
  }

  // --- 2. Publish overdue LinkedIn posts ---
  try {
    const overdueLinkedInPosts = await db
      .select()
      .from(posts)
      .where(
        and(eq(posts.status, "scheduled"), lte(posts.scheduledAt, now))
      );

    for (const post of overdueLinkedInPosts) {
      try {
        const result = await getLinkedInUser(post.userId);

        if (!result) {
          await db
            .update(posts)
            .set({
              status: "failed",
              errorMessage: "[Cron fallback] User not found or team membership revoked",
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));
          results.linkedInPostsFailed.push(post.id);
          continue;
        }

        const { linkedInUser } = result;

        if (!linkedInUser?.linkedinAccessToken || !linkedInUser?.linkedinProfileId) {
          await db
            .update(posts)
            .set({
              status: "failed",
              errorMessage: "[Cron fallback] LinkedIn account not connected",
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));
          results.linkedInPostsFailed.push(post.id);
          continue;
        }

        // Check token expiry
        if (
          linkedInUser.linkedinTokenExpiry &&
          new Date(linkedInUser.linkedinTokenExpiry) < new Date()
        ) {
          await db
            .update(posts)
            .set({
              status: "failed",
              errorMessage: "[Cron fallback] LinkedIn token expired - reconnect your account",
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));
          results.linkedInPostsFailed.push(post.id);
          continue;
        }

        // Determine posting target
        const isOrganization =
          linkedInUser.linkedinPostingTarget === "organization" &&
          linkedInUser.linkedinSelectedOrgId;
        const authorId = isOrganization
          ? linkedInUser.linkedinSelectedOrgId!
          : linkedInUser.linkedinProfileId;
        const authorType: "person" | "organization" = isOrganization
          ? "organization"
          : "person";

        // Get attached media
        const postMedia = await db
          .select()
          .from(media)
          .where(eq(media.postId, post.id));

        let postResult;
        const firstDocument = postMedia.find(
          (m) => m.mimeType === "application/pdf"
        );
        const firstVideo = postMedia.find((m) =>
          m.mimeType?.startsWith("video/")
        );
        const firstImage = postMedia.find((m) =>
          m.mimeType?.startsWith("image/")
        );

        if (firstDocument?.storageUrl) {
          postResult = await createLinkedInPostWithDocument(
            linkedInUser.linkedinAccessToken,
            authorId,
            post.content,
            firstDocument.storageUrl,
            firstDocument.altText || "Carousel",
            "PUBLIC",
            authorType
          );
        } else if (firstVideo?.storageUrl) {
          postResult = await createLinkedInPostWithVideo(
            linkedInUser.linkedinAccessToken,
            authorId,
            post.content,
            firstVideo.storageUrl,
            firstVideo.mimeType,
            firstVideo.altText || undefined,
            "PUBLIC",
            authorType
          );
        } else if (firstImage?.storageUrl) {
          postResult = await createLinkedInPostWithImage(
            linkedInUser.linkedinAccessToken,
            authorId,
            post.content,
            firstImage.storageUrl,
            firstImage.altText || undefined,
            "PUBLIC",
            authorType
          );
        } else {
          postResult = await createLinkedInPost(
            linkedInUser.linkedinAccessToken,
            authorId,
            post.content,
            "PUBLIC",
            authorType
          );
        }

        await db
          .update(posts)
          .set({
            status: "published",
            publishedAt: new Date(),
            linkedinPostId: postResult.id,
            errorMessage: null,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, post.id));

        results.linkedInPostsPublished.push(post.id);
        console.log(`[Cron] Published overdue LinkedIn post: ${post.id}`);
      } catch (err) {
        // Mark as failed
        try {
          await db
            .update(posts)
            .set({
              status: "failed",
              errorMessage: `[Cron fallback] ${err instanceof Error ? err.message : "Unknown error"}`,
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));
        } catch {
          // Ignore DB update failure
        }
        results.linkedInPostsFailed.push(post.id);
        console.error(`[Cron] Failed to publish LinkedIn post ${post.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[Cron] Error querying overdue LinkedIn posts:", err);
  }

  const totalPublished =
    results.blogPostsPublished.length + results.linkedInPostsPublished.length;
  const totalFailed =
    results.blogPostsFailed.length + results.linkedInPostsFailed.length;

  if (totalPublished > 0 || totalFailed > 0) {
    console.log("[Cron] publish-overdue summary:", JSON.stringify(results));
  }

  return NextResponse.json({
    success: true,
    published: totalPublished,
    failed: totalFailed,
    details: results,
  });
}
