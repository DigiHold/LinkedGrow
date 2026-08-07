import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { db, apiKeys, apiLogs } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { canAccessFeature, effectivePlan, PlanId } from "@/lib/plans";
import { loadSessionUser } from "@/lib/auth-user";

// Rate limiting configuration
const RATE_LIMITS = {
  requests_per_minute: 60,
  requests_per_hour: 1000,
  requests_per_day: 10000,
};

// In-memory rate limit store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// API scopes
export type ApiScope =
  | "posts:read"
  | "posts:write"
  | "posts:delete"
  | "ideas:read"
  | "ideas:write"
  | "analytics:read"
  | "profile:read";

export const ALL_SCOPES: ApiScope[] = [
  "posts:read",
  "posts:write",
  "posts:delete",
  "ideas:read",
  "ideas:write",
  "analytics:read",
  "profile:read",
];

// Hash API key using SHA-256
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Generate a new API key
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  // Format: lg_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 random chars)
  const randomPart = nanoid(32);
  const key = `lg_live_${randomPart}`;
  const prefix = key.substring(0, 12); // lg_live_xxxx
  const hash = hashApiKey(key);

  return { key, prefix, hash };
}

// Verify API key with timing-safe comparison
export function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const providedHash = hashApiKey(providedKey);
  const providedBuffer = Buffer.from(providedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (providedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, storedBuffer);
}

// Check rate limit
function checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const limit = RATE_LIMITS.requests_per_minute;

  const current = rateLimitStore.get(keyId);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(keyId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: current.resetAt - now };
  }

  current.count++;
  return { allowed: true, remaining: limit - current.count, resetIn: current.resetAt - now };
}

// Log API request
async function logApiRequest(
  apiKeyId: string | null,
  userId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number
) {
  try {
    await db.insert(apiLogs).values({
      id: nanoid(),
      apiKeyId,
      userId,
      endpoint,
      method,
      statusCode,
      responseTime,
      createdAt: new Date(),
    });
  } catch (error) {
}
}

// API authentication result
export interface ApiAuthResult {
  success: boolean;
  userId?: string;
  apiKeyId?: string;
  scopes?: ApiScope[];
  error?: string;
  statusCode?: number;
}

// Authenticate API request
export async function authenticateApiRequest(
  request: NextRequest
): Promise<ApiAuthResult> {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;

  // Extract API key from Authorization header
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return {
      success: false,
      error: "Missing Authorization header. Use: Authorization: Bearer <api_key>",
      statusCode: 401,
    };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Invalid Authorization format. Use: Authorization: Bearer <api_key>",
      statusCode: 401,
    };
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer " prefix

  // Validate key format
  if (!apiKey.startsWith("lg_live_") || apiKey.length !== 40) {
    return {
      success: false,
      error: "Invalid API key format",
      statusCode: 401,
    };
  }

  // Find the API key in database
  const keyHash = hashApiKey(apiKey);

  const keyRecord = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });

  if (!keyRecord) {
    await logApiRequest(null, null, endpoint, method, 401, Date.now() - startTime);
    return {
      success: false,
      error: "Invalid API key",
      statusCode: 401,
    };
  }

  // Check if key is expired
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    await logApiRequest(keyRecord.id, keyRecord.userId, endpoint, method, 401, Date.now() - startTime);
    return {
      success: false,
      error: "API key has expired",
      statusCode: 401,
    };
  }

  // Check rate limit
  const rateLimit = checkRateLimit(keyRecord.id);
  if (!rateLimit.allowed) {
    await logApiRequest(keyRecord.id, keyRecord.userId, endpoint, method, 429, Date.now() - startTime);
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds`,
      statusCode: 429,
    };
  }

  /* The plan, on the workspace that pays for it.
     The paywall closes the dashboard and the worker refuses to run an agent
     for an unpaid workspace. This is the third door, and it was standing open:
     a key outlives the subscription it was made under, so a cancelled account
     that kept one went on reading its leads and scheduling posts through an
     assistant. A team member's key answers to the owner's plan, and a lifetime
     holder keeps their access with no plan at all, which is the same rule the
     worker applies in loadRunnableAgents. */
  const account = await loadSessionUser(keyRecord.userId);

  if (!account) {
    await logApiRequest(keyRecord.id, keyRecord.userId, endpoint, method, 403, Date.now() - startTime);
    return {
      success: false,
      error: "User not found",
      statusCode: 403,
    };
  }

  const plan = effectivePlan({
    plan: account.owner?.plan ?? account.user.plan,
    isAdmin: account.user.isAdmin,
  });

  if (plan === "free" && !account.user.isLifetimeDeal) {
    await logApiRequest(keyRecord.id, keyRecord.userId, endpoint, method, 403, Date.now() - startTime);
    return {
      success: false,
      error: "This workspace has no active plan. The API and the MCP server need Pro or Business.",
      statusCode: 403,
    };
  }


  // Update last used timestamp
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id));

  // Parse scopes
  const scopes: ApiScope[] = keyRecord.scopes
    ? JSON.parse(keyRecord.scopes)
    : ALL_SCOPES;

  return {
    success: true,
    userId: keyRecord.userId,
    apiKeyId: keyRecord.id,
    scopes,
  };
}

// Check if request has required scope
export function hasScope(scopes: ApiScope[], required: ApiScope): boolean {
  return scopes.includes(required);
}

// Create error response with proper headers
export function apiErrorResponse(
  error: string,
  statusCode: number,
  rateLimit?: { remaining: number; resetIn: number }
): NextResponse {
  const response = NextResponse.json(
    { error, success: false },
    { status: statusCode }
  );

  if (rateLimit) {
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(rateLimit.resetIn / 1000).toString());
  }

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

// Create success response with proper headers
export function apiSuccessResponse<T>(data: T, statusCode: number = 200): NextResponse {
  const response = NextResponse.json(
    { data, success: true },
    { status: statusCode }
  );

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}
