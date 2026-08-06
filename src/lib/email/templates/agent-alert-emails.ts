import { baseEmailTemplate } from "./base-template";
import { p, lead, small, button, quote, personRow, figures, signature } from "./parts";

/**
 * What the agent tells its owner.
 *
 * Five emails, and the split between them is deliberate. Four are immediate,
 * because their whole value is arriving before the customer would have found
 * out on their own: a verification blocking the account, the agent stopping, a
 * reply waiting, the first day. One is a weekly digest, because a mail per day
 * about leads gets archived by Thursday and the open rate goes with it.
 *
 * Subject lines are 18 to 31 characters. Mobile is 68% of opens and cuts at
 * about 50, and urgency wears out: past two urgent subjects a month to the same
 * person, opens drop 8 to 12% per extra send. So urgency is spent only on the
 * three that genuinely cannot wait.
 */

const APP = "https://linkedgrow.ai";

export type Lead = {
  name: string;
  title: string;
  why: string;
  score: number | null;
};

// ---------------------------------------------------------------- weekly digest

export const leadsDigestSubject = (count: number) =>
  count === 1 ? "1 new lead this week" : `${count} new leads, all scored`;

export function leadsDigestEmailTemplate(params: {
  firstName: string;
  count: number;
  best: Lead[];
  queuedNext: number;
  agentId: string;
}): string {
  const { firstName, count, best, queuedNext, agentId } = params;
  return baseEmailTemplate({
    preheader: `${count} people your agent found this week, scored against your audience.`,
    content: `
${p(`Hello ${firstName},`)}
${lead(`Your agent found ${count} ${count === 1 ? "person" : "people"} this week and scored every one of them against the audience you described.`)}
${best.length ? p("The strongest of them:") : ""}
${best.map((b) => personRow(b.name, b.title, b.why, b.score)).join("")}
${button(`${APP}/dashboard/agents/${agentId}`, "See all of them")}
${
  queuedNext > 0
    ? p(
        `${queuedNext} ${queuedNext === 1 ? "person is" : "people are"} queued to be contacted next, and you can read or change every message before it goes out.`
      )
    : ""
}
${signature()}
`,
  });
}

export const leadsDigestEmailText = (params: {
  firstName: string;
  count: number;
  best: Lead[];
  agentId: string;
}) =>
  `Hello ${params.firstName},

Your agent found ${params.count} people this week and scored every one against the audience you described.

${params.best.map((b) => `${b.name} (${b.score ?? "unscored"}) - ${b.title}. ${b.why}`).join("\n")}

See all of them: ${APP}/dashboard/agents/${params.agentId}

Nicolas
Founder, LinkedGrow`;

// ---------------------------------------------------------- verification needed

export const verificationSubject = "Your LinkedIn needs 2 minutes";

export function verificationEmailTemplate(params: {
  firstName: string;
  accountName: string;
  agentId: string;
}): string {
  const { firstName, accountName, agentId } = params;
  return baseEmailTemplate({
    preheader: "Your agent is paused until LinkedIn is answered. It takes two minutes.",
    content: `
${p(`Hello ${firstName},`)}
${lead(`LinkedIn asked ${accountName} to verify itself, so your agent has stopped until that is answered.`)}
${p("Nothing was lost while it waited and nobody was contacted. Your leads and your conversations are exactly where you left them.")}
${p("Open LinkedIn, answer what it asks, then press Start on your agent. It signs itself back in within seconds and carries on.")}
${button(`${APP}/dashboard/agents/${agentId}`, "Open my agent")}
${small("This happens to accounts that have been quiet for a while and then start reaching out. It is a check rather than a penalty, and it clears the moment you answer it.")}
${signature()}
`,
  });
}

export const verificationEmailText = (params: {
  firstName: string;
  accountName: string;
  agentId: string;
}) =>
  `Hello ${params.firstName},

LinkedIn asked ${params.accountName} to verify itself, so your agent has stopped until that is answered. Nothing was lost and nobody was contacted.

Open LinkedIn, answer what it asks, then press Start on your agent. It signs itself back in within seconds.

${APP}/dashboard/agents/${params.agentId}

Nicolas
Founder, LinkedGrow`;

// ------------------------------------------------------------------ agent stopped

export const agentStoppedSubject = "Your agent stopped";

export function agentStoppedEmailTemplate(params: {
  firstName: string;
  reason: string;
  retrying: boolean;
  agentId: string;
}): string {
  const { firstName, reason, retrying, agentId } = params;
  return baseEmailTemplate({
    preheader: retrying
      ? "It is already trying to start itself again."
      : "It needs you before it can carry on.",
    content: `
${p(`Hello ${firstName},`)}
${lead("Your agent stopped and has not sent anything since.")}
${p(`What it reported: ${reason}`)}
${
  retrying
    ? p("It is already trying to start itself again and usually succeeds within a minute. This email exists so that you know, rather than finding out on Friday.")
    : p("It will not start again on its own. Opening it and pressing Start re-checks the account.")
}
${button(`${APP}/dashboard/agents/${agentId}`, "Check my agent")}
${signature()}
`,
  });
}

export const agentStoppedEmailText = (params: {
  firstName: string;
  reason: string;
  agentId: string;
}) =>
  `Hello ${params.firstName},

Your agent stopped and has not sent anything since. What it reported: ${params.reason}

${APP}/dashboard/agents/${params.agentId}

Nicolas
Founder, LinkedGrow`;

// ------------------------------------------------------------------ someone replied

export const replySubject = (name: string) => `${name} replied`;

export function replyEmailTemplate(params: {
  firstName: string;
  from: string;
  body: string;
  agentContinues: boolean;
}): string {
  const { firstName, from, body, agentContinues } = params;
  return baseEmailTemplate({
    preheader: `${from} answered your agent.`,
    content: `
${p(`Hello ${firstName},`)}
${lead(`${from} has written back to your agent.`)}
${quote(body)}
${
  agentContinues
    ? p("Your agent reads it and answers on its next pass, the way it would answer anybody. You do not have to do anything.")
    : p("Your agent has stopped writing to this person for good. The conversation is yours from here.")
}
${button(`${APP}/dashboard/replies`, "Read the whole thread")}
${signature()}
`,
  });
}

export const replyEmailText = (params: { firstName: string; from: string; body: string }) =>
  `Hello ${params.firstName},

${params.from} answered:

"${params.body}"

Read the whole thread: ${APP}/dashboard/replies

Nicolas
Founder, LinkedGrow`;

// -------------------------------------------------------------------- first day

export const firstDaySubject = "Your agent just started";

export function firstDayEmailTemplate(params: {
  firstName: string;
  found: number;
  sources: number;
  perDay: number;
  agentId: string;
}): string {
  const { firstName, found, sources, perDay, agentId } = params;
  return baseEmailTemplate({
    preheader: "It signed in and went to work.",
    content: `
${p(`Hello ${firstName},`)}
${lead("Your agent signed in and went to work.")}
${figures([
  { label: "Sources read", value: String(sources) },
  { label: "People found", value: String(found) },
  { label: "Invitations a day this week", value: String(perDay) },
])}
${p(`It sends ${perDay} invitations a day this week and climbs from there. That is deliberate: an account that suddenly sends at full speed is the one LinkedIn restricts.`)}
${button(`${APP}/dashboard/agents/${agentId}`, "Watch it work")}
${small("From here you get one email a week with what it found, and an immediate one whenever somebody replies or something needs you.")}
${signature()}
`,
  });
}

export const firstDayEmailText = (params: {
  firstName: string;
  found: number;
  perDay: number;
  agentId: string;
}) =>
  `Hello ${params.firstName},

Your agent signed in and went to work. It found ${params.found} people on its first pass and sends ${params.perDay} invitations a day this week.

${APP}/dashboard/agents/${params.agentId}

Nicolas
Founder, LinkedGrow`;
