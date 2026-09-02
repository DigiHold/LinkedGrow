import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

// Plain JavaScript twin of src/lib/db/migrate.ts for the app container, where tsx does not exist.
const dir = process.argv[2] || join(process.cwd(), "docker", "migrations");
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:linkedgrow.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
const split = (sql) =>
  sql.split(/\r?\n/).filter((l) => !l.trim().startsWith("--")).join("\n")
    .split(/;\s*(?:\r?\n|$)/).map((s) => s.trim()).filter((s) => s.length > 0);
// sqld takes a few seconds to open after its container starts, and compose
// has no way to wait for it, so the first statement is the wait.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
for (let attempt = 1; ; attempt++) {
  try {
    await client.execute("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
    break;
  } catch (error) {
    if (attempt >= 30) throw error;
    process.stdout.write(`waiting for the database (${attempt}/30)\n`);
    await sleep(2000);
  }
}
const done = new Set((await client.execute("SELECT id FROM schema_migrations")).rows.map((r) => String(r.id)));
const files = readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
const applied = [];
for (const file of files) {
  const id = file.replace(/\.sql$/, "");
  if (done.has(id)) continue;
  const statements = split(readFileSync(join(dir, file), "utf8"));
  await client.batch([...statements, { sql: "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)", args: [id, new Date().toISOString()] }], "write");
  applied.push(id);
}
process.stdout.write(`applied ${applied.length} migration(s): ${applied.join(", ") || "none"}\n`);
