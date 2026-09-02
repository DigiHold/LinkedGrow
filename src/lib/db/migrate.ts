import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Client } from "@libsql/client";

/**
 * Applies every numbered .sql file in a folder that has not been applied yet.
 *
 * Statements end with a semicolon at the end of a line. Comment lines (starting with --)
 * are dropped. Each file runs as one write batch and is recorded only when the whole
 * file succeeded, so a failure leaves nothing half applied.
 */
export function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function runMigrations(client: Client, dir: string): Promise<string[]> {
  await client.execute("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const done = new Set((await client.execute("SELECT id FROM schema_migrations")).rows.map((r) => String(r.id)));
  const files = readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
  const applied: string[] = [];
  for (const file of files) {
    const id = file.replace(/\.sql$/, "");
    if (done.has(id)) continue;
    const statements = splitStatements(readFileSync(join(dir, file), "utf8"));
    await client.batch(
      [...statements, { sql: "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)", args: [id, new Date().toISOString()] }],
      "write"
    );
    applied.push(id);
  }
  return applied;
}
