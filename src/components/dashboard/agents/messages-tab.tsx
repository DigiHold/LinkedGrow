"use client";

import { useEffect, useState } from "react";
import { Pill } from "@/components/dashboard/ui/page";

/**
 * What your agent sends.
 *
 * Every message is written for one person, moments before it goes, from what
 * that person actually wrote. So this tab shows the real thing: the last
 * message the agent sent at each step, with the name it was sent to. Until a
 * step has run, it shows the shape instead, with {name} where the person's
 * name goes, resolved against the next person in the queue so it reads the way
 * it will read.
 *
 * The sequence itself mirrors linkedgrow-worker/src/messages/relationship.ts.
 * If it changes there, it changes here.
 */

type Step = {
  key: string;
  title: string;
  what: string;
  pacing: string;
  /** The shape, shown until a real one exists. */
  shape?: string;
};

const SEQUENCE: Step[] = [
  {
    key: "warm",
    title: "It likes their most recent post",
    what: "So the invitation arrives from somebody who has read them.",
    pacing: "Roughly a day before the invitation",
  },
  {
    key: "invite",
    title: "Invitation, with no note",
    what: "Four separate datasets found that a note does not raise acceptance and slightly lowers it, so the invitation carries nothing.",
    pacing: "Inside the day's ramped allowance",
  },
  {
    key: "hello",
    title: "It says hello, and asks for nothing",
    what: "Two lines: one real thing it saw of theirs, then a plain close. No question mark, no offer, no mention of what you do.",
    pacing: "A few hours after they accept, never the same minute",
    shape: "Thanks for accepting, {name}. {one real thing you saw of theirs}. Good to be connected.",
  },
  {
    key: "intro",
    title: "The first real message, and it sells nothing",
    what: "It names what they wrote, says who you are in one plain clause, and asks one thing they can answer in a line.",
    pacing: "Hours after they answer the hello, or 3 to 5 days of silence",
    shape:
      "{name}, {what they wrote about}. I {what you do, in one clause}. {one question they can answer in a line}",
  },
  {
    key: "converse",
    title: "If they answer, it answers back",
    what: "It addresses what they actually said before anything else, then asks one thing back. The product is not mentioned here, not once.",
    pacing: "Between 12 minutes and 3 hours",
    shape: "{answer to what they said}. {one question back}",
  },
  {
    key: "ask",
    title: "One ask, and it offers rather than requests",
    what: "Something small and free they can accept or ignore in a word. Never a meeting, a call, or fifteen minutes.",
    pacing: "2 to 4 days after the conversation, 4 to 7 after silence",
    shape: "{name}, {the small concrete thing you can send them}. Want it?",
  },
  {
    key: "handover",
    title: "Then it stops, for good",
    what: "No third chase and no reactivation months later. Whatever happens next is yours.",
    pacing: "Right after the ask, or the moment a human should answer",
  },
];

type Payload = {
  sent: Record<string, number>;
  examples: Record<string, { body: string; leadName: string }>;
  invitations: number;
  accepted: number;
};

/** The next real name in line, so {name} in a shape reads as a person. */
function useNextName(agentId: string): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/agents/${agentId}/queue`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const first =
          json?.queue?.[0]?.fullName ?? json?.nextUp?.[0]?.fullName ?? null;
        setName(typeof first === "string" ? first.split(/\s+/)[0] : null);
      })
      .catch(() => {});
  }, [agentId]);
  return name;
}

export function MessagesTab({ agentId }: { agentId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const nextName = useNextName(agentId);

  // Counts and examples of what has actually gone out, refreshed while somebody
  // is watching. A stale zero in the first hour reads as broken.
  useEffect(() => {
    const load = () =>
      fetch(`/api/agents/${agentId}/activity?window=all`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json) setData(json);
        })
        .catch(() => {});
    load();
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      load();
    }, 20_000);
    return () => clearInterval(timer);
  }, [agentId]);

  const sent = data?.sent ?? {};

  /** "177 sent · 74 accepted", or nothing when a step has not run. */
  function counts(step: Step): string | null {
    if (step.key === "invite") {
      const n = data?.invitations ?? 0;
      if (!n) return null;
      return `${n} sent · ${data?.accepted ?? 0} accepted`;
    }
    const n = sent[step.key] ?? 0;
    return n ? `${n} sent` : null;
  }

  return (
    <div className="mt-6 space-y-3.5">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
          What your agent sends
        </h2>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Each message is written for one person from what they actually wrote,
          shortly before it goes out. Tomorrow&apos;s are in Today&apos;s queue,
          where you can read and edit every one of them.
        </p>
      </div>

      {SEQUENCE.map((step, i) => {
        const example = data?.examples[step.key];
        const count = counts(step);
        const shape = step.shape?.replace(/\{name\}/g, nextName ?? "{name}");
        return (
          <div
            key={step.key}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
              <Pill>Step {i + 1}</Pill>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <div className="flex-1" />
              {count && (
                <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {count}
                </span>
              )}
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {step.what}
              </p>

              {example ? (
                <div className="mt-3 rounded-lg bg-slate-50 p-3.5 dark:bg-white/[0.03]">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
                    {example.body}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    The last one it sent, to {example.leadName}
                  </p>
                </div>
              ) : shape ? (
                <div className="mt-3 rounded-lg border border-dashed border-border p-3.5">
                  <p className="text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {shape}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {nextName
                      ? `The shape it follows. The name is ${nextName}, who is next in the queue.`
                      : "The shape it follows, until the first one goes out."}
                  </p>
                </div>
              ) : null}

              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                {step.pacing}
              </p>
            </div>
          </div>
        );
      })}

      <p className="px-1 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Tone and goal are yours to set in Settings and they change how every one
        of these is written. The sequence itself does not change, because the
        order is what keeps the first message from reading as a pitch.
      </p>
    </div>
  );
}
