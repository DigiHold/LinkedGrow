import { NextRequest, NextResponse } from 'next/server';
import { createLinkedInPost, createLinkedInPostWithImage, createLinkedInPostWithVideo, createLinkedInPostWithDocument, ensureFreshTokens } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { getLinkedInUser } from '@/lib/team-utils';
import { db, posts, media } from '@/lib/db';
import { scheduleFirstComment, scheduleAutoLike } from '@/lib/qstash';
import { triggerTeamAutoEngagement } from '@/lib/team-engagement';
import { triggerCrossPromotion } from '@/lib/cross-promotion';
import { deleteFromR2 } from '@/lib/storage/r2';
import { eq, inArray } from 'drizzle-orm';

// Extend timeout for video uploads (Pro plan allows up to 300s)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to post' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, postId, imageTitle, visibility = 'PUBLIC' } = body;
    let { imageUrl } = body;
    // Videos are passed inline by the client when possible. We also fall
    // back to the media table for legacy drafts that were created before
    // videos stopped being stored there - so the route works regardless of
    // whether the user's browser is running new or cached frontend code.
    let videoUrl: string | undefined = body.videoUrl;
    let videoMimeType: string | undefined = body.videoMimeType;
    let videoStorageKey: string | undefined = body.videoStorageKey;
    // Video media rows in the DB that need cleanup after a successful publish
    // (legacy rows from before videos stopped being stored).
    const legacyVideoMediaIds: string[] = [];
    const legacyVideoStorageKeys: string[] = [];
    let documentUrl: string | undefined;
    let documentTitle: string | undefined;

    // If postId is provided, check it's not already published and look up media from R2
    if (postId) {
      const existingPost = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      if (existingPost?.status === 'published') {
        return NextResponse.json(
          { error: 'This post has already been published to LinkedIn' },
          { status: 400 }
        );
      }

      const postMedia = await db
        .select()
        .from(media)
        .where(eq(media.postId, postId));

      // Track every video row attached to this post so we can wipe both
      // the R2 file and the DB row after publish.
      for (const m of postMedia) {
        if (m.mimeType?.startsWith('video/')) {
          legacyVideoMediaIds.push(m.id);
          if (m.storageKey) legacyVideoStorageKeys.push(m.storageKey);
        }
      }

      // If the client didn't pass video info inline (e.g. cached old
      // frontend), pull it from the first legacy video media row.
      if (!videoUrl && !imageUrl) {
        const firstVideo = postMedia.find(m => m.mimeType?.startsWith('video/'));
        if (firstVideo?.storageUrl) {
          videoUrl = firstVideo.storageUrl;
          videoMimeType = firstVideo.mimeType;
          if (!videoStorageKey) videoStorageKey = firstVideo.storageKey;
        }
      }

      if (!imageUrl && !videoUrl) {
        const firstDocument = postMedia.find(m => m.mimeType === 'application/pdf');
        const firstImage = postMedia.find(m => m.mimeType?.startsWith('image/'));

        if (firstDocument?.storageUrl) {
          documentUrl = firstDocument.storageUrl;
          documentTitle = firstDocument.altText || imageTitle || 'Carousel';
        } else if (firstImage?.storageUrl) {
          imageUrl = firstImage.storageUrl;
        }
      }
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Post text is required' },
        { status: 400 }
      );
    }

    if (text.length > 3000) {
      return NextResponse.json(
        { error: 'Post text exceeds LinkedIn maximum of 3000 characters' },
        { status: 400 }
      );
    }

    // Get LinkedIn credentials (uses team owner's credentials if user is a team member)
    const result = await getLinkedInUser(session.user.id);

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { user: postingUser, linkedInUser } = result;

    if (!linkedInUser?.linkedinAccessToken || !linkedInUser?.linkedinProfileId) {
      return NextResponse.json(
        { error: 'LinkedIn account not connected. Please ask the team owner to connect LinkedIn in Settings.' },
        { status: 401 }
      );
    }

    // Auto-refresh tokens if expired
    const { token } = await ensureFreshTokens(linkedInUser.id);
    if (!token) {
      return NextResponse.json(
        { error: 'LinkedIn token has expired and could not be refreshed. Please reconnect your account in Settings.' },
        { status: 401 }
      );
    }

    // Determine posting target (profile or organization) - uses owner's settings for team members
    const isOrganization = linkedInUser.linkedinPostingTarget === 'organization' && linkedInUser.linkedinSelectedOrgId;
    const authorId = isOrganization ? linkedInUser.linkedinSelectedOrgId! : linkedInUser.linkedinProfileId;
    const authorType: 'person' | 'organization' = isOrganization ? 'organization' : 'person';

    let postResult;

    if (documentUrl) {
      // Document/PDF post (carousel) - fetch from R2 and upload to LinkedIn
      postResult = await createLinkedInPostWithDocument(
        token,
        authorId,
        text,
        documentUrl,
        documentTitle,
        visibility,
        authorType
      );
    } else if (videoUrl && videoMimeType) {
      // Video post - fetch from R2 and upload to LinkedIn
      postResult = await createLinkedInPostWithVideo(
        token,
        authorId,
        text,
        videoUrl,
        videoMimeType,
        imageTitle,
        visibility,
        authorType
      );
    } else if (imageUrl) {
      // Image post - fetch from R2 URL and upload to LinkedIn
      postResult = await createLinkedInPostWithImage(
        token,
        authorId,
        text,
        imageUrl,
        imageTitle,
        visibility,
        authorType
      );
    } else {
      // Text-only post
      postResult = await createLinkedInPost(
        token,
        authorId,
        text,
        visibility,
        authorType
      );
    }

    // Video succeeded - delete the transient R2 file(s) AND any DB media rows
    // pointing at them. Videos are not stored anywhere on our side once
    // LinkedIn has ingested them. Best-effort: failed deletes are logged but
    // don't fail the publish.
    if (videoUrl) {
      // Collect every storage key we know about - inline from the request and
      // any legacy DB rows attached to this post.
      const keysToDelete = new Set<string>(legacyVideoStorageKeys);
      if (videoStorageKey) keysToDelete.add(videoStorageKey);

      for (const key of keysToDelete) {
        try {
          await deleteFromR2(key);
        } catch (cleanupError) {
          console.error('[Video R2 Cleanup] Failed to delete video after publish:', cleanupError);
        }
      }

      // Delete any legacy video media rows so the My Posts preview stops
      // pointing at the (now-deleted) R2 file.
      if (legacyVideoMediaIds.length > 0) {
        try {
          await db.delete(media).where(inArray(media.id, legacyVideoMediaIds));
        } catch (cleanupError) {
          console.error('[Video Media Cleanup] Failed to delete legacy video media rows:', cleanupError);
        }
      }
    }

    // Update post status to published in the database
    if (postId) {
      await db.update(posts)
        .set({
          status: 'published',
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
}
      }

      // Schedule first comment if present (random 1-5 min delay)
      const updatedPost = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

if (updatedPost?.firstComment) {
        try {
          const delaySeconds = Math.floor(Math.random() * 241) + 60;
          const messageId = await scheduleFirstComment(postId, delaySeconds);
} catch (error) {
}
      }
    }

    // Schedule team auto-engagement for company page posts
    if (isOrganization && postId) {
      try {
        await triggerTeamAutoEngagement(postId, postResult.id, linkedInUser.id);
      } catch (error) {
}
    }

    // Trigger cross-promotion notifications for all groups the user belongs to
    if (postId) {
      try {
        const updatedPostForCP = await db.query.posts.findFirst({
          where: eq(posts.id, postId),
        });
        if (updatedPostForCP?.content) {
          await triggerCrossPromotion(postId, postResult.id, updatedPostForCP.content, session.user.id);
        }
      } catch (error) {
        console.error("[Cross Promotion] Failed to trigger:", error);
      }
    }

    const targetName = isOrganization ? linkedInUser.linkedinSelectedOrgName : 'your profile';

    return NextResponse.json({
      success: true,
      postId: postResult.id,
      message: `Post published successfully to ${targetName}`,
      postedTo: isOrganization ? 'organization' : 'profile',
    });
  } catch (error) {
return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post to LinkedIn' },
      { status: 500 }
    );
  }
}
