/**
 * Turns the free text that used to sit in agents.locations into ISO country codes.
 *
 * The box that fed this column accepted anything, and anything is what it got:
 * "Americas", "Allemagne", "USA / Canada", "Europe". None of them matched what
 * LinkedIn prints, so the setting filtered nobody and an agent aimed at one
 * continent worked the whole world. The picker that replaced the box can only
 * produce codes, and this converts what is already stored so nobody has to
 * retype their targeting.
 *
 * Reports by default and changes nothing. Pass --apply to write.
 *
 *   node scripts/migrate-agent-countries.mjs
 *   node scripts/migrate-agent-countries.mjs --apply
 *
 * Reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from the environment, so the
 * database it touches is whichever one those point at. It prints the host
 * before doing anything, because pointing this at the wrong one is the only
 * expensive mistake available here.
 */

import { createClient } from "@libsql/client";
import { COUNTRY_GROUPS, countryOf, normaliseCountries } from "../shared/countries.ts";

const APPLY = process.argv.includes("--apply");

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is not set, so there is no database to read.");
  process.exit(1);
}
// The host, or the file, because a file: url has no host and printing an empty
// line here would defeat the only purpose of printing it.
const target = url.startsWith("file:") ? url : new URL(url.replace(/^libsql:/, "https:")).host;
console.log(`database: ${target}`);
console.log(APPLY ? "mode: APPLY, rows will be written\n" : "mode: report only, nothing is written\n");

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });

/** Region names, matched the way somebody would have typed them into the old box. */
const GROUPS_BY_NAME = new Map();
for (const group of COUNTRY_GROUPS) {
  GROUPS_BY_NAME.set(group.label.toLowerCase(), group.codes);
  GROUPS_BY_NAME.set(group.id.replace(/-/g, " "), group.codes);
}
// The short names people write for the same regions.
for (const [alias, id] of [
  ["latam", "latam"],
  ["latin america", "latam"],
  ["north america", "northern-america"],
  ["the americas", "americas"],
  ["america", "americas"],
  ["eu", "european-union"],
  ["nordic", "nordics"],
  ["scandinavia", "nordics"],
  ["uk and ireland", "uk-ireland"],
  ["apac", "asia"],
  ["emea", "europe"],
]) {
  const group = COUNTRY_GROUPS.find((g) => g.id === id);
  if (group) GROUPS_BY_NAME.set(alias, group.codes);
}

/** One stored entry, read as a country, a region, or not at all. */
function readEntry(entry) {
  const text = String(entry).trim();
  if (!text) return [];
  const country = countryOf(text);
  if (country) return [country];
  const group = GROUPS_BY_NAME.get(text.toLowerCase());
  if (group) return [...group];
  return null; // unreadable, and reported rather than guessed at
}

function parseStored(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string");
  } catch {
    // The column has held plain comma separated text as well as JSON.
  }
  return raw.split(",");
}

const { rows } = await db.execute(
  `SELECT id, name, workspace_id, locations, derived_targeting FROM agents
    WHERE locations IS NOT NULL AND trim(locations) NOT IN ('', '[]')`
);

let converted = 0;
let alreadyCodes = 0;
const unreadable = [];

for (const row of rows) {
  const stored = parseStored(row.locations);
  const already = normaliseCountries(stored);
  if (already.length === stored.length && already.length > 0) {
    alreadyCodes += 1;
    continue;
  }

  const codes = new Set();
  const lost = [];
  for (const entry of stored) {
    const read = readEntry(entry);
    if (read === null) lost.push(String(entry).trim());
    else for (const code of read) codes.add(code);
  }

  const result = [...codes].sort();
  const label = `${row.name} (${String(row.id).slice(0, 8)})`;

  if (lost.length > 0) {
    unreadable.push({ label, stored, lost, result });
  }

  console.log(`${label}`);
  console.log(`  was : ${JSON.stringify(stored)}`);
  console.log(
    `  now : ${result.length === 0 ? "WORLDWIDE (nothing could be read)" : `${result.length} countries, ${result.join(" ")}`}`
  );
  if (lost.length > 0) console.log(`  lost: ${lost.join(" | ")}`);
  console.log("");

  if (APPLY) {
    await db.execute({
      // The cached search plan was derived without the countries, so an agent
      // whose targeting changes here would otherwise keep hunting worldwide
      // with queries built for nobody in particular. Cleared, it is rebuilt on
      // the next pass and costs one model call.
      sql: `UPDATE agents SET locations = ?, derived_targeting = NULL, updated_at = ?
             WHERE id = ?`,
      args: [JSON.stringify(result), Math.floor(Date.now() / 1000), row.id],
    });
    converted += 1;
  }
}

console.log("---");
console.log(`agents with a country setting : ${rows.length}`);
console.log(`already stored as codes       : ${alreadyCodes}`);
console.log(`${APPLY ? "converted                     " : "would convert                 "}: ${rows.length - alreadyCodes}`);
if (unreadable.length > 0) {
  console.log(`\ncould not read every entry on ${unreadable.length} agent(s). These need a human:`);
  for (const u of unreadable) console.log(`  ${u.label}: ${u.lost.join(" | ")}`);
  console.log("\nThose entries filtered nobody before this change either, so nothing gets");
  console.log("worse by leaving them. Open the agent and pick the countries from the list.");
}
