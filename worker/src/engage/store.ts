import { randomUUID } from "node:crypto";
import { db } from "../db.ts";

/**
 * The queue of comments waiting for Nicolas to say yes.
 *
 * Nothing this agent writes reaches LinkedIn without a person reading it first. That is the whole
 * shape of the feature while it is new: the worker drafts, a human approves or rewrites, and only
 * then does anything go up. Full automatic comes later, once the drafts have earned it.
 *
 * Two rules are carried by the table rather than by the code around it. A post can hold exactly one
 * draft per account, enforced by a unique index, because commenting twice under one post is the
 * most recognisable thing an automated account does. And a draft that nobody answered expires,
 * because a comment under a post that went up two hours ago is read by nobody and is not worth the
 * account's budget.
 */

/** How long a draft waits for an answer before it is dropped. */
export const DRAFT_TTL_MINUTES = 30;

export type DraftStatus = "pending" | "approved" | "rejected" | "posted" | "expired" | "failed";

export interface CommentDraft {
  id: string;
  agentId: string;
  linkedinAccountId: string;
  activityId: string;
  postUrl: string;
  postAuthor: string;
  /** Stable key for analytics: people rename themselves, their slug does not. */
  postAuthorUrl: string;
  postExcerpt: string;
  comment: string;
  /** What the model wrote, kept even after a person rewrites it. The pair is the lesson. */
  originalComment: string;
  status: DraftStatus;
  /** What the fact check thought. It advises, it does not block. */
  verifyOk: boolean;
  verifyNote: string;
  minutesOldAtDraft: number;
  createdAt: number;
}

function row(r: Record<string, unknown>): CommentDraft {
  return {
    id: String(r.id),
    agentId: String(r.agent_id),
    linkedinAccountId: String(r.linkedin_account_id),
    activityId: String(r.activity_id),
    postUrl: String(r.post_url),
    postAuthor: String(r.post_author ?? ""),
    postAuthorUrl: String(r.post_author_url ?? ""),
    postExcerpt: String(r.post_excerpt ?? ""),
    comment: String(r.comment),
    originalComment: String(r.original_comment ?? r.comment),
    status: String(r.status) as DraftStatus,
    verifyOk: Number(r.verify_ok ?? 1) === 1,
    verifyNote: String(r.verify_note ?? ""),
    minutesOldAtDraft: Number(r.minutes_old_at_draft ?? 0),
    createdAt: Number(r.created_at ?? 0),
  };
}

/**
 * Records a draft, or does nothing if this post already has one on this account.
 *
 * The insert is the deduplication. Checking first and inserting after leaves a window where two
 * passes both check, both find nothing, and both insert; the unique index closes it, and the
 * conflict is an ordinary outcome rather than an error.
 */
export async function saveDraft(
  draft: Omit<CommentDraft, "id" | "status" | "createdAt" | "originalComment">
): Promise<string | null> {
  const id = randomUUID();
  const result = await db().execute({
    sql: `INSERT INTO comment_drafts
            (id, agent_id, linkedin_account_id, activity_id, post_url, post_author,
             post_author_url, post_excerpt, comment, original_comment, verify_ok, verify_note,
             status, minutes_old_at_draft, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
          ON CONFLICT (linkedin_account_id, activity_id) DO NOTHING`,
    args: [
      id,
      draft.agentId,
      draft.linkedinAccountId,
      draft.activityId,
      draft.postUrl,
      draft.postAuthor.slice(0, 200),
      draft.postAuthorUrl.slice(0, 300),
      draft.postExcerpt.slice(0, 1000),
      draft.comment,
      draft.comment,
      draft.verifyOk ? 1 : 0,
      draft.verifyNote,
      draft.minutesOldAtDraft,
      Math.floor(Date.now() / 1000),
    ],
  });
  return result.rowsAffected > 0 ? id : null;
}

/** Posts this account has already been offered, so a pass never drafts one of them again. */
export async function seenActivityIds(linkedinAccountId: string): Promise<Set<string>> {
  const { rows } = await db().execute({
    sql: `SELECT activity_id FROM comment_drafts WHERE linkedin_account_id = ?`,
    args: [linkedinAccountId],
  });
  return new Set(rows.map((r) => String(r.activity_id)));
}

/** Drafts a person said yes to, oldest first, so the queue drains in the order it filled. */
export async function approvedDrafts(linkedinAccountId: string, limit = 5): Promise<CommentDraft[]> {
  const { rows } = await db().execute({
    sql: `SELECT * FROM comment_drafts
           WHERE linkedin_account_id = ? AND status = 'approved'
           ORDER BY created_at LIMIT ?`,
    args: [linkedinAccountId, limit],
  });
  return rows.map((r) => row(r as Record<string, unknown>));
}

/** Drafts written but not yet answered, for the email and for the page. */
export async function pendingDrafts(linkedinAccountId: string): Promise<CommentDraft[]> {
  const { rows } = await db().execute({
    sql: `SELECT * FROM comment_drafts
           WHERE linkedin_account_id = ? AND status = 'pending'
           ORDER BY created_at`,
    args: [linkedinAccountId],
  });
  return rows.map((r) => row(r as Record<string, unknown>));
}

export async function markPosted(id: string, weLiked: boolean): Promise<void> {
  await db().execute({
    sql: `UPDATE comment_drafts SET status = 'posted', posted_at = ?, we_liked = ? WHERE id = ?`,
    args: [Math.floor(Date.now() / 1000), weLiked ? 1 : 0, id],
  });
}

export async function markFailed(id: string, error: string): Promise<void> {
  await db().execute({
    sql: `UPDATE comment_drafts SET status = 'failed', error = ? WHERE id = ?`,
    args: [error.slice(0, 500), id],
  });
}

/**
 * Drops the drafts nobody answered in time.
 *
 * Only pending ones. An approved draft waiting for the next visit is not late, it is queued, and
 * expiring it would throw away the one thing a person actually said yes to.
 */
export async function expireStaleDrafts(): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - DRAFT_TTL_MINUTES * 60;
  const result = await db().execute({
    sql: `UPDATE comment_drafts SET status = 'expired'
           WHERE status = 'pending' AND created_at < ?`,
    args: [cutoff],
  });
  return result.rowsAffected;
}

/**
 * What a person did with the last few comments, so the next ones are written from it.
 *
 * The rewrites matter more than the approvals. An approval says the comment was acceptable; a
 * rewrite says exactly what was wrong with it and exactly what right looks like, in the same
 * context, in the person's own words. That pair is the only correction signal this feature has, and
 * it is the road to running without a person at all.
 *
 * Rejections are deliberately not here. "No" without a rewrite says the post was wrong, or the
 * angle was, or the day was, and a model given a wrong answer with no reason learns superstition.
 */
export interface Lesson {
  /** What the model wrote. */
  written: string;
  /** What went up, when a person changed it. Empty when they approved it as written. */
  rewritten: string;
}

export async function recentLessons(linkedinAccountId: string, limit = 12): Promise<Lesson[]> {
  const { rows } = await db().execute({
    sql: `SELECT comment, original_comment FROM comment_drafts
           WHERE linkedin_account_id = ? AND status IN ('approved', 'posted')
           ORDER BY decided_at DESC LIMIT ?`,
    args: [linkedinAccountId, limit],
  });
  return rows.map((r) => {
    const written = String(r.original_comment ?? r.comment);
    const final = String(r.comment);
    return { written, rewritten: final === written ? "" : final };
  });
}

/**
 * What the commenting is actually producing, grouped by the person whose posts were answered.
 *
 * This is the question the feature has to answer once it is somebody's product rather than an
 * experiment: not "how many comments", but "which of these people is worth my minutes". A creator
 * whose posts earn twenty likes on a comment is worth ten of a creator whose posts earn none,
 * whatever their follower count says, and only this table knows which is which.
 *
 * Grouped by the profile address rather than the display name. People rename themselves.
 */
export interface CreatorPerformance {
  authorUrl: string;
  authorName: string;
  posted: number;
  likes: number;
  replies: number;
  /** How fresh the posts were when the agent answered them, which is what earns the top slot. */
  medianMinutesOld: number;
}

export async function creatorPerformance(
  linkedinAccountId: string,
  sinceDays = 90
): Promise<CreatorPerformance[]> {
  const since = Math.floor(Date.now() / 1000) - sinceDays * 86_400;
  const { rows } = await db().execute({
    sql: `SELECT COALESCE(NULLIF(post_author_url, ''), post_author) AS key,
                 MAX(post_author) AS name,
                 COUNT(*) AS posted,
                 COALESCE(SUM(comment_likes), 0) AS likes,
                 COALESCE(SUM(comment_replies), 0) AS replies,
                 CAST(AVG(minutes_old_at_draft) AS INTEGER) AS avg_age
            FROM comment_drafts
           WHERE linkedin_account_id = ? AND status = 'posted' AND posted_at >= ?
           GROUP BY key
           ORDER BY likes DESC, posted DESC`,
    args: [linkedinAccountId, since],
  });
  return rows.map((r) => ({
    authorUrl: String(r.key ?? ""),
    authorName: String(r.name ?? ""),
    posted: Number(r.posted ?? 0),
    likes: Number(r.likes ?? 0),
    replies: Number(r.replies ?? 0),
    medianMinutesOld: Number(r.avg_age ?? 0),
  }));
}

/** The headline numbers, for the analytics page and for anything reading over MCP. */
export async function commentTotals(
  linkedinAccountId: string,
  sinceDays = 30
): Promise<{ posted: number; likes: number; replies: number; approved: number; rejected: number; expired: number }> {
  const since = Math.floor(Date.now() / 1000) - sinceDays * 86_400;
  const { rows } = await db().execute({
    sql: `SELECT
            SUM(status = 'posted') AS posted,
            SUM(status = 'approved') AS approved,
            SUM(status = 'rejected') AS rejected,
            SUM(status = 'expired') AS expired,
            COALESCE(SUM(comment_likes), 0) AS likes,
            COALESCE(SUM(comment_replies), 0) AS replies
          FROM comment_drafts
          WHERE linkedin_account_id = ? AND created_at >= ?`,
    args: [linkedinAccountId, since],
  });
  const r = (rows[0] ?? {}) as Record<string, unknown>;
  return {
    posted: Number(r.posted ?? 0),
    approved: Number(r.approved ?? 0),
    rejected: Number(r.rejected ?? 0),
    expired: Number(r.expired ?? 0),
    likes: Number(r.likes ?? 0),
    replies: Number(r.replies ?? 0),
  };
}

/**
 * Drops the half of a row that stops being useful the moment a decision is made.
 *
 * The post excerpt is 400 of a row's 864 bytes and it exists so somebody can decide without opening
 * a tab. Once they have decided it is dead weight, and at a thousand accounts it would be two
 * gigabytes a year of text nobody ever reads again. Everything the analytics need survives: who was
 * answered, what was written, when, and what it earned.
 */
export async function trimDecidedRows(olderThanDays = 7): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - olderThanDays * 86_400;
  const result = await db().execute({
    sql: `UPDATE comment_drafts
             SET post_excerpt = NULL, verify_note = NULL
           WHERE created_at < ? AND post_excerpt IS NOT NULL AND status != 'pending'`,
    args: [cutoff],
  });
  return result.rowsAffected;
}
