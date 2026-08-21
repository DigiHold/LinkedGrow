// Script to send test emails
import "dotenv/config";
import { sendEmail } from "../src/lib/email/ses-client";
import { signupWelcomeSubject, signupWelcomeEmailTemplate, signupWelcomeEmailText } from "../src/lib/email/templates/onboarding-emails";
import { resetPasswordEmailTemplate, resetPasswordEmailText } from "../src/lib/email/templates/reset-password-email";

async function sendTestEmails() {
  const testEmail = "contact@linkedgrow.ai";

  try {
    // Send the signup welcome email
    console.log("Sending signup welcome email...");
    await sendEmail({
      to: testEmail,
      subject: signupWelcomeSubject,
      html: signupWelcomeEmailTemplate({ firstName: "Nicolas" }),
      text: signupWelcomeEmailText({ firstName: "Nicolas" }),
    });
    console.log("Signup welcome email sent!");

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
