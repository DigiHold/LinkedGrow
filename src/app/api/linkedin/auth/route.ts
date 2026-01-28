import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInAuthUrl, isLinkedInConfigured, type LinkedInAppType } from '@/lib/linkedin';
import { randomBytes } from 'crypto';

function sanitizeCallbackUrl(url: string | null): string | null {
  if (!url) return null;
  // Only allow relative paths starting with / (no protocol-relative //evil.com or absolute URLs)
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  return url;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appType = (searchParams.get('app') || 'poster') as LinkedInAppType;
  const popup = searchParams.get('popup') === 'true';
  const mode = searchParams.get('mode') || 'connect'; // 'connect', 'login', or 'register'
  const newsletter = searchParams.get('newsletter') === 'true';
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));

  // Check if LinkedIn credentials are configured
  const clientId = appType === 'poster'
    ? process.env.LINKEDIN_CLIENT_ID
    : process.env.LINKEDIN_COMMUNITY_CLIENT_ID;

  if (!clientId) {
    const errorMessage = 'LinkedIn API credentials are not configured. Please contact support.';
    if (popup) {
      const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://linkedgrow.ai';
      // Return HTML that closes the popup and notifies the parent
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><title>LinkedIn Connection Error</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'linkedin-error', error: '${errorMessage}' }, '${appOrigin}');
                window.close();
              } else {
                document.body.innerHTML = '<p>${errorMessage}</p>';
              }
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    // For social login, redirect to sign-in page
    if (mode === 'login' || mode === 'register') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(errorMessage)}`
      );
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(errorMessage)}`
    );
  }

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

  // Store mode for callback (connect, login, or register)
  response.cookies.set('linkedin_oauth_mode', mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store popup flag for callback
  if (popup) {
    response.cookies.set('linkedin_popup', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  // Store newsletter preference for callback
  if (newsletter) {
    response.cookies.set('linkedin_newsletter', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  // Store callbackUrl for redirect after auth
  if (callbackUrl) {
    response.cookies.set('linkedin_callback_url', callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  return response;
}
