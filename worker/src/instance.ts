import { db } from "./db.ts";
import { decryptSecret } from "./crypto.ts";
import { EDITION } from "./edition.ts";
import { optionalEnv } from "./config.ts";

/**
 * What the setup wizard stored about this instance, read the way the app
 * reads it: one row, `instance_settings` id 1, secrets encrypted under the
 * same `ENCRYPTION_KEY` the app uses.
 */
export interface InstanceSecrets {
  agentAiProvider: string | null;
  agentAiKey: string | null;
  agentAiModelFast: string | null;
  agentAiModelWriter: string | null;
  agentDailyCapUsd: number;
  accountMonthlyCapUsd: number;
  proxySellerKey: string | null;
  cronSecret: string | null;
  adminEmail: string | null;
  appUrl: string | null;
  /** Null in the cloud, which reads its bucket from the environment. */
  storageProvider: "local" | "s3" | null;
  s3Endpoint: string | null;
  s3Region: string | null;
  s3Bucket: string | null;
  s3AccessKey: string | null;
  s3Secret: string | null;
  s3PublicUrl: string | null;
}

let cache: { at: number; value: InstanceSecrets } | null = null;
const TTL_MS = 30_000;

/** The cloud keeps reading its environment. The self hosted edition reads the wizard's row. */
export async function instance(): Promise<InstanceSecrets> {
  if (EDITION === "cloud") {
    return {
      agentAiProvider: "anthropic",
      agentAiKey: optionalEnv("ANTHROPIC_API_KEY"),
      agentAiModelFast: null,
      agentAiModelWriter: null,
      agentDailyCapUsd: 1.0,
      accountMonthlyCapUsd: 12.0,
      proxySellerKey: optionalEnv("PROXY_SELLER_API_KEY"),
      cronSecret: null,
      adminEmail: null,
      appUrl: optionalEnv("APP_URL"),
      storageProvider: null,
      s3Endpoint: null,
      s3Region: null,
      s3Bucket: null,
      s3AccessKey: null,
      s3Secret: null,
      s3PublicUrl: null,
    };
  }
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const { rows } = await db().execute("SELECT * FROM instance_settings WHERE id = 1");
  const r = (rows[0] ?? {}) as Record<string, unknown>;
  const dec = (v: unknown): string | null => (typeof v === "string" && v ? decryptSecret(v) : null);
  const text = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
  const value: InstanceSecrets = {
    agentAiProvider: text(r.agent_ai_provider),
    agentAiKey: dec(r.agent_ai_key_encrypted),
    agentAiModelFast: text(r.agent_ai_model_fast),
    agentAiModelWriter: text(r.agent_ai_model_writer),
    agentDailyCapUsd: Number(r.agent_daily_cap_usd ?? 1),
    accountMonthlyCapUsd: Number(r.account_monthly_cap_usd ?? 12),
    proxySellerKey: dec(r.proxy_seller_key_encrypted),
    cronSecret: dec(r.cron_secret_encrypted),
    adminEmail: text(r.admin_email),
    appUrl: text(r.app_url),
    storageProvider: r.storage_provider === "s3" ? "s3" : "local",
    s3Endpoint: text(r.s3_endpoint),
    s3Region: text(r.s3_region),
    s3Bucket: text(r.s3_bucket),
    s3AccessKey: dec(r.s3_access_key_encrypted),
    s3Secret: dec(r.s3_secret_encrypted),
    s3PublicUrl: text(r.s3_public_url),
  };
  cache = { at: Date.now(), value };
  return value;
}

export function invalidateInstance(): void {
  cache = null;
}
