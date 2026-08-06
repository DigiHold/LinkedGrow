/**
 * Sending the agent and lifecycle emails.
 *
 * The templates know nothing about who they go to. This file is the only place
 * that pairs a template with a subject and an address, so a subject line is
 * never written twice and the plain-text version is never forgotten.
 */

import { sendEmail } from "./ses-client";
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
  abandonedCheckoutSubject,
  abandonedCheckoutEmailTemplate,
  abandonedCheckoutEmailText,
  trialEndingSubject,
  trialEndingEmailTemplate,
  trialEndingEmailText,
  paymentFailedSubject,
  paymentFailedEmailTemplate,
  paymentFailedEmailText,
  churnImmediateSubject,
  churnImmediateEmailTemplate,
  churnImmediateEmailText,
  churnValueSubject,
  churnValueEmailTemplate,
  churnValueEmailText,
  churnAskSubject,
  churnAskEmailTemplate,
  churnAskEmailText,
} from "./templates/lifecycle-emails";

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
  return sendEmail({
    to: params.to,
    subject: leadsDigestSubject(params.count),
    html: leadsDigestEmailTemplate({ ...params, firstName }),
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
  return sendEmail({
    to: params.to,
    subject: verificationSubject,
    html: verificationEmailTemplate({ ...params, firstName }),
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
  return sendEmail({
    to: params.to,
    subject: agentStoppedSubject,
    html: agentStoppedEmailTemplate({ ...params, firstName }),
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
  return sendEmail({
    to: params.to,
    subject: replySubject(params.from),
    html: replyEmailTemplate({ ...params, firstName }),
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
  return sendEmail({
    to: params.to,
    subject: firstDaySubject,
    html: firstDayEmailTemplate({ ...params, firstName }),
    text: firstDayEmailText({ ...params, firstName }),
  });
}

// ------------------------------------------------------------------ lifecycle

export async function sendAbandonedCheckoutEmail(params: {
  to: string;
  name: string | null;
}) {
  const firstName = firstNameOf(params.name);
  return sendEmail({
    to: params.to,
    subject: abandonedCheckoutSubject,
    html: abandonedCheckoutEmailTemplate({ firstName }),
    text: abandonedCheckoutEmailText({ firstName }),
  });
}

export async function sendTrialEndingEmail(params: {
  to: string;
  name: string | null;
  endsOn: string;
  price: string;
  found: number;
  invited: number;
  accepted: number;
  replied: number;
}) {
  const firstName = firstNameOf(params.name);
  return sendEmail({
    to: params.to,
    subject: trialEndingSubject,
    html: trialEndingEmailTemplate({ ...params, firstName }),
    text: trialEndingEmailText({ ...params, firstName }),
  });
}

export async function sendPaymentFailedEmail(params: {
  to: string;
  name: string | null;
  graceDays: number;
}) {
  const firstName = firstNameOf(params.name);
  return sendEmail({
    to: params.to,
    subject: paymentFailedSubject,
    html: paymentFailedEmailTemplate({ ...params, firstName }),
    text: paymentFailedEmailText({ ...params, firstName }),
  });
}

export async function sendChurnImmediateEmail(params: {
  to: string;
  name: string | null;
}) {
  const firstName = firstNameOf(params.name);
  return sendEmail({
    to: params.to,
    subject: churnImmediateSubject,
    html: churnImmediateEmailTemplate({ firstName }),
    text: churnImmediateEmailText({ firstName }),
  });
}

export async function sendChurnValueEmail(params: {
  to: string;
  name: string | null;
  read: number;
  kept: number;
}) {
  const firstName = firstNameOf(params.name);
  return sendEmail({
    to: params.to,
    subject: churnValueSubject,
    html: churnValueEmailTemplate({ ...params, firstName }),
    text: churnValueEmailText({ ...params, firstName }),
  });
}

export async function sendChurnAskEmail(params: { to: string; name: string | null }) {
  const firstName = firstNameOf(params.name);
  return sendEmail({
    to: params.to,
    subject: churnAskSubject,
    html: churnAskEmailTemplate({ firstName }),
    text: churnAskEmailText({ firstName }),
  });
}
