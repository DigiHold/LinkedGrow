"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FieldActions, PageShell } from "@/components/dashboard/ui/page";
import {
  applyPatch,
  clearSecrets,
  fetchStatus,
  formsFrom,
  IDLE,
  request,
  saveArea,
  testArea,
  type Area,
  type Forms,
  type SetupStatus,
  type TestArea,
  type TestOutcome,
} from "@/components/setup/model";
import { COPY } from "@/components/setup/copy";
import { AiFields, EmailFields, InstanceFields, ProxyFields, StorageFields } from "@/components/setup/sections";
import { cn } from "@/lib/utils";

type Tests = Record<TestArea, TestOutcome>;
const NO_TESTS: Tests = { ai: IDLE, proxy: IDLE, email: IDLE, storage: IDLE };
type Notice = { type: "success" | "error"; text: string };

export function InstanceSettingsContent({ adminEmail }: { adminEmail: string }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [forms, setForms] = useState<Forms | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Area | "signups" | "cron" | null>(null);
  const [notices, setNotices] = useState<Partial<Record<Area | "signups" | "cron", Notice>>>({});
  const [tests, setTests] = useState<Tests>(NO_TESTS);

  useEffect(() => {
    let cancelled = false;
    // With the address: the Proxy-Seller card tells the administrator to allowlist it before testing.
    void fetchStatus({ withIp: true }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setStatus(result.data);
      setForms(formsFrom(result.data, { adminEmail }));
    });
    return () => {
      cancelled = true;
    };
  }, [adminEmail]);

  const patchForm = <A extends Area>(area: A, patch: Partial<Forms[A]>) => {
    setForms((f) => (f ? { ...f, [area]: { ...f[area], ...patch } } : f));
    setNotices((n) => ({ ...n, [area]: undefined }));
  };

  const save = async (area: Area) => {
    if (!forms) return;
    setSaving(area);
    const result = await saveArea(area, forms);
    setSaving(null);
    if (!result.ok) {
      setNotices((n) => ({ ...n, [area]: { type: "error", text: result.error } }));
      return;
    }
    setStatus((s) => (s ? applyPatch(s, result.patch) : s));
    setForms((f) => (f ? clearSecrets(area, f) : f));
    setNotices((n) => ({ ...n, [area]: { type: "success", text: "Saved" } }));
  };

  const runTest = async (area: TestArea) => {
    if (!forms) return;
    setTests((t) => ({ ...t, [area]: { state: "running" } }));
    const result = await testArea(area, forms);
    if (result.patch) {
      const patch = result.patch;
      setStatus((s) => (s ? applyPatch(s, patch) : s));
      setForms((f) => (f ? clearSecrets(area, f) : f));
    }
    setTests((t) => ({ ...t, [area]: result.outcome }));
  };

  const toggleSignups = async (allowSignups: boolean) => {
    setSaving("signups");
    const result = await request<{ allowSignups: boolean }>("/api/setup/signups", "PATCH", { allowSignups });
    setSaving(null);
    if (!result.ok) {
      setNotices((n) => ({ ...n, signups: { type: "error", text: result.error } }));
      return;
    }
    setStatus((s) => (s ? { ...s, allowSignups: result.data.allowSignups } : s));
    setNotices((n) => ({ ...n, signups: { type: "success", text: "Saved" } }));
  };

  const rotateCron = async () => {
    setSaving("cron");
    const result = await request<{ secret: string | null }>("/api/setup/cron-secret", "POST");
    setSaving(null);
    if (!result.ok) {
      setNotices((n) => ({ ...n, cron: { type: "error", text: result.error } }));
      return;
    }
    setStatus((s) => (s ? { ...s, cronSecretMask: result.data.secret } : s));
    setNotices((n) => ({ ...n, cron: { type: "success", text: "Saved" } }));
  };

  return (
    <PageShell className="space-y-6">
      <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[32px] dark:text-white">Instance</h1>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {loadError}
        </div>
      )}

      {!loadError && (!status || !forms) && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
        </div>
      )}

      {status && forms && (
        <>
          <Section heading={COPY.instance.heading} intro={COPY.instance.intro} notice={notices.instance}>
            <InstanceFields form={forms.instance} onChange={(p) => patchForm("instance", p)} />
            <SaveRow saving={saving === "instance"} onSave={() => void save("instance")} />
          </Section>

          <Section heading={COPY.ai.heading} intro={COPY.ai.intro} notice={notices.ai}>
            <AiFields
              form={forms.ai}
              onChange={(p) => patchForm("ai", p)}
              providers={status.ai.providers}
              keyMask={status.ai.keyMask}
              outcome={tests.ai}
              onTest={() => void runTest("ai")}
            />
            <SaveRow saving={saving === "ai"} onSave={() => void save("ai")} />
          </Section>

          <Section heading={COPY.proxy.heading} intro={COPY.proxy.intro} notice={notices.proxy}>
            <ProxyFields
              form={forms.proxy}
              onChange={(p) => patchForm("proxy", p)}
              keyMask={status.proxy.keyMask}
              serverIp={status.proxy.serverIp}
              outcome={tests.proxy}
              onTest={() => void runTest("proxy")}
            />
            <SaveRow saving={saving === "proxy"} onSave={() => void save("proxy")} />
          </Section>

          <Section heading={COPY.email.heading} intro={COPY.email.intro} notice={notices.email}>
            <EmailFields
              form={forms.email}
              onChange={(p) => patchForm("email", p)}
              keyMask={status.email.keyMask}
              passwordMask={status.email.passwordMask}
              outcome={tests.email}
              onTest={() => void runTest("email")}
            />
            <SaveRow saving={saving === "email"} onSave={() => void save("email")} />
          </Section>

          <Section heading={COPY.storage.heading} intro={COPY.storage.intro} notice={notices.storage}>
            <StorageFields
              form={forms.storage}
              onChange={(p) => patchForm("storage", p)}
              accessKeyMask={status.storage.accessKeyMask}
              secretMask={status.storage.secretMask}
              outcome={tests.storage}
              onTest={() => void runTest("storage")}
            />
            <SaveRow saving={saving === "storage"} onSave={() => void save("storage")} />
          </Section>

          <Section heading="Sign ups" intro={COPY.review.signups} notice={notices.signups}>
            <div className="flex items-center gap-3">
              <Switch id="allowSignups" checked={status.allowSignups} onCheckedChange={(v) => void toggleSignups(v)} disabled={saving === "signups"} />
              <label htmlFor="allowSignups" className="text-[13px] font-medium text-slate-900 dark:text-white">
                Allow sign ups
              </label>
            </div>
          </Section>

          <Section heading="Cron secret" notice={notices.cron}>
            <p className="font-mono text-sm text-slate-900 dark:text-white" data-testid="cron-secret-mask">
              {status.cronSecretMask ?? "?"}
            </p>
            <FieldActions>
              <Button type="button" variant="outline" onClick={() => void rotateCron()} disabled={saving === "cron"}>
                {saving === "cron" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Regenerate cron secret
              </Button>
            </FieldActions>
          </Section>
        </>
      )}
    </PageShell>
  );
}

function Section({ heading, intro, notice, children }: { heading: string; intro?: string; notice?: Notice; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
        {intro ? <CardDescription>{intro}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {notice && (
          <div
            className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              notice.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}
          >
            {notice.type === "success" ? <Check className="w-4 h-4" /> : null}
            {notice.text}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function SaveRow({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <FieldActions>
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save
      </Button>
    </FieldActions>
  );
}
