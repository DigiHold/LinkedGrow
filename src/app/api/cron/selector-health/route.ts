/**
 * Watching the one thing that breaks without anybody doing anything.
 *
 * Leaving the LinkedIn API made selector maintenance the standing cost of the
 * whole design: LinkedIn renames a control, publishing or mining stops, and
 * until now the way that got discovered was somebody opening the dashboard. On
 * 2026-07-31 four separate controls moved in one afternoon.
 *
 * No new table. A failed publish already writes its reason onto the post, and
 * an agent that gives up already writes an event, so the health of the fleet is
 * a query over what is there. The alert is one email to us, at most once a day,
 * because an alert that arrives hourly stops being read by Wednesday.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, agentEvents, workerFlags } from "@/lib/db/schema";
import { and, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/** How far back each pass looks. */
const WINDOW_HOURS = 24;

/**
 * Below this, something is wrong with the product rather than with one account.
 *
 * Set where it is because a single customer's expired session or restricted
 * account is normal noise and must not page anybody. A selector that has moved
 * fails every account at once, which is what this catches.
 */
const HEALTHY_RATE = 0.8;

/** Fewer attempts than this says nothing either way. */
const ENOUGH_TO_JUDGE = 5;

/**
 * The failures that mean a control moved, rather than the customer's own
 * account being in trouble.
 *
 * Matched on the message the composer itself wrote, because those strings are
 * ours and they name the step that could not be found. A challenge, a
 * restriction or an expired session is the account's problem and belongs in
 * that customer's inbox, not in an alert about the fleet.
 */
const LOOKS_LIKE_A_SELECTOR = [
  /was not there/i,
  /did not offer/i,
  /would not accept/i,
  /could not be opened/i,
  /did not finish uploading/i,
  /never became available/i,
  /no schedule control/i,
  /could not be found on the page/i,
];

function isSelectorFailure(message: string | null): boolean {
  if (!message) return false;
  return LOOKS_LIKE_A_SELECTOR.some((pattern) => pattern.test(message));
}

export interface Health {
  window_hours: number;
  publish: { attempted: number; published: number; failed: number; selector_failures: number; rate: number | null };
  agents: { errors: number; paused: number; selector_failures: number };
  worst: string[];
  alerting: boolean;
  alert_sent: boolean;
}

async function measure(): Promise<Health> {
  const since = new Date(Date.now() - WINDOW_HOURS * 3600_000);

  const recent = await db
    .select({ status: posts.status, error: posts.errorMessage, updatedAt: posts.updatedAt })
    .from(posts)
    .where(and(gte(posts.updatedAt, since), inArray(posts.status, ["published", "failed"])));

  const published = recent.filter((p) => p.status === "published").length;
  const failed = recent.filter((p) => p.status === "failed").length;
  const attempted = published + failed;
  const selectorFailures = recent.filter(
    (p) => p.status === "failed" && isSelectorFailure(p.error)
  ).length;

  const events = await db
    .select({ type: agentEvents.type, message: agentEvents.message })
    .from(agentEvents)
    .where(and(gte(agentEvents.createdAt, since), inArray(agentEvents.type, ["error", "paused"])));

  const agentSelector = events.filter((e) => isSelectorFailure(e.message)).length;

  // The distinct messages behind it, so the alert says what to go and fix
  // rather than only that something is wrong.
  const worst = [
    ...new Set(
      [
        ...recent.filter((p) => p.status === "failed" && isSelectorFailure(p.error)).map((p) => p.error),
        ...events.filter((e) => isSelectorFailure(e.message)).map((e) => e.message),
      ].filter((m): m is string => !!m)
    ),
  ].slice(0, 6);

  const rate = attempted >= ENOUGH_TO_JUDGE ? published / attempted : null;

  // Two ways to be unhealthy: publishing is mostly failing, or several accounts
  // hit the same missing control, which is the signature of a rename.
  const alerting =
    (rate !== null && rate < HEALTHY_RATE && selectorFailures > 0) || agentSelector >= 3;

  return {
    window_hours: WINDOW_HOURS,
    publish: { attempted, published, failed, selector_failures: selectorFailures, rate },
    agents: {
      errors: events.filter((e) => e.type === "error").length,
      paused: events.filter((e) => e.type === "paused").length,
      selector_failures: agentSelector,
    },
    worst,
    alerting,
    alert_sent: false,
  };
}

/** At most one of these a day, whatever the pass finds. */
async function alertOnce(health: Health): Promise<boolean> {
  const KEY = "selector_alert_sent_on";
  const today = new Date().toISOString().slice(0, 10);

  const [flag] = await db
    .select({ value: workerFlags.value })
    .from(workerFlags)
    .where(eq(workerFlags.key, KEY))
    .limit(1);
  if (flag?.value === today) return false;

  const lines = [
    `Publishing over the last ${health.window_hours} hours: ${health.publish.published} went up, ${health.publish.failed} failed.`,
    health.publish.rate !== null
      ? `That is a ${Math.round(health.publish.rate * 100)}% success rate.`
      : "Too few attempts to give a rate.",
    `${health.publish.selector_failures} of the failures name a control that was not found, and ${health.agents.selector_failures} agent runs did the same.`,
    "",
    "What could not be found:",
    ...health.worst.map((w) => `  - ${w}`),
    "",
    "This is what a LinkedIn rename looks like. The captures are on the worker box under /opt/linkedgrow/debug.",
  ];

  await sendEmail({
    to: "contact@linkedgrow.ai",
    subject: "LinkedGrow: publishing is failing across accounts",
    html: `<pre style="font:14px/1.6 ui-monospace,monospace">${lines
      .join("\n")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre>`,
    text: lines.join("\n"),
  });

  await db
    .insert(workerFlags)
    .values({ key: KEY, value: today, updatedAt: new Date() })
    .onConflictDoUpdate({ target: workerFlags.key, set: { value: today, updatedAt: new Date() } });
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";
    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/selector-health`,
    });
    if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  } catch {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const health = await measure();
    if (health.alerting) {
      health.alert_sent = await alertOnce(health).catch(() => false);
    }
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { error: "Selector health failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
