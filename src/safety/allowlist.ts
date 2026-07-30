import type { LinkedInActions } from "../linkedin/actions.ts";
import type { ProspectRow } from "../store.ts";
import { log } from "../logger.ts";

/**
 * Letting the whole agent run while only a named handful can actually be contacted.
 *
 * Watching mode answers "does it find the right people". It cannot answer "are the messages any
 * good once they are actually sent", because nothing is sent. This is the other half: the agent
 * mines, scores, writes and sends for real, and every recipient who is not on the list is held
 * back instead.
 *
 * So the whole pipeline is exercised end to end, on a real account, and the only people who ever
 * hear from it are the ones whose profiles were named. It is the honest version of what a fake
 * account was for.
 *
 * Every write goes through here. Wrapping the actions rather than checking inside the sequence is
 * deliberate: there are five ways to touch somebody and only one of them needs to be forgotten for
 * the guarantee to be worthless.
 */

/** A profile is named by its LinkedIn slug or by its full URL; both are normalised to the slug. */
export function profileKey(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  const match = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/);
  return (match?.[1] ?? trimmed).replace(/\/+$/, "");
}

function allowed(list: Set<string>, p: ProspectRow): boolean {
  const candidates = [p.profile_id ?? "", p.profile_url ?? ""]
    .map(profileKey)
    .filter(Boolean);
  return candidates.some((c) => list.has(c));
}

/**
 * Wraps the real actions so only the named profiles can be written to.
 *
 * Reads are untouched: the account still browses, still reads its inbox, still reads threads.
 * Withdrawing an invitation is also allowed through, because it can only ever undo something this
 * agent already did.
 */
export function onlyContact(actions: LinkedInActions, profiles: string[]): LinkedInActions {
  const list = new Set(profiles.map(profileKey).filter(Boolean));

  const held = (what: string, p: ProspectRow): false => {
    log("held back: not on the test list", {
      action: what,
      prospect: p.full_name ?? p.profile_url,
    });
    return false;
  };

  return {
    ...actions,
    warmUp: async (p) => (allowed(list, p) ? actions.warmUp(p) : held("like", p)),
    sendConnect: async (p, note) =>
      allowed(list, p) ? actions.sendConnect(p, note) : held("invitation", p),
    sendDm: async (p, body) => (allowed(list, p) ? actions.sendDm(p, body) : held("message", p)),
  };
}
