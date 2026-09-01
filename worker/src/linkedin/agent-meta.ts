/**
 * The platform constants the engine reads.
 *
 * They lived in linkedin-outreach/index.ts, which was the CLI entry point and
 * is replaced by the worker plane per plan section 7g. The constants themselves
 * are still the engine's, so they move here rather than being inlined.
 */
export const AGENT = {
  name: "linkedin",
  label: "LinkedIn",
  loginUrl: "https://www.linkedin.com/login",
  feedHint: "the LinkedIn feed",
  cookieHost: "https://www.linkedin.com",
  cookieName: "li_at",
} as const;
