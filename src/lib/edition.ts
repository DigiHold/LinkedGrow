export type Edition = "self-hosted" | "cloud";

type Env = Record<string, string | undefined>;

/** The flag, normalised. Anything that is not one of the two values is a misconfiguration. */
export function editionFrom(env: Env): Edition {
  const raw = (env.LINKEDGROW_EDITION ?? "self-hosted").trim().toLowerCase();
  if (raw === "self-hosted" || raw === "cloud") return raw;
  throw new Error(`LINKEDGROW_EDITION must be "self-hosted" or "cloud", got "${raw}"`);
}

/**
 * A cloud deploy that lost its flag would run without a paywall. Stripe or QStash
 * configured while the edition is not cloud is that exact situation, so it refuses to boot.
 */
export function assertEditionConsistency(env: Env): void {
  const edition = editionFrom(env);
  const cloudSecret = !!(env.STRIPE_SECRET_KEY || env.QSTASH_TOKEN);
  if (edition !== "cloud" && cloudSecret) {
    throw new Error("cloud secrets present but LINKEDGROW_EDITION is not cloud");
  }
}

// A member expression on purpose: Next inlines process.env.X into the browser
// bundle (see the env block in next.config.ts), while a passed process.env
// object is {} there and every client component would read self hosted.
export const EDITION: Edition = editionFrom({ LINKEDGROW_EDITION: process.env.LINKEDGROW_EDITION });
export const isSelfHosted = (): boolean => EDITION === "self-hosted";
export const isCloud = (): boolean => EDITION === "cloud";
