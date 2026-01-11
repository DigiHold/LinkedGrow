import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLinkedInProfile, type LinkedInAppType } from '@/lib/linkedin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Check for OAuth errors
  if (error) {
    console.error('LinkedIn OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Verify state to prevent CSRF attacks
  const storedState = request.cookies.get('linkedin_oauth_state')?.value;
  if (!state || state !== storedState) {
    console.error('LinkedIn OAuth state mismatch');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=Invalid%20state`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=No%20authorization%20code`
    );
  }

  try {
    const appType = (request.cookies.get('linkedin_app_type')?.value || 'poster') as LinkedInAppType;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`;

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(appType, code, redirectUri);

    // Get user profile
    const profile = await getLinkedInProfile(tokenData.access_token);

    // TODO: Store tokens securely in database associated with user
    // For now, we'll pass success status via URL params
    // In production, you should:
    // 1. Store access_token and refresh_token in database
    // 2. Associate with the current logged-in user
    // 3. Encrypt tokens before storage

    console.log('LinkedIn connected successfully:', {
      userId: profile.id,
      name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      appType,
    });

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?linkedin=connected&name=${encodeURIComponent(
        `${profile.localizedFirstName} ${profile.localizedLastName}`
      )}`
    );

    // Clear OAuth cookies
    response.cookies.delete('linkedin_oauth_state');
    response.cookies.delete('linkedin_app_type');

    // Store connection status temporarily (in production, use database)
    response.cookies.set('linkedin_connected', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    response.cookies.set('linkedin_profile_name', `${profile.localizedFirstName} ${profile.localizedLastName}`, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('LinkedIn OAuth callback error:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(
        err instanceof Error ? err.message : 'Failed to connect LinkedIn'
      )}`
    );
  }
}
