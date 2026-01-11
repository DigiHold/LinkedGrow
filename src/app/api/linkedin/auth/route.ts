import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInAuthUrl, type LinkedInAppType } from '@/lib/linkedin';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appType = (searchParams.get('app') || 'poster') as LinkedInAppType;

  // Generate a random state to prevent CSRF attacks
  const state = randomBytes(16).toString('hex');

  // Store state in a cookie for verification later
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`;
  const authUrl = getLinkedInAuthUrl(appType, redirectUri, state);

  const response = NextResponse.redirect(authUrl);

  // Set state cookie for verification
  response.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store app type for callback
  response.cookies.set('linkedin_app_type', appType, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
