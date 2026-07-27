import "dotenv/config";
import { loadRunnableAgents, touchRun, pauseAgent, flagAccount, recordEvent } from "./db.ts";
import type { AgentContext } from "./config.ts";
import { log, logError } from "./logger.ts";
import { assertCanSend, HaltedError } from "./guards.ts";
import { BudgetExceededError } from "./ai.ts";
import { openSession, closeSession, ProxyMismatchError, isSignedIn } from "./browser/driver.ts";
import type { ProxyAllocation } from "./browser/driver.ts";
import { groupKey, withAddress } from "./safety/ip-lock.ts";
import { isWithinBusinessHours } from "./safety/envelope.ts";
import { runSequence } from "./linkedin/sequence.ts";
import { browserActions } from "./linkedin/actions.ts";
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
 * Not built: allocation needs a provider account, which is Nicolas's to open
 * (plan section 5b). Until then the worker runs without a proxy, which is safe
 * for a local test against one account and is refused in production by the
 * guard below.
 */
async function allocationFor(_ctx: AgentContext): Promise<ProxyAllocation | null> {
  return null;
}

function isProduction(): boolean {
  return process.env.WORKER_ENV === "production";
}

async function runAgent(ctx: AgentContext): Promise<void> {
  if (!isWithinBusinessHours(ctx.cfg)) {
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
  try {
    if (!(await isSignedIn(session.context))) {
      await flagAccount(
        ctx,
        "challenged",
        "This account is signed out. Sign in once from the dashboard and the agent picks up on its own."
      );
      return;
    }

    const actions = browserActions(session.page);
    const key = groupKey(ctx.workspaceId, ctx.country);

    await runSequence(ctx.cfg, ctx, {
      actions,
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
    await closeSession(session);
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
    await runAgent(ctx);
  } catch (error) {
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
    const key = groupKey(ctx.workspaceId, ctx.country);
    const list = byAddress.get(key) ?? [];
    list.push(ctx);
    byAddress.set(key, list);
  }
  log("pass starting", { agents: agents.length, addresses: byAddress.size });

  await Promise.all(
    [...byAddress.values()].map(async (group) => {
      for (const ctx of group) {
        await safely(ctx);
        // Even between two agents on one address, a pause.
        if (group.length > 1) await sleep(randInt(20_000, 60_000));
      }
    })
  );
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
