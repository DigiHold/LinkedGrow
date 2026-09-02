import { getAppUrl } from "@/lib/app-url";

/**
 * Sanitize a callback URL to prevent open redirect attacks.
 * Only allows relative paths on the same origin.
 */
export function sanitizeCallbackUrl(url: string | null, fallback = "/dashboard"): string {
  if (!url) return fallback;

  // Block protocol-relative URLs (//evil.com)
  if (url.startsWith("//")) return fallback;

  // Allow relative paths starting with /
  if (url.startsWith("/")) return url;

  // Allow same-origin absolute URLs
  try {
    const parsed = new URL(url);
    const appOrigin = new URL(getAppUrl()).origin;
    if (parsed.origin === appOrigin) return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    // Invalid URL
  }

  return fallback;
}
