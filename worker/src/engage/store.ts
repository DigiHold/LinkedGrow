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
  status: DraftStatus;
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
    status: String(r.status) as DraftStatus,
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
  draft: Omit<CommentDraft, "id" | "status" | "createdAt">
): Promise<string | null> {
  const id = randomUUID();
  const result = await db().execute({
    sql: `INSERT INTO comment_drafts
            (id, agent_id, linkedin_account_id, activity_id, post_url, post_author,
             post_excerpt, comment, status, minutes_old_at_draft, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
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
