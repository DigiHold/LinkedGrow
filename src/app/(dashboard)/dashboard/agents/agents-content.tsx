"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
// One place decides the pace, and it mirrors the worker's safety envelope.
// Keeping a copy here is how the card came to print a ramp the engine was
// never going to follow.
import { RAMP, dayPace, workingDays } from "@/lib/agent-pace";

/**
 * The agents list, built to the v2 dashboard prototype.
 *
 * The shape is the prototype's, point for point: a card per agent, split into
 * the funnel on the left and the agent's state on the right, with a footer
 * carrying who it sends as and the two actions. What it is NOT is a list of
 * every field we hold. Somebody opening this page is asking two questions,
 * "is it working" and "is anything waiting for me", and the design answers
 * both without a click.
 *
 * Colours are the prototype's tokens: brand #2563eb, ok #059669, warn #b45309.
 */

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
  accountId: string;
  warmupStartedAt: string | null;
  warmupStartPerDay: number | null;
  warmupIncrementPerWeek: number | null;
  warmupWeeks: number | null;
  lastRunAt: string | null;
  accountName: string | null;
  accountAvatar: string | null;
  accountStatus: string;
  accountCountry: string;
  timezone: string;
  workdayStart: number;
  workdayEnd: number;
  workdayDays: string;
  createdAt?: string | null;
  funnel?: Funnel;
};

type Payload = {
  agents: Agent[];
  quota: { used: number; limit: number };
};

const COUNTRY = new Intl.DisplayNames(["en"], { type: "region" });

/** "3 days", "in 16 hours". Plain words, never a timestamp. */
function ago(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} ago`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `${mins} minute${mins === 1 ? "" : "s"} ago`;
}

/** Which week of the ramp this account is in, 1-based, or null once it is over. */
function warmupWeek(
  startedAt: string | null,
  of: number
): { week: number; of: number } | null {
  if (!startedAt) return null;
  const weeks = Math.floor((Date.now() - new Date(startedAt).getTime()) / (7 * 86_400_000));
  if (!Number.isFinite(weeks)) return null;
  const week = Math.max(1, weeks + 1);
  return week > of ? null : { week, of };
}


/**
 * When this agent next wakes up, in its own timezone.
 *
 * The card used to say only how many invitations a day it sends, which does not
 * answer the question somebody actually has in front of a quiet agent: is it
 * broken, or is it simply the middle of the night where it lives.
 */
function nextLaunch(agent: Agent): string {
  let local: Date;
  try {
    local = new Date(new Date().toLocaleString("en-US", { timeZone: agent.timezone }));
  } catch {
    local = new Date();
  }
  const minutes = local.getHours() * 60 + local.getMinutes();
  const days = workingDays(agent.workdayDays);
  const open = days.includes(local.getDay());

  if (open && minutes >= agent.workdayStart && minutes < agent.workdayEnd) return "now";

  let ahead = 0;
  if (!(open && minutes < agent.workdayStart)) {
    ahead = 1;
    while (ahead < 8 && !days.includes((local.getDay() + ahead) % 7)) ahead++;
    if (ahead >= 8) return "never, no working days are on";
  }
  const until = ahead * 1440 + agent.workdayStart - minutes;
  if (until < 90) return `in ${until} minutes`;
  const hours = Math.round(until / 60);
  if (hours < 36) return `in ${hours} hours`;
  return `in ${Math.round(hours / 24)} days`;
}

function Pill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "neutral" | "brand";
  children: React.ReactNode;
}) {
  const tones = {
    ok: "text-emerald-700 border-emerald-600/35 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10",
    warn: "text-amber-700 border-amber-700/35 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10",
    brand: "text-blue-700 border-blue-600/35 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/10",
    neutral: "text-slate-600 border-border bg-slate-50 dark:text-slate-300 dark:bg-white/5",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

const STATUS: Record<Agent["status"], { label: string; tone: "ok" | "warn" | "neutral" | "brand" }> =
  {
    active: { label: "Active", tone: "ok" },
    warming: { label: "Warming up", tone: "brand" },
    paused: { label: "Paused", tone: "warn" },
    stopped: { label: "Stopped", tone: "neutral" },
    blocked: { label: "Needs attention", tone: "warn" },
  };

/**
 * The funnel as one bar rather than four numbers in boxes.
 *
 * Each segment is sized by its own count, so the drop between stages is the
 * thing you see first, which is the only reading of a funnel that means
 * anything. The trailing grey is whatever has not moved yet.
 */
function Funnel({ funnel }: { funnel: Funnel }) {
  const stages = [
    { label: "found", value: funnel.found, opacity: "opacity-100" },
    { label: "contacted", value: funnel.contacted, opacity: "opacity-70" },
    { label: "accepted", value: funnel.accepted, opacity: "opacity-50" },
    { label: "replied", value: funnel.replied, opacity: "opacity-30" },
  ];
  const total = Math.max(funnel.found, 1);
  const rest = Math.max(0, total - funnel.contacted);

  return (
    <div className="border-b border-border p-[18px] md:border-b-0 md:border-r">
      <div className="mb-3 flex items-baseline gap-2">
        <b className="text-xs font-semibold text-slate-900 dark:text-white">
          From found to interested
        </b>
        <small className="text-xs text-slate-400 dark:text-slate-500">last 30 days</small>
      </div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        {stages.map((s) => (
          <span
            key={s.label}
            className={cn("block bg-blue-600", s.opacity)}
            style={{ flex: s.value }}
          />
        ))}
        <span style={{ flex: rest }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3.5">
        {stages.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline gap-1.5 text-xs text-slate-500 dark:text-slate-400"
          >
            <i className={cn("inline-block h-2 w-2 rounded-sm bg-blue-600", s.opacity)} />
            <b className="text-[15px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
              {s.value}
            </b>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function StateLine({
  icon,
  wideIcon = false,
  children,
}: {
  icon: React.ReactNode;
  /**
   * The warm-up bars are four pills wide, not a 15px glyph.
   *
   * Every icon on these lines went into a fixed 15px box, which squashed the
   * ramp into four hairline ticks nobody could read as progress.
   */
  wideIcon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px] text-slate-500 dark:text-slate-400">
      <span
        className={cn(
          "flex-none opacity-60",
          wideIcon ? "opacity-100" : "h-[15px] w-[15px]"
        )}
      >
        {icon}
      </span>
      <span className="[&_b]:font-semibold [&_b]:text-slate-900 dark:[&_b]:text-white">
        {children}
      </span>
    </div>
  );
}

const ClockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const ShieldIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z" />
    <path d="M9.2 12l2 2 3.6-4" />
  </svg>
);
const GlobeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M4 12h16M12 4a14 14 0 000 16M12 4a14 14 0 010 16" />
  </svg>
);

/** The four small dashes that say how far along the ramp this account is. */
function WarmupDots({ week, of = 4 }: { week: number | null; of?: number }) {
  return (
    <span className="flex flex-none gap-[3px]">
      {Array.from({ length: Math.max(1, of) }, (_, i) => i + 1).map((w) => (
        <u
          key={w}
          className={cn(
            "h-[5px] w-4 rounded-full",
            week === null && "bg-slate-200 dark:bg-white/10",
            week !== null && w < week && "bg-blue-600/45",
            week !== null && w === week && "bg-blue-600",
            week !== null && w > week && "bg-slate-200 dark:bg-white/10"
          )}
        />
      ))}
    </span>
  );
}

export function AgentsContent() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // How many agents send from each LinkedIn account. The daily cap belongs to
  // the account, so two agents on one divide it rather than each getting their
  // own, and the card has to say so.
  const perAccount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of data?.agents ?? []) {
      counts.set(a.accountId, (counts.get(a.accountId) ?? 0) + 1);
    }
    return counts;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agents")
      .then(async (r) => {
        // A signed-out session is not a broken page, and saying "could not
        // load your agents" for it sends somebody hunting a bug that is not
        // there. It cost Nicolas a diagnosis on 2026-07-31.
        if (r.status === 401) throw new Error("__signedout__");
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
  const running = (data?.agents ?? []).filter(
    (a) => a.status === "active" || a.status === "warming"
  ).length;
  const atLimit = quota ? quota.used >= quota.limit : false;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-[-0.035em] text-slate-900 dark:text-white">
            Agents
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Each agent runs one LinkedIn account, one audience, on its own dedicated address.
          </p>
        </div>
        <div className="flex-1" />
        {quota && (
          <Pill tone="neutral">
            {running} / {quota.limit} running
          </Pill>
        )}
        <Link
          href={atLimit ? "/dashboard/upgrade" : "/dashboard/agents/new"}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Create an agent
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {error === "__signedout__" ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Your session has expired
            </p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              Nothing is wrong with your agents. Sign in again and they are all still here.
            </p>
            <Link
              href="/sign-in"
              className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Sign in
            </Link>
          </div>
        ) : (
          error && (
            <p className="rounded-2xl border border-border bg-card p-5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )
        )}

        {!data && !error && (
          <>
            {[0, 1].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </>
        )}

        {data?.agents.map((agent) => {
          const status = STATUS[agent.status];
          const siblings = perAccount.get(agent.accountId) ?? 1;
          const ramp = warmupWeek(agent.warmupStartedAt, Math.max(1, agent.warmupWeeks ?? RAMP.weeks));
          const country = (() => {
            try {
              return COUNTRY.of(agent.accountCountry) ?? agent.accountCountry;
            } catch {
              return agent.accountCountry;
            }
          })();
          const paused = agent.status === "paused" || agent.status === "stopped";
          const funnel = agent.funnel ?? {
            found: 0,
            contacted: 0,
            accepted: 0,
            replied: 0,
            unread: 0,
          };

          return (
            <div
              key={agent.id}
              className={cn(
                "overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-slate-300 dark:hover:border-white/20",
                paused && "opacity-95"
              )}
            >
              <div className="flex items-center gap-3 px-[18px] pb-3.5 pt-4">
                {agent.accountAvatar ? (
                  <Image
                    src={agent.accountAvatar}
                    alt=""
                    width={38}
                    height={38}
                    className="h-[38px] w-[38px] flex-none rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    {(agent.accountName || agent.name).slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <b className="font-display block truncate text-[17px] font-bold tracking-[-0.035em] text-slate-900 dark:text-white">
                    {agent.name}
                  </b>
                  {agent.icpSummary && (
                    <div className="mt-0.5 truncate text-[12.5px] text-slate-500 dark:text-slate-400">
                      {agent.icpSummary}
                    </div>
                  )}
                </div>
                <div className="flex-1" />
                <Pill tone={status.tone}>
                  {agent.status === "active" && (
                    <i className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  )}
                  {status.label}
                </Pill>
              </div>

              <div className="grid border-t border-border md:grid-cols-[1.15fr_1fr]">
                <Funnel funnel={funnel} />

                <div className="grid content-start gap-2.5 p-[18px]">
                  <StateLine icon={ClockIcon}>
                    {paused ? (
                      <>
                        Paused by you, <b>nothing is being sent</b>
                      </>
                    ) : (
                      <>
                        Next launch <b>{nextLaunch(agent)}</b>, sending{" "}
                        <b>{dayPace(agent, ramp?.week ?? (agent.warmupWeeks ?? RAMP.weeks))} invitations</b>
                        {siblings > 1 && ` shared with ${siblings - 1} other agent`}
                      </>
                    )}
                  </StateLine>
                  <StateLine
                    wideIcon
                    icon={<WarmupDots week={ramp?.week ?? null} of={ramp?.of ?? 4} />}
                  >
                    {ramp ? (
                      <>
                        Warm-up <b>week {ramp.week} of {ramp.of}</b>, {dayPace(agent, ramp.week)} a
                        day now, then {dayPace(agent, ramp.of)}
                      </>
                    ) : agent.warmupStartedAt ? (
                      <>
                        Warm-up <b>finished</b>, running at its full pace
                      </>
                    ) : (
                      "Warm-up starts when you activate it"
                    )}
                  </StateLine>
                  <StateLine icon={ShieldIcon}>
                    Account health{" "}
                    {agent.accountStatus === "active" ? (
                      <>
                        <b className="!text-emerald-700 dark:!text-emerald-400">fine</b>, no
                        verification asked
                      </>
                    ) : (
                      <>
                        <b className="!text-amber-700 dark:!text-amber-400">needs attention</b>,
                        LinkedIn is asking to verify
                      </>
                    )}
                  </StateLine>
                  <StateLine icon={GlobeIcon}>
                    Dedicated address in <b>{country}</b>
                    {agent.warmupStartedAt ? ", unchanged since day one" : ", reserved and waiting"}
                  </StateLine>
                </div>
              </div>

              {agent.pausedReason && (
                <p className="border-t border-border bg-amber-50 px-[18px] py-2.5 text-[12.5px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  {agent.pausedReason}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5 border-t border-border bg-slate-50 px-[18px] py-3 text-xs text-slate-500 dark:bg-white/[0.02] dark:text-slate-400">
                <span>
                  Sending as{" "}
                  <b className="font-semibold text-slate-900 dark:text-white">
                    {agent.accountName || "this account"}
                  </b>
                </span>
                {ago(agent.lastRunAt) && (
                  <>
                    <span>·</span>
                    <span>last run {ago(agent.lastRunAt)}</span>
                  </>
                )}
                {funnel.unread > 0 && (
                  <>
                    <span>·</span>
                    <span>
                      <b className="font-semibold text-slate-900 dark:text-white">
                        {funnel.unread} repl{funnel.unread === 1 ? "y" : "ies"}
                      </b>{" "}
                      waiting for you
                    </span>
                  </>
                )}
                <div className="flex-1" />
                <Link
                  href={`/dashboard/agents/${agent.id}`}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Open agent
                </Link>
              </div>
            </div>
          );
        })}

        {data && (
          <Link
            href={atLimit ? "/dashboard/upgrade" : "/dashboard/agents/new"}
            className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-dashed border-slate-300 p-[22px] transition-colors hover:border-blue-600/50 dark:border-white/15"
          >
            <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-blue-50 text-lg text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              +
            </div>
            <div>
              <b className="block text-sm font-semibold text-slate-900 dark:text-white">
                {data.agents.length === 0 ? "Create your first agent" : "Add another agent"}
              </b>
              <small className="text-[12.5px] text-slate-500 dark:text-slate-400">
                One more LinkedIn account, one more audience, its own dedicated address.
              </small>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
