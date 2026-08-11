import { test } from "node:test";
import assert from "node:assert/strict";
import { dayPlan } from "./rhythm.ts";

const ACCT = "88c3d39f-1925-4ed8-a64e-a1f4d02c1b13";
// 07:00-19:00, Monday to Saturday, the window Nicolas set for Maria.
const WIN = { days: [1, 2, 3, 4, 5, 6], startMin: 7 * 60, endMin: 19 * 60 };

function plan(day: string, weekday: number) {
  return dayPlan(ACCT, day, weekday, WIN);
}

test("a chosen day never sits idle: every ticked day runs", () => {
  // No 7% die roll behind the customer's back. Ten weekdays, all run.
  for (let d = 10; d <= 19; d += 1) {
    const p = plan(`2026-08-${d}`, ((d % 6) + 1));
    assert.ok(p.length >= 3, `2026-08-${d} had ${p.length} visits`);
  }
});

test("nothing runs before the start or after the close", () => {
  for (let d = 10; d <= 25; d += 1) {
    for (const v of plan(`2026-08-${d}`, 2)) {
      assert.ok(v.startMin >= 7 * 60, `visit started ${v.startMin} before 07:00`);
      assert.ok(v.endMin <= 19 * 60, `visit ended ${v.endMin} after 19:00`);
    }
  }
});

test("the day spans the window: an early first visit and a late last one", () => {
  // Averaged over many days, the first visit is in the morning and the last in
  // the late afternoon, which is the whole point: cover 07-19, not 09-15.
  let earliest = Infinity;
  let latest = 0;
  for (let d = 10; d <= 40; d += 1) {
    const p = plan(`2026-09-${String(d).padStart(2, "0")}`, 2);
    if (!p.length) continue;
    earliest = Math.min(earliest, p[0]!.startMin);
    latest = Math.max(latest, p[p.length - 1]!.endMin);
  }
  assert.ok(earliest < 9 * 60, `earliest first visit ${earliest} was never before 09:00`);
  assert.ok(latest > 17 * 60, `latest last visit ${latest} never reached past 17:00`);
});

test("no gap between visits exceeds the three-hour reply window", () => {
  for (let d = 10; d <= 30; d += 1) {
    const p = plan(`2026-08-${d}`, 2);
    for (let i = 1; i < p.length; i += 1) {
      const gap = p[i]!.startMin - p[i - 1]!.endMin;
      assert.ok(gap <= 180, `2026-08-${d} had a ${gap}min gap`);
    }
  }
});

test("deterministic within a day, different across days", () => {
  const a1 = plan("2026-08-11", 2);
  const a2 = plan("2026-08-11", 2);
  assert.deepEqual(a1, a2, "same day must give the same plan");
  const b = plan("2026-08-12", 3);
  assert.notDeepEqual(
    a1.map((v) => v.startMin),
    b.map((v) => v.startMin),
    "two days must not share the same minutes"
  );
});

test("visits are in order and never overlap", () => {
  for (let d = 10; d <= 30; d += 1) {
    const p = plan(`2026-08-${d}`, 2);
    for (let i = 1; i < p.length; i += 1) {
      assert.ok(p[i]!.startMin >= p[i - 1]!.endMin, "visits overlap");
    }
  }
});

test("the day never opens on the dot nor closes on the dot every time", () => {
  // A real day starts a little after you sit down and ends a little before you
  // leave, by a different amount each day. The last visit must not pin to the
  // closing minute the way the first cut of this did (19:00 four days of five).
  const opens = new Set<number>();
  const closes = new Set<number>();
  let endedExactlyAtClose = 0;
  let total = 0;
  for (let d = 1; d <= 28; d += 1) {
    const p = plan(`2026-09-${String(d).padStart(2, "0")}`, ((d % 6) + 1));
    if (!p.length) continue;
    total += 1;
    opens.add(p[0]!.startMin);
    closes.add(p[p.length - 1]!.endMin);
    if (p[p.length - 1]!.endMin === 19 * 60) endedExactlyAtClose += 1;
    // never before open, never after close
    assert.ok(p[0]!.startMin >= 7 * 60);
    assert.ok(p[p.length - 1]!.endMin <= 19 * 60);
  }
  // The close times spread across many distinct minutes, not one flat value.
  assert.ok(closes.size >= 10, `only ${closes.size} distinct close times over ${total} days`);
  assert.ok(opens.size >= 10, `only ${opens.size} distinct open times over ${total} days`);
  // And essentially never exactly 19:00.
  assert.ok(endedExactlyAtClose <= 1, `${endedExactlyAtClose} days ended at 19:00 sharp`);
});

test("the last visit still lands late enough to answer an afternoon reply", () => {
  for (let d = 1; d <= 28; d += 1) {
    const p = plan(`2026-09-${String(d).padStart(2, "0")}`, 2);
    if (!p.length) continue;
    // Close margin is capped, so the last visit always ends well after 17:30.
    assert.ok(p[p.length - 1]!.endMin >= 17 * 60 + 30, `last visit ended ${p[p.length - 1]!.endMin}`);
  }
});
