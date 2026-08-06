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
import { sendAbandonedCheckoutEmail } from "@/lib/email";

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
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Inactive-accounts failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
