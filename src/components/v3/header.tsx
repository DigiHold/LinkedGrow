"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { initV3Chrome } from "./chrome-effects";
import { DemoModal } from "./demo-modal";
import { V3_BLOCK } from "./root";

/**
 * The prototype's header, for every marketing page.
 *
 * The nav is part of the design rather than furniture around it: the pill that
 * forms on scroll, the progress bar, the logo that inverts over a dark hero.
 *
 * `onDark` is for the home, whose hero is a dark field the nav sits directly
 * on. Every other page starts on white and gets the light treatment.
 *
 * Styling is Tailwind. `v3-chrome`, `on-dark`, `fx`, `on`, and the four ids are
 * selector hooks for chrome-effects.js and carry nothing visual.
 */

/* The bar itself, and the formed state the scroll handler toggles with `fx`.
   At rest it sits below the 44px launch banner; once the scroll pins it, it
   docks to the viewport top and the banner scrolls away above it. */
const NAVHOLD =
  "navhold absolute left-0 right-0 top-11 z-[90] px-6 pt-4 [&.fx]:fixed [&.fx]:top-0 [&.fx]:pt-2.5";

/* The launch banner: 44px, in the page flow above the floating nav. One slow
   light sweep is the whole animation, enough to catch the eye once without
   nagging. */
const BANNER =
  "group relative z-[88] flex h-11 items-center justify-center overflow-hidden px-4 " +
  "[background:linear-gradient(96deg,#fbbf24,#f97316)]";
const NAV =
  "mx-auto flex max-w-[1180px] items-center gap-[22px] max-[1040px]:gap-2 rounded-[17px] border border-[rgba(255,255,255,.15)] bg-[rgba(255,255,255,.07)] " +
  "py-[9px] pl-4 pr-2.5 [backdrop-filter:blur(18px)_saturate(1.6)] [transition:.4s_var(--ease-v3)] " +
  "[.fx_&]:border-v3-line2 [.fx_&]:bg-[rgba(255,255,255,.93)] [.fx_&]:shadow-[0_18px_46px_-30px_rgba(6,9,17,.55)] " +
  "dark:[.fx_&]:border-v3-line-d dark:[.fx_&]:bg-[rgba(13,20,32,.82)]";

/* The desktop links, each with an underline that wipes in from the left. */
const NL = "flex gap-px max-[1040px]:hidden";
const NL_A =
  "relative inline-flex items-center rounded-[9px] px-[13px] py-2 text-[14.5px] font-medium text-[rgba(255,255,255,.8)] [transition:color_.22s]! " +
  "hover:text-white [.fx_&]:text-v3-ink2 dark:[.fx_&]:text-v3-ink2-d [.fx_&]:hover:text-v3-blue " +
  "after:absolute after:bottom-[5px] after:left-[13px] after:right-[13px] after:h-[1.5px] after:origin-left after:rounded-[2px] after:bg-current after:content-[''] " +
  "after:[transform:scaleX(0)] after:[transition:transform_.32s_var(--ease-v3)] hover:after:[transform:scaleX(1)]";

const BRAND = "group inline-flex items-center gap-2.5";
/* The brand mark, in both grounds.

   The state is derived from `fx` on the navhold, not from a class toggled onto
   the logo itself. chrome-effects.js used to add and remove `ob` here, and
   React put it straight back on the next render when the session resolved,
   which is why "Linked" stayed white on a white pill.

   An inner page is always in the formed state, so it takes the light variant
   outright and never flashes through the other one. */
const TILE_LIGHT_GROUND =
  "grid h-9 w-9 flex-none place-items-center rounded-[11px] " +
  "[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] shadow-[0_9px_22px_-10px_rgba(0,184,219,.65)] " +
  "[transition:transform_.24s_var(--ease-v3)] group-hover:[transform:rotate(-8deg)_scale(1.07)] " +
  "[&>svg]:h-5 [&>svg]:w-5 [&>svg]:fill-white";
/* Over a dark hero it starts as the white tile and becomes the gradient one
   once the nav forms. `.fx .CLASS` is two classes against one, so it wins on
   specificity rather than on the order Tailwind emits. */
const TILE_ON_DARK =
  "grid h-9 w-9 flex-none place-items-center rounded-[11px] bg-white shadow-[0_9px_24px_-12px_rgba(0,0,0,.4)] dark:bg-v3-bg3-d " +
  "[transition:transform_.24s_var(--ease-v3)] group-hover:[transform:rotate(-8deg)_scale(1.07)] " +
  "[&>svg]:h-5 [&>svg]:w-5 [&>svg]:[fill:url(#g2)] " +
  "[.fx_&]:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] [.fx_&]:shadow-[0_9px_22px_-10px_rgba(0,184,219,.65)] " +
  "[.fx_&>svg]:fill-white";

const WM_BASE = "font-v3-display text-[22px] font-bold tracking-[-.05em] [&>i]:not-italic";
const WM_LIGHT_GROUND =
  WM_BASE +
  " text-v3-ink dark:text-v3-ink-d [&>i]:bg-clip-text [&>i]:text-transparent " +
  "[&>i]:[background-image:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))]";
const WM_ON_DARK =
  WM_BASE +
  " text-white [&>i]:text-v3-sky " +
  "[.fx_&]:text-v3-ink dark:[.fx_&]:text-v3-ink-d [.fx_&>i]:bg-clip-text [.fx_&>i]:text-transparent " +
  "[.fx_&>i]:[background-image:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))]";

/* The two chrome buttons. The ghost one reads on the dark field and on white. */
/* The ghost button, written out rather than derived: taking a base and
   overriding its colour, size and border from a variant is decided by the
   generated sheet, and here the base was winning. */
const BTN_GHOST =
  "relative inline-flex cursor-pointer items-center justify-center gap-[9px] overflow-hidden rounded-[12px] " +
  "border border-transparent bg-transparent px-[15px] py-[9px] font-v3-sans text-[14px] font-semibold text-[rgba(255,255,255,.85)] " +
  "[transition:transform_.2s_var(--ease-v3),box-shadow_.22s,border-color_.22s,background_.22s]! " +
  "hover:bg-[rgba(255,255,255,.13)] active:[transform:scale(.978)] " +
  "[.fx_&]:text-v3-ink2 dark:[.fx_&]:text-v3-ink2-d [.fx_&]:hover:bg-v3-bg2 dark:[.fx_&]:hover:bg-v3-bg2-d";

const FILL_SM =
  "fill relative isolate inline-flex cursor-pointer items-center justify-center gap-[9px] overflow-hidden whitespace-nowrap " +
  "rounded-[11px] border border-transparent bg-white px-[17px] py-[9px] font-v3-sans text-[14px] font-semibold text-v3-deep " +
  "shadow-[0_2px_6px_-2px_rgba(6,9,17,.16),0_10px_26px_-14px_rgba(6,9,17,.4)] " +
  "[transition-property:transform,box-shadow,color]! [transition-duration:240ms,280ms,340ms]! [transition-timing-function:var(--ease-v3),ease,var(--ease-v3)]! " +
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] before:content-[''] " +
  "before:[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "before:[transform:translateY(102%)] before:[transition:transform_.46s_var(--ease-v3)] " +
  "hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_16px_34px_-14px_rgba(21,93,252,.62)] hover:before:[transform:translateY(0)] " +
  "[&_svg]:[transition:transform_.26s_var(--ease-v3)] hover:[&_svg]:[transform:translateX(4px)] max-[1040px]:hidden";

const BURGER =
  "hidden cursor-pointer rounded-[10px] border border-[rgba(255,255,255,.24)] bg-[rgba(255,255,255,.09)] px-[11px] py-[9px] leading-[0] text-white " +
  "max-[1040px]:inline-flex [.fx_&]:border-v3-line2 [.fx_&]:bg-white [.fx_&]:text-v3-ink dark:[.fx_&]:bg-v3-bg2-d dark:[.fx_&]:text-v3-ink-d";

/* The drawer. Its links and its buttons are styled separately, which is the
   whole point: as one rule they collided, and the primary button rendered as a
   left-aligned box with no side padding and, in dark mode, no gradient. */
const MOB =
  "mob mx-auto mt-2 hidden max-w-[1180px] rounded-[18px] border border-v3-line2 bg-white px-5 pb-[18px] pt-1.5 " +
  "[&.on]:block dark:border-v3-line-d dark:bg-v3-bg2-d";
const MOB_A =
  "block border-b border-v3-line py-[13px] text-[16px] font-medium text-v3-ink dark:border-v3-line-d dark:text-v3-ink-d";
const MOB_BTN =
  "flex w-full items-center justify-center rounded-[12px] border border-v3-line2 px-5 py-3 text-[15px] font-semibold text-v3-ink " +
  "dark:border-v3-line2-d dark:text-v3-ink-d";
const MOB_BTN_PRIMARY =
  "flex w-full items-center justify-center rounded-[12px] border border-transparent px-5 py-3 text-[15px] font-semibold text-white " +
  "[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "shadow-[0_14px_32px_-12px_rgba(21,93,252,.55),inset_0_1px_0_rgba(255,255,255,.28)]";

/* The reading progress bar, hidden on pages that do not start on a dark hero. */
const PROG =
  "prog fixed left-0 top-0 z-[995] h-0.5 w-0 shadow-[0_0_12px_rgba(21,93,252,.6)] " +
  "[background:linear-gradient(90deg,var(--color-v3-cyan),var(--color-v3-blue))]";

export function V3Header({
  onDark = false,
  progress = false,
}: {
  onDark?: boolean;
  /** The reading progress bar. Articles only: a marketing page has no "how far in am I" to answer. */
  progress?: boolean;
}) {
  const { data: session, status } = useSession();
  const [demoOpen, setDemoOpen] = useState(false);
  // Until the session resolves, neither state is shown: rendering "Sign in" to
  // someone who is already signed in and then swapping it is worse than a beat
  // of nothing.
  const signedIn = status === "authenticated" && !!session?.user;

  useEffect(() => initV3Chrome(), []);

  return (
    <div
      className={
        (onDark ? "v3-chrome on-dark " : "v3-chrome ") +
        V3_BLOCK +
        // An inner page opens with the nav already formed, so it must not
        // animate in from the transparent state on first paint.
        (onDark ? "" : " [&_.navhold]:[transition:none]")
      }
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true"><defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#00b8db" /><stop offset="1" stopColor="#155dfc" /></linearGradient>
        <symbol id="mark" viewBox="0 0 379 230"><path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z" /></symbol>
      </defs></svg>
    {/* Kept in the DOM even when invisible: chrome-effects bails out of the
        whole nav handler when #prog is missing. */}
    <div className={PROG + (progress ? "" : " hidden")} id="prog"></div>

    {/*═══ LAUNCH BANNER ═══*/}
    <Link href="/sign-up?coupon=V2LAUNCH" className={BANNER} aria-label="LinkedGrow v2 launch offer: 30% off for 3 months">
      <style>{`
        @keyframes lg-banner-sweep {
          0% { transform: translateX(-160%) skewX(-18deg); }
          38% { transform: translateX(260%) skewX(-18deg); }
          100% { transform: translateX(260%) skewX(-18deg); }
        }
      `}</style>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-[linear-gradient(105deg,transparent,rgba(255,255,255,.45),transparent)]"
        style={{ animation: "lg-banner-sweep 5.5s ease-in-out infinite" }}
      />
      <span className="flex min-w-0 items-center gap-3 text-[13.5px] font-bold text-slate-950">
        <span className="hidden items-center gap-1.5 rounded-full bg-slate-950 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.08em] text-white sm:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-80" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          v2 launch
        </span>
        <span className="truncate">
          30% off for 3 months.
          <span className="hidden font-semibold text-slate-950/75 md:inline">
            {" "}Find hundreds of high-intent leads in your first days.
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-1.5 text-[12.5px] font-bold text-white [transition:transform_.2s] group-hover:scale-[1.04]">
          Claim the offer
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="[transition:transform_.25s] group-hover:translate-x-0.5">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </Link>

    {/*═══ NAV ═══*/}
    {/* A header element, not a div. The nav inside it was the only landmark on
        the page, so a crawler and a screen reader both had a list of links with
        nothing saying it was the site header. The id and the classes are
        untouched, so the chrome script and every style still find it. */}
    <header className={NAVHOLD} id="nh">
      <div className={NAV}>
        <Link className={BRAND} href="/" aria-label="LinkedGrow home"><span className={onDark ? TILE_ON_DARK : TILE_LIGHT_GROUND} id="tl"><svg><use href="#mark" /></svg></span>
          <span className={onDark ? WM_ON_DARK : WM_LIGHT_GROUND} id="wm">Linked<i>Grow</i></span></Link>
        <nav className={NL}>
          <a href="/features" className={NL_A}>Features</a><a href="/compare" className={NL_A}>Compare</a>
          <a href="/free-tools" className={NL_A}>Free Tools</a><a href="/blog" className={NL_A}>Blog</a><a href="/pricing" className={NL_A}>Pricing</a>
        </nav>
        <div className="ml-auto"></div>
        <button
          type="button"
          onClick={() => setDemoOpen(true)}
          aria-label="Watch the demo"
          className={
            "group/demo relative rounded-[10px] p-[9px] leading-[0] text-[rgba(255,255,255,.85)] " +
            "[transition:background_.22s,color_.22s] hover:bg-[rgba(255,255,255,.13)] " +
            "[.fx_&]:text-v3-ink2 dark:[.fx_&]:text-v3-ink2-d [.fx_&]:hover:bg-v3-bg2 dark:[.fx_&]:hover:bg-v3-bg2-d"
          }
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21.165 9.187c0-.555 0-.833-.11-.961a.458.458 0 0 0-.384-.16c-.168.014-.365.21-.758.603L16.582 12l3.331 3.332c.393.392.59.588.758.602a.459.459 0 0 0 .385-.16c.11-.128.11-.406.11-.961V9.187Zm-18.333.796c0-1.54 0-2.31.3-2.898a2.75 2.75 0 0 1 1.202-1.202c.588-.3 1.358-.3 2.898-.3h4.95c1.54 0 2.31 0 2.899.3a2.75 2.75 0 0 1 1.201 1.202c.3.588.3 1.358.3 2.898v4.034c0 1.54 0 2.31-.3 2.898a2.75 2.75 0 0 1-1.201 1.202c-.589.3-1.359.3-2.899.3h-4.95c-1.54 0-2.31 0-2.898-.3a2.75 2.75 0 0 1-1.202-1.202c-.3-.588-.3-1.358-.3-2.898V9.983Z" />
          </svg>
          {/* The Watch Demo Now tooltip, tail first, exactly under the icon */}
          <span
            aria-hidden="true"
            className={
              "pointer-events-none absolute left-1/2 top-full z-[95] -translate-x-1/2 translate-y-1 opacity-0 " +
              "[transition:opacity_.18s,transform_.18s] group-hover/demo:translate-y-2 group-hover/demo:opacity-100"
            }
          >
            <svg width="16" height="6" viewBox="0 0 16 6" fill="none" className="mx-auto block">
              <path d="M2 6H14L8.70711 0.707107C8.31658 0.316583 7.68342 0.316583 7.29289 0.707107L2 6Z" fill="#101828" />
            </svg>
            <span className="block whitespace-nowrap rounded-[12px] bg-[#101828] px-5 py-3 text-[13.5px] font-semibold leading-none text-white shadow-[0_12px_30px_-10px_rgba(6,9,17,.5)]">
              Watch Demo Now
            </span>
          </span>
        </button>
        {status === "loading" ? null : signedIn ? (
          <a className={FILL_SM} href="/dashboard">Go to dashboard
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
        ) : (
        <>
        <a className={`${BTN_GHOST} max-[1040px]:hidden`} href="/sign-in">Sign in</a>
        <a className={FILL_SM} href="/sign-up">Start for free
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
        </>
        )}
        <button className={BURGER} id="burger" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
      </div>
      <div className={MOB} id="mob">
        <a href="/features" className={MOB_A}>Features</a><a href="/compare" className={MOB_A}>Compare</a><a href="/free-tools" className={MOB_A}>Free Tools</a>
        <a href="/blog" className={MOB_A}>Blog</a><a href="/pricing" className={MOB_A}>Pricing</a>
        <div className="mt-4 grid gap-2.5">
            {signedIn ? (
              <a className={MOB_BTN_PRIMARY} href="/dashboard">Go to dashboard</a>
            ) : (
              <>
                <a className={MOB_BTN} href="/sign-in">Sign in</a>
                <a className={MOB_BTN_PRIMARY} href="/sign-up">Start free for 7 days</a>
              </>
            )}
          </div>
      </div>
    </header>

    <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
