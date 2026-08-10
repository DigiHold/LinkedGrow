import "dotenv/config";
import { db } from "../db.ts";
import { firstNameOf } from "../names.ts";

/**
 * Fills the first name on leads that were claimed before the insert wrote one.
 *
 * Every lead on the account had an empty first_name, so every log line about a
 * prospect read "hello to null was not sent" and "invite to null is already
 * pending". Three real failures were diagnosed through that fog on 2026-08-08.
 *
 * Derived from the full name already stored, which is exactly what the message
 * writer has always done at send time, so nothing here invents anything. Rows
 * that already carry a first name are left alone.
 */
const { rows } = await db().execute(
  `SELECT id, full_name FROM agent_leads
    WHERE (first_name IS NULL OR first_name = '') AND full_name IS NOT NULL AND full_name != ''`
);

if (rows.length === 0) {
  console.log("every lead already carries a first name");
  process.exit(0);
}
console.log(`filling ${rows.length} first names from the full name already stored`);

let written = 0;
for (const row of rows) {
  const first = firstNameOf(String(row.full_name));
  if (!first) continue;
  await db().execute({
    sql: `UPDATE agent_leads SET first_name = ? WHERE id = ? AND (first_name IS NULL OR first_name = '')`,
    args: [first, String(row.id)],
  });
  written += 1;
}
console.log(`wrote ${written}`);

const left = await db().execute(
  `SELECT COUNT(*) AS n FROM agent_leads WHERE first_name IS NULL OR first_name = ''`
);
console.log(`still empty: ${String(left.rows[0]?.n ?? "?")}`);
process.exit(0);
