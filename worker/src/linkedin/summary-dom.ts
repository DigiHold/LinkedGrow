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
  /** Null means the number could not be read, which is never the same as zero. */
  reactions: number | null;
  comments: number | null;
  reposts: number | null;
}

/** What the page gave us, before any of it is turned into numbers. */
export interface RawSocialCounts {
  /** The action bar's Comment control: "3" where the counts live on the buttons, else a word. */
  commentText: string;
  repostText: string;
  /** The reaction control that carries a bare count, on the layout that has one. */
  likeText: string | null;
  /** "Vidhi Toshniwal and 17 others reacted", on the layout that says it in words. */
  reactedText: string | null;
  /** The other texts in that same row, in order: the comments count, then the reposts count. */
  rowTexts: string[];
}

/**
 * The three counts, from either of the two social bars LinkedIn serves.
 *
 * Read off two live accounts on 2026-09-25, the same post page renders two different ways:
 *
 *   counts on the buttons   the Comment button's own text is "3", the Repost button's is a zero
 *                           width space, and a button beside the reaction icons reads "7"
 *   counts in a row above   the buttons read "Like", "Comment", "Repost", and the numbers sit in
 *                           the line above them: "Vidhi Toshniwal and 17 others reacted" and
 *                           "14 comments"
 *
 * The reader only knew the first one. On the second it parsed the word "Comment" as a number,
 * got nothing, and wrote a zero, so every customer on that layout saw a month of posts with
 * impressions and no engagement at all (Enrique and Mohamed, 2026-09-24).
 *
 * Which layout is in front of us is decided by the Comment button: a number means the first, a
 * word means the second. Nothing here reads a word to decide anything, because the account's own
 * language decides those words and half these accounts are not in English.
 */
export function parseSocialCounts(raw: RawSocialCounts): SocialCounts {
  const onButtons = toNumber(raw.commentText);
  if (onButtons !== null) {
    return {
      // The bare number beside the reaction icons. An empty control is a real zero here: LinkedIn
      // writes it as a zero width space rather than as nothing.
      reactions: raw.likeText === null ? null : toNumber(raw.likeText) ?? 0,
      comments: onButtons,
      reposts: toNumber(raw.repostText) ?? 0,
    };
  }

  // The row layout. Nothing in it means nobody did it: LinkedIn leaves the line out rather than
  // writing a zero, so an absent number here is zero and not an unreadable one.
  if (raw.reactedText === null && raw.rowTexts.length === 0) {
    return { reactions: null, comments: null, reposts: null };
  }

  const numbers = raw.rowTexts
    .map((text) => lastNumberIn(text))
    .filter((n): n is number => n !== null);

  return {
    reactions: reactionsFromPhrase(raw.reactedText),
    comments: numbers[0] ?? 0,
    reposts: numbers[1] ?? 0,
  };
}

/** The last number in a string, so "14 comments" and "comentarios 14" both answer 14. */
function lastNumberIn(text: string): number | null {
  const matches = text.match(/[\d][\d.,\s\u00a0\u202f]*[km]?/gi);
  if (!matches || matches.length === 0) return null;
  return toNumber(matches[matches.length - 1] ?? "");
}

/**
 * "Vidhi Toshniwal and 17 others reacted" is 18 people, because the named one is one of them.
 *
 * A phrase with no number at all is one person. A phrase that is only a number is that number,
 * which is what the other layout writes.
 */
function reactionsFromPhrase(phrase: string | null): number | null {
  if (phrase === null) return null;
  const text = phrase.trim();
  if (!text) return null;
  const bare = toNumber(text);
  if (bare !== null) return bare;
  const others = lastNumberIn(text);
  return others === null ? 1 : others + 1;
}

/**
 * Reads the raw text out of the post's own social bar, and leaves the arithmetic to
 * `parseSocialCounts`, which is a pure function and therefore testable against both layouts.
 *
 * Everything is anchored on the icons, which carry the same ids in every language, and everything
 * is scoped to the container holding the post's own Comment button, so the reaction count of a
 * comment underneath can never be mistaken for the post's.
 */
export async function readSocialCounts(page: Page): Promise<SocialCounts | null> {
  const raw = (await page
    .evaluate(() => {
      const clean = (text: string): string =>
        text.replace(/[\u200b\u200c\ufeff]/g, "").replace(/\s+/g, " ").trim();

      const hostOf = (node: Element | null): HTMLElement | null =>
        node ? ((node.closest('button, a, div[role="button"]') as HTMLElement | null) ?? null) : null;

      const commentButton = hostOf(document.querySelector('svg[id="comment-small" i]'));
      if (!commentButton) return null;

      /** The post's own card: the nearest ancestor that also holds the reaction icons. */
      let card: HTMLElement | null = commentButton.parentElement;
      for (let i = 0; i < 6 && card; i += 1) {
        if (card.querySelector('svg[id$="consumption-ring-small" i]')) break;
        card = card.parentElement;
      }
      const scope: HTMLElement | Document = card ?? document;

      const ringHost = hostOf(scope.querySelector('svg[id$="consumption-ring-small" i]'));
      const likeHost = hostOf(scope.querySelector('svg[id="like-consumption-small" i]'));
      const repostHost = hostOf(scope.querySelector('svg[id="repost-small" i]'));

      /**
       * The rest of the line the reactions sit on, which is where the other layout keeps its
       * comment and repost counts. Scoped to that line so the post's own words never get read as
       * a count, and deduplicated because LinkedIn renders each of them twice.
       */
      const rowTexts: string[] = [];
      const row = ringHost ? ringHost.parentElement : null;
      if (row) {
        for (const node of Array.from(row.querySelectorAll("*"))) {
          if (node.children.length > 0) continue;
          if (ringHost && ringHost.contains(node)) continue;
          const text = clean(node.textContent ?? "");
          if (!text || !/\d/.test(text)) continue;
          if (!rowTexts.includes(text)) rowTexts.push(text);
        }
      }

      return {
        commentText: clean(commentButton.innerText ?? ""),
        repostText: repostHost ? clean(repostHost.innerText ?? "") : "",
        likeText: likeHost ? clean(likeHost.innerText ?? "") : null,
        reactedText: ringHost ? clean(ringHost.innerText ?? "") : null,
        rowTexts,
      };
    })
    .catch(() => null)) as RawSocialCounts | null;

  if (!raw) return null;
  return parseSocialCounts(raw);
}
