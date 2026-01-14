import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, AUTH_RATE_LIMITS, getClientIP } from "@/lib/rate-limit";

// Wrap POST handler with rate limiting for login attempts
async function POST(request: NextRequest) {
  // Only rate limit sign-in attempts (callback/credentials)
  const url = new URL(request.url);
  const isSignIn =
    url.pathname.includes("callback") || url.searchParams.get("callbackUrl");

  if (isSignIn) {
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(
      `login:${clientIP}`,
      AUTH_RATE_LIMITS.login
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }
  }

  // Call original NextAuth handler
  return handlers.POST(request);
}

export const { GET } = handlers;
export { POST };
