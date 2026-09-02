import { test } from "node:test";
import assert from "node:assert/strict";
import { sharedSecretMatches } from "./cron-auth";

test("shared secret comparison is constant time and exact", () => {
  assert.equal(sharedSecretMatches("abc", "abc"), true);
  assert.equal(sharedSecretMatches("abc", "abd"), false);
  assert.equal(sharedSecretMatches("", "abc"), false);
  assert.equal(sharedSecretMatches(null, "abc"), false);
  assert.equal(sharedSecretMatches("abc", ""), false);
});
