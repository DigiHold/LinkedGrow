import { count } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { EDITION, type Edition } from "@/lib/edition";
import { getInstanceSettings } from "@/lib/instance-settings";

export const SIGNUPS_CLOSED_MESSAGE =
  "Sign ups are closed on this instance. Ask the administrator for an invitation.";

export interface NewUserPolicy {
  plan: "business" | "free";
  isAdmin: boolean;
  /** The instance refuses the account; the route answers 403 with SIGNUPS_CLOSED_MESSAGE. */
  closed: boolean;
}

/**
 * What a new account gets, pure.
 *
 * The cloud path never moves: plan free, never admin, never closed, because
 * Stripe decides the plan there. The self hosted edition has no billing, so
 * the first account is the administrator, everyone runs on business, and once
 * the setup wizard has completed a new account needs the administrator to
 * reopen sign ups. Team invitations add an existing account to a team and
 * never create one, so the switch does not touch them.
 */
export function registrationPolicyFor(
  edition: Edition,
  existingUsers: number,
  settings: { setupCompleted: boolean; allowSignups: boolean }
): NewUserPolicy {
  if (edition === "cloud") return { plan: "free", isAdmin: false, closed: false };
  if (existingUsers === 0) return { plan: "business", isAdmin: true, closed: false };
  return {
    plan: "business",
    isAdmin: false,
    closed: settings.setupCompleted && !settings.allowSignups,
  };
}

/** The cloud answers without a query; the self hosted edition counts accounts and reads the switch. */
export async function newUserPolicy(): Promise<NewUserPolicy> {
  const open = { setupCompleted: false, allowSignups: true };
  if (EDITION === "cloud") return registrationPolicyFor(EDITION, 0, open);
  const [{ total }] = await db.select({ total: count() }).from(users);
  const existing = total ?? 0;
  const settings = existing === 0 ? open : await getInstanceSettings();
  return registrationPolicyFor(EDITION, existing, settings);
}
