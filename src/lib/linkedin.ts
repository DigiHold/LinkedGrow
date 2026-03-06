/**
 * LinkedIn OAuth and API Integration
 *
 * Uses two LinkedIn apps:
 * - Poster App: For publishing posts to LinkedIn
 * - Community App: For engagement features
 */

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
const COMMUNITY_SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social',            // Post/interact as member (Development Tier)
  // After Community Management API approval, uncomment these:
  // 'r_member_social',         // Read member profile including HEADLINE
  // 'r_organization_social',   // Read org content (comments, reactions)
  // 'w_organization_social',   // Post/comment as organization
];

// LinkedIn API endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_API_BASE = 'https://api.linkedin.com/rest';

// LinkedIn API version for REST API (YYYYMM format)
const LINKEDIN_API_VERSION = '202506';

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
  profilePicture?: {
    displayImage: string;
  };
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  logoUrl?: string;
}

interface LinkedInPostRequest {
  author: string;
  lifecycleState: 'PUBLISHED' | 'DRAFT';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: 'NONE' | 'ARTICLE' | 'IMAGE';
      media?: Array<{
        status: 'READY';
        originalUrl?: string;
        media?: string; // Asset URN for native image uploads
        title?: { text: string };
        description?: { text: string };
      }>;
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS';
  };
}

interface LinkedInRegisterUploadResponse {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string;
        headers: Record<string, string>;
      };
    };
    asset: string;
    mediaArtifact: string;
  };
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
 * Check if LinkedIn OAuth is configured
 */
export function isLinkedInConfigured(): boolean {
  return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
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

  const postData: LinkedInPostRequest = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Post a comment on a LinkedIn post
 * Uses the REST API socialActions endpoint
 * Requires w_member_social scope (already available via Poster App)
 */
export async function createLinkedInComment(
  accessToken: string,
  postUrn: string,
  authorId: string,
  commentText: string,
  authorType: 'person' | 'organization' = 'person'
): Promise<{ id: string }> {
  const actorUrn = authorType === 'organization'
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  const encodedPostUrn = encodeURIComponent(postUrn);

  const response = await fetch(
    `${LINKEDIN_REST_API_BASE}/socialActions/${encodedPostUrn}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
      body: JSON.stringify({
        actor: actorUrn,
        object: postUrn,
        message: {
          text: commentText,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn comment: ${error}`);
  }

  const data = await response.json();
  return { id: data.id || data['$URN'] || 'comment-created' };
}

/**
 * Register an image upload with LinkedIn
 * Returns the upload URL and asset URN
 */
async function registerImageUpload(
  accessToken: string,
  ownerUrn: string
): Promise<{ uploadUrl: string; asset: string }> {
  const registerRequest = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: ownerUrn,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(registerRequest),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register image upload: ${error}`);
  }

  const data: LinkedInRegisterUploadResponse = await response.json();
  const uploadUrl = data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = data.value.asset;

  return { uploadUrl, asset };
}

/**
 * Upload binary image data to LinkedIn
 */
async function uploadImageToLinkedIn(
  uploadUrl: string,
  imageBlob: Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
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
  const { blob, contentType } = await fetchImageAsBlob(imageUrl);

  // Step 2: Register the upload with LinkedIn
  const { uploadUrl, asset } = await registerImageUpload(accessToken, authorUrn);

  // Step 3: Upload the actual image binary to LinkedIn
  await uploadImageToLinkedIn(uploadUrl, blob, contentType);

  // Step 4: Create the post with the uploaded image asset
  const postData: LinkedInPostRequest = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            media: asset,
            title: imageTitle ? { text: imageTitle } : undefined,
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post with image: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Register a video upload with LinkedIn
 * Returns the upload URL and asset URN
 */
async function registerVideoUpload(
  accessToken: string,
  ownerUrn: string,
  fileSizeBytes: number
): Promise<{ uploadUrl: string; asset: string }> {
  const registerRequest = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
      owner: ownerUrn,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
      supportedUploadMechanism: ['SINGLE_REQUEST_UPLOAD'],
      fileSize: fileSizeBytes,
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(registerRequest),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register video upload: ${error}`);
  }

  const data: LinkedInRegisterUploadResponse = await response.json();
  const uploadUrl = data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = data.value.asset;

  return { uploadUrl, asset };
}

/**
 * Upload video binary data to LinkedIn
 */
async function uploadVideoToLinkedIn(
  uploadUrl: string,
  videoBlob: Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
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
  const { blob: videoBlob, contentType } = await fetchVideoAsBlob(videoUrl);
  const actualMimeType = videoMimeType || contentType;

  // Step 2: Register the video upload with LinkedIn
  const { uploadUrl, asset } = await registerVideoUpload(
    accessToken,
    authorUrn,
    videoBlob.size
  );

  // Step 3: Upload the video binary to LinkedIn
  await uploadVideoToLinkedIn(uploadUrl, videoBlob, actualMimeType);

  // Step 4: Create the post with the uploaded video asset
  // Note: We don't wait for video processing - LinkedIn handles this automatically
  // and shows a "processing" indicator to viewers until ready
  const postData = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'VIDEO',
        media: [
          {
            status: 'READY',
            media: asset,
            title: videoTitle ? { text: videoTitle } : undefined,
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post with video: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Register a document upload with LinkedIn
 * Returns the upload URL and asset URN
 */
async function registerDocumentUpload(
  accessToken: string,
  ownerUrn: string
): Promise<{ uploadUrl: string; asset: string }> {
  const registerRequest = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-document'],
      owner: ownerUrn,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(registerRequest),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register document upload: ${error}`);
  }

  const data: LinkedInRegisterUploadResponse = await response.json();
  const uploadUrl = data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = data.value.asset;

  return { uploadUrl, asset };
}

/**
 * Upload document binary data to LinkedIn
 */
async function uploadDocumentToLinkedIn(
  uploadUrl: string,
  documentBlob: Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
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
  const { blob: documentBlob, contentType } = await fetchDocumentAsBlob(documentUrl);

  // Step 2: Register the document upload with LinkedIn
  const { uploadUrl, asset } = await registerDocumentUpload(accessToken, authorUrn);

  // Step 3: Upload the document binary to LinkedIn
  await uploadDocumentToLinkedIn(uploadUrl, documentBlob, contentType);

  // Step 4: Create the post with the uploaded document asset
  const postData: LinkedInPostRequest = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'NONE',
        media: [
          {
            status: 'READY',
            media: asset,
            title: documentTitle ? { text: documentTitle } : { text: 'Carousel' },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  // Document posts use RICH media category
  (postData.specificContent['com.linkedin.ugc.ShareContent'] as Record<string, unknown>).shareMediaCategory = 'RICH';

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post with document: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
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
    // First, get the organization access control to find orgs the user administers
    const aclResponse = await fetch(
      `${LINKEDIN_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName,logoV2(original~:playableStreams))))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!aclResponse.ok) {
      // If ACL endpoint fails, try the simpler organizations endpoint
      console.warn('organizationAcls failed, trying alternate method');
      return await getOrganizationsAlternate(accessToken);
    }

    const aclData = await aclResponse.json();
    const organizations: LinkedInOrganization[] = [];

    if (aclData.elements && Array.isArray(aclData.elements)) {
      for (const element of aclData.elements) {
        const orgUrn = element.organization;
        const orgDetails = element['organization~'];

        if (orgUrn && orgDetails) {
          // Extract org ID from URN (e.g., "urn:li:organization:12345" -> "12345")
          const orgId = orgUrn.replace('urn:li:organization:', '');

          // Extract logo URL if available
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

    return organizations;
  } catch (error) {
    console.error('Failed to fetch administered organizations:', error);
    return [];
  }
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
    let url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me`;

    // Add date range if provided
    if (dateRange) {
      const startYear = dateRange.start.getFullYear();
      const startMonth = dateRange.start.getMonth() + 1;
      const startDay = dateRange.start.getDate();
      const endYear = dateRange.end.getFullYear();
      const endMonth = dateRange.end.getMonth() + 1;
      const endDay = dateRange.end.getDate();

      url += `&dateRange=(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Failed to fetch member aggregated analytics:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Aggregate all post statistics
    let totalImpressions = 0;
    let totalMembersReached = 0;
    let totalReactions = 0;
    let totalComments = 0;
    let totalReshares = 0;
    let postCount = 0;

    if (data.elements && Array.isArray(data.elements)) {
      for (const element of data.elements) {
        totalImpressions += element.impressionCount || 0;
        totalMembersReached += element.uniqueImpressionsCount || element.membersReachedCount || 0;
        totalReactions += element.reactionCount || element.likeCount || 0;
        totalComments += element.commentCount || 0;
        totalReshares += element.shareCount || element.reshareCount || 0;
        postCount++;
      }
    }

    return {
      totalImpressions,
      totalMembersReached,
      totalReactions,
      totalComments,
      totalReshares,
      postCount,
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
export async function getMemberAllPostsAnalytics(
  accessToken: string,
  dateRange?: { start: Date; end: Date }
): Promise<MemberPostAnalytics[]> {
  try {
    let url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me`;

    if (dateRange) {
      const startYear = dateRange.start.getFullYear();
      const startMonth = dateRange.start.getMonth() + 1;
      const startDay = dateRange.start.getDate();
      const endYear = dateRange.end.getFullYear();
      const endMonth = dateRange.end.getMonth() + 1;
      const endDay = dateRange.end.getDate();

      url += `&dateRange=(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Failed to fetch member posts analytics:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const posts: MemberPostAnalytics[] = [];

    if (data.elements && Array.isArray(data.elements)) {
      for (const element of data.elements) {
        posts.push({
          postUrn: element.post || element.entity || '',
          impressions: element.impressionCount || 0,
          membersReached: element.uniqueImpressionsCount || element.membersReachedCount || 0,
          reactions: element.reactionCount || element.likeCount || 0,
          comments: element.commentCount || 0,
          reshares: element.shareCount || element.reshareCount || 0,
        });
      }
    }

    return posts;
  } catch (error) {
    console.error('Failed to fetch member posts analytics:', error);
    return [];
  }
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

    // Fetch share statistics for the organization
    const encodedShares = shareUrns.map(urn => encodeURIComponent(urn)).join(',');

    const response = await fetch(
      `${LINKEDIN_API_BASE}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&shares=List(${encodedShares})&timeIntervals.timeGranularityType=ALL&timeIntervals.timeRange.start=${startTimestamp}&timeIntervals.timeRange.end=${endTimestamp}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
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
      `${LINKEDIN_API_BASE}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
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

      return {
        followerCount: stats.followerCounts?.organicFollowerCount || 0 + stats.followerCounts?.paidFollowerCount || 0,
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
      `${LINKEDIN_API_BASE}/networkSizes/urn:li:organization:${organizationId}?edgeType=CompanyFollowedByMember`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
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
      `${LINKEDIN_API_BASE}/organizationPageStatistics?q=organization&organization=urn:li:organization:${organizationId}&timeIntervals.timeGranularityType=ALL&timeIntervals.timeRange.start=${start.getTime()}&timeIntervals.timeRange.end=${end.getTime()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
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
          `${LINKEDIN_API_BASE}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&breakdown=${facet}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
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
