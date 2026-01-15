import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLinkedInProfile, type LinkedInAppType } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

function createPopupResponse(success: boolean, data: { name?: string; error?: string }) {
  const message = success
    ? { type: 'linkedin-success', name: data.name }
    : { type: 'linkedin-error', error: data.error };

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head><title>LinkedIn Connection</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(message)}, '*');
            window.close();
          } else {
            window.location.href = '/dashboard/settings${success ? `?linkedin=connected&name=${encodeURIComponent(data.name || '')}` : `?error=${encodeURIComponent(data.error || 'Unknown error')}`}';
          }
        </script>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const isPopup = request.cookies.get('linkedin_popup')?.value === 'true';

  // Check for OAuth errors
  if (error) {
    console.error('LinkedIn OAuth error:', error, errorDescription);
    if (isPopup) {
      return createPopupResponse(false, { error: errorDescription || error });
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Verify state to prevent CSRF attacks
  const storedState = request.cookies.get('linkedin_oauth_state')?.value;
  if (!state || state !== storedState) {
    console.error('LinkedIn OAuth state mismatch');
    if (isPopup) {
      return createPopupResponse(false, { error: 'Invalid state - please try again' });
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=Invalid%20state`
    );
  }

  if (!code) {
    if (isPopup) {
      return createPopupResponse(false, { error: 'No authorization code received' });
    }
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
    const fullName = `${profile.localizedFirstName} ${profile.localizedLastName}`;
    const profilePictureUrl = profile.profilePicture?.displayImage || null;

    // Get the current user session
    const session = await auth();

    // Store tokens and profile data in database if user is logged in
    if (session?.user?.id) {
      await db
        .update(users)
        .set({
          linkedinAccessToken: tokenData.access_token,
          linkedinRefreshToken: tokenData.refresh_token || null,
          linkedinTokenExpiry: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          linkedinProfileId: profile.id,
          linkedinProfileName: fullName,
          // Update user's profile picture from LinkedIn
          image: profilePictureUrl,
          // Update name if not already set
          name: fullName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    }

    console.log('LinkedIn connected successfully:', {
      userId: profile.id,
      name: fullName,
      pictureUrl: profilePictureUrl,
      appType,
    });

    // Handle popup mode
    if (isPopup) {
      const response = createPopupResponse(true, { name: fullName });
      // Set cookies on the popup response too
      response.cookies.delete('linkedin_oauth_state');
      response.cookies.delete('linkedin_app_type');
      response.cookies.delete('linkedin_popup');
      response.cookies.set('linkedin_connected', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      response.cookies.set('linkedin_profile_name', fullName, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return response;
    }

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?linkedin=connected&name=${encodeURIComponent(fullName)}`
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

    response.cookies.set('linkedin_profile_name', fullName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('LinkedIn OAuth callback error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to connect LinkedIn';
    if (isPopup) {
      return createPopupResponse(false, { error: errorMessage });
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
