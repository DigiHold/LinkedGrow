"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/ui/page";
import { AgentIcon } from "@/components/dashboard/nav-icons";
import {
  Cell,
  Contact,
  MatchBar,
  Row,
  Table,
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
  signalAuthor: string | null;
  sourceId: string | null;
  step: string;
  stepAt: string | null;
  foundAt: string;
  excludedReason: string | null;
};

type Source = { id: string; label: string; type: string };

type Payload = {
  leads: Lead[];
  total: number;
  page: number;
  hasMore: boolean;
  steps: Record<string, number>;
  sources: Source[];
};

const FILTER_STEPS = [
  "found",
  "queued",
  "invited",
  "accepted",
  "messaged",
  "replied",
  "excluded",
];

const MATCH_LEVELS = [
  { value: "", label: "Any match" },
  { value: "70", label: "70 and up" },
  { value: "85", label: "85 and up" },
];

/**
 * Where the lead is in the sequence, in two lines: the state, then what that
 * state means for the reader. A bare "messaged" tells nobody whose turn it is.
 */
function stepLine(lead: Lead): { title: string; detail: string; yours: boolean } {
  switch (lead.step) {
    case "found":
      return { title: "Found", detail: "Waiting its turn", yours: false };
    case "queued":
      return {
        title: "In today's queue",
        detail: "The invitation goes out next",
        yours: false,
      };
    case "invited":
      return {
        title: "Invitation sent",
        detail: "Waiting for them to accept",
        yours: false,
      };
    case "accepted":
      return {
        title: "Invitation accepted",
        detail: "The first message is next",
        yours: false,
      };
    case "messaged":
      return { title: "Messaged", detail: "No reply yet", yours: false };
    case "replied":
      return {
        title: "Replied",
        detail: "This conversation is yours",
        yours: true,
      };
    case "finished":
      return {
        title: "Finished",
        detail: "The agent has stopped for this person",
        yours: true,
      };
    case "skipped":
      return {
        title: "Skipped",
        detail: lead.excludedReason ?? "Nothing was sent",
        yours: false,
      };
    case "excluded":
      return {
        title: "Left alone",
        detail: lead.excludedReason ?? "Excluded from this campaign",
        yours: false,
      };
    default:
      return { title: STEP_LABEL[lead.step] ?? lead.step, detail: "", yours: false };
  }
}

/** Which source found them, said the way the Sources tab says it. */
function sourceLine(source: Source | undefined): string | null {
  if (!source) return null;
  switch (source.type) {
    case "competitor":
      return `Competitor watched: ${source.label}`;
    case "keyword":
    case "market":
      return `Keyword: ${source.label}`;
    case "buying_event":
      return `Recent job change: ${source.label}`;
    case "brand":
      return `Viewed your profile: ${source.label}`;
    case "linkedin_search":
      return `Saved search: ${source.label}`;
    case "csv":
      return `Imported list: ${source.label}`;
    default:
      return source.label;
  }
}

function longAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days >= 2) return `${days} days ago`;
  if (days === 1) return "yesterday";
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours >= 1) return `${hours} hours ago`;
  return "today";
}

export function LeadsTab({ agentId }: { agentId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState("");
  const [source, setSource] = useState("");
  const [minScore, setMinScore] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (step) params.set("step", step);
      if (source) params.set("source", source);
      if (minScore) params.set("minScore", minScore);
      if (page) params.set("page", String(page));
      const res = await fetch(
        `/api/agents/${agentId}/leads?${params.toString()}`,
        { signal }
      );
      if (!res.ok) return;
      setData(await res.json());
      setLoading(false);
    },
    [agentId, search, step, source, minScore, page]
  );

  // Typing re-runs the query, so it waits for a pause rather than firing on
  // every keystroke.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        load(controller.signal).catch(() => {});
      },
      search ? 300 : 0
    );
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

  async function reject(leadId: string) {
    setRejecting(leadId);
    await fetch(`/api/agents/${agentId}/leads`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", leadId }),
    }).catch(() => {});
    await load().catch(() => {});
    setRejecting(null);
  }

  const leads = data?.leads ?? [];
  const sources = data?.sources ?? [];
  const filtered = Boolean(search || step || source || minScore);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
          placeholder="Search by name, company, job title"
          className="h-10 min-w-52 flex-1 rounded-lg border border-border bg-card px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden dark:text-white"
        />
        <Chip
          value={step}
          onChange={(v) => {
            setPage(0);
            setStep(v);
          }}
          options={[
            { value: "", label: "All steps" },
            ...FILTER_STEPS.map((s) => ({
              value: s,
              label: `${STEP_LABEL[s] ?? s}${data?.steps[s] ? ` (${data.steps[s]})` : ""}`,
            })),
          ]}
        />
        {sources.length > 0 && (
          <Chip
            value={source}
            onChange={(v) => {
              setPage(0);
              setSource(v);
            }}
            options={[
              { value: "", label: "All sources" },
              ...sources.map((s) => ({ value: s.id, label: s.label })),
            ]}
          />
        )}
        <Chip
          value={minScore}
          onChange={(v) => {
            setPage(0);
            setMinScore(v);
          }}
          options={MATCH_LEVELS}
        />
        <div className="flex-1" />
        <span className="text-xs text-slate-400 tabular-nums dark:text-slate-500">
          {loading ? "Loading" : `${data?.total ?? 0} leads`}
        </span>
        <a
          href={`/api/agents/${agentId}/leads/export`}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-600 dark:text-slate-200"
        >
          Export CSV
        </a>
      </div>

      {!loading && leads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<AgentIcon className="h-6 w-6" />}
            title={filtered ? "Nothing matches that filter" : "No leads yet"}
            description={
              filtered
                ? "Clear the filters to see everyone the agent has found."
                : "The agent adds people here as it finds them, with the post or comment that made it pick each one."
            }
          />
        </div>
      ) : (
        <Table
          columns={[
            { label: "Contact", width: "20%" },
            { label: "Signal", width: "25%" },
            { label: "Match", width: "17%" },
            { label: "Step", width: "18%" },
            { label: "Found on", width: "11%" },
            { label: "", width: "9%" },
          ]}
        >
          {leads.map((lead) => {
            const state = stepLine(lead);
            const from = sourceLine(sources.find((s) => s.id === lead.sourceId));
            return (
              <Row key={lead.id}>
                <Cell>
                  <Contact
                    name={lead.fullName}
                    title={
                      [lead.jobTitle, lead.company].filter(Boolean).join(", ") ||
                      lead.headline
                    }
                    avatarUrl={lead.avatarUrl}
                    profileUrl={lead.profileUrl}
                  />
                </Cell>
                <Cell label="Signal">
                  {lead.signalText ? (
                    lead.signalUrl ? (
                      <a
                        href={lead.signalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-blue-600/40 text-[13px] text-blue-600 dark:text-blue-400"
                      >
                        {lead.signalText}
                      </a>
                    ) : (
                      <span className="text-[13px] text-slate-700 dark:text-slate-200">
                        {lead.signalText}
                      </span>
                    )
                  ) : (
                    <span className="text-[13px] text-slate-400">-</span>
                  )}
                  {from && (
                    <div className="mt-[3px] text-xs text-slate-500 dark:text-slate-400">
                      {from}
                    </div>
                  )}
                </Cell>
                <Cell label="Match">
                  <MatchBar score={lead.matchScore} reason={lead.matchReason} />
                </Cell>
                <Cell label="Step">
                  <b
                    className={cn(
                      "block text-[13px] font-semibold",
                      state.yours
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-slate-900 dark:text-white"
                    )}
                  >
                    {state.title}
                  </b>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {state.detail}
                  </span>
                </Cell>
                <Cell label="Found on" className="whitespace-nowrap">
                  <span className="text-[13px] text-slate-500 dark:text-slate-400">
                    {longAgo(lead.foundAt)}
                  </span>
                </Cell>
                <Cell>
                  {lead.step === "excluded" || lead.step === "skipped" ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Rejected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reject(lead.id)}
                      disabled={rejecting !== null}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:text-slate-300 dark:hover:border-red-500/40 dark:hover:text-red-400"
                    >
                      {rejecting === lead.id ? "Rejecting" : "Reject"}
                    </button>
                  )}
                </Cell>
              </Row>
            );
          })}
        </Table>
      )}

      {(page > 0 || data?.hasMore) && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5">
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
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Page {page + 1}
          </span>
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
    </div>
  );
}

/** The toolbar's filter chips. A select, dressed as the prototype's chip. */
function Chip({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 max-w-44 rounded-lg border border-border bg-card px-2.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-hidden dark:text-slate-300"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
