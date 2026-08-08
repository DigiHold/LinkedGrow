"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Who produced what: the agents over a window, the people as of right now.
 *
 * The two halves answer different questions and are deliberately not merged.
 * An agent is judged on a period because it works every day. A person is
 * judged on what is sitting on their desk, because a conversation handed over
 * in March and still unopened is a fact about today.
 */

type AgentRow = {
  id: string;
  name: string;
  found: number;
  contacted: number;
  accepted: number;
  replied: number;
};

type PersonRow = {
  id: string;
  name: string | null;
  email: string;
  isOwner: boolean;
  conversations: number;
  theirsAlone: number;
  unread: number;
};

type Report = {
  days: number;
  agents: AgentRow[];
  people: PersonRow[];
  unclaimed: number;
};

function label(person: PersonRow): string {
  const name = (person.name ?? "").trim();
  return name || person.email;
}

function rate(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export function TeamProduction({ days }: { days: number }) {
  const [report, setReport] = useState<Report | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/analytics/team?days=${days}`)
      .then(async (r) => {
        if (r.status === 403) {
          if (alive) setDenied(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((json) => {
        if (alive && json) setReport(json);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [days]);

  if (denied) return null;

  if (!report) {
    return <div className="h-56 animate-pulse rounded-2xl border border-border bg-card" />;
  }

  const hasTeam = report.people.length > 1;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Who produced what
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Agents over the last {report.days} days. People as they stand right now.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 text-right font-medium">Found</th>
              <th className="px-4 py-3 text-right font-medium">Contacted</th>
              <th className="px-4 py-3 text-right font-medium">Accepted</th>
              <th className="px-4 py-3 text-right font-medium">Replied</th>
              <th className="px-4 py-3 text-right font-medium">Reply rate</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {report.agents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-500 dark:text-slate-400">
                  No agent has found anybody in this window yet.
                </td>
              </tr>
            )}
            {report.agents.map((agent) => (
              <tr key={agent.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {agent.name}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                  {agent.found}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                  {agent.contacted}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                  {agent.accepted}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                  {agent.replied}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                  {rate(agent.replied, agent.accepted)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasTeam && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 text-right font-medium">Conversations</th>
                <th className="px-4 py-3 text-right font-medium">Theirs alone</th>
                <th className="px-4 py-3 text-right font-medium">Unread</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {report.people.map((person) => (
                <tr key={person.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {label(person)}
                    {person.isOwner && (
                      <span className="ml-2 text-xs font-normal text-slate-400">owner</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {person.conversations}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {person.theirsAlone}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold",
                      person.unread > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-400"
                    )}
                  >
                    {person.unread}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.unclaimed > 0 && (
            <p className="border-t border-border px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
              {report.unclaimed} conversation{report.unclaimed === 1 ? "" : "s"} the agent has
              finished with and nobody has taken. They are in Replies under Unassigned.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
