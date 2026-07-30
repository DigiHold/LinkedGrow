/**
 * Telling a busy agent apart from a stuck one.
 *
 * The first version of this guard was a wall-clock deadline, and Nicolas rejected it for the right
 * reason: an agent mining four posts at a human pace can legitimately run a long time, and cutting
 * it off punishes the work rather than the fault. A slow pass is not a broken one.
 *
 * So nothing measures how long the agent has been running. What is measured is how long it has been
 * since it last did anything at all. Every browser interaction goes through the human-pacing layer,
 * so that layer is the one place a beat can be recorded and cover everything: a click, a keystroke,
 * a scroll, a dwell. An agent that is still clicking is working, however long it takes. An agent
 * that has not touched the page in minutes is waiting on something that is never coming.
 *
 * The absolute ceiling is deliberately far away and exists only so that nothing can run forever
 * while making a beat every few seconds and no actual progress.
 */

/** No interaction at all for this long means the page is not coming back. */
export const IDLE_LIMIT_MS = 5 * 60 * 1000;

/** A last resort, hours away, for a run that beats steadily and still never finishes. */
export const ABSOLUTE_LIMIT_MS = 90 * 60 * 1000;

let lastBeat = 0;
let startedAt = 0;
let watching = false;

/**
 * Records that the agent just did something. Called from the human-pacing layer.
 *
 * The timestamp is a parameter so the limits can be tested against simulated hours rather than
 * real ones. Production never passes it.
 */
export function beat(now = Date.now()): void {
  if (watching) lastBeat = now;
}

export function startWatch(now = Date.now()): void {
  watching = true;
  startedAt = now;
  lastBeat = now;
}

export function stopWatch(): void {
  watching = false;
}

export interface Stall {
  kind: "idle" | "absolute";
  idleMs: number;
  ranMs: number;
}

/** Non-null when the run should be cut off, with which of the two limits was reached. */
export function stalled(now = Date.now()): Stall | null {
  if (!watching) return null;
  const idleMs = now - lastBeat;
  const ranMs = now - startedAt;
  if (idleMs >= IDLE_LIMIT_MS) return { kind: "idle", idleMs, ranMs };
  if (ranMs >= ABSOLUTE_LIMIT_MS) return { kind: "absolute", idleMs, ranMs };
  return null;
}
