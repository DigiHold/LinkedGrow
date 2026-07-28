"use client";

import Link from "next/link";
import { useEffect } from "react";
import { initV3Pricing } from "./pricing-effects";
import { initV3Chrome } from "./chrome-effects";
import { V3_BLOCK } from "./root";
import { V3PlanCards, V3PriceToggle } from "./pricing-section";
import {
  BAR, BAR_A, BAR_B, BAR_C, BAR_D, BAR_US, CTAB, EB_DOT_LT, EB_LT, EM_SKY, FILL, FILL_LG, FILL_LIGHT,
  H1, H2, HARD, HARD_B, HARD_CELL, HARD_P, HERO_ORB_A, HERO_ORB_B, HERO_PRICING, HERO_RINGS, LEAD,
  LEAD_MUT, PRHERO, PRICING_NEXT, RV, RV_STATE, SEC, SFOOT, SH, SH_BUL, SLEGEND, SROW, SROW_LAB,
  GUARANTEE, SROW_TOT, SROW_TOT_WIN, STACK, TICK, TOGGLE_ON_DARK, TSTRIP, WRAP, WSPLIT, CARVE,
} from "./kit";

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
    <div className={V3_BLOCK}>
      <section className={HERO_PRICING}>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <span className={HERO_ORB_A}></span>
          <span className={HERO_ORB_B}></span>
          <div className={HERO_RINGS}><i></i><i></i><i></i></div>
        </div>
        <canvas
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          id="net"
        ></canvas>

        <div className={`${WRAP} ${TOGGLE_ON_DARK} relative z-[3] text-center`}>
          <span className={`${EB_LT} ${RV}`}><i className={EB_DOT_LT}></i>Two plans, and no second invoice</span>
          <h1 className={`${H1} ${WSPLIT} mx-auto mt-[26px] max-w-[17ch] text-white`} data-blur="3">
            $99 a month, <em className={EM_SKY}>everything included.</em>
          </h1>
          <p className={`${LEAD} ${RV} mx-auto mt-6 max-w-[62ch] text-[rgba(255,255,255,.76)]`} style={{ "--d0": ".1s" } as React.CSSProperties}>
            The dedicated IP, the agent&apos;s AI, the leads and the four-week
            warm-up are all in the price. Free for 7 days, then it renews at the
            plan price unless you cancel, which takes one click.
          </p>
          <V3PriceToggle />
        </div>
        <div className={CARVE}></div>
      </section>

      <div className={`${PRHERO} ${RV}`} style={{ "--d0": ".22s" } as React.CSSProperties}>
        <V3PlanCards />
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
    <div className={V3_BLOCK}>
      <section className={`${SEC} ${PRICING_NEXT}`}>
        <div className={WRAP}>
          <div className={`${SH} ${RV} max-w-[880px]`}>
            <span className={SH_BUL}></span>
            <div>
              <h2 className={H2}>Four invoices, or one.</h2>
              <p className={`${LEAD_MUT} mt-[18px]`}>
                Running this yourself means a tool, a proxy provider, an AI
                subscription and an enrichment balance. Four bills, four
                dashboards, and each with its own way of running out at the
                wrong moment.
              </p>
            </div>
          </div>

          <div className={`${STACK} ${RV}`}>
            <div className={SROW}>
              <span className={SROW_LAB}>
                Assembled yourself
                <small>four vendors, four renewal dates</small>
              </span>
              <span className={BAR}>
                <i className={BAR_A} style={{ flex: 99 }}>Outreach tool $99</i>
                <i className={BAR_B} style={{ flex: 30 }}>Proxies $30</i>
                <i className={BAR_C} style={{ flex: 20 }}>AI $20</i>
                <i className={BAR_D} style={{ flex: 25 }}>Enrichment $25</i>
              </span>
              <span className={SROW_TOT}>$174</span>
            </div>
            <div className={SLEGEND} aria-hidden="true">
              <span className="text-[#6a7f9c]">Outreach tool $99</span>
              <span className="text-[#8090ab]">Proxies $30</span>
              <span className="text-[#9aa7bd]">AI $20</span>
              <span className="text-[#b3bccd]">Enrichment $25</span>
            </div>

            <div className={SROW}>
              <span className={SROW_LAB}>
                LinkedGrow Pro
                <small>one line on one card</small>
              </span>
              <span className={BAR_US}>
                <i style={{ flex: 99 }}>Everything above, included</i>
                <i className="[background:transparent]!" style={{ flex: 75 }}></i>
              </span>
              <span className={SROW_TOT_WIN}>$99</span>
            </div>
          </div>

          <p className={`${SFOOT} ${RV} mt-[26px]`}>
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
    <div className={V3_BLOCK}>
      <section className={`${SEC} border-y border-v3-line bg-v3-bg2 dark:border-v3-line-d dark:bg-v3-bg2-d`}>
        <div className={WRAP}>
          <div className={`${SH} ${RV} max-w-[860px]`}>
            <span className={SH_BUL}></span>
            <div>
              <h2 className={H2}>The same job, done three ways.</h2>
              <p className={`${LEAD_MUT} mt-[18px]`}>
                Finding your buyers on LinkedIn and opening a conversation with
                them every working day.
              </p>
            </div>
          </div>

          <div className={RV}>
            <table className={`${CTAB} responsive-table`}>
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

          <div className={`${TSTRIP} ${RV}`}>
            <h3>The one thing worth more than the price: the account it runs on.</h3>
            <p className="sub">
              Speed is what gets LinkedIn accounts restricted, so the agent is
              built around restraint you can watch working. These are not
              settings. They are limits the agent cannot exceed on any plan.
            </p>
            <div className={HARD}>
              <div className={`${RV_STATE} ${HARD_CELL}`}><b className={HARD_B}>6</b><p className={HARD_P}>messages per person, maximum, then it stops for good</p></div>
              <div className={`${RV_STATE} ${HARD_CELL}`}><b className={HARD_B}>1</b><p className={HARD_P}>dedicated residential IP per LinkedIn account</p></div>
              <div className={`${RV_STATE} ${HARD_CELL}`}><b className={HARD_B}>40-120<em className="not-italic text-[.44em] tracking-[-.01em]">s</em></b><p className={HARD_P}>enforced gap between any two actions</p></div>
              <div className={`${RV_STATE} ${HARD_CELL}`}><b className={HARD_B}>0</b><p className={HARD_P}>actions on weekends, public holidays included</p></div>
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
    <div className={V3_BLOCK}>
      <section className={SEC}>
        <div className={WRAP}>
          <div className={`${GUARANTEE} ${RV}`}>
            <div>
              <h2 className={`${H2} text-[clamp(27px,3.4vw,40px)]`}>
                Seven days, and nothing to cancel if you walk away.
              </h2>
              <p className={`${LEAD_MUT} mt-[18px]`}>
                Your card is taken at signup and charged on day 8. Your agent is fully live for the trial, on the
                Pro plan, with a real dedicated address and a real warm-up
                already running. If you do nothing at the end of it, it stops.
                There is no invoice and nothing to remember to cancel.
              </p>
              <div className={TICK}>
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
              <div className="mt-[30px]">
                <Link className={`${FILL} ${FILL_LIGHT} ${FILL_LG}`} href="/sign-up">
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
