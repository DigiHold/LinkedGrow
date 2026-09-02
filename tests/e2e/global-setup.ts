/**
 * A fresh instance for the wizard run.
 *
 * Removes the SQLite file and the uploads folder left by the previous run,
 * then builds the schema with the app's own migration runner. Started by the
 * webServer command in playwright.config.ts, before `next start`, so no
 * process holds the database open while it is replaced.
 */
import { rmSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { runMigrations } from "../../src/lib/db/migrate";

const DB_FILE = "/tmp/lg-wizard.db";
const UPLOADS_DIR = "/tmp/lg-wizard-uploads";

async function main(): Promise<void> {
  for (const path of [DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`, `${DB_FILE}-journal`, UPLOADS_DIR]) {
    rmSync(path, { recursive: true, force: true });
  }
  const client = createClient({ url: `file:${DB_FILE}` });
  const applied = await runMigrations(client, join(process.cwd(), "docker", "migrations"));
  client.close();
  process.stdout.write(`wizard run: fresh database, applied ${applied.length} migration(s)\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`wizard run: reset failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
