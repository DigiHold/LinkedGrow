import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { setDbForTests, db } from "../db.ts";
import {
  AWAKE_HOURS,
  LEAD_MAX_MS,
  LEAD_MIN_MS,
  MAX_JITTER_MS,
  MAX_PUBLISH_ATTEMPTS,
  MIN_NATIVE_LEAD_MS,
  accountForPost,
  actionFor,
  claimPost,
  failOrRequeue,
  jitterMsFor,
  leadMsFor,
  loadDuePosts,
  markHandedToScheduler,
  markPublished,
  mediaForPost,
  releaseScheduled,
  releaseStaleClaims,
  unclaim,
  type DuePost,
} from "./store.ts";

/**
 * The publish queue against a real libsql, not a fake.
 *
 * What is worth testing here is the SQL: the claim that has to be atomic, the
 * paywall condition copied from the app's middleware, and the workspace
 * resolution through a team. A fake store would test an idea of those.
 */

const HOUR = 3600;

function seconds(offsetSeconds = 0): number {
  return Math.floor(Date.now() / 1000) + offsetSeconds;
}

async function freshDb(): Promise<void> {
  setDbForTests(createClient({ url: ":memory:" }));
  await db().batch([
    `CREATE TABLE users (
       id TEXT PRIMARY KEY, email TEXT, plan TEXT NOT NULL DEFAULT 'pro',
       has_used_trial INTEGER NOT NULL DEFAULT 0, stripe_subscription_id TEXT,
       is_lifetime_deal INTEGER NOT NULL DEFAULT 0,
       auto_like_after_publish INTEGER DEFAULT 1)`,
    `CREATE TABLE teams (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL)`,
    `CREATE TABLE team_members (id TEXT PRIMARY KEY, team_id TEXT NOT NULL, user_id TEXT NOT NULL)`,
    `CREATE TABLE posts (
       id TEXT PRIMARY KEY, user_id TEXT NOT NULL, content TEXT NOT NULL,
       status TEXT NOT NULL DEFAULT 'draft', post_type TEXT DEFAULT 'text',
       scheduled_at INTEGER, published_at INTEGER,
       linkedin_account_id TEXT, publish_attempts INTEGER NOT NULL DEFAULT 0,
       publish_claimed_at INTEGER, first_comment_posted_at INTEGER,
       linkedin_scheduled_at INTEGER,
       linkedin_post_id TEXT, linkedin_post_url TEXT, first_comment TEXT,
       metadata TEXT, error_message TEXT,
       created_at INTEGER, updated_at INTEGER)`,
    `CREATE TABLE media (
       id TEXT PRIMARY KEY, user_id TEXT NOT NULL, post_id TEXT,
       storage_key TEXT NOT NULL, storage_url TEXT NOT NULL, file_name TEXT,
       mime_type TEXT NOT NULL, sort_order INTEGER DEFAULT 0,
       status TEXT NOT NULL DEFAULT 'ready', created_at INTEGER)`,
    `CREATE TABLE linkedin_accounts (
       id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, country TEXT NOT NULL,
       profile_url TEXT, status TEXT NOT NULL DEFAULT 'active',
       created_at INTEGER NOT NULL)`,
    `CREATE TABLE agents (
       id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, linkedin_account_id TEXT,
       timezone TEXT NOT NULL DEFAULT 'Europe/Zurich')`,
  ]);
}

async function addUser(id: string, overrides: Record<string, unknown> = {}): Promise<void> {
  await db().execute({
    sql: `INSERT INTO users (id, email, plan, has_used_trial, stripe_subscription_id, is_lifetime_deal)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      `${id}@example.com`,
      String(overrides.plan ?? "pro"),
      Number(overrides.has_used_trial ?? 0),
      (overrides.stripe_subscription_id as string | null) ?? null,
      Number(overrides.is_lifetime_deal ?? 0),
    ],
  });
}

async function addPost(
  id: string,
  userId: string,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  await db().execute({
    sql: `INSERT INTO posts (id, user_id, content, status, scheduled_at, linkedin_account_id,
                             publish_attempts, publish_claimed_at, first_comment, metadata,
                             created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      userId,
      String(overrides.content ?? "A post"),
      String(overrides.status ?? "queued"),
      (overrides.scheduled_at as number | null) ?? seconds(-60),
      (overrides.linkedin_account_id as string | null) ?? null,
      Number(overrides.publish_attempts ?? 0),
      (overrides.publish_claimed_at as number | null) ?? null,
      (overrides.first_comment as string | null) ?? null,
      (overrides.metadata as string | null) ?? null,
      seconds(-HOUR),
      seconds(-HOUR),
    ],
  });
}

async function addAccount(
  id: string,
  workspaceId: string,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  await db().execute({
    sql: `INSERT INTO linkedin_accounts (id, workspace_id, country, profile_url, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      workspaceId,
      String(overrides.country ?? "FR"),
      (overrides.profile_url as string | null) ?? "https://www.linkedin.com/in/maria/",
      String(overrides.status ?? "active"),
      Number(overrides.created_at ?? seconds(-HOUR)),
    ],
  });
}

async function statusOf(postId: string): Promise<string> {
  const { rows } = await db().execute({
    sql: `SELECT status FROM posts WHERE id = ?`,
    args: [postId],
  });
  return String(rows[0]?.status ?? "");
}

function fakePost(overrides: Partial<DuePost> = {}): DuePost {
  return {
    id: "post-1",
    userId: "user-1",
    workspaceId: "user-1",
    content: "A post",
    postType: "text",
    firstComment: null,
    firstCommentPostedAt: null,
    scheduledAt: seconds(-60),
    attempts: 0,
    linkedinAccountId: null,
    metadata: null,
    wasScheduled: false,
    linkedinScheduledAt: null,
    autoLike: true,
    ...overrides,
  };
}

const ZONE = "Europe/Paris";

/** A post id whose own lead time is at least this long. Deterministic, so the test is too. */
function idWithLeadAtLeast(ms: number): string {
  for (let i = 0; i < 500; i++) {
    const id = `post-lead-${i}`;
    if (leadMsFor(id) >= ms) return id;
  }
  throw new Error("no id with a long enough lead");
}

/** A moment today at a given hour in the account's zone, as epoch milliseconds. */
function atLocalHour(hour: number): number {
  const now = new Date();
  // Walk back from a known UTC instant until its Paris hour matches. Cheaper
  // than pulling in a date library for one test helper.
  for (let offset = 0; offset < 48; offset++) {
    const candidate = new Date(now.getTime() + offset * 3600_000);
    const local = Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", hour12: false }).format(
        candidate
      )
    );
    if (local % 24 === hour) return candidate.getTime();
  }
  throw new Error(`no instant with local hour ${hour}`);
}

test("the jitter is the same every time it is asked, and inside its bound", () => {
  const first = jitterMsFor("post-abc");
  assert.equal(first, jitterMsFor("post-abc"), "the same post drew a different delay twice");
  assert.ok(first >= 0 && first <= MAX_JITTER_MS, `jitter ${first} is outside the bound`);
  // Different posts must not all land on the same offset, or the whole fleet
  // publishes in the same second anyway.
  const spread = new Set(
    Array.from({ length: 40 }, (_, i) => jitterMsFor(`post-${i}`))
  );
  assert.ok(spread.size > 30, "the jitter barely varies between posts");
});

test("somebody who pressed Publish is not made to wait", () => {
  const now = Date.now();
  const pressed = fakePost({ scheduledAt: Math.floor(now / 1000), wasScheduled: false });
  assert.equal(actionFor(pressed, ZONE, now), "publish");
  assert.equal(
    actionFor({ ...pressed, scheduledAt: Math.floor(now / 1000) + 60 }, ZONE, now),
    "wait",
    "a post queued for a moment in the future went out early"
  );
});

test("the lead time is fixed per post, inside its bounds, and spread across posts", () => {
  const lead = leadMsFor("post-abc");
  assert.equal(lead, leadMsFor("post-abc"), "the same post planned itself twice differently");
  assert.ok(lead >= LEAD_MIN_MS && lead < LEAD_MAX_MS, `lead ${lead} is outside the bounds`);
  const spread = new Set(Array.from({ length: 40 }, (_, i) => leadMsFor(`p${i}`)));
  assert.ok(spread.size > 30, "every post would be written the same number of hours ahead");
});

test("tomorrow's post is written tonight, not at its minute", () => {
  const evening = atLocalHour(20);
  // A slot far enough ahead that the lead time has certainly elapsed.
  const post = fakePost({
    id: "post-tomorrow",
    wasScheduled: true,
    scheduledAt: Math.floor((evening + leadMsFor("post-tomorrow")) / 1000),
  });
  assert.equal(actionFor(post, ZONE, evening), "prepare");

  // An hour before its lead time is reached, there is nothing to do.
  assert.equal(actionFor(post, ZONE, evening - 3600_000), "wait");
});

test("nothing is composed in the middle of the night unless the slot is close", () => {
  const night = atLocalHour(4);
  assert.ok(
    AWAKE_HOURS.start > 4,
    "this test assumes 4am is outside the window it is checking"
  );
  const distant = fakePost({
    id: "post-night",
    wasScheduled: true,
    scheduledAt: Math.floor((night + leadMsFor("post-night")) / 1000),
  });
  assert.equal(actionFor(distant, ZONE, night), "wait", "a post was composed at 4am");

  // Same hour, but the slot is three hours away: missing it is worse than the
  // odd hour, so it goes ahead. The id is chosen so its own lead time has
  // certainly elapsed by then, which is a separate rule being held constant.
  const id = idWithLeadAtLeast(3 * 3600_000);
  const soon = fakePost({
    id,
    wasScheduled: true,
    scheduledAt: Math.floor((night + 3 * 3600_000) / 1000),
  });
  assert.equal(actionFor(soon, ZONE, night), "prepare");
});

test("a post scheduled for very soon skips LinkedIn's scheduler and waits for its slot", () => {
  const now = atLocalHour(10);
  const soon = fakePost({
    id: "post-soon",
    wasScheduled: true,
    scheduledAt: Math.floor((now + MIN_NATIVE_LEAD_MS - 60_000) / 1000),
  });
  assert.equal(actionFor(soon, ZONE, now), "wait", "it was handed to the scheduler too late");

  // At its slot it goes out the direct way, once its own jitter has passed.
  const slotMs = soon.scheduledAt * 1000;
  assert.equal(actionFor(soon, ZONE, slotMs), "wait", "it published on the exact second");
  assert.equal(actionFor(soon, ZONE, slotMs + jitterMsFor(soon.id) + 1), "publish");
});

test("a post LinkedIn already holds is only looked for after its slot", () => {
  const now = Date.now();
  const handed = fakePost({
    id: "post-handed",
    wasScheduled: true,
    scheduledAt: Math.floor((now + 3600_000) / 1000),
    linkedinScheduledAt: Math.floor(now / 1000),
  });
  assert.equal(actionFor(handed, ZONE, now), "wait", "it was written into the composer twice");
  assert.equal(
    actionFor(handed, ZONE, handed.scheduledAt * 1000 + 5 * 60_000),
    "confirm"
  );
});

test("only one worker can claim a post, and the claim spends an attempt", async () => {
  await freshDb();
  await addUser("user-1");
  await addAccount("acct-1", "user-1");
  await addPost("post-1", "user-1");

  const post = fakePost();
  const [first, second] = await Promise.all([
    claimPost(post, "acct-1"),
    claimPost(post, "acct-1"),
  ]);
  assert.equal(
    [first, second].filter(Boolean).length,
    1,
    "two workers both believed they owned the same post"
  );
  assert.equal(await statusOf("post-1"), "publishing");

  const { rows } = await db().execute(`SELECT publish_attempts FROM posts WHERE id = 'post-1'`);
  assert.equal(Number(rows[0]?.publish_attempts), 1, "the claim did not count as an attempt");
});

test("a failure goes back in the queue until the attempts run out, then says so", async () => {
  await freshDb();
  await addUser("user-1");
  await addPost("post-1", "user-1", { status: "publishing" });

  const post = { id: "post-1", attempts: 1, wasScheduled: false };
  assert.equal(await failOrRequeue(post, "upload timed out"), "requeued");
  assert.equal(await statusOf("post-1"), "queued");

  assert.equal(
    await failOrRequeue({ ...post, attempts: MAX_PUBLISH_ATTEMPTS }, "upload timed out"),
    "failed"
  );
  assert.equal(await statusOf("post-1"), "failed");

  const { rows } = await db().execute(`SELECT error_message FROM posts WHERE id = 'post-1'`);
  assert.equal(String(rows[0]?.error_message), "upload timed out", "the user was told nothing");
});

/**
 * The one that would have published somebody's post a day early.
 *
 * Every failure path used to put a post back as `queued`, which for a post
 * scheduled for tomorrow means "due right now". A single failed preparation
 * would have sent it out.
 */
test("a scheduled post never comes back as queued, whatever went wrong", async () => {
  await freshDb();
  await addUser("user-1");
  await addAccount("acct-1", "user-1");
  await addPost("post-1", "user-1", {
    status: "scheduled",
    scheduled_at: seconds(12 * HOUR),
  });

  const scheduled = fakePost({ wasScheduled: true });
  assert.equal(await claimPost(scheduled, "acct-1"), true);
  assert.equal(
    await statusOf("post-1"),
    "scheduled",
    "claiming a scheduled post changed its status"
  );

  await failOrRequeue({ id: "post-1", attempts: 1, wasScheduled: true }, "the composer moved");
  assert.equal(await statusOf("post-1"), "scheduled");

  await releaseScheduled("post-1", null);
  assert.equal(await statusOf("post-1"), "scheduled");

  const { rows } = await db().execute(
    `SELECT publish_claimed_at, publish_attempts FROM posts WHERE id = 'post-1'`
  );
  assert.equal(rows[0]?.publish_claimed_at, null, "the lock was left on");
  assert.equal(Number(rows[0]?.publish_attempts), 0, "a fallback cost the post an attempt");
});

test("handing a post to LinkedIn's scheduler records it and leaves it scheduled", async () => {
  await freshDb();
  await addUser("user-1");
  await addPost("post-1", "user-1", { status: "scheduled", scheduled_at: seconds(6 * HOUR) });

  await markHandedToScheduler("post-1");
  const { rows } = await db().execute(
    `SELECT status, linkedin_scheduled_at, publish_attempts FROM posts WHERE id = 'post-1'`
  );
  assert.equal(String(rows[0]?.status), "scheduled");
  assert.ok(Number(rows[0]?.linkedin_scheduled_at) > 0, "the handover was not recorded");
  assert.equal(Number(rows[0]?.publish_attempts), 0, "confirming starts without a budget");

  // And the next pass must not write it into the composer again.
  const [loaded] = await loadDuePosts();
  assert.ok(loaded);
  assert.equal(actionFor(loaded, ZONE, Date.now()), "wait");
});

test("a reason that is not the post's fault costs it no attempt", async () => {
  await freshDb();
  await addUser("user-1");
  await addAccount("acct-1", "user-1");
  await addPost("post-1", "user-1");

  await claimPost(fakePost(), "acct-1");
  await unclaim("post-1", "signed out");

  const { rows } = await db().execute(
    `SELECT status, publish_attempts, error_message FROM posts WHERE id = 'post-1'`
  );
  assert.equal(String(rows[0]?.status), "queued");
  assert.equal(
    Number(rows[0]?.publish_attempts),
    0,
    "a signed-out account spent one of the post's three attempts"
  );
  assert.equal(String(rows[0]?.error_message), "signed out");
});

test("unclaiming a post nobody claimed changes nothing", async () => {
  await freshDb();
  await addUser("user-1");
  await addPost("post-1", "user-1", { status: "queued", publish_attempts: 2 });

  await unclaim("post-1", "signed out");
  const { rows } = await db().execute(
    `SELECT publish_attempts, error_message FROM posts WHERE id = 'post-1'`
  );
  assert.equal(Number(rows[0]?.publish_attempts), 2, "attempts were given back twice");
  assert.equal(rows[0]?.error_message, null);
});

test("a post left claimed by a dead worker is freed, a fresh claim is left alone", async () => {
  await freshDb();
  await addUser("user-1");
  await addPost("post-dead", "user-1", {
    status: "publishing",
    publish_claimed_at: seconds(-3 * HOUR),
  });
  await addPost("post-live", "user-1", {
    status: "publishing",
    publish_claimed_at: seconds(-30),
  });
  // A scheduled one keeps its status and only loses the lock.
  await addPost("post-sched", "user-1", {
    status: "scheduled",
    scheduled_at: seconds(6 * HOUR),
    publish_claimed_at: seconds(-3 * HOUR),
  });

  const freed = await releaseStaleClaims();
  assert.equal(freed, 2, "the wrong number of posts was freed");
  assert.equal(await statusOf("post-dead"), "queued");
  assert.equal(await statusOf("post-live"), "publishing", "a running publish was interrupted");
  assert.equal(
    await statusOf("post-sched"),
    "scheduled",
    "a stuck scheduled post was turned into one due now"
  );
  const { rows } = await db().execute(
    `SELECT publish_claimed_at FROM posts WHERE id = 'post-sched'`
  );
  assert.equal(rows[0]?.publish_claimed_at, null, "the scheduled post kept its stale lock");
});

test("a post from an expired trial is never published", async () => {
  await freshDb();
  await addUser("paying");
  await addUser("expired", { plan: "free", has_used_trial: 1 });
  await addUser("subscriber", {
    plan: "free",
    has_used_trial: 1,
    stripe_subscription_id: "sub_123",
  });
  await addUser("lifetime", { plan: "free", has_used_trial: 1, is_lifetime_deal: 1 });
  await addPost("post-paying", "paying");
  await addPost("post-expired", "expired");
  await addPost("post-subscriber", "subscriber");
  await addPost("post-lifetime", "lifetime");

  const due = (await loadDuePosts()).map((p) => p.id).sort();
  assert.deepEqual(
    due,
    ["post-lifetime", "post-paying", "post-subscriber"],
    "the paywall let the wrong set of posts through"
  );
});

test("the horizon reaches forward far enough to prepare, and no further", async () => {
  await freshDb();
  await addUser("user-1");
  // Inside the preparation window, so it must be visible even though its slot
  // is hours away. What happens to it is actionFor's decision, not this one's.
  await addPost("post-soon", "user-1", { status: "scheduled", scheduled_at: seconds(HOUR) });
  // Beyond every possible lead time, so there is nothing to do about it yet.
  await addPost("post-far", "user-1", { status: "scheduled", scheduled_at: seconds(40 * HOUR) });
  // Abandoned months ago; loading it would publish a stale post at cutover.
  await addPost("post-old", "user-1", { status: "scheduled", scheduled_at: seconds(-40 * 24 * HOUR) });

  const ids = (await loadDuePosts()).map((p) => p.id);
  assert.deepEqual(ids, ["post-soon"]);
});

test("a team member's post belongs to the owner's workspace", async () => {
  await freshDb();
  await addUser("owner");
  await addUser("member");
  await db().execute(`INSERT INTO teams (id, owner_id) VALUES ('team-1', 'owner')`);
  await db().execute(
    `INSERT INTO team_members (id, team_id, user_id) VALUES ('tm-1', 'team-1', 'member')`
  );
  await addPost("post-1", "member");

  const [post] = await loadDuePosts();
  assert.ok(post, "the member's post was not due");
  assert.equal(post.workspaceId, "owner", "the post was scoped to the member, not the workspace");
});

test("the account is the one chosen at publish time, and a disconnected one is skipped", async () => {
  await freshDb();
  await addUser("user-1");
  await addAccount("acct-old", "user-1", { created_at: seconds(-10 * HOUR) });
  await addAccount("acct-new", "user-1", { created_at: seconds(-HOUR) });
  await addAccount("acct-gone", "user-1", { status: "disconnected" });

  // Nothing chosen: the oldest connected account, so the answer is stable.
  const fallback = await accountForPost(fakePost());
  assert.equal(fallback?.id, "acct-old");
  assert.equal(fallback?.timezone, "Europe/Paris", "a French account did not get a French clock");

  // Chosen in the dashboard: honoured.
  const chosen = await accountForPost(fakePost({ linkedinAccountId: "acct-new" }));
  assert.equal(chosen?.id, "acct-new");

  // Chosen but since disconnected: falls back rather than failing, because the
  // customer's intent was to publish, not to publish from that one row.
  const stale = await accountForPost(fakePost({ linkedinAccountId: "acct-gone" }));
  assert.equal(stale?.id, "acct-old");
});

test("a workspace with nothing connected has no account to publish through", async () => {
  await freshDb();
  await addUser("user-1");
  assert.equal(await accountForPost(fakePost()), null);
});

test("an agent's own timezone wins over the one guessed from the country", async () => {
  await freshDb();
  await addUser("user-1");
  await addAccount("acct-1", "user-1", { country: "FR" });
  await db().execute(
    `INSERT INTO agents (id, workspace_id, linkedin_account_id, timezone)
     VALUES ('agent-1', 'user-1', 'acct-1', 'America/New_York')`
  );
  const account = await accountForPost(fakePost());
  assert.equal(account?.timezone, "America/New_York");
});

test("the attachment comes from the media table, and a video from the post's metadata", async () => {
  await freshDb();
  await addUser("user-1");
  await addPost("post-image", "user-1");
  await db().execute(
    `INSERT INTO media (id, user_id, post_id, storage_key, storage_url, file_name, mime_type, status)
     VALUES ('m1', 'user-1', 'post-image', 'k', 'https://cdn.test/a.png', 'a.png', 'image/png', 'ready')`
  );

  const image = await mediaForPost(fakePost({ id: "post-image" }));
  assert.equal(image?.url, "https://cdn.test/a.png");
  assert.equal(image?.mimeType, "image/png");

  const video = await mediaForPost(
    fakePost({
      id: "post-video",
      metadata: JSON.stringify({ video: { url: "https://cdn.test/v.mp4", mimeType: "video/mp4" } }),
    })
  );
  assert.equal(video?.url, "https://cdn.test/v.mp4");

  assert.equal(await mediaForPost(fakePost({ id: "post-text" })), null);
});

test("a post we could not find afterwards is published with the doubt written down", async () => {
  await freshDb();
  await addUser("user-1");
  await addPost("post-1", "user-1", { status: "publishing" });

  await markPublished("post-1", null, "could not confirm");
  const { rows } = await db().execute(
    `SELECT status, error_message, linkedin_post_url FROM posts WHERE id = 'post-1'`
  );
  assert.equal(String(rows[0]?.status), "published");
  assert.equal(String(rows[0]?.error_message), "could not confirm");

  // And a confirmed one carries no doubt.
  await markPublished("post-1", "https://www.linkedin.com/feed/update/urn:li:activity:1/");
  const after = await db().execute(`SELECT error_message FROM posts WHERE id = 'post-1'`);
  assert.equal(after.rows[0]?.error_message, null);
});
