// Script to send test emails
import "dotenv/config";
import { sendEmail } from "../src/lib/email/ses-client";
import { welcomeEmailTemplate, welcomeEmailText } from "../src/lib/email/templates/welcome-email";
import { resetPasswordEmailTemplate, resetPasswordEmailText } from "../src/lib/email/templates/reset-password-email";

async function sendTestEmails() {
  const testEmail = "contact@linkedgrow.ai";

  try {
    // Send welcome email
    console.log("Sending welcome email...");
    await sendEmail({
      to: testEmail,
      subject: "Welcome to LinkedGrow!",
      html: welcomeEmailTemplate({ name: "Nicolas", email: testEmail }),
      text: welcomeEmailText({ name: "Nicolas", email: testEmail }),
    });
    console.log("Welcome email sent!");

    // Send password reset email
    console.log("Sending password reset email...");
    await sendEmail({
      to: testEmail,
      subject: "Reset your LinkedGrow password",
      html: resetPasswordEmailTemplate({
        name: "Nicolas",
        resetUrl: "https://linkedgrow.ai/reset-password?token=test123",
      }),
      text: resetPasswordEmailText({
        name: "Nicolas",
        resetUrl: "https://linkedgrow.ai/reset-password?token=test123",
      }),
    });
    console.log("Password reset email sent!");

    console.log("\nBoth emails sent successfully to:", testEmail);
  } catch (error) {
    console.error("Error sending emails:", error);
  }
}

sendTestEmails();
