import { createClient } from "@libsql/client";

/*
 * Clears two factor on one account, so an administrator who lost the
 * authenticator can sign in again with the password alone.
 *
 *   npm run db:clear-2fa -- you@example.com
 *
 * On a stack started by install.sh, from the folder holding docker-compose.yml:
 *
 *   docker compose exec app npm run db:clear-2fa -- you@example.com
 *
 * Plain JavaScript on purpose: the app image ships the built server without
 * tsx, the same reason docker/migrate.mjs exists next to src/lib/db/migrate.ts.
 */

const email = (process.argv[2] || "").trim();

if (!email) {
  process.stderr.write("usage: npm run db:clear-2fa -- you@example.com\n");
  process.exit(1);
}

// No fallback to a local file. Run from the wrong folder and that fallback
// created an empty database, found no account in it, and said so as though the
// address were wrong. Compose sets this variable on the app service, so the
// documented command already has it.
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  process.stderr.write(
    "TURSO_DATABASE_URL is not set, so this command has no database to open.\n" +
      "Run it inside the stack, where compose sets it for you:\n" +
      "  docker compose exec app npm run db:clear-2fa -- you@example.com\n",
  );
  process.exit(1);
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

async function ask(sql, args) {
  try {
    return await client.execute({ sql, args });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(`could not read the database at ${url}: ${reason}\n`);
    process.exit(1);
  }
}

const found = await ask(
  "SELECT id, email, two_factor_enabled FROM users WHERE email = ? COLLATE NOCASE",
  [email],
);

if (found.rows.length === 0) {
  process.stderr.write(
    `no account in the database at ${url} uses ${email}, nothing was changed\n`,
  );
  process.exit(1);
}

// The unique index on email compares byte for byte, so two rows can differ by
// capitalisation alone while this lookup matches both. Clearing the first one
// and reporting success would leave the account somebody asked about untouched.
if (found.rows.length > 1) {
  process.stderr.write(
    `${found.rows.length} accounts use ${email} with different capitalisation, so nothing was changed:\n` +
      found.rows.map((r) => `  ${r.email} (id ${r.id})\n`).join("") +
      "Resolve the duplicate in the database first, then run this again.\n",
  );
  process.exit(1);
}

const account = found.rows[0];
const wasEnabled = Number(account.two_factor_enabled) === 1;

await ask(
  // password_changed_at moves so every session issued before this moment stops
  // working, which is what the Settings screen does when it switches two factor
  // off. Recovering an account should not leave an older session alive.
  "UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, password_changed_at = ? WHERE id = ?",
  [new Date().toISOString(), String(account.id)],
);

process.stdout.write(
  wasEnabled
    ? `two factor cleared for ${account.email}\n`
    : `two factor was already off for ${account.email}, the stored secret was cleared anyway\n`,
);
process.stdout.write("sign in with the password alone, then switch two factor back on from Settings\n");
process.stdout.write("every session opened before now was signed out\n");
