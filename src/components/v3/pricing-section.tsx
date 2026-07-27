"use client";

import { useEffect } from "react";
import { initV3Pricing } from "./pricing-effects";
import "./landing.css";

/**
 * The pricing block from the prototype, reusable.
 *
 * The /pricing page was still selling Starter at $13 and the old $19/$39/$79
 * ladder, which have not existed since v2. Rather than restyle a page that
 * describes a product we no longer sell, it renders the same two plans the
 * home does, from the same markup.
 */
export function V3PricingSection() {
  useEffect(() => initV3Pricing(), []);

  return (
    <div className="v3">
          <section className="sec" id="pricing" style={{ background: "var(--bg2)", borderTop: "1px solid var(--line)" }}>
            <div className="wrap">
              <div className="center rv" style={{ marginBottom: "40px" }}>
                <h2>One price, and the agent needs nothing else.</h2>
                <p className="lead" style={{ marginTop: "18px" }}>No credits to run out of, no proxy invoice arriving separately at the end of the month, and no AI bill for anything your agent does. Writing your own posts is the one part that runs on your own AI key, which is what keeps it unlimited for a few dollars a month.</p>
                <div style={{ marginTop: "28px", display: "flex", justifyContent: "center" }}>
                  <div className="tgwrap">
                    <div className="toggle" id="tg"><span className="pip" id="pip"></span>
                      <button className="on" data-p="m">Monthly</button><button data-p="y">Yearly</button></div>
                    <span className="tgnote" aria-hidden="true">
                      <svg width="54" height="40" viewBox="0 0 54 40" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M50 37C39 35 20 28 9 9" /><path d="M6 20l1.5-13.5 12.5 4" /></svg>
                      <b>2 months free</b></span>
                  </div>
                </div>
              </div>
              <div className="plans">
                <div className="plan best rv"><span className="tag">Where most founders start</span>
                  <div className="pn">Pro</div><div className="pd">Two agents working every day for you</div>
                  <div className="pr"><span data-m="$99" data-y="$990">$99</span><small data-m="/ month" data-y="/ year">/ month</small></div>
                  <div className="yr" data-m="or $990 a year, two months free" data-y="works out at $82.50 a month">or $990 a year, two months free</div>
                  <div className="worth">A rep costs around $4,000 a month, an outreach tool $99, an AI subscription $20, two proxies $30. You are paying for one of those four.</div>
                  <div className="inc">What's included</div>
                  <ul>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span><b>2 AI agents</b> prospecting every working day</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>2 LinkedIn accounts, 2 audiences, 2 dedicated IPs</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Up to 1,000 buyers contacted a month, warm-up included</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Leads mined from competitor audiences and live signals</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Every lead linked to the post it came from</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Anti-slop gate on every message before it sends</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Unified reply inbox with instant email alerts</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>CRM, API and <b>MCP</b> integrations (HubSpot, Pipedrive, Claude...)</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Posts, carousels and scheduling on your own AI key</span></li>
                  </ul>
                  <a className="fill lg pri wide" href="#">Start free for 7 days
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
                </div>
                <div className="plan rv">
                  <div className="pn">Business</div><div className="pd">Three agents and the team around them</div>
                  <div className="pr"><span data-m="$179" data-y="$1,790">$179</span><small data-m="/ month" data-y="/ year">/ month</small></div>
                  <div className="yr" data-m="or $1,790 a year, two months free" data-y="works out at $149 a month">or $1,790 a year, two months free</div>
                  <div className="worth">A lead that never reaches the CRM does not exist. This tier puts every one of them there automatically and gives each reply an owner.</div>
                  <div className="inc">Everything in Pro, plus</div>
                  <ul>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span><b>3 AI agents</b>, 3 LinkedIn accounts, 3 dedicated IPs</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Up to 1,500 buyers contacted a month</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Unlimited seats inside one shared workspace</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Shared inbox with an owner on every reply</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Lead scoring you can weight yourself</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Salesforce, webhooks and a private MCP endpoint</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Client workspaces and white-label reporting</span></li>
                    <li><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg></i><span>Priority support with a named contact</span></li>
                  </ul>
                  <a className="fill lg wide" href="#">Start free for 7 days
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
                </div>
              </div>
            </div>
          </section>
    </div>
  );
}
