import type { Page } from "patchright";
import { createHash } from "node:crypto";
import { log, logError } from "../logger.ts";
import { dwell } from "../browser/human.ts";
import { putObject, bucketConfig } from "../storage/r2.ts";
import { db } from "../db.ts";

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
  if (!bucketConfig()) return null;
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
    const main = document.querySelector("main");
    // The name is the only h1 on a profile, and the headline is the line
    // beneath it. Both are read from structure rather than from class names,
    // which LinkedIn rewrites constantly.
    const name = main?.querySelector("h1")?.textContent?.trim() ?? "";
    const headline =
      (main?.querySelector(".text-body-medium") as HTMLElement | null)?.innerText?.trim() ?? "";
    // The profile photo, never the background image and never a suggestion in
    // the sidebar: it is the one whose alt is the member's own name.
    let photo = "";
    for (const img of Array.from(main?.querySelectorAll("img") ?? [])) {
      const el = img as HTMLImageElement;
      const alt = (el.alt ?? "").trim();
      if (!el.src || !alt) continue;
      if (name && alt.includes(name)) {
        photo = el.src;
        break;
      }
    }
    return { name, headline, photo };
  });

  const avatarUrl = read.photo
    ? await storeAvatar(page, read.photo, `linkedin/accounts/${profileId}`)
    : null;

  return {
    profileUrl,
    profileId,
    fullName: read.name || null,
    headline: read.headline || null,
    avatarUrl,
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
      sql: `SELECT COALESCE(profile_url, '') AS profile_url, COALESCE(full_name, '') AS full_name
              FROM linkedin_accounts WHERE id = ? LIMIT 1`,
      args: [accountId],
    });
    const row = rows[0];
    // The URL is the load-bearing one: publishing reads a post back from it and
    // the follower count comes off it. A name without it is not enough.
    if (row && String(row.profile_url) && String(row.full_name)) return;

    const profile = await readOwnProfile(page);
    if (!profile) return;
    await db().execute({
      sql: `UPDATE linkedin_accounts
               SET profile_url = ?, profile_id = ?,
                   full_name = COALESCE(?, full_name),
                   headline = COALESCE(?, headline),
                   avatar_url = COALESCE(?, avatar_url),
                   updated_at = ?
             WHERE id = ?`,
      args: [
        profile.profileUrl,
        profile.profileId,
        profile.fullName,
        profile.headline,
        profile.avatarUrl,
        Math.floor(Date.now() / 1000),
        accountId,
      ],
    });
    log("account profile captured", {
      accountId,
      name: profile.fullName,
      avatar: profile.avatarUrl ? "stored" : "none",
    });
  } catch (error) {
    // Never fatal: the session is signed in either way, and the work the
    // account is there to do matters more than the picture next to it.
    logError("could not capture the account profile", error, { accountId });
  }
}
