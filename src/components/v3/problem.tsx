import { Section, Eyebrow, H2, Lead } from "./primitives";

const LOGOS = [
  "Northline",
  "Havre Studio",
  "Atelier Kea",
  "Velio",
  "Tidewell",
  "Disruptica",
];

const NUMBERS = [
  {
    n: "01",
    figure: "1 in 50",
    body: "Cold invitations that lead anywhere, once the note is a template your prospect has already read forty times.",
  },
  {
    n: "02",
    figure: "6 hrs",
    body: "Gone every week to searching, scrolling and copy-pasting, before a single conversation has actually started.",
  },
  {
    n: "03",
    figure: "40%",
    body: "Of accounts on cloud outreach tools took a restriction last quarter, because volume was chosen over patience.",
  },
  {
    n: "04",
    figure: "$48k",
    body: "A year for a junior rep who still needs a list, a script, a manager and eleven months before they pay for themselves.",
  },
];

export function V3Problem() {
  return (
    <>
      <Section tone="light" className="!py-[clamp(46px,5vw,70px)]">
        <p className="text-center font-instrument text-[13px] font-medium text-[#8996ac]">
          Founders who stopped doing outbound by hand
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {LOGOS.map((name) => (
            <span
              key={name}
              className="font-grotesk text-[17px] font-semibold tracking-[-0.02em] text-[#8996ac] opacity-70 dark:text-slate-500"
            >
              {name}
            </span>
          ))}
        </div>
      </Section>

      <Section id="problem" tone="tint">
        <div className="max-w-[26ch]">
          <Eyebrow>The problem</Eyebrow>
        </div>
        <H2 className="mt-5 max-w-[20ch]">
          Outbound is broken, and everybody selling you a fix already knows it.
        </H2>
        <Lead className="mt-5 max-w-[64ch]">
          You are not short of tools. You are short of a system that finds the
          right person at the right moment and then says something worth
          answering.
        </Lead>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#e7edf5] bg-[#e7edf5] sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10 dark:bg-white/10">
          {NUMBERS.map((item) => (
            <div
              key={item.n}
              className="bg-white p-6 dark:bg-slate-950 sm:p-7"
            >
              <span className="font-mono text-[11.5px] text-[#8996ac]">{item.n}</span>
              <p className="mt-4 font-grotesk text-[clamp(28px,3.4vw,38px)] font-semibold leading-none tracking-[-0.035em] text-[#060911] dark:text-white">
                {item.figure}
              </p>
              <p className="mt-4 font-instrument text-[14.5px] leading-[1.6] text-[#586780] dark:text-slate-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="dark" className="!py-[clamp(60px,7vw,96px)]">
        <p className="mx-auto max-w-[24ch] text-center font-grotesk text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1] tracking-[-0.035em]">
          The bottleneck was never your product. It is that the right people{" "}
          <span className="text-cyan-300">never heard of you.</span>
        </p>
      </Section>
    </>
  );
}
