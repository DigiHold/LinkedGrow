import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResendRequest, buildBrevoRequest } from "./providers";

test("resend request", () => {
  const r = buildResendRequest({ apiKey: "re_x", from: { name: "LG", address: "no@x.test" }, to: "a@b.co", subject: "s", html: "<p>h</p>", text: "h" });
  assert.equal(r.url, "https://api.resend.com/emails");
  assert.equal(r.headers.Authorization, "Bearer re_x");
  const body = JSON.parse(r.body);
  assert.equal(body.from, "LG <no@x.test>");
  assert.deepEqual(body.to, ["a@b.co"]);
});

test("brevo request keeps today's shape", () => {
  const r = buildBrevoRequest({ apiKey: "k", from: { name: "LG", address: "no@x.test" }, to: "a@b.co", subject: "s", html: "<p>h</p>", replyTo: "r@x.test" });
  assert.equal(r.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(r.headers["api-key"], "k");
  const body = JSON.parse(r.body);
  assert.deepEqual(body.sender, { name: "LG", email: "no@x.test" });
  assert.deepEqual(body.replyTo, { email: "r@x.test" });
});
