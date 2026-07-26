import { Section, Eyebrow, H2, Lead, Card } from "./primitives";

const RULES = [
  {
    title: "One residential IP, yours alone",
    body: "Your agent connects from a fixed residential address in your own country, reserved for your account for its whole life. To LinkedIn it looks like a person at home, one steady address with one routine.",
    proof: (
      <div className="rounded-xl border border-[#e7edf5] bg-[#f6f9fd] p-4 dark:border-white/10 dark:bg-white/5">
        <p className="font-mono text-[13px] text-[#1e2a41] dark:text-slate-200">
          45.•••.•••.112 · Zurich, Switzerland
        </p>
        <p className="mt-1.5 font-instrument text-[12.5px] text-[#8996ac]">
          Dedicated residential · reserved for this account · never rotated
        </p>
      </div>
    ),
  },
  {
    title: "Four weeks of warm-up, enforced",
    body: "New agents start with a handful of actions a day and earn their pace across a month, exactly like a person new to outreach would. You cannot skip it, and that is precisely the point.",
    proof: (
      <div className="grid grid-cols-4 gap-2">
        {[
          ["8/day", "Week 1"],
          ["15/day", "Week 2"],
          ["21/day", "Week 3"],
          ["25/day", "Week 4"],
        ].map(([n, w]) => (
          <div
            key={w}
            className="rounded-xl border border-[#e7edf5] bg-[#f6f9fd] px-2 py-3 text-center dark:border-white/10 dark:bg-white/5"
          >
            <p className="font-grotesk text-[15px] font-semibold text-[#060911] dark:text-white">
              {n}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8996ac]">
              {w}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "A calendar a human would keep",
    body: "Business hours in your own time zone, gaps of forty to a hundred and twenty seconds between actions, no weekends and nothing at three in the morning. The rhythm is boring on purpose, because boring is what a normal professional looks like.",
    proof: (
      <div className="flex gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <div
            key={d}
            className={`flex-1 rounded-lg py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.08em] ${
              i < 5
                ? "bg-[#eff5ff] text-[#155dfc] dark:bg-blue-500/15 dark:text-blue-300"
                : "bg-[#f6f9fd] text-[#8996ac] dark:bg-white/5"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "It stops at the first odd signal",
    body: "A security prompt, an unusual response, a limit getting close: the agent stops, tells you exactly what it saw, and waits for you. Silence is the one thing it never does, because that is how people lose accounts.",
    proof: (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
        <p className="font-instrument text-[13px] font-semibold text-amber-700 dark:text-amber-300">
          Agent paused · checkpoint detected
        </p>
        <p className="mt-1.5 font-instrument text-[12.5px] leading-[1.5] text-amber-700/80 dark:text-amber-200/70">
          Nothing sent since 14:32. Waiting for you, and an email is already in
          your inbox.
        </p>
      </div>
    ),
  },
];

const HARD_NUMBERS = [
  ["2", "messages per person, maximum, on every sequence"],
  ["1", "dedicated residential IP per LinkedIn account"],
  ["40-120s", "enforced gap between any two actions"],
  ["0", "actions on weekends, public holidays included"],
];

const SECURITY = [
  "Credentials encrypted with AES-256-GCM",
  "Decrypted in memory only, never logged",
  "Hosted in the EU, GDPR by design",
];

export function V3Safety() {
  return (
    <Section id="safety" tone="light">
      <Eyebrow>Hard limits, on every plan</Eyebrow>
      <H2 className="mt-5 max-w-[16ch]">Rules the agent cannot break.</H2>
      <Lead className="mt-5 max-w-[66ch]">
        Speed is what gets LinkedIn accounts restricted, so the agent is built
        around restraint you can watch working. Every safety signal sits on your
        dashboard rather than in a settings page nobody opens.
      </Lead>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {RULES.map((rule) => (
          <Card key={rule.title}>
            <h3 className="font-grotesk text-[19px] font-semibold tracking-[-0.025em] text-[#060911] dark:text-white">
              {rule.title}
            </h3>
            <p className="mt-3 font-instrument text-[14.5px] leading-[1.62] text-[#586780] dark:text-slate-400">
              {rule.body}
            </p>
            <div className="mt-5">{rule.proof}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-[#e7edf5] bg-[#e7edf5] sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10 dark:bg-white/10">
        {HARD_NUMBERS.map(([n, label]) => (
          <div key={label} className="bg-white p-6 dark:bg-slate-950">
            <p className="font-grotesk text-[clamp(26px,3vw,34px)] font-semibold leading-none tracking-[-0.035em] text-[#060911] dark:text-white">
              {n}
            </p>
            <p className="mt-3 font-instrument text-[13.5px] leading-[1.55] text-[#586780] dark:text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 max-w-[74ch] font-instrument text-[14.5px] leading-[1.65] text-[#586780] dark:text-slate-400">
        No vendor can honestly promise LinkedIn will never ask questions. What we
        promise is conservative defaults, an agent that stops before you have to,
        and a health score you can check at any hour of the day.
      </p>

      <div className="mt-8 rounded-2xl border border-[#e7edf5] bg-[#f6f9fd] p-6 dark:border-white/10 dark:bg-white/5 sm:p-7">
        <ul className="grid gap-3 sm:grid-cols-3">
          {SECURITY.map((line) => (
            <li
              key={line}
              className="font-instrument text-[13.5px] leading-[1.5] text-[#1e2a41] dark:text-slate-300"
            >
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-[#e7edf5] pt-5 font-instrument text-[13.5px] text-[#586780] dark:border-white/10 dark:text-slate-400">
          Your LinkedIn login is the most valuable thing you hand us, and it is
          treated that way.
        </p>
      </div>
    </Section>
  );
}
