"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initV3Chrome } from "./chrome-effects";
import "./landing.css";

/**
 * The prototype's header, for every marketing page.
 *
 * The nav is part of the design rather than furniture around it: the pill that
 * forms on scroll, the progress bar, the logo that inverts over a dark hero.
 * Taken from the prototype unchanged, so a page that uses it looks like the
 * file that was signed off.
 *
 * `onDark` is for the home, whose hero is a dark field the nav sits directly
 * on. Every other page starts on white and gets the light treatment.
 */
export function V3Header({ onDark = false }: { onDark?: boolean }) {
  const { data: session, status } = useSession();
  // Until the session resolves, neither state is shown: rendering "Sign in" to
  // someone who is already signed in and then swapping it is worse than a beat
  // of nothing.
  const signedIn = status === "authenticated" && !!session?.user;

  useEffect(() => initV3Chrome(), []);

  return (
    <div className={onDark ? "v3 v3-chrome on-dark" : "v3 v3-chrome"}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true"><defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#00b8db" /><stop offset="1" stopColor="#155dfc" /></linearGradient>
        <symbol id="mark" viewBox="0 0 379 230"><path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z" /></symbol>
      </defs></svg>
    <div className="prog" id="prog"></div>

    {/*═══ NAV ═══*/}
    <div className="navhold" id="nh">
      <div className="nav">
        <a className="brand" href="#"><span className="tile w" id="tl"><svg><use href="#mark" /></svg></span>
          <span className="wm ob" id="wm">Linked<i>Grow</i></span></a>
        <nav className="nl">
          <a href="/features">Features</a><a href="/compare">Compare</a>
          <a href="/free-tools">Free Tools</a><a href="/blog">Blog</a><a href="/pricing">Pricing</a>
        </nav>
        <div className="sp"></div>
        {status === "loading" ? null : signedIn ? (
          <a className="fill sm desk" href="/dashboard">Go to dashboard
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
        ) : (
        <>
        <a className="btn gh desk" style={{ padding: "9px 15px", fontSize: "14px" }} href="/sign-in">Sign in</a>
        <a className="fill sm desk" href="/sign-up">Start for free
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
        </>
        )}
        <button className="burger" id="burger" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
      </div>
      <div className="mob" id="mob">
        <a href="/features">Features</a><a href="/compare">Compare</a><a href="/free-tools">Free Tools</a>
        <a href="/blog">Blog</a><a href="/pricing">Pricing</a>
        <div className="bs">
            {signedIn ? (
              <a className="btn grad" href="/dashboard">Go to dashboard</a>
            ) : (
              <>
                <a className="btn" href="/sign-in">Sign in</a>
                <a className="btn grad" href="/sign-up">Start free for 7 days</a>
              </>
            )}
          </div>
      </div>
    </div>
    </div>
  );
}
