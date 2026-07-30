import { test } from "node:test";
import assert from "node:assert/strict";
import { onlyContact, profileKey } from "./allowlist.ts";
import type { LinkedInActions } from "../linkedin/actions.ts";
import type { ProspectRow } from "../store.ts";

/**
 * The guarantee is that nobody outside the list is ever contacted, on any of the three paths that
 * can touch a person. It is worth exactly as much as its weakest one, so all three are asserted.
 */
const row = (over: Partial<ProspectRow>): ProspectRow =>
  ({
    id: 1, profile_id: null, profile_url: "", full_name: "Someone", first_name: "Some",
    headline: null, company: null, website: null, source: null, angle: null, context: null,
    status: "connected", created_at: "", updated_at: "", ...over,
  }) as ProspectRow;

function spy() {
  const calls: string[] = [];
  const actions = {
    warmUp: async () => { calls.push("warmUp"); return true; },
    sendConnect: async () => { calls.push("sendConnect"); return true; },
    sendDm: async () => { calls.push("sendDm"); return true; },
    withdrawInvite: async () => { calls.push("withdrawInvite"); return true; },
    canMessageNow: async () => true,
    recentConnections: async () => [],
    inboxRepliers: async () => [],
    readThread: async () => [],
  } as unknown as LinkedInActions;
  return { actions, calls };
}

test("a stranger is never liked, invited or messaged", async () => {
  const { actions, calls } = spy();
  const guarded = onlyContact(actions, ["https://www.linkedin.com/in/maria-lecocq/"]);
  const stranger = row({ profile_url: "https://www.linkedin.com/in/thomas-berger-a91/" });

  assert.equal(await guarded.warmUp(stranger), false);
  assert.equal(await guarded.sendConnect(stranger, ""), false);
  assert.equal(await guarded.sendDm(stranger, "hello"), false);
  assert.deepEqual(calls, [], "something reached the real actions");
});

test("a named profile is contacted normally, by url or by slug", async () => {
  const { actions, calls } = spy();
  const guarded = onlyContact(actions, ["https://www.linkedin.com/in/maria-lecocq/", "nicolas-lecocq"]);

  await guarded.sendDm(row({ profile_url: "https://www.linkedin.com/in/maria-lecocq/" }), "hi");
  await guarded.sendDm(row({ profile_id: "nicolas-lecocq" }), "hi");
  assert.deepEqual(calls, ["sendDm", "sendDm"]);
});

test("reading is never restricted, because reading harms nobody", async () => {
  const { actions } = spy();
  const guarded = onlyContact(actions, ["maria-lecocq"]);
  assert.deepEqual(await guarded.inboxRepliers(), []);
  assert.deepEqual(await guarded.readThread(row({})), []);
  assert.equal(await guarded.canMessageNow(row({})), true);
});

test("withdrawing an invitation is allowed, since it only undoes our own action", async () => {
  const { actions, calls } = spy();
  const guarded = onlyContact(actions, ["maria-lecocq"]);
  await guarded.withdrawInvite(row({ profile_url: "https://www.linkedin.com/in/someone-else/" }));
  assert.deepEqual(calls, ["withdrawInvite"]);
});

test("a url and a bare slug are the same person", () => {
  assert.equal(profileKey("https://www.linkedin.com/in/maria-lecocq/"), "maria-lecocq");
  assert.equal(profileKey("https://linkedin.com/in/maria-lecocq?utm=x"), "maria-lecocq");
  assert.equal(profileKey("Maria-Lecocq"), "maria-lecocq");
});
