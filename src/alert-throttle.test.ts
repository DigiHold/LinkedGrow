import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldAlertOnFailure, ALERT_AFTER_FAILURES } from "./worker.ts";

/**
 * A restart that kills the browser mid-pass wrote a customer "Your agent
 * stopped" email on 2026-08-11 about a healthy account. One transient must
 * never alert; only a failure that persists across passes does.
 */
test("a single failed pass never alerts", () => {
  assert.equal(shouldAlertOnFailure(1), false);
});

test("two consecutive failures alert", () => {
  assert.equal(shouldAlertOnFailure(2), true);
});

test("the threshold is at least two, so no isolated transient can reach it", () => {
  assert.ok(ALERT_AFTER_FAILURES >= 2);
  assert.equal(shouldAlertOnFailure(ALERT_AFTER_FAILURES - 1), false);
});
