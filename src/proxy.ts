import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MAINTENANCE_MODE, MAINTENANCE_ALLOWED_ROUTES } from "@/lib/maintenance";
import { isSelfHosted } from "@/lib/edition";
import { getInstanceSettings } from "@/lib/instance-settings";

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
// reach. Everything else under /dashboard redirects to the plan picker. The
// cloud restores its billing and referral pages on merge.
const PAYWALL_ALLOWED_PREFIXES = [
  "/dashboard/settings",
  // The wizard is open before the card: a workspace builds its agent, sees
  // the value, and meets the checkout at "Connect LinkedIn & launch". The
  // routes that cost money (connect, activate) gate themselves server-side.
  "/dashboard/agents",
  // The paywall redirect target, cloud only page.
  "/dashboard/upgrade",
];

// The API side of the same allowlist. A paywalled account must still be able
// to read its own account and sign out; anything that spends money or
// touches LinkedIn on its behalf is off.
const PAYWALL_ALLOWED_API_PREFIXES = [
  "/api/auth",
  "/api/user",
  // The pre-card wizard: reading agents, saving the draft, the site read
  // (rate limited per user). POST /api/agents and the LinkedIn connect both
  // refuse workspaces without a subscription on their own.
  "/api/agents",
  "/api/linkedin/accounts",
];

// Self hosted: once the wizard has run it stays run, so the instance row is
// read only until it says so, then this latch answers for the life of the
// process.
let setupDone = false;

// Wrapper: intercept signout BEFORE auth() touches the request
const authProxy = auth(async (req) => {
  const { nextUrl } = req;

  // Allow OPTIONS requests to pass through (CORS preflight)
  if (req.method === "OPTIONS") {
    return NextResponse.next();
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
    // for signed-out users (2026-08-19).
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  // Self hosted: nothing in the dashboard opens before the setup wizard has
  // run, and the wizard closes once it has. A non admin lands on the wizard
  // page too, where it shows the waiting card rather than a redirect. Until
  // the latch is set the row is read fresh: the proxy is its own bundle, so
  // the cache the routes invalidate when the wizard finishes is not this one.
  if (isSelfHosted() && isLoggedIn) {
    const isSetupRoute = nextUrl.pathname === "/setup";
    if (isProtectedRoute || isSetupRoute) {
      if (!setupDone) setupDone = (await getInstanceSettings(true)).setupCompleted;
      if (isProtectedRoute && !setupDone) {
        return NextResponse.redirect(new URL("/setup", nextUrl));
      }
      if (isSetupRoute && setupDone) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }
  }

  // The paywall: an account on the free plan that has used its trial and is
  // not paying gets nothing. v2 has no lesser tier to fall back to, so this
  // single check replaces the per-feature gates the routes used to carry.
  //
  // It covers the API as well as the pages. Guarding only /dashboard would
  // leave every AI endpoint callable directly by a cancelled account, and in
  // v2 the AI is billed to us rather than to the user's own key.
  if (!isSelfHosted() && (isProtectedRoute || isApiRoute) && isLoggedIn) {
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
      "/api/auth/",
      "/api/docs/",
      "/api/v1/", "/api/cron/",
      "/api/google/", "/api/linkedin/",
      "/api/team/invite/validate",
      "/api/mcp",
      // Authenticates itself with the instance cron secret (src/lib/cron-auth.ts).
      "/api/internal/",
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
