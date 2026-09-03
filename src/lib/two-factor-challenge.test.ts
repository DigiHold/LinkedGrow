import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TWO_FACTOR_CHALLENGE_TTL_SECONDS,
  mintTwoFactorChallenge,
  readTwoFactorChallenge,
} from "./two-factor-challenge";

const SECRET = "3d6f45a5fd7b4b0e9c2a1f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6";

test("a freshly minted challenge names its account", () => {
  const value = mintTwoFactorChallenge("user-1", SECRET);
  assert.deepEqual(readTwoFactorChallenge(value, SECRET)?.userId, "user-1");
});

test("two challenges for the same account carry different ids", () => {
  const first = readTwoFactorChallenge(mintTwoFactorChallenge("user-1", SECRET), SECRET);
  const second = readTwoFactorChallenge(mintTwoFactorChallenge("user-1", SECRET), SECRET);
  assert.notEqual(first?.id, second?.id);
});

test("nothing but a correctly signed value is read", () => {
  const value = mintTwoFactorChallenge("user-1", SECRET);
  const [body, signature] = value.split(".");

  assert.equal(readTwoFactorChallenge(undefined, SECRET), null);
  assert.equal(readTwoFactorChallenge("", SECRET), null);
  assert.equal(readTwoFactorChallenge(body, SECRET), null, "unsigned body");
  assert.equal(readTwoFactorChallenge(`${body}.`, SECRET), null, "empty signature");
  assert.equal(readTwoFactorChallenge(value, `${SECRET}0`), null, "another key");
  assert.equal(readTwoFactorChallenge(`${body}x.${signature}`, SECRET), null, "altered body");
});

test("a forged challenge naming another account is refused", () => {
  const forged = Buffer.from(
    JSON.stringify({ uid: "victim", jti: "abc", exp: Date.now() + 60_000 }),
    "utf8",
  ).toString("base64url");
  assert.equal(readTwoFactorChallenge(`${forged}.notasignature`, SECRET), null);
  assert.equal(readTwoFactorChallenge(forged, SECRET), null);
});

test("a challenge stops being read once it expires", () => {
  const now = Date.now();
  const value = mintTwoFactorChallenge("user-1", SECRET, now);
  const stillValid = now + TWO_FACTOR_CHALLENGE_TTL_SECONDS * 1000 - 1000;
  const expired = now + TWO_FACTOR_CHALLENGE_TTL_SECONDS * 1000 + 1;

  assert.equal(readTwoFactorChallenge(value, SECRET, stillValid)?.userId, "user-1");
  assert.equal(readTwoFactorChallenge(value, SECRET, expired), null);
});
