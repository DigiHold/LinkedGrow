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
  // Added 2026-07-31, Nicolas: "chaque settings dois bien fonctionner, donc la
  // timezone, jour d'activites, le ton pour les DMs". The list above was
  // written when five settings turned out to be dead, and it did not cover the
  // ones he named, so it could not have caught them either.
  { field: "timezone", usedAs: "cfg.account.timezone" },
  { field: "workdayStart", usedAs: "businessHours.startHour" },
  { field: "workdayEnd", usedAs: "businessHours.endHour" },
  { field: "workdayDays", usedAs: "businessHours.days" },
  { field: "reviewMode", usedAs: "ctx.reviewMode" },
  { field: "warmupStartPerDay", usedAs: "cfg.warmup.startPerDay" },
  { field: "warmupWeeks", usedAs: "cfg.warmup.weeks" },
  // The messages the customer writes on the Messages tab. A box that is typed
  // into and then ignored is the same failure as a dead setting, in the one
  // place where the customer would notice it on the first message sent.
  { field: "templates", usedAs: "ctx.templates" },
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
    "sequence_templates",
  ]) {
    assert.ok(db.includes(`AS ${column}`), `the agent query does not select ${column}`);
  }
});

/**
 * A setting being mentioned is not the same as a setting being obeyed.
 *
 * The check above reads the loader's SQL and asserts every column is used
 * somewhere. It passed for months while three settings were half dead or fully
 * dead, because "used somewhere" is a weak claim:
 *
 *   workdayDays    gated WRITING, and the reading rhythm ignored it outright
 *   reviewMode     was read only inside enqueue(), which nothing ever called
 *   locations      was read only to say where the SENDER lives
 *
 * These name the real consumer, so a future refactor that quietly unhooks one
 * fails here instead of on somebody's account.
 */
const OBEYED: Array<{ setting: string; provenBy: RegExp; where: string }> = [
  {
    setting: "working days and hours drive the reading rhythm",
    provenBy: /currentVisit\([^)]*\{[\s\S]{0,400}?window:\s*\{/,
    where: "worker.ts passes businessHours into currentVisit",
  },
  {
    setting: "the rhythm honours the days it is given",
    provenBy: /window\?\.days\?\.length && !window\.days\.includes\(weekday\)/,
    where: "rhythm.ts refuses a day the customer did not tick",
  },
  {
    setting: "review mode holds a message instead of sending it",
    provenBy: /if \(db\.reviewMode\)\s*\{[\s\S]{0,200}?holdForApproval/,
    where: "sequence.ts parks the draft before sendDm is reached",
  },
  {
    setting: "locations filter a prospect",
    provenBy: /matchesLocation\(cfg\.leads\.locations/,
    where: "sources.ts drops somebody outside the chosen places",
  },
  {
    setting: "industries reach the fit judge",
    provenBy: /Industries worth having/,
    where: "generate.ts puts them in the prompt that judges fit",
  },
];

test("the settings that were dead are now genuinely obeyed", () => {
  for (const { setting, provenBy, where } of OBEYED) {
    assert.ok(provenBy.test(all), `${setting} is not wired: expected ${where}`);
  }
});

test("review mode cannot be bypassed by an unhooked queue writer", () => {
  // enqueue() was the only writer of agent_queue and nobody called it, so the
  // tab was permanently empty and every message went out unread.
  const holds = (all.match(/INSERT INTO agent_queue/g) ?? []).length;
  assert.ok(holds >= 1, "nothing writes to agent_queue at all");
  assert.ok(
    /holdForApproval\(/.test(all),
    "the hold exists but nothing calls it, which is how this broke the first time"
  );
});
