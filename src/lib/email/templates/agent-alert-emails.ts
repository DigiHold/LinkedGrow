import { baseEmailTemplate } from "./base-template";
import { p, lead, small, button, quote, personRow, figures } from "./parts";

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

export type Lead = {
  name: string;
  title: string;
  why: string;
  score: number | null;
};

// ---------------------------------------------------------------- weekly digest

/**
 * Emoji on the three subjects somebody opens out of wanting to, never on the
 * four they have to believe. A declined card decorated with an icon reads as
 * spam and does the opposite of its job (Nicolas, 2026-08-06).
 */
export const leadsDigestSubject = (count: number) =>
  count === 1 ? "\u{1F3AF} 1 new lead this week" : `\u{1F3AF} ${count} new leads, all scored`;

export function leadsDigestEmailTemplate(params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  count: number;
  best: Lead[];
  queuedNext: number;
  agentId: string;
  instanceName?: string;
}): string {
  const { firstName, count, best, queuedNext, agentId } = params;
  return baseEmailTemplate({
    instanceName: params.instanceName,
    preheader: `${count} people your agent found this week, scored against your audience.`,
    content: `
${p(`Hello ${firstName},`)}
${lead(`Your agent found ${count} ${count === 1 ? "person" : "people"} this week and scored every one of them against the audience you described.`)}
${best.length ? p("The strongest of them:") : ""}
${best.map((b) => personRow(b.name, b.title, b.why, b.score)).join("")}
${button(`${params.app}/dashboard/agents/${agentId}`, "See all of them")}
${
  queuedNext > 0
    ? p(
        `${queuedNext} ${queuedNext === 1 ? "person is" : "people are"} queued to be contacted next, and you can read or change every message before it goes out.`
      )
    : ""
}
`,
  });
}

export const leadsDigestEmailText = (params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  count: number;
  best: Lead[];
  agentId: string;
}) =>
  `Hello ${params.firstName},

Your agent found ${params.count} people this week and scored every one against the audience you described.

${params.best.map((b) => `${b.name} (${b.score ?? "unscored"}) - ${b.title}. ${b.why}`).join("\n")}

See all of them: ${params.app}/dashboard/agents/${params.agentId}`;

// ---------------------------------------------------------- verification needed

export const verificationSubject = "Your LinkedIn needs 2 minutes";

/**
 * Where this mail sends somebody, which depends on what they run.
 *
 * `agentId` is null for an account with no agent behind it, and that is not a
 * rare shape: every customer who only publishes posts has one. Sending them to
 * an agent page that does not exist is how an alert stops being an alert.
 */
const reconnectLink = (app: string, agentId: string | null) =>
  agentId ? `${app}/dashboard/agents/${agentId}` : `${app}/dashboard/settings/linkedin-accounts`;

export function verificationEmailTemplate(params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  accountName: string;
  agentId: string | null;
  instanceName?: string;
}): string {
  const { firstName, accountName, agentId } = params;
  const stopped = agentId
    ? `LinkedIn asked ${accountName} to verify itself, so your agent has stopped until that is answered.`
    : `LinkedIn asked ${accountName} to verify itself, so nothing can be published from that profile until it is answered.`;
  const nothingLost = agentId
    ? "Nothing was lost while it waited and nobody was contacted. Your leads and your conversations are exactly where you left them."
    : "Nothing was lost while it waited. Anything scheduled is still scheduled and goes out on its own once the account is back.";
  const whatToDo = agentId
    ? "Open LinkedIn, answer what it asks, then press Start on your agent. It signs itself back in within seconds and carries on."
    : "Open LinkedIn, answer what it asks, then reconnect the account here. It signs itself back in within seconds and carries on.";
  return baseEmailTemplate({
    instanceName: params.instanceName,
    preheader: "Your LinkedIn account is waiting on a verification. It takes two minutes.",
    content: `
${p(`Hello ${firstName},`)}
${lead(stopped)}
${p(nothingLost)}
${p(whatToDo)}
${button(reconnectLink(params.app, agentId), agentId ? "Open my agent" : "Reconnect my account")}
${small("This happens to accounts that have been quiet for a while and then start reaching out. It is a check rather than a penalty, and it clears the moment you answer it.")}
`,
  });
}

export const verificationEmailText = (params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  accountName: string;
  agentId: string | null;
}) =>
  `Hello ${params.firstName},

LinkedIn asked ${params.accountName} to verify itself, so ${params.agentId ? "your agent has stopped" : "nothing can be published from that profile"} until that is answered. Nothing was lost and nobody was contacted.

Open LinkedIn, answer what it asks, then ${params.agentId ? "press Start on your agent" : "reconnect the account"}. It signs itself back in within seconds.

${reconnectLink(params.app, params.agentId)}`;

// ------------------------------------------------------------------- post failed

export const postFailedSubject = "Your post did not go out";

/**
 * The mail nobody was sending.
 *
 * A post that spends its three attempts is marked `failed` with a sentence on
 * the row, and until 2026-09-09 that was the entire notification: the customer
 * found out by opening the dashboard and scrolling to a post that should have
 * been live hours earlier. Mohamed Elmelegey reported exactly that on
 * 2026-09-08 about a post scheduled for 09:00 the day before, and he was right
 * that nothing had been sent.
 *
 * The reason is quoted rather than summarised, because it is already written
 * as a finished sentence for the customer and rewording it here would give the
 * dashboard and the inbox two different accounts of the same failure.
 */
export function postFailedEmailTemplate(params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  reason: string;
  excerpt: string;
  scheduledFor: string | null;
  instanceName?: string;
}): string {
  const { firstName, reason, excerpt, scheduledFor } = params;
  return baseEmailTemplate({
    instanceName: params.instanceName,
    preheader: "It is still saved, and it takes one press to send it again.",
    content: `
${p(`Hello ${firstName},`)}
${lead(
  scheduledFor
    ? `Your post scheduled for ${scheduledFor} did not go out, and it is still sitting in your dashboard waiting for you.`
    : "Your post did not go out, and it is still sitting in your dashboard waiting for you."
)}
${p(reason)}
${quote(excerpt)}
${p("Nothing was published and nothing was lost. Open it, change whatever the message points at, and press Publish again.")}
${button(`${params.app}/dashboard/posts`, "Open my posts")}
${small("If it fails a second time for the same reason, reply to this email and we will look at the account ourselves.")}
`,
  });
}

export const postFailedEmailText = (params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  reason: string;
  excerpt: string;
  scheduledFor: string | null;
}) =>
  `Hello ${params.firstName},

${params.scheduledFor ? `Your post scheduled for ${params.scheduledFor} did not go out.` : "Your post did not go out."} It is still saved in your dashboard.

${params.reason}

"${params.excerpt}"

Nothing was published and nothing was lost. Open it, change whatever the message points at, and press Publish again.

${params.app}/dashboard/posts`;

// ------------------------------------------------------------------ agent stopped

export const agentStoppedSubject = "Your agent stopped";

export function agentStoppedEmailTemplate(params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  reason: string;
  retrying: boolean;
  agentId: string;
  instanceName?: string;
}): string {
  const { firstName, reason, retrying, agentId } = params;
  return baseEmailTemplate({
    instanceName: params.instanceName,
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
${button(`${params.app}/dashboard/agents/${agentId}`, "Check my agent")}
`,
  });
}

export const agentStoppedEmailText = (params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  reason: string;
  agentId: string;
}) =>
  `Hello ${params.firstName},

Your agent stopped and has not sent anything since. What it reported: ${params.reason}

${params.app}/dashboard/agents/${params.agentId}`;

// ------------------------------------------------------------------ someone replied

export const replySubject = (name: string) => `\u{1F4AC} ${name} replied`;

export function replyEmailTemplate(params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  from: string;
  body: string;
  agentContinues: boolean;
  instanceName?: string;
}): string {
  const { firstName, from, body, agentContinues } = params;
  return baseEmailTemplate({
    instanceName: params.instanceName,
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
${button(`${params.app}/dashboard/replies`, "Read the whole thread")}
`,
  });
}

export const replyEmailText = (params: { firstName: string; from: string; body: string; app: string }) =>
  `Hello ${params.firstName},

${params.from} answered:

"${params.body}"

Read the whole thread: ${params.app}/dashboard/replies`;

// -------------------------------------------------------------------- first day

export const firstDaySubject = "\u{26A1} Your agent just started";

export function firstDayEmailTemplate(params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  found: number;
  sources: number;
  perDay: number;
  agentId: string;
  instanceName?: string;
}): string {
  const { firstName, found, sources, perDay, agentId } = params;
  return baseEmailTemplate({
    instanceName: params.instanceName,
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
${button(`${params.app}/dashboard/agents/${agentId}`, "Watch it work")}
${small("From here you get one email a week with what it found, and an immediate one whenever somebody replies or something needs you.")}
`,
  });
}

export const firstDayEmailText = (params: {
  /** The instance address, resolved by the sender. */
  app: string;
  firstName: string;
  found: number;
  perDay: number;
  agentId: string;
}) =>
  `Hello ${params.firstName},

Your agent signed in and went to work. It found ${params.found} people on its first pass and sends ${params.perDay} invitations a day this week.

${params.app}/dashboard/agents/${params.agentId}`;
