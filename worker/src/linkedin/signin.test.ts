import { test } from "node:test";
import assert from "node:assert/strict";
import { loginPageShape } from "./signin.ts";

/**
 * The page shape that stopped every re-sign-in this product ever attempted.
 *
 * signIn read "no email field" as "the login form did not appear" and gave up
 * three times. That is right for a redesign and wrong for the page LinkedIn
 * shows a browser it remembers, which prints the name and a masked email as
 * text and asks only for the password. A persistent Chrome profile whose
 * session expired lands on exactly that page, so no session was ever renewed:
 * the account went red and the customer had to disconnect and reconnect, which
 * worked only because it threw the profile away and brought back the full form.
 */

test("the full form is the full form", () => {
  assert.equal(
    loginPageShape({ hasEmailField: true, hasPasswordField: true }),
    "full"
  );
});

test("a password with no email is the page LinkedIn shows a browser it remembers", () => {
  assert.equal(
    loginPageShape({ hasEmailField: false, hasPasswordField: true }),
    "password-only"
  );
});

test("neither field is a page we do not know, and it must not be guessed at", () => {
  // A checkpoint, a restriction notice or a redesign. Typing a password into
  // one of those is worse than capturing the page and saying so.
  assert.equal(
    loginPageShape({ hasEmailField: false, hasPasswordField: false }),
    "unknown"
  );
});

test("an email field wins, so a stale password box never suppresses the email", () => {
  // Both visible means the ordinary form. Reading it as password-only would
  // submit a password with an empty email, which is the 2026-08-19 failure.
  assert.equal(
    loginPageShape({ hasEmailField: true, hasPasswordField: false }),
    "full"
  );
});
