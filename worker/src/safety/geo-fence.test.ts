import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import type { Page } from "patchright";
import type { AgentContext, Config } from "../config.ts";
import { setDbForTests, db as sharedDb } from "../db.ts";
import type { LinkedInActions } from "../linkedin/actions.ts";
import type { ProspectRow } from "../store.ts";
import { onlyInCountries, OUTSIDE_REASON, UNREADABLE_REASON } from "./geo-fence.ts";

/**
 * Nobody outside the chosen countries is written to, by any route.
 *
 * The report that produced this file: an agent told to work the Americas and
 * the Caribbean sent invitations to people in Asia and the Middle East, every
 * day, for as long as it ran. The countries were stored on the agent and read
 * by one lead source out of nine, and the answer that source gave could not
 * tell a person in the right country from a person LinkedIn had not labelled.
 *
 * A real in-memory libsql rather than a fake, because half of what is being
 * tested is what ends up written on the row.
 */

const AMERICAS = ["US", "CA", "MX", "BR", "CO", "DO", "JM"];

async function freshDb(): Promise<void> {
  setDbForTests(createClient({ url: ":memory:" }));
  await sharedDb().execute(
    `CREATE TABLE agent_leads (
       id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, agent_id TEXT,
       source_id TEXT, profile_id TEXT NOT NULL, profile_url TEXT NOT NULL,
       full_name TEXT NOT NULL, first_name TEXT, headline TEXT, job_title TEXT,
       company TEXT, location TEXT, avatar_url TEXT, match_score INTEGER,
       match_reason TEXT, signal_type TEXT, signal_text TEXT, signal_url TEXT,
       signal_author TEXT, step TEXT NOT NULL DEFAULT 'found', step_at INTEGER,
       found_at INTEGER NOT NULL, rejected_at INTEGER, excluded_reason TEXT,
       created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
       sequence_status TEXT NOT NULL DEFAULT 'queued', angle TEXT,
       reply_intent TEXT, signal_hits INTEGER NOT NULL DEFAULT 1, signal_kinds TEXT,
       outcome TEXT, outcome_at INTEGER)`
  );
  await sharedDb().execute(
    `CREATE TABLE account_reading (
       linkedin_account_id TEXT NOT NULL, day TEXT NOT NULL,
       profiles INTEGER NOT NULL DEFAULT 0, searches INTEGER NOT NULL DEFAULT 0,
       updated_at INTEGER, PRIMARY KEY (linkedin_account_id, day))`
  );
}

function ctxWith(locations: string[]): AgentContext {
  return {
    agentId: "agent-test",
    workspaceId: "ws-test",
    linkedinAccountId: "acct-test",
    timezone: "Europe/Paris",
    cfg: { leads: { locations } } as unknown as Config,
  } as AgentContext;
}

/** Records what the real actions were asked to do, so "nothing happened" is provable. */
function spyActions(): { actions: LinkedInActions; done: string[] } {
  const done: string[] = [];
  const actions = {
    warmUp: async (p: ProspectRow) => {
      done.push(`like:${p.full_name}`);
      return true;
    },
    sendConnect: async (p: ProspectRow) => {
      done.push(`invite:${p.full_name}`);
      return "sent" as const;
    },
    sendDm: async (p: ProspectRow) => {
      done.push(`message:${p.full_name}`);
      return true;
    },
  } as unknown as LinkedInActions;
  return { actions, done };
}

let counter = 0;

async function seed(name: string, location: string | null): Promise<ProspectRow> {
  const id = `lead-${++counter}`;
  await sharedDb().execute({
    sql: `INSERT INTO agent_leads
            (id, workspace_id, agent_id, profile_id, profile_url, full_name, location,
             step, found_at, created_at, updated_at)
          VALUES (?, 'ws-test', 'agent-test', ?, ?, ?, ?, 'found', 1, 1, 1)`,
    args: [id, id, `https://www.linkedin.com/in/${id}/`, name, location],
  });
  // getProspects hands out a local numeric id; the fence only ever passes it
  // straight back to the store, so the mapping is made the same way here.
  const { getProspects } = await import("../store.ts");
  const rows = await getProspects(ctxWith([]), "queued");
  const row = rows.find((r) => r.full_name === name);
  assert.ok(row, `seeded lead ${name} did not come back`);
  return row;
}

async function rowOf(name: string): Promise<Record<string, unknown>> {
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status, excluded_reason, location FROM agent_leads WHERE full_name = ?`,
    args: [name],
  });
  return rows[0] as unknown as Record<string, unknown>;
}

const page = {} as Page;

test("somebody in the wrong country is never invited, liked or messaged", async () => {
  await freshDb();
  const lead = await seed("Wrong Country", "Dubai, United Arab Emirates");
  const { actions, done } = spyActions();
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => null);

  assert.equal(await fenced.warmUp(lead), false);
  assert.equal(await fenced.sendConnect(lead, ""), "failed");
  assert.equal(await fenced.sendDm(lead, "hi"), false);
  assert.deepEqual(done, [], "the real actions were reached anyway");

  const row = await rowOf("Wrong Country");
  assert.equal(row.sequence_status, "skipped");
  assert.equal(row.excluded_reason, OUTSIDE_REASON);
});

test("somebody in the right country goes through untouched", async () => {
  await freshDb();
  const lead = await seed("Right Country", "Bogota, Bogota, Colombia");
  const { actions, done } = spyActions();
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => null);

  assert.equal(await fenced.warmUp(lead), true);
  assert.equal(await fenced.sendConnect(lead, ""), "sent");
  assert.equal(await fenced.sendDm(lead, "hi"), true);
  assert.deepEqual(done, ["like:Right Country", "invite:Right Country", "message:Right Country"]);
  assert.equal((await rowOf("Right Country")).sequence_status, "queued");
});

/**
 * The answer the old boolean could not give.
 *
 * A reaction row carries no place at all, so most of the pipeline arrived with
 * nothing to judge and the old check read that as permission. It is not
 * permission: the agent opens the profile, exactly as a person would before
 * pressing connect, and decides on what it finds there.
 */
test("a lead with no place has their profile opened, then is judged on it", async () => {
  await freshDb();
  const lead = await seed("No Place Yet", null);
  const { actions, done } = spyActions();
  let opened = 0;
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => {
    opened += 1;
    return "Austin, Texas, United States";
  });

  assert.equal(await fenced.sendConnect(lead, ""), "sent");
  assert.equal(opened, 1);
  assert.deepEqual(done, ["invite:No Place Yet"]);
  // Kept, so the next pass does not pay for the same page again.
  assert.equal((await rowOf("No Place Yet")).location, "Austin, Texas, United States");
});

test("the profile is opened once per person, not once per action", async () => {
  await freshDb();
  const lead = await seed("Read Once", null);
  const { actions, done } = spyActions();
  let opened = 0;
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => {
    opened += 1;
    return "Toronto, Ontario, Canada";
  });

  await fenced.warmUp(lead);
  await fenced.sendConnect(lead, "");
  await fenced.sendDm(lead, "hi");
  assert.equal(opened, 1, "a profile visit is a real page load and costs the account");
  assert.equal(done.length, 3);
});

test("the profile settling on the wrong country stops everything", async () => {
  await freshDb();
  const lead = await seed("Turned Out Wrong", null);
  const { actions, done } = spyActions();
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => "Bengaluru, Karnataka, India");

  assert.equal(await fenced.sendConnect(lead, ""), "failed");
  assert.deepEqual(done, []);
  const row = await rowOf("Turned Out Wrong");
  assert.equal(row.excluded_reason, OUTSIDE_REASON);
  assert.equal(row.location, "Bengaluru, Karnataka, India");
});

/**
 * A country that still cannot be read is a refusal, not a shrug.
 *
 * "Greater Paris Metropolitan Region" names no country and neither does a blank
 * profile. Guessing at one is the whole shape of the bug, so a customer who
 * named their countries gets the strict reading and the row says why.
 */
test("a place the profile does not give either is refused and said so", async () => {
  await freshDb();
  const lead = await seed("Unreadable", null);
  const { actions, done } = spyActions();
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => "Greater Paris Metropolitan Region");

  assert.equal(await fenced.sendConnect(lead, ""), "failed");
  assert.deepEqual(done, []);
  assert.equal((await rowOf("Unreadable")).excluded_reason, UNREADABLE_REASON);
});

test("a profile that will not load is refused rather than allowed", async () => {
  await freshDb();
  const lead = await seed("Would Not Load", null);
  const { actions, done } = spyActions();
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => {
    throw new Error("LinkedIn served a wall");
  });

  assert.equal(await fenced.sendConnect(lead, ""), "failed");
  assert.deepEqual(done, [], "a failed read must never become permission");
  assert.equal((await rowOf("Would Not Load")).excluded_reason, UNREADABLE_REASON);
});

/**
 * The default, and the state almost every agent is in.
 *
 * Choosing no country means worldwide, and worldwide is not a filter. The fence
 * hands the actions back untouched so those agents run on exactly the code path
 * they ran on before, and never pay for a profile visit to prove a point.
 */
test("no country chosen is worldwide, and costs nothing", async () => {
  await freshDb();
  const lead = await seed("Anywhere At All", "Bengaluru, Karnataka, India");
  const { actions, done } = spyActions();
  let opened = 0;
  const fenced = onlyInCountries(actions, ctxWith([]), page, async () => {
    opened += 1;
    return null;
  });

  assert.equal(await fenced.sendConnect(lead, ""), "sent");
  assert.equal(opened, 0);
  assert.deepEqual(done, ["invite:Anywhere At All"]);
});

test("the profile visit is charged to the account's reading allowance", async () => {
  await freshDb();
  const lead = await seed("Costs A Visit", null);
  const { actions } = spyActions();
  const fenced = onlyInCountries(actions, ctxWith(AMERICAS), page, async () => "Miami, Florida, United States");
  await fenced.sendConnect(lead, "");

  const { rows } = await sharedDb().execute(
    `SELECT profiles FROM account_reading WHERE linkedin_account_id = 'acct-test'`
  );
  assert.equal(Number(rows[0]?.profiles ?? 0), 1);
});
