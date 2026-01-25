import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl, isGoogleConfigured } from '@/lib/google';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'login'; // 'login' or 'register'
  const newsletter = searchParams.get('newsletter') === 'true';
  const popup = searchParams.get('popup') === 'true';
  const callbackUrl = searchParams.get('callbackUrl');

  // Check if Google credentials are configured
  if (!isGoogleConfigured()) {
    const errorMessage = 'Google login is not configured';
    if (popup) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><title>Google Login Error</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'google-error', error: '${errorMessage}' }, '*');
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
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Generate a random state to prevent CSRF attacks
  const state = randomBytes(16).toString('hex');

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;
  const authUrl = getGoogleAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(authUrl);

  // Set state cookie for verification
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store mode (login or register) for callback
  response.cookies.set('google_oauth_mode', mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store newsletter preference for callback
  if (newsletter) {
    response.cookies.set('google_newsletter', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  // Store popup flag for callback
  if (popup) {
    response.cookies.set('google_popup', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  // Store callbackUrl for redirect after auth
  if (callbackUrl) {
    response.cookies.set('google_callback_url', callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  return response;
}
