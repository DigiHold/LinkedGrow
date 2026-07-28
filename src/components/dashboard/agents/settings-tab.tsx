"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Panel,
  PanelTitle,
  Field,
  FieldActions,
  Pill,
} from "@/components/dashboard/ui/page";
import { LinkedInAccountsPanel } from "@/components/dashboard/linkedin/accounts-panel";

/**
 * Agent settings.
 *
 * The sending account is editable here. It used to be frozen at creation, on
 * the grounds that moving an agent between sessions is the shape that gets a
 * profile restricted, but freezing it did not stop anyone: it pushed them to
 * delete the agent and rebuild it, which loses every lead it had found to
 * change one field. Moving it is the same operation with the history kept, and
 * the account's own warm-up still governs the pace.
 *
 * The daily cap stays read-only, because it belongs to the account rather than
 * the agent, and every agent on an account divides one budget.
 */

export type AgentSettings = {
  name: string;
  icpSummary: string | null;
  goal: string;
  tone: string;
  matchLevel: string;
  skipConnected: boolean;
  reviewMode: boolean;
  smartLeadFinder: boolean;
  dailyInviteCap: number;
  accountAgentCount: number;
  accountCountry: string;
  linkedinAccountId: string;
};

const GOALS = [
  {
    value: "relationship",
    label: "Start conversations",
    hint: "Build a relationship first, ask later",
  },
  {
    value: "meeting",
    label: "Book calls and demos",
    hint: "Comes to the ask sooner",
  },
];

const TONES = [
  { value: "professional", label: "Professional", hint: "Formal and polished" },
  { value: "conversational", label: "Conversational", hint: "Friendly and casual" },
  { value: "direct", label: "Direct", hint: "Bold and confident" },
];

const MATCH_LEVELS = [
  { value: "any", label: "Any match", hint: "More people, looser fit" },
  { value: "close", label: "Close match", hint: "Fewer people, better fit" },
  { value: "exact", label: "Exact match", hint: "Only who you described" },
];

export function SettingsTab({
  agentId,
  settings,
  onSaved,
}: {
  agentId: string;
  settings: AgentSettings;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        icpSummary: form.icpSummary,
        goal: form.goal,
        tone: form.tone,
        matchLevel: form.matchLevel,
        skipConnected: form.skipConnected,
        reviewMode: form.reviewMode,
        smartLeadFinder: form.smartLeadFinder,
        linkedinAccountId: form.linkedinAccountId,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "That did not save.");
    } else {
      setSaved(true);
      onSaved();
    }
    setBusy(false);
  }

  return (
    <div className="mt-6 space-y-4">
      <Panel>
        <PanelTitle>Who it is looking for</PanelTitle>
        <div className="space-y-5">
          <Field
            label="Agent name"
            hint="Only you see it. Name it after the audience it targets."
            htmlFor="agent-name"
          >
            <input
              id="agent-name"
              value={form.name}
              maxLength={80}
              onChange={(e) => set("name", e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden dark:text-white"
            />
          </Field>

          <Field
            label="The audience"
            hint="Describe them the way you would to a new salesperson. Job titles, company size, country, and what they are dealing with."
            htmlFor="agent-icp"
          >
            <textarea
              id="agent-icp"
              value={form.icpSummary ?? ""}
              maxLength={1000}
              rows={4}
              onChange={(e) => set("icpSummary", e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3.5 text-sm leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-hidden dark:text-white"
            />
          </Field>

          <Field
            label="How strict the match should be"
            hint="Stricter means fewer people, and a higher share of them worth contacting."
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {MATCH_LEVELS.map((m) => (
                <Choice
                  key={m.value}
                  active={form.matchLevel === m.value}
                  label={m.label}
                  hint={m.hint}
                  onClick={() => set("matchLevel", m.value)}
                />
              ))}
            </div>
          </Field>
        </div>
      </Panel>

      <Panel>
        <PanelTitle description="This changes how the AI writes. It does not change the sequence.">
          What the messages should do
        </PanelTitle>
        <div className="space-y-5">
          <Field label="Goal">
            <div className="grid gap-2 sm:grid-cols-2">
              {GOALS.map((g) => (
                <Choice
                  key={g.value}
                  active={form.goal === g.value}
                  label={g.label}
                  hint={g.hint}
                  onClick={() => set("goal", g.value)}
                />
              ))}
            </div>
          </Field>
          <Field label="Tone">
            <div className="grid gap-2 sm:grid-cols-3">
              {TONES.map((t) => (
                <Choice
                  key={t.value}
                  active={form.tone === t.value}
                  label={t.label}
                  hint={t.hint}
                  onClick={() => set("tone", t.value)}
                />
              ))}
            </div>
          </Field>
        </div>
      </Panel>

      <Panel>
        <PanelTitle description="Your agent never contacts anyone these rules cover.">
          People to leave alone
        </PanelTitle>
        <div className="space-y-3">
          <Toggle
            label="People you are already connected to"
            hint="This campaign is for meeting new people. Your existing network deserves a different message, not a cold script."
            checked={form.skipConnected}
            onChange={(v) => set("skipConnected", v)}
          />
          <Toggle
            label="Approve every person before the agent contacts them"
            hint="Nothing goes out until you say so. If you stop reviewing, the agent stops sending."
            checked={form.reviewMode}
            onChange={(v) => set("reviewMode", v)}
          />
          <Toggle
            label="Let the agent find new sources on its own"
            hint="It watches which sources earn replies and looks for more people like the ones who answered."
            checked={form.smartLeadFinder}
            onChange={(v) => set("smartLeadFinder", v)}
          />
        </div>
      </Panel>

      <Panel>
        <PanelTitle description="Pick the profile this agent works from. Moving it to another account keeps every lead it has already found, and the new account's own warm-up sets the pace from there.">
          The account it sends from
        </PanelTitle>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dedicated address in {form.accountCountry}
            {form.accountAgentCount > 1
              ? `, shared with ${form.accountAgentCount - 1} other agent${form.accountAgentCount > 2 ? "s" : ""}`
              : ""}
          </p>
          <Pill>{form.dailyInviteCap} invitations a day</Pill>
        </div>

        <LinkedInAccountsPanel
          mode="pick"
          onSelect={(id) => set("linkedinAccountId", id)}
          selectedId={form.linkedinAccountId}
        />
      </Panel>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          {error}
        </div>
      )}

      <FieldActions>
        <button
          onClick={save}
          disabled={busy}
          className="rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {busy ? "Saving" : "Save changes"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            Saved
          </span>
        )}
      </FieldActions>
    </div>
  );
}

function Choice({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3.5 text-left transition-colors",
        active
          ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-500/10"
          : "border-border hover:bg-slate-50 dark:hover:bg-white/5"
      )}
    >
      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
        {label}
      </span>
      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
        {hint}
      </span>
    </button>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-white/15"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-4"
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      </span>
    </button>
  );
}
