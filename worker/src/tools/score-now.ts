import "dotenv/config";
import { loadRunnableAgents } from "../db.ts";
import { scorePass } from "../linkedin/sourcing.ts";
import { log, logError } from "../logger.ts";

/**
 * Scores the leads that are waiting, without waiting for the next visit.
 *
 * Scoring is the one part of a sourcing pass that never touches LinkedIn. It
 * reads rows, asks a model what it makes of a headline, and writes a number
 * back. No browser opens, no slot is taken, no address is used and nothing is
 * booked against the account's reading budget, so running it by hand is safe in
 * a way that running the miner by hand is not.
 *
 * It exists because a pass that dies before its last step leaves every lead it
 * found with an empty Match column, held out of the invitation queue because
 * the queue refuses to write to somebody nobody has judged. The crash is fixed;
 * this clears the backlog it left behind rather than making the customer wait
 * hours for the next visit to come round.
 *
 *   node --experimental-strip-types src/tools/score-now.ts            every agent
 *   node --experimental-strip-types src/tools/score-now.ts <agentId>  just that one
 */

const only = process.argv[2];
const agents = (await loadRunnableAgents()).filter((a) => !only || a.agentId === only);

if (agents.length === 0) {
  console.error(only ? `no runnable agent ${only}` : "no runnable agents");
  process.exit(1);
}

for (const ctx of agents) {
  try {
    await scorePass(ctx);
    log("scored what was waiting", { agentId: ctx.agentId });
  } catch (error) {
    logError("could not score", error, { agentId: ctx.agentId });
  }
}
process.exit(0);
