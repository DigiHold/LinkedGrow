"use client";

import { useEffect } from "react";
import { initV3Pricing } from "./pricing-effects";
import { V3_BLOCK } from "./root";
import {
  FILL, FILL_LG, FILL_LIGHT, FILL_PRI, FILL_WIDE, H2, INC, LEAD_MUT, PD, PIP,
  PLAN, PLAN_BEST, PLAN_LI, PLAN_LI_I, PLAN_PLAIN, PLAN_TAG, PLAN_UL, PLANS, PN,
  PR, RV, RV_STATE, SEC, TGNOTE, TOGGLE, WORTH, WRAP, YR,
} from "./kit";

/**
 * The two plans and the monthly / yearly switch.
 *
 * One implementation, rendered by the home and by /pricing. They were separate
 * files with byte-identical markup, which is a drift waiting to happen the next
 * time a price moves.
 *
 * `tg`, `pip`, `on` and the data-m / data-y attributes are the switch's hooks:
 * pricing-effects.js slides the handle and swaps every value in place.
 */
/** The two plan cards: under the home's heading, and inside the pricing hero
    where they break out over the dark ground. This markup existed three times. */
export function V3PlanCards() {
  return (
        <div className={PLANS}>
          <div className={`${PLAN} ${PLAN_BEST} ${RV_STATE}`}><span className={PLAN_TAG}>Where most founders start</span>
            <div className={PN}>Pro</div><div className={PD}>Two agents working every day for you</div>
            <div className={PR}><span>$99</span><small>/ month</small></div>
            <div className={WORTH}>A rep costs around $4,000 a month, an outreach tool $99, an AI subscription $20, two proxies $30. You are paying for one of those four.</div>
            <div className={INC}>What's included</div>
            <ul className={PLAN_UL}>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span><b>2 AI agents</b>, 2 LinkedIn accounts</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Up to 1,000 buyers contacted a month</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Anti-slop gate on every message</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Unified reply inbox with instant email alerts</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>CRM, API and <b>MCP</b> integrations</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Write posts, carousels and scheduling</span></li>
            </ul>
            <a className={`${FILL} ${FILL_LG} ${FILL_PRI} ${FILL_WIDE}`} href="/sign-up?plan=pro">Start free for 7 days
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
          </div>
          <div className={`${PLAN} ${PLAN_PLAIN} ${RV_STATE}`}>
            <div className={PN}>Business</div><div className={PD}>Three agents and the team around them</div>
            <div className={PR}><span>$179</span><small>/ month</small></div>
            <div className={WORTH}>A lead that never reaches the CRM does not exist. This tier puts every one of them there automatically and gives each reply an owner.</div>
            <div className={INC}>Everything in Pro, plus</div>
            <ul className={PLAN_UL}>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span><b>3 AI agents</b>, 3 LinkedIn accounts</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Up to 1,500 buyers contacted a month</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Your whole team in one workspace</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Hand a conversation to a teammate, history and all</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>A/B testing across your sequences</span></li>
              <li className={PLAN_LI}><i className={PLAN_LI_I}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Team reporting on what each agent and each person produced</span></li>
            </ul>
            <a className={`${FILL} ${FILL_LIGHT} ${FILL_LG} ${FILL_WIDE}`} href="/sign-up?plan=business">Start free for 7 days
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
          </div>
        </div>
  );
}

export function V3Plans() {
  useEffect(() => initV3Pricing(), []);
  return (
    <section className={`${SEC} border-t border-v3-line bg-v3-bg2 dark:border-v3-line-d dark:bg-v3-bg2-d`} id="pricing">
      <div className={WRAP}>
        <div className={`${RV} mb-10 text-center`}>
          <h2 className={H2}>One price, and the agent needs nothing else.</h2>
          <p className={`${LEAD_MUT} mx-auto mt-[18px]`}>No credits to run out of, no proxy invoice arriving separately at the end of the month, and no AI bill for anything your agent does. Writing your own posts is the one part that runs on your own AI key, which is what keeps it unlimited for a few dollars a month.</p>
        </div>
        <V3PlanCards />
      </div>
    </section>
  );
}

/** The same block wrapped in its own v3 root, for a page that has no other. */
export function V3PricingSection() {
  return (
    <div className={V3_BLOCK}>
      <V3Plans />
    </div>
  );
}
