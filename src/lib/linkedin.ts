/**
 * LinkedIn OAuth and API Integration
 *
 * Uses two LinkedIn apps:
 * - Poster App: For publishing posts to LinkedIn
 * - Community App: For engagement features
 */

// LinkedIn OAuth scopes
const POSTER_SCOPES = ['openid', 'profile', 'email', 'w_member_social'];
const COMMUNITY_SCOPES = ['openid', 'profile', 'email', 'r_organization_social'];

// LinkedIn API endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
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
        title?: { text: string };
        description?: { text: string };
      }>;
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS';
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
 * Get LinkedIn user profile
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn profile');
  }

  const data = await response.json();

  return {
    id: data.sub,
    localizedFirstName: data.given_name || '',
    localizedLastName: data.family_name || '',
    profilePicture: data.picture ? { displayImage: data.picture } : undefined,
  };
}

/**
 * Create a LinkedIn post
 */
export async function createLinkedInPost(
  accessToken: string,
  personUrn: string,
  text: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'
): Promise<{ id: string }> {
  const postData: LinkedInPostRequest = {
    author: `urn:li:person:${personUrn}`,
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
 * Create a LinkedIn post with an image
 */
export async function createLinkedInPostWithImage(
  accessToken: string,
  personUrn: string,
  text: string,
  imageUrl: string,
  imageTitle?: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'
): Promise<{ id: string }> {
  const postData: LinkedInPostRequest = {
    author: `urn:li:person:${personUrn}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: imageUrl,
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
