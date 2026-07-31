import { test } from "node:test";
import assert from "node:assert/strict";
import { toViewer, passesSignalGates, looksLikeBuyer, type SignalKind } from "./sources.ts";
import { parseCard } from "./miner.ts";
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
