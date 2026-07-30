"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * What the agents are doing, right now, wherever you are in the dashboard.
 *
 * The first hour after somebody starts their first agent is the whole of their impression of the
 * product, and until now every page in the dashboard fetched once and then sat still. An agent
 * that had found thirty-five people looked exactly like an agent that had found none, unless the
 * person thought to reload.
 *
 * One box, however many agents are running. Several tickers stacked up would compete for the same
 * corner and turn a working product into a wall of noise, so events from every agent share one
 * line and take it in turn. The newest event is always the one shown first.
 *
 * It renders nothing at all when nothing is happening, which is most of the time.
 */

interface TickEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: string;
  message: string;
  createdAt: string;
}

/** How often to ask. Cheap query, and the point of the thing is that it feels immediate. */
const POLL_MS = 8_000;
/** How long each event holds the line before the next one takes it. */
const ROTATE_MS = 4_500;
/** Nothing older than this is worth interrupting somebody with. */
const FRESH_MS = 10 * 60 * 1000;

const TONE: Record<string, string> = {
  lead: "bg-emerald-500",
  reply: "bg-emerald-500",
  accepted: "bg-emerald-500",
  invite: "bg-cyan-500",
  message: "bg-cyan-500",
  sourcing: "bg-slate-400",
  error: "bg-amber-500",
  blocked: "bg-amber-500",
  budget: "bg-amber-500",
};

export function LiveTicker() {
  const [events, setEvents] = useState<TickEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  // Collapsed to a single line by default. On a phone that is the difference between a hint
  // and something covering what somebody is reading.
  const [open, setOpen] = useState(false);
  const seen = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/live", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { events?: TickEvent[] };
      const fresh = (data.events ?? []).filter(
        (e) => Date.now() - new Date(e.createdAt).getTime() < FRESH_MS
      );
      setEvents(fresh);
      // Something new arrived, so a box the person closed earns the right to come back.
      const newest = fresh[0]?.id ?? null;
      if (newest && newest !== seen.current) {
        seen.current = newest;
        setDismissed(false);
        setIndex(0);
      }
    } catch {
      // A missed poll is not worth showing anybody. The next one is eight seconds away.
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Take it in turn, so one busy agent cannot hide the others.
  useEffect(() => {
    if (events.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % events.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [events.length]);

  if (dismissed || events.length === 0) return null;
  const event = events[Math.min(index, events.length - 1)];
  if (!event) return null;

  const agents = new Set(events.map((e) => e.agentId)).size;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50",
        // On a phone it sits in the corner and takes only the width it needs, clear of anything
        // anchored to the bottom of the screen. On a laptop it can afford to be a card.
        "bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 max-w-[calc(100vw-1.5rem)]",
        "sm:bottom-6 sm:right-6"
      )}
    >
      <div
        className={cn(
          "pointer-events-auto overflow-hidden rounded-full border border-border bg-white/90 shadow-sm backdrop-blur",
          "transition-all duration-300 dark:bg-slate-900/90",
          // The card shape only appears once there is room for it, and when the person opens it.
          open ? "rounded-2xl shadow-lg sm:w-[26rem]" : "sm:rounded-2xl sm:shadow-md sm:w-[22rem]"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left sm:gap-3 sm:px-4 sm:py-3"
        >
          <span className="relative flex h-2 w-2 flex-none">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                TONE[event.type] ?? "bg-slate-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                TONE[event.type] ?? "bg-slate-400"
              )}
            />
          </span>

          <span className="min-w-0 flex-1">
            {/* One line on a phone until it is opened, so it never covers what somebody is reading. */}
            <span
              className={cn(
                "block text-[13px] leading-snug text-slate-700 dark:text-slate-200",
                open ? "" : "truncate"
              )}
            >
              {event.message}
            </span>
            {open && (
              <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                {event.agentName}
                {agents > 1 ? ` and ${agents - 1} other agent${agents > 2 ? "s" : ""}` : ""}
              </span>
            )}
          </span>

          {events.length > 1 && (
            <span className="hidden flex-none gap-1 sm:flex">
              {events.slice(0, 6).map((e, i) => (
                <span
                  key={e.id}
                  className={cn(
                    "h-1 w-1 rounded-full transition-colors",
                    i === index ? "bg-slate-500 dark:bg-slate-300" : "bg-slate-300 dark:bg-slate-700"
                  )}
                />
              ))}
            </span>
          )}
        </button>

        {open && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 sm:px-4">
            <Link
              href={`/dashboard/agents/${event.agentId}`}
              className="truncate text-[13px] font-semibold text-slate-900 hover:underline dark:text-white"
            >
              Open {event.agentName}
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
              }}
              className="flex-none rounded-lg px-2 py-1 text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Hide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
