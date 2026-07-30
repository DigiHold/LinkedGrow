import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyConnectAllowance } from "./envelope.ts";
/**
 * Two agents on one LinkedIn profile.
 *
 * Every limit LinkedIn enforces belongs to the person, not to whatever we call an agent, so two
 * agents sharing a profile have to share its allowances. Invitations already counted account-wide;
 * messages did not, which meant a profile allowed twenty messages a day would have sent forty.
 */
test("the account's own daily ceiling wins over the warm-up ramp", () => {
  const cfg = {
    warmup: { startPerDay: 20, incrementPerWeek: 10, weeks: 4 },
    limits: { connectPerWeekMax: 100, dmPerDayMax: 20 },
    businessHours: { days: [1, 2, 3, 4, 5] },
  } as unknown as Parameters<typeof dailyConnectAllowance>[0];

  // Without the account cap the ramp would allow 20 a day in week 0.
  assert.equal(dailyConnectAllowance(cfg, 0), 20);
  // LinkedIn put this account on a tighter tier, so that is what applies.
  assert.equal(dailyConnectAllowance(cfg, 0, 8), 8);
  // A cap looser than the ramp changes nothing: the smallest limit always wins.
  assert.equal(dailyConnectAllowance(cfg, 0, 50), 20);
  // An unknown cap is ignored rather than treated as zero.
  assert.equal(dailyConnectAllowance(cfg, 0, 0), 20);
});
