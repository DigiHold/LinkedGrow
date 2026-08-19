import { baseEmailTemplate } from "./base-template";
import { p, lead, small, button, figures } from "./parts";

/**
 * The two emails a booked demo sends: one to the person, one to us.
 *
 * The guest email carries the promise the page made and nothing else. It never
 * says they will keep the agent we build, because the demo runs on our screen
 * and their own starts with a trial.
 */

const APP = "https://linkedgrow.ai";

export const demoBookedSubject = (when: string) => `Your LinkedGrow demo: ${when}`;

export function demoBookedEmailTemplate(params: {
  firstName: string;
  when: string;
  minutes: number;
  meetUrl: string | null;
  website: string | null;
}): string {
  const { firstName, when, minutes, meetUrl, website } = params;
  return baseEmailTemplate({
    preheader: `${when}, ${minutes} minutes with Nicolas.`,
    content: `
${p(`Hello ${firstName},`)}
${lead("You are booked in.")}
${figures([
  { label: "When", value: when },
  { label: "How long", value: `${minutes} minutes` },
  { label: "Where", value: "Google Meet" },
  ...(website ? [{ label: "We will look at", value: website }] : []),
])}
${p("On the call I share my screen and build an agent on your business, the same way you would build your own: what it reads, who it looks for, where it hunts, what it writes.")}
${p("You watch it happen and you ask whatever you want along the way, about how it protects your account, what it costs, or how it decides who is worth a message.")}
${meetUrl ? button(meetUrl, "Join the call") : p("The Google Meet link is in the calendar invitation that follows this email.")}
${small("Something came up? Reply to this email and we move it. Cancelling costs you nothing and frees the slot for somebody else.")}
`,
  });
}

export const demoBookedEmailText = (params: {
  firstName: string;
  when: string;
  minutes: number;
  meetUrl: string | null;
  website: string | null;
}) =>
  `Hello ${params.firstName},

You are booked in.

When: ${params.when}
How long: ${params.minutes} minutes
Where: Google Meet${params.website ? `\nWe will look at: ${params.website}` : ""}

On the call I share my screen and build an agent on your business, the same way you would build your own: what it reads, who it looks for, where it hunts, what it writes. You watch it happen and you ask whatever you want along the way.
${params.meetUrl ? `\nJoin the call: ${params.meetUrl}\n` : "\nThe Google Meet link is in the calendar invitation that follows this email.\n"}
Something came up? Reply to this email and we move it.`;

// ------------------------------------------------------------------- ops copy

export const demoBookedOpsSubject = (name: string, website: string | null) =>
  `Demo booked: ${name}${website ? ` (${website})` : ""}`;

export function demoBookedOpsEmailTemplate(params: {
  name: string;
  email: string;
  when: string;
  website: string | null;
  note: string | null;
  inCalendar: boolean;
}): string {
  const { name, email, when, website, note, inCalendar } = params;
  return baseEmailTemplate({
    preheader: when,
    content: `
${lead("A demo just went in the diary.")}
${figures([
  { label: "Who", value: name },
  { label: "Email", value: email },
  { label: "When", value: when },
  ...(website ? [{ label: "Website", value: website }] : []),
])}
${note ? p(`What they want the agent to find: ${note}`) : ""}
${website ? p(`Read the site before the call: <a href="${website}" style="color:#0A66C2;text-decoration:underline;">${website}</a>`) : ""}
${inCalendar ? "" : p("This is not in your Google Calendar: the calendar is not connected, so nothing was written to it.")}
${button(`${APP}/dashboard/settings?tab=calendar`, "Open the calendar settings")}
`,
  });
}

export const demoBookedOpsEmailText = (params: {
  name: string;
  email: string;
  when: string;
  website: string | null;
  note: string | null;
  inCalendar: boolean;
}) =>
  `A demo just went in the diary.

Who: ${params.name}
Email: ${params.email}
When: ${params.when}${params.website ? `\nWebsite: ${params.website}` : ""}
${params.note ? `\nWhat they want the agent to find: ${params.note}\n` : ""}${
    params.inCalendar ? "" : "\nNot in your Google Calendar: the calendar is not connected.\n"
  }`;
