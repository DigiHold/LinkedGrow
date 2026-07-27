"use client";

import Link from "next/link";
import { useEffect } from "react";
import { initV3Pricing } from "./pricing-effects";
import { initV3Chrome } from "./chrome-effects";
import "./landing.css";

/**
 * The sections a pricing page needs besides the prices.
 *
 * The page was two plans and a FAQ, which answers "how much" and nothing else.
 * Somebody on a pricing page has already decided they want the thing; what
 * stops them is the stack of separate bills they are picturing, the fear of
 * losing a LinkedIn account, and not knowing what happens on day 8. These are
 * those three, plus the guarantee.
 *
 * Every class here already exists in landing.css. Nothing new was invented,
 * because the last time class names shipped ahead of their styles the heroes
 * rendered as unstyled text.
 */


/**
 * The top of the pricing page: the number, immediately.
 *
 * No button above the fold and nothing to scroll past. Somebody here already
 * knows what the product is, so anything standing between them and the price is
 * a thing that can lose them. The plan cards sit on the hero field itself
 * rather than a screen below it, and the markup is lifted from the home's own
 * pricing block so the two can never disagree.
 */
export function V3PricingHero() {
  useEffect(() => {
    const stopChrome = initV3Chrome();
    const stopPricing = initV3Pricing();
    return () => {
      stopChrome?.();
      stopPricing?.();
    };
  }, []);

  return (
    <div className="v3">
      <section className="hero inner pricing">
        <div className="herobg">
          <span className="orb a"></span>
          <span className="orb b"></span>
          <div className="rings"><i></i><i></i><i></i></div>
        </div>

        <div className="wrap center">
          <span className="eb lt rv"><i></i>Two plans, and no second invoice</span>
          <h1 className="wsplit" data-blur="3" style={{ maxWidth: "17ch" }}>
            $99 a month, <em>everything included.</em>
          </h1>
          <p className="lead rv" style={{ "--d0": ".1s" } as React.CSSProperties}>
            The dedicated IP, the agent&apos;s AI, the leads and the four-week
            warm-up are all in the price. Free for 7 days, no card, and nothing
            to cancel if you walk away.
          </p>
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
        <div className="carve"></div>
      </section>

      <div className="prhero rv" style={{ "--d0": ".22s" } as React.CSSProperties}>
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
                  <Link className="fill lg pri wide" href="/sign-up?plan=pro">Start free for 7 days
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></Link>
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
                  <Link className="fill lg wide" href="/sign-up?plan=business">Start free for 7 days
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></Link>
                </div>
              </div>
          </div>
    </div>
  );
}

function Tick() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/**
 * What the same job costs, drawn rather than listed.
 *
 * This was a four-card grid, then a three-card grid, and both were the thing
 * every SaaS pricing page already looks like. What converts under a plan table
 * is a comparison a person can read in one pass and a trust block, so the
 * stack is a bar and the comparison is a table with rows.
 */
export function V3PricingIncluded() {
  return (
    <div className="v3">
      <section className="sec pricing-next">
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "880px" }}>
            <span className="bul"></span>
            <div>
              <h2>Four invoices, or one.</h2>
              <p className="lead" style={{ marginTop: "18px" }}>
                Running this yourself means a tool, a proxy provider, an AI
                subscription and an enrichment balance. Four bills, four
                dashboards, and each with its own way of running out at the
                wrong moment.
              </p>
            </div>
          </div>

          <div className="stack rv">
            <div className="srow">
              <span className="lab">
                Assembled yourself
                <small>four vendors, four renewal dates</small>
              </span>
              <span className="bar">
                <i className="a" style={{ flex: 99 }}>Outreach tool $99</i>
                <i className="b" style={{ flex: 30 }}>Proxies $30</i>
                <i className="c" style={{ flex: 20 }}>AI $20</i>
                <i className="d" style={{ flex: 25 }}>Enrichment $25</i>
              </span>
              <span className="tot">$174</span>
            </div>
            <div className="slegend" aria-hidden="true">
              <span className="a">Outreach tool $99</span>
              <span className="b">Proxies $30</span>
              <span className="c">AI $20</span>
              <span className="d">Enrichment $25</span>
            </div>

            <div className="srow win">
              <span className="lab">
                LinkedGrow Pro
                <small>one line on one card</small>
              </span>
              <span className="bar us">
                <i style={{ flex: 99 }}>Everything above, included</i>
                <i style={{ flex: 75, background: "transparent" }}></i>
              </span>
              <span className="tot">$99</span>
            </div>
          </div>

          <p className="sfoot rv" style={{ marginTop: "26px" }}>
            The four figures on the top bar are the sticker prices of the
            category, not a quote for any one vendor. The only number we set is
            the bottom one.
          </p>
        </div>
      </section>
    </div>
  );
}

/** The comparison, as rows. A table is not a card and reads in one pass. */
export function V3PricingCompare() {
  return (
    <div className="v3">
      <section className="sec" style={{ background: "var(--bg2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "860px" }}>
            <span className="bul"></span>
            <div>
              <h2>The same job, done three ways.</h2>
              <p className="lead" style={{ marginTop: "18px" }}>
                Finding your buyers on LinkedIn and opening a conversation with
                them every working day.
              </p>
            </div>
          </div>

          <div className="rv">
            <table className="ctab responsive-table">
              <thead>
                <tr>
                  <th></th>
                  <th>A junior rep</th>
                  <th>A stack you assemble</th>
                  <th className="own">LinkedGrow Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Monthly cost</th>
                  <td data-label="A junior rep">Around $4,000 before tools</td>
                  <td data-label="A stack you assemble">$174 across four vendors</td>
                  <td className="own" data-label="LinkedGrow Pro">$99, one invoice</td>
                </tr>
                <tr>
                  <th>Time to first conversation</th>
                  <td data-label="A junior rep">Weeks of hiring, then ramp</td>
                  <td data-label="A stack you assemble">Days of setup and wiring</td>
                  <td className="own" data-label="LinkedGrow Pro">Same day, warm-up starts at once</td>
                </tr>
                <tr>
                  <th>Who finds the people</th>
                  <td data-label="A junior rep">They do, from a list you buy</td>
                  <td data-label="A stack you assemble">You do, from credits you top up</td>
                  <td className="own" data-label="LinkedGrow Pro">The agent, from live signals</td>
                </tr>
                <tr>
                  <th>Why each lead was picked</th>
                  <td className="no" data-label="A junior rep">Ask them</td>
                  <td className="no" data-label="A stack you assemble">A score with no reason</td>
                  <td className="own" data-label="LinkedGrow Pro">A score, its reason, and a link to the post</td>
                </tr>
                <tr>
                  <th>Message quality</th>
                  <td data-label="A junior rep">As good as the person</td>
                  <td className="no" data-label="A stack you assemble">Yours to solve</td>
                  <td className="own" data-label="LinkedGrow Pro">Anti-slop gate before anything sends</td>
                </tr>
                <tr>
                  <th>Account safety</th>
                  <td data-label="A junior rep">Human pace by definition</td>
                  <td className="no" data-label="A stack you assemble">Your problem, per tool</td>
                  <td className="own" data-label="LinkedGrow Pro">Hard limits it cannot break</td>
                </tr>
                <tr>
                  <th>When they reply</th>
                  <td data-label="A junior rep">They handle it</td>
                  <td className="no" data-label="A stack you assemble">Nothing happens</td>
                  <td className="own" data-label="LinkedGrow Pro">The agent answers, then hands you the ones that matter</td>
                </tr>
                <tr>
                  <th>If it is not working</th>
                  <td data-label="A junior rep">A conversation nobody enjoys</td>
                  <td data-label="A stack you assemble">Four cancellations</td>
                  <td className="own" data-label="LinkedGrow Pro">One click, and your leads export</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="tstrip rv">
            <h3>The one thing worth more than the price: the account it runs on.</h3>
            <p className="sub">
              Speed is what gets LinkedIn accounts restricted, so the agent is
              built around restraint you can watch working. These are not
              settings. They are limits the agent cannot exceed on any plan.
            </p>
            <div className="hard">
              <div className="rv"><b>6</b><p>messages per person, maximum, then it stops for good</p></div>
              <div className="rv" style={{ "--d0": ".07s" } as React.CSSProperties}><b>1</b><p>dedicated residential IP per LinkedIn account</p></div>
              <div className="rv" style={{ "--d0": ".14s" } as React.CSSProperties}><b>40-120<em>s</em></b><p>enforced gap between any two actions</p></div>
              <div className="rv" style={{ "--d0": ".21s" } as React.CSSProperties}><b>0</b><p>actions on weekends, public holidays included</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** What happens on day 8, said plainly, because that is the real objection. */
export function V3PricingGuarantee() {
  return (
    <div className="v3">
      <section className="sec">
        <div className="wrap">
          <div className="split solid rv">
            <div>
              <h2 style={{ fontSize: "clamp(27px,3.4vw,40px)" }}>
                Seven days, and nothing to cancel if you walk away.
              </h2>
              <p className="lead" style={{ marginTop: "18px" }}>
                No card to start. Your agent is fully live for the trial, on the
                Pro plan, with a real dedicated address and a real warm-up
                already running. If you do nothing at the end of it, it stops.
                There is no invoice and nothing to remember to cancel.
              </p>
              <div className="tick" style={{ marginTop: "24px" }}>
                <div>
                  <Tick />
                  Cancel from the dashboard in one click, any time
                </div>
                <div>
                  <Tick />
                  Your leads and conversations stay exportable as CSV
                </div>
                <div>
                  <Tick />
                  Switch plan up or down without talking to anybody
                </div>
              </div>
              <div style={{ marginTop: "30px" }}>
                <Link className="fill lg" href="/sign-up">
                  Start free for 7 days
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
