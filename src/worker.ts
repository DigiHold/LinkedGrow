import "dotenv/config";
import { db, loadRunnableAgents, touchRun, pauseAgent, flagAccount, recordEvent } from "./db.ts";
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
import { publishPass } from "./publish/pass.ts";
import { insightsPass } from "./insights/pass.ts";
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
      await flagAccount(
        ctx,
        "challenged",
        "This account is signed out. Sign in once from the dashboard and the agent picks up on its own."
      );
      return;
    }

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
      writeMessage: async (prospect, step, thread) =>
        withAddress(key, async () => {
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
        }),
    });

    await touchRun(ctx);
  } finally {
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
  // Before anything runs: buy the addresses the dashboard asked for. An account
  // that connected a minute ago should have its address by the time its first
  // session would open, and an agent without one stays paused rather than
  // falling back to the server's own IP.
  try {
    await fulfilPendingAllocations();
  } catch (error) {
    logError("allocation pass failed", error);
  }

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
    try {
      await publishPass();
    } catch (error) {
      logError("publish pass failed", error);
    }
    await sleep(PUBLISH_INTERVAL_MS);
  }
}

/**
 * Reading back how the published posts are doing, so the analytics page is
 * true. The slowest of the three: nothing here is urgent, and an account with
 * no recent posts never opens a browser for it.
 */
async function insightsLoop(): Promise<void> {
  for (;;) {
    try {
      await insightsPass();
    } catch (error) {
      logError("insights pass failed", error);
    }
    await sleep(INSIGHTS_INTERVAL_MS);
  }
}

async function main(): Promise<void> {
  log("worker starting", { env: process.env.WORKER_ENV ?? "development" });
  // No loop ever returns, and none may take the others down: a thrown error
  // inside one is already handled per pass, and Promise.all here only keeps the
  // process alive.
  await Promise.all([agentLoop(), publishLoop(), insightsLoop()]);
}

if (import.meta.filename === process.argv[1]) {
  main().catch((error) => {
    logError("worker died", error);
    process.exit(1);
  });
}
