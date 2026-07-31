"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
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
 * It shows the present when there is one. The worker writes what it is about to
 * do before it does it, so this reads "Liking a post by Thomas Blanc" while the
 * browser on the server is doing exactly that, with his face beside it. When
 * every agent is idle it falls back to the last few things they finished, and
 * when there is neither it renders nothing at all, which is most of the time.
 *
 * One box, however many agents are running. Several tickers stacked in one
 * corner would turn a working product into a wall of noise.
 */

interface Doing {
  agentId: string;
  agentName: string;
  /** Present tense, reading on from the agent: "liking a post by". */
  verb: string;
  subjectName: string | null;
  subjectAvatar: string | null;
  subjectUrl: string | null;
  detail: string | null;
  startedAt: string;
}

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
/** How long each finished event holds the line before the next one takes it. */
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

/** "started 12 seconds ago", counted in the browser so it moves. */
function startedAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) {
    return `started ${seconds} second${seconds === 1 ? "" : "s"} ago`;
  }
  const minutes = Math.round(seconds / 60);
  return `started ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

/** "Liking a post by Thomas Blanc". */
function sentence(doing: Doing): string {
  const subject = doing.subjectName ?? doing.detail ?? "";
  const line = subject ? `${doing.verb} ${subject}` : doing.verb;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

export function LiveTicker() {
  const [doing, setDoing] = useState<Doing[]>([]);
  const [events, setEvents] = useState<TickEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Collapsed to a single line by default. On a phone that is the difference between a hint
  // and something covering what somebody is reading.
  const [open, setOpen] = useState(false);
  const seen = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/live", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { doing?: Doing[]; events?: TickEvent[] };
      const live = data.doing ?? [];
      const fresh = (data.events ?? []).filter(
        (e) => Date.now() - new Date(e.createdAt).getTime() < FRESH_MS
      );
      setDoing(live);
      setEvents(fresh);
      // Something new arrived, so a box the person closed earns the right to come back.
      const newest = live[0]?.startedAt ?? fresh[0]?.id ?? null;
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

  // The age of the current action ticks up on its own, so the box reads as live
  // between polls rather than freezing on a number for eight seconds.
  useEffect(() => {
    if (doing.length === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [doing.length]);

  // Take it in turn, so one busy agent cannot hide the others.
  useEffect(() => {
    const length = doing.length > 0 ? doing.length : events.length;
    if (length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [doing.length, events.length]);

  if (dismissed) return null;

  const current = doing.length > 0 ? doing[Math.min(index, doing.length - 1)] : null;
  const event =
    current === null && events.length > 0
      ? events[Math.min(index, events.length - 1)]
      : null;
  if (!current && !event) return null;

  const agentId = current?.agentId ?? event?.agentId ?? "";
  const agentName = current?.agentName ?? event?.agentName ?? "Agent";
  const others = doing.length > 0 ? doing.length : events.length;

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
          "pointer-events-auto overflow-hidden border border-border bg-white/95 shadow-sm backdrop-blur",
          "transition-all duration-300 dark:bg-slate-900/95",
          current
            ? "w-[19rem] rounded-2xl shadow-lg sm:w-[19.5rem]"
            : open
              ? "rounded-2xl shadow-lg sm:w-[26rem]"
              : "rounded-full sm:w-[22rem] sm:rounded-2xl sm:shadow-md"
        )}
      >
        {current ? (
          <>
            {/* The present. Who is working, and for how long. */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="relative flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                <SearchGlyph />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/agents/${agentId}`}
                  className="block truncate text-[13px] font-semibold text-slate-900 hover:underline dark:text-white"
                >
                  {agentName}
                </Link>
                <span className="block truncate text-[11.5px] text-slate-400 dark:text-slate-500">
                  {startedAgo(current.startedAt, now)}
                </span>
              </span>
              <span className="flex flex-none items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Hide"
                className="flex-none px-1 text-[15px] leading-none text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            {/* What it is doing, in the present, with the face of whoever it is
                doing it to. */}
            <div className="flex items-center gap-2.5 border-t border-border bg-slate-50 px-3 py-2.5 dark:bg-white/[0.03]">
              {current.subjectAvatar ? (
                <Image
                  src={current.subjectAvatar}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 flex-none rounded-full object-cover"
                />
              ) : (
                <span className="flex flex-none gap-[3px]">
                  <Dot delay="0ms" />
                  <Dot delay="180ms" />
                  <Dot delay="360ms" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-600 dark:text-slate-300">
                {sentence(current)}
              </span>
              {others > 1 && (
                <span className="flex-none text-[11px] text-slate-400 tabular-nums dark:text-slate-500">
                  {index + 1}/{others}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left sm:gap-3 sm:px-4 sm:py-3"
            >
              <span className="relative flex h-2 w-2 flex-none">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                    TONE[event?.type ?? ""] ?? "bg-slate-400"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    TONE[event?.type ?? ""] ?? "bg-slate-400"
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
                  {event?.message}
                </span>
                {open && (
                  <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                    {agentName}
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
                        i === index
                          ? "bg-slate-500 dark:bg-slate-300"
                          : "bg-slate-300 dark:bg-slate-700"
                      )}
                    />
                  ))}
                </span>
              )}
            </button>

            {open && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 sm:px-4">
                <Link
                  href={`/dashboard/agents/${agentId}`}
                  className="truncate text-[13px] font-semibold text-slate-900 hover:underline dark:text-white"
                >
                  Open {agentName}
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
          </>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1 w-1 animate-pulse rounded-full bg-blue-600"
      style={{ animationDelay: delay }}
    />
  );
}

function SearchGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
