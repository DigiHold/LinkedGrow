import { db } from "../db.ts";
import { log } from "../logger.ts";
import { EDITION } from "../edition.ts";
import { optionalEnv } from "../config.ts";
import { DRAFT_TTL_MINUTES, type CommentDraft } from "./store.ts";

/**
 * Telling the one person who has to answer that something is waiting.
 *
 * A draft expires after half an hour, so a notification that arrives late is the same as no
 * notification at all. One email per pass rather than one per draft: three separate mails about
 * three comments is how a person starts ignoring the mail.
 *
 * Cloud only, and guarded rather than assumed. A self hosted instance has no Brevo account and no
 * business having one, so on that edition this is silently nothing and the page is the only place
 * drafts appear.
 */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

/** Who owns this account, which is who has to answer. */
async function ownerEmail(linkedinAccountId: string): Promise<{ email: string; name: string } | null> {
  const { rows } = await db().execute({
    sql: `SELECT u.email, u.name FROM linkedin_accounts l
            JOIN users u ON u.id = l.workspace_id
           WHERE l.id = ? LIMIT 1`,
    args: [linkedinAccountId],
  });
  const row = rows[0];
  if (!row?.email) return null;
  return { email: String(row.email), name: String(row.name ?? "") };
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The body, built so the decision can be made without opening anything.
 *
 * Every comment is in the mail in full. The link is there to approve, rewrite or refuse, not to
 * find out what the agent wrote: somebody reading this on a phone should be able to decide before
 * deciding whether to open a browser at all.
 */
export function buildEmail(drafts: readonly CommentDraft[], appUrl: string): { subject: string; html: string } {
  const n = drafts.length;
  const subject =
    n === 1
      ? "1 LinkedIn comment is waiting for you"
      : `${n} LinkedIn comments are waiting for you`;

  const blocks = drafts
    .map(
      (d) => `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 12px">
        <div style="color:#64748b;font-size:13px;margin:0 0 6px">
          Under a post by <strong>${escape(d.postAuthor)}</strong>, published ${d.minutesOldAtDraft} minutes before it was written
        </div>
        <div style="font-size:16px;line-height:1.5;margin:0 0 10px">${escape(d.comment)}</div>
        ${
          d.verifyOk
            ? ""
            : `<div style="background:#fef3c7;color:#92400e;border-radius:6px;padding:8px 10px;font-size:13px;margin:0 0 10px">
                 ${escape(d.verifyNote)} Read it before you approve it.
               </div>`
        }
        <a href="${escape(d.postUrl)}" style="color:#0f766e;font-size:13px">See the post</a>
      </div>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <p style="font-size:15px">Your agent wrote ${n === 1 ? "a comment" : `${n} comments`} and is waiting before posting ${n === 1 ? "it" : "them"}.</p>
      ${blocks}
      <p style="font-size:15px">
        <a href="${escape(appUrl)}/dashboard/comments" style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">
          Approve, rewrite or refuse
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">
        Anything you do not answer within ${DRAFT_TTL_MINUTES} minutes is dropped. A comment under a post
        that went up hours ago is read by nobody, so a late one is worse than none.
      </p>
    </div>`;

  return { subject, html };
}

/** Sends the email, and never lets a mail failure stop the agent. */
export async function notifyPending(
  linkedinAccountId: string,
  drafts: readonly CommentDraft[]
): Promise<boolean> {
  if (EDITION !== "cloud" || drafts.length === 0) return false;
  const apiKey = optionalEnv("BREVO_API_KEY");
  if (!apiKey) {
    log("comment drafts: no Brevo key, so nobody was told", { count: drafts.length });
    return false;
  }
  const owner = await ownerEmail(linkedinAccountId);
  if (!owner) return false;

  const appUrl = optionalEnv("NEXT_PUBLIC_APP_URL") ?? "https://linkedgrow.ai";
  const { subject, html } = buildEmail(drafts, appUrl);

  try {
    const response = await fetch(BREVO_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: { name: "LinkedGrow", email: "contact@linkedgrow.ai" },
        to: [{ email: owner.email, name: owner.name || undefined }],
        subject,
        htmlContent: html,
      }),
    });
    if (!response.ok) {
      log("comment drafts: the email was refused", { status: response.status });
      return false;
    }
    log("comment drafts: told the owner", { count: drafts.length });
    return true;
  } catch (error) {
    log("comment drafts: the email failed", { error: String(error) });
    return false;
  }
}
