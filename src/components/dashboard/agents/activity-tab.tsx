"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Panel, EmptyState, Pill } from "@/components/dashboard/ui/page";
import { AnalyticsIcon } from "@/components/dashboard/nav-icons";
import { Avatar, When } from "./lead-bits";

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
  { key: "all", label: "Everything" },
];

/** A colour per kind of event, so a scan finds the failures. */
const TONE: Record<string, "good" | "warn" | "brand" | "neutral"> = {
  reply: "good",
  accepted: "good",
  error: "warn",
  blocked: "warn",
  country: "warn",
  invite: "brand",
  message: "brand",
};

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
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => {
              setPage(0);
              setWindowKey(w.key);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              windowKey === w.key
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-border text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
            )}
          >
            {w.label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-xs text-slate-400 tabular-nums dark:text-slate-500">
            {total} events
          </span>
        )}
      </div>

      <Panel padded={false}>
        {!loading && events.length === 0 ? (
          <EmptyState
            icon={<AnalyticsIcon className="h-6 w-6" />}
            title="Nothing in this window"
            description="Every action the agent takes is written down here in plain words, including the ones that failed."
          />
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3 px-5 py-3.5">
                {event.leadName ? (
                  <Avatar
                    src={event.leadAvatar}
                    name={event.leadName}
                    size={32}
                  />
                ) : (
                  <span className="h-8 w-8 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {event.message}
                  </p>
                  {event.leadName && event.leadUrl && (
                    <a
                      href={event.leadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
                    >
                      {event.leadName}
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Pill tone={TONE[event.type] ?? "neutral"}>{event.type}</Pill>
                  <When value={event.createdAt} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {(page > 0 || hasMore) && (
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
      </Panel>
    </div>
  );
}
