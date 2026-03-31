/**
 * LinkedIn Post Sync - Fetches all posts from LinkedIn and syncs to local DB
 * Downloads images to R2 for permanent storage
 * Videos and carousels/documents get placeholder treatment
 */

import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  getPostsByAuthor,
  getImageDownloadUrls,
  type LinkedInAuthorPost,
} from "@/lib/linkedin";
import { uploadToR2 } from "@/lib/storage/r2";

interface SyncResult {
  synced: number;
  skipped: number;
  imagesDownloaded: number;
  errors: string[];
}

/**
 * Sync all LinkedIn posts for a user (profile or organization)
 * - Fetches all posts from LinkedIn
 * - Creates local DB records for posts not already tracked
 * - Downloads images to R2 for permanent storage
 * - Videos get placeholder, documents/carousels get placeholder
 */
export async function syncLinkedInPosts(userId: string): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, imagesDownloaded: 0, errors: [] };

  // Get user's LinkedIn credentials
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.linkedinAccessToken || !user.linkedinProfileId) {
    result.errors.push("LinkedIn not connected");
    return result;
  }

  // Determine author URN based on posting target
  const isOrg = user.linkedinPostingTarget === "organization" && user.linkedinSelectedOrgId;
  const authorUrn = isOrg
    ? `urn:li:organization:${user.linkedinSelectedOrgId}`
    : `urn:li:person:${user.linkedinProfileId}`;

  const accessToken = user.linkedinAccessToken;

  try {
    // Fetch all posts (paginated)
    let allPosts: LinkedInAuthorPost[] = [];
    let start = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && start < 1000) { // Safety limit
      const page = await getPostsByAuthor(accessToken, authorUrn, pageSize, start);
      allPosts = allPosts.concat(page.posts);
      hasMore = page.hasMore;
      start += pageSize;
    }

// Get existing posts to avoid duplicates
    const existingPosts = await db
      .select({ linkedinPostId: posts.linkedinPostId })
      .from(posts)
      .where(eq(posts.userId, userId));

    const existingIds = new Set(existingPosts.map(p => p.linkedinPostId).filter(Boolean));

    // Separate posts that need image download
    const postsWithImages: LinkedInAuthorPost[] = [];
    const newPosts: LinkedInAuthorPost[] = [];

    for (const post of allPosts) {
      if (post.lifecycleState !== "PUBLISHED") continue;
      if (existingIds.has(post.id)) {
        // Post already exists - check if it needs an image update
        const [existing] = await db
          .select({ id: posts.id, linkedinImageUrl: posts.linkedinImageUrl, linkedinPostId: posts.linkedinPostId })
          .from(posts)
          .where(eq(posts.linkedinPostId, post.id))
          .limit(1);

        if (existing && !existing.linkedinImageUrl && post.mediaId && (post.mediaType === "image" || post.mediaType === "multiImage" || post.mediaType === "article")) {
          postsWithImages.push(post);
        }
        result.skipped++;
        continue;
      }

      newPosts.push(post);
      if (post.mediaId && (post.mediaType === "image" || post.mediaType === "multiImage" || post.mediaType === "article")) {
        postsWithImages.push(post);
      }
    }

    // Batch download image URLs from LinkedIn
    const imageUrns = postsWithImages
      .map(p => p.mediaId)
      .filter((id): id is string => !!id && id.includes("urn:li:image:"));

    const downloadUrls = imageUrns.length > 0
      ? await getImageDownloadUrls(accessToken, imageUrns)
      : new Map<string, string>();

    // Insert new posts into DB
    for (const post of newPosts) {
      try {
        let postType: "text" | "image" | "carousel" | "video" = "text";
        if (post.mediaType === "video") postType = "video";
        else if (post.mediaType === "document") postType = "carousel";
        else if (post.mediaType === "image" || post.mediaType === "multiImage" || post.mediaType === "article") postType = "image";

        const postId = randomUUID();

        // Download image to R2 if available
        let linkedinImageUrl: string | null = null;
        if (post.mediaId && downloadUrls.has(post.mediaId)) {
          try {
            linkedinImageUrl = await downloadImageToR2(
              downloadUrls.get(post.mediaId)!,
              userId,
              postId
            );
            result.imagesDownloaded++;
          } catch (err) {
}
        }

        await db.insert(posts).values({
          id: postId,
          userId,
          content: post.commentary || "(No text content)",
          status: "published",
          postType,
          publishedAt: new Date(post.publishedAt),
          linkedinPostId: post.id,
          linkedinPostUrl: `https://www.linkedin.com/feed/update/${post.id}/`,
          linkedinImageUrl,
          syncedFromLinkedin: true,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.lastModifiedAt),
        });

        result.synced++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`Failed to sync post ${post.id}: ${msg}`);
      }
    }

    // Update existing posts that need images
    for (const post of postsWithImages) {
      if (!post.mediaId || !downloadUrls.has(post.mediaId)) continue;

      // Only update existing posts (new ones already handled above)
      if (!existingIds.has(post.id)) continue;

      try {
        const [existing] = await db
          .select({ id: posts.id })
          .from(posts)
          .where(eq(posts.linkedinPostId, post.id))
          .limit(1);

        if (existing) {
          const imageUrl = await downloadImageToR2(
            downloadUrls.get(post.mediaId)!,
            userId,
            existing.id
          );

          await db.update(posts)
            .set({ linkedinImageUrl: imageUrl })
            .where(eq(posts.id, existing.id));

          result.imagesDownloaded++;
        }
      } catch (err) {
}
    }

return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(msg);
return result;
  }
}

/**
 * Download an image from LinkedIn CDN and upload to R2
 */
async function downloadImageToR2(
  downloadUrl: string,
  userId: string,
  postId: string
): Promise<string> {
  // Download the image
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/jpeg";

  // Determine file extension
  let ext = "jpg";
  if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("gif")) ext = "gif";
  else if (contentType.includes("webp")) ext = "webp";

  // Upload to R2
  const result = await uploadToR2(buffer, {
    fileName: `linkedin-sync.${ext}`,
    contentType,
    userId,
    postId,
  });

return result.url;
}
