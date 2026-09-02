import type { Page } from "patchright";
import { createHash } from "node:crypto";
import { log, logError } from "../logger.ts";
import { dwell } from "../browser/human.ts";
import { putObject, storageConfigured } from "../storage/r2.ts";
import { db } from "../db.ts";
import {
  accountMaturity,
  countNear,
  oldestYearIn,
  CONNECTION_WORDS,
  FOLLOWER_WORDS,
  type Maturity,
} from "../safety/maturity.ts";

/**
 * Who this account actually is, read off LinkedIn once it is signed in.
 *
 * Until now nothing wrote any of it. The dashboard showed a connected account
 * as its email address and two grey initials, every lead was a name with no
 * face, and two features could not work at all: a published post is verified by
 * reading it back off the author's own activity feed, and the follower count is
 * read off the author's profile. Both need the profile URL, and nothing knew it.
 *
 * The picture is copied into our own bucket rather than linked. LinkedIn serves
 * member photos from signed URLs that expire within days, so a stored link is a
 * picture that works in the demo and is broken by the time somebody looks again.
 */

export interface Profile {
  profileUrl: string;
  profileId: string;
  fullName: string | null;
  headline: string | null;
  avatarUrl: string | null;
  /**
   * How long this account has existed, judged from its own profile.
   *
   * The reading ramp started every account at a third of its pace for three
   * weeks, which is right for an account created yesterday and wrong for one
   * with ten years of jobs on it. LinkedIn shows no join date anywhere, but the
   * connection count, the follower count and the oldest year in the experience
   * section together answer the question well enough, and this page is already
   * open.
   */
  maturity: Maturity;
  connections: number | null;
}

/** The public slug in a LinkedIn profile URL, which is the stable id we key on. */
export function slugFrom(url: string): string {
  return (/linkedin\.com\/in\/([^/?#]+)/i.exec(url)?.[1] ?? "").toLowerCase();
}

/**
 * Copies one LinkedIn image into the bucket.
 *
 * Fetched inside the page rather than from Node: the media host is licdn.com
 * and the page is linkedin.com, but LinkedIn serves these images with a
 * permissive CORS header, and going through the page means the request carries
 * the session's own address like everything else the account does.
 *
 * Returns null on any failure, including no bucket configured, because a
 * missing avatar must never stop a sign-in.
 */
export async function storeAvatar(
  page: Page,
  remoteUrl: string,
  keyPrefix: string
): Promise<string | null> {
  if (!(await storageConfigured())) return null;
  try {
    const encoded = await page.evaluate(async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] as number);
      return { type: res.headers.get("content-type") ?? "image/jpeg", data: btoa(binary) };
    }, remoteUrl);
    if (!encoded?.data) return null;

    const body = Buffer.from(encoded.data, "base64");
    // Sanity: LinkedIn's "no photo" placeholder and an error page are both tiny.
    if (body.length < 512) return null;

    const type = encoded.type.startsWith("image/") ? encoded.type : "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    // The digest keeps a changed photo from overwriting a cached one at the
    // same URL, and keeps an unchanged photo from being written twice.
    const digest = createHash("sha256").update(body).digest("hex").slice(0, 16);
    return await putObject(`${keyPrefix}/${digest}.${ext}`, body, type);
  } catch {
    return null;
  }
}

/**
 * Reads the signed-in account's own name, headline, profile URL and picture.
 *
 * It goes through the "me" redirect rather than guessing a URL, because that is
 * the only way to learn the account's own slug without knowing it already.
 */
export async function readOwnProfile(page: Page): Promise<Profile | null> {
  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 25_000 }).catch(() => {});
  await dwell(1500, 3000);

  const profileUrl = page.url().split("?")[0] ?? "";
  const profileId = slugFrom(profileUrl);
  if (!profileId) {
    log("could not read the account's own profile URL");
    return null;
  }

  const read = await page.evaluate(() => {
    /**
     * Anchored on `componentkey`, which is the one attribute LinkedIn's own
     * renderer puts there on purpose.
     *
     * Every class on this page is a content hash: `e0ce24f6`, `_1f7cdc35`.
     * They change without notice and they are unreadable, so they cannot be
     * used as landmarks. Nicolas found the alternative on 2026-07-31 and it is
     * the right one: `componentkey` names the component, survives restyling,
     * and some of the values even carry the profile slug.
     *
     * What the old code did instead, and why all three fields came back empty:
     * it looked for the only `h1` (a profile now has no `h1` anywhere in the
     * document), for `.text-body-medium` (gone), and for an image whose `alt`
     * contains the member's name. That last one is the instructive failure. It
     * happened to work on one real profile and returns nothing on another,
     * where the same image carries `alt=""`.
     */
    const main = document.querySelector("main");
    const topcard =
      (document.querySelector('[componentkey$="topcard"]') as HTMLElement | null) ??
      (main as HTMLElement | null);

    // The name, from the component built around it. The page title is the
    // cross-check: it reads "Jane DOE | LinkedIn" and has outlived every
    // redesign.
    const fromComponent = (
      document.querySelector('[componentkey^="ProfileVerificationTriggerRef-"]') as
        | HTMLElement
        | null
    )?.innerText?.trim();
    const fromTitle = (document.title.split("|")[0] ?? "").trim();
    const name = fromComponent || fromTitle || "";

    /**
     * The headline, which has no component key of its own.
     *
     * Structure instead, read off both of the real profiles this was built
     * against: the name sits in a stack of nested divs, and the headline is
     * the first `<p>` that follows that stack as a sibling. Everything after
     * it (location, "Contact info", follower counts) is inside a further div,
     * so the first sibling paragraph is unambiguous.
     *
     *   <div>… <a componentkey="ProfileVerificationTriggerRef-…"><h2>Name</h2></a> …</div>
     *   <p>The headline</p>
     *   <div><p>Paris, Île-de-France, France</p><p>·</p><p>Contact info</p></div>
     */
    let headline = "";
    const anchor = document.querySelector(
      '[componentkey^="ProfileVerificationTriggerRef-"]'
    );
    let climb: Element | null = anchor;
    for (let hop = 0; climb && hop < 6 && !headline; hop++) {
      // Every paragraph that follows, not only the first. One real profile
      // carries a maiden name in brackets between the name and the headline
      // and another does not, so taking the first sibling stored
      // "(Jane Roe)" as the job title.
      let sibling = climb.nextElementSibling;
      while (sibling?.tagName === "P") {
        const text = (sibling as HTMLElement).innerText.trim();
        const isAlternateName = /^\(.*\)$/.test(text);
        if (text && text !== name && !isAlternateName && text.length <= 220) {
          headline = text;
          break;
        }
        sibling = sibling.nextElementSibling;
      }
      climb = climb.parentElement;
    }

    // Failing that, the line under the name. Kept because the structure above
    // is two profiles' worth of evidence, not a contract.
    const lines = (topcard?.innerText ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const at = headline ? -1 : lines.findIndex((l) => l === name);
    if (at >= 0) {
      const skip =
        /^(contact info|see contact info|add profile section|add section|open to|enhance profile|resources|analytics|\d+(st|nd|rd|th)\s|following|followers|connections|·)/i;
      for (let i = at + 1; i < Math.min(at + 6, lines.length); i++) {
        const candidate = lines[i] as string;
        if (skip.test(candidate) || candidate.length > 220) continue;
        // A line that is nothing but brackets is the maiden or former name
        // LinkedIn prints under the current one. A real profile showed
        // "(Jane Roe)" there and it was stored as the job title.
        if (/^\(.*\)$/.test(candidate)) continue;
        headline = candidate;
        break;
      }
    }

    /**
     * The photo, from the component that holds it, at the largest size offered.
     *
     * `src` on that image is the 100x100 thumbnail, which is how a stored
     * avatar came out at 4KB. The `srcset` carries the same photo up to 800
     * wide for nothing extra, so take the widest candidate in it.
     */
    const widest = (img: HTMLImageElement): string => {
      const best = (img.getAttribute("srcset") ?? "")
        .split(",")
        .map((part) => part.trim().split(/\s+/))
        .map(([url, size]) => ({ url: url ?? "", w: parseInt(size ?? "0", 10) || 0 }))
        .filter((c) => c.url)
        .sort((a, b) => b.w - a.w)[0];
      return best?.url || img.src;
    };

    let photo = "";
    const holder = document.querySelector(
      '[componentkey="topcard-logo-image-referencekey"]'
    );
    const own = holder?.querySelector("img") as HTMLImageElement | null;
    if (own?.src) photo = widest(own);

    // Only if the component is not there. Kept because it costs nothing and an
    // older layout should still produce a picture.
    if (!photo && name) {
      for (const img of Array.from(main?.querySelectorAll("img") ?? [])) {
        const el = img as HTMLImageElement;
        if (el.src && (el.alt ?? "").includes(name)) {
          photo = widest(el);
          break;
        }
      }
    }
    // The whole page as text, for the age signals below. The counts sit in the
    // top card and the years sit in Experience and Education, so the cheapest
    // reliable read is the document rather than three more selectors that
    // LinkedIn can rename.
    const body = (document.body?.innerText ?? "").slice(0, 20_000);
    return { name, headline, photo, body };
  });

  const avatarUrl = read.photo
    ? await storeAvatar(page, read.photo, `linkedin/accounts/${profileId}`)
    : null;

  const thisYear = new Date().getFullYear();
  const connections = countNear(read.body, CONNECTION_WORDS);
  const signals = {
    connections,
    followers: countNear(read.body, FOLLOWER_WORDS),
    oldestYear: oldestYearIn(read.body, thisYear),
  };

  return {
    profileUrl,
    profileId,
    fullName: read.name || null,
    headline: read.headline || null,
    avatarUrl,
    maturity: accountMaturity(signals, thisYear),
    connections,
  };
}

/**
 * Reads the profile and writes it onto the account, once.
 *
 * Called by anything that has a signed-in session: the agent pass, the publish
 * pass, the insights pass. It costs one indexed SELECT to find out there is
 * nothing to do, so calling it from three places is cheaper than deciding which
 * one owns it, and an account connected for publishing only still gets a name.
 */
export async function ensureProfileCaptured(page: Page, accountId: string): Promise<void> {
  try {
    const { rows } = await db().execute({
      sql: `SELECT COALESCE(profile_url, '') AS profile_url,
                   COALESCE(full_name, '') AS full_name,
                   COALESCE(maturity, '') AS maturity
              FROM linkedin_accounts WHERE id = ? LIMIT 1`,
      args: [accountId],
    });
    const row = rows[0];
    /**
     * The URL is the load-bearing one: publishing reads a post back from it and
     * the follower count comes off it. A name without it is not enough.
     *
     * Maturity is in the condition rather than alongside it, and that matters:
     * every account connected before this existed already has a URL and a name,
     * so a check on those two alone would return early for ever and the age
     * would never be read on a single existing account. The reading ramp would
     * then hold every current customer at the cautious floor permanently.
     */
    if (row && String(row.profile_url) && String(row.full_name) && String(row.maturity)) return;

    const profile = await readOwnProfile(page);
    if (!profile) return;
    await db().execute({
      sql: `UPDATE linkedin_accounts
               SET profile_url = ?, profile_id = ?,
                   full_name = COALESCE(?, full_name),
                   headline = COALESCE(?, headline),
                   avatar_url = COALESCE(?, avatar_url),
                   maturity = ?, connections = ?,
                   updated_at = ?
             WHERE id = ?`,
      args: [
        profile.profileUrl,
        profile.profileId,
        profile.fullName,
        profile.headline,
        profile.avatarUrl,
        profile.maturity,
        profile.connections,
        Math.floor(Date.now() / 1000),
        accountId,
      ],
    });
    log("account profile captured", {
      accountId,
      name: profile.fullName,
      avatar: profile.avatarUrl ? "stored" : "none",
      maturity: profile.maturity,
      connections: profile.connections,
    });
  } catch (error) {
    // Never fatal: the session is signed in either way, and the work the
    // account is there to do matters more than the picture next to it.
    logError("could not capture the account profile", error, { accountId });
  }
}
