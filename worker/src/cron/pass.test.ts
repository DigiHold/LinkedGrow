import { test } from "node:test";
import assert from "node:assert/strict";
import { dueJobs, SCHEDULE } from "./pass.ts";

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
