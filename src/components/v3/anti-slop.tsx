import { Section, Eyebrow, H2, Lead } from "./primitives";

/**
 * The anti-slop gate, shown rather than claimed.
 *
 * Every competitor says their AI sounds human. The only way to be believed is
 * to print the message that gets rejected next to the one that goes out, with
 * the reasons marked on it. The rejected draft below is deliberately the exact
 * shape the whole category sends.
 */

const FLAGS = [
  "generic opener",
  "banned: resonated",
  "banned: leverage",
  "headline parroting",
  "no real signal",
];

export function V3AntiSlop() {
  return (
    <Section tone="tint">
      <Eyebrow>The anti-slop gate</Eyebrow>
      <H2 className="mt-5 max-w-[20ch]">
        A message that sounds like AI never leaves the building.
      </H2>
      <Lead className="mt-5 max-w-[68ch]">
        Before anything sends, a programmatic gate reads the draft and rejects it
        if it smells like a machine. Not a polite instruction inside a prompt, an
        actual gate. It fails, it gets rewritten, and after four attempts we skip
        the lead rather than send you something mediocre.
      </Lead>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-500/25 dark:bg-slate-900 sm:p-7">
          <p className="font-instrument text-[12.5px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
            Rejected by the gate
          </p>
          <p className="mt-5 font-instrument text-[15px] leading-[1.7] text-[#586780] line-through decoration-red-300 decoration-1 dark:text-slate-400">
            Hi Sarah, I saw your post about outreach and it really resonated. I
            would love to connect and leverage our shared interest in the
            LinkedIn automation space to explore synergies.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {FLAGS.map((flag) => (
              <li
                key={flag}
                className="rounded-full bg-red-50 px-2.5 py-1 font-mono text-[11px] text-red-600 dark:bg-red-500/10 dark:text-red-300"
              >
                {flag}
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-[#e7edf5] pt-5 font-instrument text-[13.5px] leading-[1.6] text-[#8996ac] dark:border-white/10">
            Every tool on the market sends this exact shape. Your prospect deleted
            four of them this week without finishing the first line.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-6 dark:border-emerald-500/25 dark:bg-slate-900 sm:p-7">
          <p className="font-instrument text-[12.5px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
            Passed, and sent
          </p>
          <p className="mt-5 font-instrument text-[15px] leading-[1.7] text-[#1e2a41] dark:text-slate-200">
            Hi Sarah, your line about templates being the reason people stopped
            answering is the thing I keep arguing about. We went the other way and
            write from the comment rather than the headline. Curious how you
            handle it at Northline.
          </p>
          <p className="mt-4 font-instrument text-[15px] text-[#1e2a41] dark:text-slate-200">
            Nicolas
          </p>
          <p className="mt-6 border-t border-[#e7edf5] pt-5 font-instrument text-[13.5px] leading-[1.6] text-[#586780] dark:border-white/10 dark:text-slate-400">
            Built from her actual comment. No product name, no link, no pitch
            anywhere in it. That is the whole reason it gets an answer.
          </p>
        </div>
      </div>
    </Section>
  );
}
