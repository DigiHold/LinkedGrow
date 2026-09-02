import { test } from "node:test";
import assert from "node:assert/strict";
import { askPrompt, type Prospect, type Sender } from "./relationship.ts";
import type { AgentContext } from "../config.ts";

/**
 * The wizard has offered "start conversations" and "book calls" since v2 shipped, and the worker
 * read neither, so both produced the same closing message. These lock what the choice changes and,
 * just as importantly, what it must not.
 *
 * The evidence is Gong's 304,174 emails scored on meetings booked within ten days: a close naming
 * a day and time wins at 37% once somebody is engaged and loses at 27% while they are still cold,
 * against 47% for an interest close. So the goal may only spend a reply that already exists.
 */
const sender: Sender = {
  firstName: "Jane",
  companyInfo: "I build website widgets",
  location: "Lisbon",
};
const prospect: Prospect = { firstName: "Tom", fullName: "Tom Meyer", source: "reaction:calendly" };

function prompt(goal: "conversations" | "meetings", talked: boolean): string {
  const ctx = { goal } as AgentContext;
  const thread = talked ? [{ from: "them" as const, body: "Sure, tell me a bit more." }] : [];
  return askPrompt(ctx, sender, prospect, thread);
}

test("booking calls proposes two windows, but only to somebody who replied", () => {
  const warm = prompt("meetings", true);
  assert.match(warm, /two concrete windows/);
  assert.doesNotMatch(warm, /Never ask for a meeting/, "the no-meeting rule has to be lifted here");
  assert.match(warm, /No calendar link/, "a link is what turns a message into a funnel");
});

test("silence keeps the interest close whatever the customer picked", () => {
  const cold = prompt("meetings", false);
  assert.match(cold, /Never ask for a meeting/);
  assert.doesNotMatch(cold, /two concrete windows/);
});

test("starting conversations never asks for a call, even from somebody engaged", () => {
  const warm = prompt("conversations", true);
  assert.match(warm, /Never ask for a meeting/);
  assert.doesNotMatch(warm, /two concrete windows/);
});

test("the goal changes the closing bullets and nothing above them", () => {
  // A cold meeting ask does its damage in the opening, so the branch must not reach any of it.
  const above = (s: string) => s.slice(0, s.indexOf("- End"));
  assert.equal(above(prompt("meetings", true)), above(prompt("conversations", true)));
});
