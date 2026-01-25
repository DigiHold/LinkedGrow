import { NextRequest, NextResponse } from 'next/server';
import { createLinkedInPost, createLinkedInPostWithImage, createLinkedInPostWithVideo } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { getLinkedInUser } from '@/lib/team-utils';

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

    if (videoData?.base64 && videoData?.mimeType) {
      // Video post - upload video directly to LinkedIn
      postResult = await createLinkedInPostWithVideo(
        linkedInUser.linkedinAccessToken,
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
