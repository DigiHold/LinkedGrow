"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel, EmptyState, Pill } from "@/components/dashboard/ui/page";
import { ReplyIcon } from "@/components/dashboard/nav-icons";
import { Avatar, MatchScore, Signal, When } from "./lead-bits";

type Item = {
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

/** What each queued action is, said the way the user would say it. */
const ACTION_LABEL: Record<string, string> = {
  visit: "Look at their profile",
  like: "Like their last post",
  invite: "Send the invitation",
  hello: "Say hello, nothing more",
  intro: "First real message, no pitch",
  converse: "Answering what they said",
  ask: "The one ask",
  withdraw: "Withdraw the invitation",
};

export function QueueTab({ agentId }: { agentId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ id: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}/queue`);
    if (!res.ok) return;
    const json = await res.json();
    setItems(json.queue);
    setReviewMode(json.reviewMode);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    load().catch(() => {});
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

  const pending = items.filter((i) => i.state === "pending").length;

  if (!loading && items.length === 0) {
    return (
      <div className="mt-6">
        <Panel padded={false}>
          <EmptyState
            icon={<ReplyIcon className="h-6 w-6" />}
            title="Nothing queued"
            description="The agent builds tomorrow's queue during the night. Whatever it plans to send appears here first, so you can read it before anyone does."
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {loading
              ? "Loading the queue"
              : `${items.length} queued, ${pending} still to review`}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {reviewMode
              ? "Nothing goes out until you approve it. If you stop reviewing, the agent stops sending."
              : "The agent sends on its own. You can still edit or remove anything below before it goes."}
          </p>
        </div>
        {pending > 0 && (
          <button
            onClick={() => send({ action: "approveAll" }, "all")}
            disabled={busy !== null}
            className="rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            Approve all {pending}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          {error}
        </div>
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-start gap-3">
              <Avatar src={item.avatarUrl} name={item.fullName} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <a
                    href={item.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-slate-900 hover:underline dark:text-white"
                  >
                    {item.fullName}
                  </a>
                  {item.state === "approved" && <Pill tone="good">Approved</Pill>}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {item.headline || item.company}
                </p>
                <div className="mt-2 space-y-1.5">
                  <MatchScore score={item.matchScore} reason={item.matchReason} />
                  <Signal text={item.signalText} url={item.signalUrl} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Pill tone="brand">
                  {ACTION_LABEL[item.action] ?? item.action}
                </Pill>
                <When value={item.scheduledAt} />
              </div>
            </div>

            {item.messageBody !== null && (
              <div className="mt-4">
                {draft?.id === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={draft.body}
                      onChange={(e) =>
                        setDraft({ id: item.id, body: e.target.value })
                      }
                      rows={5}
                      maxLength={1200}
                      className="w-full rounded-xl border border-border bg-background p-3.5 text-sm leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-hidden dark:text-white"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          send(
                            {
                              action: "edit",
                              itemId: item.id,
                              messageBody: draft.body,
                            },
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
                  <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700 dark:bg-white/5 dark:text-slate-200">
                    {item.messageBody}
                  </p>
                )}
              </div>
            )}

            {draft?.id !== item.id && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {item.state === "pending" && (
                  <button
                    onClick={() =>
                      send({ action: "approve", itemId: item.id }, item.id)
                    }
                    disabled={busy !== null}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
                  >
                    Approve
                  </button>
                )}
                {item.messageBody !== null && (
                  <button
                    onClick={() =>
                      setDraft({ id: item.id, body: item.messageBody ?? "" })
                    }
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    Edit the message
                  </button>
                )}
                <button
                  onClick={() =>
                    send({ action: "skip", itemId: item.id }, item.id)
                  }
                  disabled={busy !== null}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-red-400"
                >
                  Remove from the queue
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
