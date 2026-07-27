"use client";

import { useEffect, useState } from "react";
import { Panel, PanelTitle, Pill } from "@/components/dashboard/ui/page";

/**
 * What the agent sends, in order.
 *
 * This tab is where the product's one real difference is visible, so it states
 * the sequence plainly and never dresses it up. The counts underneath each step
 * are what actually went out, not a forecast.
 *
 * The copy here mirrors the engine in linkedgrow-worker/src/messages/
 * relationship.ts. If the sequence changes there, it changes here.
 */

type Step = {
  key: string;
  title: string;
  body: string;
  pacing: string;
};

const SEQUENCE: Step[] = [
  {
    key: "warm",
    title: "It likes their most recent post",
    body: "So the invitation arrives from someone who has read them, rather than from a stranger. We make no claim that this raises acceptance, because nobody has measured it cleanly.",
    pacing: "Roughly a day before the invitation",
  },
  {
    key: "invite",
    title: "It sends the invitation, with no note",
    body: "Four separate datasets found that adding a note does not raise acceptance and slightly lowers it. So the invitation carries nothing.",
    pacing: "Within the daily cap for the account",
  },
  {
    key: "hello",
    title: "It says hello, and asks for nothing at all",
    body: "Two lines. One real thing you saw of theirs, then a plain human close. No question mark anywhere, no offer, no mention of what you do. People accept a connection out of curiosity, and a first message that asks for something breaks that on the spot. This one is not trying to earn a reply, it is making the next message land in an open conversation.",
    pacing: "A few hours after they accept, never the same minute",
  },
  {
    key: "intro",
    title: "The real message introduces a person, and sells nothing",
    body: "It names what they wrote, says who you are and what you do in one plain clause, asks one thing they can answer in a line, and closes so that ignoring it costs nothing. It discloses on purpose: a message built to look non-commercial when it is commercial is a bait and switch. Sent within hours if they answered the hello, after a few days if they did not.",
    pacing: "Hours after they reply, or 3 to 5 days of silence",
  },
  {
    key: "converse",
    title: "If they answer, it answers back like a person",
    body: "It addresses what they actually said before anything else, then asks one thing back. It does not mention the product here, not once and not as a hint. This can happen up to three times.",
    pacing: "Between 12 minutes and 3 hours, so it is neither instant nor forgotten",
  },
  {
    key: "ask",
    title: "One ask, and it makes an offer rather than requesting time",
    body: "Something small, concrete and free that they can accept or ignore in one word. Never a meeting, a call or fifteen minutes. Across 85M cold emails, asking for a meeting scored 44% below baseline while making an offer scored 28% above it. This is sent whether or not they ever replied.",
    pacing: "2 to 4 days after the conversation, 4 to 7 days if they stayed silent",
  },
  {
    key: "handover",
    title: "Then it stops, for good",
    body: "No third chase, no re-sequencing, no reactivation months later. Whatever happens next belongs to you, and the agent will not message that person again.",
    pacing: "Immediately after the ask, or the moment they say something a human should answer",
  },
];

export function MessagesTab({ agentId }: { agentId: string }) {
  const [sent, setSent] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`/api/agents/${agentId}/activity?window=all`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.sent) setSent(json.sent);
      })
      .catch(() => {});
  }, [agentId]);

  return (
    <div className="mt-6 space-y-4">
      <Panel>
        <PanelTitle description="Seven steps, then it stops. Any reply moves it forward, and a reply that needs a human stops it immediately.">
          What your agent does
        </PanelTitle>
        <ol className="-mx-2 divide-y divide-border">
          {SEQUENCE.map((step, i) => (
            <li key={step.key} className="flex gap-4 px-2 py-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 tabular-nums dark:bg-white/5 dark:text-slate-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </p>
                  {sent[step.key] ? (
                    <Pill tone="brand">{sent[step.key]} sent</Pill>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {step.body}
                </p>
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  {step.pacing}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel>
        <PanelTitle>Why it is written this way</PanelTitle>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Every other tool pitches on the first message. This one does not,
          which only works if it is honest about why it is there. So the first
          message says what you do and asks for nothing, and the one ask comes
          later and offers something rather than requesting your prospect&apos;s
          time. Tone and audience are yours to set in Settings, and the sequence
          itself does not change.
        </p>
      </Panel>
    </div>
  );
}
