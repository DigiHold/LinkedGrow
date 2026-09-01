import type { Page } from "patchright";
import { db } from "../db.ts";
import { log } from "../logger.ts";
import { decryptSecret } from "../crypto.ts";
import { clickHuman, clickHumanLocator, dwell, sleep, typeHuman } from "../browser/human.ts";
import { capturePage } from "./diagnose.ts";

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
/**
 * Longer for the tap than for the code, because they are different asks.
 *
 * A code is read off a screen already in somebody's hand. The tap needs them to
 * find the LinkedIn app, and the notification may arrive while they are looking
 * at the dashboard rather than at their phone. Ten minutes is still short
 * enough that a browser is never left holding a slot all afternoon.
 */
const WAIT_FOR_APPROVAL_MS = 10 * 60 * 1000;
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
  /**
   * The sign-in button, which is none of the above.
   *
   * Read off the live page on 2026-07-30: it is <button type="button">, there is no <form> element
   * anywhere, and every class is a content hash. The only stable handle is the visible text, and
   * that text is translated: the box in Nuremberg was served German. In production each account
   * leaves through its own country's address, so the language follows the customer rather than us
   * and an English-only matcher would fail for most of them.
   */
  submitByName:
    /^(sign in|log in|einloggen|anmelden|se connecter|connexion|iniciar sesión|entrar|accedi|inloggen|logga in|zaloguj|giriş yap|войти|登录|ログイン|로그인)$/i,
  // LinkedIn uses several verification screens and the field is named
  // differently on each, so match the shape rather than one id.
  codeInput:
    "input[name='pin'], input#input__phone_verification_pin, input[name='verification-code'], input[autocomplete='one-time-code']",
  codeSubmit: "button[type='submit'], #two-step-submit-button",
} as const;

export type ChallengeKind =
  | "authenticator app"
  | "text message"
  | "email"
  | "app notification"
  | "verification";

/**
 * The checkpoint LinkedIn actually shows a real account signing in somewhere new.
 *
 * Not a code. It pushes a notification to the phones already carrying the
 * LinkedIn app and waits for a tap on Yes, and the page carries no input at
 * all. Nothing here knew that screen existed, so the sign-in typed the
 * password, landed on the checkpoint, found no code field, and reported "did
 * not reach a signed-in page" while LinkedIn sat there waiting for somebody to
 * confirm. It is the first thing a genuine account meets, and it met it on
 * 2026-07-31 with Maria's.
 *
 * Matched on the address rather than the wording, because the page is served in
 * the language of the country the account signs in from: this one arrived in
 * French, and an English matcher would have missed it for most customers.
 */
const CHECKPOINT_URL = /\/checkpoint\/(challenge|challengesV2)/;

/**
 * The wording LinkedIn uses when it has restricted an account outright, in the
 * languages the product is sold in. Read off the real notice on 2026-08-08:
 * "Your account has been temporarily restricted ... it has accessed an
 * unusually high volume of LinkedIn profile data".
 */
const RESTRICTED_NOTICE =
  /(account has been (temporarily )?restricted|temporarily restricted your account|votre compte a (été|ete) (temporairement )?restreint|unusually high volume)/i;

/** Words for "we sent a notification to your app", in the languages we sell into. */
const APP_APPROVAL =
  /(linkedin app|appli linkedin|app linkedin|linkedin-app|aplicación de linkedin|app di linkedin|tap yes|touchez oui|toque en sí|tippen sie auf ja|tocca sì|benachrichtigung|notification|notificación|notifica)/i;

/** The box that stops this happening on every future sign-in. */
const REMEMBER_DEVICE =
  /^(remember|recognize|recognise|reconna(î|i)tre|erkennen|recordar|ricorda|onthouden).*/i;

/**
 * Which login page this is, from the fields it is showing.
 *
 * Pulled out of signIn so the decision can be tested without a browser. The
 * bug it exists to hold: "no email field" was read as "broken page", which is
 * true of a redesign and false of the page LinkedIn shows a browser it
 * remembers, where the email is printed as text and only the password is
 * asked for. Every re-sign-in on a persistent profile meets that page.
 */
export type LoginShape = "full" | "password-only" | "unknown";

export function loginPageShape(fields: {
  hasEmailField: boolean;
  hasPasswordField: boolean;
}): LoginShape {
  if (fields.hasEmailField) return "full";
  if (fields.hasPasswordField) return "password-only";
  return "unknown";
}

export class SignInFailed extends Error {
  /** Same reason as RunStalled in worker.ts: strip-only TypeScript cannot rewrite a parameter property. */
  readonly permanent: boolean;

  constructor(message: string, permanent = false) {
    super(message);
    this.permanent = permanent;
    this.name = "SignInFailed";
  }
}

/**
 * Clicks whatever submits this login form, in whatever language it is being shown.
 *
 * Three attempts, cheapest first: the classic selector for an older layout, the button named after
 * signing in, then Enter in the password field. Enter is last because with no <form> on the page it
 * is the least certain of the three, not the most.
 */
async function submitLogin(page: Page): Promise<void> {
  const classic = page.locator(SEL.submit).first();
  if (await classic.isVisible().catch(() => false)) {
    await clickHuman(page, SEL.submit);
    return;
  }
  const named = page.getByRole("button", { name: SEL.submitByName }).first();
  if (await named.isVisible().catch(() => false)) {
    await clickHumanLocator(page, named);
    return;
  }
  await page.locator(SEL.password).first().press("Enter").catch(() => {});
}

/**
 * True when this session is actually signed in.
 *
 * Positive evidence only: the feed URL, or a piece of chrome that only exists behind the login.
 * Anything inferred from an element being absent is how a selector change turns into a silent
 * false positive.
 */
/**
 * LinkedIn's "we know this browser" page, which signs itself in.
 *
 * Shown instead of the login form when the profile still carries a remembered
 * session: the account's name, a masked email, a countdown and a Cancel link.
 * Read off Maria's account on 2026-08-06:
 *
 *   Connexion en cours
 *   Si vous restez sur cette page, vous serez connecté(e).
 *   9
 *   Maria LECOCQ / m*****@gmail.com / Annuler la connexion
 *
 * Doing nothing is the correct action, so this waits rather than typing. The
 * wait is capped: a countdown that never finishes is a page that has stalled,
 * and falling through to the capture beats hanging on the account.
 */
const AUTO_SIGN_IN = /connexion en cours|vous serez connect|signing you in|you.?ll be signed in|you will be signed in/i;
const AUTO_SIGN_IN_WAIT_MS = 45_000;

async function waitOutAutoSignIn(page: Page, accountId: string): Promise<boolean> {
  const text = await page.evaluate(() => document.body.innerText ?? "").catch(() => "");
  if (!AUTO_SIGN_IN.test(text)) return false;

  log("LinkedIn is signing this browser in by itself, waiting it out", { accountId });
  const until = Date.now() + AUTO_SIGN_IN_WAIT_MS;
  while (Date.now() < until) {
    await sleep(2000);
    if (await looksSignedIn(page)) {
      log("the countdown finished and the session is up", { accountId });
      return true;
    }
  }
  log("the countdown never finished", { accountId });
  return false;
}

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
                 challenge_code_encrypted = NULL, challenge_asked_at = ?, last_challenge_at = ?,
                 status = 'challenged',
                 status_reason = ?, updated_at = ?
           WHERE id = ? AND workspace_id = ?`,
    args: [
      kind,
      Math.floor(Date.now() / 1000),
      // last_challenge_at, which unlike challenge_asked_at survives the
      // recovery. It is the only record that LinkedIn ever asked.
      Math.floor(Date.now() / 1000),
      `LinkedIn is asking for the code from your ${kind}. Enter it on the accounts page and the sign-in finishes on its own.`,
      Math.floor(Date.now() / 1000),
      accountId,
      workspaceId,
    ],
  });
  log("waiting for a verification code", { accountId, kind });
}

/**
 * Waits for the tap on the phone, having asked for it in the dashboard.
 *
 * Nothing is typed and nothing is submitted. LinkedIn moves the page itself the
 * moment the notification is answered, so the only job here is to notice, and
 * to tick "remember this device" first so the account is never asked again.
 *
 * Returns true when the checkpoint clears.
 */
async function waitForApproval(
  page: Page,
  accountId: string,
  workspaceId: string
): Promise<boolean> {
  // Tick it before asking, because after the tap the page is gone. Best effort:
  // the box is not always there, and its absence is not a failure.
  const remember = page.getByRole("checkbox", { name: REMEMBER_DEVICE }).first();
  if (await remember.isVisible().catch(() => false)) {
    await remember.check().catch(() => {});
  }

  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET challenge_state = 'awaiting_approval', challenge_kind = 'app notification',
                 challenge_code_encrypted = NULL, challenge_asked_at = ?, last_challenge_at = ?,
                 status = 'challenged', status_reason = ?, updated_at = ?
           WHERE id = ? AND workspace_id = ?`,
    args: [
      // challenge_asked_at, then last_challenge_at: the missing second
      // timestamp made this a 5-args-for-6-placeholders crash, which killed
      // every sign-in that hit the phone-tap checkpoint (found live on
      // launch morning, 2026-08-19, on Nicolas's own account).
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000),
      "LinkedIn sent a notification to the LinkedIn app on your phone. Open it and tap Yes, and this finishes on its own.",
      Math.floor(Date.now() / 1000),
      accountId,
      workspaceId,
    ],
  });
  log("waiting for the tap on the phone", { accountId });

  const until = Date.now() + WAIT_FOR_APPROVAL_MS;
  while (Date.now() < until) {
    await sleep(POLL_MS);
    if (!CHECKPOINT_URL.test(page.url())) return true;
    // Some accounts get offered a code after a while instead. Let the caller
    // deal with it rather than waiting out the full window for nothing.
    if (await page.locator(SEL.codeInput).first().isVisible().catch(() => false)) {
      return true;
    }
  }
  return false;
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
  const hasEmailField = await emailField.isVisible().catch(() => false);

  /**
   * Which fields this page is actually asking for.
   *
   * Two shapes reach the typing below. The full form wants an email and a
   * password. The "Welcome back" page wants only a password, and it is the one
   * a returning profile meets, so it is not an edge case here: it is the normal
   * case for every re-sign-in this product ever does.
   */
  let fields: ReadonlyArray<readonly [string, string]>;

  if (!hasEmailField) {
    // LinkedIn already knows this browser and is signing it in by itself.
    //
    // The page carries the account's name, a masked email and a countdown:
    // "Connexion en cours, si vous restez sur cette page vous serez
    // connecté(e)". There is no email field because none is being asked for.
    // The old code read the missing field as a broken page and gave up three
    // times in a row, nine seconds short of a session, and left the account
    // red for two days telling the customer to check their password.
    if (await waitOutAutoSignIn(page, accountId)) return markSignedIn(accountId);

    /**
     * "Welcome back": the page for a browser LinkedIn remembers.
     *
     * It carries the account's name and a masked email as text, one password
     * field, and a "Sign in using another account" link. There is no email
     * input because none is being asked for, so the check above reads it as a
     * broken page.
     *
     * This is the page a persistent Chrome profile lands on every time its
     * session expires, which is to say it is the page EVERY re-sign-in in this
     * product meets. It was never handled, so no session was ever renewed: the
     * sign-in threw "the login form did not appear" three times and the account
     * went red asking the customer to reconnect it by hand. Disconnecting and
     * reconnecting worked only because that clears the profile and brings back
     * the full form. Found on Mohamed Elmelegey's account, 2026-09-02, from the
     * capture the failure had been writing to /opt/linkedgrow/debug all along.
     *
     * The password alone is the right answer: LinkedIn is not asking who this
     * is, only for proof. Everything after the submit, the checkpoint and the
     * code and the approval, is shared with the full form below.
     */
    const hasPasswordField = await page
      .locator(SEL.password)
      .first()
      .isVisible()
      .catch(() => false);
    if (loginPageShape({ hasEmailField, hasPasswordField }) === "password-only") {
      log("LinkedIn remembers this profile and is asking only for the password", { accountId });
      await typeHuman(page, SEL.password, input.password);
      await dwell(600, 1600);
      fields = [[SEL.password, input.password]] as const;
    } else {
      // Anything else it might be showing, on disk. A restriction notice, a
      // checkpoint and a redesigned form all reach this line and each needs a
      // different answer.
      const says = await capturePage(page, accountId, "signin-no-form").catch(() => null);

      /**
       * Three different pages used to arrive here and get the same answer.
       *
       * A redesigned form deserves another try in ten minutes. A security
       * checkpoint and a restriction notice deserve the opposite: LinkedIn is
       * already unhappy with this account, and knocking on the door every two
       * minutes with the same credentials is the single worst thing the worker
       * can do to it. On 2026-08-08 that is exactly what happened to a restricted
       * account, for as long as the attempts lasted.
       *
       * Both are permanent as far as the worker is concerned. Only a person can
       * clear them, and the account says so until they do.
       */
      const url = page.url();
      const text = says ?? "";
      if (CHECKPOINT_URL.test(url) || RESTRICTED_NOTICE.test(text)) {
        const restricted = RESTRICTED_NOTICE.test(text);
        await db().execute({
          sql: `UPDATE linkedin_accounts
                   SET status = 'challenged', challenge_state = 'failed',
                       status_reason = ?, last_challenge_at = ?, updated_at = ?
                 WHERE id = ?`,
          args: [
            restricted
              ? "LinkedIn has restricted this account. Nothing will run on it until you sign in on linkedin.com yourself and the restriction is lifted."
              : "LinkedIn is asking this account to verify itself. Nothing will be retried until you finish that on linkedin.com.",
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000),
            accountId,
          ],
        });
        log(restricted ? "account restricted by LinkedIn, everything stopped" : "checkpoint, everything stopped", {
          accountId,
          url,
        });
        throw new SignInFailed(
          restricted
            ? "LinkedIn has restricted this account. Nothing was retried."
            : "LinkedIn is asking this account to verify itself. Nothing was retried.",
          true
        );
      }

      throw new SignInFailed(
        `The login form did not appear and the session is not signed in.${
          says ? ` The page says: "${says}".` : ""
        } The capture is in /opt/linkedgrow/debug.`
      );
    }
  } else {
    await typeHuman(page, SEL.email, input.email);
    await dwell(400, 1100);
    await typeHuman(page, SEL.password, input.password);
    await dwell(600, 1600);
    fields = [
      [SEL.email, input.email],
      [SEL.password, input.password],
    ] as const;
  }

  // Read both fields back before submitting. The login page can finish
  // hydrating after the typing starts and reset what was already typed:
  // that exact race submitted an empty email with a filled password on
  // launch morning (2026-08-19) and burned a sign-in attempt on a real
  // account. Same defence as the composer's typeBody.
  for (const [selector, wanted] of fields) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const field = page.locator(selector).first();
      const current = await field.inputValue().catch(() => "");
      if (current === wanted) break;
      if (attempt === 2) {
        throw new SignInFailed(
          "The login form kept dropping what was typed into it. Trying again from the top."
        );
      }
      await field.click().catch(() => {});
      await field.fill("").catch(() => {});
      await typeHuman(page, selector, wanted);
      await dwell(300, 800);
    }
  }
  await submitLogin(page);

  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await dwell(2500, 4500);

  // The device-approval checkpoint comes first, because it is the one a real
  // account actually meets and it carries no input at all. Left undetected, the
  // sign-in walks straight past it into "did not reach a signed-in page" while
  // LinkedIn waits for a tap nobody has been told about.
  if (CHECKPOINT_URL.test(page.url())) {
    const shown = (await page.locator("body").first().innerText().catch(() => "")) || "";
    const hasCodeField = await page
      .locator(SEL.codeInput)
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasCodeField && APP_APPROVAL.test(shown)) {
      const approved = await waitForApproval(page, accountId, workspaceId);
      if (!approved) {
        await db().execute({
          sql: `UPDATE linkedin_accounts
                   SET challenge_state = 'failed', status_reason = ?, updated_at = ?
                 WHERE id = ?`,
          args: [
            "Nobody confirmed the sign-in in the LinkedIn app, so it stopped. Press Try again whenever you have your phone.",
            Math.floor(Date.now() / 1000),
            accountId,
          ],
        });
        throw new SignInFailed("The sign-in was not confirmed on the phone in time");
      }
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await dwell(1500, 3000);
    } else if (!hasCodeField) {
      // A checkpoint we cannot drive: a puzzle, a captcha, something new. Say so
      // rather than blaming the password, and keep the page for whoever fixes it.
      const says = await capturePage(page, accountId, "checkpoint with nothing to fill in");
      throw new SignInFailed(
        says
          ? `LinkedIn is showing a security check that has to be done by hand. It says: ${says}`
          : "LinkedIn is showing a security check that has to be done by hand."
      );
    }
  }

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
          // The app's ChallengePrompt matches on the "LinkedIn did not accept"
          // prefix to tell a refusal from the instructional first ask. Change
          // this sentence and change the prompt with it.
          "LinkedIn did not accept that code. Enter a fresh one and it will try again.",
          Math.floor(Date.now() / 1000),
          accountId,
        ],
      });
      await capturePage(page, accountId, "verification code refused");
      throw new SignInFailed("LinkedIn rejected the verification code");
    }
  }

  if (!(await looksSignedIn(page))) {
    // The page itself is the diagnosis, and there is no second chance to read
    // it: the next attempt is another login on a real account. A captcha, a
    // refused password, a "verify it's you" screen and a renamed class all
    // reach this line, and only the capture tells them apart.
    const says = await capturePage(page, accountId, "did not reach a signed-in page");
    throw new SignInFailed(
      says
        ? `Sign-in did not reach a signed-in page. LinkedIn said: ${says}`
        : "Sign-in did not reach a signed-in page"
    );
  }

  await markSignedIn(accountId);
}

/**
 * The account is up: green, no reason, no challenge held over from last time.
 *
 * Its own function because two paths reach it now, the one that types the
 * credentials and the one that waits out LinkedIn's own countdown, and a
 * second copy of this update is a second place for the two to disagree.
 */
async function markSignedIn(accountId: string): Promise<void> {
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET status = 'active', status_reason = NULL, challenge_state = 'none',
                 challenge_kind = NULL, challenge_asked_at = NULL, updated_at = ?
           WHERE id = ?`,
    args: [Math.floor(Date.now() / 1000), accountId],
  });
  log("signed in", { accountId });
}
