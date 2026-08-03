import "dotenv/config";
import { db, loadRunnableAgents, touchRun, pauseAgent, flagAccount, requestSignIn, recordEvent } from "./db.ts";
import type { AgentContext } from "./config.ts";
import { log, logError } from "./logger.ts";
import { assertCanSend, HaltedError } from "./guards.ts";
import { BudgetExceededError } from "./ai.ts";
import {
  openSession,
  closeSession,
  ProxyMismatchError,
  isSignedIn,
  sessionTargetFor,
} from "./browser/driver.ts";
import { groupKey, withAddress } from "./safety/ip-lock.ts";
import { NoSlotError, reportSlots, takeSlot } from "./safety/slots.ts";
import { currentRun } from "./safety/run-context.ts";
import { RunStalled, withWatchdog } from "./safety/watchdog.ts";
import { allocationFor, isProduction } from "./proxy/allocation.ts";
import { fulfilPendingAllocations } from "./proxy/fulfil.ts";
import { connectPass } from "./linkedin/connect-pass.ts";
import { publishPass } from "./publish/pass.ts";
import { insightsPass, copyLeadFaces } from "./insights/pass.ts";
import { isWithinBusinessHours, isWithinSourcingHours } from "./safety/envelope.ts";
import { runSequence } from "./linkedin/sequence.ts";
import { sourcePass } from "./linkedin/sourcing.ts";
import { browserActions } from "./linkedin/actions.ts";
import { ensureProfileCaptured } from "./linkedin/profile.ts";
import { onlyContact } from "./safety/allowlist.ts";
import {
  RELATIONSHIP_STEPS,
  helloMessage,
  introMessage,
  converseMessage,
  askMessage,
} from "./messages/relationship.ts";
import { getStyleSamples } from "./linkedin/style.ts";
import { announce, stopAnnouncing } from "./store.ts";
import { sleep, randInt } from "./browser/human.ts";

/**
 * The worker plane's run loop.
 *
 * Plan section 7g replaces the CLI entry point with this. The engine below it
 * is the ported one and does not know it is running for many customers; that is
 * this file's job.
 *
 * What a pass does, in order, and why the order matters:
 *
 * 1. Read every runnable agent. Paused, stopped and blocked never leave the
 *    database, so a switch thrown in the dashboard takes effect on the next
 *    pass without a deploy.
 * 2. Group them by address. Section 5c: agents of one customer in one country
 *    share one address, and two of them acting in the same second is what makes
 *    a household look like a system. The lock is per address, not per agent.
 * 3. Skip anything outside its own business hours, in the account's timezone.
 * 4. Open the session, assert the address, run one bounded sequence pass.
 * 5. On any LinkedIn challenge: stop that account and every agent on it, at
 *    once, and never retry. Section 8a layer 6.
 */

const PASS_INTERVAL_MS = 5 * 60 * 1000;

/** Publishing checks more often than agents act, because somebody is waiting on it. */
const PUBLISH_INTERVAL_MS = 60 * 1000;

/** Reading back how posts did is never urgent, and the numbers move slowly. */
const INSIGHTS_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Connecting is the only loop with somebody watching a spinner in real time.
 *
 * It used to ride the publishing loop, so a customer who had just typed their
 * password waited up to a minute before anything at all began, on top of the
 * minute the sign-in itself honestly takes. Two minutes of nothing reads as a
 * broken page, and it was read that way. Both passes underneath are a single
 * indexed query that returns nothing the rest of the time.
 */
const CONNECT_INTERVAL_MS = 8 * 1000;

async function runAgent(ctx: AgentContext): Promise<void> {
  // Two windows, because the two halves carry different risk. Reading runs on
  // an extended day so a customer who signs up in the evening sees their first
  // leads the same evening; writing stays inside the account's own business
  // hours, because a connection request at 3am is what gets accounts flagged.
  const canSource = isWithinSourcingHours(ctx.cfg);
  const canWrite = isWithinBusinessHours(ctx.cfg);
  if (!canSource && !canWrite) {
    return;
  }

  await assertCanSend(ctx);

  const proxy = await allocationFor(ctx.linkedinAccountId);
  if (!proxy && isProduction()) {
    // Never in production. An account sending from the server's own address is
    // an account seen from a datacentre, which is the fastest way to lose it.
    await pauseAgent(ctx, "No dedicated address is allocated to this account yet.");
    return;
  }

  const session = await openSession(sessionTargetFor(ctx), proxy);
  // Hand the browser to the watchdog. If this run stalls it is abandoned mid-flight, and the next
  // agent on this same LinkedIn account must not be able to open a second Chrome on this profile.
  const run = currentRun();
  let closed = false;
  const closeOnce = async () => {
    if (closed) return;
    closed = true;
    await closeSession(session);
  };
  if (run) run.closeBrowser = closeOnce;
  try {
    if (!(await isSignedIn(session.context))) {
      // Not a challenge, and not something a human has to fix: the password is
      // stored and the sign-in pass exists. Flagging it as challenged put the
      // account in a state that pass never looks at, which is how it sat signed
      // out for two days with nothing retrying.
      await requestSignIn(
        ctx,
        "The session ended, so the agent is signing back in on its own."
      );
      return;
    }

    // From here on the dashboard can narrate the pass while it happens.
    await announce(ctx, "opening LinkedIn");

    // Who this account is, once. It fills the name and picture the dashboard
    // shows, and the profile URL that publishing and the follower count both
    // read from. Cheap to call: one indexed SELECT says there is nothing to do.
    await ensureProfileCaptured(session.page, ctx.linkedinAccountId);

    // Every write funnels through here, so the test allowlist is applied once rather than checked
    // at five call sites, any one of which could be forgotten.
    const actions =
      ctx.testRecipients.length > 0
        ? onlyContact(browserActions(session.page), ctx.testRecipients)
        : browserActions(session.page);
    const key = groupKey(ctx.linkedinAccountId);

    // Finding people comes before writing to them, for two reasons. The queue
    // has to be filled by something, and until this call existed nothing filled
    // it. And sourcing is reading, so it is the safe half to do first while the
    // session is fresh, leaving the writes for later in the window.
    //
    // A brand-new agent has never run, so its first pass is the one the
    // customer is watching. It goes wider and it says so in the event feed.
    const neverRan = ctx.lastRunAt === null;
    if (canSource) {
      try {
        await sourcePass(ctx, session.page, { firstRun: neverRan });
        // The faces of the people just found, into our own bucket, on the
        // session that found them.
        //
        // It used to be left to the insights pass, which returns early unless
        // some published post needs its numbers re-read. An account that does
        // outreach and never posts therefore copied no pictures at all, and
        // LinkedIn's own image URLs expire within days, so every lead ended up
        // faceless. Doing it here means the picture is stored in the same
        // minute the lead is found, and it needs no second session.
        await copyLeadFaces(session).catch((error: unknown) => {
          logError("could not copy the lead pictures", error, { agentId: ctx.agentId });
        });
      } catch (error) {
      // Sourcing failing must never stop the sequence: there may already be
      // people in the queue who are owed a reply.
        logError("sourcing pass failed", error, { agentId: ctx.agentId });
      }
    }

    if (!canWrite) {
      // Found people, wrote to nobody. They wait for the working day, which is
      // the point of having two windows.
      await touchRun(ctx);
      return;
    }

    // Watching mode ends the pass here, before anything can touch LinkedIn. It is deliberately a
    // hard stop rather than a flag threaded through the sequence: a condition checked in one place
    // cannot be forgotten in the tenth.
    if (ctx.observeOnly) {
      await recordEvent(
        ctx,
        "sourcing",
        "Watching only: leads are being collected and nothing is being sent."
      ).catch(() => {});
      await touchRun(ctx);
      return;
    }

    await runSequence(ctx.cfg, ctx, {
      actions,
      accountDailyCap: ctx.accountDailyInviteCap,
      notify: async (message) => {
        await recordEvent(ctx, "reply", message);
      },
      // Every action waits out the gap on the SHARED address, not on the agent.
      pauseMs: () => 0,
      // Each step of the relationship sequence writes differently, and the
      // differences are the product. Routing them through one generic
      // "write a DM" call is how they would quietly become the same message.
      writeMessage: async (prospect, step, thread) => {
        // A message the customer wrote themselves is sent as they wrote it, and
        // costs no model call. Their own words beat anything generated, and the
        // whole point of the box on the Messages tab is that it is obeyed.
        const written = ctx.templates[step];
        if (written) {
          return { body: fillTemplate(written, prospect), angle: step };
        }
        return withAddress(key, async () => {
          const to = {
            firstName: prospect.first_name ?? "",
            // Both feed the shape rotation, which is seeded per prospect so a
            // regeneration keeps its shape and two people never share one.
            fullName: prospect.full_name ?? undefined,
            source: prospect.source ?? undefined,
            headline: prospect.headline ?? undefined,
            signalText: prospect.context ?? undefined,
          };
          const body =
            step === RELATIONSHIP_STEPS.hello
              ? await helloMessage(ctx, ctx.sender, to)
              : step === RELATIONSHIP_STEPS.intro
              ? await introMessage(ctx, ctx.sender, to)
              : step === RELATIONSHIP_STEPS.converse
                ? await converseMessage(ctx, ctx.sender, to, thread)
                : await askMessage(ctx, ctx.sender, to, thread);
          return { body, angle: step };
        });
      },
    });

    await touchRun(ctx);
  } finally {
    // The pass is over, so the dashboard stops saying the agent is working.
    // The reader also ignores anything more than a few minutes old, which is
    // what covers a session the watchdog cuts off before this line runs.
    await stopAnnouncing(ctx).catch(() => {});
    await closeOnce();
  }
}

/**
 * One agent's failure is one agent's failure.
 *
 * A thrown error here must never take the fleet down, and each kind of failure
 * has exactly one correct response: a challenge stops the account, a budget
 * ceiling stops the agent for the day, a wrong address stops the session before
 * it touches LinkedIn.
 */
/**
 * Fills a hand-written message with what is known about the person.
 *
 * Unknown placeholders are removed rather than left in: a message arriving with
 * a literal {jobTitle} in it is worse than one missing the phrase, and the
 * validator's "unresolved template token" rule exists for exactly that reason.
 * The tidy-up afterwards is what stops "Hi , " when a first name is missing.
 */
function fillTemplate(
  template: string,
  prospect: { first_name: string | null; full_name: string | null; company: string | null; headline: string | null }
): string {
  const first =
    prospect.first_name ?? (prospect.full_name ?? "").trim().split(/\s+/)[0] ?? "";
  return template
    .replace(/\{name\}/g, first)
    .replace(/\{firstName\}/g, first)
    .replace(/\{fullName\}/g, prospect.full_name ?? first)
    .replace(/\{company\}/g, prospect.company ?? "")
    .replace(/\{jobTitle\}/g, prospect.headline ?? "")
    .replace(/\{[a-zA-Z]+\}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/([,.!?])\1+/g, "$1")
    .trim();
}

async function safely(ctx: AgentContext): Promise<void> {
  try {
    await withWatchdog(() => runAgent(ctx));
  } catch (error) {
    if (error instanceof RunStalled) {
      // The session's own finally still closes the browser; this only stops the pass waiting on it.
      log("agent stopped responding, cut off", { agentId: ctx.agentId, reason: error.message });
      await recordEvent(ctx, "error", "The agent stopped responding and was restarted. It picks up on the next run.").catch(() => {});
      return;
    }
    if (error instanceof HaltedError) {
      log("agent skipped", { agentId: ctx.agentId, reason: error.message });
      return;
    }
    if (error instanceof BudgetExceededError) {
      await recordEvent(ctx, "budget", error.message);
      return;
    }
    if (error instanceof ProxyMismatchError) {
      await pauseAgent(
        ctx,
        "The dedicated address for this account could not be verified, so nothing was sent."
      );
      return;
    }
    logError("agent pass failed", error, { agentId: ctx.agentId });
    await recordEvent(
      ctx,
      "error",
      "Something went wrong on the last run. It will try again shortly."
    ).catch(() => {});
  }
}

async function pass(): Promise<void> {
  const agents = await loadRunnableAgents();
  if (!agents.length) {
    log("nothing to run");
    return;
  }

  // Grouped by address, sequential inside a group and parallel across groups:
  // one address does one thing at a time, and different customers never wait
  // for each other.
  const byAddress = new Map<string, AgentContext[]>();
  for (const ctx of agents) {
    const key = groupKey(ctx.linkedinAccountId);
    const list = byAddress.get(key) ?? [];
    list.push(ctx);
    byAddress.set(key, list);
  }
  log("pass starting", { agents: agents.length, addresses: byAddress.size });

  await Promise.all(
    [...byAddress.values()].map(async (group) => {
      // One slot for the whole group, because every agent in it drives the same
      // LinkedIn account and therefore shares one browser and one address.
      const first = group[0];
      if (!first) return;
      let lease;
      try {
        lease = takeSlot(first.linkedinAccountId);
      } catch (error) {
        if (error instanceof NoSlotError) {
          // Not an error worth alarming about: the next pass is minutes away
          // and an agent acting a few times an hour cannot tell the difference.
          log("no slot free, deferring to the next pass", {
            linkedinAccountId: first.linkedinAccountId,
          });
          return;
        }
        throw error;
      }

      try {
        for (const ctx of group) {
          await safely(ctx);
          // Even between two agents on one address, a pause.
          if (group.length > 1) await sleep(randInt(20_000, 60_000));
        }
      } finally {
        // Released only here, after every agent on this account has finished
        // and its browser is closed. Releasing earlier would let a second
        // account open a browser while this one is still writing its profile.
        lease.release();
      }
    })
  );
  reportSlots();
}

async function agentLoop(): Promise<void> {
  for (;;) {
    if (shuttingDown()) return;
    try {
      await pass();
    } catch (error) {
      logError("pass failed", error);
    }
    await sleep(PASS_INTERVAL_MS);
  }
}

/**
 * The publishing loop, separate and faster.
 *
 * A person who presses Publish is watching the screen, so five minutes is too
 * long to leave them looking at a spinner; and a content-only customer has no
 * agent at all, so the pass above would never open a session for them. The two
 * loops cannot collide over a browser because slots are per LinkedIn account
 * and taken by both.
 */
async function publishLoop(): Promise<void> {
  for (;;) {
    if (shuttingDown()) return;
    try {
      await publishPass();
    } catch (error) {
      logError("publish pass failed", error);
    }
    await sleep(PUBLISH_INTERVAL_MS);
  }
}

/**
 * Getting a newly connected account onto LinkedIn, while its owner watches.
 *
 * The address comes first, because the sign-in cannot start without one and
 * refuses to run from the server's own. Then the sign-in, which is also where
 * LinkedIn's verification code lands, and that code is dead thirty seconds
 * after it is read off a phone.
 *
 * Nothing called signIn at all until 2026-07-31: an account sat at "waiting for
 * its first sign-in" for ever, and the dialog span for ever above it.
 */
async function connectLoop(): Promise<void> {
  for (;;) {
    if (shuttingDown()) return;
    try {
      await fulfilPendingAllocations();
    } catch (error) {
      logError("allocation pass failed", error);
    }
    try {
      await connectPass();
    } catch (error) {
      logError("sign-in pass failed", error);
    }
    await sleep(CONNECT_INTERVAL_MS);
  }
}

/**
 * Reading back how the published posts are doing, so the analytics page is
 * true. The slowest of the three: nothing here is urgent, and an account with
 * no recent posts never opens a browser for it.
 */
async function insightsLoop(): Promise<void> {
  for (;;) {
    if (shuttingDown()) return;
    try {
      await insightsPass();
    } catch (error) {
      logError("insights pass failed", error);
    }
    await sleep(INSIGHTS_INTERVAL_MS);
  }
}

/**
 * Set the moment systemd asks the worker to stop.
 *
 * Nothing listened for SIGTERM, so every deploy killed whatever was in the
 * browser at that second. The unit already waits 180 seconds for a clean exit,
 * precisely so Chrome can flush its cookies, but that patience was spent
 * waiting for a process that had no intention of leaving and then SIGKILLed
 * anyway. A sign-in interrupted this way looks exactly like a sign-in that
 * failed, and it spends one of the account's three attempts.
 *
 * Read before each pass rather than mid-pass: the work already running is
 * allowed to finish inside the window it has, and no new browser opens.
 */
let stopping = false;

/** True when the loops should wind down rather than start anything new. */
function shuttingDown(): boolean {
  return stopping;
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    log("shutting down, letting the current pass finish", { signal });
  });
}

async function main(): Promise<void> {
  log("worker starting", { env: process.env.WORKER_ENV ?? "development" });
  // No loop ever returns, and none may take the others down: a thrown error
  // inside one is already handled per pass, and Promise.all here only keeps the
  // process alive.
  await Promise.all([agentLoop(), connectLoop(), publishLoop(), insightsLoop()]);
}

if (import.meta.filename === process.argv[1]) {
  main().catch((error) => {
    logError("worker died", error);
    process.exit(1);
  });
}
