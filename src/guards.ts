import type { AgentContext } from "./config.ts";
import { db } from "./db.ts";

/**
 * The switches checked before anything is sent.
 *
 * Ported concept from outreach-agent's guards.ts. The original had one boolean
 * in a config file for one account. A product needs three, and the fleet-wide
 * one is the one you reach for at 2am, so it has to work without a deploy:
 * it is read from the database on every check, never from an environment
 * variable baked into a running process.
 */

export class HaltedError extends Error {
  constructor(scope: "fleet" | "workspace" | "agent", reason: string) {
    super(`Halted at the ${scope} level: ${reason}`);
    this.name = "HaltedError";
  }
}

async function flag(key: string): Promise<string | null> {
  const { rows } = await db().execute({
    sql: `SELECT value FROM worker_flags WHERE key = ? LIMIT 1`,
    args: [key],
  });
  const value = rows[0]?.value;
  return typeof value === "string" && value.length ? value : null;
}

/**
 * Refuses every outbound action while any switch is thrown.
 *
 * Called immediately before a send, never once at the start of a pass: a pass
 * can run for an hour and the whole point of the fleet switch is that it takes
 * effect within seconds.
 */
export async function assertCanSend(ctx: AgentContext): Promise<void> {
  const fleet = await flag("worker_halt");
  if (fleet) throw new HaltedError("fleet", fleet);

  const { rows } = await db().execute({
    sql: `SELECT status, paused_reason FROM agents WHERE id = ? AND workspace_id = ? LIMIT 1`,
    args: [ctx.agentId, ctx.workspaceId],
  });
  const status = String(rows[0]?.status ?? "paused");
  if (status !== "active" && status !== "warming") {
    throw new HaltedError("agent", String(rows[0]?.paused_reason ?? "the agent is not running"));
  }
}
