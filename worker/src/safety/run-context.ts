import { AsyncLocalStorage } from "node:async_hooks";
import type { Persona } from "../browser/human.ts";

/**
 * State that belongs to one agent's run, not to the process.
 *
 * The worker runs every LinkedIn account concurrently, and three things had been written as module
 * globals as though it ran one at a time.
 *
 * The motor persona and the cursor position were the worst of them. Each account is supposed to
 * move the mouse and type with its own habits, which is the whole reason the persona exists, and a
 * single shared variable meant the last account to open a browser set the behaviour for all of
 * them. Two different people, one cursor trail, which is a fingerprint rather than a defence.
 *
 * The heartbeat had the same shape and a sharper edge: the first agent to finish called stopWatch
 * and switched the watchdog off for everybody still running.
 *
 * AsyncLocalStorage is the right tool because the readers sit deep in the call stack. sleep() has
 * no idea which agent it belongs to and should not have to be told; it simply reads whatever run
 * it happens to be inside.
 */

export interface RunState {
  persona: Persona | null;
  cursor: { x: number; y: number };
  heartbeat: { lastBeat: number; startedAt: number };
  /**
   * How to shut this run's browser, registered as soon as one is open.
   *
   * The watchdog abandons a stalled run by losing a race, which leaves that run still executing
   * and its Chrome still open. The next agent on the same LinkedIn account would then open a
   * second browser on the same profile directory, so one account would be signed in twice at once.
   * That is the single easiest thing for LinkedIn to spot, so the watchdog closes the browser
   * itself before anybody else is allowed to start.
   */
  closeBrowser?: () => Promise<void>;
}

const storage = new AsyncLocalStorage<RunState>();

/** Runs `fn` with its own state, invisible to every other agent running at the same time. */
export function withRunState<T>(initial: RunState, fn: () => Promise<T>): Promise<T> {
  return storage.run(initial, fn);
}

/**
 * The current run's state, or null outside one.
 *
 * Null is normal rather than exceptional: the tests call these helpers directly, and so does the
 * one-off login command. Callers fall back to their own defaults instead of failing.
 */
export function currentRun(): RunState | null {
  return storage.getStore() ?? null;
}
