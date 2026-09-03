import { NextRequest, NextResponse } from 'next/server';
import { isCloud } from '@/lib/edition';
import { exchangeGoogleCodeForToken, getGoogleUserInfo } from '@/lib/google';
import { db, users, accounts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getAppUrl, isSecureAppUrl } from '@/lib/app-url';
import { newUserPolicy, SIGNUPS_CLOSED_MESSAGE } from '@/lib/registration';
import { sanitizeCallbackUrl } from '@/lib/url';
import { rateLimit, getClientIP, AUTH_RATE_LIMITS } from '@/lib/rate-limit';
import { createSessionToken, sessionCookieName, sessionCookieOptions } from '@/lib/session-cookie';
import {
  TWO_FACTOR_CHALLENGE_TTL_SECONDS,
  mintTwoFactorChallenge,
  requireAuthSecret,
  twoFactorChallengeCookieName,
} from '@/lib/two-factor-challenge';


/**
 * A value on its way into a <script> block.
 *
 * encodeURIComponent is not enough on its own: it leaves the apostrophe alone,
 * so a quoted interpolation lets a crafted error message close the string and
 * run its own code on our own origin. JSON.stringify quotes the value properly,
 * and the angle bracket escape stops a payload closing the element from the
 * inside, which quoting alone does not prevent.
 */
function js(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function createPopupResponse(success: boolean, data: { error?: string; callbackUrl?: string }) {
  const redirectUrl = data.callbackUrl || '/dashboard';
  const message = success
    ? { type: 'google-success', callbackUrl: redirectUrl }
    : { type: 'google-error', error: data.error };

  const appOrigin = getAppUrl();
  const fallbackUrl = success
    ? redirectUrl
    : `/sign-in?error=${encodeURIComponent(data.error || 'Unknown error')}`;

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head><title>Google Login</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(${js(message)}, ${js(appOrigin)});
            window.close();
          } else {
            window.location.href = ${js(fallbackUrl)};
          }
        </script>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

/**
 * Google proved the address, nothing has proved the second factor yet, so the
 * browser gets a challenge cookie and the sign in page's own two factor step
 * rather than a session. In a popup the opener has to hear about it, or it sits
 * on its spinner behind a window that just closed.
 */
function twoFactorChallengeResponse(userId: string, isPopup: boolean, googleAccountId: string) {
  const appOrigin = getAppUrl();
  const signInUrl = `${appOrigin}/sign-in?google2fa=1`;

  const response = isPopup
    ? new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><title>Google Login</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'google-2fa' }, ${js(appOrigin)});
                window.close();
              } else {
                window.location.href = ${js(signInUrl)};
              }
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    : NextResponse.redirect(signInUrl);

  response.cookies.set(
    twoFactorChallengeCookieName(),
    mintTwoFactorChallenge(userId, requireAuthSecret(), googleAccountId),
    {
      httpOnly: true,
      secure: isSecureAppUrl(),
      sameSite: 'lax',
      maxAge: TWO_FACTOR_CHALLENGE_TTL_SECONDS,
      path: '/',
    },
  );

  // The OAuth exchange is finished. Only the callback url survives, because the
  // two factor route still has to send the browser where it was going.
  response.cookies.delete('google_oauth_state');
  response.cookies.delete('google_oauth_mode');
  response.cookies.delete('google_newsletter');
  response.cookies.delete('google_popup');

  return response;
}

export async function GET(request: NextRequest) {
  // Google sign in belongs to the hosted service; a self hosted instance has
  // no Google flow at all, so the whole path answers as if it did not exist.
  if (!isCloud()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get cookies
  const storedState = request.cookies.get('google_oauth_state')?.value;
  const mode = request.cookies.get('google_oauth_mode')?.value || 'login';
  const isPopup = request.cookies.get('google_popup')?.value === 'true';
  const callbackUrl = sanitizeCallbackUrl(request.cookies.get('google_callback_url')?.value ?? null);

  // Public by design: Google sends the browser here. Counted on its own key,
  // so a burst of callbacks never spends the budget of the outbound route.
  const limit = rateLimit(`google-callback:${getClientIP(request)}`, AUTH_RATE_LIMITS.googleOAuth);
  if (!limit.success) {
    const message = 'Too many sign in attempts. Please try again later.';
    if (isPopup) {
      return createPopupResponse(false, { error: message });
    }
    return NextResponse.redirect(
      `${getAppUrl()}/sign-in?error=${encodeURIComponent(message)}`
    );
  }

  // Handle OAuth errors
  if (error) {
    if (isPopup) {
      return createPopupResponse(false, { error });
    }
    return NextResponse.redirect(
      `${getAppUrl()}/sign-in?error=${encodeURIComponent(error)}`
    );
  }

  // Validate state
  if (!state || state !== storedState) {
    if (isPopup) {
      return createPopupResponse(false, { error: 'Invalid state parameter' });
    }
    return NextResponse.redirect(
      `${getAppUrl()}/sign-in?error=${encodeURIComponent('Invalid state parameter')}`
    );
  }

  if (!code) {
    if (isPopup) {
      return createPopupResponse(false, { error: 'No authorization code provided' });
    }
    return NextResponse.redirect(
      `${getAppUrl()}/sign-in?error=${encodeURIComponent('No authorization code provided')}`
    );
  }

  try {
    const redirectUri = `${getAppUrl()}/api/google/callback`;

    // Exchange code for access token
    const tokenData = await exchangeGoogleCodeForToken(code, redirectUri);

    // Get user profile from Google
    const googleUser = await getGoogleUserInfo(tokenData.access_token);

    if (!googleUser.email) {
      if (isPopup) {
        return createPopupResponse(false, { error: 'Could not retrieve email from Google' });
      }
      return NextResponse.redirect(
        `${getAppUrl()}/sign-in?error=${encodeURIComponent('Could not retrieve email from Google')}`
      );
    }

    // Check if user exists by email
    let user = await db.query.users.findFirst({
      where: eq(users.email, googleUser.email),
    });

    // Check if Google account is already linked
    const existingAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, 'google'),
        eq(accounts.providerAccountId, googleUser.id)
      ),
    });

    if (mode === 'register') {
      // Registration flow. Self hosted: the first account is the administrator
      // and sign ups may be closed. The cloud path answers plan free, never
      // admin, never closed. Checked before the "already exists" answer, so a
      // closed instance never confirms which addresses hold an account.
      const policy = await newUserPolicy();
      if (policy.closed) {
        if (isPopup) {
          return createPopupResponse(false, { error: SIGNUPS_CLOSED_MESSAGE });
        }
        return NextResponse.redirect(
          `${getAppUrl()}/sign-up?error=${encodeURIComponent(SIGNUPS_CLOSED_MESSAGE)}`
        );
      }

      if (user) {
        // User already exists - redirect to login
        if (isPopup) {
          return createPopupResponse(false, { error: 'An account with this email already exists. Please sign in instead.' });
        }
        return NextResponse.redirect(
          `${getAppUrl()}/sign-in?error=${encodeURIComponent('An account with this email already exists. Please sign in instead.')}`
        );
      }

      // Create new user (don't store Google profile picture - only LinkedIn pictures are stored)
      const userId = randomUUID();

      await db.insert(users).values({
        id: userId,
        email: googleUser.email,
        name: googleUser.name || `${googleUser.given_name} ${googleUser.family_name}`.trim(),
        image: null,
        emailVerified: googleUser.verified_email ? new Date() : null,
        // Cloud: no plan until Stripe says so. The trial is granted by Checkout
        // and its dates are written back by the webhook, so an account created
        // here can sign in and reach nothing except the plan picker.
        // Self hosted: business, and the first account is the administrator.
        plan: policy.plan,
        isAdmin: policy.isAdmin,
        hasUsedTrial: false,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Link Google account
      await db.insert(accounts).values({
        userId: userId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleUser.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        id_token: tokenData.id_token || null,
      });

      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

    } else {
      // Login flow
      if (!user) {
        // User doesn't exist - redirect to register
        if (isPopup) {
          return createPopupResponse(false, { error: 'No account found with this email. Please create an account first.' });
        }
        return NextResponse.redirect(
          `${getAppUrl()}/sign-up?error=${encodeURIComponent('No account found with this email. Please create an account first.')}`
        );
      }

      // Google is proof of an address only when Google says it verified it.
      // Without that, anyone who administers a domain could assert an address
      // on it, so an unverified one never reaches an account it is not already
      // linked to. An established link is its own proof and still signs in.
      if (!existingAccount && !googleUser.verified_email) {
        const message = 'This Google account has no verified email address. Sign in with your password instead.';
        if (isPopup) {
          return createPopupResponse(false, { error: message });
        }
        return NextResponse.redirect(
          `${getAppUrl()}/sign-in?error=${encodeURIComponent(message)}`
        );
      }

      // Linking is a change to the account, and an account with two factor
      // changes for nobody until the code proves the device. For those the
      // write moves to /api/google/2fa, which runs once the code is checked.
      if (!user.twoFactorEnabled) {
        if (!existingAccount) {
          await db.insert(accounts).values({
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: googleUser.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_at: tokenData.expires_in
              ? Math.floor(Date.now() / 1000) + tokenData.expires_in
              : null,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
            id_token: tokenData.id_token || null,
          });
        } else {
          // Update existing account tokens
          await db
            .update(accounts)
            .set({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token || undefined,
              expires_at: tokenData.expires_in
                ? Math.floor(Date.now() / 1000) + tokenData.expires_in
                : undefined,
            })
            .where(
              and(
                eq(accounts.provider, 'google'),
                eq(accounts.providerAccountId, googleUser.id)
              )
            );
        }
      }

      // Don't update profile picture from Google - only LinkedIn pictures are used
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // An account with two factor switched on gets no session here. Google
    // proved the address; the code proves the device, and until it does this
    // route hands out a 5 minute challenge instead. Registration always creates
    // the row with two factor off, so only the login branch ever lands here.
    if (user.twoFactorEnabled) {
      return twoFactorChallengeResponse(user.id, isPopup, googleUser.id);
    }

    // Create session token using NextAuth JWT
    const cookieName = sessionCookieName();
    const token = await createSessionToken(user, requireAuthSecret());

    // Handle popup mode - return HTML that sets cookie and notifies parent
    if (isPopup) {
      const redirectUrl = callbackUrl;
      const appOrigin = getAppUrl();
      const response = new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><title>Google Login</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage(${js({ type: 'google-success', callbackUrl: redirectUrl, isNewUser: mode === 'register' })}, ${js(appOrigin)});
                window.close();
              } else {
                window.location.href = ${js(redirectUrl)};
              }
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );

      // Set the session cookie
      response.cookies.set(cookieName, token, sessionCookieOptions());

      // Clear OAuth cookies
      response.cookies.delete('google_oauth_state');
      response.cookies.delete('google_oauth_mode');
      response.cookies.delete('google_newsletter');
      response.cookies.delete('google_popup');
      response.cookies.delete('google_callback_url');

      return response;
    }

    // Redirect to callbackUrl or dashboard with session cookie
    const redirectUrl = callbackUrl;
    const response = NextResponse.redirect(`${getAppUrl()}${redirectUrl}`);

    // Set the session cookie (NextAuth v5 uses authjs.session-token)
    response.cookies.set(cookieName, token, sessionCookieOptions());

    // Clear OAuth cookies
    response.cookies.delete('google_oauth_state');
    response.cookies.delete('google_oauth_mode');
    response.cookies.delete('google_newsletter');
    response.cookies.delete('google_callback_url');

    return response;

  } catch (error) {
    // The reason stays in the log. It has said things like which environment
    // variable is missing, and this route answers anyone who asks, signed in
    // or not, so the browser only ever gets the same sentence.
    console.error("[google-callback] Failed:", error);
    const message = 'Failed to sign in with Google. Please try again.';
    if (isPopup) {
      return createPopupResponse(false, { error: message });
    }
    return NextResponse.redirect(
      `${getAppUrl()}/sign-in?error=${encodeURIComponent(message)}`
    );
  }
}
