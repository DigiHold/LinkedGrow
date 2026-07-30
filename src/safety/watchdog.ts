import { startWatch, stopWatch, IDLE_LIMIT_MS, ABSOLUTE_LIMIT_MS, type Stall } from "./heartbeat.ts";
import { withRunState, type RunState } from "./run-context.ts";

/**
 * Cutting off a run that is stuck, and never one that is merely busy.
 *
 * The first version of this was a wall-clock deadline and it was wrong: an
 * agent reading four posts at a human pace can legitimately take a long time,
 * and a limit on duration punishes the work rather than the fault. What is
 * watched instead is silence. Every browser interaction beats through the
 * pacing layer, so a run that is still clicking keeps going however long it
 * takes, and one that has not touched the page in five minutes is waiting on
 * something that is never coming.
 *
 * It matters because the slot belongs to the whole account and is released only
 * when the group finishes. One hung browser would otherwise keep every agent on
 * that address idle for good.
 *
 * It lives here rather than in worker.ts because publishing needs it too: a
 * post whose upload never settles holds the same slot as a stalled agent, and
 * two copies of this would drift apart.
 */
export class RunStalled extends Error {
  // Written out rather than declared as a constructor parameter property: Node
  // runs this file with --experimental-strip-types, which erases types without
  // transpiling, and a parameter property would have to be rewritten rather
  // than erased. Node 24 tolerated it locally and Node 22 on the box did not,
  // so the crash only appeared after deploying.
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

/** Polls the heartbeat rather than counting down, so a working run is never interrupted. */
export function withWatchdog<T>(work: () => Promise<T>): Promise<T> {
  const now = Date.now();
  // Each run gets its own persona, its own cursor and its own heartbeat. They
  // used to be module globals, so with several accounts running at once the
  // last browser to open decided how all of them moved, and the first one to
  // finish disarmed everybody else's watchdog.
  const state: RunState = {
    persona: null,
    cursor: { x: 0, y: 0 },
    heartbeat: { lastBeat: now, startedAt: now },
  };
  const running = withRunState(state, async () => {
    startWatch();
    return work();
  });
  // A stalled run keeps executing after the race is lost, so its rejection has
  // to land somewhere.
  running.catch(() => {});
  let timer: NodeJS.Timeout;
  const watch = new Promise<never>((_, reject) => {
    timer = setInterval(() => {
      // Read this run's own numbers, not whichever run happens to be current on
      // the timer's stack.
      const idleMs = Date.now() - state.heartbeat.lastBeat;
      const ranMs = Date.now() - state.heartbeat.startedAt;
      if (idleMs >= IDLE_LIMIT_MS) reject(new RunStalled({ kind: "idle", idleMs, ranMs }));
      else if (ranMs >= ABSOLUTE_LIMIT_MS) {
        reject(new RunStalled({ kind: "absolute", idleMs, ranMs }));
      }
    }, 15_000);
  });
  return Promise.race([running, watch])
    .catch(async (error: unknown) => {
      if (!(error instanceof RunStalled)) throw error;
      // Close the abandoned browser before returning, or the next run on this
      // account opens a second one on the same profile and the account is
      // signed in twice.
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
