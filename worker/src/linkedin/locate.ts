/**
 * How this codebase is allowed to find a control on a LinkedIn page.
 *
 * Nothing here reads a word of English, because LinkedIn serves its interface
 * in the language of the account and every accessible name changes with it. On
 * 2026-09-05 a French account could not attach an image, because the composer
 * offered "Medias" and the selector asked for "Media" or "Photo"; the same
 * mistake made the miner report zero commenters on pages full of comments,
 * because it looked for a button called "comments on". The rule that comes out
 * of that day: a control is found by what the markup calls it, never by what
 * the reader sees.
 *
 * Two attributes carry that machine name, and LinkedIn serves both, sometimes
 * on the same account. The rebuilt pages (feed, profile, network) put a
 * `data-view-name` on the element itself. The older pages (a post permalink, a
 * company page) put the name of the icon on the svg inside it, in `id` on the
 * current build and in `data-test-icon` on the one before. All three are
 * matched, so a page served either way answers, and a rename of one attribute
 * does not take the product down.
 */

/** Elements LinkedIn tags with its own view name, plus their inner control. */
export function byView(...names: string[]): string {
  return names
    .flatMap((name) => [
      `[data-view-name="${name}"]`,
      `[data-view-name="${name}"] button`,
      `[data-view-name="${name}"] a`,
    ])
    .join(", ");
}

/** Anything holding an icon of this name, whichever attribute carries it. */
export function byIcon(...icons: string[]): string {
  return icons
    .flatMap((icon) => [`svg[data-test-icon="${icon}" i]`, `svg[id="${icon}" i]`])
    .flatMap((svg) => [
      `button:has(${svg})`,
      `a:has(${svg})`,
      `[role="button"]:has(${svg})`,
      `[role="menuitem"]:has(${svg})`,
    ])
    .join(", ");
}

/** The view name first, the icon as the fallback for the older pages. */
export function byViewOrIcon(views: string[], icons: string[]): string {
  return [byView(...views), byIcon(...icons)].filter(Boolean).join(", ");
}

/**
 * The machine names this product depends on, in one place, so a LinkedIn
 * rename is one edit and a grep tells you what is at risk.
 *
 * Read off a live French account on 2026-09-05 with src/tools/dump-controls.ts.
 * Run that tool again rather than guessing when something stops being found.
 */
/* Only names something in here actually holds on to. The like control is not
   listed on purpose: `reaction-button` names it on the rebuilt pages but says
   nothing about whether this account has already reacted, and the agent must
   only ever press a post it has not. The outline icon carries both facts, so
   that is what ICON.like is for. */
export const VIEW = {
  composerTrigger: "share-sharebox-focus",
  composerImage: "share-sharebox-bottom-bar-image",
  composerVideo: "share-sharebox-bottom-bar-video",
  postAuthor: "feed-actor",
  postMenu: "feed-control-menu",
  commentCount: "feed-comment-count",
  reactionCount: "feed-reaction-count",
  repostCount: "feed-repost-count",
  commentButton: "feed-comment-button",
  moreComments: "more-comments",
  commentAuthor: "comment-actor-description",
  commentReply: "comment-reply",
  commentReactionCount: "comment-reaction-count",
} as const;

export const ICON = {
  image: ["image-medium", "images-medium"],
  video: ["video-medium"],
  addMore: ["add-medium", "plus-medium"],
  document: ["sticky-note-medium", "document-medium"],
  /**
   * The like control of a post NOBODY has reacted to yet, which is the only
   * one the agent may press.
   *
   * Outline only, deliberately. LinkedIn swaps the icon for a filled one once
   * the account has reacted, and warmUp proves its click by watching this set
   * shrink by one. Listing the filled icon here broke both halves at once: the
   * proof could never fire, and the agent could pick a post it had already
   * liked and take the reaction back off it.
   */
  like: ["thumbs-up-outline-small", "thumbs-up-outline-medium"],
  comment: ["comment-small", "comment-medium"],
  repost: ["repost-small", "repost-medium"],
  sendPrivately: ["send-privately-small", "send-privately-medium"],
  connect: ["connect-small", "connect-medium"],
  follow: ["add-small"],
  compose: ["compose-medium", "compose-small"],
  attachment: ["attachment-medium"],
  overflow: ["overflow-web-ios-small", "overflow-web-ios-medium"],
  close: ["close-small", "close-medium"],
  person: ["person-medium", "person-small", "person-accent-4"],
} as const;
