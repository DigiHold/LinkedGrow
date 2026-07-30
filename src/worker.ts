import "dotenv/config";
import { db, loadRunnableAgents, touchRun, pauseAgent, flagAccount, recordEvent } from "./db.ts";
import type { AgentContext } from "./config.ts";
import { log, logError } from "./logger.ts";
import { assertCanSend, HaltedError } from "./guards.ts";
import { BudgetExceededError } from "./ai.ts";
import { openSession, closeSession, ProxyMismatchError, isSignedIn } from "./browser/driver.ts";
import type { ProxyAllocation } from "./browser/driver.ts";
import { decryptSecret } from "./crypto.ts";
import { groupKey, withAddress } from "./safety/ip-lock.ts";
import { NoSlotError, reportSlots, takeSlot } from "./safety/slots.ts";
import { startWatch, stopWatch, IDLE_LIMIT_MS, ABSOLUTE_LIMIT_MS, type Stall } from "./safety/heartbeat.ts";
import { withRunState, currentRun, type RunState } from "./safety/run-context.ts";
import { fulfilPendingAllocations } from "./proxy/fulfil.ts";
import { isWithinBusinessHours, isWithinSourcingHours } from "./safety/envelope.ts";
import { runSequence } from "./linkedin/sequence.ts";
import { sourcePass } from "./linkedin/sourcing.ts";
import { browserActions } from "./linkedin/actions.ts";
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

/**
 * Where an agent's address comes from.
 *
 * The dashboard orders the address the moment the customer picks a country and
 * binds it to their LinkedIn account, so the worker only ever reads. It reads
 * by **LinkedIn account**, never by agent and never by workspace, because the
 * invariant in plan section 5c is one account and one address however many
 * agents drive it.
 *
 * A missing or inactive row is not an error to route around. In production the
 * agent pauses, because an account sending from the server's own address is an
 * account seen from a datacentre.
 */
async function allocationFor(ctx: AgentContext): Promise<ProxyAllocation | null> {
  const { rows } = await db().execute({
    sql: `SELECT host, port, username_encrypted, password_encrypted, last_exit_ip
            FROM proxy_allocations
           WHERE linkedin_account_id = ? AND status = 'active'
           LIMIT 1`,
    args: [ctx.linkedinAccountId],
  });
  const row = rows[0];
  if (!row) return null;

  const username = decryptSecret(String(row.username_encrypted ?? ""));
  const password = decryptSecret(String(row.password_encrypted ?? ""));
  if (!username || !password) {
    log(`account ${ctx.linkedinAccountId}: address stored without credentials`);
    return null;
  }

  return {
    server: `http://${String(row.host)}:${Number(row.port)}`,
    username,
    password,
    // The driver asserts the observed exit against this before anything runs,
    // so an address that silently changed stops the session rather than
    // sending from somewhere the account has never been seen.
    expectedIp: String(row.last_exit_ip ?? ""),
  };
}

function isProduction(): boolean {
  return process.env.WORKER_ENV === "production";
}

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

  const proxy = await allocationFor(ctx);
  if (!proxy && isProduction()) {
    // Never in production. An account sending from the server's own address is
    // an account seen from a datacentre, which is the fastest way to lose it.
    await pauseAgent(ctx, "No dedicated address is allocated to this account yet.");
    return;
  }

  const session = await openSession(ctx, proxy);
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
/**
 * Cutting off an agent that is stuck, and never one that is merely busy.
 *
 * The first version of this was a wall-clock deadline and it was wrong: an agent reading four
 * posts at a human pace can legitimately take a long time, and a limit on duration punishes the
 * work rather than the fault. What is watched instead is silence. Every browser interaction beats
 * through the pacing layer, so an agent that is still clicking keeps running however long it
 * takes, and one that has not touched the page in five minutes is waiting on something that is
 * never coming.
 *
 * It matters because the slot belongs to the whole account and is released only when the group
 * finishes. One hung browser would otherwise keep every agent on that address idle for good.
 */
class RunStalled extends Error {
  // Written out rather than declared as a constructor parameter property: Node runs this file with
  // --experimental-strip-types, which erases types without transpiling, and a parameter property
  // would have to be rewritten rather than erased. Node 24 tolerated it locally and Node 22 on the
  // box did not, so the crash only appeared after deploying.
  readonly stall: Stall;

  constructor(stall: Stall) {
    super(
      stall.kind === "idle"
        ? `no browser activity for ${Math.round(stall.idleMs / 1000)}s`
        : `still running after ${Math.round(stall.ranMs / 60_000)} minutes`
    );
    this.stall = stall;
    this.name = "RunStalled";
  }
}

/** Polls the heartbeat rather than counting down, so a working agent is never interrupted. */
function withWatchdog<T>(work: () => Promise<T>): Promise<T> {
  const now = Date.now();
  // Each agent gets its own persona, its own cursor and its own heartbeat. They used to be module
  // globals, so with several accounts running at once the last browser to open decided how all of
  // them moved, and the first agent to finish disarmed everybody else's watchdog.
  const state: RunState = {
    persona: null,
    cursor: { x: 0, y: 0 },
    heartbeat: { lastBeat: now, startedAt: now },
  };
  const running = withRunState(state, async () => {
    startWatch();
    return work();
  });
  // A stalled run keeps executing after the race is lost, so its rejection has to land somewhere.
  running.catch(() => {});
  let timer: NodeJS.Timeout;
  const watch = new Promise<never>((_, reject) => {
    timer = setInterval(() => {
      // Read this run's own numbers, not whichever run happens to be current on the timer's stack.
      const idleMs = Date.now() - state.heartbeat.lastBeat;
      const ranMs = Date.now() - state.heartbeat.startedAt;
      if (idleMs >= IDLE_LIMIT_MS) reject(new RunStalled({ kind: "idle", idleMs, ranMs }));
      else if (ranMs >= ABSOLUTE_LIMIT_MS) reject(new RunStalled({ kind: "absolute", idleMs, ranMs }));
    }, 15_000);
  });
  return Promise.race([running, watch])
    .catch(async (error: unknown) => {
      if (!(error instanceof RunStalled)) throw error;
      // Close the abandoned browser before returning, or the next agent on this account opens a
      // second one on the same profile and the account is signed in twice.
      await Promise.race([
        state.closeBrowser?.() ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 30_000)),
      ]).catch(() => {});
      throw error;
    })
    .finally(() => {
      clearInterval(timer);
      stopWatch();
    }) as Promise<T>;
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

async function main(): Promise<void> {
  log("worker starting", { env: process.env.WORKER_ENV ?? "development" });
  for (;;) {
    try {
      await pass();
    } catch (error) {
      logError("pass failed", error);
    }
    await sleep(PASS_INTERVAL_MS);
  }
}

if (import.meta.filename === process.argv[1]) {
  main().catch((error) => {
    logError("worker died", error);
    process.exit(1);
  });
}
