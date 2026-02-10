// Automatic search engine notification when new content is published
// IndexNow: Bing, Yandex, Naver, Seznam (free, instant)
// Google Indexing API: Google (free, 200 URLs/day)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";
const GOOGLE_INDEXING_CREDENTIALS = process.env.GOOGLE_INDEXING_CREDENTIALS || "";

// IndexNow endpoints (Bing, Yandex, and the shared IndexNow hub)
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

interface IndexingResult {
  indexnow: { success: boolean; endpoints: number; errors: string[] };
  google: { success: boolean; error?: string };
}

/**
 * Notify all search engines about new/updated URLs.
 * Call this whenever content is published (blog posts, CMS pages, etc.)
 */
export async function notifySearchEngines(
  urls: string[]
): Promise<IndexingResult> {
  const validUrls = urls.filter((url) => url.startsWith(BASE_URL));
  if (validUrls.length === 0) {
    return {
      indexnow: { success: false, endpoints: 0, errors: ["No valid URLs"] },
      google: { success: false, error: "No valid URLs" },
    };
  }

  // Run IndexNow + Google Indexing API in parallel
  // Note: Sitemap pings were deprecated by Google (June 2023) and Bing (uses IndexNow)
  const [indexnow, google] = await Promise.all([
    submitIndexNow(validUrls),
    submitGoogleIndexingApi(validUrls),
  ]);

  return { indexnow, google };
}

/**
 * Submit URLs via IndexNow protocol (Bing, Yandex, Naver, Seznam)
 * Free, instant, no rate limit concerns for our volume
 */
async function submitIndexNow(
  urls: string[]
): Promise<IndexingResult["indexnow"]> {
  if (!INDEXNOW_KEY) {
    return { success: false, endpoints: 0, errors: ["INDEXNOW_KEY not set"] };
  }

  const payload = {
    host: new URL(BASE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  const errors: string[] = [];
  let successful = 0;

  const results = await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`${endpoint}: ${res.status}`);
      }
      return res;
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      successful++;
    } else {
      errors.push(result.reason?.message || "Unknown error");
    }
  }

  console.log(
    `[IndexNow] Submitted ${urls.length} URLs to ${successful}/${INDEXNOW_ENDPOINTS.length} endpoints`
  );
  return { success: successful > 0, endpoints: successful, errors };
}

/**
 * Submit URLs via Google Indexing API
 * Free, 200 URLs/day quota - more than enough for blog publishing
 * Requires a Google Cloud service account with Search Console owner access
 */
async function submitGoogleIndexingApi(
  urls: string[]
): Promise<IndexingResult["google"]> {
  if (!GOOGLE_INDEXING_CREDENTIALS) {
    return { success: false, error: "GOOGLE_INDEXING_CREDENTIALS not set" };
  }

  try {
    const credentials = JSON.parse(GOOGLE_INDEXING_CREDENTIALS);
    const accessToken = await getGoogleAccessToken(credentials);

    // Submit each URL (Google Indexing API does not support batch in a single call)
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const res = await fetch(
          "https://indexing.googleapis.com/v3/urlNotifications:publish",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              type: "URL_UPDATED",
            }),
          }
        );
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Google Indexing API ${res.status}: ${body}`);
        }
        return res;
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      const firstError =
        failed[0].status === "rejected" ? failed[0].reason?.message : "";
      console.error(`[Google Indexing] ${failed.length} URLs failed:`, firstError);
      return {
        success: results.length > failed.length,
        error: `${failed.length}/${results.length} failed: ${firstError}`,
      };
    }

    console.log(
      `[Google Indexing] Submitted ${urls.length} URLs successfully`
    );
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Google Indexing] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Get a Google OAuth2 access token using service account credentials (JWT)
 * This implements the JWT -> access token flow without needing googleapis SDK
 */
async function getGoogleAccessToken(credentials: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const jwt = await signJwt(header, payload, credentials.private_key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google OAuth token error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Sign a JWT using RS256 (RSA-SHA256) with Node.js crypto
 * No external dependencies needed
 */
async function signJwt(
  header: Record<string, string>,
  payload: Record<string, unknown>,
  privateKey: string
): Promise<string> {
  const { createSign } = await import("crypto");

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();

  const signature = sign.sign(privateKey, "base64url");
  return `${signingInput}.${signature}`;
}

function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

