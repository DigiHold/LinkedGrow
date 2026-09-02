import { test } from "node:test";
import assert from "node:assert/strict";
import { appUrl, cap, email, hostname, httpUrl, port, secret, text, timezone, ValidationError } from "./fields";

test("secret: absent leaves alone, empty clears, text replaces", () => {
  assert.equal(secret(undefined, "Key"), undefined);
  assert.equal(secret("", "Key"), null);
  assert.equal(secret("sk-live", "Key"), "sk-live");
  assert.throws(() => secret(12, "Key"), ValidationError);
});

test("app url keeps the origin only", () => {
  assert.equal(appUrl("https://Example.com/"), "https://example.com");
  assert.equal(appUrl("http://localhost:3125"), "http://localhost:3125");
  assert.throws(() => appUrl("https://example.com/app"), ValidationError);
  assert.throws(() => appUrl("ftp://example.com"), ValidationError);
  assert.throws(() => appUrl("example.com"), ValidationError);
});

test("http url drops the trailing slash and checks the scheme", () => {
  assert.equal(httpUrl("https://s3.example.com/", "Endpoint", false), "https://s3.example.com");
  assert.throws(() => httpUrl("http://s3.example.com", "Endpoint", false), ValidationError);
  assert.equal(httpUrl("http://files.example.com/bucket/", "Public URL", true), "http://files.example.com/bucket");
});

test("text, email, hostname, port, cap and timezone bounds", () => {
  assert.equal(text("  Probe  ", "Name", 80), "Probe");
  assert.throws(() => text("", "Name", 80), ValidationError);
  assert.throws(() => text("x".repeat(81), "Name", 80), ValidationError);
  assert.equal(email(" Admin@Example.com ", "Admin email"), "admin@example.com");
  assert.throws(() => email("nope", "Admin email"), ValidationError);
  assert.equal(hostname("smtp.Example.com", "Host"), "smtp.example.com");
  assert.throws(() => hostname("smtp example", "Host"), ValidationError);
  assert.equal(port("587", "Port"), 587);
  assert.throws(() => port(70000, "Port"), ValidationError);
  assert.equal(cap("1.5", "Daily"), 1.5);
  assert.throws(() => cap(0, "Daily"), ValidationError);
  assert.equal(timezone("Europe/Paris"), "Europe/Paris");
  assert.throws(() => timezone("Mars/Olympus"), ValidationError);
});
