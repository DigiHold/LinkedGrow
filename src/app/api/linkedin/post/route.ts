import { NextRequest, NextResponse } from 'next/server';
import { createLinkedInPost, createLinkedInPostWithImage, createLinkedInPostWithVideo } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

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
    const { text, imageUrl, imageTitle, videoData, visibility = 'PUBLIC' } = body;

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

    // Get user's LinkedIn credentials from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
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
      return NextResponse.json(
        { error: 'LinkedIn account not connected. Please connect in Settings.' },
        { status: 401 }
      );
    }

    // Check if token has expired
    if (user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'LinkedIn token has expired. Please reconnect your account in Settings.' },
        { status: 401 }
      );
    }

    // Determine posting target (profile or organization)
    const isOrganization = user.linkedinPostingTarget === 'organization' && user.linkedinSelectedOrgId;
    const authorId = isOrganization ? user.linkedinSelectedOrgId! : user.linkedinProfileId;
    const authorType: 'person' | 'organization' = isOrganization ? 'organization' : 'person';

    let result;

    if (videoData?.base64 && videoData?.mimeType) {
      // Video post - upload video directly to LinkedIn
      result = await createLinkedInPostWithVideo(
        user.linkedinAccessToken,
        authorId,
        text,
        videoData.base64,
        videoData.mimeType,
        videoData.title,
        visibility,
        authorType
      );
    } else if (imageUrl) {
      // Image post - fetch from R2 URL and upload to LinkedIn
      result = await createLinkedInPostWithImage(
        user.linkedinAccessToken,
        authorId,
        text,
        imageUrl,
        imageTitle,
        visibility,
        authorType
      );
    } else {
      // Text-only post
      result = await createLinkedInPost(
        user.linkedinAccessToken,
        authorId,
        text,
        visibility,
        authorType
      );
    }

    const targetName = isOrganization ? user.linkedinSelectedOrgName : 'your profile';

    return NextResponse.json({
      success: true,
      postId: result.id,
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
