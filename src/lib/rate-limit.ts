// Simple in-memory rate limiter for auth endpoints
// For production with multiple instances, use Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  maxRequests: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry or expired, create new one
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Rate limit configurations for different endpoints
export const AUTH_RATE_LIMITS = {
  // Login: 5 attempts per 15 minutes per IP
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  // Register: 3 attempts per hour per IP
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  // Forgot password: 3 attempts per hour per IP (to prevent spam)
  forgotPassword: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  // Reset password: 5 attempts per 15 minutes per IP
  resetPassword: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
};

// Helper to get client IP from request headers
export function getClientIP(request: Request): string {
  // Check common headers for real IP (behind proxy/CDN)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Vercel specific
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  // Fallback - this won't work in production but is fine for local dev
  return "127.0.0.1";
}
