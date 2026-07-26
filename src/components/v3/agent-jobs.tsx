import { Section, Eyebrow, H2, Lead, VideoSlot } from "./primitives";

const JOBS = [
  {
    step: "01 / 04",
    title: "It works out who your buyers actually are",
    body: "It reads your website, names your ideal customer in plain language, lists the competitors who share your audience, and shows you the whole thing before it touches LinkedIn.",
    points: [
      "Editable in one screen, so you can correct it",
      "Country, job title, company size and language",
    ],
    url: "app.linkedgrow.ai/agents/new",
    video: {
      label: "Video 02",
      title: "Wizard, website scan to ideal customer in twenty seconds",
      note: "steps 1 and 2 of the creation wizard",
    },
  },
  {
    step: "02 / 04",
    title: "It finds those people, with the receipt attached",
    body: "Anyone engaging with your competitors, asking about your problem out loud, or who just landed a role where they choose the tools. Every lead links to the exact post it came from, so you can read their real words before you say anything.",
    points: [
      "Scored against your ideal customer, sorted by fit",
      "Nobody is ever contacted twice by two of your agents",
    ],
    url: "app.linkedgrow.ai/agents/saas-founders/leads",
    video: {
      label: "Video 03",
      title: "Leads tab, clicking through to the source post",
      note: "show the hover state and the outbound link",
    },
  },
  {
    step: "03 / 04",
    title: "It writes from what they said, never from their headline",
    body: "A profile visit and a genuine like first, so your name is not brand new when the invitation lands. Then one note built from their actual comment, one follow-up, and nothing at all after that.",
    points: [
      "Two messages maximum, for anybody, ever",
      "Read and edit tomorrow's queue tonight if you want",
    ],
    url: "app.linkedgrow.ai/agents/saas-founders/queue",
    video: {
      label: "Video 04",
      title: "Today's queue, editing a message before it sends",
      note: "type an edit then save, so it feels controllable",
    },
  },
  {
    step: "04 / 04",
    title: "It brings you the answer, then stays out of the way",
    body: "A reply is detected, the agent goes permanently silent for that person, and an email reaches you within the minute with their message and yours side by side. No automation ever speaks over you.",
    points: [
      "Every reply in one inbox, with the full thread attached",
      "Pushed straight into your CRM on the Business plan",
    ],
    url: "app.linkedgrow.ai/replies",
    video: {
      label: "Video 05",
      title: "Replies page, a new answer arriving live",
      note: "open one thread to show the context",
    },
  },
];

function Tick() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="mt-[3px] h-4 w-4 shrink-0 text-[#00b8db]"
    >
      <path
        d="m5 10.5 3.2 3.2L15 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function V3AgentJobs() {
  return (
    <Section id="agent" tone="light">
      <Eyebrow>The agent</Eyebrow>
      <H2 className="mt-5 max-w-[18ch]">
        Four jobs it does every day, without being asked.
      </H2>
      <Lead className="mt-5 max-w-[64ch]">
        Set it up in four minutes, then it runs by itself inside working hours,
        at the pace of a careful person who genuinely wants the reply.
      </Lead>

      <div className="mt-14 space-y-16 lg:space-y-24">
        {JOBS.map((job, i) => (
          <div
            key={job.step}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
          >
            <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
              <span className="font-mono text-[11.5px] tracking-[0.14em] text-[#8996ac]">
                {job.step}
              </span>
              <h3 className="mt-4 font-grotesk text-[clamp(22px,2.6vw,30px)] font-semibold leading-[1.16] tracking-[-0.03em] text-[#060911] dark:text-white">
                {job.title}
              </h3>
              <p className="mt-4 font-instrument text-[15.5px] leading-[1.65] text-[#586780] dark:text-slate-400">
                {job.body}
              </p>
              <ul className="mt-6 space-y-3">
                {job.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <Tick />
                    <span className="font-instrument text-[14.5px] leading-[1.55] text-[#1e2a41] dark:text-slate-300">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
              <VideoSlot url={job.url} {...job.video} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
