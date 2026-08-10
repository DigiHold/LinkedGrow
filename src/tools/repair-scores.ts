import "dotenv/config";
import { db } from "../db.ts";
import { parseScore } from "../ai.ts";

/**
 * Repairs the leads whose "Why this person" still shows an echoed template.
 *
 * Ten of them on a live account read like this in the customer's queue:
 *
 *   reason
 *
 *   15|CSO role at established newsletter and CMO title indicate...
 *
 * They were written by a version of the parser that split on the FIRST pipe, so
 * parseInt("SCORE") was NaN, the lead was stored at 0, and the whole tail became
 * the reason. The parser was fixed afterwards and these rows were left behind.
 *
 * The real judgement is still in the text, so it is recovered rather than
 * thrown away: the current parser reads 15 and the sentence out of exactly the
 * string that is stored. That costs no model call and, because the source
 * ranking now counts good leads off match_score, it also puts back evidence the
 * agent had been denied.
 *
 * Pass --apply to write. Without it, nothing is changed and every repair is
 * printed for reading.
 */
const APPLY = process.argv.includes("--apply");

const { rows } = await db().execute(
  `SELECT id, full_name, match_score, match_reason
     FROM agent_leads
    WHERE match_reason IS NOT NULL
      AND (match_reason LIKE 'reason%' OR match_reason LIKE 'score%' OR match_reason LIKE '%|%')`
);

if (rows.length === 0) {
  console.log("no lead is showing an echoed template");
  process.exit(0);
}

let repaired = 0;
for (const row of rows) {
  const stored = String(row.match_reason);
  let recovered: { score: number; reason: string };
  try {
    recovered = parseScore(stored);
  } catch {
    // Nothing readable in there. Leaving it alone is better than replacing a
    // bad sentence with an invented one.
    console.log(`  UNREADABLE  ${String(row.full_name)}: ${stored.slice(0, 60)}`);
    continue;
  }
  if (recovered.reason === stored && recovered.score === Number(row.match_score)) continue;

  console.log(
    `  ${String(row.full_name).slice(0, 24).padEnd(26)} ${row.match_score} -> ${recovered.score}  ${recovered.reason.slice(0, 62)}`
  );
  repaired += 1;
  if (!APPLY) continue;

  await db().execute({
    sql: `UPDATE agent_leads SET match_score = ?, match_reason = ? WHERE id = ?`,
    args: [recovered.score, recovered.reason.slice(0, 300), String(row.id)],
  });
}

console.log(
  APPLY ? `repaired ${repaired}` : `${repaired} would be repaired. Re-run with --apply to write.`
);
process.exit(0);
