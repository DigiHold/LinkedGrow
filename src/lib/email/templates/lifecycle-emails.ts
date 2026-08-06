import { baseEmailTemplate } from "./base-template";
import { p, lead, small, button, textLink, figures, signature } from "./parts";

/**
 * The six emails about money, and the one thing they have in common.
 *
 * Every one of them shows the customer's own numbers rather than a promise.
 * A trial that found 84 people converts on that line alone, and a trial that
 * found 3 does not deserve to convert, so saying so is both honest and the
 * cheapest churn prevention there is: somebody who cancels because the product
 * did nothing tells us the product did nothing.
 *
 * v2 truths these must never break: the trial is 7 days, a card is required at
 * signup, the card is charged on day 7, and there is no free tier to fall back
 * to. "No credit card required" was v1 and is now false.
 */

const APP = "https://linkedgrow.ai";

// ------------------------------------------------------------ abandoned checkout

export const abandonedCheckoutSubject = "You stopped at the card";

export function abandonedCheckoutEmailTemplate(params: {
  firstName: string;
  /** Set when the account is close to being deleted. 8f: say the date plainly. */
  deletedOn?: string;
}): string {
  return baseEmailTemplate({
    preheader: "Two minutes from an agent that works while you do not.",
    content: `
${p(`Hello ${params.firstName},`)}
${lead("You got as far as the payment page and stopped.")}
${p("That is usually one of two things.")}
${p("If it was the card: the trial runs 7 days and you can cancel any time before it ends. The card is there so your agent keeps working the day the trial finishes, and for nothing else.")}
${p("If it was something else, reply to this email and tell me what it was. I read every one of them.")}
${params.deletedOn ? p(`An account with no card on it is closed after 14 days, so this one goes on ${params.deletedOn} unless you finish.`) : ""}
${button(`${APP}/dashboard`, "Finish setting up my agent")}
${signature()}
`,
  });
}

export const abandonedCheckoutEmailText = (params: { firstName: string; deletedOn?: string }) =>
  `Hello ${params.firstName},

You got as far as the payment page and stopped.

If it was the card: the trial runs 7 days and you can cancel any time before it ends. The card is there so your agent keeps working the day the trial finishes.

If it was something else, reply and tell me what it was.
${params.deletedOn ? `\nAn account with no card on it is closed after 14 days, so this one goes on ${params.deletedOn} unless you finish.\n` : ""}
${APP}/dashboard

Nicolas
Founder, LinkedGrow`;

// ----------------------------------------------------------------- trial ending

export const trialEndingSubject = "Your trial ends tomorrow";

export function trialEndingEmailTemplate(params: {
  firstName: string;
  endsOn: string;
  price: string;
  found: number;
  invited: number;
  accepted: number;
  replied: number;
}): string {
  const { firstName, endsOn, price, found, invited, accepted, replied } = params;
  return baseEmailTemplate({
    preheader: `Your card is charged ${price} on ${endsOn} unless you cancel.`,
    content: `
${p(`Hello ${firstName},`)}
${lead(`Your trial ends on ${endsOn} and your card is charged ${price} for the month unless you cancel before then.`)}
${p("What your agent did in 7 days:")}
${figures([
  { label: "People found", value: String(found) },
  { label: "Invitations sent", value: String(invited) },
  { label: "Accepted", value: String(accepted) },
  { label: "Replied", value: String(replied) },
])}
${button(`${APP}/dashboard/agents`, "See what it found")}
${p("If you want to stop, one click cancels and nothing is charged. There is no email to write and no call to book.")}
${textLink(`${APP}/dashboard/settings/billing`, "Cancel my trial")}
${signature()}
`,
  });
}

export const trialEndingEmailText = (params: {
  firstName: string;
  endsOn: string;
  price: string;
  found: number;
  replied: number;
}) =>
  `Hello ${params.firstName},

Your trial ends on ${params.endsOn} and your card is charged ${params.price} unless you cancel before then.

In 7 days your agent found ${params.found} people and ${params.replied} of them replied.

See what it found: ${APP}/dashboard/agents
Cancel: ${APP}/dashboard/settings/billing

Nicolas
Founder, LinkedGrow`;

// ---------------------------------------------------------------- payment failed

export const paymentFailedSubject = "Your card was declined";

export function paymentFailedEmailTemplate(params: {
  firstName: string;
  graceDays: number;
}): string {
  const { firstName, graceDays } = params;
  return baseEmailTemplate({
    preheader: `Your agent keeps running for ${graceDays} more days.`,
    content: `
${p(`Hello ${firstName},`)}
${lead("Your bank declined this month's payment.")}
${p(`Your agent keeps running for ${graceDays} more days while you sort it out.`)}
${button(`${APP}/dashboard/settings/billing`, "Update my card")}
${p("After that it pauses, and your leads, your conversations and your history stay exactly where they are. It starts again the moment the payment goes through.")}
${signature()}
`,
  });
}

export const paymentFailedEmailText = (params: { firstName: string; graceDays: number }) =>
  `Hello ${params.firstName},

Your bank declined this month's payment. Your agent keeps running for ${params.graceDays} more days while you sort it out.

${APP}/dashboard/settings/billing

After that it pauses, and nothing is deleted.

Nicolas
Founder, LinkedGrow`;

// ------------------------------------------------------------------- churn, day 0

export const churnImmediateSubject = "Your agent goes quiet tonight";

export function churnImmediateEmailTemplate(params: { firstName: string }): string {
  return baseEmailTemplate({
    preheader: "Everything it found stays. What stops is the finding.",
    content: `
${p(`Hello ${params.firstName},`)}
${lead("Your agent sends its last invitation tonight and stops at midnight.")}
${p("Until then it is still reading the sources you picked and still finding people who match. Everything it has found stays in your account and does not disappear.")}
${p("What stops is the finding, and the people posting about your problem tomorrow are the ones you will not see.")}
${button(`${APP}/dashboard/settings/billing`, "Keep my agent running")}
${signature()}
`,
  });
}

export const churnImmediateEmailText = (params: { firstName: string }) =>
  `Hello ${params.firstName},

Your agent sends its last invitation tonight and stops at midnight. Everything it found stays in your account.

What stops is the finding, and the people posting about your problem tomorrow are the ones you will not see.

${APP}/dashboard/settings/billing

Nicolas
Founder, LinkedGrow`;

// ------------------------------------------------------------------- churn, day 3

export const churnValueSubject = "What your agent found for you";

export function churnValueEmailTemplate(params: {
  firstName: string;
  read: number;
  kept: number;
}): string {
  const { firstName, read, kept } = params;
  return baseEmailTemplate({
    preheader: `${kept} people are still sitting in your account.`,
    content: `
${p(`Hello ${firstName},`)}
${lead(`While it was running, your agent read ${read} profiles and kept ${kept} of them.`)}
${p("They came from people commenting on your competitors, people asking about the problem you solve, and people who had just changed job. None of them would have reached you on their own, and finding them by hand is an afternoon a week.")}
${p("They are still in your account, and turning the agent back on carries on from there rather than starting over.")}
${button(`${APP}/dashboard/settings/billing`, "Turn it back on")}
${signature()}
`,
  });
}

export const churnValueEmailText = (params: {
  firstName: string;
  read: number;
  kept: number;
}) =>
  `Hello ${params.firstName},

While it was running, your agent read ${params.read} profiles and kept ${params.kept} of them, and they are still in your account.

Turning it back on carries on from there rather than starting over.

${APP}/dashboard/settings/billing

Nicolas
Founder, LinkedGrow`;

// ------------------------------------------------------------------- churn, day 7

/** Lower case and no emoji on purpose: it has to read as a person writing. */
export const churnAskSubject = "why did you cancel?";

export function churnAskEmailTemplate(params: { firstName: string }): string {
  return baseEmailTemplate({
    preheader: "Two words is enough.",
    content: `
${p(`Hello ${params.firstName},`)}
${p("You cancelled last week and I would like to know why.")}
${p("Was it that the leads were not good enough, that the setup was confusing, or that the timing was wrong?")}
${p("Two words in a reply is enough, and it helps more than you would think.")}
${p("If it was the leads, I will look at your account myself and tell you what I would have changed. That offer stands whether or not you come back.")}
${signature()}
`,
  });
}

export const churnAskEmailText = (params: { firstName: string }) =>
  `Hello ${params.firstName},

You cancelled last week and I would like to know why.

Was it that the leads were not good enough, that the setup was confusing, or that the timing was wrong?

Two words in a reply is enough.

If it was the leads, I will look at your account myself and tell you what I would have changed, whether or not you come back.

Nicolas
Founder, LinkedGrow`;
