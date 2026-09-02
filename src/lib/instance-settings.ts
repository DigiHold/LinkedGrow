import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { instanceSettings } from "@/lib/db/schema";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";
import { EDITION, type Edition } from "@/lib/edition";

export type SecretName = "agentAiKey" | "proxySellerKey" | "emailKey" | "smtpPassword" | "s3AccessKey" | "s3Secret" | "cronSecret";
export type Secrets = Record<SecretName, string | null>;

const ENV_FALLBACK: Record<SecretName, string> = {
  agentAiKey: "ANTHROPIC_API_KEY",
  proxySellerKey: "PROXY_SELLER_API_KEY",
  emailKey: "BREVO_API_KEY",
  smtpPassword: "SMTP_PASSWORD",
  s3AccessKey: "R2_ACCESS_KEY_ID",
  s3Secret: "R2_SECRET_ACCESS_KEY",
  cronSecret: "CRON_SECRET",
};

const EMPTY: Secrets = { agentAiKey: null, proxySellerKey: null, emailKey: null, smtpPassword: null, s3AccessKey: null, s3Secret: null, cronSecret: null };

/** Pure: the cloud never reads the row for a secret, the self hosted edition never reads env. */
export function resolveSecretFrom(edition: Edition, name: SecretName, row: Secrets, env: Record<string, string | undefined>): string | null {
  if (edition === "cloud") return env[ENV_FALLBACK[name]] || null;
  return row[name];
}

/** The masked suffix shown in forms; never the value. */
export function maskSecret(value: string | null): string | null {
  return value ? `••••${value.slice(-4)}` : null;
}

export type InstanceSettings = typeof instanceSettings.$inferSelect;

let cache: { at: number; row: InstanceSettings } | null = null;
const TTL_MS = 15_000;

export async function getInstanceSettings(fresh = false): Promise<InstanceSettings> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.row;
  const [row] = await db.select().from(instanceSettings).where(eq(instanceSettings.id, 1)).limit(1);
  if (!row) throw new Error("instance_settings row 1 is missing; run the migrations");
  cache = { at: Date.now(), row };
  return row;
}

export function invalidateInstanceSettings(): void {
  cache = null;
}

export async function updateInstanceSettings(patch: Partial<Omit<InstanceSettings, "id" | "createdAt" | "updatedAt">>): Promise<InstanceSettings> {
  await db.update(instanceSettings).set({ ...patch, updatedAt: new Date() }).where(eq(instanceSettings.id, 1));
  invalidateInstanceSettings();
  return getInstanceSettings(true);
}

/** Stores a secret encrypted; an empty string clears it. */
export function encryptSecret(value: string): string | null {
  return value ? (encryptApiKey(value) ?? null) : null;
}

export async function instanceSecrets(): Promise<Secrets> {
  const row = await getInstanceSettings();
  const dec = (v: string | null) => (v ? decryptApiKey(v) : null);
  return {
    agentAiKey: dec(row.agentAiKeyEncrypted),
    proxySellerKey: dec(row.proxySellerKeyEncrypted),
    emailKey: dec(row.emailKeyEncrypted),
    smtpPassword: dec(row.smtpPasswordEncrypted),
    s3AccessKey: dec(row.s3AccessKeyEncrypted),
    s3Secret: dec(row.s3SecretEncrypted),
    cronSecret: dec(row.cronSecretEncrypted),
  };
}

export async function resolveInstanceSecret(name: SecretName): Promise<string | null> {
  if (EDITION === "cloud") return resolveSecretFrom("cloud", name, EMPTY, process.env);
  return resolveSecretFrom("self-hosted", name, await instanceSecrets(), process.env);
}
