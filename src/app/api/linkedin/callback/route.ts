import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLinkedInProfile, getLinkedInProfileWithHeadline, getAdministeredOrganizations, type LinkedInAppType } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { db, users, accounts } from '@/lib/db';
import { affiliates, affiliateReferrals } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { uploadToR2, isR2Configured } from '@/lib/storage/r2';
import { randomUUID } from 'crypto';
import { encode } from 'next-auth/jwt';

import { subscribeToNewsletter } from '@/lib/newsletter';


function sanitizeCallbackUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  // Only allow relative paths starting with / (no protocol-relative //evil.com or absolute URLs)
  if (!url.startsWith('/') || url.startsWith('//')) return undefined;
  return url;
}

/**
 * Download image from URL and upload to R2
 */
async function downloadAndStoreProfilePicture(
  imageUrl: string,
  userId: string
): Promise<string | null> {
  try {
    // Validate URL is from LinkedIn CDN to prevent SSRF
    try {
      const parsedUrl = new URL(imageUrl);
      const allowedHosts = ['media.licdn.com', 'media-exp1.licdn.com', 'media-exp2.licdn.com', 'platform-lookaside.fbsbx.com'];
      if (!allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
        console.warn('Rejected non-LinkedIn profile picture URL:', parsedUrl.hostname);
        return null;
      }
      if (parsedUrl.protocol !== 'https:') {
        console.warn('Rejected non-HTTPS profile picture URL');
        return null;
      }
    } catch {
      console.warn('Invalid profile picture URL');
      return null;
    }

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

function createPopupResponse(success: boolean, data: { name?: string; error?: string; showSelection?: boolean; callbackUrl?: string }) {
  const redirectUrl = data.callbackUrl || '/dashboard';
  const message = success
    ? { type: 'linkedin-success', name: data.name, showSelection: data.showSelection || false, callbackUrl: redirectUrl }
    : { type: 'linkedin-error', error: data.error };

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://linkedgrow.ai';

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head><title>LinkedIn Connection</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(message)}, '${appOrigin}');
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
  const errorDescription = searchParams.get('error_description');
  const isPopup = request.cookies.get('linkedin_popup')?.value === 'true';
  const mode = request.cookies.get('linkedin_oauth_mode')?.value || 'connect';
  const subscribeNewsletterCookie = request.cookies.get('linkedin_newsletter')?.value === 'true';
  const callbackUrl = sanitizeCallbackUrl(request.cookies.get('linkedin_callback_url')?.value);

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

    // Log what scopes were actually granted by LinkedIn

    // For community app connect flow, skip OpenID profile fetch (no openid scope)
    // But DO fetch headline via r_basicprofile REST API
    if (appType === 'community' && mode === 'connect') {
      const session = await auth();
      if (session?.user?.id) {
        // Fetch headline + vanity name via r_basicprofile
        const profileData = await getLinkedInProfileWithHeadline(tokenData.access_token);

        // Fetch administered organizations (community app has rw_organization_admin scope)
        const organizations = await getAdministeredOrganizations(tokenData.access_token);
        const hasOrganizations = organizations.length > 0;

        // Download and store company logos on R2 (same as profile pictures)
        for (const org of organizations) {
          if (org.logoUrl) {
            const storedLogoUrl = await downloadAndStoreProfilePicture(org.logoUrl, `org-${org.id}`);
            if (storedLogoUrl) {
              org.logoUrl = storedLogoUrl;
            }
          }
        }

        await db
          .update(users)
          .set({
            linkedinCommunityAccessToken: tokenData.access_token,
            linkedinCommunityRefreshToken: tokenData.refresh_token || null,
            linkedinCommunityTokenExpiry: tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000)
              : null,
            linkedinHeadline: profileData?.headline || null,
            linkedinVanityName: profileData?.vanityName || null,
            linkedinMemberId: profileData?.memberId || null,
            // Store organizations for page selection
            linkedinOrganizations: hasOrganizations ? JSON.stringify(organizations) : null,
            linkedinPostingTarget: hasOrganizations ? null : 'profile',
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.user.id));

        // If user has organizations, show selection modal
        if (hasOrganizations && isPopup) {
          const response = createPopupResponse(true, { name: 'Community App', showSelection: true });
          response.cookies.delete('linkedin_oauth_state');
          response.cookies.delete('linkedin_app_type');
          response.cookies.delete('linkedin_oauth_mode');
          response.cookies.delete('linkedin_popup');
          return response;
        }
      }

      if (isPopup) {
        const response = createPopupResponse(true, { name: 'Community App' });
        response.cookies.delete('linkedin_oauth_state');
        response.cookies.delete('linkedin_app_type');
        response.cookies.delete('linkedin_oauth_mode');
        response.cookies.delete('linkedin_popup');
        return response;
      }

      const response = NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?community=connected`
      );
      response.cookies.delete('linkedin_oauth_state');
      response.cookies.delete('linkedin_app_type');
      response.cookies.delete('linkedin_oauth_mode');
      return response;
    }

    // Get user profile (requires openid scope - poster app only)
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

        // Create new user
        const userId = randomUUID();

        // Download and store profile picture in R2
        let storedPictureUrl: string | null = null;
        if (linkedInPictureUrl) {
          storedPictureUrl = await downloadAndStoreProfilePicture(linkedInPictureUrl, userId);
        }

        // Check for affiliate referral cookie
        const refCode = request.cookies.get('lg_ref')?.value;
        let validAffiliate: { id: string; referralCode: string } | null = null;
        if (refCode) {
          const aff = await db.query.affiliates.findFirst({
            where: and(
              eq(affiliates.referralCode, refCode),
              eq(affiliates.status, 'approved'),
            ),
          });
          if (aff) {
            validAffiliate = { id: aff.id, referralCode: aff.referralCode };
          }
        }

        await db.insert(users).values({
          id: userId,
          email: linkedInEmail,
          name: fullName,
          image: storedPictureUrl,
          emailVerified: new Date(), // LinkedIn emails are verified
          plan: 'free',
          twoFactorEnabled: false,
          referredBy: validAffiliate?.referralCode || null,
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

        // Track affiliate referral
        if (validAffiliate) {
          await db.insert(affiliateReferrals).values({
            id: randomUUID(),
            affiliateId: validAffiliate.id,
            referredUserId: userId,
            status: 'signed_up',
            createdAt: new Date(),
          });
          await db
            .update(affiliates)
            .set({
              totalSignups: sql`${affiliates.totalSignups} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(affiliates.id, validAffiliate.id));
        }

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
        // Update profile picture if user doesn't have one stored
        let storedPictureUrl: string | null = null;
        if (linkedInPictureUrl && !user.image) {
          storedPictureUrl = await downloadAndStoreProfilePicture(linkedInPictureUrl, user.id);
        }

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
        const redirectUrl = callbackUrl || '/dashboard';
        const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://linkedgrow.ai';
        const response = new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head><title>LinkedIn Login</title></head>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'linkedin-success', callbackUrl: '${redirectUrl}' }, '${appOrigin}');
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
        response.cookies.delete('linkedin_oauth_state');
        response.cookies.delete('linkedin_app_type');
        response.cookies.delete('linkedin_oauth_mode');
        response.cookies.delete('linkedin_popup');
        response.cookies.delete('linkedin_newsletter');
        response.cookies.delete('linkedin_callback_url');

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
      response.cookies.delete('linkedin_oauth_state');
      response.cookies.delete('linkedin_app_type');
      response.cookies.delete('linkedin_oauth_mode');
      response.cookies.delete('linkedin_popup');
      response.cookies.delete('linkedin_newsletter');
      response.cookies.delete('linkedin_callback_url');

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
            // Default posting target to profile (org selection happens after community app connect)
            linkedinPostingTarget: 'profile',
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.user.id));
      }
    }

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
