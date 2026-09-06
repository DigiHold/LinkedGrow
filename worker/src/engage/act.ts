import type { Page, Locator } from "patchright";
import { log } from "../logger.ts";
import { dwell, scrollHuman, clickHumanLocator, randInt, sleep } from "../browser/human.ts";
import { byIcon, ICON } from "../linkedin/locate.ts";
import { postFirstComment } from "../linkedin/publish.ts";

/**
 * Leaving a like and a comment on somebody else's post.
 *
 * The comment itself is not written here. `postFirstComment` in publish.ts already does exactly
 * this work for the first comment under Nicolas's own posts, and it has been through the redesign:
 * it finds the box as `div[role="textbox"][contenteditable="true"]`, which is the TipTap editor his
 * account was served on 2026-09-06, it types with real keystrokes because ProseMirror ignores
 * anything else, it reads the text back before submitting, it locates the send control by geometry
 * rather than by its name, and it falls back to Enter when the button does nothing. Writing a second
 * version of that would mean rediscovering every one of those failures.
 *
 * So this file adds the two things that are genuinely different: the order of the actions, and the
 * like.
 */

/**
 * The post's own like control, which is not one of its comments' like controls.
 *
 * A permalink carries one like button per comment as well as the post's own, and after a comment
 * has just been left there is one more. Taking the topmost is unambiguous in a way that "the first
 * in DOM order" is not, because the redesigned page reorders things the old one did not.
 *
 * Only the outline icon is matched, which is the control of a post nobody has reacted to. LinkedIn
 * swaps it for a filled one once reacted, so a liked post offers nothing to click and the agent
 * cannot take a reaction back off something it liked before.
 */
async function topmostUnliked(page: Page): Promise<Locator | null> {
  const candidates = page.locator(byIcon(...ICON.like));
  const count = await candidates.count().catch(() => 0);
  let best: { at: number; locator: Locator } | null = null;
  for (let i = 0; i < count; i += 1) {
    const candidate = candidates.nth(i);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    const box = await candidate.boundingBox().catch(() => null);
    if (!box) continue;
    if (!best || box.y < best.at) best = { at: box.y, locator: candidate };
  }
  return best?.locator ?? null;
}

export interface Engagement {
  commented: boolean;
  liked: boolean;
}

/**
 * Comment first, then like, on the page already open.
 *
 * That order costs one page load instead of two. `postFirstComment` navigates and reads the post
 * itself, so liking afterwards happens on the page it left behind, which is also the order a person
 * uses: you read something, you answer it, and the like is the afterthought on the way out.
 *
 * The like never decides the outcome. A comment that went up and a like that did not is a fine
 * result; the reverse, retrying because the like failed, would post the comment twice.
 */
export async function engagePost(page: Page, postUrl: string, comment: string): Promise<Engagement> {
  const commented = await postFirstComment(page, postUrl, comment);

  await dwell(1800, 4000);
  await scrollHuman(page, 1);
  await dwell(1200, 2600);

  const before = await page.locator(byIcon(...ICON.like)).count().catch(() => 0);
  const like = await topmostUnliked(page);
  if (!like) {
    log("engage: no unreacted like control on the post, leaving it");
    return { commented, liked: false };
  }

  await like.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(randInt(600, 1800));
  await clickHumanLocator(page, like);
  await dwell(1400, 2600);

  /**
   * The proof, read the same way warmUp reads it: the icon flips once the reaction lands, so the
   * number of unreacted controls drops by one. Re-reading the clicked locator cannot work, because
   * it stops matching the moment it succeeds.
   */
  const after = await page.locator(byIcon(...ICON.like)).count().catch(() => before);
  const liked = after < before;
  if (!liked) log("engage: the like did not register");
  return { commented, liked };
}
