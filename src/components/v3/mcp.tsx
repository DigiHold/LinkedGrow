import { Section, Eyebrow, H2, Lead } from "./primitives";

/**
 * The MCP section.
 *
 * Four assistants, four different jobs, because the point is not that we speak
 * a protocol. It is that the customer keeps whatever they already have open and
 * the product answers there. Each card ends on what that surface can and cannot
 * do, since "an assistant drives my LinkedIn" is a sentence people are right to
 * read carefully.
 */

const SURFACES = [
  {
    via: "Via ChatGPT",
    blurb:
      "Find the people worth talking to and draft the messages, without leaving the chat you already have open.",
    client: "ChatGPT",
    badge: "LinkedGrow connected",
    ask: "Show me the 10 warmest leads my agent found this week and draft a reply for each",
    answer: (
      <>
        Ten leads, sorted by match. <strong>Sarah Chen</strong> is the strongest:
        she commented on a post about outreach templates two days ago. Drafts are
        ready for you to read.
      </>
    ),
    footnote: "read only · nothing is sent without you",
  },
  {
    via: "Via OpenClaw",
    blurb:
      "Run it from the agent platform you already automate with, on your own schedule, with no browser open at all.",
    client: "OpenClaw Agent",
    badge: "bot",
    ask: "Every Monday at 8, write my week's posts and schedule them from the 1st to the 6th",
    answer: (
      <>
        Scheduled. Six posts drafted in your voice, one a day, avoiding the
        morning you already have something booked.
      </>
    ),
    footnote: "runs on a cron · you approve before anything publishes",
  },
  {
    via: "Via Claude Code",
    blurb:
      "Query your pipeline the way you query anything else. Ask a question in plain language, get the real numbers back.",
    client: "Claude Code",
    badge: "linkedgrow mcp",
    ask: "Which job titles replied most this month, and what did they have in common?",
    answer: (
      <>
        Heads of Growth and founders under 20 staff.{" "}
        <strong>Nine of the eleven replies</strong> came from people the agent
        found on competitor posts rather than on keywords.
      </>
    ),
    footnote: "your workspace only · scoped by your API key",
  },
  {
    via: "Via Hermes",
    blurb:
      "Hand the whole loop to an autonomous agent: it finds the leads, drafts the messages, fills next week's calendar, and reports back.",
    client: "Hermes",
    badge: "linkedgrow mcp",
    ask: "Keep my pipeline full. Check for new leads daily and prep replies for anyone who answers",
    answer: (
      <>
        Running. <strong>Eleven new leads</strong> since yesterday, three replies
        waiting, and Thursday&apos;s post is drafted and queued.
      </>
    ),
    footnote: "one endpoint · every write is reversible from the dashboard",
  },
];

export function V3Mcp() {
  return (
    <Section tone="dark">
      <Eyebrow onDark>Works inside the assistant you already use</Eyebrow>
      <H2 onDark className="mt-5 max-w-[20ch]">
        Power your content with <span className="text-cyan-300">AI</span> and
        automation
      </H2>
      <Lead onDark className="mt-5 max-w-[66ch]">
        LinkedGrow speaks MCP, so an assistant can drive it directly. Ask for
        your warmest leads, have next week&apos;s posts written, schedule them
        across the days you want. One URL to connect, no code, about two minutes.
      </Lead>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {SURFACES.map((s) => (
          <div
            key={s.via}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6"
          >
            <p className="font-grotesk text-[17px] font-semibold tracking-[-0.02em] text-white">
              {s.via}
            </p>
            <p className="mt-2 font-instrument text-[14px] leading-[1.6] text-white/60">
              {s.blurb}
            </p>

            <div className="mt-5 flex-1 rounded-xl border border-white/10 bg-[#050c1d]/70 p-4">
              <div className="flex items-center gap-2">
                <span className="font-instrument text-[12.5px] font-medium text-white/80">
                  {s.client}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10.5px] text-cyan-300">
                  {s.badge}
                </span>
              </div>
              <p className="mt-3 rounded-lg bg-white/[0.06] px-3 py-2.5 font-instrument text-[13.5px] leading-[1.55] text-white/85">
                {s.ask}
              </p>
              <p className="mt-3 px-1 font-instrument text-[13.5px] leading-[1.6] text-white/65 [&_strong]:font-semibold [&_strong]:text-white">
                {s.answer}
              </p>
            </div>

            <p className="mt-4 font-mono text-[11px] text-white/40">{s.footnote}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <p className="max-w-[68ch] font-instrument text-[14.5px] leading-[1.62] text-white/70">
          One endpoint per workspace, one setting to paste, about two minutes.
          Nothing publishes and nothing sends on its own: every write lands as
          something you can read and cancel in the dashboard.
        </p>
        <span className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 font-instrument text-[12.5px] font-semibold text-cyan-300">
          Included on Pro
        </span>
      </div>
    </Section>
  );
}
