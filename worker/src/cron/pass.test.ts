import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { dueJobs, loadLastRuns, localTime, saveLastRun, SCHEDULE } from "./pass.ts";
import { setDbForTests, db as sharedDb } from "../db.ts";
import { renewProxiesPass } from "../tools/renew-proxies.ts";
import { balanceTopupPass } from "../tools/balance-topup.ts";

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;
const DIGEST = "/api/cron/leads-digest";

// 2026-09-02 is a Wednesday, 2026-09-07 the Monday after it.
const wednesday = Date.UTC(2026, 8, 2, 8, 0, 0);
const monday0805 = Date.UTC(2026, 8, 7, 8, 5, 0);
const monday0900 = Date.UTC(2026, 8, 7, 9, 0, 0);
const nextMonday0800 = Date.UTC(2026, 8, 14, 8, 0, 0);

const paths = (jobs: { path: string }[]) => jobs.map((j) => j.path).sort();
const allBut = (path: string) => paths(SCHEDULE.filter((j) => j.path !== path));

test("every interval job is due when it has never run, and only its interval later", () => {
  assert.deepEqual(paths(dueJobs({}, wednesday)), allBut(DIGEST));
  const last: Record<string, number> = {};
  for (const j of SCHEDULE) last[j.path] = wednesday;
  assert.deepEqual(dueJobs(last, wednesday + 60_000), []);
  const alerts = SCHEDULE.find((j) => j.path === "/api/cron/agent-alerts");
  assert.ok(alerts?.everyMs);
  assert.deepEqual(paths(dueJobs(last, wednesday + alerts.everyMs + 1)), ["/api/cron/agent-alerts"]);
});

test("a Wednesday tick never fires the digest, whatever the last run says", () => {
  assert.equal(dueJobs({}, wednesday).some((j) => j.path === DIGEST), false);
  assert.equal(dueJobs({ [DIGEST]: wednesday - 30 * DAY }, wednesday).some((j) => j.path === DIGEST), false);
});

test("the digest fires once on Monday from 08:00 and not again the same week", () => {
  assert.equal(dueJobs({}, Date.UTC(2026, 8, 7, 7, 59, 0)).some((j) => j.path === DIGEST), false);
  assert.equal(dueJobs({}, monday0805).some((j) => j.path === DIGEST), true);
  const ran = { [DIGEST]: monday0805 };
  assert.equal(dueJobs(ran, monday0900).some((j) => j.path === DIGEST), false);
  assert.equal(dueJobs(ran, monday0805 + 6 * DAY).some((j) => j.path === DIGEST), false);
  assert.equal(dueJobs(ran, nextMonday0800).some((j) => j.path === DIGEST), true);
  // Last Monday's run does not cover a Monday tick before 08:00 either way: the hour gate holds.
  assert.equal(dueJobs(ran, nextMonday0800 - 60_000).some((j) => j.path === DIGEST), false);
});

test("Monday 08:00 is read on the instance clock, not UTC", () => {
  // 06:05 UTC is 08:05 in Zurich in September.
  const zurichMorning = Date.UTC(2026, 8, 7, 6, 5, 0);
  assert.equal(dueJobs({}, zurichMorning, "Europe/Zurich").some((j) => j.path === DIGEST), true);
  assert.equal(dueJobs({}, zurichMorning, "UTC").some((j) => j.path === DIGEST), false);
  // 07:30 UTC on Monday is still Sunday evening in Los Angeles.
  assert.equal(localTime(Date.UTC(2026, 8, 7, 5, 30, 0), "America/Los_Angeles").weekday, 0);
  // A misspelt zone reads as UTC instead of stopping the loop.
  assert.deepEqual(localTime(monday0805, "Mars/Olympus"), localTime(monday0805, "UTC"));
});

test("a restart loads the persisted last runs and does not fire the digest again", async () => {
  setDbForTests(createClient({ url: ":memory:" }));
  await sharedDb().execute(`CREATE TABLE worker_flags (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER NOT NULL)`);
  await saveLastRun(DIGEST, monday0805);
  await saveLastRun("/api/cron/proxy-watchdog", monday0805);
  await saveLastRun("worker:renew-proxies", monday0805);
  const fresh = await loadLastRuns();
  assert.deepEqual(fresh, { [DIGEST]: monday0805, "/api/cron/proxy-watchdog": monday0805, "worker:renew-proxies": monday0805 });
  const { rows } = await sharedDb().execute(`SELECT key, value, updated_at FROM worker_flags WHERE key = 'cron-last-run:${DIGEST}'`);
  assert.equal(rows[0]?.value, String(monday0805));
  assert.equal(Number(rows[0]?.updated_at), Math.floor(monday0805 / 1000));

  const due = paths(dueJobs(fresh, monday0900));
  assert.equal(due.includes(DIGEST), false);
  assert.equal(due.includes("/api/cron/proxy-watchdog"), false);
  assert.equal(due.includes("worker:renew-proxies"), false);
  assert.equal(due.includes("/api/cron/agent-alerts"), true);
  // The interval jobs keep their interval from the persisted run.
  const tomorrow = paths(dueJobs(fresh, monday0805 + DAY));
  assert.equal(tomorrow.includes("/api/cron/proxy-watchdog"), true);
  assert.equal(tomorrow.includes("worker:renew-proxies"), true);
  assert.equal(tomorrow.includes(DIGEST), false);

  // Writing the same key again replaces the value rather than adding a row.
  await saveLastRun(DIGEST, nextMonday0800);
  assert.deepEqual((await loadLastRuns())[DIGEST], nextMonday0800);
  setDbForTests(null);
});

test("the schedule holds the app routes and the two supplier jobs the cloud runs from cron.d", () => {
  assert.deepEqual(paths(SCHEDULE), [
    "/api/cron/agent-alerts",
    "/api/cron/cleanup-media",
    "/api/cron/leads-digest",
    "/api/cron/proxy-watchdog",
    "/api/cron/selector-health",
    "worker:balance-topup",
    "worker:renew-proxies",
  ]);
  // The routes are posted to the app; the worker: jobs run in process, daily.
  for (const j of SCHEDULE) {
    if (j.path.startsWith("/api/")) assert.equal(j.run, undefined, `${j.path} must be posted to the app`);
    assert.ok(j.everyMs || j.weekly, `${j.path} needs a cadence`);
  }
  const digest = SCHEDULE.find((j) => j.path === DIGEST);
  assert.deepEqual(digest?.weekly, { weekday: 1, hour: 8 });
  assert.equal(digest?.everyMs, undefined);
  const renew = SCHEDULE.find((j) => j.path === "worker:renew-proxies");
  const topup = SCHEDULE.find((j) => j.path === "worker:balance-topup");
  assert.equal(renew?.run, renewProxiesPass);
  assert.equal(renew?.everyMs, DAY);
  assert.equal(topup?.run, balanceTopupPass);
  assert.equal(topup?.everyMs, DAY);
});
