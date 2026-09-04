/**
 * A throwaway instance for the country picker run, ready to sign in to.
 *
 * The wizard spec next door proves the setup wizard, so this one does not: it
 * writes the finished instance_settings row directly and opens sign ups, so the
 * test starts where it has something to say. It also plants one LinkedIn
 * account, because an agent has to be hung on one and connecting a real account
 * in a test is not a thing anybody should do.
 */
import { rmSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { runMigrations } from "../../src/lib/db/migrate";

const DB_FILE = "/tmp/lg-countries.db";

async function main(): Promise<void> {
  for (const path of [DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`, `${DB_FILE}-journal`]) {
    rmSync(path, { recursive: true, force: true });
  }
  const client = createClient({ url: `file:${DB_FILE}` });
  const applied = await runMigrations(client, join(process.cwd(), "docker", "migrations"));
  const now = Math.floor(Date.now() / 1000);
  await client.execute({
    sql: `INSERT INTO instance_settings
            (id, setup_completed, instance_name, allow_signups, created_at, updated_at)
          VALUES (1, 1, 'Country probe', 1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET setup_completed = 1, allow_signups = 1`,
    args: [now, now],
  });
  client.close();
  process.stdout.write(`country run: fresh database, applied ${applied.length} migration(s)\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`country run: reset failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
