// Sends the password reset email to an address you give it, to check the
// transactional email configuration of an instance.
//   npx tsx scripts/send-test-emails.ts you@example.com
import "dotenv/config";
import { sendEmail } from "../src/lib/email/ses-client";
import { resetPasswordEmailTemplate, resetPasswordEmailText } from "../src/lib/email/templates/reset-password-email";
import { getAppUrl } from "../src/lib/app-url";

async function sendTestEmails() {
  const testEmail = process.argv[2];
  if (!testEmail) {
    console.error("Usage: npx tsx scripts/send-test-emails.ts you@example.com");
    process.exit(1);
  }
  const resetUrl = `${getAppUrl()}/reset-password?token=test123`;

  try {
    console.log("Sending password reset email...");
    await sendEmail({
      to: testEmail,
      subject: "Reset your LinkedGrow password",
      html: resetPasswordEmailTemplate({ name: "Nicolas", resetUrl }),
      text: resetPasswordEmailText({ name: "Nicolas", resetUrl }),
    });
    console.log("Password reset email sent to:", testEmail);
  } catch (error) {
    console.error("Error sending emails:", error);
  }
}

sendTestEmails();
