import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The short lived proof that Google confirmed an address, and nothing more.
 *
 * Google sign in cannot hand out a session on its own once an account carries
 * two factor: the code has to be checked first, exactly as the credentials
 * provider checks it. The callback therefore mints one of these, drops it in an
 * http only cookie, and sends the browser to the two factor step. The value
 * names the account and carries its own expiry, so nothing about the session is
 * decided by anything the browser could edit.
 */
export const TWO_FACTOR_CHALLENGE_COOKIE = "google_2fa_challenge";

/** Long enough to open an authenticator app, short enough to be worthless if it leaks. */
export const TWO_FACTOR_CHALLENGE_TTL_SECONDS = 5 * 60;

/**
 * Every signature is bound to this purpose, so a value signed with AUTH_SECRET
 * somewhere else in the app can never be replayed here.
 */
const SIGNATURE_DOMAIN = "linkedgrow:google-2fa:v1:";

interface ChallengePayload {
  /** The account the challenge is for. */
  uid: string;
  /** One challenge, one id: the attempt counter keys on it. */
  jti: string;
  /** Expiry, milliseconds since the epoch. */
  exp: number;
  /**
   * The Google account id waiting to be linked, when there is one. A public
   * identifier, never a token: the callback refuses to write the link before
   * the code is checked, so the id has to survive the round trip somehow, and
   * signed alongside the account it belongs to is the only place it is safe.
   */
  gid?: string;
}

export interface TwoFactorChallenge {
  userId: string;
  id: string;
  /** The Google account to link once the code checks out, or null. */
  googleAccountId: string | null;
}

/** The signing key, or a clear failure. An unsigned challenge is not a challenge. */
export function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(SIGNATURE_DOMAIN + body).digest("base64url");
}

/** A signed challenge value for one account, valid for the next few minutes. */
export function mintTwoFactorChallenge(
  userId: string,
  secret: string,
  googleAccountId: string | null = null,
  now: number = Date.now(),
): string {
  const payload: ChallengePayload = {
    uid: userId,
    jti: randomBytes(12).toString("base64url"),
    exp: now + TWO_FACTOR_CHALLENGE_TTL_SECONDS * 1000,
    ...(googleAccountId ? { gid: googleAccountId } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

/**
 * The account named by a challenge, or null for anything that is not one:
 * a wrong shape, a forged or altered signature, an expired value.
 */
export function readTwoFactorChallenge(
  value: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): TwoFactorChallenge | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0 || dot === value.length - 1) return null;

  const body = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1), "base64url");
  const expected = Buffer.from(sign(body, secret), "base64url");
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(given, expected)) return null;

  let payload: ChallengePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ChallengePayload;
  } catch {
    return null;
  }

  if (typeof payload.uid !== "string" || payload.uid.length === 0) return null;
  if (typeof payload.jti !== "string" || payload.jti.length === 0) return null;
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (payload.gid !== undefined && typeof payload.gid !== "string") return null;

  return { userId: payload.uid, id: payload.jti, googleAccountId: payload.gid ?? null };
}
