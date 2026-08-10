import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toViewer,
  wantsNextPage,
  passesSignalGates,
  looksLikeBuyer,
  queriesForSignal,
  unsupportedSearch,
  type SignalKind,
} from "./sources.ts";
import { matchesIcp, matchesLocation, parseCard, saysWord } from "./miner.ts";
import type { Config } from "../config.ts";
import { splitHeadline } from "./sourcing.ts";

const HREF = "https://www.linkedin.com/in/ACoAAENZabc123DEF456/";

// Only the fields the gates read; the rest of the config is irrelevant here.
const cfg = { leads: { icpKeywords: ["founder", "marketing", "head of growth", "project manager"] } } as unknown as Config;

/** Runs the deterministic gates against a card in the shape LinkedIn renders it. */
function passes(kind: SignalKind, headline: string, body: string): boolean {
  const parsed = parseCard({ href: HREF, text: ["Feed post", "Jane Doe", headline, "1w • ", "Follow", body].join("\n") });
  assert.ok(parsed, "card should parse");
  return passesSignalGates(cfg, kind, parsed);
}

test("a profile viewer row becomes a lead", () => {
  const v = toViewer({ href: HREF, text: "Jane Doe\n• 1st\nFounder & CEO, Acme" });
  assert.ok(v);
  assert.equal(v.fullName, "Jane Doe");
  assert.equal(v.headline, "Founder & CEO, Acme");
  assert.equal(v.source, "viewer");
});

test("an anonymous viewer row without a profile link is skipped", () => {
  assert.equal(toViewer({ href: "https://www.linkedin.com/analytics/", text: "Someone at Acme" }), null);
});

test("a job change passes on the move itself, with no question needed", () => {
  assert.equal(passes("jobchange", "Head of Growth at Acme", "I'm excited to share that I've started a new position as Head of Growth."), true);
});

test("an ordinary post is not mistaken for a job change", () => {
  assert.equal(passes("jobchange", "Head of Growth at Acme", "Some thoughts on our Q3 results and what worked."), false);
});

test("a hiring announcement passes, an unrelated post does not", () => {
  assert.equal(passes("hiring", "Founder at Acme", "We're hiring a Webflow developer to rebuild our marketing site."), true);
  assert.equal(passes("hiring", "Founder at Acme", "Our new site is live and I am really happy with it."), false);
});

test("an off-ICP author is dropped whatever the signal", () => {
  assert.equal(passes("jobchange", "Professional cellist", "I've started a new position as principal cellist."), false);
});

// Both searches are full of people who cannot buy: HR posting roles, and juniors announcing a first
// job. These headlines are real ones the live run surfaced before the buyer gate existed.
test("recruiters and juniors are dropped even when the signal is real", () => {
  assert.equal(passes("hiring", "HR Manager (Hiring: SEO, BDE)", "We're hiring a WordPress developer for our team."), false, "HR hires for others and buys nothing");
  assert.equal(passes("jobchange", "Marketing Assistant at Migros", "I started a new position as a Marketing Assistant."), false, "an assistant approves no budget");
});

test("a hashtag post only passes when its author is asking for help", () => {
  assert.equal(passes("hashtag", "Founder at Acme", "Our consent banner is a mess and I cannot work out which vendor to use. Any advice?"), true);
  assert.equal(passes("hashtag", "Founder at Acme", "Three lessons we learned about consent banners this quarter."), false);
});

test("looksLikeBuyer keeps decision makers", () => {
  assert.equal(looksLikeBuyer("Founder & CEO, Acme"), true);
  assert.equal(looksLikeBuyer("Head of Growth at a SaaS"), true);
  assert.equal(looksLikeBuyer("Technical Recruiter at Acme"), false);
  assert.equal(looksLikeBuyer("Computer Science Student"), false);
});

/**
 * The job title and the company have columns and were never filled.
 *
 * Every lead arrived with a headline and two empty fields, so nothing could
 * group or sort by either. The headline already carries both in the shape
 * people write it, and reading it costs no LinkedIn traffic at all.
 */
test("the job title and the company are read out of the headline", () => {
  const cases: Array<[string, string | null, string | null]> = [
    ["Senior Software Engineer @Brainstormforce | PHP, JS", "Senior Software Engineer", "Brainstormforce"],
    ["Head of Growth at Acme", "Head of Growth", "Acme"],
    ["Fondateur de schoolsWP | Formateur WordPress", "Fondateur", "schoolsWP"],
    ["Freelance WordPress developer", "Freelance WordPress developer", null],
    ["", null, null],
    // Headlines routinely open with an emoji or a bare separator, and taking
    // the first segment as-is stored job titles like "| WordPress".
    ["🚀 | WordPress Developer | Shopify", "WordPress Developer", null],
    ["💻 Full Stack Magento & WordPress", "Full Stack Magento & WordPress", null],
    ["✨", null, null],
  ];
  for (const [headline, title, company] of cases) {
    const got = splitHeadline(headline);
    assert.equal(got.jobTitle, title, `title for "${headline}"`);
    assert.equal(got.company, company, `company for "${headline}"`);
  }
});

/**
 * The connection degree is printed inside the name on search results.
 *
 * Leads were stored as "Inga Fira-Jurkowska • 2nd", and the first message an
 * agent sent would have opened with it.
 */
test("the connection degree never ends up inside the name", () => {
  for (const [text, expected] of [
    ["Inga Fira-Jurkowska • 2nd\nFounder at Acme", "Inga Fira-Jurkowska"],
    ["Vanessa Donatiello • 3rd+\nCourse creator", "Vanessa Donatiello"],
    ["John Hitchens\nFreelancer", "John Hitchens"],
  ] as const) {
    const lead = toViewer({ href: "https://www.linkedin.com/in/x/", text });
    assert.equal(lead?.fullName, expected);
  }
});

/**
 * Money in the bank, which is the budget signal every rival advertises and the
 * one we had nothing for.
 *
 * It needs no data provider. Founders announce their own rounds, on LinkedIn,
 * in the same breath as thanking their investors, and a post carries a name and
 * a headline where a Crunchbase row carries neither.
 *
 * The gate is deliberately narrow, because the two populations that must not
 * come through this door are the ones that talk about funding most: fundraising
 * consultants and VC newsletters.
 */
test("somebody announcing their own round is a funding signal", () => {
  assert.equal(passes("funding", "Founder at Nomi", "Thrilled to announce we raised our seed round"), true);
  assert.equal(passes("funding", "Founder at Nomi", "We've raised $2M to build this properly"), true);
  assert.equal(passes("funding", "Founder at Nomi", "Closed our Series A last week"), true);
});

test("talking about funding is not the same as having raised any", () => {
  assert.equal(
    passes("funding", "Founder at Nomi", "Great thread on how seed funding works in 2026"),
    false
  );
  assert.equal(
    passes("funding", "Founder at Nomi", "Funding is harder than ever right now"),
    false
  );
});

test("a funding search asks for the announcement, not just the role", () => {
  // Searching "founder" against a funding regex returns almost nothing, so this
  // signal carries its own words and uses the role only to narrow the field.
  const q = queriesForSignal("funding", ["founder", "cto"]);
  assert.ok(q.every((s) => /raised|seed/i.test(s)), q.join(" | "));
  assert.ok(q.some((s) => s.startsWith("founder")));
  // A job move is about the person, so the role IS the query and the regex does the rest.
  assert.deepEqual(queriesForSignal("jobchange", ["founder", "cto"]), ["founder", "cto"]);
});

/**
 * The event signal, which was dropped once and recorded as impossible.
 *
 * The note in this file said attendee lists are no longer public, and that is
 * true and beside the point: people post that they are going. A post carries a
 * name, a headline and something to open with, which no list ever did.
 */
test("somebody standing in a room full of their own market is an event signal", () => {
  assert.equal(passes("event", "Head of Growth at Nomi", "Speaking at SaaStock next month"), true);
  assert.equal(passes("event", "Head of Growth at Nomi", "I'll be at Web Summit, say hello"), true);
  assert.equal(passes("event", "Head of Growth at Nomi", "We just shipped a new dashboard"), false);
});

test("a recruiter announcing a round or an event still never gets through", () => {
  // The buyer gate runs before any of the new regexes, which is what keeps
  // recruiters, students and job seekers out of every signal at once.
  assert.equal(passes("funding", "Technical Recruiter at Nomi", "We raised our seed round"), false);
  assert.equal(passes("event", "Talent Acquisition at Nomi", "Speaking at SaaStock next month"), false);
});

/**
 * The promise the wizard made that the code could not keep.
 *
 * "Work through a search or a Sales Navigator list" was on the screen, and a
 * Sales Navigator list addresses its people as /sales/lead/<urn> with no public
 * profile anywhere on the card. The extraction found nothing, and the source
 * reported an empty search exactly like a quiet day, so a customer could leave
 * their best list in there for weeks and never learn it was not being read.
 */
test("a Sales Navigator list is refused with a reason instead of failing silently", () => {
  const why = unsupportedSearch("https://www.linkedin.com/sales/search/people?savedSearchId=123");
  assert.ok(why, "a list that cannot be worked must say so");
  assert.match(String(why), /Sales Navigator/);
  assert.match(String(why), /people search/, "and it must say what to do instead");
});

test("an ordinary people search is worked as normal", () => {
  assert.equal(
    unsupportedSearch("https://www.linkedin.com/search/results/people/?keywords=indie%20founder"),
    null
  );
  assert.equal(unsupportedSearch("indie SaaS founder"), null);
});

test("pasting your own feed or inbox is caught too", () => {
  assert.ok(unsupportedSearch("https://www.linkedin.com/feed/"));
  assert.ok(unsupportedSearch("https://www.linkedin.com/messaging/"));
});

/**
 * The five real leads of 2026-08-10, and why four of them should never have
 * been claimed.
 *
 * The scorer threw them out at 15, 15, 15 and 22, which means the agent had
 * already spent a page load, a model call and a row in the customer's Leads tab
 * on each of them. The customer counted five leads, looked at them, and found
 * one worth writing to.
 *
 * Every one of the four got through the same way: `matchesIcp` tested with
 * `includes`, on a flat list of roles AND industries joined by `some`.
 */
test("Director no longer qualifies as a CTO, which is three letters of it", () => {
  const roles = ["Founder", "Co-founder", "CTO", "Indie hacker", "SaaS founder"];
  const kostov =
    "Director of Sales & Partnerships EMEA @Sirma AI | Helping enterprises turn AI investment into production results";
  assert.equal(
    matchesIcp(roles, kostov),
    false,
    "Dire(cto)r contains cto, and every sales director on LinkedIn was passing as a chief technology officer"
  );
  // The real thing still matches, in every shape a headline writes it.
  assert.equal(matchesIcp(roles, "CTO at Recepto"), true);
  assert.equal(matchesIcp(roles, "Co-Founder & CTO | building in public"), true);
  assert.equal(matchesIcp(roles, "cto, ex-Stripe"), true);
});

test("an industry in a headline is not a person's role", () => {
  // Roles only now. SaaS is a market she sells into, not a thing she is.
  const roles = ["Founder", "Co-founder", "CTO", "Indie hacker"];
  const olga =
    "Enterprise Sales, Account Management, Stratigic Partnerships | 15+ Years Scaling CDN, Cloud, SaaS, GPU-aaS & AI Infrastructure Globally";
  assert.equal(matchesIcp(roles, olga), false);
});

test("the founders still come through untouched", () => {
  const roles = ["Founder", "Co-founder", "CTO", "Indie hacker", "engineer"];
  assert.equal(matchesIcp(roles, "Founding Engineer @ Recepto.ai | ex JLR"), true);
  assert.equal(matchesIcp(roles, "Co-Founder & Chief Technology Officer at Elite Infotec"), true);
  assert.equal(matchesIcp(roles, "Indie Hacker | SaaS | Chatbot Builder"), true);
});

test("word matching survives the punctuation headlines are made of", () => {
  assert.equal(saysWord("co-founder @acme | building things", "founder"), true);
  assert.equal(saysWord("Founder/CEO", "ceo"), true);
  assert.equal(saysWord("Head of Growth·SaaS", "saas"), true);
  // And still refuses the letters-inside-a-word case that started this.
  assert.equal(saysWord("Director of Marketing", "cto"), false);
  assert.equal(saysWord("Filmmaker and editor", "maker"), false);
  assert.equal(saysWord("Reengineering the funnel", "engineer"), false);
});

/**
 * The locations the wizard asks for, which filtered nobody.
 *
 * `a.locations` was read in exactly one place: to write "You are Maria, based
 * in Montreux" into the message prompts. That is the SENDER's location. No
 * prospect was ever dropped for being on the wrong continent, so an agent aimed
 * at France claimed founders in Bangalore and Sofia, and the customer read that
 * as bad targeting because it is.
 */
test("somebody outside the chosen places is dropped", () => {
  const france = ["France", "Paris"];
  assert.equal(matchesLocation(france, "Lyon, Auvergne-Rhone-Alpes, France"), true);
  assert.equal(matchesLocation(france, "Greater Paris Metropolitan Region"), true);
  assert.equal(matchesLocation(france, "Bengaluru, Karnataka, India"), false);
  assert.equal(matchesLocation(france, "Sofia, Sofia City, Bulgaria"), false);
});

test("naming no place means anywhere, which is the default", () => {
  assert.equal(matchesLocation([], "Bengaluru, Karnataka, India"), true);
  assert.equal(matchesLocation([], null), true);
});

test("a card with no place on it still passes", () => {
  // Reaction and comment rows carry no location at all. Dropping everybody
  // LinkedIn happened not to label would throw away most of the pipeline to
  // enforce a preference.
  assert.equal(matchesLocation(["France"], null), true);
  assert.equal(matchesLocation(["France"], ""), true);
  assert.equal(matchesLocation(["France"], "   "), true);
});

test("a one-letter place never matches everything by accident", () => {
  assert.equal(matchesLocation(["F"], "Bengaluru, Karnataka, India"), false);
});

/**
 * One page was all the people search ever read: about ten cards, then done,
 * on the most productive source type the live agent has. Page 2 of a query
 * that just proved itself beats page 1 of a weaker one, and it costs one
 * booked search, so it has to be earned.
 */
test("a page that kept people and still wants more turns the page", () => {
  assert.equal(wantsNextPage(3, 9, 7), true);
});

test("a page that kept almost nobody does not pay for another", () => {
  assert.equal(wantsNextPage(1, 9, 9), false, "one keep in ten is an exhausted query");
});

test("a thin results page says the query is done", () => {
  assert.equal(wantsNextPage(3, 4, 7), false, "LinkedIn itself is running out");
});

test("a filled quota never buys another page", () => {
  assert.equal(wantsNextPage(10, 10, 0), false);
});
