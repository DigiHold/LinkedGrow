import { test } from "node:test";
import assert from "node:assert/strict";
import { decode } from "next-auth/jwt";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "./session-cookie";

const SECRET = "3d6f45a5fd7b4b0e9c2a1f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6";

const account = {
  id: "user-1",
  email: "person@example.com",
  name: "A Person",
  image: null,
  plan: "business" as const,
  twoFactorEnabled: true,
  isAdmin: true,
};

test("the cookie name and the Secure flag follow the public address", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  assert.equal(sessionCookieName(), "authjs.session-token");
  assert.equal(sessionCookieOptions().secure, false);

  process.env.NEXT_PUBLIC_APP_URL = "https://linkedgrow.example.com";
  assert.equal(sessionCookieName(), "__Secure-authjs.session-token");
  assert.equal(sessionCookieOptions().secure, true);

  process.env.NEXT_PUBLIC_APP_URL = original;
});

test("the session token carries the claims the app reads back", async () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  const token = await createSessionToken(account, SECRET);
  const claims = await decode({ token, secret: SECRET, salt: sessionCookieName() });

  assert.equal(claims?.id, "user-1");
  assert.equal(claims?.email, "person@example.com");
  assert.equal(claims?.name, "A Person");
  assert.equal(claims?.plan, "business");
  assert.equal(claims?.isAdmin, true);
  assert.equal(claims?.twoFactorEnabled, true);
  // src/lib/auth.ts skips the passwordChangedAt check when this is missing, so
  // a session without it survives a password change and the two factor reset.
  assert.equal(typeof claims?.issuedAt, "number");

  process.env.NEXT_PUBLIC_APP_URL = original;
});

test("the salt is the cookie name, so a token minted for one address is unreadable at the other", async () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  const token = await createSessionToken(account, SECRET);

  process.env.NEXT_PUBLIC_APP_URL = "https://linkedgrow.example.com";
  await assert.rejects(() => decode({ token, secret: SECRET, salt: sessionCookieName() }));

  process.env.NEXT_PUBLIC_APP_URL = original;
});
