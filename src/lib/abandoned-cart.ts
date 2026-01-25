// Abandoned cart recovery email scheduling
import { qstash } from "./qstash";
import { db } from "./db";
import { abandonedCheckouts, type AbandonedCheckout } from "./db/schema";
import { eq } from "drizzle-orm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

// Email timing (in days after abandonment)
const EMAIL_1_DELAY_DAYS = 2; // Day 2: Friendly reminder
const EMAIL_2_DELAY_DAYS = 5; // Day 5: Value reminder
const EMAIL_3_DELAY_DAYS = 8; // Day 8: Final push with discount

// Convert days to seconds for QStash
const DAYS_TO_SECONDS = 24 * 60 * 60;

/**
 * Schedule all 3 abandoned cart recovery emails
 */
export async function scheduleAbandonedCartEmails(
  checkout: Pick<AbandonedCheckout, "id" | "email" | "name" | "planId" | "recoveryUrl" | "stripeSessionId">
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  try {
    // Schedule Email 1: Day 2 - Friendly reminder
    const email1Response = await qstash.publishJSON({
      url: `${APP_URL}/api/abandoned-cart/send-email`,
      body: {
        checkoutId: checkout.id,
        emailNumber: 1,
      },
      notBefore: now + EMAIL_1_DELAY_DAYS * DAYS_TO_SECONDS,
      retries: 3,
    });

    // Schedule Email 2: Day 5 - Value reminder
    const email2Response = await qstash.publishJSON({
      url: `${APP_URL}/api/abandoned-cart/send-email`,
      body: {
        checkoutId: checkout.id,
        emailNumber: 2,
      },
      notBefore: now + EMAIL_2_DELAY_DAYS * DAYS_TO_SECONDS,
      retries: 3,
    });

    // Schedule Email 3: Day 8 - Final push with discount
    const email3Response = await qstash.publishJSON({
      url: `${APP_URL}/api/abandoned-cart/send-email`,
      body: {
        checkoutId: checkout.id,
        emailNumber: 3,
      },
      notBefore: now + EMAIL_3_DELAY_DAYS * DAYS_TO_SECONDS,
      retries: 3,
    });

    // Store QStash message IDs for potential cancellation
    await db
      .update(abandonedCheckouts)
      .set({
        email1QstashId: email1Response.messageId,
        email2QstashId: email2Response.messageId,
        email3QstashId: email3Response.messageId,
      })
      .where(eq(abandonedCheckouts.id, checkout.id));
  } catch (error) {
    throw error;
  }
}

/**
 * Cancel all scheduled abandoned cart emails (e.g., when user converts)
 */
export async function cancelAbandonedCartEmails(
  checkout: Pick<AbandonedCheckout, "id" | "email1QstashId" | "email2QstashId" | "email3QstashId">
): Promise<void> {
  const messageIds = [
    checkout.email1QstashId,
    checkout.email2QstashId,
    checkout.email3QstashId,
  ].filter(Boolean) as string[];

  for (const messageId of messageIds) {
    try {
      await qstash.messages.delete(messageId);
    } catch {
      // Message might already be delivered or not exist - ignore
    }
  }

  // Clear the QStash IDs
  await db
    .update(abandonedCheckouts)
    .set({
      email1QstashId: null,
      email2QstashId: null,
      email3QstashId: null,
    })
    .where(eq(abandonedCheckouts.id, checkout.id));
}

/**
 * Mark a specific email as sent
 */
export async function markEmailSent(
  checkoutId: string,
  emailNumber: 1 | 2 | 3
): Promise<void> {
  const updateField =
    emailNumber === 1
      ? { email1SentAt: new Date() }
      : emailNumber === 2
      ? { email2SentAt: new Date() }
      : { email3SentAt: new Date() };

  await db
    .update(abandonedCheckouts)
    .set(updateField)
    .where(eq(abandonedCheckouts.id, checkoutId));
}

/**
 * Check if an abandoned checkout should still receive emails
 * (not recovered, not expired, recovery URL still valid)
 */
export function shouldSendEmail(checkout: AbandonedCheckout): boolean {
  // Don't send if already recovered or unsubscribed
  if (checkout.status !== "pending") {
    return false;
  }

  // Don't send if recovery URL has expired
  if (checkout.recoveryUrlExpiresAt && new Date() > checkout.recoveryUrlExpiresAt) {
    return false;
  }

  return true;
}
