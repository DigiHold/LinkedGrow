/**
 * The setup forms, shared by the first login wizard and Settings, Instance.
 *
 * Both screens edit the same five areas through the same routes; this file
 * holds the form shapes, how a status becomes a form, how a form becomes a
 * request body, and the two calls (save, test) each screen makes.
 */
import type {
  AiSection,
  EmailSection,
  InstanceSection,
  ProviderOption,
  ProxySection,
  SetupStatus,
  StorageSection,
} from "@/lib/setup/status";

export type { SetupStatus, ProviderOption };

export interface InstanceForm {
  instanceName: string;
  appUrl: string;
  timezone: string;
  adminEmail: string;
}

export interface AiForm {
  provider: string;
  apiKey: string;
  modelFast: string;
  modelWriter: string;
  dailyCapUsd: string;
  monthlyCapUsd: string;
}

export type ProxyProviderId = ProxySection["provider"];
export interface ProxyForm {
  provider: ProxyProviderId;
  apiKey: string;
}

export type EmailProviderId = EmailSection["provider"];
export interface EmailForm {
  provider: EmailProviderId;
  apiKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpTls: boolean;
  fromName: string;
  fromAddress: string;
}

export type StorageProviderId = StorageSection["provider"];
export interface StorageForm {
  provider: StorageProviderId;
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3Secret: string;
  s3PublicUrl: string;
}

export interface Forms {
  instance: InstanceForm;
  ai: AiForm;
  proxy: ProxyForm;
  email: EmailForm;
  storage: StorageForm;
}

export type Area = keyof Forms;
export type TestArea = Exclude<Area, "instance">;

export type TestOutcome =
  | { state: "idle" }
  | { state: "running" }
  | { state: "ok"; detail: string }
  | { state: "error"; detail: string };

export const IDLE: TestOutcome = { state: "idle" };

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function providerModels(providers: ProviderOption[], id: string): { fast: string; writer: string } {
  const found = providers.find((p) => p.id === id) ?? providers[0];
  return { fast: found?.fast ?? "", writer: found?.writer ?? "" };
}

export function formsFrom(status: SetupStatus, defaults: { adminEmail: string }): Forms {
  const provider = status.ai.provider ?? status.ai.providers[0]?.id ?? "anthropic";
  const models = providerModels(status.ai.providers, provider);
  return {
    instance: {
      instanceName: status.instance.instanceName ?? "",
      appUrl: status.instance.appUrl,
      timezone: status.instance.timezone ?? browserTimezone(),
      adminEmail: status.instance.adminEmail ?? defaults.adminEmail,
    },
    ai: {
      provider,
      apiKey: "",
      modelFast: status.ai.modelFast ?? models.fast,
      modelWriter: status.ai.modelWriter ?? models.writer,
      dailyCapUsd: String(status.ai.dailyCapUsd),
      monthlyCapUsd: String(status.ai.monthlyCapUsd),
    },
    proxy: { provider: status.proxy.provider, apiKey: "" },
    email: {
      provider: status.email.provider,
      apiKey: "",
      smtpHost: status.email.smtpHost ?? "",
      smtpPort: status.email.smtpPort ? String(status.email.smtpPort) : "587",
      smtpUser: status.email.smtpUser ?? "",
      smtpPassword: "",
      smtpTls: status.email.smtpTls,
      fromName: status.email.fromName ?? status.instance.instanceName ?? "",
      fromAddress: status.email.fromAddress ?? "",
    },
    storage: {
      provider: status.storage.provider,
      s3Endpoint: status.storage.s3Endpoint ?? "",
      s3Region: status.storage.s3Region ?? "",
      s3Bucket: status.storage.s3Bucket ?? "",
      s3AccessKey: "",
      s3Secret: "",
      s3PublicUrl: status.storage.s3PublicUrl ?? "",
    },
  };
}

/** A pasted secret is sent only when there is one; an empty input keeps what is stored. */
function withSecret(key: string, value: string): Record<string, string> {
  return value ? { [key]: value } : {};
}

export function bodyFor(area: Area, forms: Forms): Record<string, unknown> {
  switch (area) {
    case "instance":
      return { ...forms.instance };
    case "ai": {
      const f = forms.ai;
      return {
        provider: f.provider,
        ...withSecret("apiKey", f.apiKey),
        ...(f.modelFast ? { modelFast: f.modelFast } : {}),
        ...(f.modelWriter ? { modelWriter: f.modelWriter } : {}),
        dailyCapUsd: Number(f.dailyCapUsd),
        monthlyCapUsd: Number(f.monthlyCapUsd),
      };
    }
    case "proxy": {
      const f = forms.proxy;
      // Bringing your own proxy means no supplier key: the choice clears it.
      return { provider: f.provider, ...(f.provider === "none" ? { apiKey: "" } : withSecret("apiKey", f.apiKey)) };
    }
    case "email": {
      const f = forms.email;
      if (f.provider === "none") return { provider: "none" };
      return {
        provider: f.provider,
        ...withSecret("apiKey", f.apiKey),
        ...(f.provider === "smtp"
          ? {
              smtpHost: f.smtpHost,
              smtpPort: Number(f.smtpPort),
              smtpUser: f.smtpUser,
              ...withSecret("smtpPassword", f.smtpPassword),
              smtpTls: f.smtpTls,
            }
          : {}),
        fromName: f.fromName,
        fromAddress: f.fromAddress,
      };
    }
    case "storage": {
      const f = forms.storage;
      if (f.provider === "local") return { provider: "local" };
      return {
        provider: "s3",
        s3Endpoint: f.s3Endpoint,
        s3Region: f.s3Region,
        s3Bucket: f.s3Bucket,
        ...withSecret("s3AccessKey", f.s3AccessKey),
        ...withSecret("s3Secret", f.s3Secret),
        ...(f.s3PublicUrl ? { s3PublicUrl: f.s3PublicUrl } : {}),
      };
    }
  }
}

/** Once a secret is stored the input goes blank again and its mask takes over as the placeholder. */
export function clearSecrets(area: Area, forms: Forms): Forms {
  switch (area) {
    case "ai":
      return { ...forms, ai: { ...forms.ai, apiKey: "" } };
    case "proxy":
      return { ...forms, proxy: { ...forms.proxy, apiKey: "" } };
    case "email":
      return { ...forms, email: { ...forms.email, apiKey: "", smtpPassword: "" } };
    case "storage":
      return { ...forms, storage: { ...forms.storage, s3AccessKey: "", s3Secret: "" } };
    default:
      return forms;
  }
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function request<T>(path: string, method: "GET" | "POST" | "PATCH", body?: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) return { ok: false, error: data.error || `The server answered ${response.status}.` };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The server could not be reached." };
  }
}

export async function fetchStatus(): Promise<ApiResult<SetupStatus>> {
  return request<SetupStatus>("/api/setup/status", "GET");
}

type SectionPatch = Partial<Pick<SetupStatus, Area>>;

interface SaveResponse {
  instance?: InstanceSection;
  ai?: AiSection;
  proxy?: ProxySection;
  email?: EmailSection;
  storage?: StorageSection;
}

export async function saveArea(area: Area, forms: Forms): Promise<{ ok: true; patch: SectionPatch } | { ok: false; error: string }> {
  const result = await request<SaveResponse>(`/api/setup/${area}`, "PATCH", bodyFor(area, forms));
  if (!result.ok) return result;
  const patch: SectionPatch = {};
  if (result.data.instance) patch.instance = result.data.instance;
  if (result.data.ai) patch.ai = result.data.ai;
  if (result.data.proxy) patch.proxy = result.data.proxy;
  if (result.data.email) patch.email = result.data.email;
  if (result.data.storage) patch.storage = result.data.storage;
  return { ok: true, patch };
}

interface TestResponse {
  ok: boolean;
  sample?: string;
  countries?: number;
  to?: string;
  url?: string;
  error?: string;
}

/**
 * Runs the test for one area. The AI and proxy tests take the pasted key
 * straight from the form; email and storage go through what is saved, so
 * those two save first, and the caller merges the patch that comes back.
 */
export async function testArea(area: TestArea, forms: Forms): Promise<{ outcome: TestOutcome; patch?: SectionPatch }> {
  let patch: SectionPatch | undefined;
  if (area === "email" || area === "storage") {
    const saved = await saveArea(area, forms);
    if (!saved.ok) return { outcome: { state: "error", detail: saved.error } };
    patch = saved.patch;
  }
  const body =
    area === "ai"
      ? { provider: forms.ai.provider, ...withSecret("apiKey", forms.ai.apiKey), ...(forms.ai.modelFast ? { model: forms.ai.modelFast } : {}) }
      : area === "proxy"
        ? { ...withSecret("apiKey", forms.proxy.apiKey) }
        : {};
  const result = await request<TestResponse>(`/api/setup/${area}/test`, "POST", body);
  if (!result.ok) return { outcome: { state: "error", detail: result.error }, patch };
  const d = result.data;
  if (!d.ok) return { outcome: { state: "error", detail: d.error ?? "The test failed." }, patch };
  const detail = d.sample ?? (d.countries !== undefined ? `${d.countries} countries` : undefined) ?? d.to ?? d.url ?? "ok";
  return { outcome: { state: "ok", detail }, patch };
}

export function summary(status: SetupStatus, forms: Forms): { label: string; value: string }[] {
  const models = `${forms.ai.modelFast || "?"} and ${forms.ai.modelWriter || "?"}`;
  const providerLabel = status.ai.providers.find((p) => p.id === forms.ai.provider)?.label ?? forms.ai.provider;
  const emailLabel = { none: "None", resend: "Resend", smtp: "SMTP", brevo: "Brevo" }[forms.email.provider];
  return [
    { label: "Instance", value: [forms.instance.instanceName, forms.instance.appUrl, forms.instance.timezone].filter(Boolean).join(", ") },
    { label: "AI provider and models", value: `${providerLabel}: ${models}` },
    { label: "Dedicated IP", value: forms.proxy.provider === "proxy-seller" ? "Proxy-Seller" : "My own proxy" },
    { label: "Email", value: forms.email.provider === "none" ? emailLabel : `${emailLabel}, ${forms.email.fromAddress}` },
    { label: "Storage", value: forms.storage.provider === "s3" ? `S3 compatible, ${forms.storage.s3Bucket}` : "Local disk" },
  ];
}
