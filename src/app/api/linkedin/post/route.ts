import { NextRequest, NextResponse } from 'next/server';
import { createLinkedInPost, createLinkedInPostWithImage, createLinkedInPostWithVideo, createLinkedInPostWithDocument } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { getLinkedInUser } from '@/lib/team-utils';
import { db, posts, media } from '@/lib/db';
import { scheduleFirstComment } from '@/lib/qstash';
import { eq } from 'drizzle-orm';

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
    let videoUrl: string | undefined;
    let videoMimeType: string | undefined;
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

      // Look up media from the media table (all media is stored on R2)
      if (!imageUrl) {
        const postMedia = await db
          .select()
          .from(media)
          .where(eq(media.postId, postId));

        const firstDocument = postMedia.find(m => m.mimeType === 'application/pdf');
        const firstVideo = postMedia.find(m => m.mimeType?.startsWith('video/'));
        const firstImage = postMedia.find(m => m.mimeType?.startsWith('image/'));

        if (firstDocument?.storageUrl) {
          documentUrl = firstDocument.storageUrl;
          documentTitle = firstDocument.altText || imageTitle || 'Carousel';
        } else if (firstVideo?.storageUrl) {
          videoUrl = firstVideo.storageUrl;
          videoMimeType = firstVideo.mimeType;
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

    const { linkedInUser } = result;

    if (!linkedInUser?.linkedinAccessToken || !linkedInUser?.linkedinProfileId) {
      return NextResponse.json(
        { error: 'LinkedIn account not connected. Please ask the team owner to connect LinkedIn in Settings.' },
        { status: 401 }
      );
    }

    // Check if token has expired
    if (linkedInUser.linkedinTokenExpiry && new Date(linkedInUser.linkedinTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'LinkedIn token has expired. Please ask the team owner to reconnect their account in Settings.' },
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
        linkedInUser.linkedinAccessToken,
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
        linkedInUser.linkedinAccessToken,
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
        linkedInUser.linkedinAccessToken,
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
        linkedInUser.linkedinAccessToken,
        authorId,
        text,
        visibility,
        authorType
      );
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

      // Schedule first comment if present (random 1-5 min delay)
      const updatedPost = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      console.log("[First Comment] Post check:", {
        postId,
        hasFirstComment: !!updatedPost?.firstComment,
        firstCommentLength: updatedPost?.firstComment?.length,
        linkedinPostId: postResult.id,
      });

      if (updatedPost?.firstComment) {
        try {
          const delaySeconds = Math.floor(Math.random() * 241) + 60;
          const messageId = await scheduleFirstComment(postId, delaySeconds);
          console.log("[First Comment] Scheduled via QStash:", {
            postId,
            delaySeconds,
            qstashMessageId: messageId,
          });
        } catch (error) {
          console.error("[First Comment] Failed to schedule:", error);
        }
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
    console.error('LinkedIn post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post to LinkedIn' },
      { status: 500 }
    );
  }
}
