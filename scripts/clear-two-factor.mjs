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

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:linkedgrow.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const found = await client.execute({
  sql: "SELECT id, email, two_factor_enabled FROM users WHERE email = ? COLLATE NOCASE",
  args: [email],
});

if (found.rows.length === 0) {
  process.stderr.write(`no account on this instance uses ${email}, nothing was changed\n`);
  process.exit(1);
}

const account = found.rows[0];
const wasEnabled = Number(account.two_factor_enabled) === 1;

await client.execute({
  // password_changed_at moves so every session issued before this moment stops
  // working, which is what the Settings screen does when it switches two factor
  // off. Recovering an account should not leave an older session alive.
  sql: "UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, password_changed_at = ? WHERE id = ?",
  args: [new Date().toISOString(), String(account.id)],
});

process.stdout.write(
  wasEnabled
    ? `two factor cleared for ${account.email}\n`
    : `two factor was already off for ${account.email}, the stored secret was cleared anyway\n`,
);
process.stdout.write("sign in with the password alone, then switch two factor back on from Settings\n");
process.stdout.write("every session opened before now was signed out\n");
