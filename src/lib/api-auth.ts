import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { db, apiKeys, apiLogs, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { canAccessFeature, PlanId } from "@/lib/plans";

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
    console.error("Failed to log API request:", error);
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

  // Verify user has Business plan (API access is Business-only)
  const user = await db.query.users.findFirst({
    where: eq(users.id, keyRecord.userId),
  });

  if (!user) {
    await logApiRequest(keyRecord.id, keyRecord.userId, endpoint, method, 403, Date.now() - startTime);
    return {
      success: false,
      error: "User not found",
      statusCode: 403,
    };
  }

  if (!canAccessFeature(user.plan as PlanId, "apiAccess")) {
    await logApiRequest(keyRecord.id, keyRecord.userId, endpoint, method, 403, Date.now() - startTime);
    return {
      success: false,
      error: "API access requires Business plan",
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
