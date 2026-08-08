import { test } from "node:test";
import assert from "node:assert/strict";
import { buildsAProduct, categoryTerms, competesWith } from "./competitor.ts";

/**
 * The two headlines that were messaged on 2026-08-08, and the ones that must
 * keep getting through.
 *
 * A person reads either of the first two and knows in half a second that they
 * can never buy. Both went out anyway, in a customer's own name.
 */

const BOOKING = "We sell an online booking and appointment scheduling system for salons, clinics and independent professionals, with reminders and online payments.";
const COOKIES = "We provide a cookie consent banner and privacy compliance widget for websites, covering GDPR and CCPA.";

test("the co-founder of a booking product is not a buyer of a booking product", () => {
  const verdict = competesWith(
    "Co-founder, RazorBooking.com | Appointments, Payments & Reminders, Built for Service Businesses",
    BOOKING
  );
  assert.ok(verdict.competes, "this message went out for real, in Maria's name");
  assert.ok(verdict.overlap.length > 0, "the reason on the lead has to say why");
});

test("the founder of a cookie consent widget is not a buyer of a cookie consent widget", () => {
  const verdict = competesWith("Founder at GDPRChecker | Cookie Consent & Privacy Readiness", COOKIES);
  assert.ok(verdict.competes, "a first-degree connection, so she was messaged without an invitation");
  assert.ok(verdict.overlap.some((t) => t.includes("cookie") || t.includes("consent")));
});

test("somebody who works in the category but does not own a product is still a prospect", () => {
  // The head of marketing at a salon chain is exactly who a booking product
  // wants to reach. Sharing the vocabulary is the point, not the problem.
  const verdict = competesWith("Head of Marketing at Belle Salons | Appointments and client care", BOOKING);
  assert.equal(verdict.competes, false);
});

test("a founder in an unrelated category is still a prospect", () => {
  const verdict = competesWith("Founder at Northwind Accounting | Bookkeeping for tradespeople", BOOKING);
  assert.equal(verdict.competes, false, "an accountant with a diary is a customer, not a rival");
});

test("the customer's own audience is never flagged as competition", () => {
  // Everything here overlaps on words that describe half of LinkedIn.
  for (const headline of [
    "Founder | Small business owner helping local businesses grow",
    "CEO at a service business | Building the future of client work",
    "Co-founder | We help small businesses with online tools",
  ]) {
    const verdict = competesWith(headline, BOOKING);
    assert.equal(verdict.competes, false, headline);
  }
});

test("a generic pair is not a category", () => {
  const terms = categoryTerms("We help small businesses with online tools and digital services.");
  assert.ok(!terms.has("small business"), "half of LinkedIn says this");
  assert.ok(!terms.has("digital service"));
});

test("a real category phrase survives", () => {
  const terms = categoryTerms(COOKIES);
  assert.ok(terms.has("cookie consent"));
  assert.ok(terms.has("consent"));
});

test("owning a product is read off the role or off the domain", () => {
  assert.ok(buildsAProduct("Co-founder, RazorBooking.com"));
  assert.ok(buildsAProduct("Founder at GDPRChecker"));
  assert.ok(buildsAProduct("I build tools for freelancers | mytool.io"));
  assert.equal(buildsAProduct("Marketing Manager at Acme"), false);
  assert.equal(buildsAProduct("Salon owner in Lyon"), true, "an owner owns the thing, which is the rule");
});

test("nothing fires when the customer has not said what they sell", () => {
  // Better silent than guessing: an empty product description used to be an
  // empty term set, and an empty set matches nothing, but a two-word one could
  // match everything.
  assert.equal(competesWith("Founder at GDPRChecker | Cookie Consent", "").competes, false);
  assert.equal(competesWith("Founder at GDPRChecker | Cookie Consent", "we sell").competes, false);
});

test("an empty headline decides nothing", () => {
  assert.equal(competesWith("", BOOKING).competes, false);
});
