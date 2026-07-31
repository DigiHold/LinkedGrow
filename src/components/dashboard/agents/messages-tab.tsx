"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/dashboard/ui/page";

/**
 * The messages, and nothing else.
 *
 * This tab shows what the agent sends and lets it be rewritten. It does not
 * describe how the agent decides anything, on purpose: the sequence is the
 * product, and a page explaining it is a page a competitor signs up to read.
 *
 * Two states per step. Written by hand, and it is sent word for word with the
 * placeholders filled in. Left empty, the agent writes it for each person from
 * what they actually posted, and the last one it sent is shown underneath so
 * there is always something real to read.
 */

type Step = {
  key: string;
  title: string;
  /** What the writer needs to know to fill the box, and nothing more. */
  hint: string;
};

const STEPS: Step[] = [
  { key: "hello", title: "After they accept", hint: "Two lines. Nothing asked for." },
  { key: "intro", title: "The first real message", hint: "One question they can answer in a line." },
  { key: "converse", title: "When they answer", hint: "Left empty this one is always written for the reply it answers." },
  { key: "ask", title: "The one ask", hint: "Something small they can take or ignore in a word." },
];

const TOKENS = [
  { token: "{name}", what: "their first name" },
  { token: "{company}", what: "their company" },
  { token: "{jobTitle}", what: "their job title" },
];

const MAX = 1200;

type Payload = {
  sent: Record<string, number>;
  examples: Record<string, { body: string; leadName: string }>;
  invitations: number;
  accepted: number;
};

export function MessagesTab({ agentId }: { agentId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ name: string; company: string; jobTitle: string }>({
    name: "there",
    company: "their company",
    jobTitle: "their role",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/agents/${agentId}/activity?window=all`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => {});
    fetch(`/api/agents/${agentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const raw = json?.agent?.sequence;
        if (typeof raw !== "string") return;
        try {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            setTemplates(parsed as Record<string, string>);
          }
        } catch {
          // A column that cannot be read is an empty set of templates, not a
          // broken screen.
        }
      })
      .catch(() => {});
    // Somebody real to preview against, so {name} reads as a person.
    fetch(`/api/agents/${agentId}/queue`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const first = json?.queue?.[0] ?? json?.nextUp?.[0];
        if (!first?.fullName) return;
        setPreview({
          name: String(first.fullName).split(/\s+/)[0] ?? "there",
          company: first.company ?? "their company",
          jobTitle: first.jobTitle ?? "their role",
        });
      })
      .catch(() => {});
  }, [agentId]);

  useEffect(load, [load]);

  async function save() {
    setBusy(true);
    setError(null);
    // Empty boxes are dropped rather than stored as empty strings, so clearing
    // one hands the step back to the writer.
    const kept: Record<string, string> = {};
    for (const [key, value] of Object.entries(templates)) {
      if (value.trim()) kept[key] = value.trim();
    }
    const res = await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence: JSON.stringify(kept) }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "That did not save.");
    } else {
      setSaved(true);
    }
    setBusy(false);
  }

  function fill(text: string): string {
    return text
      .replace(/\{name\}/g, preview.name)
      .replace(/\{company\}/g, preview.company)
      .replace(/\{jobTitle\}/g, preview.jobTitle);
  }

  const sent = data?.sent ?? {};

  return (
    <div className="mt-6 space-y-3.5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
            What your agent sends
          </h2>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Write a message and it is sent exactly as you wrote it. Leave one
            empty and the agent writes that one itself, for each person.
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          {TOKENS.map((t) => (
            <button
              key={t.token}
              type="button"
              onClick={() => navigator.clipboard?.writeText(t.token)}
              title={`Copy ${t.token}`}
              className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600 dark:text-slate-400"
            >
              {t.token}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
          <Pill>Invitation</Pill>
          <span className="text-[13px] text-slate-500 dark:text-slate-400">
            Sent with no note.
          </span>
          <div className="flex-1" />
          {(data?.invitations ?? 0) > 0 && (
            <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {data?.invitations} sent · {data?.accepted} accepted
            </span>
          )}
        </div>
      </div>

      {STEPS.map((step, i) => {
        const value = templates[step.key] ?? "";
        const example = data?.examples[step.key];
        const count = sent[step.key] ?? 0;
        return (
          <div
            key={step.key}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
              <Pill>Step {i + 1}</Pill>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              {value && <Pill tone="brand">Yours</Pill>}
              <div className="flex-1" />
              {count > 0 && (
                <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {count} sent
                </span>
              )}
            </div>
            <div className="px-4 py-3.5">
              <textarea
                value={value}
                onChange={(e) => {
                  setSaved(false);
                  setTemplates((t) => ({ ...t, [step.key]: e.target.value }));
                }}
                rows={3}
                maxLength={MAX}
                placeholder={step.hint}
                className="w-full rounded-lg border border-border bg-background p-3 text-[13.5px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden dark:text-white"
              />

              {value && (
                <div className="mt-2.5 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.03]">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
                    {fill(value)}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    As {preview.name} will read it
                  </p>
                </div>
              )}

              {!value && example && (
                <div className="mt-2.5 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.03]">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
                    {example.body}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    The last one it wrote, to {example.leadName}
                  </p>
                </div>
              )}

              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-slate-400 tabular-nums dark:text-slate-500">
                  {value.length} / {MAX}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className={cn(
            "rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5",
            busy && "opacity-50"
          )}
        >
          {busy ? "Saving" : "Save messages"}
        </button>
        {saved && (
          <span className="text-[13px] text-emerald-600 dark:text-emerald-400">Saved</span>
        )}
      </div>
    </div>
  );
}
