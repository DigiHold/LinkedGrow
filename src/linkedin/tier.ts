import type { Page } from "patchright";
import { db } from "../db.ts";
import { log } from "../logger.ts";
import type { AccountTier } from "../safety/reading.ts";

/**
 * Which LinkedIn subscription this account actually has.
 *
 * `linkedin_accounts.tier` decides how much an account may read, and until now
 * it said `free` for everybody because nothing ever wrote to it. A customer who
 * pays for Sales Navigator was therefore held to a twentieth of what they had
 * bought, silently, and would have concluded the product was slow rather than
 * that we had never looked.
 *
 * Three rules shape this, and each one is a way of not repeating a mistake
 * already made in this codebase.
 *
 * **It costs no page load.** The signals below all live in the page chrome,
 * which is on every LinkedIn page, so the check reads whatever the session is
 * already looking at. An extra sign-in or an extra navigation to find out
 * whether somebody is Premium would be one more visit in a day whose visit
 * count is the whole point of safety/rhythm.ts.
 *
 * **Silence is not evidence.** LinkedIn's class names are content hashes that
 * change without notice, so a selector that stops matching is the expected
 * failure, not the surprising one. If nothing recognisable is on the page the
 * tier is left exactly as it was. A detector that quietly reclassified every
 * account as free the day a selector broke would throttle the whole fleet and
 * look like a LinkedIn change.
 *
 * **Upgrades are instant, downgrades are not.** Somebody who buys Sales
 * Navigator this morning should have it this afternoon. Somebody whose Premium
 * appears to have lapsed might instead have hit a page that renders the nav
 * differently, so a downgrade waits for a second confident reading.
 */

/** What the page chrome says, gathered in one evaluate and judged in Node. */
export interface TierSignals {
  /** Every href in the page chrome, lowercased. */
  hrefs: string[];
  /** The visible text of the nav and of any subscription banner, lowercased. */
  text: string;
  /** alt and aria labels of the small icons, where the gold badge lives. */
  badges: string[];
}

export interface TierReading {
  tier: AccountTier;
  /**
   * False when nothing on the page said anything either way, which means the
   * selectors found nothing rather than that the account is free.
   */
  confident: boolean;
  /** What was actually matched, so the first live run says which signal fired. */
  seen: string[];
}

/**
 * A subscriber's own Sales Navigator, as opposed to the upsell everybody sees.
 *
 * /sales/solutions and /sales/products are marketing pages linked from the app
 * grid for accounts that do not have it, so matching "/sales" alone would
 * promote every account on the platform to the widest reading budget we have.
 */
const SALES_NAVIGATOR = /linkedin\.com\/sales\/(index|home|dashboard|search|lists|people|accounts)/;

/** The page a subscriber manages their plan on. Non-subscribers are sent to /premium/products. */
const PREMIUM_MANAGE = /linkedin\.com\/premium\/(my-premium|manage|survey|redeem\/manage)/;

/** The upsell, which only an account WITHOUT the subscription is shown. */
const PREMIUM_UPSELL =
  /(try premium for|retry premium|reactivate premium|start (your )?free trial|essayer premium|premium gratuit)/;

/**
 * Reads the tier out of gathered signals.
 *
 * Separate from the page so the judgement can be tested without a browser,
 * which matters here more than usual: these selectors cannot be verified
 * against a live account today, so the decision logic has to be provably right
 * even while the inputs are still unproven.
 */
export function tierFromSignals(signals: TierSignals): TierReading {
  const seen: string[] = [];
  const hrefs = signals.hrefs.map((h) => h.toLowerCase());
  const text = signals.text.toLowerCase();
  const badges = signals.badges.map((b) => b.toLowerCase());

  if (hrefs.some((h) => SALES_NAVIGATOR.test(h))) {
    seen.push("a Sales Navigator link in the page chrome");
    return { tier: "sales_navigator", confident: true, seen };
  }

  if (hrefs.some((h) => PREMIUM_MANAGE.test(h))) seen.push("the manage-your-Premium link");
  if (badges.some((b) => b.includes("premium"))) seen.push("the Premium badge");
  if (seen.length > 0) return { tier: "premium", confident: true, seen };

  // The upsell is the only POSITIVE evidence that an account is free, and it is
  // what makes a downgrade possible at all. Without it, "no Premium signal"
  // would be indistinguishable from "the selector broke".
  if (PREMIUM_UPSELL.test(text)) {
    return { tier: "free", confident: true, seen: ["the Premium upsell, which subscribers never see"] };
  }

  return { tier: "free", confident: false, seen: [] };
}

/** Pulls the signals out of whatever LinkedIn page the session is already on. */
export async function readTier(page: Page): Promise<TierReading | null> {
  if (!/linkedin\.com/.test(page.url())) return null;
  try {
    const signals = await page.evaluate(() => {
      const chrome = [
        document.querySelector("nav"),
        document.querySelector("header"),
        document.getElementById("global-nav"),
      ].filter(Boolean) as HTMLElement[];
      const scope: Array<Document | HTMLElement> = chrome.length ? chrome : [document];

      const hrefs = new Set<string>();
      const badges = new Set<string>();
      let text = "";
      for (const root of scope) {
        for (const a of Array.from(root.querySelectorAll("a[href]"))) {
          hrefs.add((a as HTMLAnchorElement).href);
        }
        for (const el of Array.from(root.querySelectorAll("[alt],[aria-label],[title]"))) {
          for (const attribute of ["alt", "aria-label", "title"]) {
            const value = el.getAttribute(attribute);
            if (value) badges.add(value);
          }
        }
        text += ` ${(root as HTMLElement).innerText ?? ""}`;
      }
      // The upsell often sits in the right rail rather than the nav, so the
      // whole document contributes text even when the chrome was found.
      text += ` ${document.body?.innerText?.slice(0, 6000) ?? ""}`;
      return { hrefs: [...hrefs], badges: [...badges], text };
    });
    return tierFromSignals(signals);
  } catch {
    // A page that navigated away mid-read is not a reason to change anything.
    return null;
  }
}

/** Today, in the account's own timezone, so the daily check lands once a day. */
function today(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Checks the tier at most once a day and writes it when the evidence is good.
 *
 * Called with whatever page the pass has just finished with, so it adds no
 * navigation of its own. Everything about it is best-effort: a tier that stays
 * where it was costs the customer some speed, and nothing else.
 */
export async function refreshTier(
  page: Page,
  accountId: string,
  timeZone: string,
  current: AccountTier
): Promise<void> {
  try {
    const day = today(timeZone);
    const { rows } = await db().execute({
      sql: `SELECT COALESCE(tier_checked_on, '') AS checked, COALESCE(tier_downgrades, 0) AS downgrades
              FROM linkedin_accounts WHERE id = ? LIMIT 1`,
      args: [accountId],
    });
    if (String(rows[0]?.checked ?? "") === day) return;

    const reading = await readTier(page);
    if (!reading) return;

    // The day is marked as checked whatever the outcome, so a page that says
    // nothing does not make the account try again on every pass.
    const downgrades = Number(rows[0]?.downgrades ?? 0);

    if (!reading.confident) {
      log("could not tell the LinkedIn tier from this page, leaving it alone", {
        accountId,
        tier: current,
      });
      await stamp(accountId, day, current, downgrades);
      return;
    }

    const rank: Record<AccountTier, number> = { free: 0, premium: 1, sales_navigator: 2 };
    const isDowngrade = rank[reading.tier] < rank[current];

    if (isDowngrade && downgrades < 1) {
      // One confident reading is not enough to take a paying customer's
      // allowance away. A second one tomorrow is.
      log("the tier looks lower than recorded, waiting for a second reading", {
        accountId,
        from: current,
        to: reading.tier,
        seen: reading.seen.join(", "),
      });
      await stamp(accountId, day, current, downgrades + 1);
      return;
    }

    if (reading.tier !== current) {
      log("LinkedIn tier changed", {
        accountId,
        from: current,
        to: reading.tier,
        seen: reading.seen.join(", "),
      });
    }
    await stamp(accountId, day, reading.tier, 0);
  } catch {
    // Never fatal. The account keeps the tier it had, which is the safe side of
    // wrong for free accounts and merely slow for the others.
    return;
  }
}

async function stamp(
  accountId: string,
  day: string,
  tier: AccountTier,
  downgrades: number
): Promise<void> {
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET tier = ?, tier_checked_on = ?, tier_downgrades = ?, updated_at = ?
           WHERE id = ?`,
    args: [tier, day, downgrades, Math.floor(Date.now() / 1000), accountId],
  });
}
