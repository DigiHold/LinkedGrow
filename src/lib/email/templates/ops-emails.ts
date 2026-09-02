import { baseEmailTemplate } from "./base-template";
import { getAppUrl } from "@/lib/app-url";
import { p, lead, small, button, figures, quote } from "./parts";

/**
 * The emails that come to us rather than to a customer.
 *
 * They still go through the same shell as everything else. An internal alert
 * that arrives as a wall of monospace gets skimmed and then ignored, and this
 * is the one that will arrive on the morning LinkedIn renames a button and
 * every publish in the fleet is failing.
 *
 * The shape is deliberate: the number first, then the evidence, then the one
 * link that leads to the fix. Nothing here asks anybody to go and look
 * something up before they know whether it matters.
 */

const APP = getAppUrl();

export const selectorAlertSubject = "\u{1F6A8} Publishing is failing across accounts";

export function selectorAlertEmailTemplate(params: {
  windowHours: number;
  published: number;
  failed: number;
  rate: number | null;
  selectorFailures: number;
  agentFailures: number;
  /** The distinct things the composer could not find. */
  missing: string[];
}): string {
  const rate =
    params.rate === null ? "too few attempts to say" : `${Math.round(params.rate * 100)}%`;

  return baseEmailTemplate({
    preheader: `${params.failed} publishes failed in the last ${params.windowHours} hours.`,
    content: `
${p("Hello Nicolas,")}
${lead(`Publishing is failing across accounts, not on one of them.`)}
${p(`Over the last ${params.windowHours} hours the fleet succeeded ${rate} of the time, and ${params.selectorFailures} of the failures name a control the composer could not find. That is what a LinkedIn rename looks like: one account in trouble is normal, every account failing at the same step is not.`)}
${figures([
  { label: "Posts published", value: String(params.published) },
  { label: "Posts failed", value: String(params.failed) },
  { label: "Success rate", value: rate },
  { label: "Failures naming a missing control", value: String(params.selectorFailures) },
  { label: "Agent runs that hit the same wall", value: String(params.agentFailures) },
])}
${p("What could not be found:")}
${params.missing.map((line) => quote(line)).join("")}
${p("The screen captures from the moment each one gave up are on the worker box under /opt/linkedgrow/debug. The selectors themselves live in SEL at the top of src/linkedin/publish.ts.")}
${button(`${APP}/dashboard/admin/users`, "Open the dashboard")}
${small("You get this once a day at most, however many passes find it.")}
`,
  });
}

export function selectorAlertEmailText(params: {
  windowHours: number;
  published: number;
  failed: number;
  rate: number | null;
  selectorFailures: number;
  agentFailures: number;
  missing: string[];
}): string {
  const rate =
    params.rate === null ? "too few attempts to say" : `${Math.round(params.rate * 100)}%`;
  return `Hello Nicolas,

Publishing is failing across accounts, not on one of them.

Over the last ${params.windowHours} hours the fleet succeeded ${rate} of the time, and ${params.selectorFailures} of the failures name a control the composer could not find.

Posts published: ${params.published}
Posts failed: ${params.failed}
Success rate: ${rate}
Failures naming a missing control: ${params.selectorFailures}
Agent runs that hit the same wall: ${params.agentFailures}

What could not be found:
${params.missing.map((m) => `  - ${m}`).join("\n")}

The captures are on the worker box under /opt/linkedgrow/debug. The selectors live in SEL at the top of src/linkedin/publish.ts.

You get this once a day at most, however many passes find it.`;
}
