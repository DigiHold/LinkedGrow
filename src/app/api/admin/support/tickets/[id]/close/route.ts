// Admin closes a ticket. Two modes:
//   - sendReview=true: insert a "thanks!" system message in the thread and
//     send the review-request email (Google/Trustpilot/G2). Used for happy
//     customers.
//   - sendReview=false: insert a neutral closing system message and send the
//     plain "ticket closed" email.
import { NextRequest, NextResponse } from "next/server";
import { db, supportTickets, supportMessages, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSupportSession } from "@/lib/support";
import { sendEmail } from "@/lib/email/ses-client";
import {
  reviewRequestUserEmail,
  neutralCloseUserEmail,
} from "@/lib/email/templates/support-notification-email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getSupportSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const sendReview = !!body.sendReview;

  const now = new Date();
  const systemBody = sendReview
    ? "Marked as resolved. We've sent you a quick review request - if LinkedGrow has been useful, a 30-second review on any platform you use would mean a lot to us."
    : "Marked as resolved and closed. Reply anytime to reopen this ticket.";

  await db.insert(supportMessages).values({
    id: nanoid(),
    ticketId: id,
    senderId: session.user.id,
    isAdmin: true,
    isSystem: true,
    body: systemBody,
    createdAt: now,
  });

  await db
    .update(supportTickets)
    .set({
      status: "closed",
      resolvedAt: ticket.resolvedAt || now,
      closedAt: now,
      reviewRequestSentAt: sendReview ? now : ticket.reviewRequestSentAt,
      hasUnreadForUser: true,
      hasUnreadForAdmin: false,
      updatedAt: now,
    })
    .where(eq(supportTickets.id, id));

  const [recipient] = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
  if (recipient?.email) {
    (async () => {
      try {
        const email = sendReview
          ? reviewRequestUserEmail({
              subject: ticket.subject,
              userName: recipient.name || recipient.email.split("@")[0],
            })
          : neutralCloseUserEmail({
              ticketId: id,
              subject: ticket.subject,
              userName: recipient.name || recipient.email.split("@")[0],
            });
        await sendEmail({
          to: recipient.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
      } catch {
        // silent
      }
    })();
  }

  return NextResponse.json({ ok: true });
}
