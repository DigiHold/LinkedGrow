"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageShell, Panel, Pill, EmptyState } from "@/components/dashboard/ui/page";
import { AgentIcon, ChevronLeftIcon } from "@/components/dashboard/nav-icons";
import { useNamedCrumb } from "@/components/dashboard/crumb-context";
// One place decides the pace, mirroring the worker's safety envelope.
import { RAMP } from "@/lib/agent-pace";
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
  createdAt: string;
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

type ChartDay = {
  day: string;
  leads: number;
  invitations: number;
  messages: number;
};

type Reply = {
  id: string;
  body: string;
  sentAt: string;
  leadId: string;
  leadName: string;
  leadAvatar: string | null;
};

type Payload = {
  agent: Agent;
  sources: Source[];
  steps: Record<string, number>;
  events: Event[];
  queuedToday: number;
  chart: ChartDay[];
  replies: Reply[];
};

const TABS = [
  "Overview",
  "Leads",
  "Today's queue",
  "Sources",
  "Messages",
  "Activity",
  "Settings",
] as const;
type Tab = (typeof TABS)[number];

/** The state pill: is this agent switched on at all. */
const STATUS: Record<
  Agent["status"],
  { label: string; tone: "neutral" | "good" | "warn" | "brand" }
> = {
  active: { label: "Active", tone: "good" },
  warming: { label: "Active", tone: "good" },
  paused: { label: "Paused", tone: "warn" },
  stopped: { label: "Stopped", tone: "neutral" },
  blocked: { label: "Needs attention", tone: "warn" },
};

function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;
}

/** The agent's own local time, since the window and the days are its own. */
function localNow(timezone: string): Date {
  try {
    return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  } catch {
    return new Date();
  }
}

function workingDays(raw: string): number[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((d): d is number => typeof d === "number")
      : [1, 2, 3, 4, 5];
  } catch {
    return [1, 2, 3, 4, 5];
  }
}

/** Is it inside its hours, on a day it works. */
function isWorkingNow(agent: Agent): boolean {
  const local = localNow(agent.timezone);
  const minutes = local.getHours() * 60 + local.getMinutes();
  return (
    workingDays(agent.workdayDays).includes(local.getDay()) &&
    minutes >= agent.workdayStart &&
    minutes < agent.workdayEnd
  );
}

/**
 * When it next does something, said the way a person would say it.
 *
 * An agent that is on but outside its hours looks broken otherwise: the
 * counters sit still and nothing on screen explains why.
 */
function nextLaunch(agent: Agent): string {
  if (agent.status === "paused" || agent.status === "stopped") return "paused";
  if (agent.status === "blocked") return "stopped on a problem";
  if (isWorkingNow(agent)) return "now";

  const local = localNow(agent.timezone);
  const minutes = local.getHours() * 60 + local.getMinutes();
  const days = workingDays(agent.workdayDays);

  // Later today, or the next day it works.
  let ahead = 0;
  if (!(days.includes(local.getDay()) && minutes < agent.workdayStart)) {
    ahead = 1;
    while (ahead < 8 && !days.includes((local.getDay() + ahead) % 7)) ahead++;
    if (ahead >= 8) return "never, no working days are switched on";
  }
  const until = ahead * 1440 + agent.workdayStart - minutes;
  if (until < 90) return `in ${until} minutes`;
  const hours = Math.round(until / 60);
  if (hours < 36) return `in ${hours} hours`;
  return `in ${Math.round(hours / 24)} days`;
}

/** "23 days ago", for the meta line under the title. */
function since(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days >= 2) return `${days} days ago`;
  if (days === 1) return "yesterday";
  return "today";
}

/** "51 out of 100", the conversion into this step. */
function rateOf(value: number, base: number): string {
  if (!base) return "nothing yet";
  return `${Math.round((value / base) * 100)} out of 100`;
}

/** First name and last initial: "Nicolas L.", which is how the header says it. */
function shortName(full: string | null): string {
  if (!full) return "nobody yet";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${(parts[parts.length - 1] ?? "").charAt(0)}.`;
}

/**
 * The four weeks of the ramp, and which one this account is in.
 *
 * The numbers are ours, not LinkedIn's: a new account that suddenly sends at
 * full pace is the pattern that gets restricted, so the agent climbs to its
 * ceiling over a month. LinkedIn's own ceiling sits above all of them.
 */
function rampWeeks(agent: Agent): Array<{
  week: number;
  perDay: number;
  state: "done" | "now" | "todo";
}> {
  const weeks = Math.max(1, agent.warmupWeeks ?? RAMP.weeks);
  const started = agent.warmupStartedAt
    ? new Date(agent.warmupStartedAt).getTime()
    : null;
  const current =
    started === null
      ? 0
      : Math.min(
          weeks,
          Math.max(1, Math.floor((Date.now() - started) / (7 * 86_400_000)) + 1)
        );
  return Array.from({ length: weeks }, (_, i) => i + 1).map((week) => ({
    week,
    // The real allowance for that week, not the ceiling divided up. The rail
    // used to print 2, 4, 6, 8 while the engine was going to send 5, 8, 8, 8.
    perDay: dayPace(agent, week),
    state: current === 0 ? "todo" : week < current ? "done" : week === current ? "now" : "todo",
  }));
}

/** LinkedIn's own weekly ceiling, which it does not publish. Ours sits below it. */
const WEEKLY_INVITE_CEILING = 100;

/**
 * How many invitations a day the agent may send in a given week of the ramp.
 *
 * Mirrors dailyConnectAllowance in the worker's safety envelope. The header
 * printed the account's ceiling as "today's limit", so an agent in week 1 of
 * its warm-up was described as sending 8 a day when it was sending 5. Three
 * limits answer three different questions and the smallest wins.
 */
function dayPace(agent: Agent, week: number): number {
  const start = agent.warmupStartPerDay ?? RAMP.startPerDay;
  const step = agent.warmupIncrementPerWeek ?? RAMP.incrementPerWeek;
  const weeks = Math.max(1, agent.warmupWeeks ?? RAMP.weeks);
  const ramp = start + Math.min(Math.max(0, week - 1), weeks - 1) * step;
  const days = Math.max(1, workingDays(agent.workdayDays).length);
  return Math.max(
    0,
    Math.min(ramp, Math.floor(WEEKLY_INVITE_CEILING / days), agent.dailyInviteCap)
  );
}

/** Which week of the ramp, or null once the ramp is over. */
function warmupWeek(agent: Agent): { week: number; of: number } | null {
  if (!agent.warmupStartedAt) return null;
  const of = Math.max(1, agent.warmupWeeks ?? RAMP.weeks);
  const week = Math.floor(
    (Date.now() - new Date(agent.warmupStartedAt).getTime()) / (7 * 86_400_000)
  ) + 1;
  return week > of ? null : { week, of };
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
function icpTags(agent: Agent): string[] {
  const parse = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string")
        : [];
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

export function AgentDetailContent({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // The breadcrumb is built from the url, which ends in an id. This is the only
  // place that knows the agent's name.
  useNamedCrumb(data?.agent.name);

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
   * Somebody watching their first agent work is exactly the person who should
   * not have to press refresh to find out whether it works. Fifteen seconds,
   * and nothing at all while the tab is in the background.
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

  const { agent, sources, steps, queuedToday, chart, replies } = data;
  const status = STATUS[agent.status];
  const on = agent.status === "active" || agent.status === "warming";
  const running = on && isWorkingNow(agent);
  const ramp = warmupWeek(agent);

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

      {/* The header: what state it is in, then what you can do about it. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.035em] text-slate-900 dark:text-white">
          {agent.name}
        </h1>
        <Pill tone={status.tone}>
          {on && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          {status.label}
        </Pill>
        {running && (
          <Pill tone="brand">
            <Spinner />
            Running
          </Pill>
        )}
        {ramp && (
          <Pill tone="warn">
            Warm-up, week {ramp.week} of {ramp.of}
          </Pill>
        )}
        {agent.observeOnly && <Pill>Reading only</Pill>}
        <div className="flex-1" />
        <button
          onClick={() => setStatus(on ? "paused" : "active")}
          disabled={busy}
          className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 dark:text-slate-200"
        >
          {on ? "Pause agent" : "Start agent"}
        </button>
        <button
          onClick={() => setTab("Today's queue")}
          className="rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-3.5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Review today&apos;s queue
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-slate-400 dark:text-slate-500">
        <span>
          Created <b className="font-semibold text-slate-900 dark:text-white">{since(agent.createdAt)}</b>
        </span>
        <span>
          Next launch{" "}
          <b className="font-semibold text-slate-900 dark:text-white">{nextLaunch(agent)}</b>
        </span>
        <span>
          Sending as{" "}
          <b className="font-semibold text-slate-900 dark:text-white">
            {shortName(agent.accountName)}
          </b>
        </span>
        <span>
          Today&apos;s limit{" "}
          <b className="font-semibold text-slate-900 dark:text-white">
            {dayPace(agent, ramp?.week ?? (agent.warmupWeeks ?? RAMP.weeks))} invitations
          </b>
        </span>
      </div>

      {agent.pausedReason && !on && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
          {agent.pausedReason}
        </div>
      )}

      <div className="mt-5 flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const badge =
            t === "Leads" ? found : t === "Today's queue" ? queuedToday : 0;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                tab === t
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              {t}
              {badge > 0 && (
                <span
                  className={cn(
                    "ml-1.5 inline-block rounded-full px-1.5 py-px text-[11px] tabular-nums",
                    tab === t
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "Overview" && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_264px]">
          <div>
            {/* Only when there is something to act on. These used to sit here
                permanently, which trained people to stop reading them. */}
            {replies.length > 0 && (
              <ActionRow
                count={replies.length}
                title={
                  replies.length === 1 && replies[0]
                    ? `${replies[0].leadName} replied ${shortAgo(replies[0].sentAt)}`
                    : `${replies.length} people replied and are waiting for you`
                }
                why="The agent has stopped messaging them for good"
                cta="Read them"
                onClick={() => setTab("Leads")}
              />
            )}
            {queuedToday > 0 && on && (
              <ActionRow
                count={queuedToday}
                title={`${queuedToday} ${queuedToday === 1 ? "person" : "people"} will be contacted next`}
                why="You can read and edit every message before it goes"
                cta="Review queue"
                onClick={() => setTab("Today's queue")}
              />
            )}

            {/* The spine: the whole funnel in one row, each step a way in. */}
            <div className="mb-[18px] mt-[18px] grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-5">
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

            <ActivityChart days={chart} />
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
                  {shortName(agent.accountName)} · dedicated address, {agent.accountCountry}
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
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                LinkedIn caps a free account at 100 invitations a week and
                throttles past about 20 a day. The ramp keeps a cold account
                under both while it builds a record.
              </p>
            </div>

            <div className="grid gap-2.5 p-4">
              {[
                { label: "Invitations this week", value: `${contacted} of 100` },
                {
                  label: "Today's limit",
                  value: `${dayPace(agent, ramp?.week ?? (agent.warmupWeeks ?? RAMP.weeks))} invitations`,
                },
                {
                  label: "After the warm-up",
                  value: `${dayPace(agent, agent.warmupWeeks ?? RAMP.weeks)} a day`,
                },
                {
                  label: "Working hours",
                  value: `${clock(agent.workdayStart)} to ${clock(agent.workdayEnd)}`,
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

      {tab === "Leads" && <LeadsTab agentId={agentId} />}
      {tab === "Today's queue" && <QueueTab agentId={agentId} />}
      {tab === "Messages" && <MessagesTab agentId={agentId} />}
      {tab === "Activity" && <ActivityTab agentId={agentId} />}

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

      {tab === "Settings" && (
        <>
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
              accountName: agent.accountName,
              accountAvatar: agent.accountAvatar,
              linkedinAccountId: agent.accountId,
            }}
            onSaved={load}
          />

          {/* Only under Settings, and last. It used to sit below every tab, so
              the way to delete an agent was one scroll from reading its leads. */}
          <div className="mt-8 rounded-xl border border-red-200 p-4 dark:border-red-500/30">
            <p className="text-[13px] font-semibold text-red-600 dark:text-red-400">
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
        </>
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

/** "2 h", for the reply line. */
function shortAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function Spinner() {
  return (
    <span className="h-[11px] w-[11px] flex-none animate-spin rounded-full border-[1.6px] border-current border-t-transparent opacity-70" />
  );
}

/** One thing waiting for the reader, with the way to deal with it. */
function ActionRow({
  count,
  title,
  why,
  cta,
  onClick,
}: {
  count: number;
  title: string;
  why: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 tabular-nums dark:bg-blue-500/10 dark:text-blue-300">
        {count}
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-slate-900 dark:text-white">{title}</p>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{why}</div>
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onClick}
        className="whitespace-nowrap text-xs font-semibold text-blue-600 dark:text-blue-400"
      >
        {cta}
      </button>
    </div>
  );
}

/**
 * The week, three series a day.
 *
 * Heights are a share of the busiest bar in the window, so the shape of the
 * week is readable whether the agent found four people or four hundred. A day
 * with nothing at all keeps a flat stub, which reads as "nothing happened"
 * rather than as a missing column.
 */
function ActivityChart({ days }: { days: ChartDay[] }) {
  const peak = Math.max(
    1,
    ...days.map((d) => Math.max(d.leads, d.invitations, d.messages))
  );
  const height = (value: number) =>
    value === 0 ? "8%" : `${Math.max(10, Math.round((value / peak) * 100))}%`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3.5">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
          Activity
        </h2>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-3.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-blue-600" />
            Leads found
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-blue-600/50" />
            Invitations
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-slate-300 dark:bg-white/20" />
            Messages
          </span>
        </div>
      </div>
      <div className="relative p-4">
        {/* A week of flat stubs and nothing else reads as a broken chart rather
            than as a quiet week, so an empty one says which it is. */}
        {peak === 1 && days.every((d) => !d.leads && !d.invitations && !d.messages) && (
          <p className="absolute inset-x-0 top-14 text-center text-[13px] text-slate-400 dark:text-slate-500">
            Nothing yet this week.
          </p>
        )}
        <div className="flex h-[130px] items-end gap-2.5">
          {days.map((day, i) => {
            const empty = !day.leads && !day.invitations && !day.messages;
            return (
              <div key={`${day.day}-${i}`} className="flex h-full flex-1 items-end gap-0.5">
                {empty ? (
                  <span
                    className="block flex-1 rounded-t-sm bg-slate-200 dark:bg-white/10"
                    style={{ height: "8%" }}
                  />
                ) : (
                  <>
                    <span
                      className="block flex-1 rounded-t-sm bg-blue-600"
                      style={{ height: height(day.leads) }}
                      title={`${day.leads} leads found`}
                    />
                    <span
                      className="block flex-1 rounded-t-sm bg-blue-600/50"
                      style={{ height: height(day.invitations) }}
                      title={`${day.invitations} invitations`}
                    />
                    <span
                      className="block flex-1 rounded-t-sm bg-slate-300 dark:bg-white/20"
                      style={{ height: height(day.messages) }}
                      title={`${day.messages} messages`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2.5">
          {days.map((day, i) => (
            <span
              key={`${day.day}-label-${i}`}
              className="flex-1 text-center text-[10.5px] text-slate-400 dark:text-slate-500"
            >
              {day.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
