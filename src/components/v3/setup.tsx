import { Section, Eyebrow, H2, Lead, VideoSlot } from "./primitives";

const PHASES = [
  { name: "Connect", detail: "Your site and your account" },
  { name: "Prospect", detail: "Sources, leads and scoring" },
  { name: "Converse", detail: "Warm-up, messages and replies" },
];

const STEPS = [
  {
    step: "Step 01",
    title: "Connect your LinkedIn account once",
    body: "Your credentials are encrypted the moment they arrive, decrypted only inside the browser session that uses them, and never written to a log. The agent gets a dedicated residential address in your own country, and it keeps that same address for as long as the agent lives.",
    url: "app.linkedgrow.ai/settings/linkedin",
    video: {
      label: "Video 06",
      title: "Connecting an account, profile and IP confirmed",
      note: "end on the green connected state",
    },
  },
  {
    step: "Step 02",
    title: "Choose where your buyers already gather",
    body: "Competitor audiences, posts about the problem you solve, people who changed jobs in the last ninety days, or a search you write yourself. Pick as many sources as you like and the agent mines them every morning, deduplicating against everyone it has already contacted.",
    url: "app.linkedgrow.ai/agents/saas-founders/sources",
    video: {
      label: "Video 07",
      title: "Sources tab, adding a competitor and mining it",
      note: "the counter climbing as leads arrive",
    },
  },
  {
    step: "Step 03",
    title: "Approve the tone, then let it work",
    body: "Read the first messages it drafts, adjust the tone once, and switch the agent on. From there it holds working hours, raises its volume slowly across the first month, and emails you the moment somebody answers.",
    url: "app.linkedgrow.ai/agents/saas-founders",
    video: {
      label: "Video 08",
      title: "Switching the agent on, running indicator",
      note: "the activity log filling underneath",
    },
  },
];

export function V3Setup() {
  return (
    <Section id="setup" tone="cream">
      <Eyebrow>Setup</Eyebrow>
      <H2 className="mt-5 max-w-[16ch]">
        Four minutes to set up. First leads today.
      </H2>
      <Lead className="mt-5 max-w-[62ch]">
        Type your website. The agent takes it from there, and you get to watch
        every step of it happening.
      </Lead>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {PHASES.map((phase, i) => (
          <div
            key={phase.name}
            className="rounded-2xl border border-[#e7edf5] bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/5"
          >
            <span className="font-mono text-[11.5px] text-[#8996ac]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-2 font-grotesk text-[17px] font-semibold tracking-[-0.02em] text-[#060911] dark:text-white">
              {phase.name}
            </p>
            <p className="mt-1 font-instrument text-[13.5px] text-[#586780] dark:text-slate-400">
              {phase.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-14 space-y-14">
        {STEPS.map((s, i) => (
          <div key={s.step} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
              <span className="font-mono text-[11.5px] tracking-[0.14em] text-[#155dfc]">
                {s.step}
              </span>
              <h3 className="mt-4 font-grotesk text-[clamp(21px,2.4vw,28px)] font-semibold leading-[1.18] tracking-[-0.03em] text-[#060911] dark:text-white">
                {s.title}
              </h3>
              <p className="mt-4 font-instrument text-[15.5px] leading-[1.65] text-[#586780] dark:text-slate-400">
                {s.body}
              </p>
            </div>
            <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
              <VideoSlot url={s.url} {...s.video} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
