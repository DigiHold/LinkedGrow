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
        <div className="mt-6 space-y-4">
          {(() => {
            const run = nextRunLine(agent);
            return (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                  {run.headline}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{run.detail}</p>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Leads found" value={found} />
            <StatCard label="Contacted" value={contacted} />
            <StatCard label="Accepted" value={accepted} />
            <StatCard
              label="Replied"
              value={replied}
              note={replied > 0 ? "Waiting on you" : undefined}
              tone="good"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelTitle description="Newest first">Recent activity</PanelTitle>
              {events.length === 0 ? (
                <EmptyState
                  title="Nothing has happened yet"
                  description="Once the agent is running, everything it does shows up here in plain words."
                />
              ) : (
                <ul className="-mx-2 divide-y divide-border">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-start justify-between gap-4 px-2 py-3"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {event.message}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel>
              <PanelTitle>The account it uses</PanelTitle>
              <div className="flex items-center gap-3">
                {agent.accountAvatar ? (
                  <Image
                    src={agent.accountAvatar}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5">
                    <AgentIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {agent.accountName || "Not connected yet"}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {agent.accountHeadline || agent.accountStatus}
                  </p>
                </div>
              </div>

              <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Pace today</dt>
                  <dd className="font-medium tabular-nums">
                    {/* The cap belongs to the LinkedIn account. When more than
                        one agent sends from it they divide this number, so
                        presenting it as this agent's own would overstate it. */}
                    {agent.accountAgentCount > 1
                      ? `${agent.dailyInviteCap} invitations, shared across ${agent.accountAgentCount} agents on this account`
                      : `up to ${agent.dailyInviteCap} invitations`}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Working hours</dt>
                  <dd className="font-medium tabular-nums">
                    {hhmm(agent.workdayStart)} to {hhmm(agent.workdayEnd)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Time zone</dt>
                  <dd className="font-medium">{agent.timezone}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Address</dt>
                  {/* The country, never the IP. */}
                  <dd className="font-medium">
                    Dedicated, {agent.accountCountry}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>
        </div>
      )}

      {tab === "Sources" && (
        <div className="mt-6">
          <Panel padded={sources.length === 0}>
            {sources.length === 0 ? (
              <EmptyState
                title="No sources yet"
                description="Sources are where the agent looks: competitor audiences, posts about the problem you solve, people who just changed job."
              />
            ) : (
              <div className="overflow-hidden">
                <PanelTitle description="Which source actually earns replies">
                  Sources
                </PanelTitle>
                <ul className="-mx-2 divide-y divide-border">
                  {sources.map((source) => (
                    <li key={source.id} className="px-2 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {source.label}
                        </span>
                        <Pill tone={source.enabled ? "good" : "neutral"}>
                          {source.enabled ? "Active" : "Off"}
                        </Pill>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4 dark:text-slate-400">
                        <span>{source.leadsFound} found</span>
                        <span>{source.contacted} contacted</span>
                        <span>{source.accepted} accepted</span>
                        <span>{source.replied} replied</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
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

      <div className="mt-8 border-t border-border pt-6">
        <button
          onClick={async () => {
            if (!confirm(`Delete ${agent.name}? Its leads are kept, so nobody it already contacted can be contacted again by another agent.`)) return;
            const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
            if (res.ok) router.push("/dashboard/agents");
          }}
          className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          Delete this agent
        </button>
      </div>
    </PageShell>
  );
}
