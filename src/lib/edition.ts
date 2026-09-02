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

export const EDITION: Edition = editionFrom(process.env);
export const isSelfHosted = (): boolean => EDITION === "self-hosted";
export const isCloud = (): boolean => EDITION === "cloud";
