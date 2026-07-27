"use client";

import { useEffect } from "react";
import { initV3Faq } from "./faq-effects";
import { V3_FAQS } from "./faq-data";
import { V3_ROOT } from "./root";

/**
 * The FAQ, for the home and for any page that needs it.
 *
 * It renders V3_FAQS, the same array that feeds the FAQPage schema, so the
 * visible answers and the structured data cannot drift apart. They had: one
 * answer described the agent going silent on any reply, which is not what it
 * does, and correcting it meant editing three files.
 *
 * `q`, `a` and `open` are selector hooks for faq-effects.js; the styling beside
 * them describes both the closed and the open state.
 */

const SEC = "py-[clamp(70px,8.5vw,126px)]";
const WRAP = "mx-auto max-w-[1220px] px-6";
const H2 =
  "m-0 font-v3-display! text-[clamp(32px,4.6vw,55px)] font-semibold! leading-[1.03] tracking-[-.042em]!";

const RV =
  "rv opacity-0 [transform:translateY(26px)] [filter:blur(6px)] " +
  "[transition-property:opacity,transform,filter] [transition-duration:850ms] [transition-timing-function:var(--ease-v3)] [transition-delay:var(--d0,0s)] " +
  "[&.seen]:opacity-100 [&.seen]:[transform:none] [&.seen]:[filter:none] " +
  "motion-reduce:opacity-100 motion-reduce:[transform:none] motion-reduce:[filter:none] motion-reduce:transition-none";

const EB =
  "relative inline-flex items-center gap-2.5 px-[15px] py-[7px] font-v3-mono text-[12px] font-medium uppercase tracking-[.14em] " +
  "text-v3-mut dark:text-v3-mut-d " +
  "before:absolute before:left-0 before:top-0 before:size-[9px] before:border-l-[1.5px] before:border-t-[1.5px] before:border-v3-line2 dark:before:border-v3-line2-d before:[transition:border-color_.35s_var(--ease-v3)] before:content-[''] " +
  "after:absolute after:bottom-0 after:right-0 after:size-[9px] after:border-b-[1.5px] after:border-r-[1.5px] after:border-v3-line2 dark:after:border-v3-line2-d after:[transition:border-color_.35s_var(--ease-v3)] after:content-['']";
const EB_DOT =
  "h-[6px] w-[6px] flex-none rounded-full bg-v3-blue shadow-[0_0_0_3px_rgba(21,93,252,.16)]";

const FAQWRAP =
  "grid grid-cols-[.82fr_1.18fr] items-start gap-[clamp(30px,5vw,70px)] max-[940px]:[grid-template-columns:minmax(0,1fr)]";
const FAQSIDE = "sticky top-[112px] max-[940px]:static";
const ASKCARD =
  "mt-[30px] rounded-[18px] border border-v3-line2 bg-v3-bg2 p-6 dark:border-v3-line-d dark:bg-v3-bg2-d " +
  "[&>b]:block [&>b]:font-v3-display [&>b]:text-[17px] [&>b]:font-semibold [&>b]:tracking-[-.032em] " +
  "[&>p]:mt-2 [&>p]:text-[14.5px] [&>p]:text-v3-mut dark:[&>p]:text-v3-mut-d";

const FILL_SM =
  "fill relative isolate mt-[18px] inline-flex cursor-pointer items-center justify-center gap-[9px] overflow-hidden whitespace-nowrap " +
  "rounded-[11px] border border-transparent bg-white px-[17px] py-[9px] font-v3-sans text-[14px] font-semibold text-v3-deep " +
  "shadow-[0_2px_6px_-2px_rgba(6,9,17,.16),0_10px_26px_-14px_rgba(6,9,17,.4)] " +
  "[transition-property:transform,box-shadow,color]! [transition-duration:240ms,280ms,340ms]! [transition-timing-function:var(--ease-v3),ease,var(--ease-v3)]! " +
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] before:content-[''] " +
  "before:[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "before:[transform:translateY(102%)] before:[transition:transform_.46s_var(--ease-v3)] " +
  "hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_16px_34px_-14px_rgba(21,93,252,.62)] hover:before:[transform:translateY(0)] " +
  "[&_svg]:[transition:transform_.26s_var(--ease-v3)] hover:[&_svg]:[transform:translateX(4px)]";

const Q =
  "q relative rounded-[16px] border border-v3-line bg-white dark:border-v3-line-d dark:bg-v3-bg2-d " +
  "[transition:border-color_.3s_var(--ease-v3),box-shadow_.3s_var(--ease-v3),transform_.3s_var(--ease-v3)] " +
  "hover:border-v3-line2 hover:[transform:translateY(-2px)] hover:shadow-[0_20px_40px_-32px_rgba(6,9,17,.55)] " +
  "dark:hover:border-v3-line2-d dark:hover:shadow-[0_20px_40px_-32px_rgba(0,0,0,.75)] " +
  "[&.open]:border-transparent [&.open]:shadow-[0_28px_54px_-38px_rgba(21,93,252,.5)] [&.open]:[transform:none] " +
  "[&.open]:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(140deg,var(--color-v3-cyan),var(--color-v3-blue))_border-box] " +
  "dark:[&.open]:shadow-[0_28px_54px_-38px_rgba(21,93,252,.55)] " +
  "dark:[&.open]:[background:linear-gradient(var(--color-v3-bg2-d),var(--color-v3-bg2-d))_padding-box,linear-gradient(140deg,var(--color-v3-cyan),var(--color-v3-blue))_border-box]";
const Q_BTN =
  "flex w-full cursor-pointer items-center gap-[15px] border-0 bg-none px-6 py-[22px] text-left font-v3-display text-[17.5px] font-semibold leading-[1.3] tracking-[-.032em] text-v3-ink dark:text-v3-ink-d";
const Q_IX =
  "flex-none font-v3-mono text-[11px] text-v3-faint [transition:color_.3s] dark:text-v3-faint-d [.open_&]:text-v3-blue";
const Q_PM =
  "ml-auto grid h-7 w-7 flex-none place-items-center rounded-full bg-v3-bg3 dark:bg-v3-bg3-d dark:text-v3-ink2-d " +
  "[transition:transform_.36s_var(--ease-v3),background_.26s,color_.26s] " +
  "[.open_&]:text-white [.open_&]:[transform:rotate(135deg)] [.open_&]:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))]";
const Q_A_P =
  "max-w-[70ch] pb-6 pl-[58px] pr-6 pt-0 text-[15.5px] text-v3-mut dark:text-v3-mut-d max-[560px]:pl-6";

/** The list on its own, for a page that already has a section shell. */
export function V3FaqList({ id = "faq" }: { id?: string }) {
  return (
    <div className={`grid gap-3 ${RV}`} id={id} style={{ "--d0": ".08s" } as React.CSSProperties}>
      {V3_FAQS.map((f, i) => (
        <div className={Q} key={f.q}>
          <button className={Q_BTN}>
            <span className={Q_IX}>{String(i + 1).padStart(2, "0")}</span>
            {f.q}
            <span className={Q_PM}>+</span>
          </button>
          <div className="a max-h-0 overflow-hidden [transition:max-height_.44s_var(--ease-v3)]">
            <p className={Q_A_P}>{f.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** The sticky panel beside the list. */
export function V3FaqAside() {
  return (
    <div className={`${FAQSIDE} ${RV}`}>
      <span className={EB}><i className={EB_DOT}></i>Before you ask</span>
      <h2 className={`${H2} mt-5`}>The questions everybody asks first.</h2>
      <div className={ASKCARD}>
        <b>Still not sure it fits you?</b>
        <p>Send one line about what you sell and we will tell you honestly whether the agent has enough signal to work with. No call, no deck.</p>
        <a className={FILL_SM} href="mailto:contact@linkedgrow.ai">Email us directly
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
      </div>
    </div>
  );
}

export function V3FaqSection() {
  useEffect(() => initV3Faq(), []);
  return (
    <div className={V3_ROOT}>
      <section className={SEC}>
        <div className={WRAP}>
          <div className={FAQWRAP}>
            <V3FaqAside />
            <V3FaqList />
          </div>
        </div>
      </section>
    </div>
  );
}
