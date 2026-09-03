import { headers } from "next/headers";
import { appUrlFromHeaders, FALLBACK_APP_URL, normalizeOrigin, pinnedAppUrl } from "./app-url";
import { getInstanceSettings } from "./instance-settings";

/**
 * Where the server gets the instance address from, in the two situations it
 * can be in.
 *
 * Inside a request it is the address the visitor typed, so a link on the page
 * points back at the same host it was served from. Outside one, in an email or
 * a background pass, there is no request to read, so the address is the one the
 * setup wizard stored. A pinned NEXT_PUBLIC_APP_URL or APP_URL wins over both,
 * which is what keeps the cloud on exactly the behaviour it has today and what
 * lets an operator restoring a backup put the old address back by hand.
 */

/** The address the setup wizard stored, or null before it ran. */
async function storedAppUrl(): Promise<string | null> {
  try {
    const row = await getInstanceSettings();
    return row.appUrl ? normalizeOrigin(row.appUrl) : null;
  } catch {
    return null;
  }
}

/**
 * The address of the request being served. Server only, and it makes the route
 * dynamic on a self hosted instance, which is the price of one image answering
 * at any address. The cloud returns the pinned value and reads no header, so
 * everything it prerenders today still prerenders.
 */
export async function requestAppUrl(): Promise<string> {
  const pinned = pinnedAppUrl();
  if (pinned) return pinned;
  return appUrlFromHeaders(await headers()) ?? FALLBACK_APP_URL;
}

/**
 * The address for a link nobody asked for over http: a password reset, an
 * invitation, an alert from the agent. It never reads a request header, so a
 * stranger sending a forged Host cannot decide where our own emails point.
 */
export async function backgroundAppUrl(): Promise<string> {
  return pinnedAppUrl() ?? (await storedAppUrl()) ?? FALLBACK_APP_URL;
}
