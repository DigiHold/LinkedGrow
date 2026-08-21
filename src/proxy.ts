import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MAINTENANCE_MODE, MAINTENANCE_ALLOWED_ROUTES } from "@/lib/maintenance";
import { db } from "@/lib/db";
import { affiliates } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
];

// Routes that are only for non-authenticated users
const authRoutes = [
  "/sign-in",
  "/sign-up",
];

// Post-trial paywall allowlist: paths a trial-expired free user can still
// reach. Everything else under /dashboard redirects to /dashboard/upgrade.
const PAYWALL_ALLOWED_PREFIXES = [
  "/dashboard/upgrade",
  "/dashboard/settings",
  "/dashboard/affiliate",
];

// The API side of the same allowlist. A paywalled account must still be able
// to pay, read its own account, and sign out; anything that spends money or
// touches LinkedIn on its behalf is off.
const PAYWALL_ALLOWED_API_PREFIXES = [
  "/api/auth",
  "/api/stripe",
  "/api/user",
  "/api/affiliate",
  "/api/consent",
  "/api/support",
  "/api/chat",
];

// Wrapper: intercept signout BEFORE auth() touches the request
const authProxy = auth(async (req) => {
  const { nextUrl } = req;

  // Allow OPTIONS requests to pass through (CORS preflight)
  if (req.method === "OPTIONS") {
    return NextResponse.next();
  }

  // Affiliate referral tracking: set a 30-day cookie when ?ref= is present
  const refCode = nextUrl.searchParams.get("ref");
  if (refCode) {
    // Track the click on the affiliate record
    try {
      await db
        .update(affiliates)
        .set({
          totalClicks: sql`${affiliates.totalClicks} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(affiliates.referralCode, refCode),
            eq(affiliates.status, "approved")
          )
        );
    } catch {
      // Silently fail - don't block the redirect
    }

    const cleanUrl = new URL(nextUrl);
    cleanUrl.searchParams.delete("ref");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("lg_ref", refCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    return response;
  }

  // A session object is not a session. An invalidated token can still
  // deserialise into one with no user on it, and treating that as signed in is
  // what created the loop above: redirected away from /sign-in, refused by
  // every API route.
  const isLoggedIn = !!req.auth?.user?.id;
  const isAdmin = req.auth?.user?.isAdmin === true;

  // Check maintenance mode first (takes priority)
  if (MAINTENANCE_MODE) {
    const isAllowedRoute = MAINTENANCE_ALLOWED_ROUTES.some((route) =>
      nextUrl.pathname.startsWith(route) || nextUrl.pathname === route
    );

    // If maintenance mode is on and user is not admin and not on allowed route
    if (!isAllowedRoute && !isAdmin) {
      // Allow the maintenance page itself
      if (nextUrl.pathname === "/maintenance") {
        return NextResponse.next();
      }
      // Redirect to maintenance page
      return NextResponse.redirect(new URL("/maintenance", nextUrl));
    }
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isApiRoute = nextUrl.pathname.startsWith("/api/");
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect non-logged-in users to sign in for protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL("/sign-in", nextUrl);
    // pathname alone dropped the query string, which killed campaign links
    // like /dashboard/upgrade?coupon=... for signed-out users (2026-08-19).
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  // The paywall: an account on the free plan that has used its trial and is
  // not paying gets nothing. v2 has no lesser tier to fall back to, so this
  // single check replaces the per-feature gates the routes used to carry.
  //
  // It covers the API as well as the pages. Guarding only /dashboard would
  // leave every AI endpoint callable directly by a cancelled account, and in
  // v2 the AI is billed to us rather than to the user's own key.
  if ((isProtectedRoute || isApiRoute) && isLoggedIn) {
    const user = req.auth?.user;
    // hasUsedTrial is deliberately not part of this. From v2 the trial is
    // granted by Stripe against a card, so an account that has never trialled
    // is an account that never finished signing up, and it gets the same wall
    // as one that cancelled.
    const isPaywalled =
      user?.plan === "free" &&
      !user?.stripeSubscriptionId &&
      // Lifetime holders bought the content half before agents existed and
      // keep it permanently. See section 9a of the v2 plan.
      !user?.isLifetimeDeal;

    if (isPaywalled) {
      const allowed = isApiRoute
        ? PAYWALL_ALLOWED_API_PREFIXES
        : PAYWALL_ALLOWED_PREFIXES;
      const isAllowed = allowed.some((p) =>
        nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`)
      );
      if (!isAllowed) {
        return isApiRoute
          ? NextResponse.json(
              { error: "Your plan does not include this. Pick a plan to continue." },
              { status: 402 }
            )
          : NextResponse.redirect(new URL("/dashboard/upgrade", nextUrl));
      }
    }
  }

  // Protect non-public API routes
  if (isApiRoute && !isLoggedIn) {
    const publicApiPrefixes = [
      "/api/auth/", "/api/waitlist", "/api/stripe/",
      "/api/blog/", "/api/docs/", "/api/geo", "/api/indexnow",
      "/api/qstash/", "/api/v1/", "/api/cron/",
      "/api/google/", "/api/linkedin/", "/api/chat",
      "/api/consent", "/api/email-course", "/api/claude-course",
      "/api/marketing/", "/api/team/invite/validate",
      "/api/affiliate/apply", "/api/beta", "/api/free-tools/",
      "/api/admin/affiliates/action",
      "/api/admin/backfill-free-users",
      "/api/mcp",
      // The demo booker is used by strangers before they have an account,
      // which is the point of the page. Both routes guard themselves with an
      // IP rate limit and hard validation.
      "/api/book-demo",
      // Written to by the Google Ads Script (bearer secret + IP rate limit),
      // read by the local ads agent straight from Turso. Never session-authed.
      "/api/ads-snapshot",
    ];
    const isPublic = publicApiPrefixes.some((p) => nextUrl.pathname.startsWith(p));
    if (!isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

// Main export: signout is handled by NextAuth's client-side signOut() which
// clears both client session state and server cookies properly.
export default function proxy(req: NextRequest) {
  return authProxy(req, {} as any);
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
