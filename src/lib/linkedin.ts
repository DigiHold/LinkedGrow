/**
 * LinkedIn OAuth and API Integration
 *
 * Uses two LinkedIn apps:
 * - Poster App: For publishing posts to LinkedIn
 * - Community App: For engagement features
 *
 * Token auto-refresh:
 * - Access tokens expire every 2 months
 * - Refresh tokens expire every 12 months
 * - Call ensureFreshTokens() before using tokens to auto-refresh if needed
 */

import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

// LinkedIn OAuth scopes
// Poster app: Sign-in + Share on LinkedIn
const POSTER_SCOPES = ['openid', 'profile', 'email', 'w_member_social'];

// Community app: Community Management API for engagement features
// Development Tier: Only w_member_social is available
// Standard Tier (after approval): Full Community Management API access
//
// IMPORTANT: When LinkedIn approves your Community Management API access:
// 1. Uncomment the scopes below based on your approval
// 2. The headline will automatically be fetched via REST API /rest/me endpoint
// Community app scopes - ALL scopes from the Community Management API product
// NOTE: openid/profile/email are NOT on this app (those are on the Poster App via OpenID Connect product)
const COMMUNITY_SCOPES = [
  'r_basicprofile',               // Basic profile (name, photo, headline, public URL)
  'w_member_social',              // Create/modify/delete posts, comments, reactions as member
  'w_member_social_feed',         // Create/modify/delete comments and reactions on posts on member behalf
  'r_member_postAnalytics',       // Retrieve member post analytics/reporting
  'r_member_profileAnalytics',    // Retrieve profile analytics (viewers, followers, search appearances)
  'r_organization_social',        // Retrieve org posts, comments, reactions, engagement data
  'w_organization_social',        // Create/modify/delete posts, comments, reactions on org behalf
  'r_organization_social_feed',   // Retrieve comments, reactions on org posts
  'w_organization_social_feed',   // Create/modify/delete comments and reactions on org posts
  'r_organization_followers',     // Retrieve org followers data
  'rw_organization_admin',        // Manage org pages and reporting data
  'r_1st_connections_size',       // Number of 1st-degree connections
];

// LinkedIn API endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_API_BASE = 'https://api.linkedin.com/rest';

// LinkedIn API version for REST API (YYYYMM format)
const LINKEDIN_API_VERSION = '202603';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

interface LinkedInProfile {
  id: string;
  email?: string;
  localizedFirstName: string;
  localizedLastName: string;
  localizedHeadline?: string;
  vanityName?: string;
  profilePicture?: {
    displayImage: string;
  };
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  logoUrl?: string;
}

export type LinkedInAppType = 'poster' | 'community';

/**
 * Get LinkedIn OAuth configuration based on app type
 */
function getLinkedInConfig(appType: LinkedInAppType) {
  if (appType === 'poster') {
    return {
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      scopes: POSTER_SCOPES,
    };
  }
  return {
    clientId: process.env.LINKEDIN_COMMUNITY_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET!,
    scopes: COMMUNITY_SCOPES,
  };
}

/**
 * Generate LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(
  appType: LinkedInAppType,
  redirectUri: string,
  state: string
): string {
  const config = getLinkedInConfig(appType);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: config.scopes.join(' '),
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/**
 * Refresh an expired LinkedIn access token using a refresh token.
 * Returns new token data, or null if refresh failed (user must reconnect).
 */
export async function refreshLinkedInToken(
  appType: LinkedInAppType,
  refreshToken: string,
): Promise<LinkedInTokenResponse | null> {
  const config = getLinkedInConfig(appType);

  try {
    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      console.error(`[LinkedIn] Token refresh failed (${response.status}): ${await response.text()}`);
      return null;
    }

    const tokenData: LinkedInTokenResponse = await response.json();
    console.log(`[LinkedIn] Token refreshed successfully for ${appType} app`);
    return tokenData;
  } catch (err) {
    console.error(`[LinkedIn] Token refresh error:`, err);
    return null;
  }
}

/**
 * Check if a token is expired or will expire within the buffer period.
 * Buffer: 24 hours before actual expiry to avoid edge cases.
 */
export function isTokenExpired(tokenExpiry: Date | string | number | null): boolean {
  if (!tokenExpiry) return false; // No expiry stored, assume valid
  const buffer = 24 * 60 * 60 * 1000; // 24 hours
  // Handle Unix seconds (10-digit number) vs milliseconds vs Date string
  let expiryMs: number;
  if (typeof tokenExpiry === 'number' || (typeof tokenExpiry === 'string' && /^\d+$/.test(tokenExpiry))) {
    const num = typeof tokenExpiry === 'string' ? parseInt(tokenExpiry, 10) : tokenExpiry;
    // If the number is less than year 2000 in ms, it's in seconds
    expiryMs = num < 946684800000 ? num * 1000 : num;
  } else {
    expiryMs = new Date(tokenExpiry).getTime();
  }
  return expiryMs - buffer < Date.now();
}

/**
 * Ensure LinkedIn tokens are fresh for a user. Auto-refreshes if expired.
 * Updates the DB with new tokens and returns the fresh access tokens.
 *
 * Call this at the start of any API route that uses LinkedIn tokens.
 */
export async function ensureFreshTokens(userId: string): Promise<{
  posterToken: string | null;
  communityToken: string | null;
  refreshed: boolean;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { posterToken: null, communityToken: null, refreshed: false };

  let posterToken = user.linkedinAccessToken;
  let communityToken = user.linkedinCommunityAccessToken;
  let refreshed = false;

  // Check and refresh poster app token
  if (posterToken && isTokenExpired(user.linkedinTokenExpiry) && user.linkedinRefreshToken) {
    const newTokens = await refreshLinkedInToken('poster', user.linkedinRefreshToken);
    if (newTokens) {
      posterToken = newTokens.access_token;
      await db.update(users).set({
        linkedinAccessToken: newTokens.access_token,
        linkedinRefreshToken: newTokens.refresh_token || user.linkedinRefreshToken,
        linkedinTokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
      }).where(eq(users.id, userId));
      refreshed = true;
    } else {
      // Refresh failed - token is dead, user must reconnect
      posterToken = null;
    }
  }

  // Check and refresh community app token
  if (communityToken && isTokenExpired(user.linkedinCommunityTokenExpiry) && user.linkedinCommunityRefreshToken) {
    const newTokens = await refreshLinkedInToken('community', user.linkedinCommunityRefreshToken);
    if (newTokens) {
      communityToken = newTokens.access_token;
      await db.update(users).set({
        linkedinCommunityAccessToken: newTokens.access_token,
        linkedinCommunityRefreshToken: newTokens.refresh_token || user.linkedinCommunityRefreshToken,
        linkedinCommunityTokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
      }).where(eq(users.id, userId));
      refreshed = true;
    } else {
      communityToken = null;
    }
  }

  return { posterToken, communityToken, refreshed };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  appType: LinkedInAppType,
  code: string,
  redirectUri: string
): Promise<LinkedInTokenResponse> {
  const config = getLinkedInConfig(appType);

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get LinkedIn user profile using OpenID Connect userinfo endpoint
 *
 * This is the recommended approach for 2025/2026 using:
 * - Sign In with LinkedIn using OpenID Connect
 * - Scopes: openid, profile, email
 *
 * Available fields: sub (id), name, given_name, family_name, picture, email
 * Note: Headline requires Community Management API (r_member_social) - not available via OpenID Connect
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch LinkedIn profile: ${error}`);
  }

  const data = await response.json();

  return {
    id: data.sub,
    email: data.email,
    localizedFirstName: data.given_name || '',
    localizedLastName: data.family_name || '',
    profilePicture: data.picture ? { displayImage: data.picture } : undefined,
  };
}

/**
 * Fetch member profile with headline via REST API (requires r_basicprofile)
 * This is separate from getLinkedInProfile which uses OpenID Connect
 */
export async function getLinkedInProfileWithHeadline(
  accessToken: string
): Promise<{ headline: string; vanityName: string; memberId: string } | null> {
  try {
    const restResponse = await fetch(`${LINKEDIN_REST_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
    });
    if (restResponse.ok) {
      const data = await restResponse.json();
      return { headline: data.localizedHeadline || '', vanityName: data.vanityName || '', memberId: data.id || '' };
    }
    const response = await fetch(`${LINKEDIN_API_BASE}/me?projection=(localizedHeadline,vanityName)`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return { headline: data.localizedHeadline || '', vanityName: data.vanityName || '', memberId: data.id || '' };
  } catch (error) {
    console.error('[LinkedIn Profile] Headline fetch error:', error);
    return null;
  }
}

/**
 * Scrape a user's own public profile to get their post activity URNs
 * This is safe - it's the user's own public profile, no login needed
 * Returns activity IDs that can be converted to share URNs
 */
export async function scrapeOwnProfilePostURNs(
  vanityName: string
): Promise<Array<{ activityId: string; shareUrn: string; textPreview: string; postUrl: string }>> {
  try {
    const url = `https://www.linkedin.com/in/${encodeURIComponent(vanityName)}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.warn('[Profile Scrape] Failed:', response.status);
      return [];
    }

    const html = await response.text();

    // Extract post references from the HTML
    // LinkedIn embeds activity URNs in post URLs like:
    // /posts/username_post-text-here-activity-7439638766438461440-XXXX
    const pattern = /href="[^"]*?\/posts\/([^"]+activity-(\d+)[^"]*)"/g;
    const results: Array<{ activityId: string; shareUrn: string; textPreview: string; postUrl: string }> = [];
    const seen = new Set<string>();
    let match;

    while ((match = pattern.exec(html)) !== null) {
      const [, slug, activityId] = match;
      if (seen.has(activityId)) continue;
      seen.add(activityId);

      // Extract text preview from the slug
      const decoded = decodeURIComponent(slug);
      const parts = decoded.split('_');
      const textPart = parts.length > 1 ? parts.slice(1).join('_') : decoded;
      const textPreview = textPart
        .replace(/-activity-\d+.*$/, '')
        .replace(/-/g, ' ')
        .trim();

      // Filter out posts from other people (only keep posts from this vanityName)
      const authorInSlug = decoded.split('_')[0]?.toLowerCase();
      if (authorInSlug && authorInSlug !== vanityName.toLowerCase()) continue;

      results.push({
        activityId,
        shareUrn: `urn:li:share:${activityId}`,
        textPreview,
        postUrl: `https://www.linkedin.com/posts/${slug.split('?')[0]}`,
      });
    }

    console.log(`[Profile Scrape] Found ${results.length} own posts for ${vanityName}`);
    return results;
  } catch (error) {
    console.error('[Profile Scrape] Error:', error);
    return [];
  }
}

/**
 * Get a single post by its URN (the user's own post)
 * Requires w_member_social (can read own posts)
 */
export async function getPostByUrn(
  accessToken: string,
  postUrn: string
): Promise<{ id: string; commentary: string; mediaId?: string; mediaType?: string; publishedAt: number } | null> {
  try {
    const encodedUrn = encodeURIComponent(postUrn);
    const url = `${LINKEDIN_REST_API_BASE}/posts/${encodedUrn}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
    });

    if (!response.ok) {
      console.warn(`[Get Post] Failed for ${postUrn}:`, response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content as Record<string, unknown> | undefined;
    let mediaId: string | undefined;
    let mediaType: string | undefined;

    if (content?.media) {
      const media = content.media as Record<string, unknown>;
      mediaId = media.id as string;
      if (mediaId?.includes('urn:li:image:')) mediaType = 'image';
      else if (mediaId?.includes('urn:li:video:')) mediaType = 'video';
      else if (mediaId?.includes('urn:li:document:')) mediaType = 'document';
    } else if (content?.multiImage) {
      mediaType = 'multiImage';
      const mi = content.multiImage as Record<string, unknown>;
      const images = mi.images as Array<Record<string, unknown>> | undefined;
      if (images?.[0]) mediaId = images[0].id as string;
    }

    return {
      id: data.id || postUrn,
      commentary: data.commentary || '',
      mediaId,
      mediaType,
      publishedAt: data.publishedAt || data.createdAt || 0,
    };
  } catch (error) {
    console.error(`[Get Post] Error for ${postUrn}:`, error);
    return null;
  }
}

/**
 * Check if LinkedIn OAuth is configured
 */
export function isLinkedInConfigured(): boolean {
  return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

/**
 * Extract post URN from REST Posts API response.
 * The REST API returns the post URN in the x-restli-id header.
 */
async function getPostIdFromRestResponse(response: Response): Promise<{ id: string }> {
  const postUrn = response.headers.get('x-restli-id');
  if (postUrn) {
    return { id: postUrn };
  }
  try {
    const data = await response.json();
    return { id: data.id || data.value?.id || '' };
  } catch {
    return { id: '' };
  }
}

/**
 * Create a LinkedIn post
 * @param authorId - Either a person ID or organization ID
 * @param authorType - 'person' for personal profile or 'organization' for company page
 */
export async function createLinkedInPost(
  accessToken: string,
  authorId: string,
  text: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  authorType: 'person' | 'organization' = 'person'
): Promise<{ id: string }> {
  const authorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  const postData = {
    author: authorUrn,
    commentary: text,
    visibility: visibility,
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  const response = await fetch(`${LINKEDIN_REST_API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post: ${error}`);
  }

  return getPostIdFromRestResponse(response);
}

/**
 * Post a comment on a LinkedIn post
 * Uses the REST API socialActions endpoint
 * Requires w_member_social scope (already available via Poster App)
 */
/**
 * Post a comment on a LinkedIn post
 * POST /rest/socialActions/{activityUrn}/comments
 * Body: { "actor": "urn:li:person:XXX", "object": "urn:li:activity:XXX", "message": { "text": "..." } }
 * Requires: w_member_social or w_member_social_feed scope
 * Source: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api
 */
export async function createLinkedInComment(
  accessTokens: string | string[],
  postUrn: string,
  authorId: string,
  commentText: string,
  authorType: 'person' | 'organization' = 'person'
): Promise<{ id: string }> {
  const actorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;
  const encodedUrn = encodeURIComponent(postUrn);
  const tokens = Array.isArray(accessTokens) ? accessTokens : [accessTokens];
  const body = { actor: actorUrn, object: postUrn, message: { text: commentText } };

  let lastError = '';
  for (const token of tokens) {

    const response = await fetch(`${LINKEDIN_REST_API_BASE}/socialActions/${encodedUrn}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (response.ok || response.status === 201) {
      let data;
      try { data = await response.json(); } catch { data = {}; }
      return { id: data.id || data['$URN'] || 'comment-created' };
    }

    lastError = await response.text();

    // LinkedIn may return the correct threadUrn in the error. Extract and retry.
    const threadUrnMatch = lastError.match(/actual threadUrn: (urn:li:\w+:\d+)/);
    if (threadUrnMatch) {
      const correctUrn = threadUrnMatch[1];
      const retryEncoded = encodeURIComponent(correctUrn);
      const retryBody = { ...body, object: correctUrn };
      const retryResponse = await fetch(`${LINKEDIN_REST_API_BASE}/socialActions/${retryEncoded}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
        body: JSON.stringify(retryBody),
      });
      if (retryResponse.ok || retryResponse.status === 201) {
        let data;
        try { data = await retryResponse.json(); } catch { data = {}; }
        return { id: data.id || data['$URN'] || 'comment-created' };
      }
      lastError = await retryResponse.text();
    }
  }

  throw new Error(`Failed to comment: ${lastError}`);
}

/**
 * Register an image upload with LinkedIn
 * Returns the upload URL and asset URN
 */
async function registerImageUpload(
  accessToken: string,
  ownerUrn: string
): Promise<{ uploadUrl: string; image: string }> {
  const response = await fetch(`${LINKEDIN_REST_API_BASE}/images?action=initializeUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: ownerUrn,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register image upload: ${error}`);
  }

  const data = await response.json();
  const uploadUrl = data.value.uploadUrl;
  const image = data.value.image;

  return { uploadUrl, image };
}

/**
 * Upload binary image data to LinkedIn
 */
async function uploadImageToLinkedIn(
  uploadUrl: string,
  imageBlob: Blob
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: imageBlob,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image to LinkedIn: ${error}`);
  }
}

/**
 * Fetch image from URL and return as Blob with content type
 */
async function fetchImageAsBlob(imageUrl: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const blob = await response.blob();

  return { blob, contentType };
}

/**
 * Create a LinkedIn post with an image (native image upload)
 * @param authorId - Either a person ID or organization ID
 * @param authorType - 'person' for personal profile or 'organization' for company page
 */
export async function createLinkedInPostWithImage(
  accessToken: string,
  authorId: string,
  text: string,
  imageUrl: string,
  imageTitle?: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  authorType: 'person' | 'organization' = 'person'
): Promise<{ id: string }> {
  const authorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  // Step 1: Fetch the image from R2/external URL
  const { blob } = await fetchImageAsBlob(imageUrl);

  // Step 2: Register the upload with LinkedIn Images API
  const { uploadUrl, image: imageUrn } = await registerImageUpload(accessToken, authorUrn);

  // Step 3: Upload the actual image binary to LinkedIn
  await uploadImageToLinkedIn(uploadUrl, blob);

  // Step 4: Create the post using the REST Posts API with the image
  const postData = {
    author: authorUrn,
    commentary: text,
    visibility: visibility,
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      media: {
        title: imageTitle || undefined,
        id: imageUrn,
      },
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  const response = await fetch(`${LINKEDIN_REST_API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post with image: ${error}`);
  }

  return getPostIdFromRestResponse(response);
}

/**
 * Register a video upload with LinkedIn
 * Returns the upload URL and asset URN
 */
async function registerVideoUpload(
  accessToken: string,
  ownerUrn: string,
  fileSizeBytes: number
): Promise<{ uploadUrl: string; video: string }> {
  const response = await fetch(`${LINKEDIN_REST_API_BASE}/videos?action=initializeUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: ownerUrn,
        fileSizeBytes: fileSizeBytes,
        uploadCaptions: false,
        uploadThumbnail: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register video upload: ${error}`);
  }

  const data = await response.json();
  const uploadUrl = data.value.uploadInstructions[0].uploadUrl;
  const video = data.value.video;

  return { uploadUrl, video };
}

/**
 * Upload video binary data to LinkedIn
 */
async function uploadVideoToLinkedIn(
  uploadUrl: string,
  videoBlob: Blob
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: videoBlob,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload video to LinkedIn: ${error}`);
  }
}

/**
 * Fetch video from URL and return as Blob with content type
 */
async function fetchVideoAsBlob(videoUrl: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch video from URL: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'video/mp4';
  const blob = await response.blob();

  return { blob, contentType };
}

/**
 * Create a LinkedIn post with a video (native video upload)
 * @param authorId - Either a person ID or organization ID
 * @param authorType - 'person' for personal profile or 'organization' for company page
 * @param videoUrl - URL of the video file (R2 storage URL)
 * @param videoMimeType - MIME type of the video (video/mp4 or video/quicktime)
 */
export async function createLinkedInPostWithVideo(
  accessToken: string,
  authorId: string,
  text: string,
  videoUrl: string,
  videoMimeType: string,
  videoTitle?: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  authorType: 'person' | 'organization' = 'person'
): Promise<{ id: string }> {
  const authorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  // Step 1: Fetch the video from R2
  const { blob: videoBlob } = await fetchVideoAsBlob(videoUrl);

  // Step 2: Register the video upload with LinkedIn Videos API
  const { uploadUrl, video: videoUrn } = await registerVideoUpload(
    accessToken,
    authorUrn,
    videoBlob.size
  );

  // Step 3: Upload the video binary to LinkedIn
  await uploadVideoToLinkedIn(uploadUrl, videoBlob);

  // Step 4: Finalize the video upload
  await fetch(`${LINKEDIN_REST_API_BASE}/videos?action=finalizeUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: JSON.stringify({
      finalizeUploadRequest: {
        video: videoUrn,
        uploadToken: '',
        uploadedPartIds: [],
      },
    }),
  });

  // Step 5: Create the post using the REST Posts API with the video
  const postData = {
    author: authorUrn,
    commentary: text,
    visibility: visibility,
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      media: {
        title: videoTitle || undefined,
        id: videoUrn,
      },
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  const response = await fetch(`${LINKEDIN_REST_API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post with video: ${error}`);
  }

  return getPostIdFromRestResponse(response);
}

/**
 * Register a document upload with LinkedIn
 * Returns the upload URL and asset URN
 */
async function registerDocumentUpload(
  accessToken: string,
  ownerUrn: string
): Promise<{ uploadUrl: string; document: string }> {
  const response = await fetch(`${LINKEDIN_REST_API_BASE}/documents?action=initializeUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: ownerUrn,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register document upload: ${error}`);
  }

  const data = await response.json();
  const uploadUrl = data.value.uploadUrl;
  const document = data.value.document;

  return { uploadUrl, document };
}

/**
 * Upload document binary data to LinkedIn
 */
async function uploadDocumentToLinkedIn(
  uploadUrl: string,
  documentBlob: Blob
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: documentBlob,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload document to LinkedIn: ${error}`);
  }
}

/**
 * Fetch document from URL and return as Blob
 */
async function fetchDocumentAsBlob(documentUrl: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(documentUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch document from URL: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'application/pdf';
  const blob = await response.blob();

  return { blob, contentType };
}

/**
 * Create a LinkedIn post with a document (PDF carousel)
 * @param authorId - Either a person ID or organization ID
 * @param authorType - 'person' for personal profile or 'organization' for company page
 * @param documentUrl - URL of the document file (R2 storage URL)
 * @param documentTitle - Title displayed on the carousel post
 */
export async function createLinkedInPostWithDocument(
  accessToken: string,
  authorId: string,
  text: string,
  documentUrl: string,
  documentTitle?: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  authorType: 'person' | 'organization' = 'person'
): Promise<{ id: string }> {
  const authorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  // Step 1: Fetch the document from R2
  const { blob: documentBlob } = await fetchDocumentAsBlob(documentUrl);

  // Step 2: Register the document upload with LinkedIn Documents API
  const { uploadUrl, document: documentUrn } = await registerDocumentUpload(accessToken, authorUrn);

  // Step 3: Upload the document binary to LinkedIn
  await uploadDocumentToLinkedIn(uploadUrl, documentBlob);

  // Step 4: Create the post using the REST Posts API with the document
  const postData = {
    author: authorUrn,
    commentary: text,
    visibility: visibility,
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      media: {
        title: documentTitle || 'Carousel',
        id: documentUrn,
      },
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  const response = await fetch(`${LINKEDIN_REST_API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post with document: ${error}`);
  }

  return getPostIdFromRestResponse(response);
}

/**
 * Validate LinkedIn access token
 */
export async function validateLinkedInToken(accessToken: string): Promise<boolean> {
  try {
    await getLinkedInProfile(accessToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get organizations where the user is an administrator
 * Uses the Organization Access Control API (requires Advertising API access)
 */
export async function getAdministeredOrganizations(accessToken: string): Promise<LinkedInOrganization[]> {
  try {
    // Try REST API first (Community Management API - requires LinkedIn-Version header)
    // Try REST API first (Community Management API)
    const restResponse = await fetch(
      `${LINKEDIN_REST_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      }
    );

    if (restResponse.ok) {
      const restData = await restResponse.json();
      const orgIds: string[] = [];

      if (restData.elements && Array.isArray(restData.elements)) {
        for (const element of restData.elements) {
          const orgUrn = element.organization || element.organizationalTarget;
          if (orgUrn && orgUrn.includes('urn:li:organization:')) {
            orgIds.push(orgUrn.replace('urn:li:organization:', ''));
          }
        }
      }

      if (orgIds.length > 0) {
        return await fetchOrganizationDetails(accessToken, orgIds);
      }
    } else {
      const errText = await restResponse.text();
    }

    // Fallback: v2 API with projection
    // Fallback: v2 API with projection
    const aclResponse = await fetch(
      `${LINKEDIN_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName,logoV2(original~:playableStreams))))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (aclResponse.ok) {
      const aclData = await aclResponse.json();
      const organizations: LinkedInOrganization[] = [];

      if (aclData.elements && Array.isArray(aclData.elements)) {
        for (const element of aclData.elements) {
          const orgUrn = element.organization;
          const orgDetails = element['organization~'];

          if (orgUrn && orgDetails) {
            const orgId = orgUrn.replace('urn:li:organization:', '');
            let logoUrl: string | undefined;
            if (orgDetails.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier) {
              logoUrl = orgDetails.logoV2['original~'].elements[0].identifiers[0].identifier;
            }

            organizations.push({
              id: orgId,
              name: orgDetails.localizedName || 'Unknown Organization',
              logoUrl,
            });
          }
        }
      }

      if (organizations.length > 0) return organizations;
    } else {
    }

    // Last fallback: organizationalEntityAcls
    // Last fallback: organizationalEntityAcls
    return await getOrganizationsAlternate(accessToken);
  } catch (error) {
    console.error('Failed to fetch administered organizations:', error);
    return [];
  }
}

/**
 * Fetch organization name and logo for a list of org IDs
 */
async function fetchOrganizationDetails(accessToken: string, orgIds: string[]): Promise<LinkedInOrganization[]> {
  const organizations: LinkedInOrganization[] = [];

  for (const orgId of orgIds) {
    try {
      // Use v2 API with projection to get resolved logo URLs directly
      const response = await fetch(
        `${LINKEDIN_API_BASE}/organizations/${orgId}?projection=(localizedName,logoV2(original~:playableStreams))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      let name = 'Unknown Organization';
      let logoUrl: string | undefined;

      if (response.ok) {
        const orgData = await response.json();
        name = orgData.localizedName || name;
        // v2 with projection returns resolved image URLs
        if (orgData.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier) {
          logoUrl = orgData.logoV2['original~'].elements[0].identifiers[0].identifier;
        }
      } else {
        // Fallback: REST API for name only
        const restResponse = await fetch(
          `${LINKEDIN_REST_API_BASE}/organizations/${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'LinkedIn-Version': LINKEDIN_API_VERSION,
            },
          }
        );
        if (restResponse.ok) {
          const restData = await restResponse.json();
          name = restData.localizedName || name;
          // REST API returns a URN for logo - resolve it via images API
          const logoUrn = restData.logoV2?.original;
          if (logoUrn && logoUrn.startsWith('urn:li:')) {
            const resolved = await getImageDownloadUrls(accessToken, [logoUrn]).catch(() => new Map());
            logoUrl = resolved.get(logoUrn);
          }
        }
      }

      organizations.push({ id: orgId, name, logoUrl });
    } catch {
      console.error(`[LinkedIn Orgs] Failed to fetch details for org ${orgId}`);
    }
  }

  return organizations;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface LinkedInPostStats {
  postUrn: string;
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface LinkedInOrganizationStats {
  followerCount: number;
  followerGrowth?: {
    organicCount: number;
    paidCount: number;
    totalCount: number;
  };
  pageViews?: number;
  uniqueVisitors?: number;
}

export interface LinkedInFollowerDemographics {
  byCountry?: Array<{ country: string; count: number; percentage: number }>;
  byIndustry?: Array<{ industry: string; count: number; percentage: number }>;
  byFunction?: Array<{ function: string; count: number; percentage: number }>;
  bySeniority?: Array<{ seniority: string; count: number; percentage: number }>;
}

export interface LinkedInAnalyticsCapabilities {
  canFetchPostStats: boolean;
  canFetchFollowerCount: boolean;
  canFetchFollowerDemographics: boolean;
  canFetchPageViews: boolean;
  isOrganization: boolean;
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

/**
 * Determine what analytics capabilities are available based on posting target
 * Personal profiles: Post analytics + follower count via Community Management API
 * Organizations: Full analytics including demographics and page views
 */
export function getAnalyticsCapabilities(
  postingTarget: 'profile' | 'organization' | null
): LinkedInAnalyticsCapabilities {
  const isOrganization = postingTarget === 'organization';

  return {
    // Post stats available for both via memberCreatorPostAnalytics (profile) or orgShareStats (org)
    canFetchPostStats: true,
    // Follower count available for both (memberFollowersCount for profiles, orgFollowerStats for orgs)
    canFetchFollowerCount: true,
    // Follower demographics only available for organizations
    canFetchFollowerDemographics: isOrganization,
    // Page views only available for organizations
    canFetchPageViews: isOrganization,
    isOrganization,
  };
}

// ============================================
// MEMBER (PERSONAL PROFILE) ANALYTICS - REST API
// Requires Community Management API with r_member_postAnalytics scope
// ============================================

export interface MemberPostAnalytics {
  postUrn: string;
  impressions: number;
  membersReached: number;
  reactions: number;
  comments: number;
  reshares: number;
}

export interface MemberAggregatedAnalytics {
  totalImpressions: number;
  totalMembersReached: number;
  totalReactions: number;
  totalComments: number;
  totalReshares: number;
  postCount: number;
}

export interface MemberFollowerStats {
  totalFollowers: number;
  followersByDateRange?: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Get analytics for a specific post owned by the authenticated member
 * Uses the Member Creator Post Analytics API (REST API)
 * Requires r_member_postAnalytics scope
 *
 * Endpoint: GET https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=entity&entity={postUrn}
 */
export async function getMemberPostAnalytics(
  accessToken: string,
  postUrn: string
): Promise<MemberPostAnalytics | null> {
  try {
    const encodedUrn = encodeURIComponent(postUrn);

    const response = await fetch(
      `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=entity&entity=${encodedUrn}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Failed to fetch member post analytics for ${postUrn}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Response contains elements array with post analytics
    if (data.elements && data.elements.length > 0) {
      const stats = data.elements[0];
      return {
        postUrn,
        impressions: stats.impressionCount || 0,
        membersReached: stats.uniqueImpressionsCount || stats.membersReachedCount || 0,
        reactions: stats.reactionCount || stats.likeCount || 0,
        comments: stats.commentCount || 0,
        reshares: stats.shareCount || stats.reshareCount || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch member post analytics:', error);
    return null;
  }
}

/**
 * Get aggregated analytics for all posts owned by the authenticated member
 * Uses the Member Creator Post Analytics API with q=me
 * Requires r_member_postAnalytics scope
 *
 * Endpoint: GET https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=me
 */
export async function getMemberAggregatedAnalytics(
  accessToken: string,
  dateRange?: { start: Date; end: Date }
): Promise<MemberAggregatedAnalytics | null> {
  try {
    // The memberCreatorPostAnalytics API requires one call PER metric type
    const metrics = ['IMPRESSION', 'MEMBERS_REACHED', 'REACTION', 'COMMENT', 'RESHARE'] as const;

    let dateRangeParam = '';
    if (dateRange) {
      const s = dateRange.start;
      const e = dateRange.end;
      dateRangeParam = `&dateRange=(start:(year:${s.getFullYear()},month:${s.getMonth() + 1},day:${s.getDate()}),end:(year:${e.getFullYear()},month:${e.getMonth() + 1},day:${e.getDate()}))`;
    }

    const results: Record<string, number> = {};

    // Fetch each metric type in parallel
    await Promise.all(
      metrics.map(async (metric) => {
        try {
          const url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me&queryType=${metric}&aggregation=TOTAL${dateRangeParam}`;

          console.log(`[Analytics] Fetching ${metric}: ${url}`);

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'LinkedIn-Version': LINKEDIN_API_VERSION,
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[Analytics] ${metric} FAILED ${response.status}: ${errorText.substring(0, 300)}`);
            if (response.status === 429) {
              console.warn(`[Analytics] Rate limited - returning partial data`);
            }
            return;
          }

          const data = await response.json();
          console.log(`[Analytics] ${metric} response: ${JSON.stringify(data).substring(0, 300)}`);
          let total = 0;
          if (data.elements && Array.isArray(data.elements)) {
            for (const el of data.elements) {
              total += el.count || 0;
            }
          }
          results[metric] = total;
          console.log(`[Analytics] ${metric}: ${total}`);
        } catch (err) {
          console.warn(`[Analytics] ${metric} error:`, err);
        }
      })
    );

    return {
      totalImpressions: results['IMPRESSION'] || 0,
      totalMembersReached: results['MEMBERS_REACHED'] || 0,
      totalReactions: results['REACTION'] || 0,
      totalComments: results['COMMENT'] || 0,
      totalReshares: results['RESHARE'] || 0,
      postCount: 0, // Not available from aggregated endpoint
    };
  } catch (error) {
    console.error('Failed to fetch member aggregated analytics:', error);
    return null;
  }
}

/**
 * Get all post analytics for the authenticated member (with individual post data)
 * Returns array of analytics for each post
 * Requires r_member_postAnalytics scope
 */
/**
 * Get analytics for individual posts by their URNs
 * Uses q=entity finder - one call per post per metric
 * For efficiency, fetches IMPRESSION as TOTAL for each post
 */
export async function getMemberAllPostsAnalytics(
  accessToken: string,
  dateRange?: { start: Date; end: Date },
  postUrns?: string[]
): Promise<MemberPostAnalytics[]> {
  if (!postUrns || postUrns.length === 0) return [];

  let dateRangeParam = '';
  if (dateRange) {
    const s = dateRange.start;
    const e = dateRange.end;
    dateRangeParam = `&dateRange=(start:(year:${s.getFullYear()},month:${s.getMonth() + 1},day:${s.getDate()}),end:(year:${e.getFullYear()},month:${e.getMonth() + 1},day:${e.getDate()}))`;
  }

  const metrics = ['IMPRESSION', 'REACTION', 'COMMENT', 'RESHARE'] as const;
  const postStats = new Map<string, MemberPostAnalytics>();

  const urnsToFetch = postUrns.slice(0, 20);

  // Fetch all posts and all metrics in parallel
  await Promise.all(
    urnsToFetch.map(async (postUrn) => {
      const stats: MemberPostAnalytics = {
        postUrn,
        impressions: 0,
        membersReached: 0,
        reactions: 0,
        comments: 0,
        reshares: 0,
      };

      const entityParam = postUrn.includes('ugcPost')
        ? `(ugc:${encodeURIComponent(postUrn)})`
        : `(share:${encodeURIComponent(postUrn)})`;

      await Promise.all(
        metrics.map(async (metric) => {
          try {
            const url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=entity&entity=${entityParam}&queryType=${metric}&aggregation=TOTAL${dateRangeParam}`;

            const response = await fetch(url, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': LINKEDIN_API_VERSION,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const count = data.elements?.[0]?.count || 0;
              if (metric === 'IMPRESSION') stats.impressions = count;
              else if (metric === 'REACTION') stats.reactions = count;
              else if (metric === 'COMMENT') stats.comments = count;
              else if (metric === 'RESHARE') stats.reshares = count;
            }
          } catch {
            // Skip failed individual metric
          }
        })
      );

      postStats.set(postUrn, stats);
    })
  );

  return Array.from(postStats.values());
}

// ============================================
// MEMBER FOLLOWER STATISTICS - REST API
// Requires Community Management API with r_member_profileAnalytics scope
// ============================================

/**
 * Get lifetime follower count for the authenticated member
 * Uses the Member Followers Count API
 * Requires r_member_profileAnalytics scope
 *
 * Endpoint: GET https://api.linkedin.com/rest/memberFollowersCount?q=me
 */
export async function getMemberFollowerCount(
  accessToken: string
): Promise<number | null> {
  try {
    const response = await fetch(
      `${LINKEDIN_REST_API_BASE}/memberFollowersCount?q=me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Failed to fetch member follower count:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Response format: { elements: [{ memberFollowersCount: 100 }] }
    if (data.elements && data.elements.length > 0) {
      return data.elements[0].memberFollowersCount || 0;
    }

    return 0;
  } catch (error) {
    console.error('Failed to fetch member follower count:', error);
    return null;
  }
}

/**
 * Get time-bound follower statistics for the authenticated member
 * Shows followers gained within a date range
 * Requires r_member_profileAnalytics scope
 *
 * Endpoint: GET https://api.linkedin.com/rest/memberFollowersCount?q=dateRange&dateRange=(start:...,end:...)
 */
export async function getMemberFollowerStats(
  accessToken: string,
  dateRange: { start: Date; end: Date }
): Promise<MemberFollowerStats | null> {
  try {
    // Build date range query
    const startYear = dateRange.start.getFullYear();
    const startMonth = dateRange.start.getMonth() + 1;
    const startDay = dateRange.start.getDate();
    const endYear = dateRange.end.getFullYear();
    const endMonth = dateRange.end.getMonth() + 1;
    const endDay = dateRange.end.getDate();

    // First get total followers
    const totalResponse = await fetch(
      `${LINKEDIN_REST_API_BASE}/memberFollowersCount?q=me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
          'Content-Type': 'application/json',
        },
      }
    );

    let totalFollowers = 0;
    if (totalResponse.ok) {
      const totalData = await totalResponse.json();
      if (totalData.elements && totalData.elements.length > 0) {
        totalFollowers = totalData.elements[0].memberFollowersCount || 0;
      }
    }

    // Then get time-bound data
    const url = `${LINKEDIN_REST_API_BASE}/memberFollowersCount?q=dateRange&dateRange=(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Return just the total if time-bound fails
      return { totalFollowers };
    }

    const data = await response.json();
    const followersByDateRange: Array<{ date: string; count: number }> = [];

    // Parse date range data
    if (data.elements && Array.isArray(data.elements)) {
      for (const element of data.elements) {
        const dateInfo = element.dateRange?.start;
        if (dateInfo) {
          const date = `${dateInfo.year}-${String(dateInfo.month).padStart(2, '0')}-${String(dateInfo.day).padStart(2, '0')}`;
          followersByDateRange.push({
            date,
            count: element.memberFollowersCount || 0,
          });
        }
      }
    }

    return {
      totalFollowers,
      followersByDateRange,
    };
  } catch (error) {
    console.error('Failed to fetch member follower stats:', error);
    return null;
  }
}

/**
 * Calculate followers gained in a date range
 * Sums up the follower counts from each day in the range
 */
export async function getMemberFollowersGained(
  accessToken: string,
  dateRange: { start: Date; end: Date }
): Promise<number> {
  const stats = await getMemberFollowerStats(accessToken, dateRange);
  if (!stats?.followersByDateRange) return 0;

  return stats.followersByDateRange.reduce((sum, day) => sum + day.count, 0);
}

/**
 * Get share statistics for organization posts
 * Provides impressions, clicks, and engagement data
 * Requires Community Management API access
 */
export async function getOrganizationShareStatistics(
  accessToken: string,
  organizationId: string,
  shareUrns: string[],
  timeRange?: { start: Date; end: Date }
): Promise<Map<string, LinkedInPostStats>> {
  const stats = new Map<string, LinkedInPostStats>();

  if (shareUrns.length === 0) return stats;

  try {
    // Build time range params
    const now = new Date();
    const start = timeRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = timeRange?.end || now;

    const startTimestamp = start.getTime();
    const endTimestamp = end.getTime();

    // Fetch share statistics for the organization (REST API doesn't support timeIntervals)
    const encodedShares = shareUrns.map(urn => encodeURIComponent(urn)).join(',');

    const response = await fetch(
      `${LINKEDIN_REST_API_BASE}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(`urn:li:organization:${organizationId}`)}&shares=List(${encodedShares})`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      }
    );

    if (!response.ok) {
      console.warn('Failed to fetch organization share statistics:', response.status);
      return stats;
    }

    const data = await response.json();

    if (data.elements && Array.isArray(data.elements)) {
      for (const element of data.elements) {
        const shareUrn = element.share;
        const totalStats = element.totalShareStatistics || {};

        const impressions = totalStats.impressionCount || 0;
        const clicks = totalStats.clickCount || 0;
        const likes = totalStats.likeCount || 0;
        const comments = totalStats.commentCount || 0;
        const shares = totalStats.shareCount || 0;
        const engagement = totalStats.engagement || 0;

        stats.set(shareUrn, {
          postUrn: shareUrn,
          impressions,
          clicks,
          likes,
          comments,
          shares,
          engagementRate: engagement * 100, // Convert to percentage
        });
      }
    }

    return stats;
  } catch (error) {
    console.error('Failed to fetch organization share statistics:', error);
    return stats;
  }
}

/**
 * Get organization follower count and statistics
 * Requires Community Management API access
 */
export async function getOrganizationFollowerCount(
  accessToken: string,
  organizationId: string
): Promise<LinkedInOrganizationStats | null> {
  try {
    // Get follower statistics
    const response = await fetch(
      `${LINKEDIN_REST_API_BASE}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(`urn:li:organization:${organizationId}`)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      }
    );

    if (!response.ok) {
      // Try alternate endpoint
      return await getOrganizationFollowerCountAlternate(accessToken, organizationId);
    }

    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      const stats = data.elements[0];
      const followerGains = stats.followerGains || {};

      // REST API returns followerCountsByAssociationType instead of followerCounts
      let totalOrganic = 0;
      let totalPaid = 0;
      if (stats.followerCounts) {
        totalOrganic = stats.followerCounts.organicFollowerCount || 0;
        totalPaid = stats.followerCounts.paidFollowerCount || 0;
      } else if (stats.followerCountsByGeoCountry) {
        // Sum from geo breakdown (most reliable total)
        for (const entry of stats.followerCountsByGeoCountry) {
          totalOrganic += entry.followerCounts?.organicFollowerCount || 0;
          totalPaid += entry.followerCounts?.paidFollowerCount || 0;
        }
      }

      return {
        followerCount: totalOrganic + totalPaid,
        followerGrowth: {
          organicCount: followerGains.organicFollowerGain || 0,
          paidCount: followerGains.paidFollowerGain || 0,
          totalCount: (followerGains.organicFollowerGain || 0) + (followerGains.paidFollowerGain || 0),
        },
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch organization follower count:', error);
    return null;
  }
}

/**
 * Alternate method to get follower count from organization details
 */
async function getOrganizationFollowerCountAlternate(
  accessToken: string,
  organizationId: string
): Promise<LinkedInOrganizationStats | null> {
  try {
    const response = await fetch(
      `${LINKEDIN_REST_API_BASE}/networkSizes/${encodeURIComponent(`urn:li:organization:${organizationId}`)}?edgeType=CompanyFollowedByMember`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      followerCount: data.firstDegreeSize || 0,
    };
  } catch (error) {
    console.error('Failed to fetch follower count (alternate):', error);
    return null;
  }
}

/**
 * Get organization page statistics (views, visitors)
 * Requires Community Management API access
 */
export async function getOrganizationPageStatistics(
  accessToken: string,
  organizationId: string,
  timeRange?: { start: Date; end: Date }
): Promise<{ pageViews: number; uniqueVisitors: number } | null> {
  try {
    const now = new Date();
    const start = timeRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = timeRange?.end || now;

    const response = await fetch(
      `${LINKEDIN_REST_API_BASE}/organizationPageStatistics?q=organization&organization=${encodeURIComponent(`urn:li:organization:${organizationId}`)}&timeIntervals.timeGranularityType=ALL&timeIntervals.timeRange.start=${start.getTime()}&timeIntervals.timeRange.end=${end.getTime()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      const stats = data.elements[0];
      return {
        pageViews: stats.totalPageStatistics?.views?.allPageViews?.pageViews || 0,
        uniqueVisitors: stats.totalPageStatistics?.views?.allPageViews?.uniquePageViews || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch page statistics:', error);
    return null;
  }
}

/**
 * Get follower demographics for an organization
 * Includes breakdown by country, industry, function, and seniority
 * Requires Community Management API access
 */
export async function getOrganizationFollowerDemographics(
  accessToken: string,
  organizationId: string
): Promise<LinkedInFollowerDemographics | null> {
  try {
    const demographics: LinkedInFollowerDemographics = {};

    // Fetch demographics by different facets
    const facets = ['COUNTRY', 'INDUSTRY', 'FUNCTION', 'SENIORITY'];

    for (const facet of facets) {
      try {
        const response = await fetch(
          `${LINKEDIN_REST_API_BASE}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(`urn:li:organization:${organizationId}`)}&breakdown=${facet}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'LinkedIn-Version': LINKEDIN_API_VERSION,
            },
          }
        );

        if (!response.ok) continue;

        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
          const breakdownData = data.elements
            .filter((el: Record<string, unknown>) => el[facet.toLowerCase()])
            .map((el: Record<string, unknown>) => {
              const counts = el.followerCounts as { organicFollowerCount?: number; paidFollowerCount?: number } || {};
              const count = (counts.organicFollowerCount || 0) + (counts.paidFollowerCount || 0);
              return {
                [facet.toLowerCase()]: el[facet.toLowerCase()],
                count,
                percentage: 0, // Will calculate after we have total
              };
            })
            .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
            .slice(0, 10); // Top 10

          // Calculate percentages
          const total = breakdownData.reduce((sum: number, item: { count: number }) => sum + item.count, 0);
          breakdownData.forEach((item: { count: number; percentage: number }) => {
            item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          });

          switch (facet) {
            case 'COUNTRY':
              demographics.byCountry = breakdownData.map((d: Record<string, unknown>) => ({
                country: d.country as string,
                count: d.count as number,
                percentage: d.percentage as number,
              }));
              break;
            case 'INDUSTRY':
              demographics.byIndustry = breakdownData.map((d: Record<string, unknown>) => ({
                industry: d.industry as string,
                count: d.count as number,
                percentage: d.percentage as number,
              }));
              break;
            case 'FUNCTION':
              demographics.byFunction = breakdownData.map((d: Record<string, unknown>) => ({
                function: d.function as string,
                count: d.count as number,
                percentage: d.percentage as number,
              }));
              break;
            case 'SENIORITY':
              demographics.bySeniority = breakdownData.map((d: Record<string, unknown>) => ({
                seniority: d.seniority as string,
                count: d.count as number,
                percentage: d.percentage as number,
              }));
              break;
          }
        }
      } catch {
        // Skip this facet if it fails
        continue;
      }
    }

    // Return null if no demographics were fetched
    if (Object.keys(demographics).length === 0) {
      return null;
    }

    return demographics;
  } catch (error) {
    console.error('Failed to fetch follower demographics:', error);
    return null;
  }
}

// ============================================
// POST SYNC FUNCTIONS (Community Management API)
// ============================================

/**
 * Fetch all posts by author (person or organization) using the Posts API
 * Requires r_member_social (personal) or r_organization_social (org)
 */
export async function getPostsByAuthor(
  accessToken: string,
  authorUrn: string,
  count: number = 100,
  start: number = 0
): Promise<{ posts: LinkedInAuthorPost[]; total: number; hasMore: boolean }> {
  const encodedAuthor = encodeURIComponent(authorUrn);
  const url = `${LINKEDIN_REST_API_BASE}/posts?author=${encodedAuthor}&q=author&count=${count}&start=${start}&sortBy=LAST_MODIFIED`;

  console.log('[LinkedIn Posts Sync] Fetching:', { authorUrn, count, start });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-RestLi-Method': 'FINDER',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[LinkedIn Posts Sync] Error:', { status: response.status, error });
    throw new Error(`Failed to fetch posts by author (${response.status}): ${error}`);
  }

  const data = await response.json();
  const elements = data.elements || [];

  const posts: LinkedInAuthorPost[] = elements.map((el: Record<string, unknown>) => {
    const content = el.content as Record<string, unknown> | undefined;
    let mediaId: string | undefined;
    let mediaType: 'image' | 'video' | 'document' | 'article' | 'multiImage' | undefined;

    if (content?.media) {
      const media = content.media as Record<string, unknown>;
      mediaId = media.id as string;
      if (mediaId) {
        if (mediaId.includes('urn:li:image:')) mediaType = 'image';
        else if (mediaId.includes('urn:li:video:')) mediaType = 'video';
        else if (mediaId.includes('urn:li:document:')) mediaType = 'document';
      }
    } else if (content?.multiImage) {
      mediaType = 'multiImage';
      const multiImage = content.multiImage as Record<string, unknown>;
      const images = multiImage.images as Array<Record<string, unknown>> | undefined;
      if (images && images.length > 0) {
        mediaId = (images[0].id as string) || undefined;
      }
    } else if (content?.article) {
      mediaType = 'article';
      const article = content.article as Record<string, unknown>;
      mediaId = (article.thumbnail as string) || undefined;
    }

    return {
      id: el.id as string,
      author: el.author as string,
      commentary: (el.commentary as string) || '',
      publishedAt: el.publishedAt as number,
      createdAt: el.createdAt as number,
      lastModifiedAt: el.lastModifiedAt as number,
      lifecycleState: el.lifecycleState as string,
      visibility: (el.visibility as string) || 'PUBLIC',
      mediaId,
      mediaType,
      content: content || null,
    };
  });

  const hasMore = (data.paging?.links || []).some((l: Record<string, unknown>) => l.rel === 'next');

  console.log('[LinkedIn Posts Sync] Fetched:', { count: posts.length, hasMore });
  return { posts, total: data.paging?.total || posts.length, hasMore };
}

/**
 * Get image download URLs from LinkedIn Images API
 * Returns a map of image URN -> download URL
 */
export async function getImageDownloadUrls(
  accessToken: string,
  imageUrns: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (imageUrns.length === 0) return result;

  // Batch get images (up to 20 at a time)
  const batchSize = 20;
  for (let i = 0; i < imageUrns.length; i += batchSize) {
    const batch = imageUrns.slice(i, i + batchSize);
    const encodedIds = batch.map(urn => encodeURIComponent(urn)).join(',');
    const url = `${LINKEDIN_REST_API_BASE}/images?ids=List(${encodedIds})`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
          'X-RestLi-Method': 'BATCH_GET',
        },
      });

      if (!response.ok) {
        // Retry once after 1s delay on rate limit
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 1000));
          const retry = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'LinkedIn-Version': LINKEDIN_API_VERSION,
              'X-RestLi-Method': 'BATCH_GET',
            },
          });
          if (retry.ok) {
            const retryData = await retry.json();
            for (const [urn, imageData] of Object.entries(retryData.results || {})) {
              const img = imageData as Record<string, unknown>;
              if (img.downloadUrl && img.status === 'AVAILABLE') {
                result.set(urn, img.downloadUrl as string);
              }
            }
          }
        }
        continue;
      }

      const data = await response.json();
      const results = data.results || {};

      for (const [urn, imageData] of Object.entries(results)) {
        const img = imageData as Record<string, unknown>;
        if (img.downloadUrl && img.status === 'AVAILABLE') {
          result.set(urn, img.downloadUrl as string);
        }
      }
    } catch (error) {
      console.error('[LinkedIn Images] Batch fetch error:', error);
    }
  }

  console.log('[LinkedIn Images] Got download URLs:', { requested: imageUrns.length, found: result.size });
  return result;
}

// Post returned from the Posts API author finder
export interface LinkedInAuthorPost {
  id: string;
  author: string;
  commentary: string;
  publishedAt: number;
  createdAt: number;
  lastModifiedAt: number;
  lifecycleState: string;
  visibility: string;
  mediaId?: string;
  mediaType?: 'image' | 'video' | 'document' | 'article' | 'multiImage';
  content: Record<string, unknown> | null;
}

// ============================================
// ENGAGEMENT FUNCTIONS (Community Management API)
// ============================================

/**
 * Like a LinkedIn post
 * Reactions API: POST /rest/reactions?actor={encoded personUrn}
 * Body: { "root": "urn:li:activity:XXX", "reactionType": "LIKE" }
 * Requires: w_member_social_feed scope (Community Management API)
 * Fallback: socialActions endpoint with w_member_social scope
 * Source: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/reactions-api
 */
export async function likeLinkedInPost(
  accessTokens: string | string[],
  postUrn: string,
  actorId: string,
  actorType: 'person' | 'organization' = 'person',
  reactionType: string = 'LIKE'
): Promise<{ success: boolean }> {
  const actorUrn = actorType === 'organization'
    ? `urn:li:organization:${actorId}`
    : `urn:li:person:${actorId}`;
  const encodedActor = encodeURIComponent(actorUrn);
  const encodedUrn = encodeURIComponent(postUrn);
  const tokens = Array.isArray(accessTokens) ? accessTokens : [accessTokens];

  let lastError = '';
  let lastStatus = 0;

  for (const token of tokens) {
    // 1. Reactions API (w_member_social_feed)
    let response = await fetch(`${LINKEDIN_REST_API_BASE}/reactions?actor=${encodedActor}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
      body: JSON.stringify({ root: postUrn, reactionType }),
    });

    if (response.ok || response.status === 201 || response.status === 409) {
      return { success: true };
    }
    lastStatus = response.status;
    lastError = await response.text();

    // 2. socialActions/likes fallback (w_member_social)
    response = await fetch(`${LINKEDIN_REST_API_BASE}/socialActions/${encodedUrn}/likes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
      body: JSON.stringify({ actor: actorUrn, object: postUrn }),
    });

    if (response.ok || response.status === 201 || response.status === 409) {
      return { success: true };
    }
    lastStatus = response.status;
    lastError = await response.text();
  }

  throw new Error(`Failed to like post (${lastStatus}): ${lastError}`);
}

/**
 * Unlike a LinkedIn post
 */
export async function unlikeLinkedInPost(
  accessToken: string,
  postUrn: string,
  actorId: string,
  actorType: 'person' | 'organization' = 'person'
): Promise<{ success: boolean }> {
  const actorUrn = actorType === 'organization'
    ? `urn:li:organization:${actorId}`
    : `urn:li:person:${actorId}`;

  // DELETE /rest/reactions/(actor:{actorUrn},entity:{postUrn})?actor={actorUrn}
  const encodedActor = encodeURIComponent(actorUrn);
  const encodedPost = encodeURIComponent(postUrn);

  const response = await fetch(
    `${LINKEDIN_REST_API_BASE}/reactions/(actor:${encodedActor},entity:${encodedPost})?actor=${encodedActor}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
    }
  );

  if (response.ok) return { success: true };
  const error = await response.text();
  throw new Error(`Failed to unlike post (${response.status}): ${error}`);
}

/**
 * Reshare a LinkedIn post on a person's profile
 * Creates a new UGC post with resharedContent pointing to the original
 */
export async function reshareLinkedInPost(
  accessToken: string,
  actorId: string,
  postUrn: string,
  commentary: string = ''
): Promise<{ id: string }> {
  const authorUrn = `urn:li:person:${actorId}`;

  const postData = {
    author: authorUrn,
    commentary: commentary,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    reshareContext: {
      parent: postUrn,
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  console.log('[LinkedIn Reshare] Request:', { actor: authorUrn, originalPost: postUrn });

  const response = await fetch(`${LINKEDIN_REST_API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[LinkedIn Reshare] Error:', { status: response.status, error });
    throw new Error(`Failed to reshare LinkedIn post (${response.status}): ${error}`);
  }

  const result = await getPostIdFromRestResponse(response);
  console.log('[LinkedIn Reshare] Success:', { id: result.id });
  return result;
}

/**
 * Get LinkedIn feed posts for the authenticated member
 * Requires r_member_social scope (Community Management API)
 */
/**
 * Fetch LinkedIn feed with enriched data (author profiles, media, social counts)
 * Returns fully resolved posts ready for display
 */
export async function getLinkedInFeed(
  accessToken: string,
  count: number = 20,
  start: number = 0
): Promise<{ posts: LinkedInFeedPost[]; total: number }> {
  const url = `${LINKEDIN_REST_API_BASE}/posts?q=feed&count=${count}&start=${start}`;

  console.log('[LinkedIn Feed] Fetching:', { count, start });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-RestLi-Method': 'FINDER',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[LinkedIn Feed] Error:', { status: response.status, error });
    throw new Error(`Failed to fetch LinkedIn feed (${response.status}): ${error}`);
  }

  const data = await response.json();
  const elements = data.elements || [];

  // Parse raw posts and collect URNs to resolve
  const authorUrns = new Set<string>();
  const imageUrns: string[] = [];
  const postUrns: string[] = [];

  interface RawPost {
    urn: string;
    authorUrn: string;
    commentary: string;
    publishedAt: number;
    mediaId?: string;
    mediaType?: 'image' | 'video' | 'document' | 'multiImage' | 'article';
    multiImageIds?: string[];
    articleThumbnail?: string;
    articleUrl?: string;
    articleTitle?: string;
  }

  const rawPosts: RawPost[] = elements.map((el: Record<string, unknown>) => {
    const authorUrn = (el.author as string) || '';
    authorUrns.add(authorUrn);
    postUrns.push((el.id as string) || '');

    const content = el.content as Record<string, unknown> | undefined;
    let mediaId: string | undefined;
    let mediaType: RawPost['mediaType'];
    let multiImageIds: string[] | undefined;
    let articleThumbnail: string | undefined;
    let articleUrl: string | undefined;
    let articleTitle: string | undefined;

    if (content?.media) {
      const media = content.media as Record<string, unknown>;
      mediaId = media.id as string;
      if (mediaId?.includes('urn:li:image:')) {
        mediaType = 'image';
        imageUrns.push(mediaId);
      } else if (mediaId?.includes('urn:li:video:')) {
        mediaType = 'video';
      } else if (mediaId?.includes('urn:li:document:')) {
        mediaType = 'document';
      }
    } else if (content?.multiImage) {
      mediaType = 'multiImage';
      const mi = content.multiImage as Record<string, unknown>;
      const images = mi.images as Array<Record<string, unknown>> | undefined;
      if (images) {
        multiImageIds = images.map(img => img.id as string).filter(Boolean);
        multiImageIds.forEach(id => { if (id.includes('urn:li:image:')) imageUrns.push(id); });
      }
    } else if (content?.article) {
      mediaType = 'article';
      const article = content.article as Record<string, unknown>;
      articleThumbnail = article.thumbnail as string;
      articleUrl = article.source as string;
      articleTitle = article.title as string;
      if (articleThumbnail?.includes('urn:li:image:')) imageUrns.push(articleThumbnail);
    }

    return {
      urn: (el.id as string) || '',
      authorUrn,
      commentary: (el.commentary as string) || '',
      publishedAt: (el.publishedAt as number) || 0,
      mediaId,
      mediaType,
      multiImageIds,
      articleThumbnail,
      articleUrl,
      articleTitle,
    };
  });

  // Resolve in parallel: author profiles, image URLs, social counts
  // Each resolver handles its own errors so one failure doesn't break everything
  const [authorProfiles, imageDownloadUrls, socialCounts] = await Promise.all([
    resolveAuthorProfiles(accessToken, Array.from(authorUrns)).catch((err) => {
      console.error('[LinkedIn Feed] Failed to resolve author profiles:', err);
      return new Map<string, { name: string; headline: string; profilePicture: string }>();
    }),
    imageUrns.length > 0
      ? getImageDownloadUrls(accessToken, imageUrns).catch((err) => {
          console.error('[LinkedIn Feed] Failed to get image URLs:', err);
          return new Map<string, string>();
        })
      : Promise.resolve(new Map<string, string>()),
    resolveSocialCounts(accessToken, postUrns).catch((err) => {
      console.error('[LinkedIn Feed] Failed to resolve social counts:', err);
      return new Map<string, { likes: number; comments: number; shares: number }>();
    }),
  ]);

  // Build enriched feed posts
  const posts: LinkedInFeedPost[] = rawPosts.map((raw) => {
    const author = authorProfiles.get(raw.authorUrn);
    const social = socialCounts.get(raw.urn);

    // Resolve media URLs
    let imageUrl: string | undefined;
    let multiImageUrls: string[] | undefined;

    if (raw.mediaType === 'image' && raw.mediaId) {
      imageUrl = imageDownloadUrls.get(raw.mediaId);
    } else if (raw.mediaType === 'multiImage' && raw.multiImageIds) {
      multiImageUrls = raw.multiImageIds
        .map(id => imageDownloadUrls.get(id))
        .filter((url): url is string => !!url);
      if (multiImageUrls.length > 0) imageUrl = multiImageUrls[0];
    } else if (raw.mediaType === 'article' && raw.articleThumbnail) {
      imageUrl = imageDownloadUrls.get(raw.articleThumbnail);
    }

    return {
      urn: raw.urn,
      authorUrn: raw.authorUrn,
      authorName: author?.name || 'LinkedIn User',
      authorHeadline: author?.headline || '',
      authorProfilePicture: author?.profilePicture || '',
      commentary: raw.commentary,
      publishedAt: raw.publishedAt,
      mediaType: raw.mediaType,
      imageUrl,
      multiImageUrls,
      articleUrl: raw.articleUrl,
      articleTitle: raw.articleTitle,
      likes: social?.likes || 0,
      comments: social?.comments || 0,
      shares: social?.shares || 0,
    };
  });

  console.log('[LinkedIn Feed] Enriched:', { posts: posts.length, authors: authorProfiles.size, images: imageDownloadUrls.size });
  return { posts, total: data.paging?.total || posts.length };
}

/**
 * Resolve author profiles from URNs (person or organization)
 */
async function resolveAuthorProfiles(
  accessToken: string,
  urns: string[]
): Promise<Map<string, { name: string; headline: string; profilePicture: string }>> {
  const profiles = new Map<string, { name: string; headline: string; profilePicture: string }>();

  for (const urn of urns) {
    try {
      if (urn.includes('urn:li:person:')) {
        // Fetch person profile via REST API
        const personId = urn.replace('urn:li:person:', '');
        const url = `${LINKEDIN_REST_API_BASE}/people/(id:${personId})?projection=(localizedFirstName,localizedLastName,localizedHeadline,profilePicture(displayImage~:playableStreams))`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': LINKEDIN_API_VERSION,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const firstName = data.localizedFirstName || '';
          const lastName = data.localizedLastName || '';
          const headline = data.localizedHeadline || '';

          // Extract profile picture URL from playableStreams
          let profilePicture = '';
          const displayImage = data.profilePicture?.['displayImage~']?.elements;
          if (displayImage && displayImage.length > 0) {
            // Get the largest available image
            const largest = displayImage[displayImage.length - 1];
            profilePicture = largest?.identifiers?.[0]?.identifier || '';
          }

          profiles.set(urn, {
            name: `${firstName} ${lastName}`.trim() || 'LinkedIn User',
            headline,
            profilePicture,
          });
        }
      } else if (urn.includes('urn:li:organization:')) {
        const orgId = urn.replace('urn:li:organization:', '');
        const url = `${LINKEDIN_API_BASE}/organizations/${orgId}?projection=(localizedName,localizedDescription,logoV2(original~:playableStreams))`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        if (response.ok) {
          const data = await response.json();
          let logoUrl = '';
          if (data.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier) {
            logoUrl = data.logoV2['original~'].elements[0].identifiers[0].identifier;
          }

          profiles.set(urn, {
            name: data.localizedName || 'Organization',
            headline: data.localizedDescription || '',
            profilePicture: logoUrl,
          });
        }
      }
    } catch (error) {
      console.error(`[LinkedIn Feed] Failed to resolve profile ${urn}:`, error);
    }
  }

  return profiles;
}

/**
 * Batch resolve social counts for multiple posts
 */
async function resolveSocialCounts(
  accessToken: string,
  postUrns: string[]
): Promise<Map<string, { likes: number; comments: number; shares: number }>> {
  const counts = new Map<string, { likes: number; comments: number; shares: number }>();

  // Fetch social actions per post (LinkedIn doesn't have a batch endpoint for this)
  await Promise.all(
    postUrns.map(async (urn) => {
      try {
        const encodedUrn = encodeURIComponent(urn);
        const url = `${LINKEDIN_REST_API_BASE}/socialActions/${encodedUrn}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': LINKEDIN_API_VERSION,
          },
        });

        if (response.ok) {
          const data = await response.json();
          counts.set(urn, {
            likes: data.likesSummary?.totalLikes || 0,
            comments: data.commentsSummary?.totalFirstLevelComments || 0,
            shares: data.sharesSummary?.totalShares || 0,
          });
        }
      } catch {
        // Silently skip failed social count fetches
      }
    })
  );

  return counts;
}

/**
 * Get social actions (likes, comments count) for a single post
 */
export async function getLinkedInPostSocialActions(
  accessToken: string,
  postUrn: string
): Promise<{ likes: number; comments: number; shares: number }> {
  const encodedPostUrn = encodeURIComponent(postUrn);
  const url = `${LINKEDIN_REST_API_BASE}/socialActions/${encodedPostUrn}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
  });

  if (!response.ok) {
    return { likes: 0, comments: 0, shares: 0 };
  }

  const data = await response.json();
  return {
    likes: data.likesSummary?.totalLikes || 0,
    comments: data.commentsSummary?.totalFirstLevelComments || 0,
    shares: data.sharesSummary?.totalShares || 0,
  };
}

// Enriched feed post with resolved author profile, media URLs, and social counts
export interface LinkedInFeedPost {
  urn: string;
  authorUrn: string;
  authorName: string;
  authorHeadline: string;
  authorProfilePicture: string;
  commentary: string;
  publishedAt: number;
  mediaType?: 'image' | 'video' | 'document' | 'multiImage' | 'article';
  imageUrl?: string;
  multiImageUrls?: string[];
  articleUrl?: string;
  articleTitle?: string;
  likes: number;
  comments: number;
  shares: number;
}

/**
 * Alternate method to get organizations using organizationalEntityAcls
 */
async function getOrganizationsAlternate(accessToken: string): Promise<LinkedInOrganization[]> {
  try {
    const response = await fetch(
      `${LINKEDIN_API_BASE}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const organizations: LinkedInOrganization[] = [];
    const orgIds: string[] = [];

    // Extract organization IDs
    if (data.elements && Array.isArray(data.elements)) {
      for (const element of data.elements) {
        const orgUrn = element.organizationalTarget;
        if (orgUrn && orgUrn.includes('urn:li:organization:')) {
          const orgId = orgUrn.replace('urn:li:organization:', '');
          orgIds.push(orgId);
        }
      }
    }

    // Fetch organization details for each ID
    for (const orgId of orgIds) {
      try {
        const orgResponse = await fetch(
          `${LINKEDIN_API_BASE}/organizations/${orgId}?projection=(localizedName,logoV2(original~:playableStreams))`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );

        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          let logoUrl: string | undefined;
          if (orgData.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier) {
            logoUrl = orgData.logoV2['original~'].elements[0].identifiers[0].identifier;
          }

          organizations.push({
            id: orgId,
            name: orgData.localizedName || 'Unknown Organization',
            logoUrl,
          });
        }
      } catch {
        // Skip organizations we can't fetch details for
      }
    }

    return organizations;
  } catch (error) {
    console.error('Failed to fetch organizations (alternate):', error);
    return [];
  }
}
