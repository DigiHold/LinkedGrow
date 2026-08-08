/**
 * People who can never buy, because they sell the same thing.
 *
 * On 2026-08-08 two messages went out from a customer's account, in her name:
 *
 *   Shibam B., "Co-founder, RazorBooking.com | Appointments, Payments &
 *   Reminders, Built for Service Businesses", found under a Calendly post.
 *   The product he co-founded IS a booking system.
 *
 *   Zhanya Qin, "Founder at GDPRChecker | Cookie Consent & Privacy Readiness",
 *   found by searching "cookie consent". The product she founded IS a cookie
 *   consent widget. A first-degree connection, so she was messaged without even
 *   an invitation.
 *
 * A person reads either headline and knows in half a second. Two separate
 * failures let the machine through.
 *
 * The scorer never learned what the customer sells. It was given the ideal
 * customer and the prospect and nothing else, so the collision was not
 * something it judged wrongly, it was something it could not see. Worse, the
 * last line of its prompt said engaging with a competitor made somebody a
 * STRONGER match, which promotes a rival founder watching their own market.
 *
 * And keyword sources are structurally polluted. The people who talk most about
 * "cookie consent" on LinkedIn are the people selling cookie consent.
 *
 * The scorer now gets the customer's product and a rule that zeroes a rival
 * whatever their signal. This file is the deterministic half underneath that: a
 * cheap check that costs no model call, cannot have an off day, and holds the
 * two real headlines as tests. It fires only on the clear case, because
 * blocking a good lead costs a lead and messaging a competitor costs trust.
 */

/**
 * Words that describe every business on LinkedIn and therefore distinguish none.
 *
 * Two of these together are not a category. "Small business" and "service
 * businesses" are what half of all headlines say, and treating them as an
 * overlap would flag the customer's own audience as competitors, which is the
 * one failure worse than the one being fixed.
 */
const GENERIC = new Set([
  "a", "an", "and", "the", "for", "with", "your", "our", "my", "we", "i", "at", "of", "to", "in",
  "on", "by", "or", "is", "are", "that", "this", "it", "you", "all", "more", "best", "new", "top",
  "business", "businesses", "company", "companies", "brand", "brands", "client", "clients",
  "customer", "customers", "people", "team", "teams", "service", "services", "solution",
  "solutions", "platform", "platforms", "software", "app", "apps", "tool", "tools", "product",
  "products", "system", "systems", "saas", "startup", "startups", "agency", "agencies", "studio",
  "founder", "cofounder", "ceo", "cto", "coo", "owner", "president", "director", "head", "manager",
  "consultant", "coach", "expert", "specialist", "freelance", "freelancer", "solopreneur",
  "entrepreneur", "advisor", "partner", "builder", "creator", "maker",
  "marketing", "sales", "growth", "digital", "online", "web", "website", "websites", "internet",
  "ai", "automation", "data", "cloud", "tech", "technology", "linkedin", "social", "media",
  "small", "smb", "local", "global", "simple", "easy", "fast", "smart", "modern", "free", "helping",
  "help", "build", "building", "built", "make", "making", "made", "grow", "growing", "run",
  "running", "work", "working", "first", "based", "driven", "powered", "ready", "readiness",
]);

/** "bookings" and "booking" are the same category. Crude on purpose, and enough. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-zà-ÿ0-9]+/g) ?? []).map(stem);
}

/**
 * The phrases that say what a product IS, out of a description of it.
 *
 * Bigrams, plus single words long enough and specific enough to name a category
 * on their own. A single generic word is never one: a customer selling to small
 * businesses must not find a competitor in everybody whose headline says
 * "small business".
 */
export function categoryTerms(text: string): Set<string> {
  const terms = new Set<string>();
  const list = words(text);
  for (let i = 0; i < list.length; i += 1) {
    const word = list[i] as string;
    // A word only counts alone when it is long and not one of the words every
    // headline contains.
    if (word.length >= 6 && !GENERIC.has(word)) terms.add(word);
    const next = list[i + 1];
    if (!next) continue;
    // A pair counts when at least one half of it means something.
    if (!GENERIC.has(word) || !GENERIC.has(next)) terms.add(`${word} ${next}`);
  }
  return terms;
}

/**
 * Does this headline belong to somebody who BUILDS a product, rather than
 * somebody who might buy one?
 *
 * A head of marketing at a booking company is a prospect. A co-founder of a
 * booking company is not. The distinction is the role, and a product domain in
 * the headline is the other half of it: nobody writes RazorBooking.com next to
 * their name unless it is theirs.
 */
export function buildsAProduct(headline: string): boolean {
  const text = headline.toLowerCase();
  const role =
    /\b(co[- ]?founder|founder|founding|ceo|cto|owner|co[- ]?owner|creator|maker|indie hacker|solopreneur|bootstrapper|president)\b/.test(
      text
    );
  const own = /\b(i built|we built|i build|we build|i'm building|building|creator of|maker of)\b/.test(
    text
  );
  const domain = /\b[a-z0-9][a-z0-9-]{2,}\.(com|io|ai|app|co|dev|so|xyz|net)\b/.test(text);
  return role || own || domain;
}

export interface Rivalry {
  competes: boolean;
  /** The phrases both descriptions share, so the reason on the lead is honest. */
  overlap: string[];
}

/**
 * Whether this person sells what the customer sells.
 *
 * Both halves are required. Sharing a category phrase with somebody who works
 * IN that category is normal and is often exactly the person to talk to; it
 * only disqualifies them when they also own the thing.
 */
export function competesWith(headline: string, ownProduct: string): Rivalry {
  const head = (headline ?? "").trim();
  const own = (ownProduct ?? "").trim();
  if (!head || own.length < 12) return { competes: false, overlap: [] };
  if (!buildsAProduct(head)) return { competes: false, overlap: [] };

  const mine = categoryTerms(own);
  const theirs = categoryTerms(head);
  const overlap = [...theirs].filter((term) => mine.has(term));

  /**
   * A product name carries its category inside it.
   *
   * RazorBooking.com never says the word "booking" on its own, and the pair
   * "razorbooking com" matches nothing. A long category word of the customer's
   * found inside one of their words is the same evidence in a different shape.
   */
  if (overlap.length === 0) {
    const glued = head.toLowerCase().replace(/[^a-z0-9]+/g, "");
    for (const term of mine) {
      if (term.length >= 6 && !term.includes(" ") && glued.includes(term)) {
        overlap.push(term);
        break;
      }
    }
  }

  // One shared bigram, or one shared category word, is enough once the person
  // is already known to own a product.
  return { competes: overlap.length > 0, overlap: overlap.slice(0, 3) };
}

/**
 * The score a lead has to clear before anybody writes to them.
 *
 * There was no floor at all. leadsAtStep ordered by score and filtered by
 * nothing, so a lead the scorer had judged at 0 sat at the bottom of the list
 * and was contacted anyway as soon as the queue above it ran out, which on a
 * young agent is most days. Scoring a competitor 0 achieves nothing on its own;
 * this is the line that makes the 0 mean something.
 *
 * The three levels are the wizard's own words. Volume asked for reach, so it
 * lets everything through except the 0, which is now reserved for people who
 * cannot buy rather than for people who are a poor fit.
 */
export function minimumScore(level: "precision" | "balanced" | "volume"): number {
  switch (level) {
    case "precision":
      return 70;
    case "volume":
      return 1;
    default:
      return 45;
  }
}

/** The line written onto the lead, so a customer reading their queue understands. */
export function rivalryReason(overlap: string[]): string {
  const what = overlap.slice(0, 2).join(" and ");
  return what
    ? `Runs a product in the same space (${what}), so they are a competitor rather than a buyer`
    : "Runs a product in the same space, so they are a competitor rather than a buyer";
}
