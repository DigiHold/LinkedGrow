import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MAINTENANCE_MODE, MAINTENANCE_ALLOWED_ROUTES } from "@/lib/maintenance";

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

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.isAdmin === true;

  // Check maintenance mode first
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

  // Redirect non-logged-in users to sign in
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL("/sign-in", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and api
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)",
  ],
};
