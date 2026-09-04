import { test } from "node:test";
import assert from "node:assert/strict";
import { isAnotherWayControl, loginPageShape } from "./signin.ts";

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

/**
 * The way out of the checkpoint nobody can answer.
 *
 * LinkedIn's device check pushes a notification to the phones already carrying
 * the LinkedIn app and waits for a tap. When that notification never arrives,
 * and it never arrived once for a customer between 2026-08-24 and 2026-09-03,
 * six sign-ins in a row sat on that page for ten minutes and died there.
 * Disconnecting and reconnecting the account lands on the same page, so the
 * account can never be connected at all.
 *
 * LinkedIn's own help says what to do: "If you are still unable to see the
 * prompt, select Verify using SMS". So the page carries a way out, and the
 * worker has to be able to find it in whatever language the account is served.
 *
 * The one thing it must never touch is the control that denies the sign-in.
 * Clicking "No, it's not me" tells LinkedIn the account is compromised and
 * costs the customer their password, which is far worse than a timeout.
 */

test("the SMS way out is recognised, in the languages accounts are served in", () => {
  for (const name of [
    "Verify using SMS",
    "Verificar mediante SMS",
    "Vérifier par SMS",
    "Send a code by SMS",
  ]) {
    assert.equal(isAnotherWayControl(name), true, name);
  }
});

test("so is any other route to a code", () => {
  for (const name of [
    "Try another way",
    "Verify a different way",
    "Use another verification method",
    "Usar otro método de verificación",
    "Utiliser une autre méthode",
    "Enviar un código a mi correo electrónico",
  ]) {
    assert.equal(isAnotherWayControl(name), true, name);
  }
});

test("nothing that ends the sign-in is ever clickable", () => {
  for (const name of [
    "No, it's not me",
    "No soy yo",
    "Ce n'est pas moi",
    "Cancel",
    "Cancelar",
    "Sign out",
  ]) {
    assert.equal(isAnotherWayControl(name), false, name);
  }
});

test("neither is the tap itself, which only the phone can answer", () => {
  for (const name of ["Yes, it's me", "Sí, soy yo", "Resend", "Reenviar"]) {
    assert.equal(isAnotherWayControl(name), false, name);
  }
});

test("a whole paragraph is not a control, however many of the words match", () => {
  // innerText of a <div role="button"> wrapper can be the entire page. Clicking
  // that clicks whatever is underneath it.
  assert.equal(
    isAnotherWayControl(
      "We sent a notification to the LinkedIn app on your phone. Open it and tap Yes. If you cannot see it, verify using SMS instead."
    ),
    false
  );
});
