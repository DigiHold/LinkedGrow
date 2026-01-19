import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLinkedInProfile, getAdministeredOrganizations, type LinkedInAppType } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { db, users, accounts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { uploadToR2, isR2Configured } from '@/lib/storage/r2';
import { randomUUID } from 'crypto';
import { encode } from 'next-auth/jwt';
import { sendWelcomeEmail } from '@/lib/email';
import { subscribeToNewsletter } from '@/lib/newsletter';

/**
 * Download image from URL and upload to R2
 */
async function downloadAndStoreProfilePicture(
  imageUrl: string,
  userId: string
): Promise<string | null> {
  try {
    if (!isR2Configured()) {
      console.warn('R2 not configured, using original LinkedIn URL');
      return imageUrl;
    }

    // Download the image from LinkedIn
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to download LinkedIn profile picture:', response.status);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const result = await uploadToR2(buffer, {
      fileName: `profile-picture.${contentType.split('/')[1] || 'jpg'}`,
      contentType,
      userId,
    });

    return result.url;
  } catch (error) {
    console.error('Failed to store profile picture:', error);
    return null;
  }
}

function createPopupResponse(success: boolean, data: { name?: string; error?: string; showSelection?: boolean }) {
  const message = success
    ? { type: 'linkedin-success', name: data.name, showSelection: data.showSelection || false }
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
            window.location.href = '/dashboard/settings${success ? `?linkedin=connected&name=${encodeURIComponent(data.name || '')}${data.showSelection ? '&showSelection=true' : ''}` : `?error=${encodeURIComponent(data.error || 'Unknown error')}`}';
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
  const mode = request.cookies.get('linkedin_oauth_mode')?.value || 'connect';
  const subscribeNewsletterCookie = request.cookies.get('linkedin_newsletter')?.value === 'true';

  // Check for OAuth errors
  if (error) {
    console.error('LinkedIn OAuth error:', error, errorDescription);
    if (isPopup) {
      return createPopupResponse(false, { error: errorDescription || error });
    }
    if (mode === 'login' || mode === 'register') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(errorDescription || error)}`
      );
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
    if (mode === 'login' || mode === 'register') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=Invalid%20state`
      );
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=Invalid%20state`
    );
  }

  if (!code) {
    if (isPopup) {
      return createPopupResponse(false, { error: 'No authorization code received' });
    }
    if (mode === 'login' || mode === 'register') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=No%20authorization%20code`
      );
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
    const linkedInPictureUrl = profile.profilePicture?.displayImage || null;
    const linkedInEmail = profile.email;

    // Handle social login flow (login or register mode)
    if (mode === 'login' || mode === 'register') {
      if (!linkedInEmail) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent('Could not retrieve email from LinkedIn')}`
        );
      }

      // Check if user exists by email
      let user = await db.query.users.findFirst({
        where: eq(users.email, linkedInEmail),
      });

      // Check if LinkedIn account is already linked
      const existingAccount = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.provider, 'linkedin'),
          eq(accounts.providerAccountId, profile.id)
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

        // Create new user (don't store profile picture during social login - only when connecting LinkedIn via settings)
        const userId = randomUUID();

        await db.insert(users).values({
          id: userId,
          email: linkedInEmail,
          name: fullName,
          image: null,
          emailVerified: new Date(), // LinkedIn emails are verified
          plan: 'free',
          twoFactorEnabled: false,
          // Auto-connect LinkedIn for posting
          linkedinAccessToken: tokenData.access_token,
          linkedinRefreshToken: tokenData.refresh_token || null,
          linkedinTokenExpiry: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          linkedinProfileId: profile.id,
          linkedinProfileName: fullName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Link LinkedIn account
        await db.insert(accounts).values({
          userId: userId,
          type: 'oauth',
          provider: 'linkedin',
          providerAccountId: profile.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: tokenData.expires_in
            ? Math.floor(Date.now() / 1000) + tokenData.expires_in
            : null,
          token_type: 'Bearer',
          scope: tokenData.scope,
        });

        user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        // Send welcome email (non-blocking)
        sendWelcomeEmail({ to: linkedInEmail, name: profile.localizedFirstName || undefined }).catch((err) => {
          console.error('Failed to send welcome email:', err);
        });

        // Subscribe to newsletter if opted in (non-blocking)
        if (subscribeNewsletterCookie) {
          subscribeToNewsletter({ email: linkedInEmail, name: fullName, source: 'linkedin_signup' }).catch((err) => {
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

        // Link LinkedIn account if not already linked
        if (!existingAccount) {
          await db.insert(accounts).values({
            userId: user.id,
            type: 'oauth',
            provider: 'linkedin',
            providerAccountId: profile.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_at: tokenData.expires_in
              ? Math.floor(Date.now() / 1000) + tokenData.expires_in
              : null,
            token_type: 'Bearer',
            scope: tokenData.scope,
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
                eq(accounts.provider, 'linkedin'),
                eq(accounts.providerAccountId, profile.id)
              )
            );
        }

        // Also update the user's LinkedIn posting tokens (auto-connect)
        // Don't update profile picture during social login - only when connecting LinkedIn via settings
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
            name: user.name || fullName,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
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
          name: user.name || fullName,
          image: user.image,
          plan: user.plan,
          twoFactorEnabled: user.twoFactorEnabled,
          isAdmin: user.isAdmin,
        },
        secret: process.env.AUTH_SECRET!,
        salt: cookieName,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      // Handle popup mode for login/register
      if (isPopup) {
        const response = new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head><title>LinkedIn Login</title></head>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'linkedin-success' }, '*');
                  window.close();
                } else {
                  window.location.href = '/dashboard';
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
        response.cookies.delete('linkedin_oauth_state');
        response.cookies.delete('linkedin_app_type');
        response.cookies.delete('linkedin_oauth_mode');
        response.cookies.delete('linkedin_popup');
        response.cookies.delete('linkedin_newsletter');

        return response;
      }

      // Redirect to dashboard with session cookie
      const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);

      // Set the session cookie (NextAuth v5 uses authjs.session-token)
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      // Clear OAuth cookies
      response.cookies.delete('linkedin_oauth_state');
      response.cookies.delete('linkedin_app_type');
      response.cookies.delete('linkedin_oauth_mode');
      response.cookies.delete('linkedin_popup');
      response.cookies.delete('linkedin_newsletter');

      return response;
    }

    // Original connect flow (for dashboard settings)
    // Get the current user session
    const session = await auth();

    // Store tokens and profile data in database if user is logged in
    if (session?.user?.id) {
      if (appType === 'community') {
        // Community app - only store community tokens (for engagement features)
        await db
          .update(users)
          .set({
            linkedinCommunityAccessToken: tokenData.access_token,
            linkedinCommunityRefreshToken: tokenData.refresh_token || null,
            linkedinCommunityTokenExpiry: tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.user.id));
      } else {
        // Poster app - store main tokens and profile data
        // Download and store profile picture in R2
        let storedPictureUrl: string | null = null;
        if (linkedInPictureUrl) {
          storedPictureUrl = await downloadAndStoreProfilePicture(linkedInPictureUrl, session.user.id);
        }

        // Fetch administered organizations (only for poster app)
        const organizations = await getAdministeredOrganizations(tokenData.access_token);
        const hasOrganizations = organizations.length > 0;

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
            // Store our own copy of the profile picture (from R2)
            image: storedPictureUrl,
            // Update name if not already set
            name: fullName,
            // Store organizations for selection
            linkedinOrganizations: hasOrganizations ? JSON.stringify(organizations) : null,
            // Default to profile if no orgs, otherwise keep previous selection or null for selection page
            linkedinPostingTarget: hasOrganizations ? null : 'profile',
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.user.id));

        // If user has organizations, signal the parent to show selection modal
        if (hasOrganizations) {
          console.log('LinkedIn connected with organizations:', {
            userId: profile.id,
            name: fullName,
            organizationCount: organizations.length,
          });

          // Handle popup mode with organizations - send message to show selection modal
          if (isPopup) {
            const response = createPopupResponse(true, { name: fullName, showSelection: true });
            response.cookies.delete('linkedin_oauth_state');
            response.cookies.delete('linkedin_app_type');
            response.cookies.delete('linkedin_oauth_mode');
            response.cookies.delete('linkedin_popup');
            return response;
          }

          // Non-popup mode - redirect to settings with showSelection param
          const response = NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?linkedin=connected&name=${encodeURIComponent(fullName)}&showSelection=true`
          );
          response.cookies.delete('linkedin_oauth_state');
          response.cookies.delete('linkedin_app_type');
          response.cookies.delete('linkedin_oauth_mode');
          return response;
        }
      }
    }

    console.log('LinkedIn connected successfully:', {
      userId: profile.id,
      name: fullName,
      appType,
    });

    // Handle popup mode (no organizations case)
    if (isPopup) {
      const response = createPopupResponse(true, { name: fullName });
      // Set cookies on the popup response too
      response.cookies.delete('linkedin_oauth_state');
      response.cookies.delete('linkedin_app_type');
      response.cookies.delete('linkedin_oauth_mode');
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
    response.cookies.delete('linkedin_oauth_mode');

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
    if (mode === 'login' || mode === 'register') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(errorMessage)}`
      );
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
