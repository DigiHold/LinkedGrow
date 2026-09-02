import { test } from "node:test";
import assert from "node:assert/strict";
import {
  effectivePlanFor,
  canAccessFeatureFor,
  agentQuotaForEdition,
  hasAgentSubscriptionFor,
  effectiveAgentQuotaFor,
} from "./plans";

test("self hosted: everything is business and unlimited", () => {
  const e = "self-hosted" as const;
  assert.equal(effectivePlanFor(e, { plan: "free", isAdmin: false }), "business");
  assert.equal(canAccessFeatureFor(e, "free", "abTesting"), true);
  assert.equal(agentQuotaForEdition(e, "free"), Number.MAX_SAFE_INTEGER);
  assert.equal(hasAgentSubscriptionFor(e, { stripeSubscriptionId: null, isAdmin: false }), true);
  assert.equal(effectiveAgentQuotaFor(e, "free", 0), Number.MAX_SAFE_INTEGER);
});

test("cloud: today's answers are unchanged", () => {
  const c = "cloud" as const;
  assert.equal(effectivePlanFor(c, { plan: "free", isAdmin: false }), "free");
  assert.equal(effectivePlanFor(c, { plan: "free", isAdmin: true }), "business");
  assert.equal(canAccessFeatureFor(c, "pro", "abTesting"), false);
  assert.equal(canAccessFeatureFor(c, "business", "abTesting"), true);
  assert.equal(agentQuotaForEdition(c, "pro"), 2);
  assert.equal(hasAgentSubscriptionFor(c, { stripeSubscriptionId: null, isAdmin: false }), false);
  assert.equal(hasAgentSubscriptionFor(c, { stripeSubscriptionId: "sub_1", isAdmin: false }), true);
  assert.equal(effectiveAgentQuotaFor(c, "business", 2), 5);
  assert.equal(effectiveAgentQuotaFor(c, "free", 4), 0);
});
