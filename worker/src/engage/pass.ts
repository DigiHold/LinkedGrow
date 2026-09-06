import { db } from "../db.ts";
import { log, logError } from "../logger.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";
import { dwell, scrollHuman, sleep, randInt } from "../browser/human.ts";
import { takeSlot, NoSlotError } from "../safety/slots.ts";
import { currentVisit } from "../safety/rhythm.ts";
import type { AgentContext } from "../config.ts";
import { freshPosts } from "./urn.ts";
import { readPost } from "./read.ts";
import { readLanguage } from "./language.ts";
import { draftComment } from "./draft.ts";
import { inventsNothing } from "./verify.ts";
import { engagePost } from "./act.ts";
import {
  saveDraft,
  seenActivityIds,
  approvedDrafts,
  pendingDrafts,
  markPosted,
  markFailed,
  expireStaleDrafts,
} from "./store.ts";
import { notifyPending } from "./notify.ts";

/**
 * The commenting pass: publish what a person approved, then write a few more for them to answer.
 *
 * Approved comments go out FIRST, before anything new is written. They are the only thing here with
 * a deadline that has already started: somebody said yes to a comment on a post that was fresh when
 * they said it, and every minute spent drafting something else is a minute that answer goes stale.
 *
 * Only agents carrying comment_enabled ever reach this file, and the query below is where that is
 * decided. An agent without the flag is not turned away later, it is never loaded, so no path
 * through this code exists for it at all.
 */

/** How many posts one pass will read and draft for. Small on purpose while the feature is new. */
const DRAFTS_PER_PASS = 3;

/** A post older than this is not worth a comment, whatever it says. */
const MAX_POST_AGE_MINUTES = 45;

/** Nothing is written to LinkedIn faster than a person writes it. */
async function humanGap(): Promise<void> {
  await sleep(randInt(40_000, 120_000));
}

interface Enabled {
  ctx: AgentContext;
  facts: string;
  timezone: string;
  businessDays: number[];
  startMin: number;
  endMin: number;
  lastRunAt: Date | null;
  allocation: {
    server: string;
    username: string;
    password: string;
    expectedIp: string;
  } | null;
}

/** Every agent allowed to comment, with the address it is pinned to. */
async function enabledAgents(): Promise<Enabled[]> {
  const { rows } = await db().execute({
    sql: `SELECT a.id AS agent_id, a.comment_facts, a.last_run_at,
                 a.timezone, a.workday_start, a.workday_end, a.workday_days,
                 l.id AS account_id, l.workspace_id, l.country, l.profile_url,
                 p.host, p.port, p.username_encrypted, p.password_encrypted, p.last_exit_ip
            FROM agents a
            JOIN linkedin_accounts l ON l.id = a.linkedin_account_id
            LEFT JOIN proxy_allocations p
              ON p.linkedin_account_id = l.id AND p.status = 'active'
           WHERE a.comment_enabled = 1 AND a.status = 'active'`,
    args: [],
  });

  return rows.map((r) => {
    /**
     * The customer's own days, stored as a JSON array where Sunday is 0 and the rest of this
     * codebase counts it as 7. Read the same way db.ts reads it, or an agent set to work Sunday
     * would be silent on the one day it was told to run.
     */
    let days: number[] = [];
    try {
      const raw = JSON.parse(String(r.workday_days ?? "[]")) as unknown;
      if (Array.isArray(raw)) {
        days = [...new Set(raw
          .filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 7)
          .map((n) => (n === 0 ? 7 : n)))].sort();
      }
    } catch {
      /* an unreadable value falls back to the working week below */
    }
    return {
      facts: r.comment_facts ? String(r.comment_facts) : "",
      timezone: String(r.timezone ?? "Europe/Paris"),
      businessDays: days.length ? days : [1, 2, 3, 4, 5, 6],
      startMin: Number(r.workday_start ?? 540),
      endMin: Number(r.workday_end ?? 1080),
      lastRunAt: r.last_run_at ? new Date(Number(r.last_run_at) * 1000) : null,
      allocation: r.host
        ? {
            server: `http://${String(r.host)}:${Number(r.port)}`,
            username: decryptSecret(String(r.username_encrypted ?? "")) ?? "",
            password: decryptSecret(String(r.password_encrypted ?? "")) ?? "",
            expectedIp: String(r.last_exit_ip ?? ""),
          }
        : null,
      ctx: {
        agentId: String(r.agent_id),
        workspaceId: String(r.workspace_id),
        linkedinAccountId: String(r.account_id),
        ownProfileUrl: String(r.profile_url ?? ""),
        country: String(r.country ?? "FR"),
        tier: "free",
        agentsOnAccount: 1,
      } as AgentContext,
    };
  });
}

/** Every post identifier the notifications page is currently showing. */
async function notificationPosts(page: import("patchright").Page): Promise<string[]> {
  await page
    .goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded" })
    .catch(() => {});
  await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
  await dwell(2500, 4500);
  await scrollHuman(page, 2);
  await dwell(1500, 3000);

  return page
    .evaluate(() => {
      const hits = new Set<string>();
      for (const el of Array.from(document.querySelectorAll("*"))) {
        for (const attr of Array.from(el.attributes)) {
          let text = attr.value;
          try {
            text = decodeURIComponent(attr.value);
          } catch {
            /* a malformed escape still matches the plain form */
          }
          if (/\/analytics\//.test(text)) continue;
          for (const hit of text.match(/urn:li:activity:\d{6,25}/g) ?? []) hits.add(hit);
        }
      }
      return [...hits];
    })
    .catch(() => []);
}

async function runOne(agent: Enabled): Promise<void> {
  const visit = currentVisit(agent.ctx.linkedinAccountId, agent.timezone, {
    firstRun: agent.lastRunAt === null,
    lastRunAt: agent.lastRunAt,
    window: {
      days: agent.businessDays,
      startMin: agent.startMin,
      endMin: agent.endMin,
    },
  });
  if (!visit) return;

  if (!agent.allocation) {
    log("comments: no dedicated address on this account, skipping", {
      linkedinAccountId: agent.ctx.linkedinAccountId,
    });
    return;
  }

  const approved = await approvedDrafts(agent.ctx.linkedinAccountId);
  const seen = await seenActivityIds(agent.ctx.linkedinAccountId);

  let lease;
  try {
    lease = takeSlot(agent.ctx.linkedinAccountId);
  } catch (error) {
    if (error instanceof NoSlotError) return;
    throw error;
  }

  const session = await openSession(
    {
      linkedinAccountId: agent.ctx.linkedinAccountId,
      country: agent.ctx.country,
      timezone: agent.timezone,
    },
    agent.allocation
  );

  try {
    if (!(await isSignedIn(session.context))) {
      log("comments: that account is signed out, leaving it to the agent pass");
      return;
    }
    const page = session.page;

    /**
     * What a person already said yes to, first and without exception.
     *
     * Their answer was given on a post that was fresh at the time. Drafting something new before
     * publishing it would spend the minutes that answer still has.
     */
    for (const draft of approved) {
      try {
        const result = await engagePost(page, draft.postUrl, draft.comment);
        if (result.commented) {
          await markPosted(draft.id);
          log("comments: posted an approved comment", { id: draft.id, liked: result.liked });
        } else {
          await markFailed(draft.id, "the comment box did not take it");
        }
      } catch (error) {
        await markFailed(draft.id, error instanceof Error ? error.message : String(error));
      }
      await humanGap();
    }

    const candidates = freshPosts(await notificationPosts(page), {
      maxAgeMinutes: MAX_POST_AGE_MINUTES,
      seen,
    });
    if (candidates.length === 0) {
      log("comments: nothing fresh enough to answer");
      return;
    }

    let written = 0;
    for (const candidate of candidates) {
      if (written >= DRAFTS_PER_PASS) break;

      await page.goto(candidate.url, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
      await dwell(2500, 5000);
      await scrollHuman(page, 1);
      await dwell(1500, 3000);

      const post = await readPost(page);
      if (!post) continue;
      if (!readLanguage(post.text).english) continue;

      const outcome = await draftComment(agent.ctx, post, { facts: agent.facts });
      if (!outcome.posted) continue;
      if (!(await inventsNothing(agent.ctx, outcome.posted, agent.facts))) continue;

      const id = await saveDraft({
        agentId: agent.ctx.agentId,
        linkedinAccountId: agent.ctx.linkedinAccountId,
        activityId: candidate.activityId,
        postUrl: candidate.url,
        postAuthor: post.author,
        postExcerpt: post.text.slice(0, 400),
        comment: outcome.posted,
        minutesOldAtDraft: candidate.minutesOld,
      });
      if (id) written += 1;
      await dwell(4000, 9000);
    }

    if (written > 0) {
      await notifyPending(agent.ctx.linkedinAccountId, await pendingDrafts(agent.ctx.linkedinAccountId));
    }
  } finally {
    await closeSession(session).catch(() => {});
    lease.release();
  }
}

export async function commentPass(): Promise<void> {
  const expired = await expireStaleDrafts();
  if (expired > 0) log("comments: dropped drafts nobody answered in time", { expired });

  const agents = await enabledAgents();
  if (agents.length === 0) return;

  for (const agent of agents) {
    try {
      await runOne(agent);
    } catch (error) {
      logError("comment pass failed", error);
    }
  }
}
