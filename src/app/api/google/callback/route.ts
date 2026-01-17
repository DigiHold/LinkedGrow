import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCodeForToken, getGoogleUserInfo } from '@/lib/google';
import { db, users, accounts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { encode } from 'next-auth/jwt';
import { sendWelcomeEmail } from '@/lib/email';
import { subscribeToNewsletter } from '@/lib/newsletter';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get cookies
  const storedState = request.cookies.get('google_oauth_state')?.value;
  const mode = request.cookies.get('google_oauth_mode')?.value || 'login';
  const subscribeNewsletterCookie = request.cookies.get('google_newsletter')?.value === 'true';

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(error)}`
    );
  }

  // Validate state
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent('Invalid state parameter')}`
    );
  }

  if (!code) {
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
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent('An account with this email already exists. Please sign in instead.')}`
        );
      }

      // Create new user
      const userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        email: googleUser.email,
        name: googleUser.name || `${googleUser.given_name} ${googleUser.family_name}`.trim(),
        image: googleUser.picture || null,
        emailVerified: googleUser.verified_email ? new Date() : null,
        plan: 'free',
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

      // Send welcome email (non-blocking)
      sendWelcomeEmail({ to: googleUser.email, name: googleUser.given_name || undefined }).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });

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

      // Update user profile picture if they don't have one
      if (!user.image && googleUser.picture) {
        await db
          .update(users)
          .set({
            image: googleUser.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // Create session token using NextAuth JWT
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
        twoFactorEnabled: user.twoFactorEnabled,
        isAdmin: user.isAdmin,
      },
      secret: process.env.AUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Redirect to dashboard with session cookie
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);

    // Set the session cookie (NextAuth v5 uses authjs.session-token)
    response.cookies.set('authjs.session-token', token, {
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

    return response;

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
