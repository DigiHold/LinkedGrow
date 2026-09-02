/** The public origin of this instance, without a trailing slash. In the browser it is the page's own origin. */
export function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Cookies get the Secure flag and the __Secure- prefix only when the instance is served over https. */
export function isSecureAppUrl(): boolean {
  return getAppUrl().startsWith("https://");
}
