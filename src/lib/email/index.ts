// Email utilities - transactional emails
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
  networkNotificationInviteEmailTemplate,
  networkNotificationInviteEmailText,
} from "./templates/network-notification-invite-email";
export {
  networkNotificationNotifyEmailTemplate,
  networkNotificationNotifyEmailText,
} from "./templates/network-notification-notify-email";

export * from "./templates/agent-alert-emails";
export * from "./templates/ops-emails";
export {
  sendLeadsDigestEmail,
  sendVerificationNeededEmail,
  sendAgentStoppedEmail,
  sendReplyEmail,
  sendFirstDayEmail,
  sendSelectorAlertEmail,
} from "./notify";

// Re-export send functions for convenience
import { sendEmail } from "./ses-client";
import { getAppUrl } from "@/lib/app-url";
import { instanceBrandName } from "./brand-name";
import {
  resetPasswordEmailTemplate,
  resetPasswordEmailText,
} from "./templates/reset-password-email";
import {
  teamInviteEmailTemplate,
  teamInviteEmailText,
} from "./templates/team-invite-email";
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
  const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`;

  const instanceName = await instanceBrandName();
  return sendEmail({
    to,
    subject: "Reset your LinkedGrow password",
    html: resetPasswordEmailTemplate({ name, resetUrl, instanceName }),
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
  const inviteUrl = `${getAppUrl()}/team/invite?token=${inviteToken}`;

  const instanceName = await instanceBrandName();
  return sendEmail({
    to,
    subject: `${inviterName} invited you to join ${teamName} on LinkedGrow`,
    html: teamInviteEmailTemplate({ inviterName, teamName, role, inviteUrl, instanceName }),
    text: teamInviteEmailText({ inviterName, teamName, role, inviteUrl }),
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
  const inviteUrl = `${getAppUrl()}/network-notifications/invite?token=${inviteToken}`;

  const instanceName = await instanceBrandName();
  return sendEmail({
    to,
    subject: `${inviterName} invited you to a Network Notifications group on LinkedGrow`,
    html: networkNotificationInviteEmailTemplate({ inviterName, groupName, inviteUrl, instanceName }),
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
  const instanceName = await instanceBrandName();
  return sendEmail({
    to,
    subject: `${publisherName} just published a new post`,
    html: networkNotificationNotifyEmailTemplate({ publisherName, groupName, postPreview, linkedinUrl, instanceName }),
    text: networkNotificationNotifyEmailText({ publisherName, groupName, postPreview, linkedinUrl }),
  });
}
