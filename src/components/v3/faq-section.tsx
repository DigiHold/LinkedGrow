"use client";

import { useEffect } from "react";
import { initV3Faq } from "./faq-effects";
import "./landing.css";

/** The prototype's FAQ, reusable on any page that needs it. */
export function V3FaqSection() {
  useEffect(() => initV3Faq(), []);
  return (
    <div className="v3">
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
    </div>
  );
}
