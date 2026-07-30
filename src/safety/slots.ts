import { log } from "../logger.ts";

/**
 * How many browsers may exist at once on this box, and who holds them.
 *
 * A persistent Chrome takes 0.7 to 1 GB and the operating system wants about
 * one, so a 16 GB machine fits roughly 15 at a time. The naive design keeps one
 * browser resident per account forever, which caps the box at 15 customers. The
 * design here time-shares instead: an account takes a slot, works its queue,
 * closes cleanly, and releases. Because agents only act inside their own
 * business hours and leave 40 to 120 seconds between actions, one slot serves
 * five to eight accounts across a day, and a US account and a European one
 * never contend at all.
 *
 * Nicolas, 2026-07-30, on why this ships on day one rather than as a later
 * optimisation: retrofitting a scheduler onto a fleet of resident browsers
 * means migrating live profiles between machines, which is the single operation
 * the whole design exists to avoid.
 *
 * **Overlap is forbidden, not discouraged.** A slot is a lease. It is taken,
 * held for exactly one account, and released only after that account's browser
 * has closed. A queue that cannot get a slot waits for the next pass rather
 * than opening a browser alongside somebody else, because two Chromes over the
 * memory budget means the kernel picks which customer dies.
 */

/**
 * Default sized for the first box, a 16 GB Netcup RS 2000. Override on bigger
 * hardware with WORKER_SLOTS rather than by editing this.
 */
const DEFAULT_SLOTS = 12;

function capacity(): number {
  const raw = Number(process.env.WORKER_SLOTS ?? DEFAULT_SLOTS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_SLOTS;
}

/** Which LinkedIn account currently holds each occupied slot. */
const held = new Map<string, number>();
let inUse = 0;

export interface SlotLease {
  release(): void;
}

export class NoSlotError extends Error {
  constructor() {
    super("Every session slot on this box is busy");
    this.name = "NoSlotError";
  }
}

/**
 * Takes a slot for one LinkedIn account, or refuses.
 *
 * Refusing is the correct behaviour rather than queueing indefinitely: the
 * worker runs a pass every few minutes, so an account that cannot get a slot
 * now simply goes in the next pass, which is invisible to a customer whose
 * agent acts a few times an hour.
 *
 * Re-entrant per account on purpose. Several agents can drive one LinkedIn
 * account, and they share its one browser and its one address, so the second
 * agent joins the lease rather than taking a second slot.
 */
export function takeSlot(linkedinAccountId: string): SlotLease {
  const existing = held.get(linkedinAccountId);
  if (existing !== undefined) {
    held.set(linkedinAccountId, existing + 1);
    return { release: () => drop(linkedinAccountId) };
  }

  if (inUse >= capacity()) {
    throw new NoSlotError();
  }

  inUse += 1;
  held.set(linkedinAccountId, 1);
  return { release: () => drop(linkedinAccountId) };
}

function drop(linkedinAccountId: string): void {
  const depth = held.get(linkedinAccountId);
  if (depth === undefined) return;
  if (depth > 1) {
    held.set(linkedinAccountId, depth - 1);
    return;
  }
  held.delete(linkedinAccountId);
  inUse = Math.max(0, inUse - 1);
}

export function slotsInUse(): number {
  return inUse;
}

export function slotCapacity(): number {
  return capacity();
}

/**
 * Puts the accounts most worth running first when there are more of them than
 * there are slots.
 *
 * The ordering is by how long ago each account last ran, oldest first, so a
 * busy box spreads its attention evenly rather than always serving whoever
 * happens to sort first. It is deliberately not a priority queue by plan tier:
 * an account that never runs is an account that looks abandoned to LinkedIn,
 * and that is worse for the customer than a slightly later send.
 */
export function fairOrder<T extends { linkedinAccountId: string; lastRunAt?: Date | null }>(
  contexts: T[]
): T[] {
  return [...contexts].sort((a, b) => {
    const at = a.lastRunAt ? a.lastRunAt.getTime() : 0;
    const bt = b.lastRunAt ? b.lastRunAt.getTime() : 0;
    return at - bt;
  });
}

export function reportSlots(): void {
  log("slots", { inUse, capacity: capacity() });
}
