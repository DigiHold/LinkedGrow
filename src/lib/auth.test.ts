import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

const SECRET = "3d6f45a5fd7b4b0e9c2a1f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6";

test("a database that drops the connection does not sign the person out", async () => {
  // A closed port: every read fails the way a dropped Turso connection does in
  // production (ECONNRESET on 2026-10-12, read by the proxy on /dashboard).
  process.env.TURSO_DATABASE_URL = "http://127.0.0.1:9";
  process.env.AUTH_SECRET = SECRET;
  process.env.AUTH_TRUST_HOST = "true";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  const { handlers } = await import("./auth");
  const { createSessionToken, sessionCookieName } = await import("./session-cookie");

  const token = await createSessionToken(
    {
      id: "user-1",
      email: "person@example.com",
      name: "A Person",
      image: null,
      plan: "pro",
      twoFactorEnabled: false,
      isAdmin: false,
    },
    SECRET
  );
  const name = sessionCookieName();

  const response = await handlers.GET(
    new NextRequest("http://localhost:3000/api/auth/session", {
      headers: { cookie: `${name}=${token}` },
    })
  );

  const session = await response.json();
  assert.equal(session?.user?.id, "user-1");

  const cleared = response.headers
    .getSetCookie()
    .some((cookie) => cookie.startsWith(`${name}=;`));
  assert.equal(cleared, false);
});
