"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepRail } from "@/components/dashboard/step-rail";
import {
  applyPatch,
  clearSecrets,
  fetchStatus,
  formsFrom,
  IDLE,
  request,
  saveArea,
  summary,
  testArea,
  type Area,
  type Forms,
  type SetupStatus,
  type TestArea,
  type TestOutcome,
} from "@/components/setup/model";
import { COPY } from "@/components/setup/copy";
import { AiFields, EmailFields, InstanceFields, ProxyFields, StorageFields } from "@/components/setup/sections";

const STEPS = [
  { num: 1, label: "Instance" },
  { num: 2, label: "AI key" },
  { num: 3, label: "Dedicated IP" },
  { num: 4, label: "Email" },
  { num: 5, label: "Storage" },
  { num: 6, label: "Review" },
];

const AREA_OF_STEP: Record<number, Area | undefined> = { 1: "instance", 2: "ai", 3: "proxy", 4: "email", 5: "storage" };
const SKIPPABLE = new Set([3, 4, 5]);

type Tests = Record<TestArea, TestOutcome>;
const NO_TESTS: Tests = { ai: IDLE, proxy: IDLE, email: IDLE, storage: IDLE };

export function SetupWizard({ adminEmail }: { adminEmail: string }) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [forms, setForms] = useState<Forms | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState<Tests>(NO_TESTS);
  const [closeSignups, setCloseSignups] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchStatus().then((result) => {
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

  // Step 3 shows the address this server calls out from, which only the
  // status route looks up; step 6 sums up what is saved, not what is typed.
  useEffect(() => {
    if (step !== 3 && step !== 6) return;
    let cancelled = false;
    void fetchStatus({ withIp: step === 3 }).then((result) => {
      if (cancelled || !result.ok) return;
      setStatus(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [step]);

  const patchForm = <A extends Area>(area: A, patch: Partial<Forms[A]>) => {
    setForms((f) => (f ? { ...f, [area]: { ...f[area], ...patch } } : f));
    setError(null);
  };

  const save = async (area: Area): Promise<boolean> => {
    if (!forms) return false;
    setSaving(true);
    const result = await saveArea(area, forms);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setStatus((s) => (s ? applyPatch(s, result.patch) : s));
    setForms((f) => (f ? clearSecrets(area, f) : f));
    return true;
  };

  const next = async () => {
    const area = AREA_OF_STEP[step];
    if (area && !(await save(area))) return;
    setError(null);
    setStep(step + 1);
  };

  const skip = () => {
    setError(null);
    setStep(step + 1);
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

  const finish = async () => {
    setSaving(true);
    const result = await request<{ next: string }>("/api/setup/complete", "POST", { allowSignups: !closeSignups });
    if (!result.ok) {
      setSaving(false);
      setError(result.error);
      return;
    }
    window.location.assign(result.data.next);
  };

  return (
    // The same room as the agent wizard: no sidebar, no topbar, nothing to
    // click that is not the next step.
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-background">
      <div className="mx-auto w-full max-w-[960px] px-6 pb-24 pt-8 sm:pt-12">
        <StepRail steps={STEPS} current={step} onSelect={(n) => setStep(n)} className="mt-2 justify-center" />

        <div className="mx-auto w-full max-w-[620px]">
          {loadError && (
            <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {loadError}
            </div>
          )}

          {!loadError && (!status || !forms) && (
            <div className="mt-16 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
            </div>
          )}

          {status && forms && (
            <>
              {step === 1 && (
                <StepBody title={COPY.instance.heading} lead={COPY.instance.intro}>
                  <InstanceFields form={forms.instance} onChange={(p) => patchForm("instance", p)} />
                </StepBody>
              )}

              {step === 2 && (
                <StepBody title={COPY.ai.heading} lead={COPY.ai.intro}>
                  <AiFields
                    form={forms.ai}
                    onChange={(p) => patchForm("ai", p)}
                    providers={status.ai.providers}
                    keyMask={status.ai.keyMask}
                    outcome={tests.ai}
                    onTest={() => void runTest("ai")}
                  />
                </StepBody>
              )}

              {step === 3 && (
                <StepBody title={COPY.proxy.heading} lead={COPY.proxy.intro}>
                  <ProxyFields
                    form={forms.proxy}
                    onChange={(p) => patchForm("proxy", p)}
                    keyMask={status.proxy.keyMask}
                    serverIp={status.proxy.serverIp}
                    outcome={tests.proxy}
                    onTest={() => void runTest("proxy")}
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400">{COPY.proxy.skip}</p>
                </StepBody>
              )}

              {step === 4 && (
                <StepBody title={COPY.email.heading} lead={COPY.email.intro}>
                  <EmailFields
                    form={forms.email}
                    onChange={(p) => patchForm("email", p)}
                    keyMask={status.email.keyMask}
                    passwordMask={status.email.passwordMask}
                    outcome={tests.email}
                    onTest={() => void runTest("email")}
                  />
                </StepBody>
              )}

              {step === 5 && (
                <StepBody title={COPY.storage.heading} lead={COPY.storage.intro}>
                  <StorageFields
                    form={forms.storage}
                    onChange={(p) => patchForm("storage", p)}
                    accessKeyMask={status.storage.accessKeyMask}
                    secretMask={status.storage.secretMask}
                    outcome={tests.storage}
                    onTest={() => void runTest("storage")}
                  />
                </StepBody>
              )}

              {step === 6 && (
                <StepBody title={COPY.review.heading}>
                  <dl className="divide-y divide-border rounded-xl border border-border">
                    {summary(status).map((row) => (
                      <div key={row.label} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr] sm:gap-4">
                        <dt className="text-sm text-slate-500 dark:text-slate-400">{row.label}</dt>
                        <dd className="text-sm text-slate-900 dark:text-white break-words">{row.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex items-start gap-3">
                    <input
                      id="closeSignups"
                      type="checkbox"
                      checked={closeSignups}
                      onChange={(e) => setCloseSignups(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border accent-cyan-600"
                    />
                    <div className="space-y-1">
                      <label htmlFor="closeSignups" className="block text-[13px] font-medium text-slate-900 dark:text-white">
                        Close sign ups
                      </label>
                      <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{COPY.review.signups}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400">{COPY.review.note}</p>
                </StepBody>
              )}

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-center">
                {step < 6 ? (
                  <Button onClick={() => void next()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => void finish()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Finish setup
                  </Button>
                )}
                {SKIPPABLE.has(step) && (
                  <Button variant="ghost" onClick={skip} disabled={saving}>
                    Skip
                  </Button>
                )}
                {step > 1 && (
                  <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={saving}>
                    Back
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** A titled step, the same shape as the agent wizard's. */
function StepBody({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="text-center text-[26px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mx-auto mt-3 max-w-[46ch] text-center text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">{lead}</p>}
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}
