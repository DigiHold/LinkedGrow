import { test } from "node:test";
import assert from "node:assert/strict";
import { toDemographics } from "./creator.ts";

/**
 * The numbers on these pages are read off LinkedIn's component keys, so nothing here has a language
 * and there is no label list to test. What is worth pinning is the shape of the ranked slices,
 * which are read as a pattern rather than as words: a percentage marks a slice, and the two leaves
 * before it are its category and its value.
 *
 * The category names stay in LinkedIn's own words on purpose. They are the content being shown, not
 * a control being found, so a Spanish account shows Spanish categories instead of showing nothing.
 */

test("a percentage marks a slice, and the two leaves before it are the answer", () => {
  assert.deepEqual(
    toDemographics([
      { category: "Company size", label: "2-10 employees", percent: "30" },
      { category: "Seniority", label: "Owner", percent: "27" },
    ]),
    [
      { category: "Company size", label: "2-10 employees", percent: 30 },
      { category: "Seniority", label: "Owner", percent: 27 },
    ]
  );
});

test("the categories are kept in whatever language LinkedIn wrote them", () => {
  const out = toDemographics([
    { category: "Tamaño de la empresa", label: "2-10 empleados", percent: "32" },
    { category: "Antigüedad", label: "Propietario", percent: "27" },
  ]);
  assert.equal(out[0]?.category, "Tamaño de la empresa");
  assert.equal(out[1]?.percent, 27);
});

/** Each category appears once as a tab and once as a result, and only the result carries a figure. */
test("a category is kept once, the first time it carries a figure", () => {
  const out = toDemographics([
    { category: "Seniority", label: "Owner", percent: "27" },
    { category: "Seniority", label: "Entry", percent: "12" },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.label, "Owner");
});

test("a decimal comma is a decimal point", () => {
  assert.equal(toDemographics([{ category: "A", label: "B", percent: "6,5" }])[0]?.percent, 6.5);
});

test("anything unreadable is dropped rather than stored as zero", () => {
  assert.deepEqual(toDemographics([{ category: "A", label: "B", percent: "" }]), []);
  assert.deepEqual(toDemographics([]), []);
});
