import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readContentAnalytics,
  readAudienceAnalytics,
  readDashboardStats,
  valueNear,
} from "./creator.ts";

/**
 * All three fixtures were captured off Nicolas's own account on 2026-09-07 and are kept verbatim,
 * chart descriptions and cookie footers included. The layout is the whole difficulty: these pages
 * put the number before the label in their headline tiles and after it in their breakdowns, and a
 * reader built for one order silently returns the neighbour's figure on the other.
 */

const CONTENT = `Nicolas Lecocq

Overview
Content analytics
Audience analytics
7 days
Export

Content performance

Impressions
Cumulative

473

Impressions

96%

vs. prior 7 days

Chart
Line chart with 7 data points.
Sep 1
Sep 7
0
200
400
600
End of interactive chart.

Discovery

473

Impressions

In-network (followers and connections)

69%

Out-of-network

31%

153

Members reached

Engagement

31

Social engagements

Reactions

22

Comments

8

Reposts

0

Saves

1

Sends on LinkedIn

0

Top performing posts

94 impressions • 8 engagements

View analytics

Feed post

OpenAI says its new model scored 99.9% on the hardest reasoning test in AI.

58 impressions • 3 engagements

View analytics

Feed post

OpenAI just built a model that finds security holes.

51 impressions • 15 engagements`;

const AUDIENCE = `Nicolas Lecocq

Overview
Content analytics
Audience analytics
7 days
Export

Follower growth

1,986

Total followers

2%

vs. prior 7 days

Cumulative
Chart
Line chart with 7 data points.
End of interactive chart.

Top demographics

All
Job title
Location
Seniority
Company
Industry
Company size

Company size

2-10 employees

28%

Seniority

Entry

28%

Industry

IT Services and IT Consulting

20%

Job title

Founder

15%

Location

Lahore

6%

Company

Fiverr

2%`;

const DASHBOARD = `Nicolas Lecocq

Overview

Track performance

469

Post impressions in 7 days

96%

vs. prior 7 days

1,986

Total followers

2%

vs. prior 7 days

343

Profile viewers in 90 days

39%

vs. prior 7 days

96

Search appearances Aug 25–31

0%

vs. Aug 18–24`;

test("the content page gives the account's own numbers", () => {
  const a = readContentAnalytics(CONTENT);
  assert.equal(a.impressions, 473);
  assert.equal(a.membersReached, 153);
  assert.equal(a.inNetworkPercent, 69);
  assert.equal(a.reactions, 22);
  assert.equal(a.comments, 8);
  assert.equal(a.reposts, 0);
  assert.equal(a.saves, 1);
});

/**
 * The chart legend also says "Impressions", above the word "Cumulative". A reader that answered on
 * the first label it saw would report nothing and look like a broken page.
 */
test("a chart legend does not shadow the tile below it", () => {
  assert.equal(valueNear(["Impressions", "Cumulative", "473", "Impressions", "96%"], /^impressions?$/i), 473);
});

/** Per post numbers for the best posts, without opening a single post. */
test("the top performing posts carry their own figures", () => {
  const a = readContentAnalytics(CONTENT);
  assert.deepEqual(a.topPosts, [
    { impressions: 94, engagements: 8 },
    { impressions: 58, engagements: 3 },
    { impressions: 51, engagements: 15 },
  ]);
});

test("the audience page gives followers and who they are", () => {
  const a = readAudienceAnalytics(AUDIENCE);
  assert.equal(a.followers, 1986);
  assert.deepEqual(a.demographics, [
    { category: "Company size", label: "2-10 employees", percent: 28 },
    { category: "Seniority", label: "Entry", percent: 28 },
    { category: "Industry", label: "IT Services and IT Consulting", percent: 20 },
    { category: "Job title", label: "Founder", percent: 15 },
    { category: "Location", label: "Lahore", percent: 6 },
    { category: "Company", label: "Fiverr", percent: 2 },
  ]);
});

/**
 * Every category name appears twice, once as a tab in the selector and once as its own result. The
 * tabs must not become six empty slices.
 */
test("the category tabs are not mistaken for results", () => {
  const a = readAudienceAnalytics(AUDIENCE);
  assert.equal(a.demographics.length, 6);
  assert.ok(!a.demographics.some((d) => d.label === "Location"));
});

test("the dashboard gives the two numbers no other page has", () => {
  const d = readDashboardStats(DASHBOARD);
  assert.equal(d.profileViewers, 343);
  assert.equal(d.searchAppearances, 96);
  assert.equal(d.impressions7d, 469);
  assert.equal(d.followers, 1986);
});

/** A page that did not load says nothing rather than zero, or a growth chart grows a cliff. */
test("an empty page answers null everywhere", () => {
  assert.equal(readContentAnalytics("").impressions, null);
  assert.equal(readAudienceAnalytics("").followers, null);
  assert.deepEqual(readAudienceAnalytics("").demographics, []);
  assert.equal(readDashboardStats("").profileViewers, null);
});

test("a percentage is never mistaken for a count", () => {
  assert.equal(valueNear(["Impressions", "96%"], /^impressions?$/i), null);
});
