/**
 * The independent eye on the dedicated addresses.
 *
 * The renewal itself lives in the worker on the VPS, because the supplier's
 * API only answers that box. This cron is the leg that stands somewhere else:
 * if the VPS dies, the worker crashes, or the renewal pass silently stops
 * running, nothing over there can say so. This runs on Vercel, reads only our
 * own database, and mails the operations address (contact@ in the cloud, the
 * instance admin on a self hosted install) when either of two things is true:
 *
 *  1. The renewal pass has not left its heartbeat for over 36 hours.
 *  2. An address bound to a paying customer ends within 7 days, which the
 *     pass renews at 10 days out, so seeing 7 means renewal is not happening.
 *
 * An expired address cannot be recovered (no grace period at the supplier,
 * confirmed 2026-08-20), so the whole defence is hearing about it while there
 * are still days on the clock.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts, proxyAllocations, users, workerFlags } from "@/lib/db/schema";
import { sendEmail, opsRecipient } from "@/lib/email/ses-client";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

const HEARTBEAT_STALE_MS = 36 * 60 * 60 * 1000;
const DANGER_DAYS = 7;

async function runWatchdog() {
  const problems: string[] = [];

  const [beat] = await db
    .select()
    .from(workerFlags)
    .where(eq(workerFlags.key, "proxy-renew-last-run"))
    .limit(1);
  if (!beat) {
    problems.push(
      "The proxy renewal pass has never left a heartbeat. Either it has never run, or it cannot reach the database."
    );
  } else if (Date.now() - beat.updatedAt.getTime() > HEARTBEAT_STALE_MS) {
    problems.push(
      `The proxy renewal pass last ran ${beat.updatedAt.toISOString()}. Check the VPS: cron /etc/cron.d/linkedgrow-proxy-renew, log /opt/linkedgrow/proxy-renew.log.`
    );
  }

  // Bound to a paying workspace and ending inside the danger window. The
  // ownership join goes through the LinkedIn account, the same way the
  // renewal pass decides it.
  const danger = new Date(Date.now() + DANGER_DAYS * 86_400_000);
  const closeRows = await db
    .select({
      country: proxyAllocations.country,
      exitIp: proxyAllocations.lastExitIp,
      ref: proxyAllocations.providerRef,
      expiresAt: proxyAllocations.expiresAt,
      account: linkedinAccounts.fullName,
    })
    .from(proxyAllocations)
    .innerJoin(linkedinAccounts, eq(linkedinAccounts.id, proxyAllocations.linkedinAccountId))
    .innerJoin(users, eq(users.id, linkedinAccounts.workspaceId))
    .where(
      and(
        eq(proxyAllocations.source, "managed"),
        eq(proxyAllocations.status, "active"),
        isNotNull(proxyAllocations.expiresAt),
        lt(proxyAllocations.expiresAt, danger),
        sql`(${users.isAdmin} = 1 OR ${users.isLifetimeDeal} = 1 OR (${users.stripeSubscriptionId} IS NOT NULL AND ${users.stripeSubscriptionId} != ''))`
      )
    );

  for (const row of closeRows) {
    problems.push(
      `${row.country} address ${row.exitIp ?? "?"} (order ${row.ref ?? "?"}, account "${row.account ?? "?"}") ends ${row.expiresAt?.toISOString().slice(0, 10)} and belongs to a paying customer. The pass renews at 10 days out; at ${DANGER_DAYS} it is not happening.`
    );
  }

  // No recipient means nobody is listening; the summary still says so.
  const to = problems.length ? await opsRecipient() : "";
  if (to) {
    await sendEmail({
      to,
      subject: `Proxy watchdog: ${problems.length} problem${problems.length === 1 ? "" : "s"}`,
      html: `<p>${problems.join("</p><p>")}</p><p>An expired address cannot be recovered, so act while there are days left.</p>`,
      text: problems.join("\n\n"),
    });
  }

  return { problems: problems.length, checked: closeRows.length, heartbeat: beat?.updatedAt ?? null, notified: to !== "" };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";
    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/proxy-watchdog`,
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
    const result = await runWatchdog();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Watchdog failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
