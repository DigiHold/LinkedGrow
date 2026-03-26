import { NextResponse } from "next/server";

export async function POST() {
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const response = NextResponse.json({ success: true });

  // Explicitly clear the session cookie with matching attributes
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  // Also clear the callback URL cookie if present
  response.cookies.set("authjs.callback-url", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set("__Secure-authjs.callback-url", "", {
    path: "/",
    secure: true,
    maxAge: 0,
    expires: new Date(0),
  });

  // Clear CSRF token cookie
  response.cookies.set("authjs.csrf-token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set("__Host-authjs.csrf-token", "", {
    path: "/",
    secure: true,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
