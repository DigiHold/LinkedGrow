"use client";

import { useEffect } from "react";
import { V3Clip } from "./clip";
import { YouTubePlayer } from "@/components/youtube-player";
import { initConstellation, initV3Landing } from "./landing-effects";
import { V3FaqAside, V3FaqList } from "./faq-section";
import { V3AgentJobsSection } from "./agent-jobs-section";
import { V3McpSection } from "./mcp-section";
import { V3Plans } from "./pricing-section";
import { V3_ROOT } from "./root";
import { V3UrlForm } from "./url-form";
import {
  ANN,
  AVS,
  BADGE,
  BADGES,
  CAP,
  CAPS,
  CAP_ALT,
  CAP_H3,
  CAP_P,
  CAP_TXT_ALT,
  CARVE,
  CHAT,
  MCLIP,
  CHIP,
  CHROME_DK,
  CHROME_DOT_DK,
  CHROME_DOT_LT,
  CHROME_LT,
  CHROME_URL_DK,
  CHROME_URL_LT,
  CIRCLED,
  EB,
  EB_DOT,
  EB_DOT_LT,
  EB_DOT_NIGHT,
  EB_LT,
  EB_NIGHT,
  EM_GRAD,
  EM_SH,
  EM_SKY,
  FAQWRAP,
  FILL,
  FILL_LG,
  FILL_LIGHT,
  FINALE,
  H1,
  H2,
  H3,
  HERO_FIELD,
  HERO_ORB_A,
  HERO_ORB_B,
  HERO_RINGS,
  LEAD,
  LEAD_MUT,
  MAPBOX,
  MAPHUD,
  MAPLEG,
  MAPSIDE,
  MAPWRAP,
  MCARD,
  MCARD_A,
  MCARD_B,
  MCARD_C,
  MCARD_D,
  MCARD_E,
  MCARD_WIDE,
  MCARD_FLIP,
  MCARD_H3,
  MCARD_P,
  MCP,
  MCPFOOT,
  MCPGRID,
  MRUN,
  MRUN_DOT,
  MSG,
  MSG_BAD,
  MSG_BD,
  MSG_GOOD,
  MSG_TG,
  MSG_TG_BAD,
  MSG_TG_GOOD,
  MSG_WHY,
  MTILE,
  NARROW,
  NIGHT,
  NOTE,
  NUMPILL,
  PFOOT,
  PH,
  PR,
  PSTAT,
  PSTAT_IC,
  PSTAT_IX,
  PSTAT_N,
  PSTAT_P,
  RAIL,
  RAILWRAP,
  REJ,
  RINGS_FIN,
  RULE_ON2,
  RV,
  RV_STATE,
  SC,
  SCREEN_DK,
  SCREEN_LT,
  SC_H3,
  SC_P,
  SEC,
  SFOOT,
  SH,
  SH_BUL,
  SH_BUL_WARM,
  SPOT,
  STAG,
  STAG_STATE,
  STEP,
  STEPS,
  STEP_H3,
  STEP_P,
  TICK,
  TR,
  TRUST,
  VID,
  WRAP,
  WSPLIT,
} from "./kit";


/**
 * The v3 landing page, ported from the approved prototype.
 *
 * The markup is the prototype's own. The styling is Tailwind: the palette and
 * the keyframes are theme tokens in globals.css, everything else is a utility
 * on the element it belongs to. Nothing here reads landing.css any more, and
 * the rendering is unchanged from the stylesheet version, measured property by
 * property rather than eyeballed.
 *
 * A handful of bare class names survive as selector hooks, never as styling:
 * `rv`, `stag`, `wsplit`, `crop`, `step`, `circled`, `seen`, `fill`, `vid`,
 * `q`, `a`, `on`, `open`, `w`. landing-effects.js queries those and toggles
 * them; the utilities beside them describe both states.
 */

export function V3Landing() {
  /* Two effects on purpose. The landing script is a dozen effects sharing one
     call, and the constellation used to sit at the bottom of it where a single
     early exit above left the canvas blank with nothing in the console. */
  useEffect(() => { try { return initV3Landing(); } catch (e) { console.error("landing effects failed", e); } }, []);
  useEffect(() => initConstellation(), []);

  return (
    /* The page content, as a main landmark. There was none anywhere in v2, so
       the only structural elements a crawler could see were a nav and a footer,
       with every section of actual content sitting in anonymous divs between
       them. Purely semantic: V3_ROOT keeps every class it had. */
    <main className={V3_ROOT}>



      {/*═══ 1. HÉROS ═══*/}
      <section className={HERO_FIELD}>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <span className={HERO_ORB_A}></span><span className={HERO_ORB_B}></span>
          <div className={HERO_RINGS}><i></i><i></i><i></i></div>
          <canvas id="net" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] h-full w-full"></canvas>
        </div>
        <div className={`${WRAP} relative z-[3] text-center`}>
          <span className={`${EB_LT} ${RV}`}><i className={EB_DOT_LT}></i>The LinkedIn AI agent for founders and sales teams</span>
          <h1 className={`${H1} ${WSPLIT} mx-auto mt-[26px] max-w-[21ch] text-balance text-white`} data-blur="3">Your agent finds your LinkedIn leads <em className={EM_SKY}>and starts the conversation</em></h1>
          <p className={`${LEAD} ${RV} mx-auto mt-6 max-w-[62ch] text-[rgba(255,255,255,.76)]`} style={{ "--d0": ".1s" } as React.CSSProperties}>LinkedGrow works out who actually buys from you, finds those exact people on LinkedIn, and opens a real conversation every working day. Lead generation on LinkedIn without the prospecting, the copy and paste, or the follow-up you forget. You show up when somebody answers.</p>
          <V3UrlForm className={`${RV} mt-9`} />
          <p className={`${RV} mt-[18px] font-v3-mono text-[12.5px] text-[rgba(255,255,255,.48)]`} style={{ "--d0": ".31s" } as React.CSSProperties}>Use any agent: OpenClaw / Hermes / Claude / ChatGPT / Codex / Cursor / Grok Bot</p>
          <div className={`${TR} ${RV} mt-[38px]`} style={{ "--d0": ".35s" } as React.CSSProperties}>
            <span className={AVS} aria-hidden="true">
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person1.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person2.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person3.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person4.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person5.avif" alt="" loading="lazy" />
            </span>
            <span><b>179+</b> founders already run their LinkedIn with LinkedGrow</span>
          </div>
        </div>
        <div className={`${WRAP} relative z-[3]`}>
          <div className="relative z-[4] mt-[clamp(44px,5.5vw,72px)]" id="hstage">
            <div className={`${ANN} left-[-166px] top-[13%]`}><div className={NOTE}>no template,<br />no "I saw your post"</div>
              <svg width="92" height="58" viewBox="0 0 92 58" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6c25 2 51 15 68 36" /><path d="M61 44l12 1-3-12" /></svg></div>
            <div className={`${ANN} right-[-164px] top-[52%]`}>
              <svg width="92" height="58" viewBox="0 0 92 58" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M89 8C63 12 35 25 21 48" /><path d="M32 46l-12 3 2-12" /></svg>
              <div className={`${NOTE} [transform:rotate(2.5deg)]`}>every lead shows you<br />the post it came from</div></div>
            <div className={`crop relative ${RV}`}><span></span>
              <figure className={SCREEN_DK}>
                <div className={CHROME_DK}><i className={CHROME_DOT_DK}></i><i className={CHROME_DOT_DK}></i><i className={CHROME_DOT_DK}></i><span className={CHROME_URL_DK}>app.linkedgrow.ai/agents/saas-founders</span></div>
                <div className={VID}>
                  <YouTubePlayer
                    videoId="1MVCdQZiN9I"
                    thumbnailUrl="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumb-agents.avif"
                    ctaText="Start your 7-day trial"
                    ctaHref="/sign-up"
                  />
                </div>
              </figure>
            </div>
          </div>
        </div>
        <div className={CARVE}></div>
      </section>

      {/*═══ 2. ÉNONCÉ ═══*/}
      <section className="pb-[20px] pt-[50px]">
        <div className={NARROW}><p className={`${WSPLIT} mx-auto max-w-[21ch] text-center font-v3-display! text-[clamp(28px,4.3vw,53px)] font-medium! leading-[1.13]! tracking-[-.04em]!`}>The bottleneck was never your product. It is that the right people <em className={EM_GRAD}>never heard of you.</em></p></div>
      </section>


      {/*═══ 3. PROBLÈME ═══*/}
      <section className={`${SEC} mt-[clamp(46px,5.5vw,74px)] border-y border-[#f0e6da] bg-v3-cream dark:border-[#2a1d18] dark:bg-v3-cream-d`} id="problem">
        <div className={WRAP}>
          <div className={`${SH} ${RV} max-w-[920px]`}><span className={SH_BUL_WARM}></span>
            <div><h2 className={`${H2} text-[#7b2419] dark:text-[#ffb9a4]`}>Outbound is broken, and everybody selling you a fix already knows it.</h2>
              <p className={`${LEAD} mt-[18px] text-[#6d5c52] dark:text-[#b8a396]`}>You are not short of tools. You are short of a system that finds the right person at the right moment and then says something worth answering.</p></div></div>
          <div className={`${STAG_STATE} mt-[50px] grid [grid-template-columns:repeat(4,1fr)] gap-[18px] max-[980px]:[grid-template-columns:repeat(2,1fr)] max-[520px]:[grid-template-columns:1fr]`}>
            <div className={PSTAT}><div className={PSTAT_IX}>01</div><div className={PSTAT_N}>1 in 50</div>
              <p className={PSTAT_P}>Cold invitations that lead anywhere, once the note is a template your prospect has already read forty times.</p>
              <div className={PSTAT_IC}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h16v11H8l-4 3z" /><path d="M9 10h6" /></svg></div></div>
            <div className={PSTAT}><div className={PSTAT_IX}>02</div><div className={PSTAT_N}>6 hrs</div>
              <p className={PSTAT_P}>Gone every week to searching, scrolling and copy-pasting, before a single conversation has actually started.</p>
              <div className={PSTAT_IC}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.5l3.5 2" /></svg></div></div>
            <div className={PSTAT}><div className={PSTAT_IX}>03</div><div className={PSTAT_N}>40%</div>
              <p className={PSTAT_P}>Of accounts on cloud outreach tools took a restriction last quarter, because volume was chosen over patience.</p>
              <div className={PSTAT_IC}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l8 3.5v5.5c0 4.5-3.2 8-8 9.5-4.8-1.5-8-5-8-9.5V6.5z" /><path d="M12 9v4M12 16v.01" /></svg></div></div>
            <div className={PSTAT}><div className={PSTAT_IX}>04</div><div className={PSTAT_N}>$48k</div>
              <p className={PSTAT_P}>A year for a junior rep who still needs a list, a script, a manager and eleven months before they pay for themselves.</p>
              <div className={PSTAT_IC}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5" /></svg></div></div>
          </div>
        </div>
      </section>


      {/*═══ 5. CAPACITÉS ═══*/}
      <V3AgentJobsSection />

      <div className={RULE_ON2}></div>

      {/*═══ 6. RAIL COLLANT ═══*/}
      <section className={`${SEC} border-b border-v3-line bg-v3-bg2 dark:border-v3-line-d dark:bg-v3-bg2-d`} id="setup">
        <div className={WRAP}>
          <div className={`${SH} ${RV} mb-[52px] max-w-[900px]`}><span className={SH_BUL}></span>
            <div><h2 className={H2}>Four minutes to set up. <em className={EM_SH}>First leads today.</em></h2>
              <p className={`${LEAD_MUT} mt-[18px]`}>Type your website. The agent takes it from there, from prospecting to the auto connect request, and you watch every step of it happening.</p></div></div>
          <div className={RAILWRAP}>
            <nav className={RAIL} id="rail">
              <a href="#s1" className="on">Connect<small>Your site and your account</small></a>
              <a href="#s2">Prospect<small>Sources, leads and scoring</small></a>
              <a href="#s3">Converse<small>Warm-up, messages and replies</small></a>
            </nav>
            <div className={STEPS}>
              <div className={STEP} id="s1">
                <span className={NUMPILL}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 15l6-6M8 12l-3 3a4 4 0 006 6l3-3M16 12l3-3a4 4 0 00-6-6l-3 3" /></svg>Step 01</span>
                <h3 className={STEP_H3}>Connect your LinkedIn account once</h3>
                <p className={STEP_P}>Your credentials are encrypted the moment they arrive, decrypted only inside the browser session that uses them, and never written to a log. The agent gets a dedicated residential address in your own country, and it keeps that same address for as long as the agent lives.</p>
                <div className={`crop relative ${RV}`}><span></span>
                  <figure className={SCREEN_LT}><div className={CHROME_LT}><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><span className={CHROME_URL_LT}>app.linkedgrow.ai/settings/linkedin</span></div>
                    <div className={VID}><V3Clip name="connect" label="A connected LinkedIn account with its own address and country" /></div></figure></div>
              </div>
              <div className={STEP} id="s2">
                <span className={NUMPILL}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></svg>Step 02</span>
                <h3 className={STEP_H3}>Choose where your buyers already gather</h3>
                <p className={STEP_P}>Competitor audiences, posts about the problem you solve, people who changed jobs in the last ninety days, or a search you write yourself. Pick as many sources as you like and the agent mines them every morning, deduplicating against everyone it has already contacted.</p>
                <div className={`crop relative ${RV}`}><span></span>
                  <figure className={SCREEN_LT}><div className={CHROME_LT}><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><span className={CHROME_URL_LT}>app.linkedgrow.ai/agents/saas-founders/sources</span></div>
                    <div className={VID}><V3Clip name="sources" label="The Sources tab, what each source found and what answered" /></div></figure></div>
              </div>
              <div className={STEP} id="s3">
                <span className={NUMPILL}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v11H8l-4 3z" /></svg>Step 03</span>
                <h3 className={STEP_H3}>Approve the tone, then let it work</h3>
                <p className={STEP_P}>Read the first messages it drafts, adjust the tone once, and switch the agent on. From there it holds working hours, raises its volume slowly across the first month, and emails you the moment somebody answers.</p>
                <div className={`crop relative ${RV}`}><span></span>
                  <figure className={SCREEN_LT}><div className={CHROME_LT}><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><i className={CHROME_DOT_LT}></i><span className={CHROME_URL_LT}>app.linkedgrow.ai/agents/saas-founders</span></div>
                    <div className={VID}><V3Clip name="running" label="The agent running, its sequence and its live activity" /></div></figure></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*═══ MCP ═══*/}
      <V3McpSection />

      {/*═══ 7. GARDE ANTI-SLOP ═══*/}
      <section className={SEC}>
        <div className={WRAP}>
          <div className={`${SH} ${RV} max-w-[920px]`}><span className={SH_BUL}></span>
            <div><h2 className={H2}>A message that sounds like AI <em className={EM_SH}>never leaves the building.</em></h2>
              <p className={`${LEAD_MUT} mt-[18px]`}>Before anything sends, a programmatic gate reads the draft and rejects it if it smells like a machine. Not a polite instruction inside a prompt, an actual gate. It fails, it gets rewritten, and after four attempts we skip the lead rather than send you something mediocre.</p></div></div>
          <div className={`${STAG} mt-11 grid [grid-template-columns:repeat(2,1fr)] gap-5 max-[880px]:[grid-template-columns:1fr]`}>
            <div className={`${MSG} ${MSG_BAD}`}>
              <span className={`${MSG_TG} ${MSG_TG_BAD}`}>Rejected by the gate</span>
              <div className={MSG_BD}>Hi Sarah, <s>I saw your post</s> about outreach and it really <s>resonated</s>. <s>I'd love to connect</s> and <s>leverage</s> our shared interest in <s>the LinkedIn automation space</s> to <s>explore synergies</s>.</div>
              <div className={REJ}><span>generic opener</span><span>banned: resonated</span><span>banned: leverage</span>
                <span>headline parroting</span><span>no real signal</span></div>
              <div className={MSG_WHY}>Every tool on the market sends this exact shape. Your prospect deleted four of them this week without finishing the first line.</div>
            </div>
            <div className={`${MSG} ${MSG_GOOD}`}>
              <span className={`${MSG_TG} ${MSG_TG_GOOD}`}>Passed, and sent</span>
              <div className={MSG_BD}>Hi Sarah, your line about templates being the reason people stopped answering is the thing I keep arguing about. We went the other way and write from the comment rather than the headline. Curious how you handle it at Northline.<br /><br />Nicolas</div>
              <div className={MSG_WHY}>Built from her actual comment. No product name, no link, no pitch anywhere in it. That is the whole reason it gets an answer.</div>
            </div>
          </div>
        </div>
      </section>

      {/*═══ 8. LE CERVEAU ═══*/}
      <section className={`${SEC} ${NIGHT} v3-night`} id="brain">
        <span className={SPOT} id="spot"></span>
        <div className={WRAP}>
          <div className={`${RV} relative z-[1] mb-[46px] max-w-[840px]`}>
            <span className={EB_NIGHT}><i className={EB_DOT_NIGHT}></i>It teaches itself who your buyers are</span>
            <h2 className={`${H2} mt-5 text-white`}>Every reply makes it better at <em className={EM_SKY}>finding the next one.</em></h2>
            <p className={`${LEAD} mt-[18px] text-[#93a7c5]`}>Your agent starts from one description of your buyer and nothing else. Then it watches what comes back, and it rewrites its own hunting ground around the answer: what produces buyers earns more of the day and grows new searches of its own, what stays quiet gets dropped. You change nothing, and it is sharper every week than it was the week before.</p>
          </div>

          <div className={MAPWRAP}>
            <div className={`${MAPBOX} ${RV_STATE}`}>
              <canvas id="constellation" aria-hidden="true"></canvas>
              <div className={MAPHUD}>THE BRANCHES WERE WRITTEN<br />BY THE AGENT ITSELF</div>
              <div className={MAPLEG}>
                <span><i className="bg-[#2ec8ea]"></i>PRODUCING BUYERS</span>
                <span><i className="bg-[#6a9bff]"></i>GROWN FROM A WINNER</span>
                <span><i className="bg-[#3a4658]"></i>WITHERED, DROPPED</span>
              </div>
            </div>
            <div className={MAPSIDE}>
              <div className={`${SC} ${RV_STATE}`}>
                <h3 className={SC_H3}>It learns who actually answers</h3>
                <p className={SC_P}>Every accepted invitation and every reply tells the agent something about your buyer that your description never did. That picture gets sharper each week, and the searches it runs tomorrow morning come from the sharper one.</p>
              </div>
              <div className={`${SC} ${RV_STATE}`}>
                <h3 className={SC_H3}>It writes its own searches</h3>
                <p className={SC_P}>When a place works, the agent reads how those people describe themselves and opens new ground aimed at more of them. By month 2 most of what it hunts was never typed by anybody.</p>
              </div>
              <div className={`${SC} ${RV_STATE}`}>
                <h3 className={SC_H3}>It kills its own dead ends</h3>
                <p className={SC_P}>Ground that keeps coming back empty is switched off with the reason beside it, so your day keeps moving toward the people who reply. Nothing disappears without you being able to overrule it.</p>
              </div>
            </div>
          </div>

          <p className={`${SFOOT} ${RV}`}>On the first morning this map is a single point: the audience you described in the setup. Everything else on it was put there by real people who accepted, replied, or read your message and stayed silent.</p>
        </div>
      </section>

      {/*═══ 9. CONFIANCE ═══*/}
      <div className={TRUST}>
        <div className={WRAP}>
          <div className={`${BADGES} ${RV}`}>
            <span className={BADGE}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l8 3.5v5.5c0 4.5-3.2 8-8 9.5-4.8-1.5-8-5-8-9.5V6.5z" /><path d="M9 12l2 2 4-4.5" /></svg>Credentials encrypted with AES-256-GCM</span>
            <span className={BADGE}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>Decrypted in memory only, never logged</span>
            <span className={BADGE}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 000 18M12 3a15 15 0 010 18" /></svg>Hosted in the EU, GDPR by design</span>
          </div>
          <p className="text-[14.5px] text-v3-mut dark:text-v3-mut-d">Your LinkedIn login is the most valuable thing you hand us, and it is treated that way.</p>
        </div>
      </div>

      {/*═══ 10. ÉNONCÉ 2 ═══*/}
      <section className="py-[clamp(88px,11.5vw,164px)]">
        <div className={NARROW}><p className={`${WSPLIT} mx-auto max-w-[21ch] text-center font-v3-display! text-[clamp(28px,4.3vw,53px)] font-medium! leading-[1.13]! tracking-[-.04em]!`}>The people who need you are already saying so in public. They are <em className={EM_GRAD}>just not saying it to you.</em></p></div>
      </section>

      {/*═══ 11. TARIFS ═══*/}
      <V3Plans />

      {/*═══ 12. FAQ ═══*/}
      <section className={SEC}>
        <div className={WRAP}>
          <div className={FAQWRAP}>
            <V3FaqAside />
            <V3FaqList />
          </div>
        </div>
      </section>

      {/*═══ 13. CTA FINAL ═══*/}
      <section className={`${SEC} pt-0`}>
        <div className={WRAP}><div className={`${FINALE} ${RV}`}>
          <div className={RINGS_FIN}><i></i><i></i><i></i></div>
          <div className="relative z-[2] flex flex-col items-center">
            <span className={EB_LT}><i className={EB_DOT_LT}></i>Twenty seconds, everything included</span>
            <h2 className={`${H2} mt-[22px] text-white`}>See your buyers before<br />you spend anything.</h2>
            <p className="mx-auto mt-[18px] max-w-[52ch] text-[rgba(255,255,255,.74)]">Type your website. LinkedGrow comes back with your ideal customer, the competitors who share your audience, and the first real people worth talking to.</p>
            <V3UrlForm className="mt-8 w-full" />
            <div className={`${TR} mt-[30px]`}>
              <span className={AVS} aria-hidden="true">
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person1.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person2.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person3.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person4.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person5.avif" alt="" loading="lazy" />
              </span>
              <span><b>179+</b> founders already run their LinkedIn with LinkedGrow</span>
            </div>
          </div>
        </div></div>
      </section>

      {/*═══ FOOTER ═══*/}

    </main>
  );
}
