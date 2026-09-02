import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readObject } from "./local.ts";

/**
 * The read the publisher does for an attachment on this instance's own disk.
 * It is worth as much as its guard: a key built from a URL somebody else
 * typed must never reach a file outside the root.
 */
test("readObject answers the file under the root, null for a missing one, and refuses to leave it", async () => {
  const root = mkdtempSync(join(tmpdir(), "lg-worker-store-"));
  process.env.STORAGE_ROOT = root;
  mkdirSync(join(root, "users/u1/uploads"), { recursive: true });
  writeFileSync(join(root, "users/u1/uploads/a.txt"), "hi");

  assert.equal((await readObject("users/u1/uploads/a.txt"))?.toString(), "hi");
  assert.equal(await readObject("users/u1/uploads/missing.txt"), null);
  assert.equal(await readObject("users/u1/uploads"), null);

  await assert.rejects(readObject(""), /outside/);
  await assert.rejects(readObject("../escape"), /outside/);
  await assert.rejects(readObject("users/../../x"), /outside/);
  await assert.rejects(readObject("/etc/passwd"), /outside/);
  await assert.rejects(readObject("users/u1/uploads/a\0.txt"), /outside/);
});
