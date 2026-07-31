"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/ui/page";
import { AnalyticsIcon } from "@/components/dashboard/nav-icons";
import { Cell, Row, Table } from "./lead-bits";

type Event = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  leadName: string | null;
  leadUrl: string | null;
  leadAvatar: string | null;
};

const WINDOWS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All activity" },
];

/**
 * The headline for each kind of event.
 *
 * The stored message is already a finished sentence, so it goes in the result
 * column and this only names the kind, which is what makes the table scannable.
 */
const HEADLINE: Record<string, string> = {
  sourcing: "Looked for leads",
  lead: "Found new people",
  reply: "Replied to you",
  accepted: "Invitation accepted",
  invite: "Invitation sent",
  message: "Message sent",
  error: "Something went wrong",
  budget: "Reached its AI budget",
  paused: "Paused",
  blocked: "Stopped on a problem",
  country: "Address problem",
};

function longAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 2) return `${days} days ago`;
  if (days === 1) return "a day ago";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const mins = Math.floor(ms / 60_000);
  if (mins >= 1) return `${mins} minutes ago`;
  return "just now";
}

export function ActivityTab({ agentId }: { agentId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [windowKey, setWindowKey] = useState("7d");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/agents/${agentId}/activity?window=${windowKey}&page=${page}`
    );
    if (!res.ok) return;
    const json = await res.json();
    setEvents(json.events);
    setTotal(json.total);
    setHasMore(json.hasMore);
    setLoading(false);
  }, [agentId, windowKey, page]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  /**
   * Keep the newest page live.
   *
   * The first thing anyone does after starting an agent is sit on this tab waiting to see it work,
   * and until now nothing arrived without reloading the browser, so a working agent looked like a
   * dead one. Only the first page of the most recent window refreshes: paging back through history
   * should not move under the reader, and an old window has nothing new to show.
   */
  useEffect(() => {
    if (page !== 0 || windowKey === "all") return;
    const timer = setInterval(() => {
      // Nothing to update while the tab is in the background, and a phone should not spend its
      // battery polling a page nobody is looking at.
      if (document.visibilityState !== "visible") return;
      load().catch(() => {});
    }, 10_000);
    return () => clearInterval(timer);
  }, [load, page, windowKey]);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => {
              setPage(0);
              setWindowKey(w.key);
            }}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
              windowKey === w.key
                ? "border-blue-500 bg-blue-50/60 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                : "border-border bg-card text-slate-600 hover:border-blue-500 hover:text-blue-600 dark:text-slate-300"
            )}
          >
            {w.label}
          </button>
        ))}
        <div className="flex-1" />
        {!loading && (
          <span className="text-xs text-slate-400 tabular-nums dark:text-slate-500">
            {total} events
          </span>
        )}
      </div>

      {!loading && events.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<AnalyticsIcon className="h-6 w-6" />}
            title="Nothing in this window"
            description="Every action the agent takes is written down here in plain words, including the ones that failed."
          />
        </div>
      ) : (
        <Table
          columns={[
            { label: "What happened", width: "20%" },
            { label: "Who", width: "18%" },
            { label: "Result", width: "47%" },
            { label: "When", width: "15%" },
          ]}
        >
          {events.map((event) => (
            <Row key={event.id} highlight={event.type === "reply"}>
              <Cell>
                <b
                  className={cn(
                    "text-[13px] font-semibold",
                    event.type === "reply"
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-slate-900 dark:text-white"
                  )}
                >
                  {HEADLINE[event.type] ?? event.type}
                </b>
              </Cell>
              <Cell label="Who">
                {event.leadName && event.leadUrl ? (
                  <a
                    href={event.leadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-slate-700 underline-offset-2 hover:underline dark:text-slate-200"
                  >
                    {event.leadName}
                  </a>
                ) : (
                  <span className="text-[13px] text-slate-400 dark:text-slate-500">
                    -
                  </span>
                )}
              </Cell>
              <Cell label="Result">
                <span className="text-[13px] text-slate-500 dark:text-slate-400">
                  {event.message}
                </span>
              </Cell>
              <Cell label="When" className="whitespace-nowrap">
                <span className="text-[13px] text-slate-400 dark:text-slate-500">
                  {longAgo(event.createdAt)}
                </span>
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      {(page > 0 || hasMore) && (
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
            disabled={!hasMore}
            className={cn(
              "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold",
              hasMore
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
