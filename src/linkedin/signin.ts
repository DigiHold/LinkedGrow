import type { Page } from "patchright";
import { db } from "../db.ts";
import { log } from "../logger.ts";
import { decryptSecret } from "../crypto.ts";
import { clickHuman, dwell, sleep, typeHuman } from "../browser/human.ts";

/**
 * Signing an account in for the first time, including the code LinkedIn asks for.
 *
 * **Why this is not solved with a TOTP secret.** The obvious design stores the
 * authenticator setup key and generates codes forever with nobody involved. It
 * is also unusable: LinkedIn shows that key once, when two-factor is switched
 * on, and never again, so anybody who already has 2FA would have to turn it off
 * and back on to find it. Nicolas's words on 2026-07-30, and he is right:
 * nobody will know what it is and everybody will get stuck.
 *
 * So the default is the thing people already know how to do. The browser gets
 * as far as the verification page, stops, and the dashboard asks for the six
 * digits. The customer reads them off their phone exactly as they would signing
 * in themselves, the worker types them, and the session completes.
 *
 * **It only happens once.** The profile keeps LinkedIn's "remember this device"
 * state on disk, so the next hundred sessions open with no code and no human.
 * The stored TOTP secret stays available for anyone who wants a re-login months
 * later to be unattended too, but it is an advanced option rather than the
 * price of entry.
 */

/** How long a browser will sit on the verification page waiting for a human. */
const WAIT_FOR_CODE_MS = 5 * 60 * 1000;
/** A TOTP code lasts 30 seconds, so the poll has to be tight. */
const POLL_MS = 2_000;

/**
 * Selectors, ordered from the most specific to the one that still works.
 *
 * LinkedIn's login form no longer carries #username or name="session_key". Verified against the
 * live page on 2026-07-30: every input has a React-generated id like «R3jvukejj35655j6» and no name
 * attribute at all. Matching on the input type is what is left, and it is stable because the form
 * has exactly one email field and one password field.
 *
 * The old selectors are kept first because an account that meets an older layout should still work,
 * and because a selector that matches nothing costs nothing.
 */
const SEL = {
  email: "#username, input[name='session_key'], input[type='email']:visible",
  password: "#password, input[name='session_password'], input[type='password']:visible",
  submit: "button[type='submit'], button[data-litms-control-urn='login-submit']",
  // LinkedIn uses several verification screens and the field is named
  // differently on each, so match the shape rather than one id.
  codeInput:
    "input[name='pin'], input#input__phone_verification_pin, input[name='verification-code'], input[autocomplete='one-time-code']",
  codeSubmit: "button[type='submit'], #two-step-submit-button",
} as const;

export type ChallengeKind = "authenticator app" | "text message" | "email" | "verification";

export class SignInFailed extends Error {
  constructor(message: string, readonly permanent = false) {
    super(message);
    this.name = "SignInFailed";
  }
}

/**
 * True when this session is actually signed in.
 *
 * Positive evidence only: the feed URL, or a piece of chrome that only exists behind the login.
 * Anything inferred from an element being absent is how a selector change turns into a silent
 * false positive.
 */
async function looksSignedIn(page: Page): Promise<boolean> {
  if (/\/feed|\/mynetwork|\/messaging/.test(page.url())) return true;
  for (const sel of ["a[href*='/in/']", ".global-nav", "[data-test-global-nav]", "#global-nav"]) {
    if (await page.locator(sel).first().isVisible().catch(() => false)) return true;
  }
  return false;
}

/** Reads the page to name what is being asked for, so the customer is told. */
async function describeChallenge(page: Page): Promise<ChallengeKind> {
  const text = (await page.locator("main, body").first().innerText().catch(() => "")).toLowerCase();
  if (text.includes("authenticator") || text.includes("authentication app")) {
    return "authenticator app";
  }
  if (text.includes("text message") || text.includes("sms") || text.includes("phone")) {
    return "text message";
  }
  if (text.includes("email")) return "email";
  return "verification";
}

async function askForCode(
  accountId: string,
  workspaceId: string,
  kind: ChallengeKind
): Promise<void> {
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET challenge_state = 'awaiting_code', challenge_kind = ?,
                 challenge_code_encrypted = NULL, challenge_asked_at = ?,
                 status = 'challenged',
                 status_reason = ?, updated_at = ?
           WHERE id = ? AND workspace_id = ?`,
    args: [
      kind,
      Math.floor(Date.now() / 1000),
      `LinkedIn is asking for the code from your ${kind}. Enter it on the accounts page and the sign-in finishes on its own.`,
      Math.floor(Date.now() / 1000),
      accountId,
      workspaceId,
    ],
  });
  log("waiting for a verification code", { accountId, kind });
}

/** Polls for the code the customer typed into the dashboard. */
async function waitForCode(accountId: string): Promise<string | null> {
  const until = Date.now() + WAIT_FOR_CODE_MS;
  while (Date.now() < until) {
    const { rows } = await db().execute({
      sql: `SELECT challenge_code_encrypted FROM linkedin_accounts WHERE id = ?`,
      args: [accountId],
    });
    const stored = rows[0]?.challenge_code_encrypted;
    if (stored) {
      const code = decryptSecret(String(stored));
      // Cleared immediately: a code is single use, and leaving it in the row
      // would let a retry replay something LinkedIn has already rejected.
      await db().execute({
        sql: `UPDATE linkedin_accounts SET challenge_code_encrypted = NULL,
                 challenge_state = 'submitted' WHERE id = ?`,
        args: [accountId],
      });
      return code;
    }
    await sleep(POLL_MS);
  }
  return null;
}

/**
 * Generates a code from a stored setup key, for the accounts that gave us one.
 *
 * Tried first when it exists, because it costs nobody anything. Written out
 * rather than pulled from a package: it is thirty lines of RFC 6238 and the
 * dependency would be a second thing to trust with a secret.
 */
async function totpNow(secret: string): Promise<string> {
  const { createHmac } = await import("node:crypto");
  const clean = secret.replace(/[\s-]/g, "").toUpperCase();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of clean) {
    const index = alphabet.indexOf(ch);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = Buffer.from(
    (bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2))
  );
  const counter = Math.floor(Date.now() / 1000 / 30);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", bytes).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const value =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return String(value % 1_000_000).padStart(6, "0");
}

export interface SignInInput {
  page: Page;
  accountId: string;
  workspaceId: string;
  email: string;
  password: string;
  /** Present only for the accounts that chose the advanced path. */
  totpSecret: string | null;
}

/**
 * Signs the account in, dealing with a verification challenge if one appears.
 *
 * Everything typed goes through the human layer, so the credentials are entered
 * at this account's own pace with its own mistakes rather than pasted in one
 * instant, which is what a form fill looks like from the other side.
 */
export async function signIn(input: SignInInput): Promise<void> {
  const { page, accountId, workspaceId } = input;

  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
  await dwell(1200, 2600);

  // Being signed in has to be established, never inferred from a missing field.
  //
  // This used to read "no email box, therefore already signed in", which is the same conclusion a
  // changed selector produces. LinkedIn dropped #username at some point before 2026-07-30, so the
  // old code would have declared every account signed in, skipped the credentials entirely, and
  // let the rest of the run fail somewhere further along with a stranger error.
  if (await looksSignedIn(page)) {
    log("already signed in, nothing to do", { accountId });
    return;
  }

  const emailField = page.locator(SEL.email).first();
  if (!(await emailField.isVisible().catch(() => false))) {
    throw new SignInFailed(
      "The login form did not appear and the session is not signed in. LinkedIn has probably changed the page."
    );
  }

  await typeHuman(page, SEL.email, input.email);
  await dwell(400, 1100);
  await typeHuman(page, SEL.password, input.password);
  await dwell(600, 1600);
  await clickHuman(page, SEL.submit);

  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await dwell(2500, 4500);

  const codeField = page.locator(SEL.codeInput).first();
  const needsCode = await codeField.isVisible().catch(() => false);

  if (needsCode) {
    let code: string | null = null;

    if (input.totpSecret) {
      code = await totpNow(input.totpSecret);
      log("answering the challenge from the stored setup key", { accountId });
    } else {
      const kind = await describeChallenge(page);
      await askForCode(accountId, workspaceId, kind);
      code = await waitForCode(accountId);
      if (!code) {
        await db().execute({
          sql: `UPDATE linkedin_accounts
                   SET challenge_state = 'failed',
                       status_reason = ?, updated_at = ?
                 WHERE id = ?`,
          args: [
            "Nobody entered the verification code in time, so the sign-in stopped. Start it again from the accounts page whenever you are ready.",
            Math.floor(Date.now() / 1000),
            accountId,
          ],
        });
        throw new SignInFailed("No verification code was entered in time");
      }
    }

    await typeHuman(page, SEL.codeInput, code);
    await dwell(500, 1200);
    await clickHuman(page, SEL.codeSubmit);
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await dwell(2500, 4500);

    if (await page.locator(SEL.codeInput).first().isVisible().catch(() => false)) {
      await db().execute({
        sql: `UPDATE linkedin_accounts SET challenge_state = 'awaiting_code',
                 status_reason = ?, updated_at = ? WHERE id = ?`,
        args: [
          "LinkedIn did not accept that code. Enter a fresh one and it will try again.",
          Math.floor(Date.now() / 1000),
          accountId,
        ],
      });
      throw new SignInFailed("LinkedIn rejected the verification code");
    }
  }

  if (!(await looksSignedIn(page))) {
    throw new SignInFailed("Sign-in did not reach a signed-in page");
  }

  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET status = 'active', status_reason = NULL, challenge_state = 'none',
                 challenge_kind = NULL, challenge_asked_at = NULL, updated_at = ?
           WHERE id = ?`,
    args: [Math.floor(Date.now() / 1000), accountId],
  });
  log("signed in", { accountId });
}
