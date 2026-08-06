/**
 * Stopping and restarting a workspace's agents when the billing changes.
 *
 * An agent is the expensive thing in v2: it drives a real LinkedIn account
 * through a residential address and spends our AI budget, not the customer's
 * key. So the moment an account stops paying, the agents have to stop, and the
 * moment it pays again they have to come back without the customer touching
 * anything.
 *
 * The reason string is what makes the second half possible. A resume that
 * looked only at `status = 'paused'` would restart an agent the customer had
 * deliberately stopped, so only the two reasons written here are ever undone.
 */

import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const BILLING_PAUSE = {
  /** The card was declined and the grace window ran out. */
  payment: "Paused: the payment did not go through",
  /** Cancelled, refunded, or otherwise no longer on a plan. */
  cancelled: "Paused: there is no active plan on this account",
} as const;

export type BillingPauseReason = (typeof BILLING_PAUSE)[keyof typeof BILLING_PAUSE];

const BILLING_REASONS = Object.values(BILLING_PAUSE);

/**
 * Stops every running agent in a workspace and records why.
 *
 * Pausing rather than deleting: the leads, the sequences and the history stay
 * exactly where they are, so a recovered card resumes the work instead of
 * restarting it.
 */
export async function pauseAgentsForBilling(
  workspaceId: string,
  reason: BillingPauseReason
): Promise<number> {
  const result = await db
    .update(agents)
    .set({ status: "paused", pausedReason: reason, updatedAt: new Date() })
    .where(
      and(
        eq(agents.workspaceId, workspaceId),
        inArray(agents.status, ["active", "warming"])
      )
    );
  return result.rowsAffected ?? 0;
}

/**
 * Restarts only the agents this file stopped.
 *
 * An agent the customer paused by hand carries "Paused by you" and is left
 * alone, and one that LinkedIn blocked keeps its own reason.
 */
export async function resumeAgentsAfterBilling(workspaceId: string): Promise<number> {
  const result = await db
    .update(agents)
    .set({ status: "active", pausedReason: null, updatedAt: new Date() })
    .where(
      and(
        eq(agents.workspaceId, workspaceId),
        eq(agents.status, "paused"),
        inArray(agents.pausedReason, BILLING_REASONS)
      )
    );
  return result.rowsAffected ?? 0;
}
