"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, Pill } from "@/components/dashboard/ui/page";
import { ReplyIcon } from "@/components/dashboard/nav-icons";
import { Cell, Contact, Row, Table } from "./lead-bits";

/**
 * Today's queue: everyone the agent is about to contact, before it does.
 *
 * Two kinds of row, because the sequence has two. A message is written by the
 * model shortly before it goes out, so it arrives here as a real draft that can
 * be read, edited or dropped. An invitation carries no text, so those rows are
 * the people next in line, in the order the worker takes them.
 */

type Drafted = {
  id: string;
  action: string;
  state: string;
  scheduledAt: string;
  messageBody: string | null;
  failureReason: string | null;
  leadId: string;
  fullName: string;
  headline: string | null;
  company: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  matchScore: number | null;
  matchReason: string | null;
  signalText: string | null;
  signalUrl: string | null;
};

type NextUp = {
  leadId: string;
  fullName: string;
  headline: string | null;
  jobTitle: string | null;
  company: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  matchScore: number | null;
  matchReason: string | null;
  signalText: string | null;
  signalUrl: string | null;
};

type Payload = {
  queue: Drafted[];
  nextUp: NextUp[];
  /** People in line behind today's, who wait for a later day. */
  laterCount: number;
  reviewMode: boolean;
  observeOnly: boolean;
  status: string;
  timezone: string;
  workdayStart: number;
  workdayEnd: number;
  todaysPace: number;
};

/** What each queued action is, said the way the user would say it. */
const ACTION_LABEL: Record<string, string> = {
  visit: "Profile visit",
  like: "Like their last post",
  invite: "Invitation",
  hello: "Hello",
  intro: "First message",
  converse: "Reply",
  ask: "The one ask",
  withdraw: "Withdraw the invitation",
};

function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;
}

function atTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Is the agent inside its own hours right now, in its own timezone. */
function working(data: Payload): boolean {
  let local: Date;
  try {
    local = new Date(new Date().toLocaleString("en-US", { timeZone: data.timezone }));
  } catch {
    local = new Date();
  }
  const minutes = local.getHours() * 60 + local.getMinutes();
  return minutes >= data.workdayStart && minutes < data.workdayEnd;
}

export function QueueTab({ agentId }: { agentId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ id: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}/queue`);
    if (!res.ok) return;
    setData(await res.json());
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  /**
   * Keep this list live. The first hour after an agent starts is the whole of a
   * customer's first impression, and nothing polls while the tab is hidden.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      load().catch(() => {});
    }, 15_000);
    return () => clearInterval(timer);
  }, [load]);

  async function send(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    const res = await fetch(`/api/agents/${agentId}/queue`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "That did not go through.");
    } else {
      await load();
      setDraft(null);
    }
    setBusy(null);
  }

  /** Removing somebody from the queue is rejecting the lead behind the row. */
  async function skipLead(leadId: string) {
    setBusy(leadId);
    setError(null);
    const res = await fetch(`/api/agents/${agentId}/leads`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", leadId }),
    });
    if (!res.ok) setError("That did not go through.");
    else await load();
    setBusy(null);
  }

  const queue = data?.queue ?? [];
  const nextUp = data?.nextUp ?? [];
  const total = queue.length + nextUp.length;
  const pending = queue.filter((i) => i.state === "pending").length;

  if (!loading && total === 0) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-card">
        <EmptyState
          icon={<ReplyIcon className="h-6 w-6" />}
          title="Nobody is queued"
          description="Whoever the agent plans to contact next appears here first, with the message it wrote, so you can read it before anybody else does."
        />
      </div>
    );
  }

  const window = data
    ? `${clock(data.workdayStart)} to ${clock(data.workdayEnd)}, ${data.timezone}`
    : "";

  /**
   * When an invitation goes out, without inventing a minute.
   *
   * The engine picks people up during a run and paces them apart by a random
   * human gap, so no per-person time exists to print. "In today's window" was
   * true and useless. The start of the window is the real answer, and "in this
   * run" is the real answer once the agent is already awake.
   */
  const goesOut = !data
    ? ""
    : data.status === "paused" || data.status === "stopped"
      ? "When you start it"
      : working(data)
        ? "In this run"
        : `After ${clock(data.workdayStart)}`;

  return (
    <div className="mt-6 space-y-3.5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-50/60 px-4 py-3.5 dark:bg-blue-500/10">
        <div className="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700 tabular-nums dark:bg-blue-500/20 dark:text-blue-300">
          {total}
        </div>
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium text-slate-900 dark:text-white">
            {total} {total === 1 ? "person is" : "people are"} queued
          </p>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {data?.observeOnly
              ? "This agent is reading only, so nothing here will be sent."
              : data?.status === "paused" || data?.status === "stopped"
                ? "The agent is paused, so nothing goes out until you start it."
                : `The agent works ${window}. Edit or remove anyone before then.`}
            {data && data.laterCount > 0 && (
              <>
                {" "}
                {data.laterCount} more {data.laterCount === 1 ? "is" : "are"} in line behind
                them, for the days after.
              </>
            )}
          </div>
        </div>
        <div className="flex-1" />
        {pending > 0 && (
          <button
            onClick={() => send({ action: "approveAll" }, "all")}
            disabled={busy !== null}
            className="text-xs font-semibold text-blue-600 disabled:opacity-50 dark:text-blue-400"
          >
            Approve all {pending}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          {error}
        </div>
      )}

      <Table
        columns={[
          { label: "Contact", width: "17%" },
          { label: "Why this person", width: "19%" },
          { label: "Step", width: "10%" },
          // The widest column on purpose: reading what the agent wrote before
          // it goes out is the whole point of this tab.
          { label: "Message the agent wrote", width: "35%" },
          { label: "Goes out", width: "10%" },
          { label: "", width: "9%" },
        ]}
      >
        {queue.map((item) => (
          <Row key={item.id} highlight={item.state === "pending"}>
            <Cell>
              <Contact
                name={item.fullName}
                title={item.company || item.headline}
                avatarUrl={item.avatarUrl}
                profileUrl={item.profileUrl}
              />
            </Cell>
            <Cell label="Why this person">
              <Why text={item.signalText} url={item.signalUrl} reason={item.matchReason} />
            </Cell>
            <Cell label="Step">
              <Pill tone={item.state === "pending" ? "warn" : "neutral"}>
                {ACTION_LABEL[item.action] ?? item.action}
              </Pill>
            </Cell>
            <Cell label="Message the agent wrote">
              {draft?.id === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft({ id: item.id, body: e.target.value })}
                    rows={5}
                    maxLength={1200}
                    className="w-full rounded-lg border border-border bg-background p-3 text-[13px] leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-hidden dark:text-white"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        send(
                          { action: "edit", itemId: item.id, messageBody: draft.body },
                          item.id
                        )
                      }
                      disabled={busy !== null}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setDraft(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {draft.body.length} / 1200
                    </span>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.messageBody ?? "No text: an invitation carries none."}
                </p>
              )}
            </Cell>
            <Cell label="Goes out" className="whitespace-nowrap">
              <span className="text-[13px] text-slate-500 dark:text-slate-400">
                {atTime(item.scheduledAt)}
              </span>
            </Cell>
            <Cell>
              <div className="flex flex-wrap gap-1.5">
                {item.state === "pending" && (
                  <RowButton
                    onClick={() => send({ action: "approve", itemId: item.id }, item.id)}
                    disabled={busy !== null}
                  >
                    Approve
                  </RowButton>
                )}
                {item.messageBody !== null && draft?.id !== item.id && (
                  <RowButton
                    onClick={() => setDraft({ id: item.id, body: item.messageBody ?? "" })}
                  >
                    Edit
                  </RowButton>
                )}
                <RowButton
                  onClick={() => send({ action: "skip", itemId: item.id }, item.id)}
                  disabled={busy !== null}
                >
                  Skip
                </RowButton>
              </div>
            </Cell>
          </Row>
        ))}

        {nextUp.map((lead) => (
          <Row key={lead.leadId}>
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
            <Cell label="Why this person">
              <Why text={lead.signalText} url={lead.signalUrl} reason={lead.matchReason} />
            </Cell>
            <Cell label="Step">
              <Pill>Invitation</Pill>
            </Cell>
            <Cell label="Message the agent wrote">
              <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                An invitation goes out with no note, because a note does not
                raise acceptance. The first message is written after they accept.
              </p>
            </Cell>
            <Cell label="Goes out" className="whitespace-nowrap">
              <span className="text-[13px] text-slate-500 dark:text-slate-400">
                {goesOut}
              </span>
            </Cell>
            <Cell>
              <RowButton
                onClick={() => skipLead(lead.leadId)}
                disabled={busy !== null}
              >
                {busy === lead.leadId ? "Removing" : "Skip"}
              </RowButton>
            </Cell>
          </Row>
        ))}
      </Table>
    </div>
  );
}

/** The evidence, then the reason, which is the pair the prototype shows. */
function Why({
  text,
  url,
  reason,
}: {
  text: string | null;
  url: string | null;
  reason: string | null;
}) {
  return (
    <>
      {text ? (
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-blue-600/40 text-[13px] text-blue-600 dark:text-blue-400"
          >
            {text}
          </a>
        ) : (
          <span className="text-[13px] text-slate-700 dark:text-slate-200">{text}</span>
        )
      ) : (
        <span className="text-[13px] text-slate-400">-</span>
      )}
      {reason && (
        <div className="mt-[3px] text-xs text-slate-500 dark:text-slate-400">
          {reason}
        </div>
      )}
    </>
  );
}

function RowButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 dark:text-slate-300"
    >
      {children}
    </button>
  );
}
