import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NoSlotError,
  fairOrder,
  slotCapacity,
  slotsInUse,
  takeSlot,
} from "./slots.ts";

/**
 * The property worth testing is the one Nicolas asked for by name: two accounts
 * must never hold a browser in the same slot at the same moment. Everything
 * else here exists to make sure the counter cannot drift, because a leaked slot
 * silently shrinks the box until nothing runs.
 */

function drain(): void {
  // Nothing should be held between tests; if it is, that is the bug.
  assert.equal(slotsInUse(), 0, "a previous test leaked a slot");
}

test("a slot is exclusive to one account", () => {
  drain();
  const leases = [];
  for (let i = 0; i < slotCapacity(); i++) {
    leases.push(takeSlot(`account-${i}`));
  }
  assert.equal(slotsInUse(), slotCapacity());
  assert.throws(() => takeSlot("one-too-many"), NoSlotError);
  leases.forEach((l) => l.release());
  assert.equal(slotsInUse(), 0);
});

/**
 * The one that was missing, and the one that matters most.
 *
 * The publish loop runs every minute and the agent loop every few, against the
 * same accounts. While the slot joined an existing lease, the second loop was
 * handed one and opened a second Chrome on a profile directory the first was
 * still writing.
 */
test("one account cannot hold two sessions at once", () => {
  drain();
  const agentPass = takeSlot("same-account");
  assert.throws(
    () => takeSlot("same-account"),
    NoSlotError,
    "a second loop must be refused, not given a second browser"
  );
  assert.equal(slotsInUse(), 1, "the refusal must not consume capacity");
  agentPass.release();
  assert.equal(slotsInUse(), 0);
  // And it is available again the moment the first session closes.
  takeSlot("same-account").release();
  assert.equal(slotsInUse(), 0);
});

test("releasing twice cannot free somebody else's slot", () => {
  drain();
  const mine = takeSlot("mine");
  const other = takeSlot("other");
  mine.release();
  mine.release();
  assert.equal(slotsInUse(), 1, "the double release must not drop the other account");
  other.release();
  assert.equal(slotsInUse(), 0);
});

test("a full box refuses rather than overcommitting", () => {
  drain();
  const leases = Array.from({ length: slotCapacity() }, (_, i) =>
    takeSlot(`acct-${i}`)
  );
  let refused = 0;
  for (let i = 0; i < 5; i++) {
    try {
      takeSlot(`late-${i}`);
    } catch (error) {
      if (error instanceof NoSlotError) refused += 1;
    }
  }
  assert.equal(refused, 5);
  assert.equal(slotsInUse(), slotCapacity(), "refusals must not consume capacity");
  leases.forEach((l) => l.release());
});

test("the oldest account runs first when the box is contended", () => {
  const now = Date.now();
  const ordered = fairOrder([
    { linkedinAccountId: "recent", lastRunAt: new Date(now - 60_000) },
    { linkedinAccountId: "never", lastRunAt: null },
    { linkedinAccountId: "old", lastRunAt: new Date(now - 3_600_000) },
  ]);
  assert.deepEqual(
    ordered.map((o) => o.linkedinAccountId),
    ["never", "old", "recent"]
  );
});
