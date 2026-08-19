// Tiny, defensive wrapper around the Reditus affiliate global (window.gr).
// The Reditus script is injected by CookieBanner once marketing consent is
// given, so these helpers no-op for a visitor who refused, which is intended:
// no consent means no attribution. They also never throw if the script is
// blocked or still loading, and they no-op on the server.
// Unlike the Insight helpers next door, the conversion call has to send the new
// account's email: Reditus matches a signup back to the affiliate who referred
// it by email address, so there is no PII-free version of this call.

type ReditusFn = (command: string, arg: string, data?: Record<string, string>) => void;

function getReditus(): ReditusFn | null {
  if (typeof window === "undefined") return null;
  const gr = (window as unknown as { gr?: ReditusFn }).gr;
  return typeof gr === "function" ? gr : null;
}

// Credits the referring affiliate for a brand-new account. Call once, at signup,
// never on a returning login: Reditus counts each conversion it receives.
// The uid is the account id and is what lets Reditus tie the later Stripe
// payments back to this signup, so pass it whenever it is already to hand.
export function trackReferralConversion(email: string, uid?: string): void {
  if (!email) return;
  const payload: Record<string, string> = { email };
  if (uid) payload.uid = uid;
  getReditus()?.("track", "conversion", payload);
}
