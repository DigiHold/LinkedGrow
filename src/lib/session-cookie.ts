import { encode } from "next-auth/jwt";
import { isSecureAppUrl } from "./app-url";

/**
 * The one place that turns an account row into the session cookie the Google
 * routes set by hand. NextAuth writes this cookie itself for the credentials
 * provider; Google has its own route, so the shape lives here and both the
 * callback and the two factor route use it. Two copies of it would drift, and
 * the drift would be a session missing a claim the app reads.
 */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** The Secure prefix follows the public url, the same rule NextAuth is configured with. */
export function sessionCookieName(): string {
  return isSecureAppUrl() ? "__Secure-authjs.session-token" : "authjs.session-token";
}

/** Only the claims the session carries. The row holds far more and none of it belongs here. */
export interface SessionAccount {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "free" | "pro" | "business" | null;
  twoFactorEnabled: boolean | null;
  isAdmin: boolean | null;
}

export async function createSessionToken(account: SessionAccount, secret: string): Promise<string> {
  return encode({
    token: {
      id: account.id,
      // The moment this session began. src/lib/auth.ts compares it against the
      // account's passwordChangedAt on every call and drops the token when the
      // password moved after it. Without the claim that comparison is skipped
      // and the session outlives a password change, a two factor reset, and
      // the recovery command, for its full 30 days.
      issuedAt: Date.now(),
      email: account.email,
      name: account.name,
      image: account.image,
      plan: account.plan,
      twoFactorEnabled: account.twoFactorEnabled,
      isAdmin: account.isAdmin,
    },
    secret,
    // The salt NextAuth uses is the cookie name, so a token minted here decodes
    // on the reading side.
    salt: sessionCookieName(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureAppUrl(),
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}
