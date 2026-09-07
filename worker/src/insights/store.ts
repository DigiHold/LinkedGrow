import { db } from "../db.ts";
import type { PostStats } from "../linkedin/insights.ts";

/**
 * Where a post's numbers are kept, and how often they are worth re-reading.
 *
 * One row per post, updated in place. The table has a `date` column that looks
 * like the start of a time series, and it is not used as one: the analytics
 * route joins post_analytics to posts and sums, so a second row for the same
 * post would double every number on the page. `date` is the last refresh.
 */

export interface StalePost {
  postId: string;
  workspaceId: string;
  url: string;
  publishedAt: number;
  linkedinAccountId: string | null;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

const HOUR = 3600;

/**
 * How long a post's numbers stay fresh, by how old the post is.
 *
 * Almost all of a LinkedIn post's reach happens in the first two days, so that
 * is where the frequent reads go. After a month the numbers barely move and
 * reading them is a session opened for nothing.
 */
export function refreshIntervalFor(ageSeconds: number): number | null {
  if (ageSeconds < 48 * HOUR) return 3 * HOUR;
  if (ageSeconds < 7 * 24 * HOUR) return 12 * HOUR;
  if (ageSeconds < 30 * 24 * HOUR) return 24 * HOUR;
  return null;
}

/** True when this post is worth opening again. */
export function isStale(
  publishedAt: number,
  lastReadAt: number | null,
  at: number = nowSeconds()
): boolean {
  const interval = refreshIntervalFor(at - publishedAt);
  if (interval === null) return false;
  if (lastReadAt === null) return true;
  return at - lastReadAt >= interval;
}

/**
 * Published posts whose numbers are worth re-reading.
 *
 * Bounded to the last thirty days in SQL so the read stays small however many
 * posts a workspace has, and the per-post decision is left to `isStale`, which
 * is a pure function and therefore testable.
 */
export async function loadPostsNeedingStats(limit = 40): Promise<StalePost[]> {
  const since = nowSeconds() - 30 * 24 * HOUR;
  const { rows } = await db().execute({
    sql: `SELECT
            p.id                  AS post_id,
            p.linkedin_post_url   AS url,
            p.published_at        AS published_at,
            p.linkedin_account_id AS linkedin_account_id,
            a.date                AS last_read_at,
            COALESCE(
              (SELECT t.owner_id
                 FROM team_members tm
                 JOIN teams t ON t.id = tm.team_id
                WHERE tm.user_id = p.user_id
                LIMIT 1),
              p.user_id
            )                     AS workspace_id
          FROM posts p
          LEFT JOIN post_analytics a ON a.post_id = p.id
         WHERE p.status = 'published'
           AND p.linkedin_post_url IS NOT NULL
           AND p.published_at IS NOT NULL
           AND p.published_at >= ?
         ORDER BY p.published_at DESC
         LIMIT ?`,
    args: [since, limit],
  });

  const out: StalePost[] = [];
  for (const row of rows) {
    const publishedAt = Number(row.published_at);
    const lastReadAt = row.last_read_at === null ? null : Number(row.last_read_at);
    if (!isStale(publishedAt, lastReadAt)) continue;
    out.push({
      postId: String(row.post_id),
      workspaceId: String(row.workspace_id),
      url: String(row.url),
      publishedAt,
      linkedinAccountId:
        row.linkedin_account_id === null ? null : String(row.linkedin_account_id),
    });
  }
  return out;
}

/** Days since the epoch, which is the granularity the follower history keeps. */
export function dayNumber(at: number = nowSeconds()): number {
  return Math.floor(at / 86400);
}

/** True when today's follower reading for this account has not been taken yet. */
export async function needsFollowerReading(linkedinAccountId: string): Promise<boolean> {
  const { rows } = await db().execute({
    sql: `SELECT 1 FROM account_followers WHERE linkedin_account_id = ? AND day = ? LIMIT 1`,
    args: [linkedinAccountId, dayNumber()],
  });
  return rows.length === 0;
}

/**
 * Records today's follower count, once.
 *
 * The unique index on (account, day) is what makes it once: a second read on
 * the same day updates rather than adding a point, so the growth chart has one
 * value per day whatever the worker does.
 */
export async function saveFollowerCount(
  workspaceId: string,
  linkedinAccountId: string,
  count: number
): Promise<void> {
  const now = nowSeconds();
  await db().execute({
    sql: `INSERT INTO account_followers (id, workspace_id, linkedin_account_id, day, count, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(linkedin_account_id, day) DO UPDATE SET count = excluded.count`,
    args: [crypto.randomUUID(), workspaceId, linkedinAccountId, dayNumber(now), count, now],
  });
}

/**
 * Writes what was read, replacing the previous reading for that post.
 *
 * Impressions are only overwritten when a number was actually found. LinkedIn
 * shows the impression count on your own posts and not always straight away, so
 * a read that missed it must not wipe yesterday's figure.
 */
export async function saveStats(postId: string, stats: PostStats): Promise<void> {
  const now = nowSeconds();

  /**
   * The post's picture, written once and never overwritten with nothing.
   *
   * A later read that cannot find the image must not blank a thumbnail that already works, so this
   * only ever fills an empty column.
   */
  if (stats.imageUrl) {
    await db().execute({
      sql: `UPDATE posts SET linkedin_image_url = ?
             WHERE id = ? AND (linkedin_image_url IS NULL OR linkedin_image_url = '')`,
      args: [stats.imageUrl, postId],
    });
  }
  const engagements = stats.reactions + stats.comments + stats.reposts;
  const rate =
    stats.impressions && stats.impressions > 0
      ? ((engagements / stats.impressions) * 100).toFixed(1)
      : null;

  const { rows } = await db().execute({
    sql: `SELECT id, impressions FROM post_analytics WHERE post_id = ? LIMIT 1`,
    args: [postId],
  });
  const existing = rows[0];

  if (!existing) {
    await db().execute({
      sql: `INSERT INTO post_analytics
              (id, post_id, date, impressions, reactions, comments, shares, engagement_rate, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        postId,
        now,
        stats.impressions ?? 0,
        stats.reactions,
        stats.comments,
        stats.reposts,
        rate,
        now,
      ],
    });
    return;
  }

  await db().execute({
    sql: `UPDATE post_analytics
             SET date = ?, impressions = ?, reactions = ?, comments = ?, shares = ?, engagement_rate = ?
           WHERE id = ?`,
    args: [
      now,
      stats.impressions ?? Number(existing.impressions ?? 0),
      stats.reactions,
      stats.comments,
      stats.reposts,
      rate,
      String(existing.id),
    ],
  });
}

export interface LeadFace {
  leadId: string;
  profileId: string;
  remoteUrl: string;
}

/**
 * Leads whose face is still a LinkedIn URL rather than one of ours.
 *
 * The miner takes the picture off the card, which costs nothing because it is
 * already rendered there. Copying it into the bucket is the part that costs a
 * request, so it happens here, in the loop that is already slow on purpose,
 * rather than in the middle of mining.
 *
 * It matters because LinkedIn's media URLs are signed and expire. A lead found
 * today would have no face by next week, which is exactly how the leads tab
 * ends up as a list of names and grey initials.
 */
export async function loadLeadFaces(limit = 30): Promise<LeadFace[]> {
  const { rows } = await db().execute({
    sql: `SELECT id, profile_id, avatar_url
            FROM agent_leads
           WHERE avatar_url IS NOT NULL
             AND avatar_url <> ''
             AND avatar_url LIKE '%licdn%'
           ORDER BY found_at DESC
           LIMIT ?`,
    args: [limit],
  });
  return rows.map((r) => ({
    leadId: String(r.id),
    profileId: String(r.profile_id),
    remoteUrl: String(r.avatar_url),
  }));
}

export async function saveLeadFace(leadId: string, url: string): Promise<void> {
  await db().execute({
    sql: `UPDATE agent_leads SET avatar_url = ?, updated_at = ? WHERE id = ?`,
    args: [url, nowSeconds(), leadId],
  });
}

/**
 * Gives up on a face we could not copy, rather than trying for ever.
 *
 * An expired URL never becomes valid again, so leaving it in place would mean
 * every pass retrying the same dead links until the leads table fills with
 * them. Clearing it costs the lead its picture and costs the loop nothing.
 */
export async function forgetLeadFace(leadId: string): Promise<void> {
  await db().execute({
    sql: `UPDATE agent_leads SET avatar_url = NULL, updated_at = ? WHERE id = ?`,
    args: [nowSeconds(), leadId],
  });
}

/**
 * The account's own numbers, read once a day off the three pages LinkedIn gives an author.
 *
 * One row per account per day, so the page can draw a trend and nothing accumulates: a year of an
 * account is 365 small rows. Written whole rather than field by field, because the three pages are
 * read in one visit and a half written day is worse than yesterday's.
 */
export interface AccountInsights {
  impressions7d: number | null;
  membersReached: number | null;
  inNetworkPercent: number | null;
  reactions: number | null;
  comments: number | null;
  reposts: number | null;
  saves: number | null;
  followers: number | null;
  profileViewers: number | null;
  searchAppearances: number | null;
  demographics: { category: string; label: string; percent: number }[];
}

export async function saveAccountInsights(
  linkedinAccountId: string,
  stats: AccountInsights
): Promise<void> {
  const now = nowSeconds();
  const day = Math.floor(now / 86400);
  await db().execute({
    sql: `INSERT INTO account_insights
            (linkedin_account_id, day, impressions_7d, members_reached, in_network_percent,
             reactions, comments, reposts, saves, followers, profile_viewers,
             search_appearances, demographics, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (linkedin_account_id, day) DO UPDATE SET
            impressions_7d = excluded.impressions_7d,
            members_reached = excluded.members_reached,
            in_network_percent = excluded.in_network_percent,
            reactions = excluded.reactions,
            comments = excluded.comments,
            reposts = excluded.reposts,
            saves = excluded.saves,
            followers = excluded.followers,
            profile_viewers = excluded.profile_viewers,
            search_appearances = excluded.search_appearances,
            demographics = excluded.demographics,
            updated_at = excluded.updated_at`,
    args: [
      linkedinAccountId,
      day,
      stats.impressions7d,
      stats.membersReached,
      stats.inNetworkPercent,
      stats.reactions,
      stats.comments,
      stats.reposts,
      stats.saves,
      stats.followers,
      stats.profileViewers,
      stats.searchAppearances,
      stats.demographics.length ? JSON.stringify(stats.demographics) : null,
      now,
    ],
  });
}

/** True when this account's overview has already been read today. */
export async function accountInsightsReadToday(linkedinAccountId: string): Promise<boolean> {
  const day = Math.floor(nowSeconds() / 86400);
  const { rows } = await db().execute({
    sql: `SELECT 1 FROM account_insights WHERE linkedin_account_id = ? AND day = ? LIMIT 1`,
    args: [linkedinAccountId, day],
  });
  return rows.length > 0;
}
