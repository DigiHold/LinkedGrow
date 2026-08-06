"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Panel, PanelTitle, StatCard, EmptyState, Pill } from "@/components/dashboard/ui/page";
import { AgentIcon, ReplyIcon } from "@/components/dashboard/nav-icons";
import { Avatar, When } from "@/components/dashboard/agents/lead-bits";

/**
 * The top of the dashboard, which is about leads now rather than posts.
 *
 * What a customer opens this page to learn, in order: is anything waiting for
 * me, how many people did it find, and who wrote back. Posting sits underneath,
 * because it is no longer the reason anyone signs in.
 */

type Overview = {
  agents: { id: string; name: string; status: string }[];
  accounts: { id: string; fullName: string | null; status: string; statusReason: string | null }[];
  sourcesWatched: number;
  stats: {
    found: number;
    foundThisWeek: number;
    contacted: number;
    accepted: number;
    replied: number;
    interested: number;
  };
  waiting: { replies: number; accounts: number };
  unread: {
    id: string;
    body: string;
    sentAt: string;
    agentId: string;
    fullName: string;
    avatarUrl: string | null;
    profileUrl: string;
  }[];
  bestLeads: {
    id: string;
    fullName: string;
    jobTitle: string | null;
    company: string | null;
    avatarUrl: string | null;
    profileUrl: string;
    matchScore: number | null;
    signalText: string | null;
    agentId: string | null;
  }[];
  events: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    leadName: string | null;
    leadAvatar: string | null;
  }[];
  series: { day: string; total: number }[];
};

export function HomeLeads() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing is claimed before the data lands. A zero that turns into 431 a
  // second later reads as a bug.
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  const { stats, waiting } = data;
  const running = data.agents.filter(
    (a) => a.status === "active" || a.status === "warming"
  ).length;

  if (data.agents.length === 0) {
    return (
      <Panel padded={false}>
        <EmptyState
          icon={<AgentIcon className="h-6 w-6" />}
          title="No agent yet"
          description="No agent yet. An agent watches for people talking about the problem you solve, likes their post, invites them, and starts a real conversation before it ever asks for anything."
          action={
            <Link
              href="/dashboard/agents/new"
              className="inline-flex rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Create your first agent
            </Link>
          }
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {running > 0
              ? `${running} agent${running > 1 ? "s" : ""} running across ${data.accounts.length} LinkedIn account${data.accounts.length > 1 ? "s" : ""}, watching ${data.sourcesWatched} source${data.sourcesWatched === 1 ? "" : "s"}.`
              : "Every agent is paused. Nothing goes out until you start one."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={running > 0 ? "good" : "warn"}>
            {running > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {running > 0 ? "Running" : "Paused"}
          </Pill>
        </div>
      </div>

      {(waiting.replies > 0 || waiting.accounts > 0) && (
        <Link
          href={waiting.replies > 0 ? "/dashboard/replies" : "/dashboard/settings/linkedin-accounts"}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 px-5 py-4 transition-colors hover:bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 dark:hover:bg-blue-500/10"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Waiting for you
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {[
                waiting.replies > 0 &&
                  `${waiting.replies} repl${waiting.replies === 1 ? "y" : "ies"}`,
                waiting.accounts > 0 &&
                  `${waiting.accounts} account${waiting.accounts === 1 ? "" : "s"} needing a sign-in`,
              ]
                .filter(Boolean)
                .join(" and ")}
            </p>
          </div>
          <span className="text-3xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {waiting.replies + waiting.accounts}
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Leads found"
          value={stats.found}
          note={stats.foundThisWeek > 0 ? `+${stats.foundThisWeek} this week` : undefined}
          tone="good"
        />
        <StatCard
          label="People contacted"
          value={stats.contacted}
          note={stats.accepted > 0 ? `${stats.accepted} accepted` : undefined}
        />
        <StatCard
          label="Replies received"
          value={stats.replied}
          note={stats.interested > 0 ? `${stats.interested} in conversation` : undefined}
          tone="good"
        />
      </div>

      <ActivityBars series={data.series} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel padded={false}>
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Best leads right now</h2>
            <Link
              href="/dashboard/agents"
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View all
            </Link>
          </div>
          {data.bestLeads.length === 0 ? (
            <EmptyState
              title="Nothing found yet"
              description="The agent adds people here as it finds them, best match first."
            />
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {data.bestLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar src={lead.avatarUrl} name={lead.fullName} size={36} />
                  <div className="min-w-0 flex-1">
                    <a
                      href={lead.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-semibold text-slate-900 hover:underline dark:text-white"
                    >
                      {lead.fullName}
                    </a>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {[lead.jobTitle, lead.company].filter(Boolean).join(", ") ||
                        lead.signalText}
                    </p>
                  </div>
                  {lead.matchScore !== null && (
                    <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 tabular-nums dark:bg-emerald-500/10 dark:text-emerald-400">
                      {lead.matchScore} match
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel padded={false}>
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Replies waiting for you</h2>
            {data.unread.length > 0 && (
              <Pill tone="brand">{data.unread.length}</Pill>
            )}
          </div>
          {data.unread.length === 0 ? (
            <EmptyState
              icon={<ReplyIcon className="h-6 w-6" />}
              title="No replies waiting"
              description="When someone writes back, they land here. The agent answers the ordinary ones itself and hands you anything that needs a person."
            />
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {data.unread.map((message) => (
                <li key={message.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar src={message.avatarUrl} name={message.fullName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {message.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {message.body}
                    </p>
                  </div>
                  <When value={message.sentAt} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel padded={false}>
        <h2 className="px-5 py-3.5 text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
          What your agent is doing
        </h2>
        {data.events.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            description="Every action shows up here in plain words, including the ones that failed."
          />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {data.events.map((event) => (
              <li key={event.id} className="flex items-center gap-3 px-5 py-3">
                {event.leadName ? (
                  <Avatar src={event.leadAvatar} name={event.leadName} size={28} />
                ) : (
                  <span className="h-7 w-7 shrink-0" />
                )}
                <p className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                  {event.message}
                </p>
                <When value={event.createdAt} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/**
 * Seven days of leads found.
 *
 * Bars rather than a line, and no library: a sparkline of seven integers does
 * not justify a dependency, and the stack is deliberately small.
 */
function ActivityBars({ series }: { series: { day: string; total: number }[] }) {
  const byDay = new Map(series.map((row) => [row.day, row.total]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      total: byDay.get(key) ?? 0,
    };
  });
  const peak = Math.max(1, ...days.map((d) => d.total));

  return (
    <Panel>
      <PanelTitle description="Leads found, last 7 days">Activity</PanelTitle>
      <div className="flex h-32 items-end gap-2">
        {days.map((day) => (
          <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums dark:text-slate-500">
              {day.total > 0 ? day.total : ""}
            </span>
            <div
              className={cn(
                "w-full rounded-t-md transition-all",
                day.total > 0
                  ? "bg-linear-to-t from-cyan-500 to-blue-500"
                  : "bg-slate-100 dark:bg-white/5"
              )}
              style={{ height: `${Math.max(4, (day.total / peak) * 88)}px` }}
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
