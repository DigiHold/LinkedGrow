import type { Page } from "patchright";

/**
 * The post's own statistics, read off machine names instead of words.
 *
 * The first version of this reader matched the visible labels, which is the one thing this codebase
 * is not allowed to do: an account's interface follows the member, so "Impressions" is
 * "Impresiones" on a Spanish account and the reader silently wrote zeros. Adding languages was the
 * same mistake made wider, and Nicolas said so.
 *
 * LinkedIn does name these blocks. Its own component keys, verified on a live page 2026-09-13:
 *
 *   #impressionsBreakdown    the in and out of network split, inside the impressions block
 *   #membersReachedFeature   the members reached tile
 *   #demographicsFeature     the audience breakdown
 *
 * Those are identifiers, not text, so they read the same in every language.
 *
 * What has no name is the engagement block: its container carries a UUID that changes on every
 * render, and nothing inside it is identified at all. So reactions, comments and reposts are NOT
 * read here. They are read from the post itself, where the action bar is found by its icons, which
 * are machine names too. Guessing them off this page by position would be the label mistake again
 * wearing a different coat.
 */

export interface SummaryNumbers {
  impressions: number | null;
  membersReached: number | null;
  inNetworkPercent: number | null;
}

/**
 * Turns LinkedIn's rendering of a count into a number, in any locale.
 *
 * Thousands are a comma, a period, a space or a narrow no break space depending on the language, so
 * every separator is dropped rather than matched, and a decimal only survives behind an
 * abbreviation, where it is the only thing a dot or comma can mean.
 */
export function toNumber(raw: string): number | null {
  const text = raw.replace(/[\s  ]/g, "").toLowerCase();
  if (!text) return null;
  const suffix = /([km])$/.exec(text)?.[1];
  const digits = suffix ? text.slice(0, -1) : text;
  if (!/^[\d.,]+$/.test(digits)) return null;
  if (suffix) {
    const value = Number(digits.replace(",", "."));
    return Number.isFinite(value) ? Math.round(value * (suffix === "k" ? 1_000 : 1_000_000)) : null;
  }
  const plain = Number(digits.replace(/[.,]/g, ""));
  return Number.isFinite(plain) ? plain : null;
}

/**
 * Reads the three numbers that carry a machine name.
 *
 * Null is the answer for anything not found, never zero: a page that did not render and a post
 * nobody saw must not be recorded the same way, which is the whole reason this bug went unnoticed
 * for weeks.
 */
export async function readSummaryNumbers(page: Page): Promise<SummaryNumbers> {
  return page
    .evaluate(() => {
      /** The first descendant whose own text is a bare count. Percentages are not counts. */
      const firstCount = (root: Element | null): string | null => {
        if (!root) return null;
        for (const node of Array.from(root.querySelectorAll("*"))) {
          if (node.children.length > 0) continue;
          const text = (node.textContent ?? "").trim();
          if (!text || text.includes("%")) continue;
          if (/^[\d\s  .,]+[km]?$/i.test(text)) return text;
        }
        return null;
      };

      const breakdown = document.querySelector("#impressionsBreakdown");
      /**
       * The impressions figure is the count inside the block that HOLDS the breakdown, and the
       * breakdown itself holds only percentages. Two levels up is the tile; the walk stops as soon
       * as a count appears so a taller page cannot drag in a neighbour's number.
       */
      let impressions: string | null = null;
      let node: Element | null = breakdown?.parentElement ?? null;
      for (let i = 0; i < 4 && node && !impressions; i += 1) {
        impressions = firstCount(node);
        node = node.parentElement;
      }

      const percent = breakdown
        ? /(\d[\d.,]*)\s*%/.exec((breakdown as HTMLElement).innerText ?? "")?.[1] ?? null
        : null;

      return {
        impressions,
        membersReached: firstCount(document.querySelector("#membersReachedFeature")),
        inNetwork: percent,
        found: Boolean(breakdown || document.querySelector("#membersReachedFeature")),
      };
    })
    .then((raw) => ({
      impressions: raw.impressions === null ? null : toNumber(raw.impressions),
      membersReached: raw.membersReached === null ? null : toNumber(raw.membersReached),
      inNetworkPercent: raw.inNetwork === null ? null : Number(raw.inNetwork.replace(",", ".")),
    }))
    .catch(() => ({ impressions: null, membersReached: null, inNetworkPercent: null }));
}

/** True when LinkedIn still names these blocks the way this reader expects. */
export async function summaryAnchorsPresent(page: Page): Promise<boolean> {
  return page
    .evaluate(() => Boolean(document.querySelector("#impressionsBreakdown, #membersReachedFeature")))
    .catch(() => false);
}


export interface SocialCounts {
  reactions: number;
  comments: number;
  reposts: number;
}

/**
 * The three counts under a post, taken off the icons rather than the words beside them.
 *
 * They were briefly written as zeros, because the statistics page has no name for its engagement
 * block and guessing by position would have been the label mistake again. The post's own bar does
 * have names: LinkedIn puts an id on every icon, and the counts sit in a fixed relation to them.
 *
 * Read off a live page 2026-09-14, the bar is one row holding, in order:
 *
 *   a list of reaction icons  (svg id ending consumption-ring-small)
 *   the reaction count        (a bare number beside that list)
 *   the comment button        (holding svg#comment-small, its text is the count)
 *   the repost button         (holding svg#repost-small, same)
 *
 * The first such row in the document is the post's own. Later ones belong to comments and to the
 * cards LinkedIn suggests underneath.
 *
 * An empty button is zero. LinkedIn writes it as a zero width space rather than as nothing, which
 * is why the text is stripped of those before it is read.
 */
export async function readSocialCounts(page: Page): Promise<SocialCounts | null> {
  const raw = await page
    .evaluate(() => {
      const clean = (text: string): string => text.replace(/[\u200b\u200c\ufeff]/g, "").trim();

      const buttonFor = (iconId: string): HTMLElement | null => {
        const icon = document.querySelector(`svg[id="${iconId}" i]`);
        return icon ? (icon.closest("button") as HTMLElement | null) : null;
      };

      const commentButton = buttonFor("comment-small");
      if (!commentButton) return null;

      /** The row is the nearest block that holds the comment button and the reaction icons. */
      let row: HTMLElement | null = commentButton.parentElement;
      for (let i = 0; i < 4 && row; i += 1) {
        if (row.querySelector('svg[id$="consumption-ring-small" i]')) break;
        row = row.parentElement;
      }

      /**
       * The reaction count is the bare number in that row that belongs to neither button. The
       * buttons carry their own counts, so anything left over is the reactions.
       */
      let reactions: string | null = null;
      if (row) {
        const repostButton = buttonFor("repost-small");
        for (const node of Array.from(row.querySelectorAll("*"))) {
          if (node.children.length > 0) continue;
          if (commentButton.contains(node)) continue;
          if (repostButton && repostButton.contains(node)) continue;
          const text = clean(node.textContent ?? "");
          if (text && /^[\d\s\u00a0\u202f.,]+[km]?$/i.test(text)) {
            reactions = text;
            break;
          }
        }
      }

      const repostButton = buttonFor("repost-small");
      return {
        reactions,
        comments: clean(commentButton.innerText ?? ""),
        reposts: repostButton ? clean(repostButton.innerText ?? "") : "",
      };
    })
    .catch(() => null);

  if (!raw) return null;
  return {
    reactions: raw.reactions === null ? 0 : toNumber(raw.reactions) ?? 0,
    comments: toNumber(raw.comments) ?? 0,
    reposts: toNumber(raw.reposts) ?? 0,
  };
}
