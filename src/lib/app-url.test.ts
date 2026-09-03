import test from "node:test";
import assert from "node:assert/strict";
import { appUrlFromHeaders, isSecureRequest, normalizeOrigin } from "./app-url";

const h = (values: Record<string, string>) => new Headers(values);

test("normalizeOrigin drops the trailing slashes", () => {
  assert.equal(normalizeOrigin("https://example.com/"), "https://example.com");
  assert.equal(normalizeOrigin("  http://example.com//  "), "http://example.com");
});

test("appUrlFromHeaders reads the forwarded pair a reverse proxy sets", () => {
  assert.equal(
    appUrlFromHeaders(h({ "x-forwarded-host": "leads.acme.test", "x-forwarded-proto": "https", host: "app:3000" })),
    "https://leads.acme.test"
  );
});

test("appUrlFromHeaders falls back to the host header over plain http", () => {
  assert.equal(appUrlFromHeaders(h({ host: "192.0.2.10:3000" })), "http://192.0.2.10:3000");
});

test("appUrlFromHeaders takes the first entry of a chained header", () => {
  assert.equal(
    appUrlFromHeaders(h({ "x-forwarded-host": "leads.acme.test, inner.local", "x-forwarded-proto": "https, http" })),
    "https://leads.acme.test"
  );
});

test("appUrlFromHeaders refuses a header it cannot turn into an origin", () => {
  assert.equal(appUrlFromHeaders(h({})), null);
  assert.equal(appUrlFromHeaders(h({ host: "a b" })), null);
  assert.equal(appUrlFromHeaders(h({ host: "leads.acme.test", "x-forwarded-proto": "ftp" })), null);
});

test("isSecureRequest prefers the forwarded protocol over the url", () => {
  assert.equal(isSecureRequest(h({ "x-forwarded-proto": "https" }), "http://app:3000/api/auth/session"), true);
  assert.equal(isSecureRequest(h({ "x-forwarded-proto": "http" }), "https://app:3000/api/auth/session"), false);
  assert.equal(isSecureRequest(h({}), "https://leads.acme.test/api/auth/session"), true);
  assert.equal(isSecureRequest(h({}), "not a url"), false);
});
