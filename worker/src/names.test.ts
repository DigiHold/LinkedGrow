import { test } from "node:test";
import assert from "node:assert/strict";
import { firstNameOf, namesSomebodyElse } from "./names.ts";

/**
 * Every full_name here was read off agent_leads on 2026-08-06, the day a DM to
 * "Mr Happiness - Sasho Jovanovski" went out addressed to Marija. The old code
 * was `full_name.split(/\s+/)[0]`, which returned "Mr", and the field it fed
 * was empty anyway, so the model had no name and invented one.
 */

test("a branded prefix before a dash is not the name", () => {
  assert.equal(firstNameOf("Mr Happiness - Sasho Jovanovski"), "Sasho");
});

test("a title is skipped and shouted surnames do not leak in", () => {
  assert.equal(firstNameOf("Dr Veronique BLANC-BRUDE"), "Veronique");
});

test("an ordinary two-part name is untouched", () => {
  assert.equal(firstNameOf("Adam McNaught-Davis"), "Adam");
});

test("a hyphenated given name keeps both halves", () => {
  assert.equal(firstNameOf("Jean-Christophe TURCAT"), "Jean-Christophe");
});

test("emoji and a hiring banner are stripped", () => {
  assert.equal(firstNameOf("🚀 Tom Meyer | We are hiring"), "Tom");
});

test("credentials after a comma are not mistaken for a surname-first name", () => {
  assert.equal(firstNameOf("Tom Meyer, PhD"), "Tom");
});

test("surname-first with one comma is read in the right order", () => {
  assert.equal(firstNameOf("Jovanovski, Sasho"), "Sasho");
});

test("a pipe-separated headline stuffed into the name field", () => {
  assert.equal(firstNameOf("Igor Rotsenmar | Security TPM"), "Igor");
});

test("casing is repaired rather than shouted back", () => {
  assert.equal(firstNameOf("SASHO Jovanovski"), "Sasho");
});

test("a company name yields nothing rather than a guess", () => {
  assert.equal(firstNameOf("LinkedGrow"), "");
  assert.equal(firstNameOf("   "), "");
  assert.equal(firstNameOf(null), "");
});

test("the greeting guard catches the name the model invented", () => {
  assert.equal(
    namesSomebodyElse(
      "Glad we connected, Marija. Running a summit sounds like a lot on your plate.",
      "Mr Happiness - Sasho Jovanovski",
      "Jane"
    ),
    "Marija"
  );
});

test("the guard passes the prospect's own name in any position", () => {
  assert.equal(
    namesSomebodyElse(
      "Glad we connected, Sasho. Running a summit sounds like a lot on your plate.",
      "Mr Happiness - Sasho Jovanovski",
      "Jane"
    ),
    null
  );
});

test("the guard ignores a message with no greeting name at all", () => {
  assert.equal(
    namesSomebodyElse("Running a summit sounds like a lot on your plate.", "Sasho Jovanovski", "Jane"),
    null
  );
});

test("a blank first_name column falls back to the full name rather than greeting nobody", () => {
  // The store normalises "" to null so the `??` fallback in the worker fires.
  // Without it the greeting reads "Glad we connected, " with nothing after the
  // comma, which is the same family of mistake as the Marija DM.
  const normalise = (value: string | null) => (value ?? "").trim() || null;

  assert.equal(normalise(""), null);
  assert.equal(normalise("   "), null);
  assert.equal(normalise(null), null);
  assert.equal(normalise("Sasho"), "Sasho");

  const greetingFor = (firstName: string | null, fullName: string | null) =>
    firstName ?? firstNameOf(fullName);

  assert.equal(greetingFor(normalise(""), "Sasho Jovanovski"), "Sasho");
  assert.equal(greetingFor(normalise("  "), "Mr Happiness - Sasho Jovanovski"), "Sasho");
  assert.equal(greetingFor(normalise("Ana"), "Sasho Jovanovski"), "Ana");
});
