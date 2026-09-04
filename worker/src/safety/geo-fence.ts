import type { Page } from "patchright";
import type { AgentContext } from "../config.ts";
import type { LinkedInActions } from "../linkedin/actions.ts";
import type { ProspectRow } from "../store.ts";
import { placeVerdict, type PlaceVerdict } from "../../../shared/countries.ts";
import { readLeadProfile } from "../linkedin/lead-profile.ts";
import { excludeProspect, setProspectPlace } from "../store.ts";
import { book } from "./reading.ts";
import { log } from "../logger.ts";

/**
 * Nobody outside the countries the customer chose is ever written to.
 *
 * A customer aimed an agent at the Americas and the Caribbean and it invited
 * people in Asia and the Middle East for as long as it ran. The country was
 * asked for in the wizard, stored on the agent, and consulted by one lead
 * source out of nine, so eight doors let anybody through.
 *
 * The lesson of the test allowlist next door applies exactly: there are several
 * ways to touch somebody and only one of them has to be forgotten for the
 * guarantee to be worthless. So this wraps the actions instead of guarding the
 * sequence, and every like, invitation and message passes through it.
 *
 * ## The place is often not printed, and that is not permission
 *
 * The old check answered a bare boolean and read a missing place as allowed,
 * which is how somebody LinkedIn never labelled ended up invited. A place has
 * three answers here. Inside, and the action goes through. Outside, and the
 * lead is closed with the reason on the row. Not printed, and the agent goes
 * and looks at the profile once, exactly as a person would before pressing
 * connect, and decides on what it reads there.
 *
 * A visit costs one profile against the account's daily reading allowance, so
 * it happens once per person per run, only for a lead already about to be
 * contacted, and it is recorded like every other page this account opens.
 *
 * ## What happens when the profile does not say either
 *
 * The lead is closed rather than contacted. "Greater Paris Metropolitan Region"
 * names no country, and guessing at one is how this bug worked. A customer who
 * named their countries asked for the strict reading, and the row says the
 * place could not be read so nothing about it is silent.
 */

/** Why a lead was closed, written to the row so the dashboard can say it plainly. */
export const OUTSIDE_REASON = "Outside the countries this agent targets";
export const UNREADABLE_REASON = "LinkedIn does not say which country they are in";

/**
 * Reads the place off one profile. Injected so the fence can be tested without
 * a browser, and because the fence's job is the decision, not the scraping.
 */
export type PlaceReader = (profileUrl: string) => Promise<string | null>;

export function onlyInCountries(
  actions: LinkedInActions,
  ctx: AgentContext,
  page: Page,
  readPlace: PlaceReader = async (url) => (await readLeadProfile(page, url))?.location ?? null
): LinkedInActions {
  const wanted = ctx.cfg.leads.locations ?? [];
  // No country chosen is worldwide, which is the default, and worldwide needs
  // no fence at all. Returning the actions untouched keeps the common agent on
  // exactly the code path it had before.
  if (wanted.length === 0) return actions;

  /** One decision per person per run, so warmUp and sendConnect share the visit. */
  const decided = new Map<string, PlaceVerdict>();

  const keyOf = (p: ProspectRow): string => p.profile_id ?? p.profile_url;

  async function verdict(p: ProspectRow): Promise<PlaceVerdict> {
    const key = keyOf(p);
    const already = decided.get(key);
    if (already) return already;

    let answer = placeVerdict(wanted, p.location);

    if (answer === "unknown") {
      // The visit is booked before the page opens, like every other read this
      // account does, so a run that dies halfway still counts what it saw.
      await book(ctx.linkedinAccountId, ctx.timezone, { profiles: 1 }).catch(() => {});
      const place = await readPlace(p.profile_url).catch(() => null);
      if (place) {
        await setProspectPlace(ctx, p.id, place).catch(() => {});
        answer = placeVerdict(wanted, place);
      }
    }

    decided.set(key, answer);
    return answer;
  }

  /**
   * Closes the lead so the next pass does not pay for the same profile again.
   *
   * Left open, a person whose country cannot be read would be re-read on every
   * pass for ever, and each of those is a real page load from the account's own
   * address for an answer we already have.
   */
  async function close(p: ProspectRow, answer: PlaceVerdict, what: string): Promise<void> {
    const reason = answer === "out" ? OUTSIDE_REASON : UNREADABLE_REASON;
    await excludeProspect(ctx, p.id, reason).catch(() => {});
    log("held back: outside the chosen countries", {
      action: what,
      prospect: p.full_name ?? p.profile_url,
      place: p.location ?? "(LinkedIn printed none)",
      countries: wanted,
      verdict: answer,
    });
  }

  return {
    ...actions,
    warmUp: async (p) => {
      const answer = await verdict(p);
      if (answer === "in") return actions.warmUp(p);
      await close(p, answer, "like");
      return false;
    },
    sendConnect: async (p, note) => {
      const answer = await verdict(p);
      if (answer === "in") return actions.sendConnect(p, note);
      await close(p, answer, "invitation");
      return "failed";
    },
    sendDm: async (p, body) => {
      const answer = await verdict(p);
      if (answer === "in") return actions.sendDm(p, body);
      await close(p, answer, "message");
      return false;
    },
  };
}
