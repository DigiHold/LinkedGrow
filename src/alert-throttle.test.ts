import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldAlertOnFailure,
  shouldRecordFailureEvent,
  ALERT_AFTER_FAILURES,
} from "./worker.ts";

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

/**
 * A sustained outage wrote one event per failed pass and the alert cron mails
 * one email per event: 17 emails for one outage on 2026-08-15. The event is
 * recorded exactly once per streak, at the threshold.
 */
test("the error event is recorded exactly at the threshold", () => {
  assert.equal(shouldRecordFailureEvent(ALERT_AFTER_FAILURES - 1), false);
  assert.equal(shouldRecordFailureEvent(ALERT_AFTER_FAILURES), true);
});

test("an outage that keeps failing past the threshold records nothing more", () => {
  for (let n = ALERT_AFTER_FAILURES + 1; n <= ALERT_AFTER_FAILURES + 200; n++) {
    assert.equal(shouldRecordFailureEvent(n), false);
  }
});
