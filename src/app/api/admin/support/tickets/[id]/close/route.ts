// Admin closes a ticket. Three modes via `template`:
//   - "review"   : send the review-request email with Google/Trustpilot/G2
//                  logo cards. Use for happy customers.
//   - "thankyou" : send a friendly thank-you + "open another ticket anytime"
//                  email. Use as the default polite close.
//   - "silent"   : send the plain "ticket closed" email. Use when the
//                  customer was unhappy and you don't want to ask anything.
//
// Backwards compat: if `sendReview` (boolean) is sent instead, true -> review,
// false -> silent.
import { NextRequest, NextResponse } from "next/server";
import { db, supportTickets, supportMessages, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSupportSession } from "@/lib/support";
import { sendEmail } from "@/lib/email/ses-client";
import {
  reviewRequestUserEmail,
  thankYouCloseUserEmail,
  neutralCloseUserEmail,
} from "@/lib/email/templates/support-notification-email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type CloseTemplate = "review" | "thankyou" | "silent";

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
  const template: CloseTemplate =
    body.template === "review" || body.template === "thankyou" || body.template === "silent"
      ? body.template
      : body.sendReview
        ? "review"
        : "silent";

  const now = new Date();
  const systemBody =
    template === "review"
      ? "Marked as resolved. We've sent you a quick review request - if LinkedGrow has been useful, a 30-second review on any platform you use would mean a lot to us."
      : template === "thankyou"
        ? "Marked as resolved and closed. Thanks for reaching out - feel free to open another ticket anytime if anything else comes up."
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
      reviewRequestSentAt: template === "review" ? now : ticket.reviewRequestSentAt,
      hasUnreadForUser: true,
      hasUnreadForAdmin: false,
      updatedAt: now,
    })
    .where(eq(supportTickets.id, id));

  const [recipient] = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
  if (recipient?.email) {
    (async () => {
      try {
        const recipientName = recipient.name || recipient.email.split("@")[0];
        const email =
          template === "review"
            ? reviewRequestUserEmail({ subject: ticket.subject, userName: recipientName })
            : template === "thankyou"
              ? thankYouCloseUserEmail({ ticketId: id, subject: ticket.subject, userName: recipientName })
              : neutralCloseUserEmail({ ticketId: id, subject: ticket.subject, userName: recipientName });
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
