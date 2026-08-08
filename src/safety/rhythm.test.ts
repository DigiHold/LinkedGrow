import { test } from "node:test";
import assert from "node:assert/strict";
import { clockLabel, currentVisit, dayPlan, localClock, nextVisit } from "./rhythm.ts";

/**
 * The day that got an account restricted, written down as tests.
 *
 * On 2026-08-08 LinkedIn restricted a customer's account for reading too much
 * profile data. It had sent fifteen invitations in its life. What it had done
 * was wake up every five or six minutes for sixteen hours a day, every day, and
 * fifty-four of the gaps that day were exactly six minutes long. Every
 * assertion below is a property that day did not have.
 */

const ACCOUNT = "88c3d39f-1925-4ed8-a64e-a1f4d02c1b13";

/** Every day of a fixed month, so the assertions read a real spread rather than one lucky draw. */
function month(accountId = ACCOUNT): Array<{ day: string; weekday: number; plan: ReturnType<typeof dayPlan> }> {
  const days = [];
  // 2026-06-01 is a Monday, which makes the weekday arithmetic below plain.
  for (let i = 0; i < 30; i += 1) {
    const day = `2026-06-${String(i + 1).padStart(2, "0")}`;
    const weekday = ((i % 7) + 1) as number;
    days.push({ day, weekday, plan: dayPlan(accountId, day, weekday) });
  }
  return days;
}

test("a day holds a handful of visits, never a metronome", () => {
  for (const { day, weekday, plan } of month()) {
    assert.ok(plan.length <= 5, `${day} planned ${plan.length} visits`);
    if (weekday <= 5) assert.ok(plan.length <= 5 && plan.length >= 0, day);
  }
  const working = month().filter((d) => d.weekday <= 5);
  const busy = working.filter((d) => d.plan.length >= 3);
  assert.ok(
    busy.length >= working.length - 3,
    "almost every working day should carry three or more visits"
  );
});

test("the whole month costs fewer wake-ups than the incident cost in two days", () => {
  const visits = month().reduce((n, d) => n + d.plan.length, 0);
  // 2026-08-08 ran 189 sourcing passes in one day.
  assert.ok(visits < 189, `a month of visits is ${visits}, which must be under one incident day`);
});

test("no two visits start the same distance apart, which is what a metronome is", () => {
  const gaps = new Map<number, number>();
  for (const { plan } of month()) {
    for (let i = 1; i < plan.length; i += 1) {
      const gap = (plan[i]?.startMin ?? 0) - (plan[i - 1]?.startMin ?? 0);
      gaps.set(gap, (gaps.get(gap) ?? 0) + 1);
    }
  }
  const worst = Math.max(...gaps.values());
  const total = [...gaps.values()].reduce((a, b) => a + b, 0);
  assert.ok(
    worst < total / 3,
    `one gap length accounts for ${worst} of ${total}, which reads as a schedule`
  );
});

test("visits never touch, and never run into the night", () => {
  for (const { day, plan } of month()) {
    for (let i = 0; i < plan.length; i += 1) {
      const v = plan[i];
      if (!v) continue;
      assert.ok(v.endMin > v.startMin, `${day} visit ${i} has no length`);
      assert.ok(v.endMin - v.startMin >= 16, `${day} visit ${i} is too short to be a visit`);
      assert.ok(v.endMin <= 22 * 60 + 30, `${day} visit ${i} runs past the evening`);
      assert.ok(v.startMin >= 8 * 60, `${day} visit ${i} starts before anybody is awake`);
      const previous = plan[i - 1];
      if (previous) {
        assert.ok(
          v.startMin - previous.endMin >= 40,
          `${day} visits ${i - 1} and ${i} are one long session`
        );
      }
    }
  }
});

test("Sunday is off and Saturday is not, which is what a business account looks like", () => {
  const days = month();
  const sunday = days.filter((d) => d.weekday === 7);
  assert.ok(sunday.length >= 4, "the fixture month needs Sundays in it");
  assert.ok(
    sunday.every((d) => d.plan.length === 0),
    "Sunday is off, always"
  );
  const saturdays = days.filter((d) => d.weekday === 6);
  assert.ok(
    saturdays.filter((d) => d.plan.length > 0).length >= saturdays.length - 1,
    "Saturday works, because a seven-day trial cannot afford to lose two days to the calendar"
  );
});

test("Saturday is lighter than a weekday, and some working days are skipped", () => {
  const days = month();
  const weekdayAvg =
    days.filter((d) => d.weekday <= 5).reduce((n, d) => n + d.plan.length, 0) /
    days.filter((d) => d.weekday <= 5).length;
  const saturdayAvg =
    days.filter((d) => d.weekday === 6).reduce((n, d) => n + d.plan.length, 0) /
    days.filter((d) => d.weekday === 6).length;
  assert.ok(saturdayAvg < weekdayAvg, "a Saturday should not look like a Tuesday");
  assert.ok(
    days.some((d) => d.weekday <= 5 && d.plan.length === 0),
    "an account that never misses a day is an account with nobody behind it"
  );
});

test("the same account and day always produce the same plan, so a restart changes nothing", () => {
  const first = dayPlan(ACCOUNT, "2026-06-10", 3);
  const again = dayPlan(ACCOUNT, "2026-06-10", 3);
  assert.deepEqual(first, again);
});

test("two accounts do not share a day, so a fleet is not one pattern repeated", () => {
  const a = dayPlan("account-a", "2026-06-10", 3);
  const b = dayPlan("account-b", "2026-06-10", 3);
  assert.notDeepEqual(a, b);
});

test("outside a visit nothing opens at all", () => {
  const tz = "Europe/Paris";
  // 03:00 local, which is the hour no plan ever covers.
  const night = new Date("2026-06-10T01:00:00Z");
  assert.equal(currentVisit(ACCOUNT, tz, {}, night), null);
});

test("a visit reports where it sits in the day, so reading can pace across it", () => {
  const tz = "Europe/Paris";
  const day = "2026-06-10";
  const plan = dayPlan(ACCOUNT, day, 3);
  assert.ok(plan.length > 0, "this fixture day needs at least one visit");
  const first = plan[0];
  if (!first) return;
  // Local 10:00 in Paris in June is 08:00 UTC, so build the instant from the plan itself.
  const at = new Date(Date.UTC(2026, 5, 10, Math.floor((first.startMin + 2) / 60) - 2, (first.startMin + 2) % 60));
  const now = currentVisit(ACCOUNT, tz, {}, at);
  assert.ok(now, "the middle of a planned visit should be inside a visit");
  assert.equal(now?.index, 0);
  assert.equal(now?.count, plan.length);
});

test("somebody who just signed up is served immediately, whatever the clock says", () => {
  const night = new Date("2026-06-10T01:00:00Z");
  const visit = currentVisit(ACCOUNT, "Europe/Paris", { firstRun: true }, night);
  assert.ok(visit, "a first run must never be told to come back tomorrow");
  assert.equal(visit?.index, 0);
  assert.ok((visit?.count ?? 0) > 1, "the first visit must leave the day some room");
});

test("the clock reads the account's own timezone, not the server's", () => {
  const at = new Date("2026-06-10T22:30:00Z");
  const paris = localClock("Europe/Paris", at);
  const newYork = localClock("America/New_York", at);
  assert.equal(paris.day, "2026-06-11");
  assert.equal(newYork.day, "2026-06-10");
  assert.equal(paris.minutes, 30);
  assert.equal(newYork.minutes, 18 * 60 + 30);
});

test("the next visit is readable by a person", () => {
  const at = new Date("2026-06-10T04:00:00Z");
  const next = nextVisit(ACCOUNT, "Europe/Paris", at);
  if (next) assert.match(clockLabel(next.startMin), /^\d{2}:\d{2}$/);
});
