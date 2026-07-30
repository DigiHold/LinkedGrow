import { test } from "node:test";
import assert from "node:assert/strict";
import { toEngager, toCommenter, matchesIcp, toIntentLead, onTopic, isAsking, worksAtCompany } from "./miner.ts";

// Fixtures mirror the real reactor-row shape captured from the LinkedIn reactors modal
// (name line, "View <name>'s profile" link, connection-degree noise, then the headline),
// with synthetic people so no real profile data lands in this public repo.

const HREF = "https://www.linkedin.com/in/ACoAAENZabc123DEF456/";

test("extracts name and headline from a reactor row, dropping the degree noise", () => {
  const row = {
    href: HREF,
    aria: "",
    text: "Jane Doe\nView Jane Doe's profile\n \n3rd degree connection\n· 3rd+\nHead of Security at Acme",
  };
  const e = toEngager(row, "reaction:cookiebot");
  assert.ok(e);
  assert.equal(e.fullName, "Jane Doe");
  assert.equal(e.firstName, "Jane");
  assert.equal(e.headline, "Head of Security at Acme");
  assert.equal(e.profileId, "ACoAAENZabc123DEF456");
  assert.equal(e.profileUrl, "https://www.linkedin.com/in/ACoAAENZabc123DEF456/");
  assert.equal(e.source, "reaction:cookiebot");
});

test("derives the name from the anchor aria-label when the text has none", () => {
  const row = {
    href: HREF,
    aria: "View John Smith's profile",
    text: "2nd degree connection\n· 2nd\nGDPR Consultant",
  };
  const e = toEngager(row, "reaction:onetrust");
  assert.ok(e);
  assert.equal(e.fullName, "John Smith");
  assert.equal(e.headline, "GDPR Consultant");
});

test("keeps a parenthetical alias in the name intact", () => {
  const row = {
    href: HREF,
    aria: "",
    text: "A Muthayan (Matt Lawrence)\nView A Muthayan (Matt Lawrence)'s profile\n2nd degree connection\n· 2nd\nDirector of Business Development",
  };
  const e = toEngager(row, "reaction:sucuri");
  assert.ok(e);
  assert.equal(e.fullName, "A Muthayan (Matt Lawrence)");
  assert.equal(e.headline, "Director of Business Development");
});

test("returns null for an anchor that is not a member profile", () => {
  const row = { href: "https://www.linkedin.com/company/calendly/", aria: "", text: "Calendly" };
  assert.equal(toEngager(row, "reaction:calendly"), null);
});

test("returns null when there is no usable name", () => {
  const row = { href: HREF, aria: "", text: "View someone's profile\n3rd degree connection\n· 3rd+" };
  // Every line is degree/link noise, so no name survives and the row is skipped.
  const e = toEngager(row, "reaction:x");
  assert.equal(e, null);
});

test("toCommenter isolates the name and headline from the structured meta", () => {
  const row = { href: HREF, name: "Jane Doe", headline: "Head of Growth at Acme · 3rd+" };
  const e = toCommenter(row, "comment:snyk");
  assert.ok(e);
  assert.equal(e.fullName, "Jane Doe");
  assert.equal(e.firstName, "Jane");
  assert.equal(e.headline, "Head of Growth at Acme · 3rd+");
  assert.equal(e.source, "comment:snyk");
});

test("toCommenter keeps the comment text as context, so a question can be answered later", () => {
  const row = { href: HREF, name: "Jane Doe", headline: "Founder at Acme", body: "How would that work if our consent banner is already custom built?" };
  const e = toCommenter(row, "comment:snyk");
  assert.ok(e);
  assert.match(e.context ?? "", /custom built/);
  assert.equal(isAsking(e.context ?? ""), true, "a question under an expert post is a qualified signal");
});

test("toCommenter returns null for a non-member link", () => {
  const row = { href: "https://www.linkedin.com/company/snyk/", name: "Snyk", headline: "" };
  assert.equal(toCommenter(row, "comment:snyk"), null);
});

test("matchesIcp keeps a headline that hits a keyword and drops one that misses", () => {
  const kw = ["founder", "security", "marketer"];
  assert.equal(matchesIcp(kw, "Founder & CEO at a SaaS startup"), true);
  assert.equal(matchesIcp(kw, "Head of Application Security"), true);
  assert.equal(matchesIcp(kw, "Professional violinist and music teacher"), false);
});

// A competitor's posts are read most of all by their own staff, who sit at the top of the reactions
// list. Pitching a LinkedIn tool to the founder of a LinkedIn tool, because he reacted to his own
// company's post, is how the first version wasted its best-looking leads. The filter existed in the
// single-tenant original and was lost in the port, so the worker queued them for four days.
test("people who work at the mined company are not prospects", () => {
  assert.equal(worksAtCompany("Founder & CEO / Intruder / Stop breaches", "intruder"), true);
  assert.equal(worksAtCompany("Head of Growth at Snyk", "snyk"), true);
  // The LinkedIn slug and the brand people type rarely match, so both directions have to work.
  assert.equal(worksAtCompany("Leading Agency Sales @ Profound", "tryprofound"), true);
  assert.equal(worksAtCompany("Founder at a small SaaS building websites", "intruder"), false);
  assert.equal(worksAtCompany("Head of Marketing at a Swiss law firm", "snyk"), false);
});

// Existing contacts must never enter a cold campaign: they cannot be invited, and they are the
// account's real relationships, so a stranger's opener damages them and earns spam reports.
test("someone already connected is not mined as a prospect", () => {
  const reactor = { href: HREF, aria: "", text: "Jane Doe\nView Jane Doe's profile\n1st degree connection\n· 1st\nFounder at Acme" };
  assert.equal(toEngager(reactor, "reaction:snyk"), null);

  const commenter = { href: HREF, name: "Jane Doe", headline: "Founder at Acme · 1st", body: "any advice on consent tools?" };
  assert.equal(toCommenter(commenter, "comment:snyk"), null);

  const stillMined = { href: HREF, aria: "", text: "Jane Doe\nView Jane Doe's profile\n3rd degree connection\n· 3rd+\nFounder at Acme" };
  assert.ok(toEngager(stillMined, "reaction:snyk"), "a stranger is still a prospect");
});

test("matchesIcp with no keywords keeps everyone", () => {
  assert.equal(matchesIcp([], "anything at all"), true);
});

// Intent mining: LinkedIn content search is fuzzy, so a card only becomes a lead when the post body
// genuinely discusses the query. Card text mirrors the live search-result shape.
const QUERY = "how do I make my website GDPR compliant";

test("an on-topic asker becomes a lead carrying their question as context", () => {
  const card = {
    href: HREF,
    text: [
      "Feed post",
      "Jane Doe",
      "Founder at Acme, building in public",
      "1w • ",
      "Follow",
      "We are launching in the EU next month and I still have no idea how to make the website GDPR compliant. Any advice on consent banners?",
    ].join("\n"),
  };
  const lead = toIntentLead(card, QUERY);
  assert.ok(lead);
  assert.equal(lead.fullName, "Jane Doe");
  assert.equal(lead.headline, "Founder at Acme, building in public");
  assert.equal(lead.source, `intent:${QUERY}`);
  assert.match(lead.context ?? "", /consent banners/);
});

test("a fuzzy search hit that is not about the query is rejected", () => {
  const card = {
    href: HREF,
    text: ["Feed post", "Tanoj Kumar", "SEO Team Coordinator", "1w • ", "Follow", "Looking for the best investors email list provider in 2026?"].join("\n"),
  };
  assert.equal(toIntentLead(card, QUERY), null);
});

test("onTopic needs real overlap, not a single stopword", () => {
  assert.equal(onTopic(QUERY, "our cookie banner is not gdpr compliant yet"), true);
  assert.equal(onTopic(QUERY, "how do I get more leads for my agency"), false);
});

// The asking gate separates buyers from the consultants who dominate topical search results.
// The rejected samples below are real post openings captured from LinkedIn content search.
test("isAsking keeps people seeking help", () => {
  assert.equal(isAsking("We are launching in the EU and I have no idea which consent banner to use. Any recommendations?"), true);
  assert.equal(isAsking("Our site got flagged for a vulnerability and I am stuck on where to even start"), true);
  assert.equal(isAsking("Has anyone used a scanner that catches leaked keys before deploy?"), true);
});

test("isAsking rejects consultants broadcasting expertise", () => {
  assert.equal(isAsking("A consent banner is not a seatbelt. Cookie audits are having a moment in privacy circles"), false);
  assert.equal(isAsking("Your cookie banner is hiding the most important part of your homepage. The part that sells."), false);
  assert.equal(isAsking("WordPress powers millions of websites, but how many are running without IT even knowing?"), false);
  assert.equal(isAsking("Here's how we help our clients pass a privacy audit. Book a call to learn more."), false);
});
