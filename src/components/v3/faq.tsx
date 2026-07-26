"use client";

import { useState } from "react";
import { Section, Eyebrow, H2, Btn } from "./primitives";
import { V3_FAQS } from "./faq-data";

export function V3Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section tone="light">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <Eyebrow>Before you ask</Eyebrow>
          <H2 className="mt-5 max-w-[16ch]">
            The questions everybody asks first.
          </H2>
          <div className="mt-8 rounded-2xl border border-[#e7edf5] bg-[#f6f9fd] p-6 dark:border-white/10 dark:bg-white/5">
            <p className="font-grotesk text-[17px] font-semibold tracking-[-0.02em] text-[#060911] dark:text-white">
              Still not sure it fits you?
            </p>
            <p className="mt-2 font-instrument text-[14px] leading-[1.6] text-[#586780] dark:text-slate-400">
              Send one line about what you sell and we will tell you honestly
              whether the agent has enough signal to work with. No call, no deck.
            </p>
            <Btn href="mailto:contact@linkedgrow.ai" variant="plain" className="mt-5">
              Email us directly
            </Btn>
          </div>
        </div>

        <ul className="divide-y divide-[#e7edf5] border-y border-[#e7edf5] dark:divide-white/10 dark:border-white/10">
          {V3_FAQS.map((item, i) => (
            <li key={item.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-start gap-4 py-5 text-left"
              >
                <span className="mt-1 font-mono text-[11.5px] text-[#8996ac]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-grotesk text-[17px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#060911] dark:text-white">
                  {item.q}
                </span>
                <span
                  className={`mt-1 shrink-0 font-mono text-[16px] text-[#8996ac] transition-transform ${
                    open === i ? "rotate-45" : ""
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              {open === i && (
                <p className="pb-6 pl-9 pr-8 font-instrument text-[14.5px] leading-[1.68] text-[#586780] dark:text-slate-400">
                  {item.a}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
