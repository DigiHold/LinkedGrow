import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStringArray, parseRecordArray, capStrings, normalizePosts } from "./ai-json";

const HOOK = "El algoritmo de LinkedIn cambió en 2026.\nY casi nadie se dio cuenta.";

function post(n: number): string {
  return `${HOOK}\n\nEste es el cuerpo del post número ${n}, con una idea concreta y un ejemplo.\n\nGuarda esto para después.`;
}

test("a clean array comes back untouched", () => {
  const raw = JSON.stringify([post(1), post(2), post(3)]);
  assert.deepEqual(normalizePosts(parseStringArray(raw), 3, HOOK), [post(1), post(2), post(3)]);
});

test("markdown fences and prose around the array are stripped", () => {
  const raw = `Here are your posts:\n\`\`\`json\n${JSON.stringify([post(1), post(2)])}\n\`\`\`\nHope that helps.`;
  assert.deepEqual(parseStringArray(raw), [post(1), post(2)]);
});

test("raw newlines inside the strings are repaired instead of throwing", () => {
  const raw = `["Line one\nLine two", "Another\npost"]`;
  assert.deepEqual(parseStringArray(raw), ["Line one\nLine two", "Another\npost"]);
});

test("an object wrapper still yields the array", () => {
  const raw = JSON.stringify({ posts: [post(1), post(2), post(3)] });
  assert.equal(parseStringArray(raw).length, 3);
});

test("non-string entries are dropped", () => {
  const raw = JSON.stringify([post(1), 42, null, { text: post(2) }]);
  assert.deepEqual(parseStringArray(raw), [post(1)]);
});

test("unparseable output throws", () => {
  assert.throws(() => parseStringArray("I cannot help with that request."));
});

// The reported bug: one array entry per LINE instead of one per post, so a
// wizard that promised 3 posts rendered 30 cards.
test("one entry per line is rebuilt into whole posts", () => {
  const lines: string[] = [];
  for (let n = 1; n <= 3; n++) {
    for (const line of post(n).split("\n")) lines.push(line);
  }
  assert.equal(lines.length, 18);

  const rebuilt = normalizePosts(lines, 3, HOOK);
  assert.equal(rebuilt.length, 3);
  assert.deepEqual(rebuilt, [post(1), post(2), post(3)]);
});

test("more whole posts than asked are cut to the count, not merged", () => {
  const six = [1, 2, 3, 4, 5, 6].map(post);
  assert.deepEqual(normalizePosts(six, 3, HOOK), [post(1), post(2), post(3)]);
});

test("fragments that carry no hook line become one post rather than three orphan lines", () => {
  const fragments = ["Primera línea suelta.", "", "Segunda línea suelta.", "", "Tercera línea.", "Cuarta línea."];
  const out = normalizePosts(fragments, 3, HOOK);
  assert.equal(out.length, 1);
  assert.match(out[0], /Primera línea suelta\./);
  assert.match(out[0], /Cuarta línea\./);
});

test("fewer posts than asked are returned as they are", () => {
  assert.deepEqual(normalizePosts([post(1), post(2)], 3, HOOK), [post(1), post(2)]);
});

test("empty entries never reach the screen", () => {
  assert.deepEqual(normalizePosts([post(1), "", "   "], 3, HOOK), [post(1)]);
});

test("objects missing a field the screen reads are dropped, not rendered", () => {
  const raw = JSON.stringify([
    { firstLine: "One", secondLine: "Two" },
    { firstLine: "Only one line" },
    "a bare string where an object was asked for",
    { firstLine: "Three", secondLine: "Four" },
  ]);
  const hooks = parseRecordArray<{ firstLine: string; secondLine: string }>(raw, [
    "firstLine",
    "secondLine",
  ]);
  assert.equal(hooks.length, 2);
  assert.equal(hooks[1]?.secondLine, "Four");
});

test("a list never shows more than it asked for", () => {
  const many = Array.from({ length: 30 }, (_, i) => `Idea ${i + 1}`);
  assert.deepEqual(capStrings(many, 5), ["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"]);
  assert.deepEqual(capStrings(["  ", "Idea 1", ""], 5), ["Idea 1"]);
});
