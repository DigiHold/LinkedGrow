import type { Page } from "patchright";
import type { PostToAnswer } from "./draft.ts";

/**
 * Reading the post, and only the post.
 *
 * The first live run on 2026-09-06 took the whole of `main` and handed the model this:
 *
 *   Nicolas Lecocq / Let our AI agents find your clients on LinkedIn / Paris / Vayalis /
 *   Profile viewers 340 / Post impressions 633 / Feed post / Jeremy Guillo / ...
 *
 * Three separate faults in one string. The author came out as Nicolas rather than the person who
 * wrote the post. His own profile statistics, 340 and 633, went into the model's input, and those
 * are private numbers that have no business being anywhere near a comment. And the comments below
 * came along too, so the model was reading other people's replies as if they were the post.
 *
 * The fix is structural rather than a list of things to strip. Every action bar on the page carries
 * a comment icon: the post has one, and so does each comment under it. So the post is the largest
 * block that contains the FIRST of those icons and none of the others. No class name, no label, no
 * language.
 */

const COMMENT_ICON = 'svg[id="comment-small" i], svg[data-test-icon="comment-small" i]';

/**
 * Everything LinkedIn writes around a post that is not the post.
 *
 * Kept short on purpose. The container rule above does the work; these are the few fragments that
 * sit inside the post block itself, and each one is a control rather than a sentence, so removing
 * whole lines cannot eat any of the author's words.
 */
const CHROME_LINES =
  /^(show translation|see more|…see more|follow|following|\+ follow|like|comment|repost|send|reply|load more comments|most relevant|most recent|feed post|activate to view larger image.*)$/i;

/** A run of digits on its own line is a reaction or comment counter, never prose. */
const COUNTER_LINE = /^[\d.,\s]+$/;

/**
 * How long ago the post went up, as LinkedIn writes it: "13h", "2 d", "3 weeks".
 *
 * Dropped rather than read. It is a label in the reader's own language, and the post's real age
 * comes from its identifier (urn.ts), which needs no page at all.
 */
const AGE_LINE = /^\d{1,3}\s*(h|m|min|d|w|mo|y|hours?|minutes?|days?|weeks?|months?|years?)\.?$/i;

/** The separators LinkedIn hangs around a control, which survive a plain trim. */
function bare(line: string): string {
  return line.replace(/^[\s\u2022·•|–-]+/, "").replace(/[\s\u2022·•|–-]+$/, "").trim();
}

export function cleanPostText(raw: string): string {
  const lines = raw
    .split("\n")
    .map(bare)
    .filter(Boolean)
    .filter((line) => !CHROME_LINES.test(line))
    .filter((line) => !COUNTER_LINE.test(line))
    .filter((line) => !AGE_LINE.test(line));

  const out: string[] = [];
  for (const line of lines) {
    if (out[out.length - 1] !== line) out.push(line);
  }
  return out.join("\n").trim();
}

/**
 * The author's name and headline, which are the first two lines of the block.
 *
 * LinkedIn puts the name, then the headline, then the age of the post, then the text. The age is
 * dropped by the caller because it is a label in the reader's language and this codebase never
 * reads one; the post's real age comes from its identifier instead.
 */
export function splitAuthor(text: string): PostToAnswer {
  const lines = text.split("\n");
  const author = lines[0]?.trim() ?? "unknown";
  const headline = (lines[1] ?? "").trim().slice(0, 200);
  return { author, headline, text };
}

/**
 * The post on the page currently open, or null when its shape cannot be found.
 *
 * Null rather than a guess. A page that does not answer this is a page LinkedIn has rebuilt, and
 * the honest response to that is to stop rather than to comment on whatever text happened to be
 * lying around.
 */
export async function readPost(page: Page): Promise<PostToAnswer | null> {
  const raw = await page
    .evaluate((iconSelector: string) => {
      const icons = Array.from(document.querySelectorAll(iconSelector));
      const first = icons[0];
      if (!first) return "";
      const second = icons[1] ?? null;

      /**
       * Climb while the next parent still leaves every other action bar outside. The block that
       * stops the climb is the post: its own bar is inside, the first comment's bar is not.
       */
      let node: Element = first;
      while (
        node.parentElement &&
        node.parentElement.tagName !== "BODY" &&
        (!second || !node.parentElement.contains(second))
      ) {
        node = node.parentElement;
      }
      return (node as HTMLElement).innerText ?? "";
    }, COMMENT_ICON)
    .catch(() => "");

  const cleaned = cleanPostText(raw);
  if (cleaned.length < 80) return null;
  return splitAuthor(cleaned.slice(0, 4000));
}
