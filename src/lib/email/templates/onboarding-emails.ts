import { baseEmailTemplate } from "./base-template";
import { p, lead, small, button, figures } from "./parts";

/**
 * The four emails of the trial, and the rule they all follow.
 *
 * Each one reads the account before it goes. A nudge to set up an agent that is
 * already running is worse than no email at all, and a time-based automation
 * cannot tell the difference, which is what the 133 Brevo templates got wrong.
 */

const APP = "https://linkedgrow.ai";

// ------------------------------------------------------------------- welcome

export const welcomeSubject = "Your account is ready, here is what happens next";

/**
 * Since the card moved to launch, this email goes out the moment checkout
 * completes, which for almost everyone is right after they built their agent
 * in the wizard. `agentReady` is whether a saved draft exists: with one, the
 * only honest ask is the LinkedIn connection; without one (someone who paid
 * from the upgrade page), the old two-step version is still the true story.
 */
export function welcomeEmailTemplate(params: {
  firstName: string;
  endsOn: string;
  agentReady: boolean;
}): string {
  if (params.agentReady) {
    return baseEmailTemplate({
      preheader: "One step left and your agent starts working today.",
      content: `
${p(`Hello ${params.firstName},`)}
${lead("Your 7-day trial is running and your agent is one step from live.")}
${p(`Your card is on file and it is charged on ${params.endsOn}, so cancelling before then costs nothing and takes one click.`)}
${p("The agent you built is saved: who it looks for, where it looks, and what its messages say. The one thing it still needs is the LinkedIn account it works from.")}
${p("Connecting takes the email and password of the account it should run as. It signs in on an address reserved for that account and moves at a human pace, which is why the first week is slower on purpose.")}
${button(`${APP}/dashboard/agents/new?resume=1`, "Connect my LinkedIn & launch")}
${small("It starts finding people the same day and you get one email a week with what it found, plus an immediate one whenever somebody replies.")}
`,
    });
  }
  return baseEmailTemplate({
    preheader: "Two steps and your agent starts working today.",
    content: `
${p(`Hello ${params.firstName},`)}
${lead("Your account is open and your 7-day trial is running.")}
${p(`Your card is on file and it is charged on ${params.endsOn}, so cancelling before then costs nothing and takes one click.`)}
${p("Two steps stand between you and an agent that works while you do not:")}
${p("<strong>1. Tell it who you are looking for.</strong> The industry, the job titles, the countries, and the sources worth watching: your competitors' posts, the people asking about the problem you solve, the ones who just changed job.")}
${p("<strong>2. Connect the LinkedIn account it works from.</strong> It signs in on an address reserved for that account and moves at a human pace, which is why the first week is slower on purpose.")}
${button(`${APP}/dashboard/agents/new`, "Set up my agent")}
${small("It starts finding people the same day and you get one email a week with what it found, plus an immediate one whenever somebody replies.")}
`,
  });
}

export const welcomeEmailText = (params: { firstName: string; endsOn: string; agentReady: boolean }) =>
  params.agentReady
    ? `Hello ${params.firstName},

Your 7-day trial is running and your agent is one step from live. Your card is charged on ${params.endsOn}, so cancelling before then costs nothing.

The agent you built is saved. Connect the LinkedIn account it works from and it starts the same day.

${APP}/dashboard/agents/new?resume=1`
    : `Hello ${params.firstName},

Your account is open and your 7-day trial is running. Your card is charged on ${params.endsOn}, so cancelling before then costs nothing.

Two steps: tell the agent who you are looking for, then connect the LinkedIn account it works from.

${APP}/dashboard/agents/new`;

// --------------------------------------------------------- no agent yet, day 2

export const noAgentSubject = "Nothing is running yet";

export function noAgentEmailTemplate(params: { firstName: string; daysLeft: number }): string {
  const { firstName, daysLeft } = params;
  return baseEmailTemplate({
    preheader: `${daysLeft} days of the trial left and no agent to spend them.`,
    content: `
${p(`Hello ${firstName},`)}
${lead("You have no agent yet, so nothing has been looking for anybody.")}
${p(`There are ${daysLeft} days left on the trial, and an agent needs a few of them to warm up before it sends at full speed, so the sooner one exists the more the week is worth.`)}
${p("Setting one up is answering who you sell to and picking the sources to watch. It takes about 3 minutes and you can change every answer later.")}
${button(`${APP}/dashboard/agents/new`, "Set up my agent")}
${small("If something in the setup was unclear, reply and tell me which part. That is the most useful email I get.")}
`,
  });
}

export const noAgentEmailText = (params: { firstName: string; daysLeft: number }) =>
  `Hello ${params.firstName},

You have no agent yet, so nothing has been looking for anybody. There are ${params.daysLeft} days left on the trial and an agent needs a few of them to warm up.

${APP}/dashboard/agents/new`;

// ------------------------------------------------- agent but no account, day 3

export const noAccountSubject = "Your agent has nowhere to work from";

export function noAccountEmailTemplate(params: {
  firstName: string;
  agentName: string;
  agentId: string;
}): string {
  const { firstName, agentName, agentId } = params;
  return baseEmailTemplate({
    preheader: "It is configured and waiting on a LinkedIn account.",
    content: `
${p(`Hello ${firstName},`)}
${lead(`${agentName} is set up and has no LinkedIn account to work from.`)}
${p("It knows who to look for and which sources to read, and it cannot open any of them until an account is connected, so it has been sitting still since you created it.")}
${p("Connecting takes the email and password of the account it should run as. It gets its own address, and LinkedIn will ask you to approve the sign-in once, which is normal and only happens the first time.")}
${button(`${APP}/dashboard/agents/${agentId}`, "Connect the account")}
${small("We never post, like or message from an account without the agent's own settings telling it to.")}
`,
  });
}

export const noAccountEmailText = (params: { firstName: string; agentName: string; agentId: string }) =>
  `Hello ${params.firstName},

${params.agentName} is set up and has no LinkedIn account to work from, so it has been sitting still since you created it.

${APP}/dashboard/agents/${params.agentId}`;

// ----------------------------------------------------------------- halfway, day 4

export const halfwaySubject = "Halfway through your trial";

export function halfwayEmailTemplate(params: {
  firstName: string;
  found: number;
  invited: number;
  replied: number;
  agentId: string;
}): string {
  const { firstName, found, invited, replied, agentId } = params;
  const dry = found === 0;
  return baseEmailTemplate({
    preheader: dry ? "Your sources have not returned anybody yet." : `${found} people so far.`,
    content: `
${p(`Hello ${firstName},`)}
${lead(dry ? "Your agent has not found anybody yet, and that is worth 2 minutes of your time." : "Here is where your agent has got to.")}
${
  dry
    ? p("It usually means the sources are too narrow: one competitor nobody comments on, or a search phrase almost nobody writes. Adding two or three broader sources normally changes the picture within a day.")
    : figures([
        { label: "People found", value: String(found) },
        { label: "Invitations sent", value: String(invited) },
        { label: "Replied", value: String(replied) },
      ])
}
${button(`${APP}/dashboard/agents/${agentId}`, dry ? "Widen my sources" : "See what it found")}
${p("The second half of the trial is when the invitations sent in the first half start being accepted, so the numbers move faster from here than they did at the start.")}
`,
  });
}

export const halfwayEmailText = (params: {
  firstName: string;
  found: number;
  replied: number;
  agentId: string;
}) =>
  `Hello ${params.firstName},

Your agent has found ${params.found} people so far and ${params.replied} have replied.

${APP}/dashboard/agents/${params.agentId}`;
