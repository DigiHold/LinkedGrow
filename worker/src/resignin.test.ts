import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { setDbForTests, db, requestReSignIn } from "./db.ts";

/**
 * The deadlock that cost a content-only customer every post he scheduled.
 *
 * A session ends. The publish pass notices, and until 2026-09-02 that was the
 * end of it: the post was put back in the queue and the ACCOUNT was left
 * `active`. The sign-in pass reads only `pending`, so nothing ever signed the
 * account back in, the dashboard kept showing "Signed in and working", and the
 * publish loop reopened a browser on the customer's own residential address
 * every sixty seconds to rediscover the same dead session.
 *
 * Only the agent pass called requestSignIn, so an account with an agent healed
 * itself and an account without one never did. That is the difference these
 * tests exist to hold: the recovery has to be reachable without an agent.
 */

async function freshDb(): Promise<void> {
  setDbForTests(createClient({ url: ":memory:" }));
  await db().batch([
    `CREATE TABLE linkedin_accounts (
       id TEXT PRIMARY KEY,
       workspace_id TEXT NOT NULL,
       status TEXT NOT NULL DEFAULT 'active',
       status_reason TEXT,
       challenge_state TEXT NOT NULL DEFAULT 'none',
       sign_in_attempts INTEGER NOT NULL DEFAULT 0,
       last_check_at INTEGER,
       updated_at INTEGER NOT NULL DEFAULT 0)`,
  ]);
}

async function addAccount(
  id: string,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  await db().execute({
    sql: `INSERT INTO linkedin_accounts
            (id, workspace_id, status, challenge_state, sign_in_attempts, last_check_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      "workspace-1",
      String(overrides.status ?? "active"),
      String(overrides.challenge_state ?? "none"),
      Number(overrides.sign_in_attempts ?? 0),
      (overrides.last_check_at as number | null) ?? 1_700_000_000,
    ],
  });
}

async function read(id: string): Promise<Record<string, unknown>> {
  const { rows } = await db().execute({
    sql: `SELECT status, status_reason, sign_in_attempts, last_check_at
            FROM linkedin_accounts WHERE id = ?`,
    args: [id],
  });
  return rows[0] as unknown as Record<string, unknown>;
}

test("a signed-out account goes back in front of the sign-in pass", async () => {
  await freshDb();
  await addAccount("acc-1");

  const asked = await requestReSignIn("acc-1", "The session ended.");

  assert.equal(asked, true);
  const row = await read("acc-1");
  // 'pending' is the whole point: it is the only status loadWaiting() selects.
  assert.equal(row.status, "pending");
  assert.equal(row.status_reason, "The session ended.");
});

test("the retry budget is given back, so a fresh sign-out gets three tries", async () => {
  await freshDb();
  // An account that struggled to connect months ago and has been fine since.
  await addAccount("acc-1", { sign_in_attempts: 2 });

  await requestReSignIn("acc-1", "The session ended.");

  const row = await read("acc-1");
  assert.equal(Number(row.sign_in_attempts), 0);
  // Null rather than a timestamp, so the backoff does not hold the first retry
  // back by ten minutes for a sign-out that just happened.
  assert.equal(row.last_check_at, null);
});

test("an account answering a challenge is left alone", async () => {
  await freshDb();
  // A browser is sitting on LinkedIn's verification page right now and the
  // customer is typing the code. Pulling it to 'pending' would abandon that.
  await addAccount("acc-1", { challenge_state: "awaiting_code" });

  const asked = await requestReSignIn("acc-1", "The session ended.");

  assert.equal(asked, false);
  assert.equal((await read("acc-1")).status, "active");
});

test("an account already retrying is not restarted", async () => {
  await freshDb();
  // Two tries spent. Resetting the counter here would loop for ever, which is
  // the failure the counter was added to stop.
  await addAccount("acc-1", { status: "pending", sign_in_attempts: 2 });

  const asked = await requestReSignIn("acc-1", "The session ended.");

  assert.equal(asked, false);
  assert.equal(Number((await read("acc-1")).sign_in_attempts), 2);
});

test("an account LinkedIn has restricted is not dragged back into retrying", async () => {
  await freshDb();
  await addAccount("acc-1", { status: "restricted" });

  const asked = await requestReSignIn("acc-1", "The session ended.");

  assert.equal(asked, false);
  assert.equal((await read("acc-1")).status, "restricted");
});
