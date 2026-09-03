import { test } from "node:test";
import assert from "node:assert/strict";
import { absoluteMediaUrl } from "./index";

test("relative local urls get the origin the caller resolved, absolute urls pass through", () => {
  const base = "https://linkedgrow.example.com";
  assert.equal(
    absoluteMediaUrl("/uploads/users/u1/uploads/a.webp", base),
    "https://linkedgrow.example.com/uploads/users/u1/uploads/a.webp"
  );
  assert.equal(absoluteMediaUrl("https://bucket.example.com/a.webp", base), "https://bucket.example.com/a.webp");
});

test("a second instance address gives a second answer for the same stored key", () => {
  assert.equal(absoluteMediaUrl("/uploads/a.webp", "http://192.0.2.10:3000"), "http://192.0.2.10:3000/uploads/a.webp");
});
