// Password reset email template - sent when user requests password reset
import { baseEmailTemplate } from "./base-template";

interface ResetPasswordEmailParams {
  name?: string;
  resetUrl: string;
  expiresIn?: string;
}

export function resetPasswordEmailTemplate({
  name,
  resetUrl,
  expiresIn = "1 hour",
}: ResetPasswordEmailParams): string {
  const greeting = name ? `Hey ${name},` : "Hey there,";

  const content = `
    <h1>Reset your password</h1>

    <p>${greeting}</p>

    <p>We received a request to reset the password for your LinkedGrow account. Click the button below to create a new password:</p>

    <div class="text-center" style="margin: 32px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <div class="info-box">
      <p class="text-small text-muted" style="margin-bottom: 0;">
        <strong>This link will expire in ${expiresIn}.</strong><br>
        If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
      </p>
    </div>

    <hr class="divider">

    <p class="text-small text-muted">
      If the button above doesn't work, copy and paste this URL into your browser:
    </p>
    <p class="text-small" style="word-break: break-all; color: #06B6D4;">
      ${resetUrl}
    </p>

    <hr class="divider">

    <p class="text-small text-muted">
      If you didn't request this email, someone may have typed your email address by mistake. No action is needed - your account is secure.
    </p>
  `;

  return baseEmailTemplate({
    preheader: "Reset your LinkedGrow password",
    content,
  });
}

export function resetPasswordEmailText({
  name,
  resetUrl,
  expiresIn = "1 hour",
}: ResetPasswordEmailParams): string {
  const greeting = name ? `Hey ${name},` : "Hey there,";

  return `Reset your password

${greeting}

We received a request to reset the password for your LinkedGrow account.

Click this link to create a new password:
${resetUrl}

This link will expire in ${expiresIn}.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

---

If you didn't request this email, someone may have typed your email address by mistake. No action is needed - your account is secure.

LinkedGrow - AI-Powered LinkedIn Content Platform
https://linkedgrow.ai
`;
}
