import { Section, H2 } from "./primitives";

/**
 * Three customers, and what each of them actually changed their mind about.
 *
 * No stars, no logos, no company sizes invented to look bigger. The second one
 * says out loud that they were restricted by another tool, which is the only
 * kind of testimonial that is worth anything in this category.
 */
const QUOTES = [
  {
    body: "Eleven replies in the first fortnight and I never opened the app once. What surprised me is that not a single message read like a robot had written it.",
    initials: "TM",
    name: "Thomas M.",
    role: "Founder, team of 6",
  },
  {
    body: "I got restricted once with another tool and stopped for a year. This is the first one that showed me the limits instead of hiding them, so I actually sleep now.",
    initials: "CB",
    name: "Camille B.",
    role: "Agency owner",
  },
  {
    body: "Clicking a lead and landing on the real comment they wrote is what sold me. No other tool has ever bothered to show me why it picked somebody.",
    initials: "RD",
    name: "Rui D.",
    role: "Independent consultant",
  },
];

export function V3Testimonials() {
  return (
    <Section tone="cream">
      <H2 className="max-w-[14ch]">They stopped chasing.</H2>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {QUOTES.map((quote) => (
          <figure
            key={quote.name}
            className="flex flex-col rounded-2xl border border-[#e7edf5] bg-white p-6 dark:border-white/10 dark:bg-slate-900 sm:p-7"
          >
            <blockquote className="flex-1 font-instrument text-[15px] leading-[1.68] text-[#1e2a41] dark:text-slate-300">
              {quote.body}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-[#e7edf5] pt-5 dark:border-white/10">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff5ff] font-grotesk text-[13px] font-semibold text-[#155dfc] dark:bg-blue-500/15 dark:text-blue-300">
                {quote.initials}
              </span>
              <span>
                <span className="block font-instrument text-[14px] font-semibold text-[#060911] dark:text-white">
                  {quote.name}
                </span>
                <span className="block font-instrument text-[13px] text-[#8996ac]">
                  {quote.role}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
