import type { Page } from "patchright";
import { log } from "../logger.ts";
import { dwell, scrollHuman } from "../browser/human.ts";
import { storeAvatar, slugFrom } from "./profile.ts";

/**
 * Everything worth knowing about one person, read off their profile.
 *
 * Until now a lead was whatever fitted on a search card: a name, a headline and
 * a thumbnail. That is enough to queue somebody and nowhere near enough to
 * decide whether they are worth writing to, or to write to them about anything
 * specific. Nicolas asked for the rest on 2026-07-31: the bio, the posts, the
 * photo, the name, so the score means something.
 *
 * **Anchored on `componentkey`.** Every class on a LinkedIn profile is now a
 * content hash (`e0ce24f6`, `_1f7cdc35`) that changes without notice, so there
 * is nothing to aim at. The renderer does tag each card with a `componentkey`,
 * and the useful half of those values ends in a readable name:
 *
 *   com.linkedin.sdui.profile.card.ref<urn>Topcard    name, headline, location
 *   com.linkedin.sdui.profile.card.ref<urn>About      the bio
 *   com.linkedin.sdui.profile.card.ref<slug>Activity  followers and recent posts
 *   topcard-logo-image-referencekey                   the photo
 *   ProfileVerificationTriggerRef-<slug>              the name on its own
 *
 * The prefix is a per-member URN, so everything here matches on the suffix.
 *
 * **A profile visit is not free.** It is a real page load from the account's own
 * address, and the person can see it in "who viewed your profile". Nothing calls
 * this for every lead: it is for the ones already scored well enough to be worth
 * the visit.
 */

export interface LeadProfile {
  profileId: string;
  profileUrl: string;
  fullName: string | null;
  firstName: string | null;
  headline: string | null;
  location: string | null;
  /** 1st, 2nd, 3rd. Absent when LinkedIn does not print one. */
  degree: string | null;
  /** The About section, which is where people say what they actually do. */
  about: string | null;
  followers: number | null;
  /** The opening of each recent post, newest first. */
  recentPosts: string[];
  avatarUrl: string | null;
}

/**
 * Reads one profile. Returns null only when the page did not load as a profile.
 *
 * Every field is independently optional. A profile with no About section is
 * normal, and losing the whole read because one card is missing would be worse
 * than a partial answer.
 */
export async function readLeadProfile(
  page: Page,
  profileUrl: string
): Promise<LeadProfile | null> {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 25_000 }).catch(() => {});
  await dwell(1800, 3200);
  // The About and Activity cards are rendered as they come into view, so a page
  // that is never scrolled reports a person with no bio and no posts. Scrolling
  // is also what a human does before deciding anything about somebody.
  await scrollHuman(page).catch(() => {});
  await dwell(1200, 2400);

  const landed = page.url().split("?")[0] ?? "";
  const profileId = slugFrom(landed);
  if (!profileId) {
    log("that profile did not load", { profileUrl });
    return null;
  }

  const read = await page.evaluate(() => {
    const bySuffix = (suffix: string): HTMLElement | null =>
      document.querySelector(`[componentkey$="${suffix}"]`) as HTMLElement | null;

    const linesOf = (el: HTMLElement | null): string[] =>
      (el?.innerText ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const topcard = bySuffix("Topcard");

    // Name, from the component built around it, with the page title as the
    // cross-check. A profile has no h1 anywhere any more.
    const name =
      (
        document.querySelector(
          '[componentkey^="ProfileVerificationTriggerRef-"]'
        ) as HTMLElement | null
      )?.innerText?.trim() ||
      (document.title.split("|")[0] ?? "").trim();

    const top = linesOf(topcard);
    const at = top.findIndex((l) => l === name);

    // Headline: the first line under the name that is not the connection
    // degree, not a maiden name in brackets, and not one of the fixed labels.
    let headline: string | null = null;
    let location: string | null = null;
    let degree: string | null = null;
    const noise =
      /^(contact info|see contact info|add profile section|add section|open to|enhance profile|resources|message|more|follow|connect|pending|\d[\d,.\s]*(followers|connections|abonnés|relations))/i;
    if (at >= 0) {
      for (let i = at + 1; i < Math.min(at + 9, top.length); i++) {
        const line = top[i] as string;
        const asDegree = /^(·\s*)?(1st|2nd|3rd|1er|2e|3e)\+?$/i.exec(line);
        if (asDegree) {
          degree = (asDegree[2] ?? "").toLowerCase();
          continue;
        }
        if (line === "·" || noise.test(line) || /^\(.*\)$/.test(line)) continue;
        if (!headline && line.length <= 220) {
          headline = line;
          continue;
        }
        // The location is the line after the headline, and it is the one that
        // reads like a place: comma separated and short.
        if (headline && !location && line.length <= 100 && !/[.!?]$/.test(line)) {
          location = line;
          break;
        }
      }
    }

    // The bio. Its own card, minus the "About" heading LinkedIn prints inside it.
    const aboutCard = bySuffix("About");
    let about: string | null = null;
    if (aboutCard) {
      const body = linesOf(aboutCard).filter(
        (l) => !/^(about|à propos|infos)$/i.test(l) && !/^…see more$/i.test(l)
      );
      const joined = body.join("\n").trim();
      if (joined) about = joined.slice(0, 4000);
    }

    // Followers and the recent posts share the Activity card.
    const activity = bySuffix("Activity");
    const activityLines = linesOf(activity);
    let followers: number | null = null;
    for (const line of activityLines) {
      const m = /^([\d.,\s]+)\s*(followers|abonnés)/i.exec(line);
      if (m) {
        const n = parseInt((m[1] ?? "").replace(/[^\d]/g, ""), 10);
        if (Number.isFinite(n)) followers = n;
        break;
      }
    }

    /**
     * The recent posts, from the pill LinkedIn renders under Activity.
     *
     * Taken as whole text blocks rather than per element, because each post is
     * a nest of divs with hashed classes and the only reliable boundary is the
     * repeated author line at the top of each one.
     */
    const postsPill = document.querySelector(
      '[componentkey$="activity_posts_pillContent"]'
    ) as HTMLElement | null;
    const recentPosts: string[] = [];
    const rawPosts = (postsPill ?? activity)?.innerText ?? "";
    if (rawPosts && name) {
      // Each post begins with the author's name. Split on it and keep the body.
      for (const chunk of rawPosts.split(new RegExp(`(?=${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[•·])`))) {
        const body = chunk
          .split("\n")
          .map((l) => l.trim())
          .filter(
            (l) =>
              l &&
              l !== name &&
              !/^(•|·|\d+[hdwmy]|\d+ (hours?|days?|weeks?|months?|years?) ago|edited|…see more|like|comment|repost|send|activity|posts|comments|videos|images|newsletter)$/i.test(
                l
              ) &&
              !/^\d[\d,.\s]*(followers|abonnés|reactions?|comments?)$/i.test(l)
          )
          .join(" ")
          .trim();
        if (body.length > 40) recentPosts.push(body.slice(0, 700));
        if (recentPosts.length >= 5) break;
      }
    }

    // The photo, at the widest size offered rather than the 100x100 in src.
    const widest = (img: HTMLImageElement): string => {
      const best = (img.getAttribute("srcset") ?? "")
        .split(",")
        .map((part) => part.trim().split(/\s+/))
        .map(([url, size]) => ({ url: url ?? "", w: parseInt(size ?? "0", 10) || 0 }))
        .filter((c) => c.url)
        .sort((a, b) => b.w - a.w)[0];
      return best?.url || img.src;
    };
    const holder = document.querySelector(
      '[componentkey="topcard-logo-image-referencekey"]'
    );
    const img = holder?.querySelector("img") as HTMLImageElement | null;
    const photo = img?.src ? widest(img) : "";

    return { name, headline, location, degree, about, followers, recentPosts, photo };
  });

  const fullName = read.name || null;
  return {
    profileId,
    profileUrl: `https://www.linkedin.com/in/${profileId}/`,
    fullName,
    firstName: fullName ? (fullName.split(/\s+/)[0] ?? null) : null,
    headline: read.headline || null,
    location: read.location || null,
    degree: read.degree || null,
    about: read.about || null,
    followers: read.followers ?? null,
    recentPosts: read.recentPosts ?? [],
    // Into our own bucket, because LinkedIn's photo URLs are signed and expire
    // within days. A linked one works in the demo and is broken by the time
    // anybody looks at the lead again.
    avatarUrl: read.photo ? await storeAvatar(page, read.photo, `linkedin/leads/${profileId}`) : null,
  };
}
