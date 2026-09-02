import { test } from "node:test";
import assert from "node:assert/strict";
import { dueJobs, SCHEDULE } from "./pass.ts";
import { renewProxiesPass } from "../tools/renew-proxies.ts";
import { balanceTopupPass } from "../tools/balance-topup.ts";

const DAY = 24 * 60 * 60_000;

test("every job is due when it has never run, and only its interval later", () => {
  const now = Date.UTC(2026, 8, 2, 8, 0, 0);
  const never = dueJobs({}, now);
  assert.deepEqual(never.map((j) => j.path).sort(), SCHEDULE.map((j) => j.path).sort());
  const last: Record<string, number> = {};
  for (const j of SCHEDULE) last[j.path] = now;
  assert.deepEqual(dueJobs(last, now + 60_000), []);
  const alerts = SCHEDULE.find((j) => j.path === "/api/cron/agent-alerts");
  assert.ok(alerts);
  assert.deepEqual(dueJobs(last, now + alerts.everyMs + 1).map((j) => j.path), ["/api/cron/agent-alerts"]);
});

test("the schedule holds the app routes and the two supplier jobs the cloud runs from cron.d", () => {
  assert.deepEqual(
    SCHEDULE.map((j) => j.path).sort(),
    [
      "/api/cron/agent-alerts",
      "/api/cron/cleanup-media",
      "/api/cron/leads-digest",
      "/api/cron/proxy-watchdog",
      "/api/cron/selector-health",
      "worker:balance-topup",
      "worker:renew-proxies",
    ]
  );
  // The routes are posted to the app; the worker: jobs run in process, daily.
  for (const j of SCHEDULE) {
    if (j.path.startsWith("/api/")) assert.equal(j.run, undefined, `${j.path} must be posted to the app`);
  }
  const renew = SCHEDULE.find((j) => j.path === "worker:renew-proxies");
  const topup = SCHEDULE.find((j) => j.path === "worker:balance-topup");
  assert.equal(renew?.run, renewProxiesPass);
  assert.equal(renew?.everyMs, DAY);
  assert.equal(topup?.run, balanceTopupPass);
  assert.equal(topup?.everyMs, DAY);
});
