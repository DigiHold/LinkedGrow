import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalStorage } from "./local";

test("local driver writes, serves a url, and deletes", async () => {
  const root = mkdtempSync(join(tmpdir(), "lg-store-"));
  const s = new LocalStorage(root, "http://localhost:3000");
  const r = await s.put("users/u1/uploads/a.txt", Buffer.from("hi"), "text/plain");
  assert.equal(r.url, "http://localhost:3000/uploads/users/u1/uploads/a.txt");
  assert.equal(r.size, 2);
  assert.ok(existsSync(join(root, "users/u1/uploads/a.txt")));
  assert.equal(s.keyFromUrl("http://localhost:3000/uploads/users/u1/uploads/a.txt"), "users/u1/uploads/a.txt");
  assert.equal(s.keyFromUrl("https://elsewhere.test/x"), null);
  await assert.rejects(s.put("../escape", Buffer.from("x"), "text/plain"), /outside/);
  const copied = await s.copy("users/u1/uploads/a.txt", "users/u2/uploads/b.txt");
  assert.equal(copied.url, "http://localhost:3000/uploads/users/u2/uploads/b.txt");
  assert.equal(await s.deleteByPrefix("users/u2/"), 1);
  await s.delete("users/u1/uploads/a.txt");
  assert.ok(!existsSync(join(root, "users/u1/uploads/a.txt")));
  assert.equal(await s.presignUpload("users/u1/uploads/c.txt", "text/plain", 60), null);
});
