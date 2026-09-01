import "dotenv/config";
import { db } from "../db.ts";

/**
 * Removes the rows the live publish checks left behind.
 *
 * The posts themselves are already gone from LinkedIn; these are the database
 * records, and they show up in the dashboard as three published test posts and
 * three failed ones, which is alarming for no reason.
 *
 * Scoped to the `livecheck` prefix and to nothing else, because every id this
 * tool writes carries it and no real post ever could: the app generates UUIDs.
 * It counts and prints what it is about to remove before removing it, so a
 * mistake in the pattern shows up as a number nobody expected rather than as
 * missing customer data.
 */
const PATTERN = "livecheck%";

const doomed = await db().execute({
  sql: `SELECT id, status, COALESCE(post_type, 'text') AS post_type FROM posts WHERE id LIKE ?`,
  args: [PATTERN],
});

if (doomed.rows.length === 0) {
  console.log("nothing to clean");
  process.exit(0);
}

console.log(`about to remove ${doomed.rows.length} check rows:`);
for (const row of doomed.rows) {
  console.log(`  ${String(row.status).padEnd(10)} ${String(row.post_type).padEnd(9)} ${String(row.id)}`);
}

// Any real post caught by this pattern would be a bug in the pattern, so stop
// rather than delete something that was not ours.
const suspicious = doomed.rows.filter((row) => !String(row.id).startsWith("livecheck-"));
if (suspicious.length > 0) {
  console.error("REFUSING: something matched that this tool did not write");
  process.exit(1);
}

const media = await db().execute({
  sql: `DELETE FROM media WHERE post_id LIKE ?`,
  args: [PATTERN],
});
const posts = await db().execute({
  sql: `DELETE FROM posts WHERE id LIKE ?`,
  args: [PATTERN],
});
console.log(`removed ${posts.rowsAffected} posts and ${media.rowsAffected} attachments`);

const left = await db().execute({
  sql: `SELECT COUNT(*) AS n FROM posts WHERE id LIKE ?`,
  args: [PATTERN],
});
console.log(`check rows left: ${String(left.rows[0]?.n ?? "?")}`);
process.exit(0);
