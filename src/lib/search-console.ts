// Google Search Console API - search performance data (impressions, clicks, CTR, position)
// Uses the same service account as Google Indexing API, just a different OAuth scope
// Zero external dependencies - JWT signing with Node.js crypto

const GOOGLE_INDEXING_CREDENTIALS =
  process.env.GOOGLE_INDEXING_CREDENTIALS || "";
const SITE_URL = "sc-domain:linkedgrow.ai";

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

interface DimensionFilter {
  dimension: "page" | "query" | "country" | "device" | "date";
  operator:
    | "equals"
    | "notEquals"
    | "contains"
    | "notContains"
    | "includingRegex"
    | "excludingRegex";
  expression: string;
}

interface SearchAnalyticsRequest {
  startDate: string;
  endDate: string;
  dimensions?: (
    | "page"
    | "query"
    | "date"
    | "country"
    | "device"
    | "searchAppearance"
  )[];
  type?: "web" | "discover" | "googleNews";
  aggregationType?: "auto" | "byPage" | "byProperty";
  dimensionFilterGroups?: {
    groupType?: "and";
    filters: DimensionFilter[];
  }[];
  rowLimit?: number;
  startRow?: number;
  dataState?: "all" | "final";
}

/**
 * Get OAuth2 access token for Search Console API (read-only scope)
 */
async function getSearchConsoleAccessToken(): Promise<string> {
  if (!GOOGLE_INDEXING_CREDENTIALS) {
    throw new Error("GOOGLE_INDEXING_CREDENTIALS not set");
  }

  const credentials = JSON.parse(GOOGLE_INDEXING_CREDENTIALS);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
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
 * Query Google Search Console search analytics data
 */
async function querySearchAnalytics(
  request: SearchAnalyticsRequest
): Promise<SearchAnalyticsResponse> {
  const accessToken = await getSearchConsoleAccessToken();
  const encodedSiteUrl = encodeURIComponent(SITE_URL);

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Search Console API ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Get site-wide totals (clicks, impressions, CTR, position) for a date range
 */
export async function getSiteOverview(startDate: string, endDate: string) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dataState: "all",
  });
}

/**
 * Get daily performance trend for the whole site
 */
export async function getDailyTrend(startDate: string, endDate: string) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["date"],
    dataState: "all",
  });
}

/**
 * Get per-page performance data
 */
export async function getPagePerformance(startDate: string, endDate: string) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["page"],
    rowLimit: 25000,
    aggregationType: "byPage",
    dataState: "all",
  });
}

/**
 * Get top search queries driving traffic
 */
export async function getTopQueries(startDate: string, endDate: string) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit: 100,
    dataState: "all",
  });
}

/**
 * Get top queries for a specific page
 */
export async function getPageTopQueries(
  pageUrl: string,
  startDate: string,
  endDate: string
) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["query"],
    dimensionFilterGroups: [
      {
        filters: [
          {
            dimension: "page",
            operator: "equals",
            expression: pageUrl,
          },
        ],
      },
    ],
    rowLimit: 50,
    aggregationType: "byPage",
    dataState: "all",
  });
}

// JWT signing - same pattern as search-indexing.ts

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
