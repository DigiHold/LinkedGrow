// Admin closes a ticket with one of two templates: "review" or "thankyou".
// The rich content (logo cards / thank-you panel) lives in the ticket
// thread itself - the email is just a "you got a reply" notification with
// a button to view the ticket.
//
// Backwards compat: { sendReview: true } -> review, false -> thankyou.
import { NextRequest, NextResponse } from "next/server";
import { db, supportTickets, supportMessages, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSupportSession } from "@/lib/support";
import { sendEmail } from "@/lib/email/ses-client";
import { adminReplyUserEmail } from "@/lib/email/templates/support-notification-email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type CloseTemplate = "review" | "thankyou";

// The body field stores the prose part of the system message. The frontend
// renders the rich UI (logo cards, CTA buttons) based on the `kind` column,
// so this body is just the lead text.
const REVIEW_BODY =
  "Glad we could help! If LinkedGrow has been useful, a quick review would mean a lot to a small team like ours - it takes 30 seconds. Pick whichever platform you already use:";
const THANKYOU_BODY =
  "Thanks for reaching out! We're closing this ticket for now. If anything else comes up - a bug, a question, a feature idea - just open another ticket and we'll be right here.";

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
    body.template === "review" || body.template === "thankyou"
      ? body.template
      : body.sendReview
        ? "review"
        : "thankyou";

  const now = new Date();
  const messageBody = template === "review" ? REVIEW_BODY : THANKYOU_BODY;
  const messageKind: "review_request" | "thank_you" = template === "review" ? "review_request" : "thank_you";

  await db.insert(supportMessages).values({
    id: nanoid(),
    ticketId: id,
    senderId: session.user.id,
    isAdmin: true,
    isSystem: true,
    kind: messageKind,
    body: messageBody,
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

  // Email is just a "new reply" notification - the rich content lives on
  // the ticket page so users see the logo cards / thank-you panel there.
  const [recipient] = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
  if (recipient?.email) {
    (async () => {
      try {
        const previewBody =
          template === "review"
            ? "Your ticket is closed - we'd love it if you'd leave us a quick review."
            : "Your ticket is closed - thanks again for reaching out.";
        const email = adminReplyUserEmail({
          ticketId: id,
          subject: ticket.subject,
          body: previewBody,
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
