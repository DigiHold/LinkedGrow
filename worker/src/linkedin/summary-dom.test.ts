import { test } from "node:test";
import assert from "node:assert/strict";
import { toNumber } from "./summary-dom.ts";

/**
 * The numbers are read off LinkedIn's own component keys, so nothing here has a language. What is
 * still worth pinning is how a count is written, which does change with the locale: a thousand is
 * "1,204" in English, "1.204" in German and "1 204" in French, with a narrow no break space.
 */
test("a thousand is read the same in every locale", () => {
  for (const written of ["1,204", "1.204", "1 204", "1 204", "1 204"]) {
    assert.equal(toNumber(written), 1204, written);
  }
});

test("an abbreviation keeps its decimal, whichever glyph carries it", () => {
  assert.equal(toNumber("2.4K"), 2400);
  assert.equal(toNumber("2,4 k"), 2400);
  assert.equal(toNumber("1.1M"), 1_100_000);
});

/** Null and zero are different answers: one is "we could not read", the other is "nobody saw it". */
test("anything that is not a count answers null", () => {
  assert.equal(toNumber(""), null);
  assert.equal(toNumber("   "), null);
  assert.equal(toNumber("Impresiones"), null);
  assert.equal(toNumber("76%"), null);
  assert.equal(toNumber("3d"), null);
});

test("a plain count survives", () => {
  assert.equal(toNumber("51"), 51);
  assert.equal(toNumber("0"), 0);
});
