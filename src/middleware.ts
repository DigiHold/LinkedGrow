import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect dashboard routes - redirect to sign-in if not authenticated
  if (pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Protect API routes (except public ones)
  if (pathname.startsWith("/api/") && !isPublicApiRoute(pathname)) {
    if (!req.auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

function isPublicApiRoute(pathname: string): boolean {
  const publicRoutes = [
    "/api/auth/",
    "/api/waitlist",
    "/api/stripe/webhook",
    "/api/blog/comments",
    "/api/blog/schedule",
    "/api/docs/feedback",
    "/api/docs/search",
    "/api/geo",
    "/api/indexnow",
    "/api/qstash/",
    "/api/v1/",
    "/api/cron/",
  ];
  return publicRoutes.some((route) => pathname.startsWith(route));
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
