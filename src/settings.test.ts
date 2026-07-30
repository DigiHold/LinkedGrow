import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Every setting the wizard offers has to reach the worker.
 *
 * Five of them did not. goal, smartLeadFinder, matchLevel, tone and skipConnected were all asked
 * for, stored on the row, and read by nothing, so choosing them changed nothing at all. They were
 * found one at a time, over hours, each time by someone asking whether a particular one worked.
 *
 * This is the check that stops the sixth. It reads the SQL the worker loads agents with and asserts
 * that every column it selects is used somewhere, and it fails when a new field is added to the
 * context and left dangling.
 */
const db = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

function sourceFiles(dir: URL): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) out.push(...sourceFiles(child));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(readFileSync(child, "utf8"));
    }
  }
  return out;
}
const all = sourceFiles(new URL("./", import.meta.url)).join("\n");

/** Everything AgentContext and Config carry, and where each is genuinely consumed. */
const SETTINGS: Array<{ field: string; usedAs: string }> = [
  { field: "goal", usedAs: "ctx.goal" },
  { field: "matchLevel", usedAs: "ctx.matchLevel" },
  { field: "tone", usedAs: "ctx.tone" },
  { field: "companySizes", usedAs: "ctx.companySizes" },
  { field: "skipConnected", usedAs: "cfg.skipConnected" },
  { field: "smartLeadFinder", usedAs: "ctx.smartLeadFinder" },
  { field: "observeOnly", usedAs: "ctx.observeOnly" },
  { field: "testRecipients", usedAs: "ctx.testRecipients" },
  { field: "website", usedAs: "ctx.website" },
  { field: "accountDailyInviteCap", usedAs: "ctx.accountDailyInviteCap" },
];

test("every setting the worker loads is actually used by it", () => {
  const dead: string[] = [];
  for (const { field, usedAs } of SETTINGS) {
    // One occurrence is the definition or the assignment; a used setting appears somewhere else.
    const uses = all.split(usedAs).length - 1;
    if (uses === 0) dead.push(`${field} (looked for ${usedAs})`);
  }
  assert.deepEqual(dead, [], `settings loaded and never used: ${dead.join(", ")}`);
});

test("the loader selects the columns those settings come from", () => {
  for (const column of [
    "goal", "match_level", "tone", "company_sizes", "skip_connected",
    "smart_lead_finder", "observe_only", "test_recipients", "website",
  ]) {
    assert.ok(db.includes(`AS ${column}`), `the agent query does not select ${column}`);
  }
});
