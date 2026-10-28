import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * A session that dies at the address check closes the browser it launched.
 *
 * Read off the source, the way the session rules in safety/human-input.test.ts are, because the
 * failure needs a real Chrome behind a dead proxy. On 2026-10-28 one account's address answered
 * neither lookup, the check threw before the comparison that closes the browser, and the agent pass
 * left a Chrome behind every five minutes: 27 of them on one profile by 11:00.
 */

const src = readFileSync(new URL("./driver.ts", import.meta.url), "utf8");

test("a session whose address cannot be read closes the browser it launched", () => {
  const call = src.indexOf("await publicIp(page)");
  assert.ok(call > 0, "the session never reads its own address");
  assert.match(
    src.slice(call, call + 700),
    /catch[\s\S]{0,500}?context\.close\(\)/,
    "a failed address lookup leaves the browser open"
  );
});
