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
             post_excerpt, comment, original_comment, verify_ok, verify_note,
             status, minutes_old_at_draft, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
          ON CONFLICT (linkedin_account_id, activity_id) DO NOTHING`,
    args: [
      id,
      draft.agentId,
      draft.linkedinAccountId,
      draft.activityId,
      draft.postUrl,
      draft.postAuthor.slice(0, 200),
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

export async function markPosted(id: string): Promise<void> {
  await db().execute({
    sql: `UPDATE comment_drafts SET status = 'posted', posted_at = ? WHERE id = ?`,
    args: [Math.floor(Date.now() / 1000), id],
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
