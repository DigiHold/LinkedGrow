import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl, isGoogleConfigured } from '@/lib/google';
import { randomBytes } from 'crypto';
import { getAppUrl, isSecureAppUrl } from '@/lib/app-url';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

function sanitizeCallbackUrl(url: string | null): string | null {
  if (!url) return null;
  // Only allow relative paths starting with / (no protocol-relative //evil.com or absolute URLs)
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  return url;
}

export async function GET(request: NextRequest) {
  // Public by design: anyone may ask for the redirect to Google. 20 in a quarter
  // of an hour per address sits well above a person retrying a blocked popup,
  // and well below a script minting state cookies in a loop.
  const limit = rateLimit(`google-auth:${getClientIP(request)}`, { maxRequests: 20, windowMs: 15 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'login'; // 'login' or 'register'
  const newsletter = searchParams.get('newsletter') === 'true';
  const popup = searchParams.get('popup') === 'true';
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));

  // The pages hide the button unless both credentials are set; a direct
  // request to an instance without Google gets a plain answer.
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Google sign in is not configured' }, { status: 404 });
  }

  // Check if Google credentials are configured
  if (!isGoogleConfigured()) {
    const errorMessage = 'Google login is not configured';
    if (popup) {
      const appOrigin = getAppUrl();
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><title>Google Login Error</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'google-error', error: '${errorMessage}' }, '${appOrigin}');
                window.close();
              } else {
                document.body.textContent = '${errorMessage}';
              }
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    return NextResponse.redirect(
      `${getAppUrl()}/sign-in?error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Generate a random state to prevent CSRF attacks
  const state = randomBytes(16).toString('hex');

  const redirectUri = `${getAppUrl()}/api/google/callback`;
  const authUrl = getGoogleAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(authUrl);

  // Set state cookie for verification
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: isSecureAppUrl(),
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store mode (login or register) for callback
  response.cookies.set('google_oauth_mode', mode, {
    httpOnly: true,
    secure: isSecureAppUrl(),
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store newsletter preference for callback
  if (newsletter) {
    response.cookies.set('google_newsletter', 'true', {
      httpOnly: true,
      secure: isSecureAppUrl(),
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  // Store popup flag for callback
  if (popup) {
    response.cookies.set('google_popup', 'true', {
      httpOnly: true,
      secure: isSecureAppUrl(),
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  // Store callbackUrl for redirect after auth
  if (callbackUrl) {
    response.cookies.set('google_callback_url', callbackUrl, {
      httpOnly: true,
      secure: isSecureAppUrl(),
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
  }

  return response;
}
