// QStash endpoint to send abandoned cart recovery emails
import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db } from "@/lib/db";
import { abandonedCheckouts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import {
  abandonedCartEmail1Template,
  abandonedCartEmail1Text,
  abandonedCartEmail2Template,
  abandonedCartEmail2Text,
  abandonedCartEmail3Template,
  abandonedCartEmail3Text,
} from "@/lib/email/templates/abandoned-cart-email";
import { markEmailSent, shouldSendEmail } from "@/lib/abandoned-cart";
import type { PlanId } from "@/lib/plans";

// Discount settings for Email 3
const DISCOUNT_CODE = "COMEBACK10";
const DISCOUNT_PERCENT = 10;
const DISCOUNT_MONTHS = 3;

// Subject lines for each email - always personalized with name when available
const SUBJECT_LINES = {
  1: (name?: string) =>
    name
      ? `${name}, your LinkedGrow upgrade is waiting`
      : "Your LinkedGrow upgrade is waiting",
  2: (name?: string) =>
    name
      ? `${name}, quick question about your upgrade`
      : "Quick question about your upgrade",
  3: (name?: string) =>
    name
      ? `${name}, last chance: ${DISCOUNT_PERCENT}% off your upgrade`
      : `Last chance: ${DISCOUNT_PERCENT}% off your LinkedGrow upgrade`,
};

// Initialize QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();

    // Verify the request is from QStash
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.error("QStash abandoned-cart: missing upstash-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/abandoned-cart/send-email`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch (verifyError) {
      console.error("QStash abandoned-cart signature verification failed:", {
        verifyUrl,
        error: verifyError instanceof Error ? verifyError.message : verifyError,
        bodyPreview: body.substring(0, 200),
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!isValid) {
      console.error("QStash abandoned-cart: signature returned invalid", { verifyUrl });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the body
    const { checkoutId, emailNumber } = JSON.parse(body) as {
      checkoutId: string;
      emailNumber: 1 | 2 | 3;
    };

    if (!checkoutId || !emailNumber) {
      return NextResponse.json(
        { error: "Missing checkoutId or emailNumber" },
        { status: 400 }
      );
    }

    // Get the abandoned checkout record
    const checkout = await db
      .select()
      .from(abandonedCheckouts)
      .where(eq(abandonedCheckouts.id, checkoutId))
      .limit(1);

    if (!checkout[0]) {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
    }

    const record = checkout[0];

    // Check if we should still send this email
    if (!shouldSendEmail(record)) {
      return NextResponse.json({ skipped: true, reason: "checkout_not_pending" });
    }

    // Check if this specific email was already sent
    const alreadySent =
      (emailNumber === 1 && record.email1SentAt) ||
      (emailNumber === 2 && record.email2SentAt) ||
      (emailNumber === 3 && record.email3SentAt);

    if (alreadySent) {
      return NextResponse.json({ skipped: true, reason: "already_sent" });
    }

    // Make sure we have a recovery URL
    if (!record.recoveryUrl) {
      return NextResponse.json({ error: "No recovery URL" }, { status: 400 });
    }

    // Generate email content based on email number
    let html: string;
    let text: string;
    const planId = record.planId as PlanId;

    if (emailNumber === 1) {
      html = abandonedCartEmail1Template({
        name: record.name || undefined,
        planId,
        recoveryUrl: record.recoveryUrl,
      });
      text = abandonedCartEmail1Text({
        name: record.name || undefined,
        planId,
        recoveryUrl: record.recoveryUrl,
      });
    } else if (emailNumber === 2) {
      html = abandonedCartEmail2Template({
        name: record.name || undefined,
        planId,
        recoveryUrl: record.recoveryUrl,
      });
      text = abandonedCartEmail2Text({
        name: record.name || undefined,
        planId,
        recoveryUrl: record.recoveryUrl,
      });
    } else {
      // Email 3 includes discount
      html = abandonedCartEmail3Template({
        name: record.name || undefined,
        planId,
        recoveryUrl: record.recoveryUrl,
        discountCode: DISCOUNT_CODE,
        discountPercent: DISCOUNT_PERCENT,
        discountMonths: DISCOUNT_MONTHS,
      });
      text = abandonedCartEmail3Text({
        name: record.name || undefined,
        planId,
        recoveryUrl: record.recoveryUrl,
        discountCode: DISCOUNT_CODE,
        discountPercent: DISCOUNT_PERCENT,
        discountMonths: DISCOUNT_MONTHS,
      });
    }

    // Send the email
    const subject = SUBJECT_LINES[emailNumber](record.name || undefined);

    await sendEmail({
      to: record.email,
      subject,
      html,
      text,
    });

    // Mark the email as sent
    await markEmailSent(checkoutId, emailNumber);

    return NextResponse.json({ success: true, emailNumber });
  } catch {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
