"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Panel, EmptyState, Pill } from "@/components/dashboard/ui/page";
import { AgentIcon } from "@/components/dashboard/nav-icons";
import {
  Avatar,
  MatchScore,
  Signal,
  StepPill,
  When,
  STEP_LABEL,
} from "./lead-bits";

type Lead = {
  id: string;
  fullName: string;
  headline: string | null;
  jobTitle: string | null;
  company: string | null;
  location: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  matchScore: number | null;
  matchReason: string | null;
  signalText: string | null;
  signalUrl: string | null;
  sourceId: string | null;
  step: string;
  stepAt: string | null;
  foundAt: string;
};

type Payload = {
  leads: Lead[];
  total: number;
  page: number;
  hasMore: boolean;
  steps: Record<string, number>;
  sources: { id: string; label: string }[];
};

const FILTER_STEPS = [
  "found",
  "invited",
  "accepted",
  "messaged",
  "replied",
  "excluded",
];

export function LeadsTab({ agentId }: { agentId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (step) params.set("step", step);
      if (source) params.set("source", source);
      if (page) params.set("page", String(page));
      const res = await fetch(
        `/api/agents/${agentId}/leads?${params.toString()}`,
        { signal }
      );
      if (!res.ok) return;
      setData(await res.json());
      setLoading(false);
    },
    [agentId, search, step, source, page]
  );

  // Typing re-runs the query, so it waits for a pause rather than firing on
  // every keystroke.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      load(controller.signal).catch(() => {});
    }, search ? 300 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, search]);

  /**
   * Keep this list live.
   *
   * The first hour after an agent starts is the whole of a customer's first impression, and this
   * tab is where they watch for it. Fetching once on mount meant a working agent showed an empty
   * list until the browser was reloaded. Only the first page refreshes, so paging back does not
   * move under the reader, and nothing polls while the tab is in the background.
   */
  useEffect(() => {
    if (page !== 0) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      load().catch(() => {});
    }, 15_000);
    return () => clearInterval(timer);
  }, [load, page]);

  const leads = data?.leads ?? [];

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
          placeholder="Search by name, company or job title"
          className="h-10 min-w-56 flex-1 rounded-xl border border-border bg-card px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden dark:text-white"
        />
        <select
          value={step}
          onChange={(e) => {
            setPage(0);
            setStep(e.target.value);
          }}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-hidden dark:text-slate-200"
        >
          <option value="">All steps</option>
          {FILTER_STEPS.map((s) => (
            <option key={s} value={s}>
              {STEP_LABEL[s]}
              {data?.steps[s] ? ` (${data.steps[s]})` : ""}
            </option>
          ))}
        </select>
        {(data?.sources.length ?? 0) > 0 && (
          <select
            value={source}
            onChange={(e) => {
              setPage(0);
              setSource(e.target.value);
            }}
            className="h-10 max-w-48 rounded-xl border border-border bg-card px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-hidden dark:text-slate-200"
          >
            <option value="">All sources</option>
            {data?.sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <Panel padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {loading ? "Loading" : `${data?.total ?? 0} leads`}
          </p>
          <a
            href={`/api/agents/${agentId}/leads/export`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Export CSV
          </a>
        </div>

        {!loading && leads.length === 0 ? (
          <EmptyState
            icon={<AgentIcon className="h-6 w-6" />}
            title={
              search || step || source
                ? "Nothing matches that filter"
                : "No leads yet"
            }
            description={
              search || step || source
                ? "Clear the filters to see everyone the agent has found."
                : "The agent adds people here as it finds them, with the post or comment that made it pick each one."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-start gap-3 px-5 py-4 sm:flex-nowrap"
              >
                <Avatar src={lead.avatarUrl} name={lead.fullName} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <a
                      href={lead.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-900 hover:underline dark:text-white"
                    >
                      {lead.fullName}
                    </a>
                    {lead.location && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {lead.location}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {[lead.jobTitle, lead.company].filter(Boolean).join(" at ") ||
                      lead.headline}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    <MatchScore
                      score={lead.matchScore}
                      reason={lead.matchReason}
                    />
                    <Signal text={lead.signalText} url={lead.signalUrl} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                  <StepPill step={lead.step} />
                  <When value={lead.stepAt ?? lead.foundAt} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {(page > 0 || data?.hasMore) && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={cn(
                "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold",
                page === 0
                  ? "opacity-40"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
              )}
            >
              Previous
            </button>
            <Pill>Page {page + 1}</Pill>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.hasMore}
              className={cn(
                "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold",
                data?.hasMore
                  ? "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  : "opacity-40"
              )}
            >
              Next
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}
