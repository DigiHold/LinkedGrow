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
}

async function loadWaiting(): Promise<Waiting[]> {
  const { rows } = await db().execute(
    `SELECT id, workspace_id, email, password_encrypted, totp_secret_encrypted, country
       FROM linkedin_accounts
      WHERE status = 'pending'
      ORDER BY created_at
      LIMIT 3`
  );
  const out: Waiting[] = [];
  for (const row of rows) {
    const password = decryptSecret(String(row.password_encrypted ?? ""));
    if (!password) {
      log("account has no readable password, leaving it alone", { accountId: String(row.id) });
      continue;
    }
    const totp = row.totp_secret_encrypted
      ? decryptSecret(String(row.totp_secret_encrypted))
      : "";
    out.push({
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      email: String(row.email),
      password,
      totpSecret: totp || null,
      country: String(row.country),
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
      log("sign-in waiting for the account's address", { accountId: account.id });
      return;
    }
  }

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
    } finally {
      lease.release();
    }
  }
}
