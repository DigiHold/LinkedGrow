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
  // Allocating a dedicated address can place a paid order with the proxy
  // supplier, so this is money rather than compute. Ten an hour is far above
  // any real customer, who allocates once per LinkedIn account, and far below
  // what a loop could spend.
  proxyPurchase: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
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
  // 2FA verify/disable: 5 attempts per 15 minutes per user
  twoFactor: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  // 2FA setup: 3 attempts per 15 minutes per user
  twoFactorSetup: {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000,
  },
  // Blog comments: 5 per 15 minutes per IP
  blogComment: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  // AI generation: 30 per minute per user
  aiGeneration: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  // Docs feedback: 10 per 15 minutes per IP
  docsFeedback: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  },
  // Google fonts proxy: 10 per minute per IP
  fontsProxy: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
};

// Helper to check AI generation rate limit for authenticated user
export function checkAIRateLimit(userId: string): RateLimitResult {
  return rateLimit(`ai-gen:${userId}`, AUTH_RATE_LIMITS.aiGeneration);
}

// Helper to get client IP from request headers
export function getClientIP(request: Request): string {
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "127.0.0.1";
}
