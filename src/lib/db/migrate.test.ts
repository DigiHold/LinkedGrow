import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createClient } from "@libsql/client";
import { runMigrations } from "./migrate";

test("migrations apply once, in order, and are recorded", async () => {
  const dir = mkdtempSync(join(tmpdir(), "lg-mig-"));
  writeFileSync(join(dir, "001_a.sql"), "CREATE TABLE IF NOT EXISTS a (id INTEGER PRIMARY KEY);");
  writeFileSync(join(dir, "002_b.sql"), "-- a comment line\nCREATE TABLE IF NOT EXISTS b (id INTEGER PRIMARY KEY);\nINSERT INTO b (id) VALUES (1);");
  const client = createClient({ url: `file:${join(dir, "t.db")}` });
  const first = await runMigrations(client, dir);
  assert.deepEqual(first, ["001_a", "002_b"]);
  const second = await runMigrations(client, dir);
  assert.deepEqual(second, []);
  const rows = await client.execute("SELECT count(*) AS n FROM b");
  assert.equal(Number(rows.rows[0]?.n), 1);
  const recorded = await client.execute("SELECT id FROM schema_migrations ORDER BY id");
  assert.deepEqual(recorded.rows.map((r) => r.id), ["001_a", "002_b"]);
});

test("the real migrations apply to an empty database", async () => {
  const dir = mkdtempSync(join(tmpdir(), "lg-real-"));
  const client = createClient({ url: `file:${join(dir, "real.db")}` });
  const applied = await runMigrations(client, join(process.cwd(), "docker", "migrations"));
  assert.ok(applied.includes("001_init") && applied.includes("002_instance_settings"));
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const names = tables.rows.map((r) => String(r.name));
  for (const t of ["users", "linkedin_accounts", "agents", "posts", "account_reading", "agent_meta", "instance_settings", "schema_migrations"]) {
    assert.ok(names.includes(t), `missing table ${t}`);
  }
  const row = await client.execute("SELECT id, setup_completed FROM instance_settings");
  assert.equal(Number(row.rows[0]?.id), 1);
});
