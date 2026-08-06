/**
 * Daily cron - inactive account warning + deletion.
 *
 * Two phases, both filter on the same conservative criteria so we never
 * touch paying customers, LTD holders, or admins:
 *
 *   Phase A (Day 55) - add to Brevo list #28 (Inactive Account Warning).
 *     Brevo automation sends the "your account will be deleted in 5 days"
 *     email. Only targets users who never connected LinkedIn (no
 *     linkedinProfileId) so we don't delete real users who tried the
 *     product but stopped posting.
 *
 *   Phase B (Day 60) - delete the account via deleteUserData(). Includes
 *     a paranoid re-check just before delete to guard against race
 *     conditions where the user upgrades between fetch and delete.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, affiliates } from "@/lib/db/schema";
import { eq, and, lte, gt, isNull, isNotNull, notExists } from "drizzle-orm";
import { addToInactiveWarningList, brevoDate } from "@/lib/newsletter";
import { deleteUserData } from "@/lib/user-deletion";
import { UNCARDED_DELETE_DAYS } from "@/lib/plans";
import {
  sendAbandonedCheckoutEmail,
  sendChurnValueEmail,
  sendChurnAskEmail,
} from "@/lib/email";
import { DUNNING_GRACE_DAYS } from "@/lib/plans";
import { agents, agentLeads } from "@/lib/db/schema";
import { count, inArray } from "drizzle-orm";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function runInactiveAccounts(): Promise<{
  warned: number;
  deleted: number;
  delete_skipped: number;
  errors: number;
}> {
  const stats = {
    warned: 0,
    deleted: 0,
    delete_skipped: 0,
    uncarded_warned: 0,
    uncarded_deleted: 0,
    uncarded_skipped: 0,
    churn_sent: 0,
    agents_paused: 0,
    churn_candidates: 0,
    last_error: "",
    errors: 0,
  };

  const fiftyFiveDaysAgo = daysAgo(55);
  const sixtyDaysAgo = daysAgo(60);

  // ---------- Phase A: Day 55 warning ----------
  // Pick accounts created between 60 and 55 days ago that never connected
  // LinkedIn, didn't pay, no LTD, not admin, not an affiliate. They get the
  // warning email. Affiliates are excluded entirely - they're partners, not
  // trial signups, and may never intend to use the product themselves.
  const warnCandidates = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        lte(users.createdAt, fiftyFiveDaysAgo),
        isNull(users.linkedinProfileId),
        eq(users.plan, "free"),
        isNull(users.stripeSubscriptionId),
        eq(users.isLifetimeDeal, false),
        eq(users.isAdmin, false),
        isNotNull(users.email),
        notExists(
          db.select().from(affiliates).where(eq(affiliates.userId, users.id))
        )
      )
    );

  for (const user of warnCandidates) {
    if (!user.email) continue;
    // Only warn accounts that hit the 55-59 day window. Day 60+ goes to
    // delete phase.
    if (user.createdAt && user.createdAt <= sixtyDaysAgo) continue;
    try {
      const added = await addToInactiveWarningList(user.email, {
        SIGNUP_DATE: user.createdAt ? brevoDate(user.createdAt) : null,
      });
      if (added) stats.warned++;
    } catch {
      stats.errors++;
    }
  }

  // ---------- Phase B: Day 60 deletion ----------
  const deleteCandidates = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        lte(users.createdAt, sixtyDaysAgo),
        isNull(users.linkedinProfileId),
        eq(users.plan, "free"),
        isNull(users.stripeSubscriptionId),
        eq(users.isLifetimeDeal, false),
        eq(users.isAdmin, false),
        notExists(
          db.select().from(affiliates).where(eq(affiliates.userId, users.id))
        )
      )
    );

  for (const candidate of deleteCandidates) {
    try {
      // Race-safety re-check: refetch the user just before deleting and
      // re-verify every filter. If anything changed (upgrade, LinkedIn
      // connect, plan flip), skip the delete.
      const fresh = await db.query.users.findFirst({
        where: eq(users.id, candidate.id),
      });
      if (!fresh) {
        stats.delete_skipped++;
        continue;
      }
      if (fresh.linkedinProfileId) {
        stats.delete_skipped++;
        continue;
      }
      if (fresh.plan !== "free") {
        stats.delete_skipped++;
        continue;
      }
      if (fresh.stripeSubscriptionId) {
        stats.delete_skipped++;
        continue;
      }
      if (fresh.isLifetimeDeal) {
        stats.delete_skipped++;
        continue;
      }
      if (fresh.isAdmin) {
        stats.delete_skipped++;
        continue;
      }
      if (!fresh.createdAt || fresh.createdAt > sixtyDaysAgo) {
        stats.delete_skipped++;
        continue;
      }

      // Race-safety: if an affiliate record was created between the initial
      // query and now, skip the delete. Affiliates are partners, never auto-deleted.
      const affiliateRecord = await db.query.affiliates.findFirst({
        where: eq(affiliates.userId, candidate.id),
      });
      if (affiliateRecord) {
        stats.delete_skipped++;
        continue;
      }

      await deleteUserData(candidate.id);
      stats.deleted++;
    } catch {
      stats.errors++;
    }
  }


  // ---------- Phase C: the account that never got a card ----------
  // v2 grants no plan at signup. The row exists, it can sign in, and it can
  // reach nothing but the plan picker until Stripe says otherwise. Keeping
  // those for ever fills the table with people who never finished, so they are
  // warned 3 days out and closed on day 14.
  //
  // "Never had a subscription" is the whole test: hasUsedTrial is set by the
  // webhook the moment a Stripe trial starts, so an account with it false and
  // no subscription id has never been billable.
  const warnOn = daysAgo(UNCARDED_DELETE_DAYS - 3);
  const closeOn = daysAgo(UNCARDED_DELETE_DAYS);

  const uncardedBase = () =>
    and(
      eq(users.plan, "free"),
      eq(users.hasUsedTrial, false),
      isNull(users.stripeSubscriptionId),
      eq(users.isLifetimeDeal, false),
      eq(users.isAdmin, false)
    );

  const toWarn = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(and(uncardedBase(), lte(users.createdAt, warnOn), gt(users.createdAt, closeOn)));

  for (const account of toWarn) {
    if (!account.email || !account.createdAt) continue;
    const goesOn = new Date(account.createdAt.getTime() + UNCARDED_DELETE_DAYS * 86400000);
    try {
      await sendAbandonedCheckoutEmail({
        to: account.email,
        name: account.name,
        deletedOn: goesOn.toLocaleDateString("en-US", { day: "numeric", month: "long" }),
      });
      stats.uncarded_warned++;
    } catch {
      stats.errors++;
    }
  }

  const toClose = await db
    .select({ id: users.id })
    .from(users)
    .where(and(uncardedBase(), lte(users.createdAt, closeOn)));

  for (const account of toClose) {
    try {
      // Same race-safety as phase B: refetch and re-verify every filter, because
      // a checkout that completed one second ago must survive this loop.
      const fresh = await db.query.users.findFirst({ where: eq(users.id, account.id) });
      if (
        !fresh ||
        fresh.plan !== "free" ||
        fresh.hasUsedTrial ||
        fresh.stripeSubscriptionId ||
        fresh.isLifetimeDeal ||
        fresh.isAdmin ||
        !fresh.createdAt ||
        fresh.createdAt > closeOn
      ) {
        stats.uncarded_skipped++;
        continue;
      }
      const affiliateRecord = await db.query.affiliates.findFirst({
        where: eq(affiliates.userId, account.id),
      });
      if (affiliateRecord) {
        stats.uncarded_skipped++;
        continue;
      }
      await deleteUserData(account.id);
      stats.uncarded_deleted++;
    } catch {
      stats.errors++;
    }
  }


  // ---------- Phase D: the winback, days 3 and 7 ----------
  // Stripe tells us about a cancellation once, so the two later emails are a
  // clock rather than an event. churnStage is the marker: 0 means only the
  // day-0 email went, and it climbs so a cron that runs twice sends once.
  const churnDay3 = daysAgo(3);
  const churnDay7 = daysAgo(7);

  const churnQueue = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      churnedAt: users.churnedAt,
      churnStage: users.churnStage,
    })
    .from(users)
    .where(and(isNotNull(users.churnedAt), lte(users.churnedAt, churnDay3), isNull(users.stripeSubscriptionId)));

  stats.churn_candidates = churnQueue.length;
  for (const person of churnQueue) {
    if (!person.email || !person.churnedAt) continue;
    const stage = person.churnStage ?? 0;
    const due = person.churnedAt <= churnDay7 ? 2 : 1;
    if (stage >= due) continue;

    try {
      if (due === 1) {
        // Their own numbers, because "your agent read 412 profiles and kept 68"
        // is the only winback line that is not a discount.
        const [read] = await db
          .select({ n: count() })
          .from(agentLeads)
          .where(eq(agentLeads.workspaceId, person.id));
        const [kept] = await db
          .select({ n: count() })
          .from(agentLeads)
          .where(
            and(
              eq(agentLeads.workspaceId, person.id),
              inArray(agentLeads.step, ["queued", "invited", "accepted", "messaged", "replied"])
            )
          );
        await sendChurnValueEmail({
          to: person.email,
          name: person.name,
          read: read?.n ?? 0,
          kept: kept?.n ?? 0,
        });
      } else {
        await sendChurnAskEmail({ to: person.email, name: person.name });
      }
      await db
        .update(users)
        .set({ churnStage: due, updatedAt: new Date() })
        .where(eq(users.id, person.id));
      stats.churn_sent++;
    } catch (error) {
      stats.last_error = error instanceof Error ? error.message : "unknown";
      stats.errors++;
    }
  }

  // ---------- Phase E: a declined card stops the agents ----------
  // Pausing rather than deleting. It stops the LinkedIn activity and therefore
  // our per-agent cost, and the leads, the sequences and the history stay where
  // they are so a recovered card resumes instantly.
  const dunningDeadline = daysAgo(DUNNING_GRACE_DAYS);
  const overdue = await db
    .select({ id: users.id })
    .from(users)
    .where(and(isNotNull(users.paymentFailedAt), lte(users.paymentFailedAt, dunningDeadline)));

  for (const person of overdue) {
    try {
      // Count what actually changed. Counting the loop instead reported a
      // pause for a workspace whose agents were already stopped, which is how
      // a no-op read as a working feature on 2026-08-06.
      const result = await db
        .update(agents)
        .set({ status: "paused", updatedAt: new Date() })
        .where(and(eq(agents.workspaceId, person.id), eq(agents.status, "active")));
      stats.agents_paused += result.rowsAffected ?? 0;
    } catch {
      stats.errors++;
    }
  }

  return stats;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";

    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/inactive-accounts`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runInactiveAccounts();
    // A pass that swallowed failures must not report success. Returning 200 with
    // errors inside it is how phase D sent nothing for a day without anybody
    // noticing: QStash keeps no body for a 2xx, so the count was invisible.
    if (result.errors > 0) {
      return NextResponse.json({ ...result, error: "Some accounts failed" }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Inactive-accounts failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
