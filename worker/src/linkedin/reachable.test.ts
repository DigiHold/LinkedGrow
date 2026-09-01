import { test } from "node:test";
import assert from "node:assert/strict";
import { canMessageFromCard } from "./actions.ts";

/**
 * Whether a person can be messaged right now, judged the way the profile says it.
 *
 * The old test was "does the profile have a Message button", on the premise
 * that LinkedIn only renders one when messaging is allowed. It does not. Both
 * cards below were read off the live site on 2026-08-08, and the second one
 * belongs to somebody the agent had invited an hour earlier and could not
 * write to: pressing Message opened a Premium upsell.
 *
 * Three prospects went to connected that way on 2026-08-07 and every hello to
 * them failed for two days.
 */

const FIRST_DEGREE =
  "Shibam B. He/Him · 1st Co-founder, RazorBooking.com | Appointments, Payments & Reminders, " +
  "Built for Service Businesses Siliguri, West Bengal, India · Contact info RazorBooking.com 1,934 followers";

const SECOND_DEGREE_PENDING =
  "Jerin Mariam · 2nd Product Architect & Co-founder for Kaybra Zurich, Switzerland · Contact info " +
  "19,337 followers Badri is a mutual connection Message Pending More";

test("a first-degree connection can be messaged", () => {
  assert.equal(canMessageFromCard(FIRST_DEGREE), true);
});

test("a second-degree with a pending invitation cannot, whatever buttons are on screen", () => {
  assert.equal(canMessageFromCard(SECOND_DEGREE_PENDING), false);
});

test("pending is refused even where the degree cannot be read", () => {
  assert.equal(canMessageFromCard("Someone Somebody Message Pending More"), false);
});

test("a card that could not be read is refused rather than guessed at", () => {
  assert.equal(canMessageFromCard(""), false);
  assert.equal(canMessageFromCard("   "), false);
});

test("third degree is refused too", () => {
  assert.equal(canMessageFromCard("Someone Somebody · 3rd Founder somewhere Message Connect"), false);
  assert.equal(canMessageFromCard("Someone Somebody · 3rd+ Founder somewhere Message"), false);
});

test("the word first inside a headline is not a degree", () => {
  // "1st" has to be the degree next to the name, not a word in a job title.
  assert.equal(
    canMessageFromCard("Someone Somebody · 2nd Building the 1st AI for lawyers Message"),
    false
  );
});
