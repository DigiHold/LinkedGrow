import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCodeForToken, getGoogleUserInfo } from '@/lib/google';
import { db, users, accounts, betaUsers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { encode } from 'next-auth/jwt';
import { sendWelcomeEmail } from '@/lib/email';
import { subscribeToNewsletter } from '@/lib/newsletter';
import { hasPendingTeamInvite } from '@/lib/team-utils';

function createPopupResponse(success: boolean, data: { error?: string; callbackUrl?: string }) {
  const redirectUrl = data.callbackUrl || '/dashboard';
  const message = success
    ? { type: 'google-success', callbackUrl: redirectUrl }
    : { type: 'google-error', error: data.error };

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head><title>Google Login</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(message)}, '*');
            window.close();
          } else {
            window.location.href = '${success ? redirectUrl : `/sign-in?error=${encodeURIComponent(data.error || 'Unknown error')}`}';
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

  // Get cookies
  const storedState = request.cookies.get('google_oauth_state')?.value;
  const mode = request.cookies.get('google_oauth_mode')?.value || 'login';
  const subscribeNewsletterCookie = request.cookies.get('google_newsletter')?.value === 'true';
  const isPopup = request.cookies.get('google_popup')?.value === 'true';
  const callbackUrl = request.cookies.get('google_callback_url')?.value;

  // Handle OAuth errors
  if (error) {
    if (isPopup) {
      return createPopupResponse(false, { error });
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(error)}`
    );
  }

  // Validate state
  if (!state || state !== storedState) {
    if (isPopup) {
      return createPopupResponse(false, { error: 'Invalid state parameter' });
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent('Invalid state parameter')}`
    );
  }

  if (!code) {
    if (isPopup) {
      return createPopupResponse(false, { error: 'No authorization code provided' });
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent('No authorization code provided')}`
    );
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

    // Exchange code for access token
    const tokenData = await exchangeGoogleCodeForToken(code, redirectUri);

    // Get user profile from Google
    const googleUser = await getGoogleUserInfo(tokenData.access_token);

    if (!googleUser.email) {
      if (isPopup) {
        return createPopupResponse(false, { error: 'Could not retrieve email from Google' });
      }
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent('Could not retrieve email from Google')}`
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
      // Registration flow
      if (user) {
        // User already exists - redirect to login
        if (isPopup) {
          return createPopupResponse(false, { error: 'An account with this email already exists. Please sign in instead.' });
        }
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent('An account with this email already exists. Please sign in instead.')}`
        );
      }

      // Create new user (don't store Google profile picture - only LinkedIn pictures are stored)
      const userId = randomUUID();

      // Check if email is in beta users list - they get free business plan
      const normalizedEmail = googleUser.email.toLowerCase().trim();
      const betaUser = await db.query.betaUsers.findFirst({
        where: eq(betaUsers.email, normalizedEmail),
      });

      const isBetaTester = betaUser && !betaUser.converted;
      const userPlan = isBetaTester ? 'business' : 'free';

      await db.insert(users).values({
        id: userId,
        email: googleUser.email,
        name: googleUser.name || `${googleUser.given_name} ${googleUser.family_name}`.trim(),
        image: null,
        emailVerified: googleUser.verified_email ? new Date() : null,
        plan: userPlan,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mark beta user as converted if applicable
      if (isBetaTester) {
        await db
          .update(betaUsers)
          .set({
            converted: true,
            convertedAt: new Date(),
          })
          .where(eq(betaUsers.email, normalizedEmail));
      }

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

      // Send welcome email (non-blocking) - skip for team members with pending invites
      const hasTeamInvite = await hasPendingTeamInvite(googleUser.email);
      if (!hasTeamInvite) {
        sendWelcomeEmail({ to: googleUser.email, name: googleUser.given_name || undefined }).catch((err) => {
          console.error('Failed to send welcome email:', err);
        });
      }

      // Subscribe to newsletter if opted in (non-blocking)
      if (subscribeNewsletterCookie) {
        const fullName = googleUser.name || `${googleUser.given_name} ${googleUser.family_name}`.trim();
        subscribeToNewsletter({ email: googleUser.email, name: fullName, source: 'google_signup' }).catch((err) => {
          console.error('Failed to subscribe to newsletter:', err);
        });
      }

    } else {
      // Login flow
      if (!user) {
        // User doesn't exist - redirect to register
        if (isPopup) {
          return createPopupResponse(false, { error: 'No account found with this email. Please create an account first.' });
        }
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?error=${encodeURIComponent('No account found with this email. Please create an account first.')}`
        );
      }

      // Link Google account if not already linked
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

      // Don't update profile picture from Google - only LinkedIn pictures are used
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // Create session token using NextAuth JWT
    // Salt is the cookie name used by NextAuth
    const cookieName = process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image, // Only set if user connected LinkedIn
        plan: user.plan,
        twoFactorEnabled: user.twoFactorEnabled,
        isAdmin: user.isAdmin,
      },
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Handle popup mode - return HTML that sets cookie and notifies parent
    if (isPopup) {
      const redirectUrl = callbackUrl || '/dashboard';
      const response = new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><title>Google Login</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'google-success', callbackUrl: '${redirectUrl}' }, '*');
                window.close();
              } else {
                window.location.href = '${redirectUrl}';
              }
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );

      // Set the session cookie
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      // Clear OAuth cookies
      response.cookies.delete('google_oauth_state');
      response.cookies.delete('google_oauth_mode');
      response.cookies.delete('google_newsletter');
      response.cookies.delete('google_popup');
      response.cookies.delete('google_callback_url');

      return response;
    }

    // Redirect to callbackUrl or dashboard with session cookie
    const redirectUrl = callbackUrl || '/dashboard';
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${redirectUrl}`);

    // Set the session cookie (NextAuth v5 uses authjs.session-token)
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Clear OAuth cookies
    response.cookies.delete('google_oauth_state');
    response.cookies.delete('google_oauth_mode');
    response.cookies.delete('google_newsletter');
    response.cookies.delete('google_callback_url');

    return response;

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
    if (isPopup) {
      return createPopupResponse(false, { error: errorMessage });
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
