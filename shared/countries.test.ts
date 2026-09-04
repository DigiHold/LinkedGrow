import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COUNTRY_CODES,
  COUNTRY_GROUPS,
  countryOf,
  countryName,
  isCountryCode,
  normaliseCountries,
  placeVerdict,
} from "./countries.ts";

/**
 * The bug this file exists for.
 *
 * Carlos told his agent to work the Americas and the Caribbean and it brought
 * back people in Asia and the Middle East, every day, for as long as it ran.
 * The Locations box took free text, one call site out of nine consulted it, and
 * the answer it gave was a bare boolean that could not tell "this person is
 * allowed" from "LinkedIn did not print a place". All three are gone, and each
 * one is held here.
 */

const AMERICAS = COUNTRY_GROUPS.find((g) => g.id === "americas")?.codes ?? [];
const CARIBBEAN = COUNTRY_GROUPS.find((g) => g.id === "caribbean")?.codes ?? [];

test("the groups Carlos would tick cover what he meant", () => {
  assert.equal(AMERICAS.length, 57);
  assert.equal(CARIBBEAN.length, 28);
  for (const code of ["US", "CA", "MX", "BR", "AR", "CO", "DO", "JM", "TT", "PR", "CU", "HT"]) {
    assert.ok(AMERICAS.includes(code), `${code} should be in the Americas`);
  }
  // Every Caribbean country is in the Americas, so ticking both is not a trap.
  for (const code of CARIBBEAN) assert.ok(AMERICAS.includes(code), `${code} escaped the Americas`);
});

test("somebody in Asia is out, which is the whole complaint", () => {
  assert.equal(placeVerdict(AMERICAS, "Bengaluru, Karnataka, India"), "out");
  assert.equal(placeVerdict(AMERICAS, "Dubai, United Arab Emirates"), "out");
  assert.equal(placeVerdict(AMERICAS, "Lahore, Punjab, Pakistan"), "out");
  assert.equal(placeVerdict(AMERICAS, "Riyadh, Saudi Arabia"), "out");
});

test("somebody in the Americas is in", () => {
  assert.equal(placeVerdict(AMERICAS, "Miami, Florida, United States"), "in");
  assert.equal(placeVerdict(AMERICAS, "Santo Domingo, Dominican Republic"), "in");
  assert.equal(placeVerdict(AMERICAS, "Bogota, Bogota, Colombia"), "in");
  assert.equal(placeVerdict(AMERICAS, "Toronto, Ontario, Canada"), "in");
  assert.equal(placeVerdict(AMERICAS, "San Juan, Puerto Rico"), "in");
});

test("no country chosen is worldwide, and worldwide takes everybody", () => {
  assert.equal(placeVerdict([], "Bengaluru, Karnataka, India"), "in");
  assert.equal(placeVerdict([], null), "in");
  assert.equal(placeVerdict([], ""), "in");
});

/**
 * The three way answer, which is the fix underneath the fix.
 *
 * A reaction row carries no place at all and the old boolean called that
 * allowed. It is not allowed and it is not refused: it is unread, and the
 * caller has to go and look before touching the person.
 */
test("a place LinkedIn never printed is unknown, never allowed", () => {
  assert.equal(placeVerdict(AMERICAS, null), "unknown");
  assert.equal(placeVerdict(AMERICAS, ""), "unknown");
  assert.equal(placeVerdict(AMERICAS, "   "), "unknown");
  assert.equal(placeVerdict(AMERICAS, "Greater Paris Metropolitan Region"), "unknown");
});

/**
 * The reason the free text box had to go.
 *
 * LinkedIn writes the place in the language of whoever is reading it, so an
 * agent belonging to a German customer sees Deutschland where a French one sees
 * Allemagne. Typing "Germany" into a box could never have matched either.
 */
test("the country is read in whatever language LinkedIn printed it", () => {
  for (const place of [
    "Berlin, Germany",
    "Berlin, Deutschland",
    "Berlin, Allemagne",
    "Berlin, Alemania",
    "Berlin, Germania",
    "Berlin, Almanya",
    "Berlin, Niemcy",
    "ベルリン, ドイツ",
  ]) {
    assert.equal(countryOf(place), "DE", `failed on ${place}`);
  }
});

test("the forms people actually write, not the official ones", () => {
  assert.equal(countryOf("Istanbul, Turkey"), "TR"); // ICU says Turkiye
  assert.equal(countryOf("Prague, Czech Republic"), "CZ"); // ICU says Czechia
  assert.equal(countryOf("Abidjan, Ivory Coast"), "CI"); // ICU says Cote d'Ivoire
  assert.equal(countryOf("Austin, Texas, USA"), "US");
  assert.equal(countryOf("London, England, United Kingdom"), "GB");
  assert.equal(countryOf("Edinburgh, Scotland"), "GB");
  assert.equal(countryOf("Amsterdam, Holland"), "NL");
  assert.equal(countryOf("Dubai, UAE"), "AE");
});

/**
 * Reading the segments backwards, which is not a detail.
 *
 * Georgia is a US state and a country, Jersey is an island and a US county
 * name, and Mexico is a country and a city in Missouri. LinkedIn always
 * narrows to the country last, so the last segment that names a country wins.
 */
test("Atlanta is not Tbilisi", () => {
  assert.equal(countryOf("Atlanta, Georgia, United States"), "US");
  assert.equal(countryOf("Tbilisi, Georgia"), "GE");
  assert.equal(countryOf("Mexico, Missouri, United States"), "US");
  assert.equal(countryOf("Mexico City, Mexico"), "MX");
});

test("a company name in a headline can never leak into the place", () => {
  // The old filter did a substring match on the whole string, so an agent
  // targeting Chad matched anybody whose place contained "chad".
  assert.equal(countryOf("Chadstone, Victoria, Australia"), "AU");
  assert.equal(countryOf("Nice, Provence-Alpes-Cote d'Azur, France"), "FR");
});

test("a bare two letter segment is never read as a country", () => {
  // AR is Arkansas far more often than Argentina, CA California more often
  // than Canada, IN Indiana more often than India.
  assert.equal(countryOf("Little Rock, AR"), null);
  assert.equal(countryOf("San Jose, CA"), null);
  assert.equal(countryOf("Indianapolis, IN"), null);
  // With the country spelled out it resolves, and to the right one.
  assert.equal(countryOf("San Jose, CA, United States"), "US");
});

test("every code the picker offers has a name and passes validation", () => {
  assert.equal(COUNTRY_CODES.length, 249);
  for (const code of COUNTRY_CODES) {
    assert.ok(isCountryCode(code), `${code} fails its own validator`);
    const name = countryName(code);
    assert.ok(name && name !== code, `${code} has no name`);
  }
});

test("every group expands to codes the picker knows", () => {
  assert.ok(COUNTRY_GROUPS.length >= 20);
  for (const group of COUNTRY_GROUPS) {
    assert.ok(group.codes.length > 0, `${group.id} is empty`);
    for (const code of group.codes) {
      assert.ok(isCountryCode(code), `${group.id} carries an unknown code ${code}`);
    }
  }
});

test("the European Union group is the 27 member states", () => {
  const eu = COUNTRY_GROUPS.find((g) => g.id === "european-union");
  assert.ok(eu);
  assert.equal(eu.codes.length, 27);
  assert.ok(eu.codes.includes("NL"));
  assert.ok(!eu.codes.includes("GB"), "the United Kingdom left in 2020");
  assert.ok(!eu.codes.includes("CH"), "Switzerland was never a member");
  assert.ok(!eu.codes.includes("UA"), "Ukraine is a candidate, not a member");
});

/**
 * Nothing but a code ever reaches the agent row.
 *
 * This is the gate that makes the rest of the product simple: the worker never
 * has to wonder whether "Americas" was a country, because it can no longer be
 * stored.
 */
test("free text is refused rather than stored", () => {
  assert.deepEqual(normaliseCountries(["Americas", "Caribbean"]), []);
  assert.deepEqual(normaliseCountries(["France", "Switzerland"]), []);
  assert.deepEqual(normaliseCountries("anywhere"), []);
  assert.deepEqual(normaliseCountries(null), []);
  assert.deepEqual(normaliseCountries(undefined), []);
});

test("codes are accepted in any shape the callers hand over", () => {
  assert.deepEqual(normaliseCountries(["us", "FR", "us"]), ["FR", "US"]);
  assert.deepEqual(normaliseCountries('["US","MX"]'), ["MX", "US"]);
  assert.deepEqual(normaliseCountries("US, MX"), ["MX", "US"]);
  assert.deepEqual(normaliseCountries(["US", "ZZ", 7, null]), ["US"]);
});
