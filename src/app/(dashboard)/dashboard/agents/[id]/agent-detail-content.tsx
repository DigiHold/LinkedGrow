"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  Panel,
  PanelTitle,
  Pill,
  StatCard,
  EmptyState,
} from "@/components/dashboard/ui/page";
import {
  AgentIcon,
  ChevronLeftIcon,
} from "@/components/dashboard/nav-icons";
import { LeadsTab } from "@/components/dashboard/agents/leads-tab";
import { QueueTab } from "@/components/dashboard/agents/queue-tab";
import { MessagesTab } from "@/components/dashboard/agents/messages-tab";
import { ActivityTab } from "@/components/dashboard/agents/activity-tab";
import { SettingsTab } from "@/components/dashboard/agents/settings-tab";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Agent = {
  id: string;
  name: string;
  status: "paused" | "warming" | "active" | "stopped" | "blocked";
  pausedReason: string | null;
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
  workdayDays: string;
  warmupStartPerDay: number | null;
  warmupIncrementPerWeek: number | null;
  warmupWeeks: number | null;
  dailyInviteCap: number;
  accountAgentCount: number;
  timezone: string;
  workdayStart: number;
  workdayEnd: number;
  warmupStartedAt: string | null;
  lastRunAt: string | null;
  accountId: string;
  accountName: string | null;
  accountAvatar: string | null;
  accountHeadline: string | null;
  accountStatus: string;
  accountCountry: string;
};

type Source = {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  leadsFound: number;
  contacted: number;
  accepted: number;
  replied: number;
};

type Event = { id: string; type: string; message: string; createdAt: string };

type Payload = {
  agent: Agent;
  sources: Source[];
  steps: Record<string, number>;
  events: Event[];
  queuedToday: number;
};


/**
 * When the agent next does something, said the way a person would say it.
 *
 * An agent that is running but outside office hours looks broken otherwise:
 * the counters sit at zero and nothing explains why. The window and the
 * timezone are the agent's own, so a customer in Paris reads Paris hours.
 */
function nextRunLine(agent: {
  status: string;
  timezone: string;
  workdayStart: number;
  workdayEnd: number;
}): { headline: string; detail: string } {
  const clock = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const window = `${clock(agent.workdayStart)} to ${clock(agent.workdayEnd)}, ${agent.timezone}`;

  if (agent.status === "paused" || agent.status === "stopped") {
    return {
      headline: "Not running",
      detail: `Start it and it works ${window}, weekdays only.`,
    };
  }
  if (agent.status === "blocked") {
    return {
      headline: "Stopped on a problem",
      detail: "Fix what it flags below and it picks up again on its own.",
    };
  }

  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: agent.timezone }));
  const minutes = local.getHours() * 60 + local.getMinutes();
  const weekday = local.getDay() >= 1 && local.getDay() <= 5;
  const working = weekday && minutes >= agent.workdayStart && minutes < agent.workdayEnd;

  if (working) {
    return { headline: "Working now", detail: `Office hours are ${window}.` };
  }
  const when =
    weekday && minutes < agent.workdayStart
      ? `today at ${clock(agent.workdayStart)}`
      : `the next working day at ${clock(agent.workdayStart)}`;
  return { headline: `Next run ${when}`, detail: `It works ${window}, weekdays only.` };
}

// Five, not seven. "Today's queue" and "Activity" were the same object either
// side of now, and "Messages" was the sequence template, which is configuration
// and belongs under Settings rather than beside real messages.
const TABS = [
  "Overview",
  "Leads",
  "Messages",
  "Sources",
  "Settings",
] as const;
type Tab = (typeof TABS)[number];

const STATUS: Record<
  Agent["status"],
  { label: string; tone: "neutral" | "good" | "warn" | "brand" }
> = {
  active: { label: "Running", tone: "good" },
  warming: { label: "Warming up", tone: "brand" },
  paused: { label: "Paused", tone: "neutral" },
  stopped: { label: "Stopped", tone: "neutral" },
  blocked: { label: "Needs attention", tone: "warn" },
};

/** Minutes from midnight to something a person reads. */
/** "51 out of 100", the conversion into this step. Empty when there is nothing to divide by. */
function rateOf(value: number, base: number): string {
  if (!base) return "nothing yet";
  return `${Math.round((value / base) * 100)} out of 100`;
}

/** "3d", "2h", "just now". Short, because it sits at the end of every row. */
function shortAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 60_000) return "just now";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h`;
  return `${Math.floor(ms / 60_000)}m`;
}

/**
 * The four weeks of the ramp, and which one this account is in.
 *
 * The numbers are ours, not LinkedIn's: a new account that suddenly sends at
 * full pace is the pattern that gets restricted, so the agent climbs to its
 * ceiling over a month. LinkedIn's own limit sits above all of them.
 */
function rampWeeks(agent: {
  warmupStartedAt: string | null;
  dailyInviteCap: number;
}): Array<{ week: number; perDay: number; state: "done" | "now" | "todo" }> {
  const started = agent.warmupStartedAt ? new Date(agent.warmupStartedAt).getTime() : null;
  const current =
    started === null
      ? 0
      : Math.min(4, Math.max(1, Math.floor((Date.now() - started) / (7 * 86_400_000)) + 1));
  const top = Math.max(4, agent.dailyInviteCap);
  return [1, 2, 3, 4].map((week) => ({
    week,
    perDay: Math.max(1, Math.round((top / 4) * week)),
    state: current === 0 ? "todo" : week < current ? "done" : week === current ? "now" : "todo",
  }));
}

/** What each kind of source is, in the customer's words rather than the column's. */
const SOURCE_KIND: Record<string, { badge: string; what: string }> = {
  competitor: { badge: "C", what: "People engaging with a competitor" },
  keyword: { badge: "K", what: "People posting about a subject" },
  market: { badge: "M", what: "People posting about a subject" },
  linkedin_search: { badge: "S", what: "A LinkedIn search you saved" },
  buying_event: { badge: "J", what: "New role or hiring, under 90 days" },
  brand: { badge: "V", what: "People who viewed your profile" },
  csv: { badge: "U", what: "A list you uploaded" },
};

/** The audience, flattened out of the wizard's lists into plain tags. */
function icpTags(agent: {
  jobRoles: string | null;
  industries: string | null;
  locations: string | null;
  companySizes: string | null;
}): string[] {
  const parse = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  };
  return [
    ...parse(agent.jobRoles),
    ...parse(agent.industries),
    ...parse(agent.locations),
    ...parse(agent.companySizes),
  ];
}

function hhmm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function AgentDetailContent({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/agents/${agentId}`)
      .then(async (r) => {
        if (r.status === 404) throw new Error("That agent does not exist");
        if (!r.ok) throw new Error("Could not load this agent");
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [agentId]);

  useEffect(load, [load]);

  /**
   * The agent's own state, kept current while somebody is watching it.
   *
   * The status and the counts on this page come from one fetch on mount, so an agent that started
   * warming, found leads and began sending still read "paused, 0 leads" until the browser was
   * reloaded. Somebody watching their first agent work is exactly the person who should not have
   * to press refresh to find out whether it works.
   *
   * Fifteen seconds, and nothing at all while the tab is in the background.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      load();
    }, 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const setStatus = async (status: "active" | "paused") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) load();
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <PageShell>
        <Panel>
          <EmptyState
            icon={<AgentIcon className="h-6 w-6" />}
            title={error}
            action={
              <Link
                href="/dashboard/agents"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
              >
                Back to agents
              </Link>
            }
          />
        </Panel>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  const { agent, sources, steps, events, queuedToday } = data;
  const status = STATUS[agent.status];
  const running = agent.status === "active" || agent.status === "warming";

  const found = Object.values(steps).reduce((a, b) => a + b, 0);
  const contacted = ["invited", "accepted", "messaged", "replied", "finished"]
    .map((s) => steps[s] ?? 0)
    .reduce((a, b) => a + b, 0);
  const accepted = ["accepted", "messaged", "replied", "finished"]
    .map((s) => steps[s] ?? 0)
    .reduce((a, b) => a + b, 0);
  const replied = steps.replied ?? 0;
  // The last column of the spine: people who answered and were not written off.
  const interested = steps.finished ?? 0;

  return (
    <PageShell>
      <Link
        href="/dashboard/agents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        All agents
      </Link>

      <div className="mt-4">
        <PageHeader
          title={agent.name}
          description={
            agent.icpSummary ||
            "No audience described yet. Open Settings to tell the agent who it should be looking for."
          }
          meta={
            <>
              <Pill tone={status.tone}>
                {agent.status === "active" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
                {status.label}
              </Pill>
              <Pill>{agent.accountCountry}</Pill>
            </>
          }
          actions={
            <button
              onClick={() => setStatus(running ? "paused" : "active")}
              disabled={busy}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform disabled:opacity-50",
                running
                  ? "border border-border text-slate-700 hover:-translate-y-0.5 dark:text-slate-200"
                  : "bg-linear-to-r from-cyan-500 to-blue-600 text-white hover:-translate-y-0.5"
              )}
            >
              {running ? "Pause agent" : "Start agent"}
            </button>
          }
        />
      </div>

      {agent.pausedReason && agent.status !== "active" && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
          {agent.pausedReason}
        </div>
      )}

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t
                ? "border-blue-600 text-slate-900 dark:border-blue-400 dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            {t}
            {t === "Messages" && queuedToday > 0 && (
              <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                {queuedToday}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_264px]">
          <div>
            {/* The spine: the whole funnel in one row, each step a way in.
                It replaces four separate stat cards, which showed the same
                numbers without ever showing the drop between them. */}
            <div className="mb-[18px] grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-5">
              {(
                [
                  { label: "Found", value: found, rate: "all time", fill: "opacity-100" },
                  {
                    label: "Contacted",
                    value: contacted,
                    rate: rateOf(contacted, found),
                    fill: "opacity-[.76]",
                  },
                  {
                    label: "Accepted",
                    value: accepted,
                    rate: rateOf(accepted, contacted),
                    fill: "opacity-[.54]",
                  },
                  {
                    label: "Replied",
                    value: replied,
                    rate: rateOf(replied, accepted),
                    fill: "opacity-[.34]",
                  },
                  {
                    label: "Interested",
                    value: interested,
                    rate: "judged by AI",
                    fill: "opacity-[.18]",
                  },
                ] as const
              ).map((s) => (
                <button
                  key={s.label}
                  onClick={() => setTab("Leads")}
                  type="button"
                  className="relative border-b border-r border-border px-4 pb-4 pt-3.5 text-left last:border-r-0 hover:bg-slate-50 sm:border-b-0 dark:hover:bg-white/5"
                >
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
                    {s.label}
                  </div>
                  <div className="mb-0.5 mt-1.5 text-[28px] font-bold tracking-[-0.035em] text-slate-900 dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.rate}</div>
                  <i className={cn("absolute inset-x-0 bottom-0 h-[3px] bg-blue-600", s.fill)} />
                </button>
              ))}
            </div>

            {/* Activity, cut to what somebody actually needs to see.
                It used to print every line the agent ever wrote, newest first,
                with a full timestamp on each. Nicolas, 2026-07-31: not
                everything the agent does, the data that matters. */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                  Latest activity
                </h2>
                <div className="flex-1" />
                {events.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setTab("Leads")}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400"
                  >
                    See the leads
                  </button>
                )}
              </div>
              {events.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  Nothing yet. Once the agent runs, the few things worth knowing show up here.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {events.slice(0, 6).map((event) => (
                    <li key={event.id} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="flex-1 text-[13px] text-slate-700 dark:text-slate-200">
                        {event.message}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                        {shortAgo(event.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* The rail: is the account safe, how far along is the ramp, and how
              close are we to LinkedIn's own ceilings. */}
          <aside className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2.5 border-b border-border px-4 pb-3 pt-3.5">
              {agent.accountAvatar ? (
                <Image
                  src={agent.accountAvatar}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
                  <AgentIcon className="h-4 w-4 text-slate-400" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                  Account health
                </h4>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {agent.accountName || "Not connected"} · dedicated address,{" "}
                  {agent.accountCountry}
                </p>
              </div>
            </div>

            <div className="border-b border-border p-4">
              <div
                className={cn(
                  "text-[14.5px] font-semibold",
                  agent.accountStatus === "active"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"
                )}
              >
                {agent.accountStatus === "active"
                  ? "Everything looks fine"
                  : "LinkedIn wants a verification"}
              </div>
              <div className="my-2 h-[5px] overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <i
                  className={cn(
                    "block h-full rounded-full",
                    agent.accountStatus === "active" ? "bg-emerald-600" : "bg-amber-600"
                  )}
                  style={{ width: agent.accountStatus === "active" ? "88%" : "35%" }}
                />
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {agent.accountStatus === "active"
                  ? "LinkedIn has not asked this account to verify anything since it was connected."
                  : "Open the accounts page and answer what LinkedIn is asking, and the agent picks up on its own."}
              </p>
            </div>

            <div className="border-b border-border p-4">
              <h5 className="mb-3 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                Warm-up
              </h5>
              <ol className="grid gap-2">
                {rampWeeks(agent).map((w) => (
                  <li
                    key={w.week}
                    className={cn(
                      "grid grid-cols-[52px_1fr_auto] items-center gap-2.5 text-xs",
                      w.state === "now" && "font-semibold"
                    )}
                  >
                    <span className="text-slate-400 dark:text-slate-500">Week {w.week}</span>
                    <span className="h-[5px] overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <i
                        className={cn(
                          "block h-full",
                          w.state === "done" && "bg-blue-600/45",
                          w.state === "now" && "bg-blue-600",
                          w.state === "todo" && "bg-transparent"
                        )}
                        style={{ width: w.state === "todo" ? "0%" : "100%" }}
                      />
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{w.perDay}/day</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-2.5 p-4">
              {[
                { label: "Invitations this week", value: `${contacted} / 100` },
                { label: "Today's ceiling", value: `${agent.dailyInviteCap} invitations` },
                {
                  label: "Working hours",
                  value: `${hhmm(agent.workdayStart)} to ${hhmm(agent.workdayEnd)}`,
                },
                { label: "Time zone", value: agent.timezone },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between gap-3 text-xs text-slate-500 dark:text-slate-400"
                >
                  <span>{r.label}</span>
                  <b className="font-semibold text-slate-900 dark:text-white">{r.value}</b>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
      {tab === "Sources" && (
        <div className="mt-6">
          <div className="mb-3.5 flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                Where your leads come from
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                Turn a source off if it brings people who never reply.
              </p>
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setTab("Settings")}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Add a source
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
              <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                AI
              </div>
              <div className="min-w-0">
                <b className="block text-[13px] font-semibold text-slate-900 dark:text-white">
                  Signal discovery
                </b>
                <small className="text-xs text-slate-500 dark:text-slate-400">
                  {sources.reduce((n, s) => n + s.leadsFound, 0)} leads found across{" "}
                  {sources.length} source{sources.length === 1 ? "" : "s"}
                </small>
              </div>
              <div className="flex-1" />
              <Pill tone={sources.some((s) => s.enabled) ? "good" : "neutral"}>
                {sources.some((s) => s.enabled) ? "Active" : "All off"}
              </Pill>
            </div>

            {/* Who the agent is looking for, as the tags the wizard collected. */}
            {icpTags(agent).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-slate-50 px-4 py-3 dark:bg-white/[0.02]">
                <span className="mr-1 text-xs text-slate-400 dark:text-slate-500">
                  Who you target
                </span>
                {icpTags(agent)
                  .slice(0, 6)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border bg-card px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                {icpTags(agent).length > 6 && (
                  <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs text-slate-500">
                    +{icpTags(agent).length - 6}
                  </span>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setTab("Settings")}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400"
                >
                  Edit
                </button>
              </div>
            )}

            {sources.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
                No source yet. A source is where the agent looks: a competitor whose audience
                overlaps yours, a subject your buyers post about, people who just changed job.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {sources.map((source) => {
                  const kind = SOURCE_KIND[source.type] ?? SOURCE_KIND.keyword;
                  return (
                    <li key={source.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                        {kind.badge}
                      </div>
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                          {source.label}
                        </b>
                        <small className="text-xs text-slate-500 dark:text-slate-400">
                          {kind.what}
                        </small>
                      </div>
                      <div className="flex-none text-right">
                        <b className="text-[13px] font-semibold text-slate-900 dark:text-white">
                          {source.leadsFound}
                        </b>
                        <span className="text-xs text-slate-500 dark:text-slate-400"> leads</span>
                        <div
                          className={cn(
                            "text-[11px]",
                            source.replied > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          )}
                        >
                          {source.replied > 0
                            ? `${source.replied} replied`
                            : source.enabled
                              ? "no reply yet"
                              : "off"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      {tab === "Leads" && <LeadsTab agentId={agentId} />}
      {tab === "Messages" && (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
              Coming up
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What it plans to send next. Edit or remove anything before it goes.
            </p>
            <div className="mt-3">
              <QueueTab agentId={agentId} />
            </div>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
              Already done
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything it has sent, accepted or failed, newest first.
            </p>
            <div className="mt-3">
              <ActivityTab agentId={agentId} />
            </div>
          </section>
        </div>
      )}
      {tab === "Settings" && (
        <SettingsTab
          agentId={agentId}
          settings={{
            name: agent.name,
            icpSummary: agent.icpSummary,
            goal: agent.goal,
            tone: agent.tone,
            matchLevel: agent.matchLevel,
            skipConnected: agent.skipConnected,
            reviewMode: agent.reviewMode,
            smartLeadFinder: agent.smartLeadFinder,
            observeOnly: agent.observeOnly,
            jobRoles: agent.jobRoles,
            industries: agent.industries,
            locations: agent.locations,
            companySizes: agent.companySizes,
            timezone: agent.timezone,
            workdayDays: agent.workdayDays,
            workdayStart: agent.workdayStart,
            workdayEnd: agent.workdayEnd,
            warmupStartPerDay: agent.warmupStartPerDay,
            warmupIncrementPerWeek: agent.warmupIncrementPerWeek,
            warmupWeeks: agent.warmupWeeks,
            dailyInviteCap: agent.dailyInviteCap,
            accountAgentCount: agent.accountAgentCount,
            accountCountry: agent.accountCountry,
            linkedinAccountId: agent.accountId,
          }}
          onSaved={load}
        />
      )}

      {tab === "Settings" && (
        <div className="mt-8 border-t border-border pt-8">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
            The message sequence
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How it writes, and when it stops. This is the shape every contact follows.
          </p>
          <div className="mt-3">
            <MessagesTab agentId={agentId} />
          </div>
        </div>
      )}

      {/* Only under Settings. It used to sit below every tab, so the way to
          delete an agent was one scroll away from reading its leads. */}
      {tab === "Settings" && (
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
            Delete this agent
          </p>
          <p className="mt-1 max-w-xl text-[13px] text-slate-500 dark:text-slate-400">
            Its leads are kept, so nobody it already contacted can be contacted again by another
            agent. The LinkedIn account and its address stay connected.
          </p>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Delete agent
          </button>
        </div>
      )}

      {/* A LinkedGrow modal rather than the browser's confirm box, which shows
          the domain name, cannot be styled, and freezes the page. */}
      <ConfirmModal
        confirmText="Delete agent"
        description={`Its leads are kept, so nobody ${agent.name} already contacted can be contacted again by another agent.`}
        loading={deleting}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={async () => {
          setDeleting(true);
          const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
          if (res.ok) {
            router.push("/dashboard/agents");
            return;
          }
          setDeleting(false);
          setConfirmingDelete(false);
        }}
        open={confirmingDelete}
        title={`Delete ${agent.name}?`}
        variant="destructive"
      />
    </PageShell>
  );
}
