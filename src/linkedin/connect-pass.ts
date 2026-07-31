import { db } from "../db.ts";
import { log, logError } from "../logger.ts";
import { closeSession, isSignedIn, openSession } from "../browser/driver.ts";
import { allocationFor, isProduction } from "../proxy/allocation.ts";
import { NoSlotError, takeSlot } from "../safety/slots.ts";
import { withWatchdog } from "../safety/watchdog.ts";
import { currentRun } from "../safety/run-context.ts";
import { decryptSecret } from "../crypto.ts";
import { timezoneForCountry } from "../browser/fingerprint.ts";
import { signIn } from "./signin.ts";
import { ensureProfileCaptured } from "./profile.ts";

/**
 * Signing in an account that has just been connected.
 *
 * This did not exist. `signIn` was written, tested and exported, and nothing in
 * the worker ever called it: an account sat at `pending` for ever, the customer
 * watched a row that said "waiting for its first sign-in" and waited for
 * something that was never going to happen. Found on 2026-07-31, before the
 * first real account was tested rather than after.
 *
 * It runs on the fast loop, because connecting an account is the one moment the
 * customer is certainly watching the screen, and because LinkedIn will ask for
 * a verification code that only stays valid for thirty seconds.
 */

/** Accounts waiting to be signed in for the first time. */
interface Waiting {
  id: string;
  workspaceId: string;
  email: string;
  password: string;
  totpSecret: string | null;
  country: string;
  attempts: number;
}

/**
 * How many times a connection is allowed to fail before it stops trying.
 *
 * Without a ceiling this loop retries a failing sign-in every few seconds for
 * ever. An account with a mistyped password would therefore hammer LinkedIn's
 * login form all night from one address, which is exactly the pattern that gets
 * a real profile restricted. The customer's mistake must cost them a message,
 * not their account.
 */
const MAX_ATTEMPTS = 3;

/** Seconds to wait before attempt n+1, indexed by attempts already made. */
const BACKOFF_SECONDS = [0, 120, 600];

/**
 * A line for the customer, while they are watching the dialog.
 *
 * Connecting is the one step where somebody is certainly staring at the screen,
 * and it takes a minute or two by design: the sign-in types at a human pace on
 * a residential address. Without a word from the worker that minute looks
 * exactly like a hung page, which is what it was mistaken for on 2026-07-31.
 *
 * Guarded so it can never overwrite something more important. `signIn` writes
 * real messages into the same column while the account is still `pending`, and
 * a progress line landing on top of "LinkedIn did not accept that code" would
 * be worse than saying nothing at all.
 */
async function progress(accountId: string, line: string): Promise<void> {
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET status_reason = ?, updated_at = ?
           WHERE id = ? AND status = 'pending' AND challenge_state = 'none'`,
    args: [line, Math.floor(Date.now() / 1000), accountId],
  });
}

/** Records that an attempt is starting, so a crash still counts as a try. */
async function attemptStarts(accountId: string): Promise<void> {
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET sign_in_attempts = sign_in_attempts + 1,
                 last_check_at = ?, updated_at = ?
           WHERE id = ?`,
    args: [Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), accountId],
  });
}

/** Nothing more will be tried on its own, and the customer is told why. */
async function givenUp(accountId: string): Promise<void> {
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET status = 'challenged', status_reason = ?, updated_at = ?
           WHERE id = ? AND status = 'pending'`,
    args: [
      `LinkedIn did not let this account sign in, after ${MAX_ATTEMPTS} tries. The usual cause is the password. Disconnect it and connect it again with the password you use on linkedin.com.`,
      Math.floor(Date.now() / 1000),
      accountId,
    ],
  });
  log("sign-in given up on, waiting for the customer", { accountId });
}

/**
 * Says so, on the account, when its credentials cannot be read.
 *
 * This is not a transient failure and retrying it every minute for ever helps
 * nobody: the stored value was written under a different key and no amount of
 * waiting changes that. The customer sees a sentence telling them to reconnect,
 * which is the one action that fixes it.
 */
async function unreadable(accountId: string): Promise<void> {
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET status = 'challenged',
                 status_reason = ?,
                 updated_at = ?
           WHERE id = ? AND status = 'pending'`,
    args: [
      "This account's sign-in details could not be read. Disconnect it and connect it again.",
      Math.floor(Date.now() / 1000),
      accountId,
    ],
  });
  log("account credentials cannot be decrypted, asking for a reconnection", { accountId });
}

async function loadWaiting(): Promise<Waiting[]> {
  // Three conditions beyond "pending", and each one exists because of a way
  // this loop can otherwise run for ever:
  //
  //   challenge_state != 'failed'  a sign-in that timed out waiting for a code
  //                                needs the customer, not another attempt
  //   sign_in_attempts             the ceiling above
  //   last_check_at + backoff      space between tries, growing each time
  const now = Math.floor(Date.now() / 1000);
  const { rows } = await db().execute({
    sql: `SELECT id, workspace_id, email, password_encrypted, totp_secret_encrypted,
                 country, sign_in_attempts
            FROM linkedin_accounts
           WHERE status = 'pending'
             AND challenge_state = 'none'
             AND sign_in_attempts < ?
             AND (last_check_at IS NULL
                  OR last_check_at <= ? - (CASE sign_in_attempts
                                             WHEN 0 THEN ${BACKOFF_SECONDS[0]}
                                             WHEN 1 THEN ${BACKOFF_SECONDS[1]}
                                             ELSE ${BACKOFF_SECONDS[2]} END))
           ORDER BY created_at
           LIMIT 3`,
    args: [MAX_ATTEMPTS, now],
  });
  const out: Waiting[] = [];
  for (const row of rows) {
    const id = String(row.id);
    // Decryption throws rather than returning null when the key does not match
    // what wrote the value, and it used to throw straight out of this loop. One
    // account encrypted under a key the worker does not have therefore stopped
    // every other account on the box from signing in, once a minute, silently.
    let password: string | null = null;
    let totp: string | null = null;
    try {
      password = decryptSecret(String(row.password_encrypted ?? ""));
      totp = row.totp_secret_encrypted
        ? decryptSecret(String(row.totp_secret_encrypted))
        : "";
    } catch {
      await unreadable(id);
      continue;
    }
    if (!password) {
      await unreadable(id);
      continue;
    }
    out.push({
      id,
      workspaceId: String(row.workspace_id),
      email: String(row.email),
      password,
      totpSecret: totp || null,
      country: String(row.country),
      attempts: Number(row.sign_in_attempts ?? 0),
    });
  }
  return out;
}

async function connectOne(account: Waiting): Promise<void> {
  const address = await allocationFor(account.id);
  if (!address) {
    if (isProduction()) {
      // The address is still being set up. Signing in from the server's own
      // address now would teach LinkedIn a location the account will never use
      // again, which is worse than waiting a minute.
      //
      // Deliberately not counted as an attempt: nothing was tried, and burning
      // the retry budget on the supplier being slow would strand an account
      // that has nothing wrong with it.
      await progress(
        account.id,
        "Setting up the address this account will always sign in from."
      );
      log("sign-in waiting for the account's address", { accountId: account.id });
      return;
    }
  }

  await attemptStarts(account.id);
  await progress(
    account.id,
    account.attempts === 0
      ? "Opening a browser on this account's own address."
      : `Trying the sign-in again, attempt ${account.attempts + 1} of ${MAX_ATTEMPTS}.`
  );

  const session = await openSession(
    {
      linkedinAccountId: account.id,
      country: account.country,
      timezone: timezoneForCountry(account.country),
    },
    address
  );

  const run = currentRun();
  let closed = false;
  const closeOnce = async () => {
    if (closed) return;
    closed = true;
    await closeSession(session);
  };
  if (run) run.closeBrowser = closeOnce;

  try {
    await progress(account.id, "Signing in to LinkedIn.");
    await signIn({
      page: session.page,
      accountId: account.id,
      workspaceId: account.workspaceId,
      email: account.email,
      password: account.password,
      totpSecret: account.totpSecret,
    });

    // Only if it worked. signIn writes the status itself and leaves the account
    // where it was on a challenge it could not finish.
    if (await isSignedIn(session.context)) {
      // Before the profile read, because the dialog is watching this row and
      // the name and picture take a few more seconds to arrive.
      await db().execute({
        sql: `UPDATE linkedin_accounts SET sign_in_attempts = 0, updated_at = ? WHERE id = ?`,
        args: [Math.floor(Date.now() / 1000), account.id],
      });
      await ensureProfileCaptured(session.page, account.id);
      log("account signed in", { accountId: account.id });
    }
  } finally {
    await closeOnce();
  }
}

export async function connectPass(): Promise<void> {
  const waiting = await loadWaiting();
  if (!waiting.length) return;

  log("accounts waiting to sign in", { count: waiting.length });

  for (const account of waiting) {
    let lease;
    try {
      lease = takeSlot(account.id);
    } catch (error) {
      if (error instanceof NoSlotError) continue;
      throw error;
    }
    try {
      await withWatchdog(() => connectOne(account));
    } catch (error) {
      logError("sign-in failed", error, { accountId: account.id });
      // The attempt was counted before it ran, so this is the last one when the
      // count has reached the ceiling. Saying so beats a spinner that never
      // resolves and a loop that never stops.
      if (account.attempts + 1 >= MAX_ATTEMPTS) {
        await givenUp(account.id);
      } else {
        await progress(
          account.id,
          `That sign-in did not go through. Trying again in ${Math.round((BACKOFF_SECONDS[account.attempts + 1] ?? 600) / 60)} minutes.`
        );
      }
    } finally {
      lease.release();
    }
  }
}
