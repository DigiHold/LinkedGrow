import { test } from "node:test";
import assert from "node:assert/strict";
import { registrationPolicyFor } from "./registration";

test("self hosted: first account is the administrator, the switch closes later sign ups", () => {
  const e = "self-hosted" as const;
  assert.deepEqual(registrationPolicyFor(e, 0, { setupCompleted: true, allowSignups: false }), {
    plan: "business",
    isAdmin: true,
    closed: false,
  });
  assert.deepEqual(registrationPolicyFor(e, 1, { setupCompleted: false, allowSignups: false }), {
    plan: "business",
    isAdmin: false,
    closed: false,
  });
  assert.deepEqual(registrationPolicyFor(e, 1, { setupCompleted: true, allowSignups: false }), {
    plan: "business",
    isAdmin: false,
    closed: true,
  });
  assert.deepEqual(registrationPolicyFor(e, 1, { setupCompleted: true, allowSignups: true }), {
    plan: "business",
    isAdmin: false,
    closed: false,
  });
});

test("cloud: plan free, never admin, never closed", () => {
  assert.deepEqual(registrationPolicyFor("cloud", 0, { setupCompleted: true, allowSignups: false }), {
    plan: "free",
    isAdmin: false,
    closed: false,
  });
});
