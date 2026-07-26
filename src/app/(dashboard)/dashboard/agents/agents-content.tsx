"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  Panel,
  Pill,
  EmptyState,
} from "@/components/dashboard/ui/page";
import { AgentIcon, ChevronRightIcon } from "@/components/dashboard/nav-icons";

type Funnel = {
  found: number;
  contacted: number;
  accepted: number;
  replied: number;
  unread: number;
};

type Agent = {
  id: string;
  name: string;
  status: "paused" | "warming" | "active" | "stopped" | "blocked";
  pausedReason: string | null;
  icpSummary: string | null;
  dailyInviteCap: number;
  warmupStartedAt: string | null;
  lastRunAt: string | null;
  accountName: string | null;
  accountAvatar: string | null;
  accountStatus: string;
  accountCountry: string;
  funnel?: Funnel;
};

type Payload = {
  agents: Agent[];
  quota: { used: number; limit: number };
};

/** Plain words, never a status code. Section 2c. */
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

function FunnelBar({ funnel }: { funnel: Funnel }) {
  // Every stage is a share of what was found, so the bars are comparable
  // across agents with very different volumes.
  const base = Math.max(funnel.found, 1);
  const stages = [
    { key: "Found", value: funnel.found, className: "bg-slate-300 dark:bg-slate-600" },
    { key: "Contacted", value: funnel.contacted, className: "bg-blue-300 dark:bg-blue-500/60" },
    { key: "Accepted", value: funnel.accepted, className: "bg-blue-500 dark:bg-blue-400" },
    { key: "Replied", value: funnel.replied, className: "bg-emerald-500 dark:bg-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {stages.map((stage) => (
        <div key={stage.key}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
              {stage.key}
            </span>
            <span className="text-[15px] font-semibold tabular-nums text-slate-900 dark:text-white">
              {stage.value}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className={cn("h-full rounded-full", stage.className)}
              style={{ width: `${Math.round((stage.value / base) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentsContent() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agents")
      .then(async (r) => {
        if (!r.ok) throw new Error("Could not load your agents");
        return r.json();
      })
      .then((payload: Payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const quota = data?.quota;
  const atLimit = quota ? quota.used >= quota.limit : false;

  return (
    <PageShell>
      <PageHeader
        title="Agents"
        description="Each agent runs one LinkedIn account against one audience, every working day, at human pace."
        meta={
          quota ? (
            <Pill tone={atLimit ? "warn" : "neutral"}>
              {quota.used} of {quota.limit} agent{quota.limit === 1 ? "" : "s"} used
            </Pill>
          ) : null
        }
        actions={
          <Link
            href={atLimit ? "/dashboard/upgrade" : "/dashboard/agents/new"}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {atLimit ? "Add an agent" : "New agent"}
          </Link>
        }
      />

      <div className="mt-8 space-y-4">
        {error && (
          <Panel>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </Panel>
        )}

        {!data && !error && (
          <>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </>
        )}

        {data?.agents.length === 0 && (
          <Panel padded={false}>
            <EmptyState
              icon={<AgentIcon className="h-6 w-6" />}
              title="No agent yet"
              description="An agent reads your website, works out who buys from you, then finds those people on LinkedIn and opens the conversation. Setting one up takes about four minutes."
              action={
                <Link
                  href="/dashboard/agents/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Create your first agent
                </Link>
              }
            />
          </Panel>
        )}

        {data?.agents.map((agent) => {
          const status = STATUS[agent.status];
          return (
            <Link
              key={agent.id}
              href={`/dashboard/agents/${agent.id}`}
              className="group block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-slate-300 sm:p-6 dark:hover:border-white/20"
            >
              <div className="flex flex-wrap items-start gap-4">
                {agent.accountAvatar ? (
                  <Image
                    src={agent.accountAvatar}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                    <AgentIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
                      {agent.name}
                    </h2>
                    <Pill tone={status.tone}>
                      {agent.status === "active" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {status.label}
                    </Pill>
                    {agent.funnel && agent.funnel.unread > 0 && (
                      <Pill tone="brand">
                        {agent.funnel.unread} new repl
                        {agent.funnel.unread === 1 ? "y" : "ies"}
                      </Pill>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                    {agent.accountName || "LinkedIn account"} ·{" "}
                    {agent.accountCountry} · up to {agent.dailyInviteCap} invitations a day
                  </p>
                  {agent.pausedReason && (
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                      {agent.pausedReason}
                    </p>
                  )}
                </div>

                <ChevronRightIcon className="mt-3 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
              </div>

              {agent.funnel && (
                <div className="mt-5 border-t border-border pt-5">
                  <FunnelBar funnel={agent.funnel} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
