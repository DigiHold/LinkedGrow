import { join } from "node:path";
import { createClient } from "@libsql/client";
import { runMigrations } from "./migrate";

// Script entry for `npm run db:migrate`. Kept apart from migrate.ts so importing the runner never runs it.
async function main(): Promise<void> {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:linkedgrow.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  const applied = await runMigrations(client, join(process.cwd(), "docker", "migrations"));
  process.stdout.write(`applied ${applied.length} migration(s): ${applied.join(", ") || "none"}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
