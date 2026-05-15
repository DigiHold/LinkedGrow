/**
 * Daily cron - auto-close support tickets that have been in_progress for
 * 14+ days waiting on the user. Inserts a system message in the thread
 * (the "we haven't heard back" template) and emails the user.
 *
 * Targets: status = 'in_progress' AND last activity was admin (lastAdminReplyAt
 * after lastUserReplyAt or no user reply yet) AND lastAdminReplyAt > 14 days ago.
 */
import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db, supportTickets, supportMessages, users } from "@/lib/db";
import { and, eq, lte, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/email/ses-client";
import { autoCloseUserEmail } from "@/lib/email/templates/support-notification-email";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

const AUTO_CLOSE_MESSAGE =
  "Since we haven't heard back from you in 14 days, we're closing this ticket. You can reopen it anytime by replying.";

async function runAutoCloseTickets() {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Candidates: in_progress tickets where the last admin reply is older
  // than 14 days AND the user hasn't replied since (lastUserReplyAt is
  // either null or before the admin reply).
  const candidates = await db
    .select()
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.status, "in_progress"),
        isNotNull(supportTickets.lastAdminReplyAt),
        lte(supportTickets.lastAdminReplyAt, fourteenDaysAgo),
        sql`(${supportTickets.lastUserReplyAt} IS NULL OR ${supportTickets.lastUserReplyAt} < ${supportTickets.lastAdminReplyAt})`
      )
    )
    .limit(200);

  if (candidates.length === 0) return { closed: 0 };

  let emailsSent = 0;
  for (const ticket of candidates) {
    await db.insert(supportMessages).values({
      id: nanoid(),
      ticketId: ticket.id,
      senderId: null,
      isAdmin: true,
      isSystem: true,
      body: AUTO_CLOSE_MESSAGE,
      createdAt: now,
    });
    await db
      .update(supportTickets)
      .set({
        status: "closed",
        closedAt: now,
        hasUnreadForUser: true,
        updatedAt: now,
      })
      .where(eq(supportTickets.id, ticket.id));

    const [recipient] = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
    if (recipient?.email) {
      try {
        const tpl = autoCloseUserEmail({ ticketId: ticket.id, subject: ticket.subject });
        await sendEmail({
          to: recipient.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
        emailsSent++;
      } catch {
        // continue closing other tickets even if one email fails
      }
    }
  }

  return { closed: candidates.length, emailsSent };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";
    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/auto-close-tickets`,
    });
    if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  } catch {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runAutoCloseTickets();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Auto-close failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
