import { randInt, sleep } from "../browser/human.ts";

/**
 * Mutual exclusion on a shared address.
 *
 * Plan section 5c: several agents of one customer in one country go out through
 * one address, which is safe precisely because it looks like a household. It
 * stops looking like one the moment two of them act in the same second. So the
 * per-agent gap between actions becomes a per-ADDRESS gap, and the effective
 * ceiling for a group is the address's throughput rather than three times an
 * agent's.
 *
 * In-process, because one worker process owns one address group. If the fleet
 * ever splits a group across processes this has to become a database lease, and
 * the assertion below is what will fail loudly rather than silently letting two
 * agents through.
 */

interface Holder {
  chain: Promise<void>;
  lastActionAt: number;
}

const groups = new Map<string, Holder>();

/** The gap a real person leaves between two actions, in milliseconds. */
export const MIN_GAP_MS = 40_000;
export const MAX_GAP_MS = 120_000;

export function groupKey(workspaceId: string, country: string): string {
  return `${workspaceId}:${country}`;
}

/**
 * Runs one action with the address held, waiting out whatever remains of the
 * gap since the last action on the SAME address, whichever agent performed it.
 */
export async function withAddress<T>(
  key: string,
  action: () => Promise<T>
): Promise<T> {
  const holder = groups.get(key) ?? { chain: Promise.resolve(), lastActionAt: 0 };
  groups.set(key, holder);

  const run = holder.chain.then(async () => {
    const gap = randInt(MIN_GAP_MS, MAX_GAP_MS);
    const waited = Date.now() - holder.lastActionAt;
    if (holder.lastActionAt > 0 && waited < gap) {
      await sleep(gap - waited);
    }
    holder.lastActionAt = Date.now();
  });

  // The chain must not break on a failed action, or the address deadlocks.
  holder.chain = run.catch(() => {});
  await run;
  return action();
}

/** Testing seam: forget every held address. */
export function resetAddressLocks(): void {
  groups.clear();
}
