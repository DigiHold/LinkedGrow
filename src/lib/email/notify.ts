/**
 * Sending the agent and operations emails.
 *
 * The templates know nothing about who they go to. This file is the only place
 * that pairs a template with a subject and an address, so a subject line is
 * never written twice and the plain-text version is never forgotten.
 */

import { sendEmail, opsRecipient } from "./ses-client";
import { instanceBrandName } from "./brand-name";
import {
  type Lead,
  leadsDigestSubject,
  leadsDigestEmailTemplate,
  leadsDigestEmailText,
  verificationSubject,
  verificationEmailTemplate,
  verificationEmailText,
  agentStoppedSubject,
  agentStoppedEmailTemplate,
  agentStoppedEmailText,
  replySubject,
  replyEmailTemplate,
  replyEmailText,
  firstDaySubject,
  firstDayEmailTemplate,
  firstDayEmailText,
} from "./templates/agent-alert-emails";
import {
  selectorAlertSubject,
  selectorAlertEmailTemplate,
  selectorAlertEmailText,
} from "./templates/ops-emails";
/** Everything here is addressed by first name, and a missing one is common. */
function firstNameOf(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first.length > 0 ? first : "there";
}

// --------------------------------------------------------------- agent alerts

export async function sendLeadsDigestEmail(params: {
  to: string;
  name: string | null;
  count: number;
  best: Lead[];
  queuedNext: number;
  agentId: string;
}) {
  const firstName = firstNameOf(params.name);
  const instanceName = await instanceBrandName();
  return sendEmail({
    to: params.to,
    subject: leadsDigestSubject(params.count),
    html: leadsDigestEmailTemplate({ ...params, firstName, instanceName }),
    text: leadsDigestEmailText({ ...params, firstName }),
  });
}

export async function sendVerificationNeededEmail(params: {
  to: string;
  name: string | null;
  accountName: string;
  agentId: string;
}) {
  const firstName = firstNameOf(params.name);
  const instanceName = await instanceBrandName();
  return sendEmail({
    to: params.to,
    subject: verificationSubject,
    html: verificationEmailTemplate({ ...params, firstName, instanceName }),
    text: verificationEmailText({ ...params, firstName }),
  });
}

export async function sendAgentStoppedEmail(params: {
  to: string;
  name: string | null;
  reason: string;
  retrying: boolean;
  agentId: string;
}) {
  const firstName = firstNameOf(params.name);
  const instanceName = await instanceBrandName();
  return sendEmail({
    to: params.to,
    subject: agentStoppedSubject,
    html: agentStoppedEmailTemplate({ ...params, firstName, instanceName }),
    text: agentStoppedEmailText({ ...params, firstName }),
  });
}

export async function sendReplyEmail(params: {
  to: string;
  name: string | null;
  from: string;
  body: string;
  agentContinues: boolean;
}) {
  const firstName = firstNameOf(params.name);
  const instanceName = await instanceBrandName();
  return sendEmail({
    to: params.to,
    subject: replySubject(params.from),
    html: replyEmailTemplate({ ...params, firstName, instanceName }),
    text: replyEmailText({ ...params, firstName }),
  });
}

export async function sendFirstDayEmail(params: {
  to: string;
  name: string | null;
  found: number;
  sources: number;
  perDay: number;
  agentId: string;
}) {
  const firstName = firstNameOf(params.name);
  const instanceName = await instanceBrandName();
  return sendEmail({
    to: params.to,
    subject: firstDaySubject,
    html: firstDayEmailTemplate({ ...params, firstName, instanceName }),
    text: firstDayEmailText({ ...params, firstName }),
  });
}

// ------------------------------------------------------------------ operations

/** Comes to us, not to a customer, and still through the same shell. */
export async function sendSelectorAlertEmail(params: {
  windowHours: number;
  published: number;
  failed: number;
  rate: number | null;
  selectorFailures: number;
  agentFailures: number;
  missing: string[];
}) {
  const to = await opsRecipient();
  if (!to) return { success: true, skipped: true as const, messageId: null };
  const instanceName = await instanceBrandName();
  return sendEmail({
    to,
    subject: selectorAlertSubject,
    html: selectorAlertEmailTemplate({ ...params, instanceName }),
    text: selectorAlertEmailText(params),
  });
}
