"use client";

import { useEffect } from "react";
import { initV3Landing } from "./landing-effects";
import "./landing.css";

/**
 * The v3 landing page, ported from the approved prototype.
 *
 * The markup is the prototype's own, converted to JSX and otherwise untouched.
 * The stylesheet beside it is the prototype's own CSS with every selector
 * scoped under .v3, and the behaviour is its own script. Nothing here was
 * re-derived, because the last attempt re-derived it and produced a page that
 * merely resembled the design.
 *
 * Generated. To change it, change the prototype and re-run the port.
 */
export function V3Landing() {
  useEffect(() => initV3Landing(), []);

  return (
    <div className="v3">



      {/*═══ 1. HÉROS ═══*/}
      <section className="hero">
        <div className="herobg">
          <span className="orb a"></span><span className="orb b"></span>
          <div className="rings"><i></i><i></i><i></i></div>
          <canvas id="net" aria-hidden="true"></canvas>
        </div>
        <div className="wrap center">
          <span className="eb lt rv"><i></i>The LinkedIn agent for founders and sales teams</span>
          <h1 className="wsplit" data-blur="3">Your agent finds your buyers<br /><em>and starts the conversation.</em></h1>
          <p className="lead rv" style={{ "--d0": ".1s" } as React.CSSProperties}>Enter your website. LinkedGrow works out who actually buys from you, finds those exact people on LinkedIn, and opens a real conversation every working day. You show up when somebody answers.</p>
          <form className="urlwrap rv" style={{ "--d0": ".2s" } as React.CSSProperties} onSubmit={(e) => e.preventDefault()}>
            <div className="urlbar">
              <span className="proto">https://</span>
              <input type="text" placeholder="yourcompany.com" aria-label="Your website" />
              <button className="fill" type="submit">Launch my agent for free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
            </div>
          </form>
          <p className="urlnote rv" style={{ "--d0": ".28s" } as React.CSSProperties}><b>7-day free trial</b> on the Pro plan · Cancel any time · Dedicated IP and AI included</p>
          <div className="tr rv" style={{ "--d0": ".35s" } as React.CSSProperties}>
            <span className="avs" aria-hidden="true">
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person1.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person2.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person3.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person4.avif" alt="" loading="lazy" />
              <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person5.avif" alt="" loading="lazy" />
            </span>
            <span><b className="num">179+</b> founders already run their LinkedIn with LinkedGrow</span>
          </div>
        </div>
        <div className="wrap">
          <div className="hstage" id="hstage">
            <div className="ann a"><div className="note">no template,<br />no "I saw your post"</div>
              <svg width="92" height="58" viewBox="0 0 92 58" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6c25 2 51 15 68 36" /><path d="M61 44l12 1-3-12" /></svg></div>
            <div className="ann b">
              <svg width="92" height="58" viewBox="0 0 92 58" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M89 8C63 12 35 25 21 48" /><path d="M32 46l-12 3 2-12" /></svg>
              <div className="note r">every lead shows you<br />the post it came from</div></div>
            <div className="crop lt rv"><span className="cr"></span>
              <figure className="screen">
                <div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/agents/saas-founders</span></div>
                <div className="vid">
                  <video autoPlay muted loop playsInline></video>
                  <div className="ph">
                    <span className="mk"><svg><use href="#mark" /></svg></span>
                    <small>Video 01</small>
                    <b>Agent overview, the funnel filling in real time</b>
                    <span className="chip">1920 × 1080 · silent loop · around 18 seconds</span>
                  </div>
                </div>
              </figure>
            </div>
          </div>
        </div>
        <div className="carve"></div>
      </section>

      {/*═══ 2. LOGOS ═══*/}
      <section style={{ padding: "clamp(46px,5.5vw,74px) 0 0" }}>
        <div className="wrap">
          <p className="center mono rv" style={{ color: "var(--faint)", marginBottom: "24px" }}>Founders who stopped doing outbound by hand</p>
          <div className="cells rv">
            <div className="cl"><b>Northline</b></div><div className="cl"><b>Havre Studio</b></div>
            <div className="cl"><b>Atelier Kea</b></div><div className="cl"><b>Velio</b></div>
            <div className="cl"><b>Tidewell</b></div><div className="cl"><b>Disruptica</b></div>
          </div>
        </div>
      </section>


      {/*═══ 3. PROBLÈME ═══*/}
      <section className="sec problem" id="problem" style={{ marginTop: "clamp(46px,5.5vw,74px)" }}>
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "920px" }}><span className="bul warm"></span>
            <div><h2>Outbound is broken, and everybody selling you a fix already knows it.</h2>
              <p className="lead" style={{ marginTop: "18px" }}>You are not short of tools. You are short of a system that finds the right person at the right moment and then says something worth answering.</p></div></div>
          <div className="pstats stag">
            <div className="pstat"><div className="ix">01</div><div className="n">1 in 50</div>
              <p>Cold invitations that lead anywhere, once the note is a template your prospect has already read forty times.</p>
              <div className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h16v11H8l-4 3z" /><path d="M9 10h6" /></svg></div></div>
            <div className="pstat"><div className="ix">02</div><div className="n">6 hrs</div>
              <p>Gone every week to searching, scrolling and copy-pasting, before a single conversation has actually started.</p>
              <div className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.5l3.5 2" /></svg></div></div>
            <div className="pstat"><div className="ix">03</div><div className="n">40%</div>
              <p>Of accounts on cloud outreach tools took a restriction last quarter, because volume was chosen over patience.</p>
              <div className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l8 3.5v5.5c0 4.5-3.2 8-8 9.5-4.8-1.5-8-5-8-9.5V6.5z" /><path d="M12 9v4M12 16v.01" /></svg></div></div>
            <div className="pstat"><div className="ix">04</div><div className="n">$48k</div>
              <p>A year for a junior rep who still needs a list, a script, a manager and eleven months before they pay for themselves.</p>
              <div className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5" /></svg></div></div>
          </div>
        </div>
      </section>

      {/*═══ 4. ÉNONCÉ ═══*/}
      <section className="statement">
        <div className="narrow"><p className="wsplit">The bottleneck was never your product. It is that the right people <em>never heard of you.</em></p></div>
      </section>
      <div className="rule"></div>

      {/*═══ 5. CAPACITÉS ═══*/}
      <section className="sec" id="agent">
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "900px", marginBottom: "46px" }}><span className="bul"></span>
            <div><h2>Four jobs it does every day, <em>without being asked.</em></h2>
              <p className="lead" style={{ marginTop: "18px" }}>Set it up in four minutes, then it runs by itself inside working hours, at the pace of a careful person who genuinely wants the reply.</p></div></div>

          <div className="caps rv">
            <div className="cap">
              <div className="txt">
                <span className="numpill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></svg>01 / 04</span>
                <h3>It works out who your buyers actually are</h3>
                <p>It reads your website, names your ideal customer in plain language, lists the competitors who share your audience, and shows you the whole thing before it touches LinkedIn.</p>
                <div className="tick">
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Editable in one screen, so you can correct it</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Country, job title, company size and language</div>
                </div>
              </div>
              <div className="crop rv"><span className="cr"></span>
                <figure className="screen lt"><div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/agents/new</span></div>
                  <div className="vid"><video autoPlay muted loop playsInline></video>
                    <div className="ph"><span className="mk"><svg><use href="#mark" /></svg></span><small>Video 02</small>
                      <b>Wizard, website scan to ideal customer in twenty seconds</b>
                      <span className="chip">steps 1 and 2 of the creation wizard</span></div></div></figure></div>
            </div>

            <div className="cap">
              <div className="txt">
                <span className="numpill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h10M4 18h6" /></svg>02 / 04</span>
                <h3>It finds those people, with the receipt attached</h3>
                <p>Anyone engaging with your competitors, asking about your problem out loud, or who just landed a role where they choose the tools. Every lead links to the exact post it came from, so you can read their real words before you say anything.</p>
                <div className="tick">
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Scored against your ideal customer, sorted by fit</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Nobody is ever contacted twice by two of your agents</div>
                </div>
              </div>
              <div className="crop rv"><span className="cr"></span>
                <figure className="screen lt"><div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/agents/saas-founders/leads</span></div>
                  <div className="vid"><video autoPlay muted loop playsInline></video>
                    <div className="ph"><span className="mk"><svg><use href="#mark" /></svg></span><small>Video 03</small>
                      <b>Leads tab, clicking through to the source post</b>
                      <span className="chip">show the hover state and the outbound link</span></div></div></figure></div>
            </div>

            <div className="cap">
              <div className="txt">
                <span className="numpill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v11H8l-4 3z" /></svg>03 / 04</span>
                <h3>It writes from what they said, never from their headline</h3>
                <p>A profile visit and a genuine like first, so your name is not brand new when the invitation lands. Then one note built from their actual comment, one follow-up, and nothing at all after that.</p>
                <div className="tick">
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Two messages maximum, for anybody, ever</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Read and edit tomorrow's queue tonight if you want</div>
                </div>
              </div>
              <div className="crop rv"><span className="cr"></span>
                <figure className="screen lt"><div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/agents/saas-founders/queue</span></div>
                  <div className="vid"><video autoPlay muted loop playsInline></video>
                    <div className="ph"><span className="mk"><svg><use href="#mark" /></svg></span><small>Video 04</small>
                      <b>Today's queue, editing a message before it sends</b>
                      <span className="chip">type an edit then save, so it feels controllable</span></div></div></figure></div>
            </div>

            <div className="cap">
              <div className="txt">
                <span className="numpill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v14H4z" /><path d="M4 8l8 5 8-5" /></svg>04 / 04</span>
                <h3>It brings you the answer, then stays out of the way</h3>
                <p>A reply is detected, the agent goes permanently silent for that person, and an email reaches you within the minute with their message and yours side by side. No automation ever speaks over you.</p>
                <div className="tick">
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Every reply in one inbox, with the full thread attached</div>
                  <div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>Pushed straight into your CRM on the Business plan</div>
                </div>
              </div>
              <div className="crop rv"><span className="cr"></span>
                <figure className="screen lt"><div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/replies</span></div>
                  <div className="vid"><video autoPlay muted loop playsInline></video>
                    <div className="ph"><span className="mk"><svg><use href="#mark" /></svg></span><small>Video 05</small>
                      <b>Replies page, a new answer arriving live</b>
                      <span className="chip">open one thread to show the context</span></div></div></figure></div>
            </div>
          </div>
        </div>
      </section>

      <div className="rule on2"></div>

      {/*═══ 6. RAIL COLLANT ═══*/}
      <section className="sec" id="setup" style={{ background: "var(--bg2)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "900px", marginBottom: "52px" }}><span className="bul"></span>
            <div><h2>Four minutes to set up. <em>First leads today.</em></h2>
              <p className="lead" style={{ marginTop: "18px" }}>Type your website. The agent takes it from there, and you get to watch every step of it happening.</p></div></div>
          <div className="railwrap">
            <nav className="rail" id="rail">
              <a href="#s1" className="on">Connect<small>Your site and your account</small></a>
              <a href="#s2">Prospect<small>Sources, leads and scoring</small></a>
              <a href="#s3">Converse<small>Warm-up, messages and replies</small></a>
            </nav>
            <div className="steps">
              <div className="step" id="s1">
                <span className="numpill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 15l6-6M8 12l-3 3a4 4 0 006 6l3-3M16 12l3-3a4 4 0 00-6-6l-3 3" /></svg>Step 01</span>
                <h3>Connect your LinkedIn account once</h3>
                <p>Your credentials are encrypted the moment they arrive, decrypted only inside the browser session that uses them, and never written to a log. The agent gets a dedicated residential address in your own country, and it keeps that same address for as long as the agent lives.</p>
                <div className="crop rv"><span className="cr"></span>
                  <figure className="screen lt"><div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/settings/linkedin</span></div>
                    <div className="vid"><video autoPlay muted loop playsInline></video>
                      <div className="ph"><span className="mk"><svg><use href="#mark" /></svg></span><small>Video 06</small>
                        <b>Connecting an account, profile and IP confirmed</b>
                        <span className="chip">end on the green connected state</span></div></div></figure></div>
              </div>
              <div className="step" id="s2">
                <span className="numpill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></svg>Step 02</span>
                <h3>Choose where your buyers already gather</h3>
                <p>Competitor audiences, posts about the problem you solve, people who changed jobs in the last ninety days, or a search you write yourself. Pick as many sources as you like and the agent mines them every morning, deduplicating against everyone it has already contacted.</p>
                <div className="crop rv"><span className="cr"></span>
                  <figure className="screen lt"><div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/agents/saas-founders/sources</span></div>
                    <div className="vid"><video autoPlay muted loop playsInline></video>
                      <div className="ph"><span className="mk"><svg><use href="#mark" /></svg></span><small>Video 07</small>
                        <b>Sources tab, adding a competitor and mining it</b>
                        <span className="chip">the counter climbing as leads arrive</span></div></div></figure></div>
              </div>
              <div className="step" id="s3">
                <span className="numpill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v11H8l-4 3z" /></svg>Step 03</span>
                <h3>Approve the tone, then let it work</h3>
                <p>Read the first messages it drafts, adjust the tone once, and switch the agent on. From there it holds working hours, raises its volume slowly across the first month, and emails you the moment somebody answers.</p>
                <div className="crop rv"><span className="cr"></span>
                  <figure className="screen lt"><div className="chrome"><i></i><i></i><i></i><span>app.linkedgrow.ai/agents/saas-founders</span></div>
                    <div className="vid"><video autoPlay muted loop playsInline></video>
                      <div className="ph"><span className="mk"><svg><use href="#mark" /></svg></span><small>Video 08</small>
                        <b>Switching the agent on, running indicator</b>
                        <span className="chip">the activity log filling underneath</span></div></div></figure></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*═══ MCP ═══*/}
      <section className="sec mcp" id="mcp">
        <div className="wrap">
          <div className="mcphead rv">
            <span className="eb"><i></i>Works inside the assistant you already use</span>
            <h2 style={{ marginTop: "22px" }}>Power Your Content<br />with <span className="circled">AI</span> and automation</h2>
            <p className="lead" style={{ marginTop: "18px" }}>LinkedGrow speaks MCP, so an assistant can drive it directly. Ask for your warmest leads, have next week's posts written, schedule them across the days you want. One URL to connect, no code, about two minutes.</p>
          </div>

          <div className="mcpgrid">
            <div className="mcard a rv">
              <span className="mtile"><svg viewBox="0 0 24 24"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg></span>
              <h3>Via ChatGPT</h3>
              <p>Find the people worth talking to and draft the messages, without leaving the chat you already have open.</p>
              <div className="chat">
                <div className="chathead"><span className="av"><svg viewBox="0 0 24 24"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg></span>
                  <span><b>ChatGPT</b><small>LinkedGrow connected</small></span></div>
                <div className="chatbody">
                  <div className="bub me">Show me the 10 warmest leads my agent found this week and draft a reply for each</div>
                  <div className="bub it">Ten leads, sorted by match. <b>Sarah Chen</b> is the strongest: she commented on a post about outreach templates two days ago. Drafts are ready for you to read.</div>
                </div>
                <div className="mrun"><i></i>read only · nothing is sent without you</div>
              </div>
            </div>

            <div className="mcard b flip rv">
              <span className="mtile"><svg viewBox="0 0 120 120"><defs>
          <linearGradient id="oc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>
        {/*Body*/}
        <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#oc-grad)" />
        {/*Left Claw*/}
        <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#oc-grad)" />
        {/*Right Claw*/}
        <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#oc-grad)" />
        {/*Antenna*/}
        <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
        <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
        {/*Eyes*/}
        <circle cx="45" cy="35" r="6" fill="#050810" />
        <circle cx="75" cy="35" r="6" fill="#050810" />
        <circle cx="46" cy="34" r="2.5" fill="#00e5cc" />
        <circle cx="76" cy="34" r="2.5" fill="#00e5cc" /></svg></span>
              <h3>Via OpenClaw</h3>
              <p>Run it from the agent platform you already automate with, on your own schedule, with no browser open at all.</p>
              <div className="chat">
                <div className="chathead"><span className="av"><svg viewBox="0 0 120 120"><defs>
          <linearGradient id="oc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>
        {/*Body*/}
        <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#oc-grad)" />
        {/*Left Claw*/}
        <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#oc-grad)" />
        {/*Right Claw*/}
        <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#oc-grad)" />
        {/*Antenna*/}
        <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
        <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
        {/*Eyes*/}
        <circle cx="45" cy="35" r="6" fill="#050810" />
        <circle cx="75" cy="35" r="6" fill="#050810" />
        <circle cx="46" cy="34" r="2.5" fill="#00e5cc" />
        <circle cx="76" cy="34" r="2.5" fill="#00e5cc" /></svg></span>
                  <span><b>OpenClaw Agent</b><small>bot</small></span></div>
                <div className="chatbody">
                  <div className="bub me">Every Monday at 8, write my week's posts and schedule them from the 1st to the 6th</div>
                  <div className="bub it">Scheduled. Six posts drafted in your voice, one a day, avoiding the morning you already have something booked.</div>
                </div>
                <div className="mrun"><i></i>runs on a cron · you approve before anything publishes</div>
              </div>
            </div>

            <div className="mcard c flip rv">
              <span className="mtile"><svg viewBox="0 0 24 24"><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" /></svg></span>
              <h3>Via Claude Code</h3>
              <p>Query your pipeline the way you query anything else. Ask a question in plain language, get the real numbers back.</p>
              <div className="chat">
                <div className="chathead"><span className="av"><svg viewBox="0 0 24 24"><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" /></svg></span>
                  <span><b>Claude Code</b><small>linkedgrow mcp</small></span></div>
                <div className="chatbody">
                  <div className="bub me">Which job titles replied most this month, and what did they have in common?</div>
                  <div className="bub it">Heads of Growth and founders under 20 staff. <b>Nine of the eleven replies</b> came from people the agent found on competitor posts rather than on keywords.</div>
                </div>
                <div className="mrun"><i></i>your workspace only · scoped by your API key</div>
              </div>
            </div>

            <div className="mcard d rv">
              <span className="mtile hermes"><svg viewBox="0 0 192 200"><g transform="matrix(1,0,0,1,-8.314363,-0.003091)"><g transform="matrix(8.333333,0,0,8.333333,0,0)"><path d="M5.938,12.835C6.065,12.796 6.223,12.855 6.311,12.978C6.339,13.016 6.347,13.07 6.357,13.118C6.36,13.132 6.337,13.151 6.317,13.168C6.193,13.07 6.077,12.974 5.963,12.877C5.952,12.867 5.947,12.85 5.938,12.835ZM8.396,9.412C8.591,9.38 8.786,9.352 8.984,9.362C9.034,9.364 9.084,9.372 9.132,9.388C9.334,9.459 9.534,9.535 9.733,9.612C9.761,9.622 9.783,9.648 9.808,9.667L9.795,9.694C9.708,9.666 9.621,9.636 9.535,9.605C9.42,9.567 9.322,9.528 9.22,9.507C8.97,9.457 8.97,9.461 8.928,9.493L9.502,9.637C9.777,9.776 10.052,9.913 10.325,10.054C10.367,10.076 10.415,10.111 10.432,10.152C10.458,10.212 10.495,10.228 10.549,10.224C10.615,10.218 10.681,10.207 10.762,10.197L10.722,10.283C10.773,10.363 10.864,10.303 10.938,10.347C10.864,10.477 10.691,10.437 10.604,10.546L10.665,10.62L10.545,10.707C10.545,10.813 10.507,10.875 10.239,10.95L10.265,11.035L10.069,11.077L10.139,11.201L9.889,11.201L9.882,11.338C9.801,11.328 9.721,11.32 9.638,11.311L9.585,11.434C9.558,11.426 9.533,11.423 9.512,11.411C9.445,11.373 9.384,11.355 9.317,11.417C9.298,11.434 9.254,11.431 9.224,11.425C9.198,11.419 9.174,11.396 9.154,11.383C9.044,11.478 9.044,11.478 8.946,11.386C8.889,11.432 8.826,11.46 8.76,11.397C8.697,11.424 8.637,11.377 8.582,11.383C8.512,11.39 8.485,11.348 8.449,11.313L8.319,11.346C8.306,11.11 8.125,11.156 7.979,11.143C7.984,11.071 8.029,11.051 8.074,11.049C8.128,11.047 8.182,11.055 8.233,11.071C8.397,11.121 8.553,11.191 8.729,11.209C8.932,11.23 9.134,11.238 9.33,11.194C9.595,11.135 9.85,11.045 10.037,10.829C10.086,10.773 10.12,10.702 10.154,10.634C10.173,10.596 10.174,10.55 10.134,10.518C10.019,10.426 9.89,10.353 9.752,10.301C9.776,10.421 9.721,10.483 9.637,10.522C9.637,10.536 9.633,10.547 9.637,10.552C9.717,10.667 9.721,10.712 9.63,10.819C9.565,10.897 9.492,10.968 9.412,11.03C9.219,11.181 8.939,11.159 8.771,10.98C8.723,10.933 8.679,10.882 8.638,10.828C8.56,10.721 8.562,10.72 8.605,10.592C8.44,10.512 8.477,10.366 8.501,10.228C8.509,10.178 8.529,10.132 8.55,10.065C8.51,10.079 8.483,10.082 8.463,10.097C8.327,10.185 8.218,10.309 8.147,10.454C8.14,10.47 8.137,10.488 8.127,10.501C8.115,10.516 8.093,10.539 8.082,10.536C8.062,10.53 8.045,10.509 8.032,10.491C8.024,10.479 8.025,10.459 8.02,10.434L7.894,10.434L7.947,10.262C7.934,10.246 7.921,10.229 7.908,10.213L8.018,9.929C7.958,9.955 7.927,9.973 7.894,9.98C7.864,9.987 7.83,9.98 7.799,9.98C7.799,9.949 7.789,9.91 7.803,9.888C7.952,9.668 8.108,9.46 8.396,9.412Z" style={{ fill: "white" }} /></g><g transform="matrix(8.333333,0,0,8.333333,0,0)"><path d="M8.06,10.788C8.057,10.75 8.056,10.713 8.097,10.726C8.113,10.732 8.131,10.774 8.125,10.793C8.115,10.833 8.087,10.825 8.061,10.788L8.06,10.788Z" style={{ fill: "white" }} /></g><g transform="matrix(8.333333,0,0,8.333333,0,0)"><path d="M11.981,0.009C12.207,-0.003 12.434,-0.002 12.66,0.009C12.907,0.019 13.155,0.033 13.4,0.071C13.801,0.135 14.198,0.228 14.59,0.344C15.053,0.482 15.51,0.643 15.946,0.855C17.153,1.448 18.173,2.362 18.894,3.497C19.186,3.966 19.43,4.46 19.633,4.976C19.852,5.532 20.079,6.086 20.256,6.659C20.46,7.313 20.585,7.985 20.714,8.656C20.811,9.16 20.896,9.666 21.004,10.167C21.16,10.889 21.333,11.607 21.498,12.327C21.684,13.139 21.898,13.942 22.128,14.742C22.23,15.097 22.321,15.455 22.41,15.814C22.52,16.25 22.612,16.69 22.664,17.137C22.695,17.415 22.73,17.694 22.737,17.974C22.748,18.267 22.743,18.561 22.72,18.854C22.683,19.267 22.62,19.672 22.494,20.066C22.296,20.669 21.985,21.228 21.579,21.715L21.449,21.871L21.467,21.894C21.51,21.871 21.555,21.853 21.594,21.826C21.794,21.688 21.967,21.519 22.125,21.336C22.525,20.876 22.846,20.363 23.1,19.807C23.349,19.269 23.46,18.678 23.425,18.087C23.401,17.663 23.328,17.253 23.125,16.874C23.112,16.847 23.11,16.814 23.095,16.753C23.145,16.788 23.177,16.801 23.196,16.825C23.303,16.955 23.416,17.083 23.511,17.223C23.841,17.717 23.971,18.275 23.997,18.863C24.024,19.55 23.861,20.232 23.527,20.833C23.167,21.488 22.64,21.973 22.001,22.339C21.808,22.45 21.607,22.549 21.406,22.647C21.249,22.725 21.158,22.858 21.088,23.012C21.022,23.137 21.011,23.284 21.055,23.418C21.068,23.463 21.073,23.51 21.068,23.557C21.063,23.634 20.991,23.712 20.928,23.719C20.874,23.725 20.803,23.676 20.778,23.603C20.75,23.528 20.73,23.449 20.718,23.37C20.678,23.056 20.563,22.77 20.41,22.5C20.214,22.162 19.968,21.855 19.68,21.59C19.429,21.344 19.121,21.164 18.783,21.066C18.557,21.003 18.325,20.959 18.091,20.935C18.016,20.927 17.941,20.895 17.871,20.945C18.051,21.005 18.234,21.055 18.409,21.125C18.843,21.298 19.229,21.555 19.589,21.853C19.897,22.108 20.169,22.396 20.383,22.737C20.481,22.892 20.569,23.052 20.61,23.233C20.637,23.356 20.652,23.483 20.677,23.608C20.69,23.67 20.675,23.717 20.624,23.752C20.577,23.785 20.502,23.786 20.461,23.742C20.426,23.7 20.399,23.653 20.381,23.602C20.351,23.529 20.343,23.443 20.303,23.377C19.915,22.754 19.435,22.193 18.88,21.713C18.72,21.576 18.551,21.453 18.343,21.39C17.967,21.276 17.59,21.187 17.193,21.236C16.98,21.261 16.766,21.268 16.553,21.289C16.288,21.319 16.035,21.415 15.817,21.567C15.514,21.776 15.234,22.018 14.983,22.287C14.654,22.629 14.341,22.986 14.028,23.342C13.892,23.497 13.764,23.661 13.714,23.873C13.71,23.89 13.706,23.907 13.702,23.924C13.693,23.967 13.656,23.998 13.612,24L13.302,24C13.256,24 13.22,23.952 13.23,23.906C13.253,23.798 13.275,23.69 13.3,23.582C13.375,23.257 13.49,22.947 13.668,22.665C13.692,22.626 13.708,22.577 13.772,22.585L13.782,22.634L13.809,22.711C14.089,22.276 14.38,21.877 14.805,21.576C15.088,21.372 15.389,21.198 15.695,21.026C15.663,21.017 15.629,21.016 15.597,21.024C15.435,21.067 15.272,21.108 15.112,21.158C14.71,21.282 14.348,21.488 14.002,21.724C13.855,21.824 13.704,21.917 13.588,22.057C13.15,22.592 12.789,23.187 12.518,23.824C12.502,23.863 12.488,23.903 12.478,23.944C12.469,23.977 12.44,24 12.406,24L11.912,24C11.872,24 11.85,23.949 11.876,23.918C11.999,23.778 12.122,23.636 12.253,23.503C12.528,23.222 12.833,22.971 13.03,22.619C13.057,22.571 13.093,22.529 13.125,22.484C13.363,22.151 13.665,21.877 13.943,21.582C14.025,21.496 14.118,21.422 14.203,21.342C14.232,21.315 14.256,21.285 14.282,21.257L14.264,21.232L14.129,21.273C14.095,21.29 14.059,21.304 14.027,21.323C13.779,21.467 13.533,21.615 13.284,21.756C12.876,21.986 12.459,22.195 12.075,22.467C11.794,22.667 11.484,22.825 11.186,23C11.166,23.012 11.142,23.015 11.106,23.028C11.091,22.893 11.249,22.827 11.214,22.692C11.181,22.706 11.15,22.712 11.129,22.73C11.018,22.826 10.902,22.92 10.801,23.026C10.653,23.183 10.517,23.351 10.376,23.514C10.251,23.657 10.126,23.8 10.003,23.945C9.975,23.979 9.934,23.999 9.89,24L8.762,24C8.768,23.986 8.774,23.972 8.778,23.958C8.806,23.868 8.863,23.786 8.861,23.678C8.77,23.66 8.699,23.679 8.649,23.755C8.602,23.825 8.556,23.897 8.513,23.97C8.503,23.986 8.489,24 8.471,24L8.378,24C8.359,24 8.349,23.978 8.361,23.963C8.432,23.875 8.501,23.785 8.57,23.695C8.571,23.693 8.564,23.683 8.558,23.671C8.544,23.675 8.528,23.677 8.513,23.684C8.337,23.774 8.161,23.865 7.986,23.958C7.934,23.985 7.877,24 7.818,24L5.202,24C5.176,24 5.163,23.964 5.183,23.947C5.393,23.769 5.585,23.573 5.741,23.342C6.076,22.846 6.279,22.295 6.408,21.713C6.412,21.693 6.405,21.67 6.402,21.622C6.365,21.67 6.343,21.694 6.326,21.722C6.234,21.875 6.122,22.015 5.992,22.137C5.712,22.395 5.402,22.585 5.009,22.601C4.712,22.613 4.421,22.601 4.144,22.474C3.684,22.264 3.422,21.904 3.35,21.402C3.325,21.232 3.333,21.231 3.168,21.183C2.735,21.067 2.328,20.869 1.97,20.6C1.59,20.316 1.308,19.921 1.162,19.47C1.036,19.068 0.981,18.646 1.002,18.225C1.004,18.191 1.018,18.158 1.026,18.125C1.058,18.148 1.072,18.168 1.076,18.191C1.109,18.344 1.135,18.499 1.172,18.651C1.258,19.006 1.429,19.315 1.688,19.571C1.946,19.827 2.259,19.99 2.598,20.103C2.956,20.221 3.315,20.241 3.668,20.087C3.904,19.98 4.115,19.827 4.289,19.635C4.617,19.287 4.822,18.875 4.937,18.412C4.946,18.378 4.942,18.341 4.944,18.302C4.929,18.308 4.918,18.308 4.914,18.313C4.883,18.363 4.85,18.413 4.821,18.465C4.537,18.967 4.142,19.352 3.625,19.6C3.274,19.77 2.907,19.855 2.515,19.759C2.123,19.674 1.776,19.446 1.544,19.119C1.346,18.847 1.219,18.529 1.176,18.195C1.137,17.9 1.144,17.602 1.196,17.309C1.246,16.87 1.662,16.139 1.938,16.038C1.918,16.101 1.903,16.15 1.885,16.198C1.842,16.314 1.788,16.425 1.755,16.543C1.679,16.809 1.662,17.089 1.705,17.363C1.738,17.575 1.795,17.779 1.909,17.963C2.056,18.199 2.255,18.37 2.529,18.428C2.639,18.451 2.754,18.442 2.867,18.446C3.007,18.451 3.145,18.404 3.253,18.315C3.417,18.187 3.535,18.023 3.619,17.834C3.787,17.459 3.859,17.057 3.928,16.655C3.978,16.359 4.021,16.061 4.061,15.762C4.1,15.481 4.132,15.199 4.165,14.917C4.191,14.685 4.213,14.453 4.239,14.221C4.263,13.993 4.291,13.766 4.315,13.538C4.339,13.311 4.362,13.083 4.384,12.855C4.397,12.715 4.406,12.575 4.418,12.435L4.455,12.018C4.477,11.768 4.496,11.518 4.52,11.27C4.528,11.188 4.5,11.138 4.43,11.093C4.248,10.976 4.083,10.835 3.938,10.675C3.838,10.566 3.75,10.447 3.656,10.333C3.621,10.291 3.6,10.236 3.54,10.215C3.6,10.427 3.692,10.629 3.815,10.812C3.875,10.904 3.946,10.988 4.011,11.077C4.074,11.163 4.193,11.192 4.245,11.303C4.217,11.306 4.199,11.313 4.185,11.309C4.111,11.292 4.038,11.273 3.965,11.252C3.466,11.108 3.02,10.824 2.678,10.433C2.243,9.946 2.022,9.357 1.968,8.71C1.937,8.357 1.941,8.002 1.982,7.65C2.054,7.048 2.202,6.464 2.432,5.905C2.587,5.529 2.77,5.164 2.958,4.803C3.163,4.41 3.424,4.053 3.723,3.727C4.235,3.168 4.827,2.703 5.449,2.279C6.166,1.789 6.927,1.381 7.726,1.046C8.244,0.828 8.767,0.632 9.31,0.494C9.965,0.328 10.62,0.164 11.292,0.079C11.521,0.049 11.75,0.021 11.98,0.009L11.981,0.009ZM10.134,22.829C10.064,22.889 9.987,22.94 9.927,23.009C9.689,23.279 9.463,23.558 9.259,23.878L9.215,23.986C9.251,23.977 9.284,23.957 9.308,23.929C9.482,23.739 9.659,23.551 9.827,23.355C9.931,23.233 10.022,23.1 10.115,22.969C10.139,22.935 10.145,22.889 10.161,22.849L10.134,22.829ZM11.784,19.134C11.551,19.314 11.332,19.512 11.131,19.727L10.761,20.113C10.657,20.225 10.528,20.311 10.384,20.363C10.235,20.42 10.077,20.45 9.917,20.453C9.873,20.453 9.83,20.459 9.766,20.465C9.794,20.523 9.809,20.562 9.83,20.596C9.98,20.838 10.131,21.078 10.28,21.32C10.416,21.54 10.556,21.758 10.679,21.986C10.747,22.111 10.784,22.253 10.835,22.39C10.912,22.417 10.975,22.372 11.037,22.342C11.327,22.207 11.616,22.068 11.904,21.93C12.117,21.829 12.341,21.744 12.54,21.62C12.887,21.405 13.22,21.165 13.558,20.935C13.573,20.925 13.584,20.907 13.6,20.889C13.577,20.87 13.562,20.852 13.544,20.845C13.257,20.734 13.017,20.545 12.774,20.363C12.597,20.234 12.428,20.093 12.268,19.943C12.085,19.758 11.945,19.535 11.858,19.29C11.839,19.241 11.813,19.195 11.783,19.134L11.784,19.134ZM5.937,19.398C5.877,19.494 5.84,19.592 5.805,19.691C5.679,20.057 5.491,20.399 5.25,20.701C5.05,20.951 4.795,21.113 4.488,21.194C4.258,21.254 4.024,21.27 3.788,21.264C3.74,21.262 3.691,21.266 3.63,21.269C3.646,21.309 3.651,21.335 3.665,21.354C3.765,21.499 3.895,21.6 4.065,21.649C4.222,21.695 4.381,21.683 4.563,21.672C4.744,21.635 4.906,21.557 5.048,21.438C5.286,21.239 5.45,20.984 5.584,20.706C5.759,20.343 5.848,19.955 5.926,19.562C5.936,19.509 5.934,19.452 5.937,19.398ZM20.882,14.812C20.89,14.841 20.898,14.869 20.909,14.919C20.933,15.074 20.96,15.229 20.981,15.383C21.011,15.602 21.048,15.82 21.059,16.04C21.076,16.384 21.086,16.729 21.045,17.073C21.008,17.388 20.982,17.706 20.929,18.019C20.842,18.543 20.687,19.053 20.469,19.537C20.461,19.555 20.459,19.576 20.449,19.619C20.496,19.589 20.526,19.577 20.547,19.555C20.632,19.472 20.717,19.388 20.795,19.3C21.066,18.995 21.253,18.64 21.391,18.257C21.571,17.759 21.619,17.246 21.536,16.726C21.433,16.076 21.206,15.463 20.939,14.845C20.931,14.827 20.923,14.808 20.915,14.79L20.882,14.812ZM5.797,8.29C5.787,8.342 5.794,8.395 5.815,8.443C5.939,8.694 6.065,8.944 6.194,9.193C6.219,9.242 6.26,9.283 6.224,9.356C5.94,9.416 5.646,9.475 5.344,9.611C5.403,9.649 5.441,9.671 5.476,9.698C5.518,9.73 5.588,9.756 5.566,9.818C5.556,9.851 5.491,9.866 5.449,9.89C5.466,9.9 5.492,9.911 5.516,9.926C5.682,10.028 5.846,10.133 5.963,10.294C6.101,10.486 6.192,10.698 6.151,10.938C6.072,11.407 5.845,11.788 5.461,12.07C5.407,12.11 5.355,12.153 5.3,12.192C5.22,12.246 5.18,12.342 5.197,12.437C5.207,12.504 5.225,12.57 5.252,12.632C5.335,12.828 5.472,12.982 5.627,13.124C5.71,13.2 5.786,13.288 5.849,13.381C5.926,13.492 5.935,13.637 5.874,13.758C5.851,13.808 5.824,13.857 5.798,13.906C5.768,13.966 5.77,14.017 5.82,14.068C5.861,14.11 5.9,14.157 5.932,14.206C5.97,14.264 6.01,14.285 6.079,14.256C6.186,14.215 6.304,14.213 6.412,14.25C6.572,14.296 6.714,14.376 6.856,14.46C6.986,14.537 7.12,14.609 7.256,14.679C7.323,14.714 7.396,14.729 7.475,14.705C7.546,14.683 7.599,14.715 7.62,14.781C7.64,14.845 7.617,14.889 7.546,14.92C7.476,14.95 7.409,14.983 7.337,15.008C7.237,15.043 7.136,15.081 7.023,15.085C7.01,14.978 7.133,14.997 7.15,14.926C6.944,14.8 6.507,14.781 6.349,14.892C6.412,15.004 6.384,15.102 6.253,15.205C6.123,15.105 6.228,15.003 6.255,14.905C6.241,14.902 6.227,14.901 6.212,14.901C6.11,14.901 6.023,14.975 6.006,15.075C5.991,15.176 6.073,15.291 6.184,15.299C6.292,15.306 6.402,15.294 6.51,15.287C6.57,15.282 6.63,15.26 6.709,15.287C6.606,15.41 6.461,15.414 6.352,15.477C6.354,15.527 6.422,15.563 6.371,15.608C6.318,15.656 6.276,15.607 6.239,15.578C6.159,15.515 6.079,15.452 6.008,15.381C5.918,15.301 5.862,15.19 5.851,15.07C5.847,15.011 5.832,14.952 5.808,14.898C5.776,14.824 5.776,14.761 5.841,14.708C5.823,14.678 5.813,14.655 5.796,14.636C5.71,14.525 5.644,14.4 5.6,14.267C5.547,14.13 5.554,14.003 5.648,13.886C5.672,13.856 5.698,13.826 5.712,13.791C5.735,13.737 5.751,13.681 5.759,13.623C5.776,13.458 5.695,13.336 5.577,13.236C5.391,13.08 5.217,12.914 5.117,12.685C5.112,12.674 5.093,12.668 5.08,12.659C5.069,12.676 5.056,12.686 5.055,12.697C5.036,12.882 5.01,13.067 5.003,13.254C4.989,13.631 5.061,13.997 5.165,14.358C5.283,14.768 5.454,15.156 5.653,15.531C5.92,16.033 6.19,16.533 6.465,17.031C6.52,17.129 6.595,17.22 6.673,17.301C6.871,17.503 7.125,17.573 7.397,17.574C7.599,17.574 7.801,17.568 8.002,17.548C8.297,17.518 8.592,17.475 8.886,17.435C9.069,17.41 9.251,17.378 9.434,17.355C9.644,17.329 9.814,17.428 9.956,17.565C10.116,17.721 10.261,17.892 10.403,18.065C10.623,18.33 10.8,18.625 10.957,18.932C11.007,19.03 11.027,19.032 11.104,18.962C11.234,18.841 11.364,18.72 11.498,18.602C11.565,18.543 11.586,18.482 11.565,18.389C11.507,18.128 11.478,17.861 11.48,17.593C11.482,17.436 11.486,17.279 11.498,17.122C11.513,16.898 11.528,16.672 11.558,16.45C11.664,15.682 11.784,14.916 11.92,14.152C12.007,13.659 12.102,13.168 12.188,12.675C12.248,12.328 12.306,11.981 12.35,11.632C12.384,11.359 12.405,11.082 12.413,10.807C12.424,10.475 12.416,10.142 12.415,9.809C12.415,9.732 12.419,9.654 12.405,9.579C12.377,9.437 12.395,9.424 12.243,9.389C12.043,9.343 11.84,9.307 11.636,9.282C11.49,9.264 11.429,9.229 11.415,9.092C11.409,9.043 11.39,8.994 11.374,8.946C11.365,8.921 11.35,8.898 11.328,8.856L11.303,9.12C11.294,9.216 11.274,9.236 11.176,9.235C11.121,9.235 11.066,9.227 11.012,9.227C10.536,9.227 10.06,9.219 9.586,9.259C9.491,9.267 9.413,9.244 9.36,9.156C9.32,9.09 9.272,9.03 9.226,8.97C9.163,8.886 9.14,8.877 9.044,8.91C8.849,8.978 8.656,9.048 8.462,9.12C8.219,9.218 7.992,9.351 7.787,9.514C7.691,9.59 7.581,9.647 7.464,9.682C7.431,9.692 7.394,9.69 7.337,9.695C7.357,9.629 7.361,9.581 7.384,9.545C7.448,9.44 7.519,9.34 7.589,9.239C7.612,9.206 7.638,9.176 7.662,9.144L7.647,9.121L7.446,9.158C7.3,9.198 7.15,9.228 7.009,9.28C6.861,9.333 6.743,9.303 6.623,9.208C6.341,8.984 6.094,8.719 5.89,8.422L5.797,8.29ZM14.389,17.253L14.242,17.343C14.022,17.477 13.802,17.609 13.583,17.745C13.49,17.803 13.399,17.865 13.313,17.933C13.228,18.003 13.189,18.094 13.241,18.205C13.288,18.305 13.334,18.405 13.388,18.499C13.435,18.579 13.512,18.637 13.601,18.646C13.711,18.656 13.829,18.658 13.937,18.634C14.154,18.584 14.309,18.429 14.465,18.277C14.553,18.201 14.587,18.08 14.552,17.969C14.506,17.789 14.473,17.604 14.434,17.422C14.423,17.37 14.407,17.319 14.389,17.253ZM14.132,14.844C14.012,15.135 13.927,15.441 13.807,15.754C13.656,16.187 13.513,16.624 13.372,17.077C13.408,17.067 13.426,17.067 13.439,17.059C13.7,16.899 13.961,16.735 14.224,16.575C14.278,16.542 14.295,16.497 14.289,16.437C14.277,16.307 14.265,16.175 14.255,16.044L14.187,15.158C14.179,15.055 14.167,14.952 14.158,14.848C14.149,14.848 14.141,14.846 14.132,14.844ZM17.213,6.714L17.312,6.999C17.392,7.23 17.471,7.462 17.552,7.713L18.132,9.665C18.319,10.295 18.504,10.927 18.69,11.558C18.804,11.94 18.925,12.32 19.033,12.704C19.105,12.961 19.159,13.223 19.219,13.503C19.263,13.709 19.306,13.916 19.346,14.143C19.38,14.249 19.369,14.369 19.423,14.468L19.448,14.462L19.38,14.1C19.342,13.894 19.303,13.688 19.267,13.462C19.252,13.392 19.238,13.321 19.221,13.251C19.126,12.855 19.044,12.455 18.931,12.064C18.735,11.379 18.518,10.7 18.313,10.018C18.148,9.469 17.991,8.918 17.825,8.37C17.756,8.143 17.675,7.92 17.599,7.675L17.482,7.339C17.445,7.232 17.407,7.123 17.367,7.017C17.327,6.911 17.283,6.807 17.24,6.703C17.231,6.706 17.222,6.71 17.213,6.713L17.213,6.714ZM6.225,14.304C6.162,14.303 6.11,14.318 6.091,14.387C6.21,14.479 6.376,14.484 6.501,14.399C6.41,14.364 6.318,14.333 6.225,14.304ZM5.23,11.98C5.204,11.953 5.173,11.932 5.155,11.982C5.143,12.014 5.148,12.052 5.145,12.095C5.227,12.058 5.227,12.058 5.23,11.98ZM5.292,10.791C5.256,10.797 5.225,10.817 5.204,10.847C5.185,10.88 5.176,10.919 5.179,10.957C5.184,11.109 5.189,11.263 5.205,11.414C5.216,11.49 5.238,11.563 5.271,11.632C5.332,11.768 5.428,11.799 5.559,11.733C5.614,11.706 5.619,11.679 5.584,11.623C5.539,11.554 5.496,11.483 5.455,11.412C5.44,11.344 5.389,11.281 5.422,11.205C5.462,11.115 5.346,11.089 5.348,11.015L5.348,10.874C5.345,10.836 5.342,10.787 5.292,10.791ZM5.275,9.823C5.11,9.82 4.948,9.864 4.808,9.95C4.732,9.995 4.724,10.02 4.758,10.108C4.792,10.195 4.828,10.281 4.873,10.362C4.937,10.479 4.963,10.487 5.083,10.439C5.188,10.392 5.304,10.374 5.419,10.386C5.621,10.408 5.776,10.522 5.923,10.65L6.015,10.727C6.022,10.721 6.029,10.714 6.037,10.709C6.018,10.604 6.002,10.483 5.888,10.445C5.731,10.392 5.564,10.37 5.38,10.328L5.14,10.323C5.38,10.154 5.592,10.279 5.827,10.332C5.764,10.217 5.674,10.185 5.597,10.139C5.515,10.089 5.427,10.047 5.347,9.995C5.287,9.958 5.227,9.915 5.275,9.823ZM15.508,10.148C15.278,10.138 15.081,10.228 14.9,10.359C14.866,10.385 14.84,10.424 14.795,10.476C14.882,10.502 14.945,10.522 15.027,10.541C15.071,10.526 15.115,10.511 15.157,10.495C15.463,10.381 15.767,10.38 16.061,10.526C16.187,10.589 16.298,10.566 16.427,10.521C16.407,10.49 16.397,10.467 16.382,10.45C16.26,10.32 16.105,10.226 15.934,10.177C15.794,10.133 15.65,10.153 15.508,10.147L15.508,10.148ZM7.99,6.483C7.981,6.527 7.982,6.572 7.992,6.616C8.072,6.937 8.148,7.259 8.234,7.578C8.338,7.965 8.504,8.328 8.69,8.681C8.71,8.718 8.751,8.761 8.788,8.768C8.876,8.779 8.965,8.761 9.041,8.717L8.569,7.877C8.339,7.429 8.164,6.957 7.99,6.483ZM10.397,0.497C10.197,0.489 9.992,0.501 9.794,0.531C9.558,0.566 9.324,0.618 9.094,0.683C8.807,0.763 8.525,0.863 8.242,0.956C8.202,0.969 8.168,0.994 8.132,1.014C8.16,1.028 8.182,1.032 8.202,1.028C8.489,0.96 8.782,0.943 9.075,0.938C9.209,0.936 9.344,0.947 9.477,0.963C9.667,0.987 9.859,1.011 10.047,1.053C10.503,1.157 10.921,1.353 11.312,1.609C11.776,1.915 12.2,2.269 12.569,2.687C12.774,2.919 12.964,3.162 13.129,3.426C13.299,3.7 13.444,3.987 13.578,4.282C13.851,4.883 14.034,5.514 14.178,6.158C14.218,6.331 14.248,6.506 14.278,6.682C14.295,6.786 14.343,6.849 14.448,6.872C14.57,6.9 14.648,6.977 14.668,7.123C14.665,7.225 14.608,7.297 14.539,7.363C14.425,7.462 14.334,7.584 14.271,7.721C14.302,7.716 14.331,7.703 14.354,7.682C14.434,7.596 14.516,7.51 14.589,7.417C14.668,7.323 14.713,7.206 14.719,7.084C14.728,7.034 14.741,6.984 14.743,6.934C14.75,6.81 14.726,6.784 14.6,6.766C14.575,6.762 14.551,6.752 14.527,6.751C14.445,6.744 14.402,6.688 14.39,6.62C14.357,6.422 14.386,6.265 14.637,6.212C14.723,6.194 14.811,6.182 14.897,6.17C15.055,6.147 15.212,6.117 15.37,6.103C15.51,6.091 15.56,6.136 15.596,6.27C15.604,6.299 15.614,6.327 15.617,6.357C15.636,6.536 15.609,6.582 15.476,6.645C15.449,6.658 15.421,6.669 15.398,6.687C15.375,6.704 15.357,6.727 15.347,6.754C15.308,6.898 15.42,7.136 15.553,7.199L16.226,7.519C16.249,7.53 16.276,7.534 16.301,7.542L16.319,7.516C16.304,7.508 16.287,7.503 16.275,7.492C16.109,7.361 15.926,7.253 15.731,7.172C15.674,7.146 15.616,7.121 15.558,7.097C15.481,7.065 15.431,6.989 15.432,6.906C15.429,6.821 15.477,6.752 15.56,6.719L15.619,6.694C15.718,6.65 15.737,6.618 15.731,6.507C15.73,6.486 15.727,6.465 15.723,6.444C15.656,6.15 15.6,5.854 15.518,5.564C15.323,4.856 15.045,4.172 14.692,3.528C14.324,2.859 13.855,2.25 13.302,1.723C12.956,1.388 12.559,1.109 12.125,0.899C11.804,0.741 11.462,0.63 11.109,0.571C10.873,0.533 10.636,0.508 10.397,0.497ZM17.116,6.452C17.126,6.466 17.134,6.48 17.154,6.486L17.132,6.442L17.116,6.452ZM4.103,3.917C4.094,3.924 4.084,3.928 4.073,3.929C4.06,3.943 4.047,3.956 4.033,3.968C4.023,3.978 4.013,3.988 3.988,4.008L3.625,4.362C3.537,4.447 3.455,4.54 3.359,4.615C3.075,4.835 2.934,5.145 2.815,5.47C2.806,5.493 2.804,5.517 2.808,5.541C2.821,5.596 2.841,5.649 2.86,5.709L2.934,5.735C2.917,5.791 2.904,5.84 2.887,5.887C2.829,6.051 2.769,6.214 2.712,6.378C2.707,6.393 2.72,6.414 2.731,6.455C2.811,6.28 2.889,6.125 2.956,5.966C3.184,5.422 3.44,4.892 3.775,4.405C3.865,4.272 3.957,4.139 4.058,4.004C4.062,3.998 4.065,3.991 4.08,3.974C4.081,3.958 4.083,3.942 4.095,3.934L4.103,3.917ZM17.079,6.325C17.085,6.33 17.088,6.337 17.088,6.344C17.086,6.347 17.084,6.351 17.082,6.354C17.084,6.361 17.086,6.367 17.089,6.374L17.107,6.396C17.109,6.389 17.114,6.38 17.112,6.375C17.109,6.365 17.1,6.357 17.092,6.337C17.088,6.333 17.083,6.329 17.079,6.325ZM4.199,4.48C4.196,4.484 4.191,4.488 4.172,4.494C4.167,4.507 4.161,4.519 4.141,4.541C4.102,4.599 4.061,4.654 4.017,4.708C3.969,4.778 3.901,4.763 3.836,4.749C3.702,4.721 3.608,4.765 3.549,4.892C3.46,5.079 3.362,5.262 3.276,5.452C3.227,5.56 3.166,5.668 3.158,5.812C3.239,5.815 3.312,5.819 3.386,5.82L3.614,5.82C3.592,5.909 3.566,5.997 3.535,6.084C3.525,6.136 3.513,6.187 3.502,6.239L3.522,6.243C3.54,6.197 3.559,6.151 3.589,6.09C3.655,5.948 3.719,5.805 3.789,5.664C3.809,5.624 3.823,5.564 3.905,5.572C3.905,5.615 3.909,5.656 3.905,5.696C3.9,5.741 3.888,5.786 3.877,5.839C4.018,5.882 3.963,6.013 3.992,6.108C4.094,6.086 4.096,5.913 4.24,5.964L4.24,6.169L4.257,6.171L4.696,5.112C4.566,5.112 4.45,5.092 4.338,5.145C4.314,5.156 4.28,5.144 4.23,5.141C4.305,4.991 4.369,4.863 4.441,4.724C4.447,4.711 4.456,4.698 4.466,4.688C4.466,4.673 4.465,4.658 4.474,4.65L4.48,4.63C4.475,4.636 4.47,4.641 4.452,4.647C4.448,4.659 4.443,4.671 4.426,4.692C4.419,4.706 4.407,4.717 4.394,4.725C4.271,4.882 4.304,4.889 4.136,4.831C4.057,4.804 4.058,4.803 4.089,4.687C4.117,4.641 4.145,4.594 4.187,4.537C4.187,4.521 4.186,4.505 4.194,4.495L4.2,4.48L4.199,4.48ZM6.272,3.81C6.269,3.816 6.265,3.821 6.245,3.826C6.151,3.951 6.051,4.072 5.965,4.203C5.81,4.441 5.664,4.684 5.514,4.926C5.374,5.15 5.169,5.294 4.939,5.407C4.922,5.415 4.899,5.413 4.86,5.418C4.872,5.359 4.876,5.309 4.893,5.265C4.961,5.089 5.038,4.916 5.122,4.747L5.115,4.727C5.105,4.737 5.093,4.746 5.08,4.752C5.052,4.802 5.025,4.852 4.987,4.916C4.727,5.34 4.544,5.733 4.545,5.866C4.569,5.87 4.593,5.877 4.618,5.879C4.795,5.892 4.806,5.886 4.878,5.714C4.908,5.644 4.955,5.594 5.025,5.564L5.2,5.494C5.244,5.476 5.285,5.437 5.346,5.462C5.349,5.512 5.336,5.572 5.36,5.607C5.402,5.669 5.404,5.732 5.407,5.8C5.409,5.849 5.424,5.898 5.433,5.947C5.462,5.913 5.472,5.882 5.483,5.85C5.625,5.46 5.76,5.068 5.911,4.68C6.011,4.424 6.131,4.176 6.241,3.924C6.254,3.894 6.254,3.857 6.271,3.832L6.271,3.81L6.272,3.81ZM10.259,3.47C10.259,3.515 10.269,3.554 10.28,3.593C10.322,3.753 10.374,3.911 10.404,4.073C10.428,4.206 10.427,4.343 10.432,4.479C10.432,4.512 10.413,4.546 10.4,4.589C10.306,4.531 10.353,4.431 10.294,4.374L10.169,4.374C10.154,4.446 10.159,4.526 10.123,4.574C10.057,4.659 9.968,4.728 9.887,4.801C9.844,4.839 9.809,4.819 9.784,4.776L9.738,4.689C9.673,4.724 9.621,4.758 9.566,4.782C9.45,4.833 9.331,4.877 9.216,4.929C9.131,4.967 9.126,4.982 9.146,5.076C9.16,5.151 9.18,5.224 9.193,5.299C9.206,5.371 9.243,5.408 9.316,5.423C9.549,5.473 9.778,5.538 9.973,5.688C10.031,5.586 10.031,5.586 10.141,5.537C10.171,5.523 10.201,5.507 10.233,5.495C10.313,5.465 10.348,5.478 10.383,5.555C10.406,5.603 10.424,5.653 10.449,5.713C10.509,5.573 10.407,5.446 10.466,5.297C10.623,5.477 10.706,5.687 10.841,5.864C10.855,5.833 10.863,5.8 10.863,5.766C10.865,5.642 10.863,5.519 10.865,5.395C10.865,5.361 10.878,5.328 10.885,5.295L10.917,5.292C11.027,5.447 11.047,5.646 11.143,5.812C11.148,5.681 11.145,5.55 11.133,5.42C11.129,5.375 11.133,5.346 11.183,5.332C11.263,5.368 11.299,5.472 11.398,5.49C11.368,5.215 10.975,4.353 10.6,3.855C10.486,3.728 10.4,3.575 10.26,3.469L10.259,3.47ZM7.592,4.166C7.573,4.2 7.562,4.216 7.555,4.233C7.494,4.418 7.43,4.603 7.375,4.789C7.344,4.894 7.288,4.958 7.18,4.979C7.09,4.998 7.002,5.031 6.912,5.052C6.874,5.061 6.823,5.067 6.794,5.049C6.77,5.033 6.769,4.98 6.758,4.943C6.694,5.019 6.676,5.03 6.588,4.99C6.455,4.928 6.326,4.855 6.195,4.789C6.147,4.764 6.102,4.726 6.025,4.759C5.982,4.879 5.934,5.009 5.888,5.141C5.789,5.421 5.801,5.383 5.983,5.594C6.029,5.642 6.085,5.624 6.137,5.617C6.191,5.608 6.243,5.587 6.297,5.581C6.427,5.568 6.557,5.501 6.664,5.566C6.868,5.502 7.051,5.444 7.235,5.388C7.285,5.373 7.324,5.393 7.349,5.442C7.371,5.484 7.383,5.535 7.431,5.563C7.469,5.507 7.418,5.435 7.494,5.385L7.634,5.626L7.592,4.166ZM7.87,4.524C7.774,4.514 7.763,4.534 7.76,4.632C7.758,4.67 7.757,4.71 7.762,4.747C7.792,4.947 7.861,5.133 7.936,5.317C7.938,5.323 7.948,5.327 7.958,5.332L8.036,5.282C8.088,5.318 8.117,5.37 8.189,5.37C8.394,5.368 8.599,5.384 8.805,5.382C8.904,5.381 8.963,5.424 9.01,5.502C9.028,5.532 9.034,5.579 9.098,5.568L9.018,5.174C8.968,4.979 8.933,4.779 8.846,4.585C8.789,4.642 8.732,4.653 8.666,4.631C8.622,4.617 8.577,4.608 8.531,4.603C8.311,4.575 8.091,4.544 7.871,4.523L7.87,4.524ZM18.124,2.797C18.213,2.96 18.279,3.113 18.263,3.288C18.247,3.456 18.289,3.63 18.219,3.804C18.172,3.771 18.131,3.722 18.107,3.729C17.99,3.764 17.943,3.672 17.88,3.614C17.781,3.521 17.685,3.425 17.594,3.324L17.49,3.211C17.482,3.217 17.475,3.224 17.467,3.23C17.502,3.276 17.537,3.323 17.577,3.386C17.617,3.45 17.661,3.513 17.699,3.579C17.733,3.637 17.764,3.697 17.73,3.784C17.648,3.774 17.566,3.765 17.484,3.752C17.424,3.742 17.383,3.752 17.36,3.822C17.329,3.92 17.323,3.918 17.21,3.912C17.23,3.954 17.246,3.992 17.267,4.028C17.308,4.102 17.297,4.166 17.237,4.224C17.177,4.284 17.119,4.346 17.059,4.405C17.012,4.455 16.939,4.474 16.874,4.451C16.652,4.39 16.427,4.338 16.204,4.277C16.172,4.268 16.141,4.237 16.118,4.209C16.088,4.169 16.066,4.122 16.038,4.079C15.994,4.009 15.948,3.941 15.902,3.872C15.887,3.905 15.882,3.941 15.888,3.977C15.9,4.104 15.918,4.23 15.923,4.357C15.928,4.457 15.899,4.477 15.802,4.461C15.698,4.444 15.596,4.421 15.492,4.403C15.428,4.391 15.361,4.375 15.29,4.433L15.371,4.641C15.461,4.641 15.537,4.631 15.608,4.643C15.784,4.674 15.945,4.763 16.066,4.894C16.144,4.977 16.22,5.062 16.307,5.154L16.325,5.149C16.321,5.143 16.317,5.136 16.315,5.109C16.329,5.053 16.253,4.991 16.333,4.931C16.364,4.961 16.397,4.988 16.421,5.021C16.479,5.099 16.532,5.18 16.59,5.278L16.679,5.419L16.703,5.406C16.561,5.095 16.418,4.783 16.276,4.472C16.331,4.479 16.359,4.479 16.384,4.488C16.577,4.558 16.769,4.63 16.961,4.704C17.035,4.732 17.108,4.764 17.18,4.798C17.242,4.826 17.292,4.816 17.337,4.765C17.387,4.709 17.439,4.653 17.491,4.598C17.541,4.547 17.586,4.552 17.623,4.612C17.639,4.637 17.649,4.665 17.663,4.692C17.734,4.83 17.806,4.969 17.88,5.125L18.039,5.433L18.064,5.422C18.02,5.316 17.994,5.204 17.926,5.088C17.869,4.906 17.758,4.742 17.72,4.543C17.856,4.577 18.082,4.869 18.287,5.275L18.344,5.349L18.362,5.338C18.343,5.296 18.325,5.254 18.31,5.211C18.264,5.066 18.213,4.921 18.174,4.775C18.152,4.692 18.138,4.602 18.196,4.515L18.305,4.573L18.279,4.366L18.306,4.35C18.328,4.37 18.356,4.386 18.371,4.41C18.444,4.518 18.514,4.63 18.586,4.74C18.596,4.756 18.615,4.769 18.629,4.783C18.593,4.566 18.429,4.403 18.4,4.157L18.555,4.269C18.569,4.103 18.567,3.95 18.597,3.804C18.629,3.646 18.574,3.507 18.534,3.359C18.558,3.363 18.57,3.365 18.589,3.384C18.681,3.508 18.772,3.633 18.866,3.755C18.886,3.782 18.916,3.802 18.935,3.842L18.975,3.905L18.994,3.89C18.972,3.866 18.954,3.838 18.941,3.808C18.829,3.646 18.718,3.483 18.609,3.318C18.388,3.007 18.246,2.851 18.124,2.797ZM11.554,3.124C11.551,3.285 11.646,3.399 11.623,3.539L11.255,3.626C11.345,3.765 11.287,3.863 11.203,3.957C11.153,4.014 11.111,4.079 11.06,4.135C11.023,4.175 11.014,4.213 11.042,4.261L11.202,4.536C11.231,4.584 11.274,4.602 11.33,4.6C11.406,4.597 11.482,4.6 11.558,4.599C11.674,4.596 11.774,4.621 11.833,4.736C11.839,4.75 11.853,4.76 11.877,4.788C11.881,4.729 11.874,4.69 11.887,4.658C11.903,4.618 11.927,4.559 11.959,4.55C12.043,4.527 12.132,4.526 12.219,4.52C12.232,4.519 12.246,4.538 12.259,4.549L12.33,4.614C12.349,4.504 12.248,4.416 12.306,4.304L12.432,4.344C12.406,4.221 12.362,4.099 12.361,3.978C12.361,3.855 12.412,3.735 12.476,3.618C12.583,3.68 12.636,3.774 12.71,3.871C12.893,4.136 13.07,4.404 13.204,4.705C13.369,4.627 13.474,4.773 13.611,4.793C13.608,4.687 13.478,4.352 13.414,4.301C13.385,4.279 13.348,4.269 13.312,4.273C13.252,4.284 13.193,4.312 13.121,4.336C13.096,4.297 13.065,4.258 13.044,4.214C12.917,3.936 12.759,3.673 12.571,3.431C12.495,3.337 12.411,3.249 12.343,3.171L11.952,3.456C11.903,3.491 11.858,3.486 11.82,3.439L11.651,3.232C11.626,3.202 11.598,3.173 11.554,3.124Z" style={{ fill: "white" }} /></g></g></svg></span>
              <h3>Via Hermes</h3>
              <p>Hand the whole loop to an autonomous agent: it finds the leads, drafts the messages, fills next week's calendar, and reports back.</p>
              <div className="chat">
                <div className="chathead"><span className="av hermes"><svg viewBox="0 0 192 200"><g transform="matrix(1,0,0,1,-8.314363,-0.003091)"><g transform="matrix(8.333333,0,0,8.333333,0,0)"><path d="M5.938,12.835C6.065,12.796 6.223,12.855 6.311,12.978C6.339,13.016 6.347,13.07 6.357,13.118C6.36,13.132 6.337,13.151 6.317,13.168C6.193,13.07 6.077,12.974 5.963,12.877C5.952,12.867 5.947,12.85 5.938,12.835ZM8.396,9.412C8.591,9.38 8.786,9.352 8.984,9.362C9.034,9.364 9.084,9.372 9.132,9.388C9.334,9.459 9.534,9.535 9.733,9.612C9.761,9.622 9.783,9.648 9.808,9.667L9.795,9.694C9.708,9.666 9.621,9.636 9.535,9.605C9.42,9.567 9.322,9.528 9.22,9.507C8.97,9.457 8.97,9.461 8.928,9.493L9.502,9.637C9.777,9.776 10.052,9.913 10.325,10.054C10.367,10.076 10.415,10.111 10.432,10.152C10.458,10.212 10.495,10.228 10.549,10.224C10.615,10.218 10.681,10.207 10.762,10.197L10.722,10.283C10.773,10.363 10.864,10.303 10.938,10.347C10.864,10.477 10.691,10.437 10.604,10.546L10.665,10.62L10.545,10.707C10.545,10.813 10.507,10.875 10.239,10.95L10.265,11.035L10.069,11.077L10.139,11.201L9.889,11.201L9.882,11.338C9.801,11.328 9.721,11.32 9.638,11.311L9.585,11.434C9.558,11.426 9.533,11.423 9.512,11.411C9.445,11.373 9.384,11.355 9.317,11.417C9.298,11.434 9.254,11.431 9.224,11.425C9.198,11.419 9.174,11.396 9.154,11.383C9.044,11.478 9.044,11.478 8.946,11.386C8.889,11.432 8.826,11.46 8.76,11.397C8.697,11.424 8.637,11.377 8.582,11.383C8.512,11.39 8.485,11.348 8.449,11.313L8.319,11.346C8.306,11.11 8.125,11.156 7.979,11.143C7.984,11.071 8.029,11.051 8.074,11.049C8.128,11.047 8.182,11.055 8.233,11.071C8.397,11.121 8.553,11.191 8.729,11.209C8.932,11.23 9.134,11.238 9.33,11.194C9.595,11.135 9.85,11.045 10.037,10.829C10.086,10.773 10.12,10.702 10.154,10.634C10.173,10.596 10.174,10.55 10.134,10.518C10.019,10.426 9.89,10.353 9.752,10.301C9.776,10.421 9.721,10.483 9.637,10.522C9.637,10.536 9.633,10.547 9.637,10.552C9.717,10.667 9.721,10.712 9.63,10.819C9.565,10.897 9.492,10.968 9.412,11.03C9.219,11.181 8.939,11.159 8.771,10.98C8.723,10.933 8.679,10.882 8.638,10.828C8.56,10.721 8.562,10.72 8.605,10.592C8.44,10.512 8.477,10.366 8.501,10.228C8.509,10.178 8.529,10.132 8.55,10.065C8.51,10.079 8.483,10.082 8.463,10.097C8.327,10.185 8.218,10.309 8.147,10.454C8.14,10.47 8.137,10.488 8.127,10.501C8.115,10.516 8.093,10.539 8.082,10.536C8.062,10.53 8.045,10.509 8.032,10.491C8.024,10.479 8.025,10.459 8.02,10.434L7.894,10.434L7.947,10.262C7.934,10.246 7.921,10.229 7.908,10.213L8.018,9.929C7.958,9.955 7.927,9.973 7.894,9.98C7.864,9.987 7.83,9.98 7.799,9.98C7.799,9.949 7.789,9.91 7.803,9.888C7.952,9.668 8.108,9.46 8.396,9.412Z" style={{ fill: "white" }} /></g><g transform="matrix(8.333333,0,0,8.333333,0,0)"><path d="M8.06,10.788C8.057,10.75 8.056,10.713 8.097,10.726C8.113,10.732 8.131,10.774 8.125,10.793C8.115,10.833 8.087,10.825 8.061,10.788L8.06,10.788Z" style={{ fill: "white" }} /></g><g transform="matrix(8.333333,0,0,8.333333,0,0)"><path d="M11.981,0.009C12.207,-0.003 12.434,-0.002 12.66,0.009C12.907,0.019 13.155,0.033 13.4,0.071C13.801,0.135 14.198,0.228 14.59,0.344C15.053,0.482 15.51,0.643 15.946,0.855C17.153,1.448 18.173,2.362 18.894,3.497C19.186,3.966 19.43,4.46 19.633,4.976C19.852,5.532 20.079,6.086 20.256,6.659C20.46,7.313 20.585,7.985 20.714,8.656C20.811,9.16 20.896,9.666 21.004,10.167C21.16,10.889 21.333,11.607 21.498,12.327C21.684,13.139 21.898,13.942 22.128,14.742C22.23,15.097 22.321,15.455 22.41,15.814C22.52,16.25 22.612,16.69 22.664,17.137C22.695,17.415 22.73,17.694 22.737,17.974C22.748,18.267 22.743,18.561 22.72,18.854C22.683,19.267 22.62,19.672 22.494,20.066C22.296,20.669 21.985,21.228 21.579,21.715L21.449,21.871L21.467,21.894C21.51,21.871 21.555,21.853 21.594,21.826C21.794,21.688 21.967,21.519 22.125,21.336C22.525,20.876 22.846,20.363 23.1,19.807C23.349,19.269 23.46,18.678 23.425,18.087C23.401,17.663 23.328,17.253 23.125,16.874C23.112,16.847 23.11,16.814 23.095,16.753C23.145,16.788 23.177,16.801 23.196,16.825C23.303,16.955 23.416,17.083 23.511,17.223C23.841,17.717 23.971,18.275 23.997,18.863C24.024,19.55 23.861,20.232 23.527,20.833C23.167,21.488 22.64,21.973 22.001,22.339C21.808,22.45 21.607,22.549 21.406,22.647C21.249,22.725 21.158,22.858 21.088,23.012C21.022,23.137 21.011,23.284 21.055,23.418C21.068,23.463 21.073,23.51 21.068,23.557C21.063,23.634 20.991,23.712 20.928,23.719C20.874,23.725 20.803,23.676 20.778,23.603C20.75,23.528 20.73,23.449 20.718,23.37C20.678,23.056 20.563,22.77 20.41,22.5C20.214,22.162 19.968,21.855 19.68,21.59C19.429,21.344 19.121,21.164 18.783,21.066C18.557,21.003 18.325,20.959 18.091,20.935C18.016,20.927 17.941,20.895 17.871,20.945C18.051,21.005 18.234,21.055 18.409,21.125C18.843,21.298 19.229,21.555 19.589,21.853C19.897,22.108 20.169,22.396 20.383,22.737C20.481,22.892 20.569,23.052 20.61,23.233C20.637,23.356 20.652,23.483 20.677,23.608C20.69,23.67 20.675,23.717 20.624,23.752C20.577,23.785 20.502,23.786 20.461,23.742C20.426,23.7 20.399,23.653 20.381,23.602C20.351,23.529 20.343,23.443 20.303,23.377C19.915,22.754 19.435,22.193 18.88,21.713C18.72,21.576 18.551,21.453 18.343,21.39C17.967,21.276 17.59,21.187 17.193,21.236C16.98,21.261 16.766,21.268 16.553,21.289C16.288,21.319 16.035,21.415 15.817,21.567C15.514,21.776 15.234,22.018 14.983,22.287C14.654,22.629 14.341,22.986 14.028,23.342C13.892,23.497 13.764,23.661 13.714,23.873C13.71,23.89 13.706,23.907 13.702,23.924C13.693,23.967 13.656,23.998 13.612,24L13.302,24C13.256,24 13.22,23.952 13.23,23.906C13.253,23.798 13.275,23.69 13.3,23.582C13.375,23.257 13.49,22.947 13.668,22.665C13.692,22.626 13.708,22.577 13.772,22.585L13.782,22.634L13.809,22.711C14.089,22.276 14.38,21.877 14.805,21.576C15.088,21.372 15.389,21.198 15.695,21.026C15.663,21.017 15.629,21.016 15.597,21.024C15.435,21.067 15.272,21.108 15.112,21.158C14.71,21.282 14.348,21.488 14.002,21.724C13.855,21.824 13.704,21.917 13.588,22.057C13.15,22.592 12.789,23.187 12.518,23.824C12.502,23.863 12.488,23.903 12.478,23.944C12.469,23.977 12.44,24 12.406,24L11.912,24C11.872,24 11.85,23.949 11.876,23.918C11.999,23.778 12.122,23.636 12.253,23.503C12.528,23.222 12.833,22.971 13.03,22.619C13.057,22.571 13.093,22.529 13.125,22.484C13.363,22.151 13.665,21.877 13.943,21.582C14.025,21.496 14.118,21.422 14.203,21.342C14.232,21.315 14.256,21.285 14.282,21.257L14.264,21.232L14.129,21.273C14.095,21.29 14.059,21.304 14.027,21.323C13.779,21.467 13.533,21.615 13.284,21.756C12.876,21.986 12.459,22.195 12.075,22.467C11.794,22.667 11.484,22.825 11.186,23C11.166,23.012 11.142,23.015 11.106,23.028C11.091,22.893 11.249,22.827 11.214,22.692C11.181,22.706 11.15,22.712 11.129,22.73C11.018,22.826 10.902,22.92 10.801,23.026C10.653,23.183 10.517,23.351 10.376,23.514C10.251,23.657 10.126,23.8 10.003,23.945C9.975,23.979 9.934,23.999 9.89,24L8.762,24C8.768,23.986 8.774,23.972 8.778,23.958C8.806,23.868 8.863,23.786 8.861,23.678C8.77,23.66 8.699,23.679 8.649,23.755C8.602,23.825 8.556,23.897 8.513,23.97C8.503,23.986 8.489,24 8.471,24L8.378,24C8.359,24 8.349,23.978 8.361,23.963C8.432,23.875 8.501,23.785 8.57,23.695C8.571,23.693 8.564,23.683 8.558,23.671C8.544,23.675 8.528,23.677 8.513,23.684C8.337,23.774 8.161,23.865 7.986,23.958C7.934,23.985 7.877,24 7.818,24L5.202,24C5.176,24 5.163,23.964 5.183,23.947C5.393,23.769 5.585,23.573 5.741,23.342C6.076,22.846 6.279,22.295 6.408,21.713C6.412,21.693 6.405,21.67 6.402,21.622C6.365,21.67 6.343,21.694 6.326,21.722C6.234,21.875 6.122,22.015 5.992,22.137C5.712,22.395 5.402,22.585 5.009,22.601C4.712,22.613 4.421,22.601 4.144,22.474C3.684,22.264 3.422,21.904 3.35,21.402C3.325,21.232 3.333,21.231 3.168,21.183C2.735,21.067 2.328,20.869 1.97,20.6C1.59,20.316 1.308,19.921 1.162,19.47C1.036,19.068 0.981,18.646 1.002,18.225C1.004,18.191 1.018,18.158 1.026,18.125C1.058,18.148 1.072,18.168 1.076,18.191C1.109,18.344 1.135,18.499 1.172,18.651C1.258,19.006 1.429,19.315 1.688,19.571C1.946,19.827 2.259,19.99 2.598,20.103C2.956,20.221 3.315,20.241 3.668,20.087C3.904,19.98 4.115,19.827 4.289,19.635C4.617,19.287 4.822,18.875 4.937,18.412C4.946,18.378 4.942,18.341 4.944,18.302C4.929,18.308 4.918,18.308 4.914,18.313C4.883,18.363 4.85,18.413 4.821,18.465C4.537,18.967 4.142,19.352 3.625,19.6C3.274,19.77 2.907,19.855 2.515,19.759C2.123,19.674 1.776,19.446 1.544,19.119C1.346,18.847 1.219,18.529 1.176,18.195C1.137,17.9 1.144,17.602 1.196,17.309C1.246,16.87 1.662,16.139 1.938,16.038C1.918,16.101 1.903,16.15 1.885,16.198C1.842,16.314 1.788,16.425 1.755,16.543C1.679,16.809 1.662,17.089 1.705,17.363C1.738,17.575 1.795,17.779 1.909,17.963C2.056,18.199 2.255,18.37 2.529,18.428C2.639,18.451 2.754,18.442 2.867,18.446C3.007,18.451 3.145,18.404 3.253,18.315C3.417,18.187 3.535,18.023 3.619,17.834C3.787,17.459 3.859,17.057 3.928,16.655C3.978,16.359 4.021,16.061 4.061,15.762C4.1,15.481 4.132,15.199 4.165,14.917C4.191,14.685 4.213,14.453 4.239,14.221C4.263,13.993 4.291,13.766 4.315,13.538C4.339,13.311 4.362,13.083 4.384,12.855C4.397,12.715 4.406,12.575 4.418,12.435L4.455,12.018C4.477,11.768 4.496,11.518 4.52,11.27C4.528,11.188 4.5,11.138 4.43,11.093C4.248,10.976 4.083,10.835 3.938,10.675C3.838,10.566 3.75,10.447 3.656,10.333C3.621,10.291 3.6,10.236 3.54,10.215C3.6,10.427 3.692,10.629 3.815,10.812C3.875,10.904 3.946,10.988 4.011,11.077C4.074,11.163 4.193,11.192 4.245,11.303C4.217,11.306 4.199,11.313 4.185,11.309C4.111,11.292 4.038,11.273 3.965,11.252C3.466,11.108 3.02,10.824 2.678,10.433C2.243,9.946 2.022,9.357 1.968,8.71C1.937,8.357 1.941,8.002 1.982,7.65C2.054,7.048 2.202,6.464 2.432,5.905C2.587,5.529 2.77,5.164 2.958,4.803C3.163,4.41 3.424,4.053 3.723,3.727C4.235,3.168 4.827,2.703 5.449,2.279C6.166,1.789 6.927,1.381 7.726,1.046C8.244,0.828 8.767,0.632 9.31,0.494C9.965,0.328 10.62,0.164 11.292,0.079C11.521,0.049 11.75,0.021 11.98,0.009L11.981,0.009ZM10.134,22.829C10.064,22.889 9.987,22.94 9.927,23.009C9.689,23.279 9.463,23.558 9.259,23.878L9.215,23.986C9.251,23.977 9.284,23.957 9.308,23.929C9.482,23.739 9.659,23.551 9.827,23.355C9.931,23.233 10.022,23.1 10.115,22.969C10.139,22.935 10.145,22.889 10.161,22.849L10.134,22.829ZM11.784,19.134C11.551,19.314 11.332,19.512 11.131,19.727L10.761,20.113C10.657,20.225 10.528,20.311 10.384,20.363C10.235,20.42 10.077,20.45 9.917,20.453C9.873,20.453 9.83,20.459 9.766,20.465C9.794,20.523 9.809,20.562 9.83,20.596C9.98,20.838 10.131,21.078 10.28,21.32C10.416,21.54 10.556,21.758 10.679,21.986C10.747,22.111 10.784,22.253 10.835,22.39C10.912,22.417 10.975,22.372 11.037,22.342C11.327,22.207 11.616,22.068 11.904,21.93C12.117,21.829 12.341,21.744 12.54,21.62C12.887,21.405 13.22,21.165 13.558,20.935C13.573,20.925 13.584,20.907 13.6,20.889C13.577,20.87 13.562,20.852 13.544,20.845C13.257,20.734 13.017,20.545 12.774,20.363C12.597,20.234 12.428,20.093 12.268,19.943C12.085,19.758 11.945,19.535 11.858,19.29C11.839,19.241 11.813,19.195 11.783,19.134L11.784,19.134ZM5.937,19.398C5.877,19.494 5.84,19.592 5.805,19.691C5.679,20.057 5.491,20.399 5.25,20.701C5.05,20.951 4.795,21.113 4.488,21.194C4.258,21.254 4.024,21.27 3.788,21.264C3.74,21.262 3.691,21.266 3.63,21.269C3.646,21.309 3.651,21.335 3.665,21.354C3.765,21.499 3.895,21.6 4.065,21.649C4.222,21.695 4.381,21.683 4.563,21.672C4.744,21.635 4.906,21.557 5.048,21.438C5.286,21.239 5.45,20.984 5.584,20.706C5.759,20.343 5.848,19.955 5.926,19.562C5.936,19.509 5.934,19.452 5.937,19.398ZM20.882,14.812C20.89,14.841 20.898,14.869 20.909,14.919C20.933,15.074 20.96,15.229 20.981,15.383C21.011,15.602 21.048,15.82 21.059,16.04C21.076,16.384 21.086,16.729 21.045,17.073C21.008,17.388 20.982,17.706 20.929,18.019C20.842,18.543 20.687,19.053 20.469,19.537C20.461,19.555 20.459,19.576 20.449,19.619C20.496,19.589 20.526,19.577 20.547,19.555C20.632,19.472 20.717,19.388 20.795,19.3C21.066,18.995 21.253,18.64 21.391,18.257C21.571,17.759 21.619,17.246 21.536,16.726C21.433,16.076 21.206,15.463 20.939,14.845C20.931,14.827 20.923,14.808 20.915,14.79L20.882,14.812ZM5.797,8.29C5.787,8.342 5.794,8.395 5.815,8.443C5.939,8.694 6.065,8.944 6.194,9.193C6.219,9.242 6.26,9.283 6.224,9.356C5.94,9.416 5.646,9.475 5.344,9.611C5.403,9.649 5.441,9.671 5.476,9.698C5.518,9.73 5.588,9.756 5.566,9.818C5.556,9.851 5.491,9.866 5.449,9.89C5.466,9.9 5.492,9.911 5.516,9.926C5.682,10.028 5.846,10.133 5.963,10.294C6.101,10.486 6.192,10.698 6.151,10.938C6.072,11.407 5.845,11.788 5.461,12.07C5.407,12.11 5.355,12.153 5.3,12.192C5.22,12.246 5.18,12.342 5.197,12.437C5.207,12.504 5.225,12.57 5.252,12.632C5.335,12.828 5.472,12.982 5.627,13.124C5.71,13.2 5.786,13.288 5.849,13.381C5.926,13.492 5.935,13.637 5.874,13.758C5.851,13.808 5.824,13.857 5.798,13.906C5.768,13.966 5.77,14.017 5.82,14.068C5.861,14.11 5.9,14.157 5.932,14.206C5.97,14.264 6.01,14.285 6.079,14.256C6.186,14.215 6.304,14.213 6.412,14.25C6.572,14.296 6.714,14.376 6.856,14.46C6.986,14.537 7.12,14.609 7.256,14.679C7.323,14.714 7.396,14.729 7.475,14.705C7.546,14.683 7.599,14.715 7.62,14.781C7.64,14.845 7.617,14.889 7.546,14.92C7.476,14.95 7.409,14.983 7.337,15.008C7.237,15.043 7.136,15.081 7.023,15.085C7.01,14.978 7.133,14.997 7.15,14.926C6.944,14.8 6.507,14.781 6.349,14.892C6.412,15.004 6.384,15.102 6.253,15.205C6.123,15.105 6.228,15.003 6.255,14.905C6.241,14.902 6.227,14.901 6.212,14.901C6.11,14.901 6.023,14.975 6.006,15.075C5.991,15.176 6.073,15.291 6.184,15.299C6.292,15.306 6.402,15.294 6.51,15.287C6.57,15.282 6.63,15.26 6.709,15.287C6.606,15.41 6.461,15.414 6.352,15.477C6.354,15.527 6.422,15.563 6.371,15.608C6.318,15.656 6.276,15.607 6.239,15.578C6.159,15.515 6.079,15.452 6.008,15.381C5.918,15.301 5.862,15.19 5.851,15.07C5.847,15.011 5.832,14.952 5.808,14.898C5.776,14.824 5.776,14.761 5.841,14.708C5.823,14.678 5.813,14.655 5.796,14.636C5.71,14.525 5.644,14.4 5.6,14.267C5.547,14.13 5.554,14.003 5.648,13.886C5.672,13.856 5.698,13.826 5.712,13.791C5.735,13.737 5.751,13.681 5.759,13.623C5.776,13.458 5.695,13.336 5.577,13.236C5.391,13.08 5.217,12.914 5.117,12.685C5.112,12.674 5.093,12.668 5.08,12.659C5.069,12.676 5.056,12.686 5.055,12.697C5.036,12.882 5.01,13.067 5.003,13.254C4.989,13.631 5.061,13.997 5.165,14.358C5.283,14.768 5.454,15.156 5.653,15.531C5.92,16.033 6.19,16.533 6.465,17.031C6.52,17.129 6.595,17.22 6.673,17.301C6.871,17.503 7.125,17.573 7.397,17.574C7.599,17.574 7.801,17.568 8.002,17.548C8.297,17.518 8.592,17.475 8.886,17.435C9.069,17.41 9.251,17.378 9.434,17.355C9.644,17.329 9.814,17.428 9.956,17.565C10.116,17.721 10.261,17.892 10.403,18.065C10.623,18.33 10.8,18.625 10.957,18.932C11.007,19.03 11.027,19.032 11.104,18.962C11.234,18.841 11.364,18.72 11.498,18.602C11.565,18.543 11.586,18.482 11.565,18.389C11.507,18.128 11.478,17.861 11.48,17.593C11.482,17.436 11.486,17.279 11.498,17.122C11.513,16.898 11.528,16.672 11.558,16.45C11.664,15.682 11.784,14.916 11.92,14.152C12.007,13.659 12.102,13.168 12.188,12.675C12.248,12.328 12.306,11.981 12.35,11.632C12.384,11.359 12.405,11.082 12.413,10.807C12.424,10.475 12.416,10.142 12.415,9.809C12.415,9.732 12.419,9.654 12.405,9.579C12.377,9.437 12.395,9.424 12.243,9.389C12.043,9.343 11.84,9.307 11.636,9.282C11.49,9.264 11.429,9.229 11.415,9.092C11.409,9.043 11.39,8.994 11.374,8.946C11.365,8.921 11.35,8.898 11.328,8.856L11.303,9.12C11.294,9.216 11.274,9.236 11.176,9.235C11.121,9.235 11.066,9.227 11.012,9.227C10.536,9.227 10.06,9.219 9.586,9.259C9.491,9.267 9.413,9.244 9.36,9.156C9.32,9.09 9.272,9.03 9.226,8.97C9.163,8.886 9.14,8.877 9.044,8.91C8.849,8.978 8.656,9.048 8.462,9.12C8.219,9.218 7.992,9.351 7.787,9.514C7.691,9.59 7.581,9.647 7.464,9.682C7.431,9.692 7.394,9.69 7.337,9.695C7.357,9.629 7.361,9.581 7.384,9.545C7.448,9.44 7.519,9.34 7.589,9.239C7.612,9.206 7.638,9.176 7.662,9.144L7.647,9.121L7.446,9.158C7.3,9.198 7.15,9.228 7.009,9.28C6.861,9.333 6.743,9.303 6.623,9.208C6.341,8.984 6.094,8.719 5.89,8.422L5.797,8.29ZM14.389,17.253L14.242,17.343C14.022,17.477 13.802,17.609 13.583,17.745C13.49,17.803 13.399,17.865 13.313,17.933C13.228,18.003 13.189,18.094 13.241,18.205C13.288,18.305 13.334,18.405 13.388,18.499C13.435,18.579 13.512,18.637 13.601,18.646C13.711,18.656 13.829,18.658 13.937,18.634C14.154,18.584 14.309,18.429 14.465,18.277C14.553,18.201 14.587,18.08 14.552,17.969C14.506,17.789 14.473,17.604 14.434,17.422C14.423,17.37 14.407,17.319 14.389,17.253ZM14.132,14.844C14.012,15.135 13.927,15.441 13.807,15.754C13.656,16.187 13.513,16.624 13.372,17.077C13.408,17.067 13.426,17.067 13.439,17.059C13.7,16.899 13.961,16.735 14.224,16.575C14.278,16.542 14.295,16.497 14.289,16.437C14.277,16.307 14.265,16.175 14.255,16.044L14.187,15.158C14.179,15.055 14.167,14.952 14.158,14.848C14.149,14.848 14.141,14.846 14.132,14.844ZM17.213,6.714L17.312,6.999C17.392,7.23 17.471,7.462 17.552,7.713L18.132,9.665C18.319,10.295 18.504,10.927 18.69,11.558C18.804,11.94 18.925,12.32 19.033,12.704C19.105,12.961 19.159,13.223 19.219,13.503C19.263,13.709 19.306,13.916 19.346,14.143C19.38,14.249 19.369,14.369 19.423,14.468L19.448,14.462L19.38,14.1C19.342,13.894 19.303,13.688 19.267,13.462C19.252,13.392 19.238,13.321 19.221,13.251C19.126,12.855 19.044,12.455 18.931,12.064C18.735,11.379 18.518,10.7 18.313,10.018C18.148,9.469 17.991,8.918 17.825,8.37C17.756,8.143 17.675,7.92 17.599,7.675L17.482,7.339C17.445,7.232 17.407,7.123 17.367,7.017C17.327,6.911 17.283,6.807 17.24,6.703C17.231,6.706 17.222,6.71 17.213,6.713L17.213,6.714ZM6.225,14.304C6.162,14.303 6.11,14.318 6.091,14.387C6.21,14.479 6.376,14.484 6.501,14.399C6.41,14.364 6.318,14.333 6.225,14.304ZM5.23,11.98C5.204,11.953 5.173,11.932 5.155,11.982C5.143,12.014 5.148,12.052 5.145,12.095C5.227,12.058 5.227,12.058 5.23,11.98ZM5.292,10.791C5.256,10.797 5.225,10.817 5.204,10.847C5.185,10.88 5.176,10.919 5.179,10.957C5.184,11.109 5.189,11.263 5.205,11.414C5.216,11.49 5.238,11.563 5.271,11.632C5.332,11.768 5.428,11.799 5.559,11.733C5.614,11.706 5.619,11.679 5.584,11.623C5.539,11.554 5.496,11.483 5.455,11.412C5.44,11.344 5.389,11.281 5.422,11.205C5.462,11.115 5.346,11.089 5.348,11.015L5.348,10.874C5.345,10.836 5.342,10.787 5.292,10.791ZM5.275,9.823C5.11,9.82 4.948,9.864 4.808,9.95C4.732,9.995 4.724,10.02 4.758,10.108C4.792,10.195 4.828,10.281 4.873,10.362C4.937,10.479 4.963,10.487 5.083,10.439C5.188,10.392 5.304,10.374 5.419,10.386C5.621,10.408 5.776,10.522 5.923,10.65L6.015,10.727C6.022,10.721 6.029,10.714 6.037,10.709C6.018,10.604 6.002,10.483 5.888,10.445C5.731,10.392 5.564,10.37 5.38,10.328L5.14,10.323C5.38,10.154 5.592,10.279 5.827,10.332C5.764,10.217 5.674,10.185 5.597,10.139C5.515,10.089 5.427,10.047 5.347,9.995C5.287,9.958 5.227,9.915 5.275,9.823ZM15.508,10.148C15.278,10.138 15.081,10.228 14.9,10.359C14.866,10.385 14.84,10.424 14.795,10.476C14.882,10.502 14.945,10.522 15.027,10.541C15.071,10.526 15.115,10.511 15.157,10.495C15.463,10.381 15.767,10.38 16.061,10.526C16.187,10.589 16.298,10.566 16.427,10.521C16.407,10.49 16.397,10.467 16.382,10.45C16.26,10.32 16.105,10.226 15.934,10.177C15.794,10.133 15.65,10.153 15.508,10.147L15.508,10.148ZM7.99,6.483C7.981,6.527 7.982,6.572 7.992,6.616C8.072,6.937 8.148,7.259 8.234,7.578C8.338,7.965 8.504,8.328 8.69,8.681C8.71,8.718 8.751,8.761 8.788,8.768C8.876,8.779 8.965,8.761 9.041,8.717L8.569,7.877C8.339,7.429 8.164,6.957 7.99,6.483ZM10.397,0.497C10.197,0.489 9.992,0.501 9.794,0.531C9.558,0.566 9.324,0.618 9.094,0.683C8.807,0.763 8.525,0.863 8.242,0.956C8.202,0.969 8.168,0.994 8.132,1.014C8.16,1.028 8.182,1.032 8.202,1.028C8.489,0.96 8.782,0.943 9.075,0.938C9.209,0.936 9.344,0.947 9.477,0.963C9.667,0.987 9.859,1.011 10.047,1.053C10.503,1.157 10.921,1.353 11.312,1.609C11.776,1.915 12.2,2.269 12.569,2.687C12.774,2.919 12.964,3.162 13.129,3.426C13.299,3.7 13.444,3.987 13.578,4.282C13.851,4.883 14.034,5.514 14.178,6.158C14.218,6.331 14.248,6.506 14.278,6.682C14.295,6.786 14.343,6.849 14.448,6.872C14.57,6.9 14.648,6.977 14.668,7.123C14.665,7.225 14.608,7.297 14.539,7.363C14.425,7.462 14.334,7.584 14.271,7.721C14.302,7.716 14.331,7.703 14.354,7.682C14.434,7.596 14.516,7.51 14.589,7.417C14.668,7.323 14.713,7.206 14.719,7.084C14.728,7.034 14.741,6.984 14.743,6.934C14.75,6.81 14.726,6.784 14.6,6.766C14.575,6.762 14.551,6.752 14.527,6.751C14.445,6.744 14.402,6.688 14.39,6.62C14.357,6.422 14.386,6.265 14.637,6.212C14.723,6.194 14.811,6.182 14.897,6.17C15.055,6.147 15.212,6.117 15.37,6.103C15.51,6.091 15.56,6.136 15.596,6.27C15.604,6.299 15.614,6.327 15.617,6.357C15.636,6.536 15.609,6.582 15.476,6.645C15.449,6.658 15.421,6.669 15.398,6.687C15.375,6.704 15.357,6.727 15.347,6.754C15.308,6.898 15.42,7.136 15.553,7.199L16.226,7.519C16.249,7.53 16.276,7.534 16.301,7.542L16.319,7.516C16.304,7.508 16.287,7.503 16.275,7.492C16.109,7.361 15.926,7.253 15.731,7.172C15.674,7.146 15.616,7.121 15.558,7.097C15.481,7.065 15.431,6.989 15.432,6.906C15.429,6.821 15.477,6.752 15.56,6.719L15.619,6.694C15.718,6.65 15.737,6.618 15.731,6.507C15.73,6.486 15.727,6.465 15.723,6.444C15.656,6.15 15.6,5.854 15.518,5.564C15.323,4.856 15.045,4.172 14.692,3.528C14.324,2.859 13.855,2.25 13.302,1.723C12.956,1.388 12.559,1.109 12.125,0.899C11.804,0.741 11.462,0.63 11.109,0.571C10.873,0.533 10.636,0.508 10.397,0.497ZM17.116,6.452C17.126,6.466 17.134,6.48 17.154,6.486L17.132,6.442L17.116,6.452ZM4.103,3.917C4.094,3.924 4.084,3.928 4.073,3.929C4.06,3.943 4.047,3.956 4.033,3.968C4.023,3.978 4.013,3.988 3.988,4.008L3.625,4.362C3.537,4.447 3.455,4.54 3.359,4.615C3.075,4.835 2.934,5.145 2.815,5.47C2.806,5.493 2.804,5.517 2.808,5.541C2.821,5.596 2.841,5.649 2.86,5.709L2.934,5.735C2.917,5.791 2.904,5.84 2.887,5.887C2.829,6.051 2.769,6.214 2.712,6.378C2.707,6.393 2.72,6.414 2.731,6.455C2.811,6.28 2.889,6.125 2.956,5.966C3.184,5.422 3.44,4.892 3.775,4.405C3.865,4.272 3.957,4.139 4.058,4.004C4.062,3.998 4.065,3.991 4.08,3.974C4.081,3.958 4.083,3.942 4.095,3.934L4.103,3.917ZM17.079,6.325C17.085,6.33 17.088,6.337 17.088,6.344C17.086,6.347 17.084,6.351 17.082,6.354C17.084,6.361 17.086,6.367 17.089,6.374L17.107,6.396C17.109,6.389 17.114,6.38 17.112,6.375C17.109,6.365 17.1,6.357 17.092,6.337C17.088,6.333 17.083,6.329 17.079,6.325ZM4.199,4.48C4.196,4.484 4.191,4.488 4.172,4.494C4.167,4.507 4.161,4.519 4.141,4.541C4.102,4.599 4.061,4.654 4.017,4.708C3.969,4.778 3.901,4.763 3.836,4.749C3.702,4.721 3.608,4.765 3.549,4.892C3.46,5.079 3.362,5.262 3.276,5.452C3.227,5.56 3.166,5.668 3.158,5.812C3.239,5.815 3.312,5.819 3.386,5.82L3.614,5.82C3.592,5.909 3.566,5.997 3.535,6.084C3.525,6.136 3.513,6.187 3.502,6.239L3.522,6.243C3.54,6.197 3.559,6.151 3.589,6.09C3.655,5.948 3.719,5.805 3.789,5.664C3.809,5.624 3.823,5.564 3.905,5.572C3.905,5.615 3.909,5.656 3.905,5.696C3.9,5.741 3.888,5.786 3.877,5.839C4.018,5.882 3.963,6.013 3.992,6.108C4.094,6.086 4.096,5.913 4.24,5.964L4.24,6.169L4.257,6.171L4.696,5.112C4.566,5.112 4.45,5.092 4.338,5.145C4.314,5.156 4.28,5.144 4.23,5.141C4.305,4.991 4.369,4.863 4.441,4.724C4.447,4.711 4.456,4.698 4.466,4.688C4.466,4.673 4.465,4.658 4.474,4.65L4.48,4.63C4.475,4.636 4.47,4.641 4.452,4.647C4.448,4.659 4.443,4.671 4.426,4.692C4.419,4.706 4.407,4.717 4.394,4.725C4.271,4.882 4.304,4.889 4.136,4.831C4.057,4.804 4.058,4.803 4.089,4.687C4.117,4.641 4.145,4.594 4.187,4.537C4.187,4.521 4.186,4.505 4.194,4.495L4.2,4.48L4.199,4.48ZM6.272,3.81C6.269,3.816 6.265,3.821 6.245,3.826C6.151,3.951 6.051,4.072 5.965,4.203C5.81,4.441 5.664,4.684 5.514,4.926C5.374,5.15 5.169,5.294 4.939,5.407C4.922,5.415 4.899,5.413 4.86,5.418C4.872,5.359 4.876,5.309 4.893,5.265C4.961,5.089 5.038,4.916 5.122,4.747L5.115,4.727C5.105,4.737 5.093,4.746 5.08,4.752C5.052,4.802 5.025,4.852 4.987,4.916C4.727,5.34 4.544,5.733 4.545,5.866C4.569,5.87 4.593,5.877 4.618,5.879C4.795,5.892 4.806,5.886 4.878,5.714C4.908,5.644 4.955,5.594 5.025,5.564L5.2,5.494C5.244,5.476 5.285,5.437 5.346,5.462C5.349,5.512 5.336,5.572 5.36,5.607C5.402,5.669 5.404,5.732 5.407,5.8C5.409,5.849 5.424,5.898 5.433,5.947C5.462,5.913 5.472,5.882 5.483,5.85C5.625,5.46 5.76,5.068 5.911,4.68C6.011,4.424 6.131,4.176 6.241,3.924C6.254,3.894 6.254,3.857 6.271,3.832L6.271,3.81L6.272,3.81ZM10.259,3.47C10.259,3.515 10.269,3.554 10.28,3.593C10.322,3.753 10.374,3.911 10.404,4.073C10.428,4.206 10.427,4.343 10.432,4.479C10.432,4.512 10.413,4.546 10.4,4.589C10.306,4.531 10.353,4.431 10.294,4.374L10.169,4.374C10.154,4.446 10.159,4.526 10.123,4.574C10.057,4.659 9.968,4.728 9.887,4.801C9.844,4.839 9.809,4.819 9.784,4.776L9.738,4.689C9.673,4.724 9.621,4.758 9.566,4.782C9.45,4.833 9.331,4.877 9.216,4.929C9.131,4.967 9.126,4.982 9.146,5.076C9.16,5.151 9.18,5.224 9.193,5.299C9.206,5.371 9.243,5.408 9.316,5.423C9.549,5.473 9.778,5.538 9.973,5.688C10.031,5.586 10.031,5.586 10.141,5.537C10.171,5.523 10.201,5.507 10.233,5.495C10.313,5.465 10.348,5.478 10.383,5.555C10.406,5.603 10.424,5.653 10.449,5.713C10.509,5.573 10.407,5.446 10.466,5.297C10.623,5.477 10.706,5.687 10.841,5.864C10.855,5.833 10.863,5.8 10.863,5.766C10.865,5.642 10.863,5.519 10.865,5.395C10.865,5.361 10.878,5.328 10.885,5.295L10.917,5.292C11.027,5.447 11.047,5.646 11.143,5.812C11.148,5.681 11.145,5.55 11.133,5.42C11.129,5.375 11.133,5.346 11.183,5.332C11.263,5.368 11.299,5.472 11.398,5.49C11.368,5.215 10.975,4.353 10.6,3.855C10.486,3.728 10.4,3.575 10.26,3.469L10.259,3.47ZM7.592,4.166C7.573,4.2 7.562,4.216 7.555,4.233C7.494,4.418 7.43,4.603 7.375,4.789C7.344,4.894 7.288,4.958 7.18,4.979C7.09,4.998 7.002,5.031 6.912,5.052C6.874,5.061 6.823,5.067 6.794,5.049C6.77,5.033 6.769,4.98 6.758,4.943C6.694,5.019 6.676,5.03 6.588,4.99C6.455,4.928 6.326,4.855 6.195,4.789C6.147,4.764 6.102,4.726 6.025,4.759C5.982,4.879 5.934,5.009 5.888,5.141C5.789,5.421 5.801,5.383 5.983,5.594C6.029,5.642 6.085,5.624 6.137,5.617C6.191,5.608 6.243,5.587 6.297,5.581C6.427,5.568 6.557,5.501 6.664,5.566C6.868,5.502 7.051,5.444 7.235,5.388C7.285,5.373 7.324,5.393 7.349,5.442C7.371,5.484 7.383,5.535 7.431,5.563C7.469,5.507 7.418,5.435 7.494,5.385L7.634,5.626L7.592,4.166ZM7.87,4.524C7.774,4.514 7.763,4.534 7.76,4.632C7.758,4.67 7.757,4.71 7.762,4.747C7.792,4.947 7.861,5.133 7.936,5.317C7.938,5.323 7.948,5.327 7.958,5.332L8.036,5.282C8.088,5.318 8.117,5.37 8.189,5.37C8.394,5.368 8.599,5.384 8.805,5.382C8.904,5.381 8.963,5.424 9.01,5.502C9.028,5.532 9.034,5.579 9.098,5.568L9.018,5.174C8.968,4.979 8.933,4.779 8.846,4.585C8.789,4.642 8.732,4.653 8.666,4.631C8.622,4.617 8.577,4.608 8.531,4.603C8.311,4.575 8.091,4.544 7.871,4.523L7.87,4.524ZM18.124,2.797C18.213,2.96 18.279,3.113 18.263,3.288C18.247,3.456 18.289,3.63 18.219,3.804C18.172,3.771 18.131,3.722 18.107,3.729C17.99,3.764 17.943,3.672 17.88,3.614C17.781,3.521 17.685,3.425 17.594,3.324L17.49,3.211C17.482,3.217 17.475,3.224 17.467,3.23C17.502,3.276 17.537,3.323 17.577,3.386C17.617,3.45 17.661,3.513 17.699,3.579C17.733,3.637 17.764,3.697 17.73,3.784C17.648,3.774 17.566,3.765 17.484,3.752C17.424,3.742 17.383,3.752 17.36,3.822C17.329,3.92 17.323,3.918 17.21,3.912C17.23,3.954 17.246,3.992 17.267,4.028C17.308,4.102 17.297,4.166 17.237,4.224C17.177,4.284 17.119,4.346 17.059,4.405C17.012,4.455 16.939,4.474 16.874,4.451C16.652,4.39 16.427,4.338 16.204,4.277C16.172,4.268 16.141,4.237 16.118,4.209C16.088,4.169 16.066,4.122 16.038,4.079C15.994,4.009 15.948,3.941 15.902,3.872C15.887,3.905 15.882,3.941 15.888,3.977C15.9,4.104 15.918,4.23 15.923,4.357C15.928,4.457 15.899,4.477 15.802,4.461C15.698,4.444 15.596,4.421 15.492,4.403C15.428,4.391 15.361,4.375 15.29,4.433L15.371,4.641C15.461,4.641 15.537,4.631 15.608,4.643C15.784,4.674 15.945,4.763 16.066,4.894C16.144,4.977 16.22,5.062 16.307,5.154L16.325,5.149C16.321,5.143 16.317,5.136 16.315,5.109C16.329,5.053 16.253,4.991 16.333,4.931C16.364,4.961 16.397,4.988 16.421,5.021C16.479,5.099 16.532,5.18 16.59,5.278L16.679,5.419L16.703,5.406C16.561,5.095 16.418,4.783 16.276,4.472C16.331,4.479 16.359,4.479 16.384,4.488C16.577,4.558 16.769,4.63 16.961,4.704C17.035,4.732 17.108,4.764 17.18,4.798C17.242,4.826 17.292,4.816 17.337,4.765C17.387,4.709 17.439,4.653 17.491,4.598C17.541,4.547 17.586,4.552 17.623,4.612C17.639,4.637 17.649,4.665 17.663,4.692C17.734,4.83 17.806,4.969 17.88,5.125L18.039,5.433L18.064,5.422C18.02,5.316 17.994,5.204 17.926,5.088C17.869,4.906 17.758,4.742 17.72,4.543C17.856,4.577 18.082,4.869 18.287,5.275L18.344,5.349L18.362,5.338C18.343,5.296 18.325,5.254 18.31,5.211C18.264,5.066 18.213,4.921 18.174,4.775C18.152,4.692 18.138,4.602 18.196,4.515L18.305,4.573L18.279,4.366L18.306,4.35C18.328,4.37 18.356,4.386 18.371,4.41C18.444,4.518 18.514,4.63 18.586,4.74C18.596,4.756 18.615,4.769 18.629,4.783C18.593,4.566 18.429,4.403 18.4,4.157L18.555,4.269C18.569,4.103 18.567,3.95 18.597,3.804C18.629,3.646 18.574,3.507 18.534,3.359C18.558,3.363 18.57,3.365 18.589,3.384C18.681,3.508 18.772,3.633 18.866,3.755C18.886,3.782 18.916,3.802 18.935,3.842L18.975,3.905L18.994,3.89C18.972,3.866 18.954,3.838 18.941,3.808C18.829,3.646 18.718,3.483 18.609,3.318C18.388,3.007 18.246,2.851 18.124,2.797ZM11.554,3.124C11.551,3.285 11.646,3.399 11.623,3.539L11.255,3.626C11.345,3.765 11.287,3.863 11.203,3.957C11.153,4.014 11.111,4.079 11.06,4.135C11.023,4.175 11.014,4.213 11.042,4.261L11.202,4.536C11.231,4.584 11.274,4.602 11.33,4.6C11.406,4.597 11.482,4.6 11.558,4.599C11.674,4.596 11.774,4.621 11.833,4.736C11.839,4.75 11.853,4.76 11.877,4.788C11.881,4.729 11.874,4.69 11.887,4.658C11.903,4.618 11.927,4.559 11.959,4.55C12.043,4.527 12.132,4.526 12.219,4.52C12.232,4.519 12.246,4.538 12.259,4.549L12.33,4.614C12.349,4.504 12.248,4.416 12.306,4.304L12.432,4.344C12.406,4.221 12.362,4.099 12.361,3.978C12.361,3.855 12.412,3.735 12.476,3.618C12.583,3.68 12.636,3.774 12.71,3.871C12.893,4.136 13.07,4.404 13.204,4.705C13.369,4.627 13.474,4.773 13.611,4.793C13.608,4.687 13.478,4.352 13.414,4.301C13.385,4.279 13.348,4.269 13.312,4.273C13.252,4.284 13.193,4.312 13.121,4.336C13.096,4.297 13.065,4.258 13.044,4.214C12.917,3.936 12.759,3.673 12.571,3.431C12.495,3.337 12.411,3.249 12.343,3.171L11.952,3.456C11.903,3.491 11.858,3.486 11.82,3.439L11.651,3.232C11.626,3.202 11.598,3.173 11.554,3.124Z" style={{ fill: "white" }} /></g></g></svg></span>
                  <span><b>Hermes</b><small>linkedgrow mcp</small></span></div>
                <div className="chatbody">
                  <div className="bub me">Keep my pipeline full. Check for new leads daily and prep replies for anyone who answers</div>
                  <div className="bub it">Running. <b>Eleven new leads</b> since yesterday, three replies waiting, and Thursday's post is drafted and queued.</div>
                </div>
                <div className="mrun"><i></i>one endpoint · every write is reversible from the dashboard</div>
              </div>
            </div>
          </div>

          <div className="mcpfoot rv">
            <p>One endpoint per workspace, one setting to paste, about two minutes. Nothing publishes and nothing sends on its own: every write lands as something you can read and cancel in the dashboard.</p>
            <a className="fill lg" href="#pricing">Included on Pro
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
          </div>
        </div>
      </section>

      {/*═══ 7. GARDE ANTI-SLOP ═══*/}
      <section className="sec">
        <div className="wrap">
          <div className="sh rv" style={{ maxWidth: "920px" }}><span className="bul"></span>
            <div><h2>A message that sounds like AI <em>never leaves the building.</em></h2>
              <p className="lead" style={{ marginTop: "18px" }}>Before anything sends, a programmatic gate reads the draft and rejects it if it smells like a machine. Not a polite instruction inside a prompt, an actual gate. It fails, it gets rewritten, and after four attempts we skip the lead rather than send you something mediocre.</p></div></div>
          <div className="ba stag">
            <div className="msg bad">
              <span className="tg">Rejected by the gate</span>
              <div className="bd">Hi Sarah, <s>I saw your post</s> about outreach and it really <s>resonated</s>. <s>I'd love to connect</s> and <s>leverage</s> our shared interest in <s>the LinkedIn automation space</s> to <s>explore synergies</s>.</div>
              <div className="rej"><span>generic opener</span><span>banned: resonated</span><span>banned: leverage</span>
                <span>headline parroting</span><span>no real signal</span></div>
              <div className="why">Every tool on the market sends this exact shape. Your prospect deleted four of them this week without finishing the first line.</div>
            </div>
            <div className="msg good">
              <span className="tg">Passed, and sent</span>
              <div className="bd">Hi Sarah, your line about templates being the reason people stopped answering is the thing I keep arguing about. We went the other way and write from the comment rather than the headline. Curious how you handle it at Northline.<br /><br />Nicolas</div>
              <div className="why">Built from her actual comment. No product name, no link, no pitch anywhere in it. That is the whole reason it gets an answer.</div>
            </div>
          </div>
        </div>
      </section>

      {/*═══ 8. SÉCURITÉ ═══*/}
      <section className="sec dark" id="safety">
        <span className="spot" id="spot"></span>
        <div className="wrap">
          <div className="rv" style={{ maxWidth: "780px", marginBottom: "46px", position: "relative", zIndex: "1" }}>
            <span className="eb"><i></i>Hard limits, on every plan</span>
            <h2 style={{ marginTop: "20px" }}>Rules the agent <em>cannot break.</em></h2>
            <p className="lead" style={{ marginTop: "18px" }}>Speed is what gets LinkedIn accounts restricted, so the agent is built around restraint you can watch working. Every safety signal sits on your dashboard rather than in a settings page nobody opens.</p>
          </div>
          <div className="sgrid">
            <div className="sc rv">
              <div className="hd"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l8 3.5v5.5c0 4.5-3.2 8-8 9.5-4.8-1.5-8-5-8-9.5V6.5z" /></svg><h3>One residential IP, yours alone</h3></div>
              <p>Your agent connects from a fixed residential address in your own country, reserved for your account for its whole life. To LinkedIn it looks like a person at home, one steady address with one routine.</p>
              <div className="ipchip"><span className="lamp"></span>
                <span><code>45.•••.•••.112 · Zurich, Switzerland</code>
                  <small>Dedicated residential · reserved for this account · never rotated</small></span></div>
            </div>
            <div className="sc rv">
              <div className="hd"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20V10M10 20V5M16 20v-8M22 20V8" /></svg><h3>Four weeks of warm-up, enforced</h3></div>
              <p>New agents start with a handful of actions a day and earn their pace across a month, exactly like a person new to outreach would. You cannot skip it, and that is precisely the point.</p>
              <div className="bars">
                <div><b>8/day</b><i style={{ "--h": "32%" } as React.CSSProperties}></i><span>WEEK 1</span></div>
                <div><b>15/day</b><i style={{ "--h": "60%" } as React.CSSProperties}></i><span>WEEK 2</span></div>
                <div><b>21/day</b><i style={{ "--h": "84%" } as React.CSSProperties}></i><span>WEEK 3</span></div>
                <div><b>25/day</b><i style={{ "--h": "100%" } as React.CSSProperties}></i><span>WEEK 4</span></div>
              </div>
            </div>
            <div className="sc rv">
              <div className="hd"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg><h3>A calendar a human would keep</h3></div>
              <p>Business hours in your own time zone, gaps of forty to a hundred and twenty seconds between actions, no weekends and nothing at three in the morning. The rhythm is boring on purpose, because boring is what a normal professional looks like.</p>
              <div className="week">
                <div><u style={{ "--t": "24%", "--hh": "52%", "--dl": ".05s" } as React.CSSProperties}></u><span>MON</span></div>
                <div><u style={{ "--t": "20%", "--hh": "58%", "--dl": ".12s" } as React.CSSProperties}></u><span>TUE</span></div>
                <div><u style={{ "--t": "28%", "--hh": "46%", "--dl": ".19s" } as React.CSSProperties}></u><span>WED</span></div>
                <div><u style={{ "--t": "22%", "--hh": "56%", "--dl": ".26s" } as React.CSSProperties}></u><span>THU</span></div>
                <div><u style={{ "--t": "30%", "--hh": "42%", "--dl": ".33s" } as React.CSSProperties}></u><span>FRI</span></div>
                <div className="off"><u></u><span>SAT</span></div>
                <div className="off"><u></u><span>SUN</span></div>
              </div>
            </div>
            <div className="sc rv">
              <div className="hd"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="4" width="4.5" height="16" rx="1.4" /><rect x="14.5" y="4" width="4.5" height="16" rx="1.4" /></svg><h3>It stops at the first odd signal</h3></div>
              <p>A security prompt, an unusual response, a limit getting close: the agent stops, tells you exactly what it saw, and waits for you. Silence is the one thing it never does, because that is how people lose accounts.</p>
              <div className="alert">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.01" /></svg>
                <span><b>Agent paused · checkpoint detected</b>
                  <small>Nothing sent since 14:32. Waiting for you, and an email is already in your inbox.</small></span></div>
            </div>
          </div>
          <div className="hard">
            <div className="rv"><b>2</b><p>messages per person, maximum, on every sequence</p></div>
            <div className="rv" style={{ "--d0": ".07s" } as React.CSSProperties}><b>1</b><p>dedicated residential IP per LinkedIn account</p></div>
            <div className="rv" style={{ "--d0": ".14s" } as React.CSSProperties}><b>40-120<em>s</em></b><p>enforced gap between any two actions</p></div>
            <div className="rv" style={{ "--d0": ".21s" } as React.CSSProperties}><b>0</b><p>actions on weekends, public holidays included</p></div>
          </div>
          <p className="sfoot rv">No vendor can honestly promise LinkedIn will never ask questions. What we promise is conservative defaults, an agent that stops before you have to, and a health score you can check at any hour of the day.</p>
        </div>
      </section>

      {/*═══ 9. CONFIANCE ═══*/}
      <div className="trust">
        <div className="wrap">
          <div className="badges rv">
            <span className="badge"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l8 3.5v5.5c0 4.5-3.2 8-8 9.5-4.8-1.5-8-5-8-9.5V6.5z" /><path d="M9 12l2 2 4-4.5" /></svg>Credentials encrypted with AES-256-GCM</span>
            <span className="badge"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>Decrypted in memory only, never logged</span>
            <span className="badge"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 000 18M12 3a15 15 0 010 18" /></svg>Hosted in the EU, GDPR by design</span>
          </div>
          <p>Your LinkedIn login is the most valuable thing you hand us, and it is treated that way. <a href="#">Read exactly how it is stored</a></p>
        </div>
      </div>

      {/*═══ 10. TÉMOIGNAGES ═══*/}
      <section className="sec">
        <div className="wrap">
          <div className="sh rv" style={{ marginBottom: "44px" }}><span className="bul"></span><div><h2>They stopped chasing.</h2></div></div>
          <div className="three stag">
            <figure className="quote"><blockquote>Eleven replies in the first fortnight and I never opened the app once. What surprised me is that not a single message read like a robot had written it.</blockquote>
              <figcaption><span className="qav">TM</span><span><b>Thomas M.</b><small>Founder, team of 6</small></span></figcaption></figure>
            <figure className="quote"><blockquote>I got restricted once with another tool and stopped for a year. This is the first one that showed me the limits instead of hiding them, so I actually sleep now.</blockquote>
              <figcaption><span className="qav">CB</span><span><b>Camille B.</b><small>Agency owner</small></span></figcaption></figure>
            <figure className="quote"><blockquote>Clicking a lead and landing on the real comment they wrote is what sold me. No other tool has ever bothered to show me why it picked somebody.</blockquote>
              <figcaption><span className="qav">RD</span><span><b>Rui D.</b><small>Independent consultant</small></span></figcaption></figure>
          </div>
        </div>
      </section>

      {/*═══ 11. TARIFS ═══*/}
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

      {/*═══ 12. FAQ ═══*/}
      <section className="sec">
        <div className="wrap">
          <div className="faqwrap">
          <div className="faqside rv">
            <span className="eb"><i></i>Before you ask</span>
            <h2 style={{ marginTop: "20px" }}>The questions everybody asks first.</h2>
            <div className="askcard">
              <b>Still not sure it fits you?</b>
              <p>Send one line about what you sell and we will tell you honestly whether the agent has enough signal to work with. No call, no deck.</p>
              <a className="fill sm" href="mailto:contact@linkedgrow.ai">Email us directly
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
            </div>
          </div>
          <div className="faq rv" id="faq" style={{ "--d0": ".08s" } as React.CSSProperties}>
            <div className="q"><button><span className="ix">01</span>Will this get my LinkedIn account banned?<span className="pm">+</span></button>
              <div className="a"><p>Nobody in this category can honestly promise it never happens. What we do is start slow, keep human hours, give your account an address nobody else touches, and stop everything the second LinkedIn asks a question. All of it sits on your dashboard rather than hidden in a settings page, so you can watch the guardrails doing their job.</p></div></div>
            <div className="q"><button><span className="ix">02</span>Do I need to bring my own AI key?<span className="pm">+</span></button>
              <div className="a"><p>Not for the lead generation, which runs on our AI and is included in the price with no credits to run out of. If you also want it writing your posts, that half uses your own key, and that is exactly what keeps generation unlimited for a few dollars a month.</p></div></div>
            <div className="q"><button><span className="ix">03</span>What actually happens when somebody replies?<span className="pm">+</span></button>
              <div className="a"><p>The agent goes permanently silent for that person and emails you within the minute, with their reply, who they are, and the messages you had already sent, so the conversation makes sense without scrolling anywhere. From that point it is yours and the automation never speaks over you.</p></div></div>
            <div className="q"><button><span className="ix">04</span>How is this different from every other outreach tool?<span className="pm">+</span></button>
              <div className="a"><p>Three things, and all of them are checkable. Every lead shows you the real post it came from, so you can verify the reasoning yourself. Every message passes a gate that rejects AI-sounding writing before it is allowed to send. And the safety system is visible rather than buried, because your account is worth more than any single campaign.</p></div></div>
            <div className="q"><button><span className="ix">05</span>How long before I see something?<span className="pm">+</span></button>
              <div className="a"><p>Leads appear within the first hour. Invitations start the same day at a deliberately low volume, and the first replies usually land in the second week once warm-up has raised the pace. Anyone promising results on day two is skipping the part that keeps your account alive.</p></div></div>
            <div className="q"><button><span className="ix">06</span>Can I still use LinkedGrow for writing posts?<span className="pm">+</span></button>
              <div className="a"><p>Yes, and it is in every plan. The generator, the editor, the calendar, carousels and the hook library are all still there, trained on your voice, and they run on your own AI key. The agent handles the outbound half while the publishing half carries on exactly as it does today.</p></div></div>
          </div>
          </div>
        </div>
      </section>

      {/*═══ 13. CTA FINAL ═══*/}
      <section className="sec" style={{ paddingTop: "0" }}>
        <div className="wrap"><div className="finale rv">
          <div className="rings fin"><i></i><i></i><i></i></div>
          <div className="fininner">
            <span className="eb lt"><i></i>Twenty seconds, no card asked</span>
            <h2 style={{ marginTop: "22px" }}>See your buyers before<br />you spend anything.</h2>
            <p>Type your website. LinkedGrow comes back with your ideal customer, the competitors who share your audience, and the first real people worth talking to.</p>
            <form className="urlwrap" onSubmit={(e) => e.preventDefault()} style={{ marginTop: "32px" }}>
              <div className="urlbar">
                <span className="proto">https://</span>
                <input type="text" placeholder="yourcompany.com" aria-label="Your website" />
                <button className="fill" type="submit">Launch my agent for free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
              </div>
            </form>
            <div className="tr" style={{ marginTop: "30px" }}>
              <span className="avs" aria-hidden="true">
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person1.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person2.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person3.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person4.avif" alt="" loading="lazy" />
                <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person5.avif" alt="" loading="lazy" />
              </span>
              <span><b className="num">179+</b> founders already run their LinkedIn with LinkedGrow</span>
            </div>
          </div>
        </div></div>
      </section>

      {/*═══ FOOTER ═══*/}

    </div>
  );
}
