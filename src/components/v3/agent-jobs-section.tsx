"use client";

import { V3Clip } from "./clip";
import {
  CAP,
  CAPS,
  CAP_ALT,
  CAP_H3,
  CAP_P,
  CAP_TXT_ALT,
  CHROME_DOT_LT,
  CHROME_LT,
  CHROME_URL_LT,
  EM_SH,
  H2,
  LEAD_MUT,
  NUMPILL,
  RV,
  SCREEN_LT,
  SEC,
  SH,
  SH_BUL,
  TICK,
  VID,
  WRAP,
} from "./kit";

/**
 * The four-jobs section with the real product clips, extracted from the home
 * so the leads comparison pages can sell with the same screens and effects.
 */
export function V3AgentJobsSection() {
  return (
      <section className={`${SEC} dark:border-y dark:border-v3-line-d dark:bg-v3-bg2-d`} id="agent">
        <div className={WRAP}>
          <div className={`${SH} ${RV} mb-[46px] max-w-[900px]`}><span className={SH_BUL}></span>
            <div><h2 className={H2}>Four jobs it does every day, <em className={EM_SH}>without being asked.</em></h2>
              <p className={`${LEAD_MUT} mt-[18px]`}>LinkedIn outreach automation that behaves: set it up in four minutes, then it runs by itself inside working hours, at the pace of a careful person who genuinely wants the reply.</p></div></div>

          <div className={`${CAPS} ${RV}`}>
            <div className={CAP}>
              <div>
                <span className={NUMPILL}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></svg>01 / 04</span>
                <h3 className={CAP_H3}>It works out who your buyers actually are</h3>
                <p className={CAP_P}>It reads your website, names your ideal customer in plain language, lists the competitors who share your audience, and shows you the whole thing before it touches LinkedIn.</p>
                <div className={TICK}>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Editable in one screen, so you can correct it</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Country, job title, company size and language</div>
                </div>
              </div>
              <div className={`crop relative ${RV}`}><span></span>
                <figure className={SCREEN_LT}><div className={CHROME_LT}><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><span className={CHROME_URL_LT}>app.linkedgrow.ai/agents/new</span></div>
                  <div className={VID}><V3Clip name="icp" label="The setup reading a website, then naming the audience and the sources to hunt in" /></div></figure></div>
            </div>

            <div className={CAP_ALT}>
              <div className={CAP_TXT_ALT}>
                <span className={NUMPILL}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h10M4 18h6" /></svg>02 / 04</span>
                <h3 className={CAP_H3}>It finds those people, with the receipt attached</h3>
                <p className={CAP_P}>Anyone engaging with your competitors, asking about your problem out loud, or who just landed a role where they choose the tools. Every lead links to the exact post it came from, so you can read their real words before you say anything.</p>
                <div className={TICK}>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Scored against your ideal customer, sorted by fit</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Nobody is ever contacted twice by two of your agents</div>
                </div>
              </div>
              <div className={`crop relative ${RV}`}><span></span>
                <figure className={SCREEN_LT}><div className={CHROME_LT}><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><span className={CHROME_URL_LT}>app.linkedgrow.ai/agents/saas-founders/leads</span></div>
                  <div className={VID}><V3Clip name="leads" label="The Leads tab, every lead linked to the post it came from" /></div></figure></div>
            </div>

            <div className={CAP}>
              <div>
                <span className={NUMPILL}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v11H8l-4 3z" /></svg>03 / 04</span>
                <h3 className={CAP_H3}>It writes from what they said, never from their headline</h3>
                <p className={CAP_P}>A profile visit and a genuine like first, so your name is not brand new when the invitation lands. Then one note built from their actual comment, one follow-up, and nothing at all after that.</p>
                <div className={TICK}>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Two messages maximum, for anybody, ever</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Read and edit tomorrow's queue tonight if you want</div>
                </div>
              </div>
              <div className={`crop relative ${RV}`}><span></span>
                <figure className={SCREEN_LT}><div className={CHROME_LT}><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><span className={CHROME_URL_LT}>app.linkedgrow.ai/agents/saas-founders/queue</span></div>
                  <div className={VID}><V3Clip name="queue" label="Tomorrow's messages, each written from what that person posted" /></div></figure></div>
            </div>

            <div className={CAP_ALT}>
              <div className={CAP_TXT_ALT}>
                <span className={NUMPILL}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v14H4z" /><path d="M4 8l8 5 8-5" /></svg>04 / 04</span>
                <h3 className={CAP_H3}>It brings you the answer, then stays out of the way</h3>
                <p className={CAP_P}>It answers for a few turns, reads what comes back, and closes a no thanks quietly without bothering you. The moment a thread turns into real interest it stops writing and emails you the person, their words and the messages that led there.</p>
                <div className={TICK}>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Every reply in one inbox, with the full thread attached</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Pushed straight into your CRM on the Business plan</div>
                </div>
              </div>
              <div className={`crop relative ${RV}`}><span></span>
                <figure className={SCREEN_LT}><div className={CHROME_LT}><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><span className={CHROME_URL_LT}>app.linkedgrow.ai/replies</span></div>
                  <div className={VID}><V3Clip name="replies" label="The Replies inbox, with the whole conversation attached" /></div></figure></div>
            </div>
          </div>
        </div>
      </section>
  );
}
