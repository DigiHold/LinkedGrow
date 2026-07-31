"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Panel,
  PanelTitle,
  Field,
  FieldActions,
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
  observeOnly: boolean;
  jobRoles: string | null;
  industries: string | null;
  locations: string | null;
  companySizes: string | null;
  timezone: string;
  workdayDays: string;
  workdayStart: number;
  workdayEnd: number;
  warmupStartPerDay: number | null;
  warmupIncrementPerWeek: number | null;
  warmupWeeks: number | null;
  dailyInviteCap: number;
  accountAgentCount: number;
  accountCountry: string;
  accountName: string | null;
  accountAvatar: string | null;
  linkedinAccountId: string;
};

const PICKED =
  "rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white transition-colors dark:bg-white dark:text-slate-900";
const UNPICKED =
  "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5";

function splitCsv(value: string): string[] {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

/** Twenty-four options, which a native select renders better than anything hand-rolled. */
/**
 * Hours in the list, minutes in the column.
 *
 * The working window is stored as minutes from midnight, 480 for 08:00, and
 * this list offered the 24 hours as 0 to 23. So a saved 480 matched no option
 * and the browser fell back to the first one: every agent read "00:00 to
 * 00:00" here while the overview correctly said 8:00 to 22:00. Worse than a
 * display bug, because saving that screen wrote 9 back as nine MINUTES past
 * midnight, leaving an agent a window eight minutes long in which it could
 * never do anything.
 */
function HourSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={Math.round(value / 60)}
      onChange={(e) => onChange(Number(e.target.value) * 60)}
      className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-slate-900 dark:text-white"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>
          {String(h).padStart(2, "0")}:00
        </option>
      ))}
    </select>
  );
}

/** Empty means no override, which is not the same as zero. */
function NumberBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
      {label}
      <input
        inputMode="numeric"
        value={value ?? ""}
        placeholder="auto"
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "");
          onChange(raw === "" ? null : Number(raw));
        }}
        className="h-11 w-20 rounded-xl border border-border bg-background px-3 text-sm text-slate-900 dark:text-white"
      />
    </label>
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];

/**
 * The zones people actually run accounts from.
 *
 * A free-text field here is a trap: one typo and the worker cannot read the
 * zone, so the working window silently falls back and the agent runs at the
 * wrong hours. Whatever is already stored stays selectable even if it is not
 * on this list.
 */
const TIMEZONES = [
  "Europe/Paris",
  "Europe/Zurich",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Lisbon",
  "Europe/Warsaw",
  "Europe/Bucharest",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/** Minutes from midnight, as a clock. */
function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;
}

function Avatar({ name, src }: { name: string | null; src: string | null }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 flex-none rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
      {(name ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

/** Columns hold JSON. Anything unreadable becomes an empty list rather than breaking the form. */
function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseDays(raw: string): number[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [1, 2, 3, 4, 5, 6];
  } catch {
    return [1, 2, 3, 4, 5, 6];
  }
}

/**
 * The values here are the database's, not near-misses of them.
 *
 * These two lists offered "relationship"/"meeting" and "any"/"close"/"exact"
 * while the columns hold "conversations"/"meetings" and
 * "precision"/"balanced"/"volume". Nothing ever matched, so no option was ever
 * highlighted, and saving the screen posted a value the route dropped on the
 * floor. Both settings were unreachable from the interface.
 */
const GOALS = [
  {
    value: "conversations",
    label: "Start conversations",
    hint: "Build a relationship first, ask later",
  },
  {
    value: "meetings",
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
  { value: "volume", label: "Any match", hint: "More people, looser fit" },
  { value: "balanced", label: "Close match", hint: "Fewer people, better fit" },
  { value: "precision", label: "Exact match", hint: "Only who you described" },
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
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

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
        observeOnly: form.observeOnly,
        jobRoles: parseList(form.jobRoles),
        industries: parseList(form.industries),
        locations: parseList(form.locations),
        companySizes: parseList(form.companySizes),
        timezone: form.timezone,
        workdayDays: parseDays(form.workdayDays),
        workdayStart: form.workdayStart,
        workdayEnd: form.workdayEnd,
        warmupStartPerDay: form.warmupStartPerDay,
        warmupIncrementPerWeek: form.warmupIncrementPerWeek,
        warmupWeeks: form.warmupWeeks,
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
          <Toggle
            label="Read LinkedIn, write nothing to it"
            hint="The agent signs in, finds people, scores them and fills the queue, and never likes, invites or messages anybody. It is how you watch it work on your own account before letting it act for you."
            checked={form.observeOnly}
            onChange={(v) => set("observeOnly", v)}
          />
        </div>
      </Panel>

      <Panel>
        <PanelTitle description="Narrow the audience without rebuilding the agent. Everything here was frozen at creation, which meant losing every lead it had found in order to change one line.">
          Who counts as a match
        </PanelTitle>
        <div className="space-y-5">
          <Field label="Job titles" hint="Comma separated. Empty means any.">
            <input
              value={parseList(form.jobRoles).join(", ")}
              onChange={(e) => set("jobRoles", JSON.stringify(splitCsv(e.target.value)))}
              className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden dark:text-white"
            />
          </Field>
          <Field label="Industries" hint="Comma separated. Empty means any.">
            <input
              value={parseList(form.industries).join(", ")}
              onChange={(e) => set("industries", JSON.stringify(splitCsv(e.target.value)))}
              className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden dark:text-white"
            />
          </Field>
          <Field label="Locations" hint="Comma separated. Empty means anywhere.">
            <input
              value={parseList(form.locations).join(", ")}
              onChange={(e) => set("locations", JSON.stringify(splitCsv(e.target.value)))}
              className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden dark:text-white"
            />
          </Field>

          <Field label="Company size" hint="All off means any size.">
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map((size) => {
                const on = parseList(form.companySizes).includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const current = parseList(form.companySizes);
                      set(
                        "companySizes",
                        JSON.stringify(on ? current.filter((x) => x !== size) : [...current, size])
                      );
                    }}
                    className={on ? PICKED : UNPICKED}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </Field>

        </div>
      </Panel>

      <Panel>
        <PanelTitle description="One row, because there is one sender. Everything about how hard this account is pushed lives behind Limits.">
          The account it sends from
        </PanelTitle>

        {/* One profile, once. The picker below used to render the same person
            again underneath this row, so the same face and name appeared twice
            in a panel about a single account. It is behind a disclosure now,
            and only opens when somebody actually wants to move the agent. */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3.5">
          <Avatar name={form.accountName} src={form.accountAvatar} />
          <div className="min-w-0">
            <b className="block text-[13px] font-semibold text-slate-900 dark:text-white">
              {form.accountName ?? "No account connected"}
            </b>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Dedicated address in {form.accountCountry}
              {form.accountAgentCount > 1
                ? `, shared with ${form.accountAgentCount - 1} other agent${form.accountAgentCount > 2 ? "s" : ""}`
                : ""}
            </div>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {form.dailyInviteCap} a day ·{" "}
            {parseDays(form.workdayDays).length} days ·{" "}
            {hhmm(form.workdayStart)} to {hhmm(form.workdayEnd)}
          </span>
          <button
            type="button"
            onClick={() => setLimitsOpen(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-600 dark:text-slate-200"
          >
            Limits
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSwitching((v) => !v)}
          className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400"
        >
          {switching ? "Never mind" : "Send from another account"}
        </button>

        {switching && (
          <div className="mt-3 border-t border-border pt-4">
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Moving the agent keeps every lead it has already found, and the new
              account&apos;s own warm-up sets the pace from there.
            </p>
            <LinkedInAccountsPanel
              mode="pick"
              onSelect={(id) => set("linkedinAccountId", id)}
              selectedId={form.linkedinAccountId}
            />
          </div>
        )}
      </Panel>

      {limitsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setLimitsOpen(false)}
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {form.accountName ?? "This account"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  When this account works, and how hard it is pushed
                </p>
              </div>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setLimitsOpen(false)}
                aria-label="Close"
                className="text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <Field
                label="Days it works"
                hint="An account that works every Saturday looks automated on its own, and worse combined with volume."
              >
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((label, day) => {
                    const on = parseDays(form.workdayDays).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          const current = parseDays(form.workdayDays);
                          set(
                            "workdayDays",
                            JSON.stringify(
                              on
                                ? current.filter((d) => d !== day)
                                : [...current, day].sort()
                            )
                          );
                        }}
                        className={on ? PICKED : UNPICKED}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field
                label="Hours it sends in"
                hint="Local to the timezone below. These hours govern what the agent sends: invitations, messages, likes. Finding people is reading rather than writing, so it runs on a wider day, 07:00 to 23:00, which is what lets an agent started in the evening have leads by the morning."
              >
                <div className="flex items-center gap-3">
                  <HourSelect
                    value={form.workdayStart}
                    onChange={(v) => set("workdayStart", v)}
                  />
                  <span className="text-[13px] text-slate-500 dark:text-slate-400">
                    to
                  </span>
                  <HourSelect
                    value={form.workdayEnd}
                    onChange={(v) => set("workdayEnd", v)}
                  />
                </div>
              </Field>

              <Field
                label="Timezone"
                hint="Where the account behaves as though it lives. Pick where you actually are, not where your buyers are."
              >
                <select
                  value={form.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-slate-900 dark:text-white"
                >
                  {(TIMEZONES.includes(form.timezone)
                    ? TIMEZONES
                    : [form.timezone, ...TIMEZONES]
                  ).map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Warm-up"
                hint="Leave empty for the safe ramp: 5 invitations a day, climbing by 5 each week for a month. These numbers are ours. LinkedIn's own ceiling is roughly 100 invitations a week and it sits above all of them."
              >
                <div className="flex flex-wrap gap-3">
                  <NumberBox
                    label="Start"
                    value={form.warmupStartPerDay}
                    onChange={(v) => set("warmupStartPerDay", v)}
                  />
                  <NumberBox
                    label="Weekly"
                    value={form.warmupIncrementPerWeek}
                    onChange={(v) => set("warmupIncrementPerWeek", v)}
                  />
                  <NumberBox
                    label="Weeks"
                    value={form.warmupWeeks}
                    onChange={(v) => set("warmupWeeks", v)}
                  />
                </div>
              </Field>
            </div>

            <div className="flex flex-wrap gap-2.5 border-t border-border bg-slate-50 px-5 py-3.5 dark:bg-white/[0.02]">
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setLimitsOpen(false)}
                className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  await save();
                  setLimitsOpen(false);
                }}
                disabled={busy}
                className="rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Saving" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

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
