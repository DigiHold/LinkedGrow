import { NextRequest, NextResponse } from 'next/server';
import { isCloud } from '@/lib/edition';
import { db, users, accounts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyTOTP } from '@/lib/totp';
import { sanitizeCallbackUrl } from '@/lib/url';
import { rateLimit, getClientIP, AUTH_RATE_LIMITS } from '@/lib/rate-limit';
import { createSessionToken, sessionCookieName, sessionCookieOptions } from '@/lib/session-cookie';
import {
  twoFactorChallengeCookieName,
  TWO_FACTOR_CHALLENGE_TTL_SECONDS,
  readTwoFactorChallenge,
  requireAuthSecret,
} from '@/lib/two-factor-challenge';

/**
 * The second half of Google sign in for an account that carries two factor.
 *
 * The callback stopped at a signed challenge cookie naming the account. This
 * route checks the code against that account's own secret, with the same
 * verifier the credentials provider uses, and only then writes the session the
 * callback would have written. A restart flag tells the page to send the person
 * back to the start rather than leave them typing into a dead challenge.
 */
function restart(message: string, status: number) {
  const response = NextResponse.json({ error: message, restart: true }, { status });
  response.cookies.delete(twoFactorChallengeCookieName());
  return response;
}

export async function POST(request: NextRequest) {
  // Google sign in belongs to the hosted service; a self hosted instance has
  // no Google flow at all, so the whole path answers as if it did not exist.
  if (!isCloud()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const limit = rateLimit(`google-2fa:${getClientIP(request)}`, AUTH_RATE_LIMITS.googleTwoFactor);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const challenge = readTwoFactorChallenge(
      request.cookies.get(twoFactorChallengeCookieName())?.value,
      requireAuthSecret()
    );
    if (!challenge) {
      return restart('Your sign in request expired. Please start again.', 400);
    }

    // Guessing a 6 digit code is a numbers game, so one challenge is worth a
    // handful of tries and then it is gone.
    const attempts = rateLimit(`google-2fa-challenge:${challenge.id}`, AUTH_RATE_LIMITS.googleTwoFactorAttempts);
    if (!attempts.success) {
      return restart('Too many incorrect codes. Please start again.', 400);
    }

    const body = (await request.json()) as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!/^[0-9]{6}$/.test(code)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, challenge.userId),
    });

    // Two factor switched off between the callback and this call means the
    // challenge is stale, and a stale challenge never becomes a session.
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return restart('Your sign in request expired. Please start again.', 400);
    }

    if (!verifyTOTP(code, user.twoFactorSecret)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // One challenge buys one session. The value is signed and carries its own
    // expiry, so without this a captured cookie stays spendable for the rest of
    // its 5 minutes even after the person it belongs to has already signed in.
    // Counted only once the code is right, so mistyping costs nothing here.
    const spend = rateLimit(`google-2fa-spent:${challenge.id}`, {
      maxRequests: 1,
      windowMs: TWO_FACTOR_CHALLENGE_TTL_SECONDS * 1000,
    });
    if (!spend.success) {
      return restart('Your sign in request expired. Please start again.', 400);
    }

    // The link the callback deliberately did not write. The code has proved the
    // device, so the Google identity may now be attached to the account. The
    // OAuth tokens are not carried here: nothing in the app reads a stored
    // Google token, and the export route strips them, so the identity is all
    // that is worth keeping and the only thing safe to put in a cookie.
    if (challenge.googleAccountId) {
      const alreadyLinked = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.provider, 'google'),
          eq(accounts.providerAccountId, challenge.googleAccountId)
        ),
      });
      if (!alreadyLinked) {
        await db.insert(accounts).values({
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: challenge.googleAccountId,
        });
      }
    }

    const token = await createSessionToken(user, requireAuthSecret());
    const redirectUrl = sanitizeCallbackUrl(request.cookies.get('google_callback_url')?.value ?? null);

    const response = NextResponse.json({ success: true, callbackUrl: redirectUrl });
    response.cookies.set(sessionCookieName(), token, sessionCookieOptions());
    response.cookies.delete(twoFactorChallengeCookieName());
    response.cookies.delete('google_callback_url');
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to verify the code' }, { status: 500 });
  }
}
