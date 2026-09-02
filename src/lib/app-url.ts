/** The public origin of this instance, without a trailing slash. */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Cookies get the Secure flag and the __Secure- prefix only when the instance is served over https. */
export function isSecureAppUrl(): boolean {
  return getAppUrl().startsWith("https://");
}
