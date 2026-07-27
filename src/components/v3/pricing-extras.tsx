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
      </section>
    </div>
  );
}

function Tick() {
  return (
    <i>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </i>
  );
}

/** What every plan carries, which is the part competitors bill separately. */
export function V3PricingIncluded() {
  return (
    <div className="v3">
      <section className="sec pricing-next">
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "900px", marginBottom: "44px" }}>
            <span className="bul"></span>
            <div>
              <h2>Four bills you are not going to get.</h2>
              <p className="lead" style={{ marginTop: "18px" }}>
                Running outreach yourself means a tool, a proxy provider, an AI
                subscription and an enrichment credit balance, each with its own
                invoice and its own way of running out at the wrong moment. All
                four are inside the price.
              </p>
            </div>
          </div>

          <div className="vgrid rv">
            <div className="vcard">
              <div className="k">01</div>
              <h3>A dedicated IP</h3>
              <p>
                A residential address in your country, reserved for your account
                for its whole life and never rotated. Bought separately this is
                its own monthly invoice, per account.
              </p>
            </div>
            <div className="vcard">
              <div className="k">02</div>
              <h3>The agent&apos;s AI</h3>
              <p>
                Every message it writes, scored and rewritten until it passes the
                anti-slop gate, is on us. Your own posts are the one thing that
                runs on your key.
              </p>
            </div>
            <div className="vcard">
              <div className="k">03</div>
              <h3>The leads themselves</h3>
              <p>
                Found by watching who engages with your competitors and who is
                talking about the problem you solve. No list to buy and no
                credits to run out of mid-month.
              </p>
            </div>
            <div className="vcard">
              <div className="k">04</div>
              <h3>Four weeks of warm-up</h3>
              <p>
                On every new account, included and not skippable. It is the
                cheapest insurance there is against losing the account the whole
                thing runs on.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** The comparison that actually decides it: this, or a person, or a stack. */
export function V3PricingCompare() {
  return (
    <div className="v3">
      <section className="sec" style={{ background: "var(--bg2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "880px", marginBottom: "40px" }}>
            <span className="bul"></span>
            <div>
              <h2>The same job, priced three ways.</h2>
              <p className="lead" style={{ marginTop: "18px" }}>
                Finding buyers on LinkedIn and opening a conversation with them
                every working day. Here is what that costs depending on who does
                it.
              </p>
            </div>
          </div>

          <div className="vgrid rv">
            <div className="vcard">
              <div className="k">Around $4,000 a month</div>
              <h3>Hire a junior rep</h3>
              <p>
                Around $4,000 a month before tools, plus a list, a script, a
                manager and the months before they pay for themselves.
              </p>
            </div>
            <div className="vcard">
              <div className="k">Four separate invoices</div>
              <h3>Assemble it yourself</h3>
              <p>
                An outreach tool, a proxy per account, an AI subscription and an
                enrichment balance. Four invoices, four dashboards, and the
                message quality is still yours to solve.
              </p>
            </div>
            <div className="vcard hi">
              <div className="k">$99 a month, one invoice</div>
              <h3>LinkedGrow Pro</h3>
              <p>
                $99 a month, everything above included, two agents working every
                working day inside limits they cannot break.
              </p>
            </div>
          </div>

          <p className="sfoot rv">
            The rep figure is a market rate rather than a quote, and it is the
            only number here we did not set ourselves.
          </p>
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
