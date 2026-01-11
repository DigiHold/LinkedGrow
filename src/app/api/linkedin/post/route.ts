import { NextRequest, NextResponse } from 'next/server';
import { createLinkedInPost, createLinkedInPostWithImage } from '@/lib/linkedin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, imageUrl, imageTitle, visibility = 'PUBLIC' } = body;

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

    // TODO: Get user's LinkedIn access token and person URN from database
    // For now, we'll return an error if not connected
    const linkedInConnected = request.cookies.get('linkedin_connected')?.value;
    if (!linkedInConnected) {
      return NextResponse.json(
        { error: 'LinkedIn account not connected. Please connect in Settings.' },
        { status: 401 }
      );
    }

    // TODO: In production, retrieve these from your database
    const accessToken = ''; // Get from database
    const personUrn = ''; // Get from database

    if (!accessToken || !personUrn) {
      return NextResponse.json(
        { error: 'LinkedIn credentials not found. Please reconnect your account.' },
        { status: 401 }
      );
    }

    let result;

    if (imageUrl) {
      result = await createLinkedInPostWithImage(
        accessToken,
        personUrn,
        text,
        imageUrl,
        imageTitle,
        visibility
      );
    } else {
      result = await createLinkedInPost(
        accessToken,
        personUrn,
        text,
        visibility
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.id,
      message: 'Post published successfully to LinkedIn',
    });
  } catch (error) {
    console.error('LinkedIn post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post to LinkedIn' },
      { status: 500 }
    );
  }
}
