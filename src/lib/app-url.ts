/**
 * The public address of this instance, without a trailing slash.
 *
 * Nothing here is a setting a self hosted operator has to supply. The cloud
 * pins one address in NEXT_PUBLIC_APP_URL and every answer follows it. A self
 * hosted instance answers from the address the request arrived on, so one
 * image runs at any address and the setup wizard, not a file, decides the rest.
 *
 * This module stays free of next/headers and of the database on purpose: a
 * client component imports it. The server side resolvers live next to it in
 * app-url-server.ts.
 */

/** What an instance answers with when it has no address and no request to read. */
export const FALLBACK_APP_URL = "http://localhost:3000";

export function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/**
 * The address an operator pinned. The cloud always has one; a self hosted
 * instance has one only when somebody chose to set it, and then it wins over
 * everything else, including a restored settings row.
 */
export function pinnedAppUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const value = raw ? normalizeOrigin(raw) : "";
  return value || null;
}

/** The first entry of a header a chain of proxies may have appended to. */
function firstValue(raw: string | null): string | null {
  if (!raw) return null;
  const value = raw.split(",")[0].trim();
  return value || null;
}

/**
 * The origin a request came in on, read from the headers a reverse proxy sets
 * and falling back to the host the client asked for. Trusting those headers is
 * the point: it is what lets the instance answer at whatever address somebody
 * put in front of it, and it is the same trust AUTH_TRUST_HOST already grants.
 * Anything that a stranger could poison with a Host header, an address in an
 * email above all, reads the stored settings row first.
 */
export function appUrlFromHeaders(headers: Headers): string | null {
  const host = firstValue(headers.get("x-forwarded-host")) ?? firstValue(headers.get("host"));
  if (!host) return null;
  const protocol = firstValue(headers.get("x-forwarded-proto")) ?? "http";
  if (protocol !== "http" && protocol !== "https") return null;
  try {
    const url = new URL(`${protocol}://${host}`);
    return url.hostname ? url.origin : null;
  } catch {
    return null;
  }
}

/** Whether the request reached us over https, proxy header first, then its own url. */
export function isSecureRequest(headers: Headers, url: string): boolean {
  const protocol = firstValue(headers.get("x-forwarded-proto"));
  if (protocol) return protocol === "https";
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * The address without asking anybody: the page's own origin in the browser,
 * the pinned value on the server, and the local default when there is neither.
 * Server code that can await belongs on requestAppUrl or backgroundAppUrl.
 */
export function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return pinnedAppUrl() ?? FALLBACK_APP_URL;
}

/** Cookies get the Secure flag and the __Secure- prefix only over https. */
export function isSecureAppUrl(): boolean {
  return getAppUrl().startsWith("https://");
}
