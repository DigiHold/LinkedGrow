/**
 * Turning what somebody typed into a source the worker can open.
 *
 * Addresses only, for companies and for people alike. A name forces the worker
 * to resolve it with a LinkedIn search, which spends one of the day's searches
 * and misses whenever the real profile carries digits, the way
 * `guillaume-moubeche-a026541b2` does. An address is unambiguous and costs
 * nothing to follow.
 */

export type LinkedInSourceType = "competitor" | "creator";

export interface ParsedSource {
  /** The address the worker opens, stored in config.url. */
  url: string;
  /** What the dashboard shows, the slug rather than the whole address. */
  label: string;
}

const WANTED: Record<LinkedInSourceType, { segment: string; suffix: string; what: string }> = {
  competitor: {
    segment: "company",
    suffix: "posts/",
    what: "a LinkedIn company page address, like linkedin.com/company/acme",
  },
  creator: {
    segment: "in",
    suffix: "recent-activity/all/",
    what: "a LinkedIn profile address, like linkedin.com/in/their-profile",
  },
};

export function sourceHint(type: LinkedInSourceType): string {
  return WANTED[type].what;
}

/**
 * Parses one address. Returns null when it is not the shape asked for, so the
 * caller can say which value was wrong rather than failing silently.
 */
export function parseLinkedInSource(raw: string, type: LinkedInSourceType): ParsedSource | null {
  const want = WANTED[type];
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  // Country subdomains are normal on shared links (fr.linkedin.com, uk.…).
  if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== want.segment || !parts[1]) return null;

  const slug = decodeURIComponent(parts[1]).trim();
  if (!slug || slug.length > 120) return null;

  return {
    url: `https://www.linkedin.com/${want.segment}/${slug}/${want.suffix}`,
    label: slug,
  };
}
