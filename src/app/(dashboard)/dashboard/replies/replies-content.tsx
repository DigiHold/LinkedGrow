"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageShell, PageHeader, Panel, Pill, EmptyState } from "@/components/dashboard/ui/page";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ReplyIcon } from "@/components/dashboard/nav-icons";
import { Avatar, LinkedInGlyph, MatchBar } from "@/components/dashboard/agents/lead-bits";

/**
 * The people who answered.
 *
 * A reply does not end the sequence, which is the difference between this and
 * every broadcast tool: the agent reads what came back and answers it, and
 * only stops when somebody asks for a price, a demo, a call, or anything else
 * a person has to give. This page shows which of the two is happening on every
 * thread, and lets the customer take any one of them over by hand.
 *
 * It shows the whole thread rather than the last line: answering somebody
 * without reading what was already said in your name is how you contradict
 * your own agent.
 *
 * There is no reply box. Sending from here would mean driving the customer's
 * LinkedIn to write a message they did not have the thread in front of them
 * for, and the thread is on LinkedIn anyway. The button opens it there.
 */

type Message = { from: "in" | "out"; body: string; at: string };

type Outcome = "meeting" | "customer" | "not_a_fit";

type Thread = {
  leadId: string;
  agentId: string;
  agentName: string;
  outcome: Outcome | null;
  unread: boolean;
  repliedAt: string;
  lastReply: string;
  fullName: string;
  title: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  matchScore: number | null;
  signalText: string | null;
  sequenceStatus: string | null;
  assignedTo: string | null;
  accountId: string | null;
  accountName: string | null;
  accountAvatarUrl: string | null;
  messages: Message[];
};

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isOwner: boolean;
};

/** First name where there is one, the address otherwise. Nobody reads a uuid. */
function memberLabel(member: Member | undefined): string {
  if (!member) return "Someone";
  const name = (member.name ?? "").trim();
  return name ? name.split(" ")[0] : member.email.split("@")[0];
}

/**
 * Whether the agent is done with this person, and what it does next.
 *
 * Read off sequence_status rather than off "they replied". A reply is not a
 * hand-over: most first answers are "nice connecting" and the whole point of
 * the sequence is that it keeps talking through those. It stops for good only
 * once the ask has gone out, or when somebody says something a person has to
 * answer, and saying otherwise on this page told the customer to take over a
 * conversation the agent was still running.
 */
/** The state in two words, so it reads off the list without opening anything. */
function statusPill(status: string | null) {
  const next = whatHappensNext(status);
  if (next.closed) return <Pill tone="neutral">Closed</Pill>;
  return next.done ? (
    <Pill tone="warn">Yours now</Pill>
  ) : (
    <Pill tone="brand">Agent replying</Pill>
  );
}

/**
 * Three states, not two, and the difference is who owes what. "Yours now"
 * means a person has to act. On 2026-08-17 it was also stamped on stopped
 * threads (a refusal the agent wound down: nobody should inherit a no) and on
 * skipped ones (the sequence will not pitch them, but the agent still answers
 * their replies), so the list told Nicolas to take over conversations that
 * were either finished on purpose or still being handled.
 */
function whatHappensNext(status: string | null): { done: boolean; closed?: boolean; line: string } {
  switch (status) {
    case "handed_over":
      return { done: true, line: "The agent has stopped writing to this person. Over to you." };
    case "stopped":
      return {
        done: true,
        closed: true,
        line: "The agent closed this thread: they declined, or they were selling rather than buying.",
      };
    case "skipped":
      return {
        done: false,
        line: "The sequence will not pitch this person, but the agent still answers them.",
      };
    case "ask_sent":
      return {
        done: true,
        line: "The ask has gone out, which was the last message. Over to you.",
      };
    case "conversing":
      return { done: false, line: "The agent answers this on its next pass." };
    case "hello_answered":
      return { done: false, line: "The first real message goes out in a few hours." };
    default:
      return { done: false, line: "The agent is still working this conversation." };
  }
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 2) return `${days} days ago`;
  if (days === 1) return "yesterday";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `${mins} minutes ago`;
}

export function RepliesContent() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<string | null>(null);
  /** all, or the ones I own, or the ones nobody owns. Teams only. */
  const [scope, setScope] = useState<"all" | "mine" | "free">("all");
  const [open, setOpen] = useState<string | null>(null);
  /** The conversation the confirm modal is asking about, if any. */
  const [takingOver, setTakingOver] = useState<string | null>(null);
  const [savingOutcome, setSavingOutcome] = useState<string | null>(null);
  const [handing, setHanding] = useState(false);

  const load = useCallback(() => {
    fetch("/api/replies")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        setThreads(json?.threads ?? []);
        setMembers(json?.members ?? []);
        setMe(json?.me ?? null);
      })
      .catch(() => setThreads([]));
  }, []);

  useEffect(load, [load]);

  // A reply that lands while somebody is on this page should appear on it.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      load();
    }, 20_000);
    return () => clearInterval(timer);
  }, [load]);

  /**
   * Stops the agent on one conversation, and only that one.
   *
   * The agent keeps working every other thread. This writes the same state the
   * engine sets when it decides a reply needs a person, so there is one way to
   * be handed over rather than two.
   */
  async function takeOver(leadId: string) {
    setHanding(true);
    try {
      const res = await fetch("/api/replies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, action: "take-over" }),
      });
      if (res.ok) {
        setThreads((all) =>
          (all ?? []).map((t) =>
            t.leadId === leadId ? { ...t, sequenceStatus: "handed_over" } : t
          )
        );
      }
    } catch {
      // The list is reloaded every 20 seconds anyway.
    } finally {
      setHanding(false);
      setTakingOver(null);
    }
  }

  /**
   * Hands one thread to a teammate, or puts it back in the pile.
   *
   * The point is not permission, it is that two people do not answer the same
   * prospect an hour apart each assuming the other had seen it.
   */
  async function assign(leadId: string, assignee: string | null) {
    setThreads((all) =>
      (all ?? []).map((t) => (t.leadId === leadId ? { ...t, assignedTo: assignee } : t))
    );
    await fetch("/api/replies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, action: "assign", assignee }),
    }).catch(() => load());
  }

  /**
   * What actually came of this conversation, in one press.
   *
   * The only signal in the product that is not a proxy. The agent can see a
   * score it guessed, an invitation somebody accepted and a reply somebody
   * typed, and none of those is a customer: on a live agent four of the six
   * people who replied were a coach, a newsletter, a bootcamp and a direct
   * competitor. Without this it learns to find people who answer messages,
   * which is a different population from people who buy.
   *
   * The worker's source ranking weighs a customer at 60 and a meeting at 25
   * against 1 for a headline a model liked, so one press here moves the agent's
   * aim more than a week of mining does.
   */
  async function setOutcome(thread: Thread, outcome: Outcome) {
    if (thread.outcome === outcome) return;
    setSavingOutcome(thread.leadId);
    setThreads((all) =>
      (all ?? []).map((t) => (t.leadId === thread.leadId ? { ...t, outcome } : t))
    );
    await fetch(`/api/agents/${thread.agentId}/leads`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "outcome", leadId: thread.leadId, outcome }),
    }).catch(() => load());
    setSavingOutcome(null);
  }

  /** Opening a conversation is reading it. */
  async function openThread(leadId: string) {
    const next = open === leadId ? null : leadId;
    setOpen(next);
    if (next === null) return;
    setThreads((all) =>
      (all ?? []).map((t) => (t.leadId === leadId ? { ...t, unread: false } : t))
    );
    await fetch("/api/replies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    }).catch(() => {});
  }

  /* One person in the workspace means nothing to divide, so the whole idea of
     an owner stays off the screen until there is a team. */
  const isTeam = members.length > 1;
  const byMember = new Map(members.map((m) => [m.id, m]));
  const all = threads ?? [];
  const shown = !isTeam
    ? all
    : scope === "mine"
      ? all.filter((t) => t.assignedTo === me)
      : scope === "free"
        ? all.filter((t) => !t.assignedTo)
        : all;
  const manyAccounts =
    new Set(all.map((th) => th.accountId).filter(Boolean)).size > 1;

  const unread = (threads ?? []).filter((t) => t.unread).length;
  const takingOverThread = (threads ?? []).find((t) => t.leadId === takingOver) ?? null;

  return (
    <PageShell>
      <PageHeader
        title="Replies"
        description="Everyone who answered. The agent reads each reply and keeps the conversation going, and hands it to you when somebody asks for something only you can give. Take any thread over yourself at any point."
        meta={unread > 0 ? <Pill tone="good">{unread} unread</Pill> : undefined}
      />

      <div className="mt-8">
        {threads === null && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        )}

        {threads !== null && threads.length === 0 && (
          <Panel padded={false}>
            <EmptyState
              icon={<ReplyIcon className="h-6 w-6" />}
              title="No replies yet"
              description="Once an agent is running, every answer lands here within a minute, alongside the messages it had already sent."
              action={
                <Link
                  href="/dashboard/agents"
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Go to your agents
                </Link>
              }
            />
          </Panel>
        )}

        {isTeam && threads !== null && threads.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(
              [
                ["all", `Everyone (${all.length})`],
                ["mine", `Mine (${all.filter((t) => t.assignedTo === me).length})`],
                ["free", `Unassigned (${all.filter((t) => !t.assignedTo).length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScope(key)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  scope === key
                    ? "border-blue-500/40 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    : "border-border text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <ul className="space-y-3">
          {shown.map((thread) => (
            <li
              key={thread.leadId}
              className={cn(
                "overflow-hidden rounded-2xl border bg-card transition-colors",
                thread.unread ? "border-blue-500/40" : "border-border"
              )}
            >
              <button
                type="button"
                onClick={() => openThread(thread.leadId)}
                className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03]"
              >
                {/* The lead's face, and on multi-account workspaces the
                    connected account this conversation belongs to, pinned to
                    its corner so one glance says which profile is talking. */}
                <span className="relative inline-block flex-none">
                  <Avatar src={thread.avatarUrl} name={thread.fullName} size={40} />
                  {manyAccounts && thread.accountId && (
                    <span
                      className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-white dark:ring-slate-900"
                      title={`via ${thread.accountName ?? "connected account"}`}
                    >
                      <Avatar
                        src={thread.accountAvatarUrl}
                        name={thread.accountName ?? "?"}
                        size={18}
                      />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                      {thread.fullName}
                      <LinkedInGlyph />
                    </span>
                    {thread.unread && <Pill tone="good">New</Pill>}
                    {statusPill(thread.sequenceStatus)}
                    {isTeam && thread.assignedTo && (
                      <Pill tone="neutral">
                        {thread.assignedTo === me
                          ? "Mine"
                          : memberLabel(byMember.get(thread.assignedTo))}
                      </Pill>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {ago(thread.repliedAt)}
                    </span>
                  </span>
                  {thread.title && (
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                      {thread.title}
                    </span>
                  )}
                  <span
                    className={cn(
                      "mt-1.5 block text-[13px] leading-relaxed text-slate-700 dark:text-slate-200",
                      open === thread.leadId ? "" : "line-clamp-2"
                    )}
                  >
                    {thread.lastReply}
                  </span>
                </span>
                <span className="hidden shrink-0 sm:block">
                  <MatchBar score={thread.matchScore} reason={null} />
                </span>
              </button>

              {open === thread.leadId && (
                <div className="border-t border-border bg-slate-50 px-4 py-4 dark:bg-white/[0.02]">
                  {thread.signalText && (
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                      Found by {thread.agentName}. {thread.signalText}
                    </p>
                  )}
                  <ol className="space-y-2.5">
                    {thread.messages.map((message, i) => (
                      <li
                        key={`${thread.leadId}-${i}`}
                        className={cn(
                          "max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                          message.from === "in"
                            ? "bg-white text-slate-700 dark:bg-white/10 dark:text-slate-200"
                            : "ml-auto bg-blue-600 text-white"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <p
                          className={cn(
                            "mt-1.5 text-[11px]",
                            message.from === "in"
                              ? "text-slate-400 dark:text-slate-500"
                              : "text-white/70"
                          )}
                        >
                          {message.from === "in" ? thread.fullName : "Your agent"} ·{" "}
                          {ago(message.at)}
                        </p>
                      </li>
                    ))}
                  </ol>
                  <OutcomeRow
                    thread={thread}
                    busy={savingOutcome === thread.leadId}
                    onPick={(outcome) => void setOutcome(thread, outcome)}
                  />
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <a
                      href={thread.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white"
                    >
                      Answer on LinkedIn
                    </a>
                    {!whatHappensNext(thread.sequenceStatus).done && (
                      <button
                        type="button"
                        onClick={() => setTakingOver(thread.leadId)}
                        className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-white dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/5"
                      >
                        Take over
                      </button>
                    )}
                    {isTeam && (
                      <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        Owner
                        <select
                          value={thread.assignedTo ?? ""}
                          onChange={(e) => void assign(thread.leadId, e.target.value || null)}
                          className="rounded-lg border border-border bg-white px-2.5 py-2 text-[13px] font-medium text-slate-700 dark:bg-white/5 dark:text-slate-200"
                        >
                          <option value="">Nobody yet</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.id === me ? "Me" : memberLabel(m)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <span className="self-center text-xs text-slate-500 dark:text-slate-400">
                      {whatHappensNext(thread.sequenceStatus).line}
                    </span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Never the browser's own confirm box: it carries the domain name, it
          cannot be styled, and it stops the page dead. */}
      <ConfirmModal
        confirmText="Stop the agent here"
        description={
          takingOverThread
            ? `Your agent will not write to ${takingOverThread.fullName} again, on this conversation or any later one. Every other conversation carries on exactly as it is. This cannot be undone from here.`
            : undefined
        }
        loading={handing}
        onClose={() => setTakingOver(null)}
        onConfirm={() => {
          if (takingOver) void takeOver(takingOver);
        }}
        open={!!takingOver}
        title="Take this conversation over?"
      />
    </PageShell>
  );
}

/**
 * How it went, asked once, where the answer is already in front of them.
 *
 * Deliberately here rather than on the Leads tab. Somebody reading this thread
 * has just seen how the conversation ended, so the question costs them nothing;
 * asking it in a list of two hundred names would be asking them to remember.
 *
 * Three answers and no fourth. "Maybe" teaches the agent nothing, and an
 * optional free-text box would be a field nobody fills. The wording is what the
 * customer would say out loud, not the funnel's vocabulary.
 */
const OUTCOMES: Array<{ id: Outcome; label: string; tone: string }> = [
  {
    id: "meeting",
    label: "Booked a call",
    tone: "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    id: "customer",
    label: "Became a client",
    tone: "border-emerald-600/50 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  },
  {
    id: "not_a_fit",
    label: "Not a fit",
    tone: "border-slate-400/40 bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  },
];

function OutcomeRow({
  thread,
  busy,
  onPick,
}: {
  thread: Thread;
  busy: boolean;
  onPick: (outcome: Outcome) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-3 dark:bg-white/5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {thread.outcome
          ? "You told the agent how this one went."
          : "How did this one go? It is how your agent learns who actually buys."}
      </span>
      <span className="flex-1" />
      {OUTCOMES.map((option) => {
        const picked = thread.outcome === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={busy}
            onClick={() => onPick(option.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
              picked
                ? option.tone
                : "border-border text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/5"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
