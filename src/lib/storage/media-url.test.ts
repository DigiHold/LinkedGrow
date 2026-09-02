import { test } from "node:test";
import assert from "node:assert/strict";
import { absoluteMediaUrl } from "./index";

test("relative local urls get the instance origin, absolute urls pass through", () => {
  const previous = { app: process.env.APP_URL, next: process.env.NEXT_PUBLIC_APP_URL };
  delete process.env.NEXT_PUBLIC_APP_URL;
  process.env.APP_URL = "https://linkedgrow.example.com/";
  try {
    assert.equal(
      absoluteMediaUrl("/uploads/users/u1/uploads/a.webp"),
      "https://linkedgrow.example.com/uploads/users/u1/uploads/a.webp"
    );
    assert.equal(absoluteMediaUrl("https://bucket.example.com/a.webp"), "https://bucket.example.com/a.webp");
  } finally {
    if (previous.app === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous.app;
    if (previous.next !== undefined) process.env.NEXT_PUBLIC_APP_URL = previous.next;
  }
});
