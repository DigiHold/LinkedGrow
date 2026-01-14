// Email utilities - AWS SES transactional emails
export { sendEmail } from "./ses-client";
export { baseEmailTemplate } from "./templates/base-template";
export { welcomeEmailTemplate, welcomeEmailText } from "./templates/welcome-email";
export {
  resetPasswordEmailTemplate,
  resetPasswordEmailText,
} from "./templates/reset-password-email";

// Re-export send functions for convenience
import { sendEmail } from "./ses-client";
import { welcomeEmailTemplate, welcomeEmailText } from "./templates/welcome-email";
import {
  resetPasswordEmailTemplate,
  resetPasswordEmailText,
} from "./templates/reset-password-email";

interface SendWelcomeEmailParams {
  to: string;
  name?: string;
}

export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams) {
  return sendEmail({
    to,
    subject: "Welcome to LinkedGrow!",
    html: welcomeEmailTemplate({ name, email: to }),
    text: welcomeEmailText({ name, email: to }),
  });
}

interface SendPasswordResetEmailParams {
  to: string;
  name?: string;
  resetToken: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: "Reset your LinkedGrow password",
    html: resetPasswordEmailTemplate({ name, resetUrl }),
    text: resetPasswordEmailText({ name, resetUrl }),
  });
}
