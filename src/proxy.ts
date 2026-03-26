import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MAINTENANCE_MODE, MAINTENANCE_ALLOWED_ROUTES } from "@/lib/maintenance";
import { db } from "@/lib/db";
import { affiliates } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/onboarding",
];

// Routes that are only for non-authenticated users
const authRoutes = [
  "/sign-in",
  "/sign-up",
];

export default auth(async (req) => {
  const { nextUrl } = req;

  // Handle sign-out: clear all auth cookies and return immediately
  // Must be handled here before auth() can refresh the session token
  if (nextUrl.pathname === "/api/auth/signout" && req.method === "POST") {
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("__Host-authjs.csrf-token", "", { path: "/", secure: true, maxAge: 0 });
    response.cookies.set("__Secure-authjs.callback-url", "", { path: "/", secure: true, maxAge: 0 });
    response.cookies.set("authjs.session-token", "", { path: "/", maxAge: 0 });
    response.cookies.set("authjs.csrf-token", "", { path: "/", maxAge: 0 });
    response.cookies.set("authjs.callback-url", "", { path: "/", maxAge: 0 });
    return response;
  }

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

  const isLoggedIn = !!req.auth;
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
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Protect non-public API routes
  if (nextUrl.pathname.startsWith("/api/") && !isLoggedIn) {
    const publicApiPrefixes = [
      "/api/auth/", "/api/waitlist", "/api/stripe/",
      "/api/blog/", "/api/docs/", "/api/geo", "/api/indexnow",
      "/api/qstash/", "/api/v1/", "/api/cron/",
      "/api/google/", "/api/linkedin/", "/api/chat",
      "/api/consent", "/api/email-course", "/api/claude-course",
      "/api/marketing/", "/api/team/invite/validate",
      "/api/affiliate/apply", "/api/beta", "/api/free-tools/",
      "/api/admin/affiliates/action",
    ];
    const isPublic = publicApiPrefixes.some((p) => nextUrl.pathname.startsWith(p));
    if (!isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
