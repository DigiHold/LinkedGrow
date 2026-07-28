"use client";

import { useEffect } from "react";
import { initV3Faq } from "./faq-effects";
import { V3_FAQS } from "./faq-data";
import { V3_ROOT } from "./root";
import {
  ASKCARD, EB, EB_DOT, FAQSIDE, FAQWRAP, FILL_SM, H2, Q, Q_A_P, Q_BTN, Q_IX, Q_PM, RV, SEC, WRAP,
} from "./kit";

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
