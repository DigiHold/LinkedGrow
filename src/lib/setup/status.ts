/**
 * What the setup wizard and the instance settings page read.
 *
 * One builder per area, so every PATCH answers with exactly the section the
 * status route would have shown for it. Secrets never appear here: each one
 * is reduced to its masked suffix through maskSecret.
 */
import { EDITION } from "@/lib/edition";
import {
  getInstanceSettings,
  instanceSecrets,
  maskSecret,
  type InstanceSettings,
  type Secrets,
} from "@/lib/instance-settings";
import { AGENT_PROVIDER_IDS, AGENT_PROVIDERS } from "@shared/ai-models.ts";

export interface ProviderOption {
  id: string;
  label: string;
  fast: string;
  writer: string;
}

export interface InstanceSection {
  instanceName: string | null;
  appUrl: string | null;
  timezone: string | null;
  adminEmail: string | null;
}

export interface AiSection {
  provider: string | null;
  modelFast: string | null;
  modelWriter: string | null;
  keyMask: string | null;
  dailyCapUsd: number;
  monthlyCapUsd: number;
  providers: ProviderOption[];
}

export interface ProxySection {
  provider: InstanceSettings["proxyProvider"];
  keyMask: string | null;
  serverIp: string | null;
}

/** What a proxy save answers. The address is the status route's to look up; a save never carries one. */
export type ProxySaved = Omit<ProxySection, "serverIp">;

export interface EmailSection {
  provider: InstanceSettings["emailProvider"];
  fromName: string | null;
  fromAddress: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpTls: boolean;
  keyMask: string | null;
  passwordMask: string | null;
}

export interface StorageSection {
  provider: InstanceSettings["storageProvider"];
  s3Endpoint: string | null;
  s3Region: string | null;
  s3Bucket: string | null;
  s3PublicUrl: string | null;
  accessKeyMask: string | null;
  secretMask: string | null;
}

export interface SetupStatus {
  edition: typeof EDITION;
  setupCompleted: boolean;
  allowSignups: boolean;
  instance: InstanceSection;
  ai: AiSection;
  proxy: ProxySection;
  email: EmailSection;
  storage: StorageSection;
  cronSecretMask: string | null;
}

export const PROVIDER_OPTIONS: ProviderOption[] = AGENT_PROVIDER_IDS.map((id) => ({
  id,
  label: AGENT_PROVIDERS[id].label,
  fast: AGENT_PROVIDERS[id].fast,
  writer: AGENT_PROVIDERS[id].writer,
}));

export function instanceSection(row: InstanceSettings): InstanceSection {
  return {
    instanceName: row.instanceName,
    // No server default: the browser fills an empty field from its own origin.
    appUrl: row.appUrl,
    timezone: row.timezone,
    adminEmail: row.adminEmail,
  };
}

export function aiSection(row: InstanceSettings, secrets: Secrets): AiSection {
  return {
    provider: row.agentAiProvider,
    modelFast: row.agentAiModelFast,
    modelWriter: row.agentAiModelWriter,
    keyMask: maskSecret(secrets.agentAiKey),
    dailyCapUsd: row.agentDailyCapUsd,
    monthlyCapUsd: row.accountMonthlyCapUsd,
    providers: PROVIDER_OPTIONS,
  };
}

export function proxySection(row: InstanceSettings, secrets: Secrets): ProxySaved {
  return {
    provider: row.proxyProvider,
    keyMask: maskSecret(secrets.proxySellerKey),
  };
}

export function emailSection(row: InstanceSettings, secrets: Secrets): EmailSection {
  return {
    provider: row.emailProvider,
    fromName: row.emailFromName,
    fromAddress: row.emailFromAddress,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpUser: row.smtpUser,
    smtpTls: row.smtpTls,
    keyMask: maskSecret(secrets.emailKey),
    passwordMask: maskSecret(secrets.smtpPassword),
  };
}

export function storageSection(row: InstanceSettings, secrets: Secrets): StorageSection {
  return {
    provider: row.storageProvider,
    s3Endpoint: row.s3Endpoint,
    s3Region: row.s3Region,
    s3Bucket: row.s3Bucket,
    s3PublicUrl: row.s3PublicUrl,
    accessKeyMask: maskSecret(secrets.s3AccessKey),
    secretMask: maskSecret(secrets.s3Secret),
  };
}

const IP_TTL_MS = 10 * 60 * 1000;
let ipCache: { at: number; ip: string } | null = null;

/**
 * The address this server calls out from, as the internet sees it. An answer
 * is kept for 10 minutes per process; a lookup nobody answers in time gives
 * null and is tried again next time.
 */
export async function serverPublicIp(): Promise<string | null> {
  if (ipCache && Date.now() - ipCache.at < IP_TTL_MS) return ipCache.ip;
  try {
    const response = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const data = (await response.json()) as { ip?: unknown };
    if (typeof data.ip !== "string" || !data.ip) return null;
    ipCache = { at: Date.now(), ip: data.ip };
    return data.ip;
  } catch {
    return null;
  }
}

/**
 * The whole status. The public address costs a network call, so it is looked
 * up only when Proxy-Seller is the provider (their allowlist needs it) or when
 * the caller asks for it, which the wizard's dedicated IP step does.
 */
export async function setupStatus(options: { withIp: boolean }): Promise<SetupStatus> {
  const row = await getInstanceSettings(true);
  const secrets = await instanceSecrets();
  const serverIp = options.withIp || row.proxyProvider === "proxy-seller" ? await serverPublicIp() : null;
  return {
    edition: EDITION,
    setupCompleted: row.setupCompleted,
    allowSignups: row.allowSignups,
    instance: instanceSection(row),
    ai: aiSection(row, secrets),
    proxy: { ...proxySection(row, secrets), serverIp },
    email: emailSection(row, secrets),
    storage: storageSection(row, secrets),
    cronSecretMask: maskSecret(secrets.cronSecret),
  };
}
