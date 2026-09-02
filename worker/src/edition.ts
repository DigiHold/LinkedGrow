export type Edition = "self-hosted" | "cloud";

export function editionFrom(env: Record<string, string | undefined>): Edition {
  const raw = (env.LINKEDGROW_EDITION ?? "self-hosted").trim().toLowerCase();
  if (raw === "self-hosted" || raw === "cloud") return raw;
  throw new Error(`LINKEDGROW_EDITION must be "self-hosted" or "cloud", got "${raw}"`);
}

export const EDITION: Edition = editionFrom(process.env);
export const isSelfHosted = (): boolean => EDITION === "self-hosted";
