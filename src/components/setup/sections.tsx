"use client";

/**
 * The five setup areas as field groups, without a heading or a save button:
 * the wizard wraps each in a step and Settings, Instance wraps each in a card.
 * Every sentence on screen comes from the approved wizard copy.
 */
import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/dashboard/ui/page";
import { AnthropicIcon, GeminiIcon, GrokIcon, KimiIcon, OpenAIIcon } from "@/components/dashboard/provider-icons";
import { cn } from "@/lib/utils";
import {
  browserTimezone,
  providerModels,
  type AiForm,
  type EmailForm,
  type EmailProviderId,
  type InstanceForm,
  type ProviderOption,
  type ProxyForm,
  type StorageForm,
  type TestOutcome,
} from "./model";

const PROVIDER_ICONS: Record<string, () => React.JSX.Element> = {
  anthropic: AnthropicIcon,
  openai: OpenAIIcon,
  google: GeminiIcon,
  grok: GrokIcon,
  kimi: KimiIcon,
};

const EMAIL_PROVIDERS: { id: EmailProviderId; label: string }[] = [
  { id: "resend", label: "Resend" },
  { id: "smtp", label: "SMTP" },
  { id: "none", label: "None" },
];

const hintClass = "text-[13px] leading-relaxed text-slate-500 dark:text-slate-400";

function pickClass(picked: boolean): string {
  return cn(
    "px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 relative",
    picked
      ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
  );
}

/** What a test answered, in place, under its button. */
export function TestResult({ outcome, testId }: { outcome: TestOutcome; testId: string }) {
  if (outcome.state === "idle") return null;
  if (outcome.state === "running") {
    return (
      <p data-testid={testId} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
      </p>
    );
  }
  const ok = outcome.state === "ok";
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex items-start gap-2 rounded-lg p-3 text-sm break-all",
        ok
          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
          : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
      )}
    >
      {ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{outcome.detail}</span>
    </div>
  );
}

function TestRow({
  label,
  hint,
  outcome,
  onTest,
  testId,
  disabled,
}: {
  label: string;
  hint: string;
  outcome: TestOutcome;
  onTest: () => void;
  testId: string;
  disabled?: boolean;
}) {
  const running = outcome.state === "running";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={onTest} disabled={running || disabled}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {label}
        </Button>
        <p className={hintClass}>{hint}</p>
      </div>
      <TestResult outcome={outcome} testId={testId} />
    </div>
  );
}

export function InstanceFields({ form, onChange }: { form: InstanceForm; onChange: (patch: Partial<InstanceForm>) => void }) {
  const zones = useMemo(() => {
    try {
      const list = Intl.supportedValuesOf("timeZone");
      const own = browserTimezone();
      return list.includes(own) || !own ? list : [own, ...list];
    } catch {
      return [form.timezone || "UTC"];
    }
  }, [form.timezone]);

  return (
    <>
      <Field label="Instance name" hint="Shown in the sidebar and in the emails this instance sends." htmlFor="instanceName">
        <Input id="instanceName" value={form.instanceName} onChange={(e) => onChange({ instanceName: e.target.value })} maxLength={80} />
      </Field>
      <Field label="App URL" hint="The address in your browser bar, without a path. Behind a reverse proxy it is your https domain." htmlFor="appUrl">
        <Input id="appUrl" value={form.appUrl} onChange={(e) => onChange({ appUrl: e.target.value })} maxLength={300} inputMode="url" />
      </Field>
      <Field label="Timezone" hint="Where you are, so daily limits and reports reset at your midnight." htmlFor="timezone">
        <Select value={form.timezone} onValueChange={(timezone) => onChange({ timezone })}>
          <SelectTrigger id="timezone" className="w-full text-left">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field
        label="Admin email"
        hint="Where operational alerts go: a supplier balance that runs low, a renewal that fails, a LinkedIn control that stopped answering."
        htmlFor="adminEmail"
      >
        <Input id="adminEmail" type="email" value={form.adminEmail} onChange={(e) => onChange({ adminEmail: e.target.value })} maxLength={254} />
      </Field>
    </>
  );
}

export function AiFields({
  form,
  onChange,
  providers,
  keyMask,
  outcome,
  onTest,
}: {
  form: AiForm;
  onChange: (patch: Partial<AiForm>) => void;
  providers: ProviderOption[];
  keyMask: string | null;
  outcome: TestOutcome;
  onTest: () => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  const pick = (id: string) => {
    const models = providerModels(providers, id);
    onChange({ provider: id, modelFast: models.fast, modelWriter: models.writer });
  };

  return (
    <>
      <Field label="Provider">
        <div className="flex flex-wrap gap-2">
          {providers.map((provider) => {
            const Icon = PROVIDER_ICONS[provider.id];
            const picked = provider.id === form.provider;
            return (
              <button key={provider.id} type="button" onClick={() => pick(provider.id)} aria-pressed={picked} className={pickClass(picked)}>
                {Icon ? <Icon /> : null}
                {provider.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="API key" hint="Stored encrypted on this server and never shown again; only its last 4 characters appear in Settings." htmlFor="apiKey">
        <Input
          id="apiKey"
          type="password"
          autoComplete="off"
          value={form.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
          placeholder={keyMask ?? ""}
          maxLength={1000}
        />
      </Field>

      <TestRow
        label="Test the key"
        hint="We send one short request and show you the answer."
        outcome={outcome}
        onTest={onTest}
        testId="ai-test-result"
        disabled={!form.apiKey && !keyMask}
      />

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
          className="flex items-center gap-1 text-[13px] font-medium text-slate-900 dark:text-white"
        >
          Advanced
          {advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <p className={hintClass}>
          Two models do the work: a cheap one sorts and scores profiles, a better one writes anything a person will read. The defaults are current models from your provider; change them only if you know why.
        </p>
        {advanced ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fast model" htmlFor="modelFast">
              <Input id="modelFast" value={form.modelFast} onChange={(e) => onChange({ modelFast: e.target.value })} maxLength={80} />
            </Field>
            <Field label="Writer model" htmlFor="modelWriter">
              <Input id="modelWriter" value={form.modelWriter} onChange={(e) => onChange({ modelWriter: e.target.value })} maxLength={80} />
            </Field>
          </div>
        ) : (
          <dl className="grid gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Fast model</dt>
              <dd className="font-mono text-slate-900 dark:text-white break-all">{form.modelFast}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Writer model</dt>
              <dd className="font-mono text-slate-900 dark:text-white break-all">{form.modelWriter}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Daily ceiling per agent (USD)" htmlFor="dailyCapUsd">
            <Input
              id="dailyCapUsd"
              type="number"
              inputMode="decimal"
              min={0.1}
              max={1000}
              step={0.1}
              value={form.dailyCapUsd}
              onChange={(e) => onChange({ dailyCapUsd: e.target.value })}
            />
          </Field>
          <Field label="Monthly ceiling per LinkedIn account (USD)" htmlFor="monthlyCapUsd">
            <Input
              id="monthlyCapUsd"
              type="number"
              inputMode="decimal"
              min={0.1}
              max={1000}
              step={0.1}
              value={form.monthlyCapUsd}
              onChange={(e) => onChange({ monthlyCapUsd: e.target.value })}
            />
          </Field>
        </div>
        <p className={hintClass}>
          Spending limits on your own key, so a busy agent never turns into a surprise invoice. The defaults are 1 dollar a day per agent and 12 dollars a month per account.
        </p>
      </div>
    </>
  );
}

export function ProxyFields({
  form,
  onChange,
  keyMask,
  serverIp,
  outcome,
  onTest,
}: {
  form: ProxyForm;
  onChange: (patch: Partial<ProxyForm>) => void;
  keyMask: string | null;
  serverIp: string | null;
  outcome: TestOutcome;
  onTest: () => void;
}) {
  return (
    <Tabs value={form.provider === "proxy-seller" ? "buy" : "own"} onValueChange={(v) => onChange({ provider: v === "buy" ? "proxy-seller" : "none" })}>
      <TabsList className="grid h-auto w-full grid-cols-2">
        <TabsTrigger value="buy">Buy through Proxy-Seller</TabsTrigger>
        <TabsTrigger value="own">I bring my own proxy</TabsTrigger>
      </TabsList>
      <TabsContent value="buy" className="mt-6 space-y-6">
        <Field label="Proxy-Seller API key" hint="Create an account at proxy-seller.com, add credit, then copy the API key from the account page." htmlFor="proxySellerKey">
          <Input
            id="proxySellerKey"
            type="password"
            autoComplete="off"
            value={form.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={keyMask ?? ""}
            maxLength={1000}
          />
        </Field>
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm text-foreground">
            Their API only answers from addresses on your allowlist. Add this server&apos;s public address, shown here, in the Proxy-Seller dashboard before you test.
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            This server&apos;s public address:{" "}
            <span className="font-mono text-slate-900 dark:text-white" data-testid="server-ip">
              {serverIp ?? "?"}
            </span>
          </p>
        </div>
        <TestRow
          label="Test the key"
          hint="We ask them which countries they can sell you an address in."
          outcome={outcome}
          onTest={onTest}
          testId="proxy-test-result"
          disabled={!form.apiKey && !keyMask}
        />
      </TabsContent>
      <TabsContent value="own" className="mt-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Leave the key empty. When you connect a LinkedIn account, an advanced panel takes the host, port, username and password of a proxy you own. The reputation of that address is yours, and LinkedGrow never renews it.
        </p>
      </TabsContent>
    </Tabs>
  );
}

export function EmailFields({
  form,
  onChange,
  keyMask,
  passwordMask,
  outcome,
  onTest,
}: {
  form: EmailForm;
  onChange: (patch: Partial<EmailForm>) => void;
  keyMask: string | null;
  passwordMask: string | null;
  outcome: TestOutcome;
  onTest: () => void;
}) {
  return (
    <>
      <Field label="Provider">
        <div className="flex flex-wrap gap-2">
          {EMAIL_PROVIDERS.map((p) => {
            const picked = p.id === form.provider;
            return (
              <button key={p.id} type="button" onClick={() => onChange({ provider: p.id })} aria-pressed={picked} className={pickClass(picked)}>
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>

      {form.provider === "resend" || form.provider === "brevo" ? (
        <Field label="API key" hint="From the Resend dashboard, with a verified sending domain." htmlFor="emailApiKey">
          <Input
            id="emailApiKey"
            type="password"
            autoComplete="off"
            value={form.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={keyMask ?? ""}
            maxLength={1000}
          />
        </Field>
      ) : null}

      {form.provider === "smtp" ? (
        <div className="space-y-4">
          <p className={hintClass}>Any mail server works, including the one from your hosting provider.</p>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Host" htmlFor="smtpHost">
              <Input id="smtpHost" value={form.smtpHost} onChange={(e) => onChange({ smtpHost: e.target.value })} maxLength={253} />
            </Field>
            <Field label="Port" htmlFor="smtpPort">
              <Input id="smtpPort" type="number" min={1} max={65535} value={form.smtpPort} onChange={(e) => onChange({ smtpPort: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" htmlFor="smtpUser">
              <Input id="smtpUser" autoComplete="off" value={form.smtpUser} onChange={(e) => onChange({ smtpUser: e.target.value })} maxLength={200} />
            </Field>
            <Field label="Password" htmlFor="smtpPassword">
              <Input
                id="smtpPassword"
                type="password"
                autoComplete="off"
                value={form.smtpPassword}
                onChange={(e) => onChange({ smtpPassword: e.target.value })}
                placeholder={passwordMask ?? ""}
                maxLength={1000}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="smtpTls" checked={form.smtpTls} onCheckedChange={(smtpTls) => onChange({ smtpTls })} />
            <label htmlFor="smtpTls" className="text-[13px] font-medium text-slate-900 dark:text-white">
              Use TLS
            </label>
          </div>
        </div>
      ) : null}

      {form.provider !== "none" ? (
        <>
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From name" htmlFor="fromName">
                <Input id="fromName" value={form.fromName} onChange={(e) => onChange({ fromName: e.target.value })} maxLength={80} />
              </Field>
              <Field label="From address" htmlFor="fromAddress">
                <Input id="fromAddress" type="email" value={form.fromAddress} onChange={(e) => onChange({ fromAddress: e.target.value })} maxLength={254} />
              </Field>
            </div>
            <p className={hintClass}>What recipients see. The address must belong to a domain your provider is allowed to send from.</p>
          </div>
          <TestRow label="Send a test email" hint="One message to your admin address, right now." outcome={outcome} onTest={onTest} testId="email-test-result" />
        </>
      ) : null}
    </>
  );
}

function StorageOption({
  picked,
  onClick,
  label,
  hint,
}: {
  picked: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={picked}
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
        picked
          ? "border-cyan-500 bg-cyan-50/60 dark:border-cyan-400/60 dark:bg-cyan-400/10"
          : "border-border hover:border-slate-300 dark:hover:border-white/20"
      )}
    >
      <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </button>
  );
}

export function StorageFields({
  form,
  onChange,
  accessKeyMask,
  secretMask,
  outcome,
  onTest,
}: {
  form: StorageForm;
  onChange: (patch: Partial<StorageForm>) => void;
  accessKeyMask: string | null;
  secretMask: string | null;
  outcome: TestOutcome;
  onTest: () => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <StorageOption
          picked={form.provider === "local"}
          onClick={() => onChange({ provider: "local" })}
          label="Local disk (default)"
          hint="Nothing to configure. Back up the uploads volume with the database."
        />
        <StorageOption picked={form.provider === "s3"} onClick={() => onChange({ provider: "s3" })} label="S3 compatible" />
      </div>

      {form.provider === "s3" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Endpoint" htmlFor="s3Endpoint">
              <Input id="s3Endpoint" value={form.s3Endpoint} onChange={(e) => onChange({ s3Endpoint: e.target.value })} maxLength={500} inputMode="url" />
            </Field>
            <Field label="Region" htmlFor="s3Region">
              <Input id="s3Region" value={form.s3Region} onChange={(e) => onChange({ s3Region: e.target.value })} maxLength={64} />
            </Field>
            <Field label="Bucket" htmlFor="s3Bucket">
              <Input id="s3Bucket" value={form.s3Bucket} onChange={(e) => onChange({ s3Bucket: e.target.value })} maxLength={128} />
            </Field>
            <Field label="Public URL" htmlFor="s3PublicUrl">
              <Input id="s3PublicUrl" value={form.s3PublicUrl} onChange={(e) => onChange({ s3PublicUrl: e.target.value })} maxLength={500} inputMode="url" />
            </Field>
            <Field label="Access key" htmlFor="s3AccessKey">
              <Input
                id="s3AccessKey"
                type="password"
                autoComplete="off"
                value={form.s3AccessKey}
                onChange={(e) => onChange({ s3AccessKey: e.target.value })}
                placeholder={accessKeyMask ?? ""}
                maxLength={1000}
              />
            </Field>
            <Field label="Secret key" htmlFor="s3Secret">
              <Input
                id="s3Secret"
                type="password"
                autoComplete="off"
                value={form.s3Secret}
                onChange={(e) => onChange({ s3Secret: e.target.value })}
                placeholder={secretMask ?? ""}
                maxLength={1000}
              />
            </Field>
          </div>
          <p className={hintClass}>The public URL is the address files are read from, with the bucket already in it.</p>
        </div>
      ) : null}

      <TestRow label="Test the storage" hint="We write one small file, read it back, and delete it." outcome={outcome} onTest={onTest} testId="storage-test-result" />
    </>
  );
}
