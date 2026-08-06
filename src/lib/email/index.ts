// Email utilities - Brevo transactional emails
export { sendEmail } from "./ses-client";
export { baseEmailTemplate } from "./templates/base-template";

export {
  resetPasswordEmailTemplate,
  resetPasswordEmailText,
} from "./templates/reset-password-email";
export {
  teamInviteEmailTemplate,
  teamInviteEmailText,
} from "./templates/team-invite-email";
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
export {
  networkNotificationInviteEmailTemplate,
  networkNotificationInviteEmailText,
} from "./templates/network-notification-invite-email";
export {
  networkNotificationNotifyEmailTemplate,
  networkNotificationNotifyEmailText,
} from "./templates/network-notification-notify-email";

export * from "./templates/agent-alert-emails";
export * from "./templates/lifecycle-emails";
export {
  sendLeadsDigestEmail,
  sendVerificationNeededEmail,
  sendAgentStoppedEmail,
  sendReplyEmail,
  sendFirstDayEmail,
  sendAbandonedCheckoutEmail,
  sendTrialEndingEmail,
  sendPaymentFailedEmail,
  sendChurnImmediateEmail,
  sendChurnValueEmail,
  sendChurnAskEmail,
} from "./notify";

// Re-export send functions for convenience
import { sendEmail } from "./ses-client";
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
import {
  networkNotificationInviteEmailTemplate,
  networkNotificationInviteEmailText,
} from "./templates/network-notification-invite-email";
import {
  networkNotificationNotifyEmailTemplate,
  networkNotificationNotifyEmailText,
} from "./templates/network-notification-notify-email";

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
  affiliateId,
}: {
  applicantName: string;
  applicantEmail: string;
  promotionPlan: string;
  affiliateId: string;
}) {
  return sendEmail({
    to: "contact@linkedgrow.ai",
    subject: `New Affiliate Application: ${applicantName}`,
    html: affiliateApplicationEmailTemplate({ applicantName, applicantEmail, promotionPlan, affiliateId }),
    text: affiliateApplicationEmailText({ applicantName, applicantEmail, promotionPlan, affiliateId }),
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


interface SendNetworkNotificationInviteEmailParams {
  to: string;
  inviterName: string;
  groupName: string;
  inviteToken: string;
}

export async function sendNetworkNotificationInviteEmail({
  to,
  inviterName,
  groupName,
  inviteToken,
}: SendNetworkNotificationInviteEmailParams) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/network-notifications/invite?token=${inviteToken}`;

  return sendEmail({
    to,
    subject: `${inviterName} invited you to a Network Notifications group on LinkedGrow`,
    html: networkNotificationInviteEmailTemplate({ inviterName, groupName, inviteUrl }),
    text: networkNotificationInviteEmailText({ inviterName, groupName, inviteUrl }),
  });
}

interface SendNetworkNotificationNotifyEmailParams {
  to: string;
  publisherName: string;
  groupName: string;
  postPreview: string;
  linkedinUrl: string;
}

export async function sendNetworkNotificationNotifyEmail({
  to,
  publisherName,
  groupName,
  postPreview,
  linkedinUrl,
}: SendNetworkNotificationNotifyEmailParams) {
  return sendEmail({
    to,
    subject: `${publisherName} just published a new post`,
    html: networkNotificationNotifyEmailTemplate({ publisherName, groupName, postPreview, linkedinUrl }),
    text: networkNotificationNotifyEmailText({ publisherName, groupName, postPreview, linkedinUrl }),
  });
}
