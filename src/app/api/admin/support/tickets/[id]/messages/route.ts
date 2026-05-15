// Admin replies to a ticket. Sets status to in_progress, emails user.
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const message = String(body.message || "").trim();
  if (!message || message.length > 10000) {
    return NextResponse.json({ error: "Message is required (max 10000 chars)" }, { status: 400 });
  }

  const messageId = nanoid();
  const now = new Date();

  await db.insert(supportMessages).values({
    id: messageId,
    ticketId: id,
    senderId: session.user.id,
    isAdmin: true,
    isSystem: false,
    body: message,
    createdAt: now,
  });

  await db
    .update(supportTickets)
    .set({
      status: "in_progress",
      lastAdminReplyAt: now,
      hasUnreadForUser: true,
      hasUnreadForAdmin: false,
      updatedAt: now,
    })
    .where(eq(supportTickets.id, id));

  const [recipient] = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
  if (recipient?.email) {
    (async () => {
      try {
        const email = adminReplyUserEmail({
          ticketId: id,
          subject: ticket.subject,
          body: message,
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
