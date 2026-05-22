import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLinkedInProfile, getLinkedInProfileWithHeadline, getAdministeredOrganizations } from '@/lib/linkedin';
import { auth } from '@/lib/auth';
import { db, users, accounts } from '@/lib/db';
import { affiliates, affiliateReferrals } from '@/lib/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { uploadToR2, isR2Configured } from '@/lib/storage/r2';
import { randomUUID } from 'crypto';
import { encode } from 'next-auth/jwt';

import { signUp, subscribeToNewsletter, brevoDate, setBrevoAttributes, removeFromStuckSetupList } from '@/lib/newsletter';


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
return null;
      }
      if (parsedUrl.protocol !== 'https:') {
return null;
      }
    } catch {
return null;
    }

    if (!isR2Configured()) {
return imageUrl;
    }

    // Download the image from LinkedIn
    const response = await fetch(imageUrl);
    if (!response.ok) {
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

// Fetching org names involves one LinkedIn API call per company page, with
// retries on rate limiting - give the callback room for users with many pages.
export const maxDuration = 60;

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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`;

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code, redirectUri);

    // Get user profile using OpenID Connect
    const profile = await getLinkedInProfile(tokenData.access_token);
    const fullName = `${profile.localizedFirstName} ${profile.localizedLastName}`;
    const linkedInPictureUrl = profile.profilePicture?.displayImage || null;
    const linkedInEmail = profile.email;

    // Also fetch headline and vanity name via REST API (r_basicprofile scope)
    const profileData = await getLinkedInProfileWithHeadline(tokenData.access_token);

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

        // Anti-abuse fingerprint: if this LinkedIn profile ID was already
        // used by another account, skip the trial entirely (paywall them on
        // first visit). The first account ever to use this LI ID is never
        // flagged. Subsequent accounts get blocked.
        const existingLinkedInUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.linkedinProfileId, profile.id))
          .limit(1);

        const trialAbuseDetected = existingLinkedInUser.length > 0;
        const trialStart = new Date();
        const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        await db.insert(users).values({
          id: userId,
          email: linkedInEmail,
          name: fullName,
          image: storedPictureUrl,
          emailVerified: new Date(), // LinkedIn emails are verified
          plan: trialAbuseDetected ? 'free' : 'pro',
          trialStartedAt: trialAbuseDetected ? null : trialStart,
          trialEndedAt: trialAbuseDetected ? trialStart : trialEnd,
          hasUsedTrial: trialAbuseDetected,
          twoFactorEnabled: false,
          referredBy: validAffiliate?.referralCode || null,
          // Auto-connect LinkedIn
          linkedinAccessToken: tokenData.access_token,
          linkedinRefreshToken: tokenData.refresh_token || null,
          linkedinTokenExpiry: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          linkedinProfileId: profile.id,
          linkedinProfileName: fullName,
          linkedinHeadline: profileData?.headline || null,
          linkedinVanityName: profileData?.vanityName || null,
          linkedinMemberId: profileData?.memberId || null,
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

        // Add every new user to the Welcome list (#9) so Brevo automation
        // sends the welcome email. Also add to the Blog list (#11) if they
        // opted in via the newsletter checkbox on the sign-up page.
        // LinkedIn OAuth signups count as LINKEDIN_CONNECTED=true immediately.
        signUp({
          email: linkedInEmail,
          name: fullName,
          source: 'linkedin_signup',
          attributes: {
            PLAN: trialAbuseDetected ? "free" : "pro",
            IS_PAID: false,
            SIGNUP_DATE: brevoDate(new Date()),
            TRIAL_ENDS_DATE: trialAbuseDetected ? null : brevoDate(trialEnd),
            LINKEDIN_CONNECTED: true,
            AI_KEY_ADDED: false,
            POSTS_CREATED: 0,
            POSTS_PUBLISHED: 0,
          },
        }).catch(() => {});
        if (subscribeNewsletterCookie) {
          subscribeToNewsletter({ email: linkedInEmail, name: fullName, source: 'linkedin_signup' }).catch(() => {});
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

        // Update the user's LinkedIn tokens and profile data
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
            linkedinHeadline: profileData?.headline || null,
            linkedinVanityName: profileData?.vanityName || null,
            linkedinMemberId: profileData?.memberId || null,
            name: user.name || fullName,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }

      if (!user) {
        throw new Error('Failed to create or find user');
      }

      // Create session token using NextAuth JWT
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
      // Load current user to check if they're on trial and to gate abuse check
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });

      // Anti-abuse fingerprint: if this LinkedIn ID was already used by a
      // different account AND the current user is still on the trial (no
      // Stripe sub, no LTD), revoke their trial. Paid users are never
      // downgraded by this check.
      let trialAbuseDetected = false;
      if (currentUser && !currentUser.stripeSubscriptionId && !currentUser.isLifetimeDeal && !currentUser.hasUsedTrial) {
        const conflictingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(and(
            eq(users.linkedinProfileId, profile.id),
            ne(users.id, session.user.id)
          ))
          .limit(1);
        trialAbuseDetected = conflictingUser.length > 0;
      }

      // Download and store profile picture in R2
      let storedPictureUrl: string | null = null;
      if (linkedInPictureUrl) {
        storedPictureUrl = await downloadAndStoreProfilePicture(linkedInPictureUrl, session.user.id);
      }

      // Fetch administered organizations
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
          linkedinHeadline: profileData?.headline || null,
          linkedinVanityName: profileData?.vanityName || null,
          linkedinMemberId: profileData?.memberId || null,
          // Store our own copy of the profile picture (from R2)
          image: storedPictureUrl,
          // Update name if not already set
          name: fullName,
          // Store organizations for selection
          linkedinOrganizations: hasOrganizations ? JSON.stringify(organizations) : null,
          // Default to profile if no orgs, otherwise keep previous selection or null for selection page
          linkedinPostingTarget: hasOrganizations ? null : 'profile',
          // Revoke trial if abuse detected
          ...(trialAbuseDetected ? {
            plan: 'free' as const,
            trialEndedAt: new Date(),
            hasUsedTrial: true,
          } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      // Sync Brevo: mark LinkedIn as connected. Look up email from the
      // user row we just updated so we can push the attribute.
      const connectedUser = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });
      if (connectedUser?.email) {
        const hasAiKey = !!(
          connectedUser.openaiApiKey ||
          connectedUser.anthropicApiKey ||
          connectedUser.googleApiKey ||
          connectedUser.grokApiKey ||
          connectedUser.perplexityApiKey ||
          connectedUser.kimiApiKey
        );
        setBrevoAttributes(connectedUser.email, {
          LINKEDIN_CONNECTED: true,
          AI_KEY_ADDED: hasAiKey,
        }).catch(() => {});
        // If setup is now complete, remove from Stuck Setup list.
        if (hasAiKey) {
          removeFromStuckSetupList(connectedUser.email).catch(() => {});
        }
      }

      // If user has organizations, signal the parent to show selection modal
      if (hasOrganizations) {
        if (isPopup) {
          const response = createPopupResponse(true, { name: fullName, showSelection: true });
          response.cookies.delete('linkedin_oauth_state');
          response.cookies.delete('linkedin_oauth_mode');
          response.cookies.delete('linkedin_popup');
          return response;
        }

        // Non-popup mode - redirect to settings with showSelection param
        const response = NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?linkedin=connected&name=${encodeURIComponent(fullName)}&showSelection=true`
        );
        response.cookies.delete('linkedin_oauth_state');
        response.cookies.delete('linkedin_oauth_mode');
        return response;
      }
    }

    // Handle popup mode (no organizations case)
    if (isPopup) {
      const response = createPopupResponse(true, { name: fullName });
      response.cookies.delete('linkedin_oauth_state');
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
