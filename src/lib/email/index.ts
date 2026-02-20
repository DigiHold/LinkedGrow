// Email utilities - Brevo transactional emails
export { sendEmail } from "./ses-client";
export { baseEmailTemplate } from "./templates/base-template";
export { welcomeEmailTemplate, welcomeEmailText } from "./templates/welcome-email";
export {
  resetPasswordEmailTemplate,
  resetPasswordEmailText,
} from "./templates/reset-password-email";
export {
  teamInviteEmailTemplate,
  teamInviteEmailText,
} from "./templates/team-invite-email";
export {
  abandonedCartEmail1Template,
  abandonedCartEmail1Text,
  abandonedCartEmail2Template,
  abandonedCartEmail2Text,
  abandonedCartEmail3Template,
  abandonedCartEmail3Text,
} from "./templates/abandoned-cart-email";
export {
  affiliateApplicationEmailTemplate,
  affiliateApplicationEmailText,
} from "./templates/affiliate-application-email";
export {
  affiliateApprovedEmailTemplate,
  affiliateApprovedEmailText,
} from "./templates/affiliate-approved-email";
export {
  affiliateRejectedEmailTemplate,
  affiliateRejectedEmailText,
} from "./templates/affiliate-rejected-email";
export {
  subscriptionWelcomeEmailTemplate,
  subscriptionWelcomeEmailText,
} from "./templates/subscription-welcome-email";

// Re-export send functions for convenience
import { sendEmail } from "./ses-client";
import { welcomeEmailTemplate, welcomeEmailText } from "./templates/welcome-email";
import {
  resetPasswordEmailTemplate,
  resetPasswordEmailText,
} from "./templates/reset-password-email";
import {
  teamInviteEmailTemplate,
  teamInviteEmailText,
} from "./templates/team-invite-email";
import {
  affiliateApplicationEmailTemplate,
  affiliateApplicationEmailText,
} from "./templates/affiliate-application-email";
import {
  affiliateApprovedEmailTemplate,
  affiliateApprovedEmailText,
} from "./templates/affiliate-approved-email";
import {
  affiliateRejectedEmailTemplate,
  affiliateRejectedEmailText,
} from "./templates/affiliate-rejected-email";
import {
  subscriptionWelcomeEmailTemplate,
  subscriptionWelcomeEmailText,
} from "./templates/subscription-welcome-email";

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

interface SendTeamInviteEmailParams {
  to: string;
  inviterName: string;
  teamName: string;
  role: "admin" | "member";
  inviteToken: string;
}

export async function sendTeamInviteEmail({
  to,
  inviterName,
  teamName,
  role,
  inviteToken,
}: SendTeamInviteEmailParams) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/invite?token=${inviteToken}`;

  return sendEmail({
    to,
    subject: `${inviterName} invited you to join ${teamName} on LinkedGrow`,
    html: teamInviteEmailTemplate({ inviterName, teamName, role, inviteUrl }),
    text: teamInviteEmailText({ inviterName, teamName, role, inviteUrl }),
  });
}

export async function sendAffiliateApplicationEmail({
  applicantName,
  applicantEmail,
  promotionPlan,
}: {
  applicantName: string;
  applicantEmail: string;
  promotionPlan: string;
}) {
  return sendEmail({
    to: "contact@linkedgrow.ai",
    subject: `New Affiliate Application: ${applicantName}`,
    html: affiliateApplicationEmailTemplate({ applicantName, applicantEmail, promotionPlan }),
    text: affiliateApplicationEmailText({ applicantName, applicantEmail, promotionPlan }),
  });
}

export async function sendAffiliateApprovedEmail({
  to,
  name,
  referralCode,
}: {
  to: string;
  name: string;
  referralCode: string;
}) {
  return sendEmail({
    to,
    subject: "Your LinkedGrow Affiliate Application Has Been Approved!",
    html: affiliateApprovedEmailTemplate({ name, referralCode }),
    text: affiliateApprovedEmailText({ name, referralCode }),
  });
}

export async function sendAffiliateRejectedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  return sendEmail({
    to,
    subject: "Update on Your LinkedGrow Affiliate Application",
    html: affiliateRejectedEmailTemplate({ name }),
    text: affiliateRejectedEmailText({ name }),
  });
}

export async function sendSubscriptionWelcomeEmail({
  to,
  name,
  planName,
}: {
  to: string;
  name?: string;
  planName: string;
}) {
  const displayPlan = planName.charAt(0).toUpperCase() + planName.slice(1);
  return sendEmail({
    to,
    subject: `Welcome to LinkedGrow ${displayPlan}!`,
    html: subscriptionWelcomeEmailTemplate({ name, planName }),
    text: subscriptionWelcomeEmailText({ name, planName }),
  });
}
