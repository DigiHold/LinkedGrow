"use client";

import Link from "next/link";
import { V3Appearance } from "./appearance";
import { V3_BLOCK } from "./root";

/**
 * The prototype's footer, for every marketing page.
 *
 * Same markup as the home: the link columns, the review cards, the affiliate
 * band, the founder wordmarks, and the copyright bar carrying the appearance
 * control where the email used to be.
 */

/* ── the footer, as Tailwind ──
   The prototype's own values. `.soc a` in particular had three overlapping
   rules in the stylesheet; what is written here is the result all three
   produced together, not the first of them. */
const WRAP = "mx-auto max-w-[1220px] px-6";
const FOOTER =
  "border-t border-v3-line bg-v3-bg2 pb-[30px] pt-[clamp(54px,7vw,86px)] dark:border-v3-line-d dark:bg-v3-bg-d";
const FG =
  "grid grid-cols-[1.8fr_1.6fr_.9fr_1.35fr] gap-9 max-[1040px]:[grid-template-columns:repeat(2,1fr)] max-[600px]:[grid-template-columns:1fr]";
const H4 =
  "mb-[15px] mt-0 font-v3-display! text-[14.5px] font-semibold! tracking-[-.028em]!";
const LINKS =
  "m-0 grid list-none gap-2.5 p-0 " +
  "[&_a]:inline-block [&_a]:text-[14.5px] [&_a]:text-v3-mut [&_a]:[transition:color_.18s,transform_.18s]! " +
  "[&_a:hover]:text-v3-blue [&_a:hover]:[transform:translateX(2px)] dark:[&_a]:text-v3-mut-d";
const BRAND = "group mb-4 inline-flex items-center gap-2.5";
const TILE_S =
  "grid h-8 w-8 flex-none place-items-center rounded-[10px] [background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "shadow-[0_9px_22px_-10px_rgba(0,184,219,.65)] [transition:transform_.24s_var(--ease-v3)] group-hover:[transform:rotate(-8deg)_scale(1.07)] " +
  "[&>svg]:h-[17px] [&>svg]:w-[17px] [&>svg]:fill-white";
const WORDMARK =
  "font-v3-display text-[20px] font-bold tracking-[-.05em] " +
  "[&>i]:not-italic [&>i]:bg-clip-text [&>i]:text-transparent [&>i]:[background-image:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))]";
const SOC =
  "flex gap-2.5 " +
  "[&>a]:relative [&>a]:grid [&>a]:h-10 [&>a]:w-10 [&>a]:place-items-center [&>a]:overflow-hidden [&>a]:rounded-[12px] " +
  "[&>a]:border [&>a]:border-v3-line [&>a]:bg-v3-bg2 [&>a]:text-v3-mut [&>a]:[transition:.24s_var(--ease-v3)]! " +
  "dark:[&>a]:border-v3-line-d dark:[&>a]:bg-v3-bg3-d dark:[&>a]:text-v3-ink2-d " +
  "[&>a:hover]:border-transparent [&>a:hover]:text-white [&>a:hover]:[transform:translateY(-3px)] " +
  "[&>a:hover]:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "[&>a]:before:absolute [&>a]:before:inset-0 [&>a]:before:rounded-[inherit] [&>a]:before:bg-[var(--sc)] [&>a]:before:opacity-0 [&>a]:before:content-[''] " +
  "[&>a]:before:[transform:scale(.2)] [&>a]:before:[transition:transform_.34s_var(--ease-v3),opacity_.3s] " +
  "[&>a:hover]:before:opacity-100 [&>a:hover]:before:[transform:scale(1)] " +
  "[&_svg]:relative [&_svg]:z-[1]";
const RVB =
  "flex items-center gap-[13px] rounded-[14px] border border-v3-line2 bg-white px-[15px] py-3 " +
  "[transition:transform_.26s_var(--ease-v3),border-color_.26s,box-shadow_.26s]! " +
  "hover:[transform:translateY(-3px)] hover:border-[var(--rc,var(--color-v3-blue))] hover:shadow-[0_16px_30px_-20px_var(--rc,rgba(6,9,17,.5))] " +
  "dark:border-v3-line-d dark:bg-v3-bg2-d " +
  "[&_.lg]:h-7 [&_.lg]:w-7 [&_.lg]:flex-none " +
  "[&_.strs]:block [&_.strs]:text-[12.5px] [&_.strs]:leading-none [&_.strs]:tracking-[1.6px] [&_.strs]:text-[var(--sc,#f5a623)] " +
  "[&_small]:mt-[5px] [&_small]:block [&_small]:text-[13px] [&_small]:text-v3-mut dark:[&_small]:text-v3-mut-d " +
  "hover:[&_small]:text-v3-ink dark:hover:[&_small]:text-v3-ink-d";
const AFF =
  "mt-10 flex flex-wrap items-center gap-[22px] rounded-[18px] border border-[rgba(21,93,252,.15)] px-[26px] py-[22px] " +
  "[background:linear-gradient(100deg,rgba(0,184,219,.075),rgba(21,93,252,.085))] dark:border-v3-line-d dark:[background:var(--color-v3-bg2-d)] " +
  "[&_b]:block [&_b]:font-v3-display [&_b]:text-[17.5px] [&_b]:font-semibold [&_b]:tracking-[-.032em] [&_b]:text-v3-ink dark:[&_b]:text-v3-ink-d " +
  "[&_p]:mt-[5px] [&_p]:max-w-[62ch] [&_p]:text-[14.5px] [&_p]:text-v3-mut dark:[&_p]:text-v3-mut-d";
const FOUNDERS =
  "mt-[34px] flex flex-wrap items-center gap-[26px] border-t border-v3-line2 pt-[26px] text-[13.5px] text-v3-faint " +
  "dark:border-v3-line2-d dark:text-v3-faint-d " +
  "[&>a]:inline-flex [&>a]:items-center [&>a]:opacity-55 [&>a]:[transition:opacity_.2s,transform_.2s]! " +
  "[&>a:hover]:opacity-100 [&>a:hover]:[transform:translateY(-2px)] " +
  // The three founder wordmarks are drawn in near-black and vanish on a dark ground.
  "dark:[&_svg_g[fill='#0a0b0e']_path]:fill-[#e6ecf5] dark:[&_svg_path[fill='#07070b']]:fill-[#e6ecf5] dark:[&_svg_g[fill='#1f3433']_path]:fill-[#e6ecf5]";
const FBOT =
  "mt-7 flex flex-wrap items-center gap-[18px] border-t border-v3-line2 pt-6 text-[13.5px] text-v3-mut " +
  "dark:border-v3-line2-d dark:text-v3-mut-d " +
  "[&_a]:font-medium [&_a]:text-v3-ink2 [&_a:hover]:text-v3-blue dark:[&_a]:text-v3-ink2-d";
const FLAG = "inline-block h-[15px] w-[15px] rounded-full align-middle";
const FILL_SM =
  "fill relative isolate inline-flex cursor-pointer items-center justify-center gap-[9px] overflow-hidden whitespace-nowrap " +
  "rounded-[11px] border border-transparent bg-white px-[17px] py-[9px] font-v3-sans text-[14px] font-semibold text-v3-deep " +
  "shadow-[0_2px_6px_-2px_rgba(6,9,17,.16),0_10px_26px_-14px_rgba(6,9,17,.4)] " +
  "[transition-property:transform,box-shadow,color]! [transition-duration:240ms,280ms,340ms]! [transition-timing-function:var(--ease-v3),ease,var(--ease-v3)]! " +
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] before:content-[''] " +
  "before:[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "before:[transform:translateY(102%)] before:[transition:transform_.46s_var(--ease-v3)] " +
  "hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_16px_34px_-14px_rgba(21,93,252,.62)] hover:before:[transform:translateY(0)] " +
  "[&_svg]:[transition:transform_.26s_var(--ease-v3)] hover:[&_svg]:[transform:translateX(4px)]";
/**
 * The launch directories LinkedGrow is listed on, scrolling under the
 * socials the way Amabrik's footer does it. Icons live in /public/featured
 * and keep their own colours; the name reads dark on light and light on
 * dark, like every other footer text.
 */
const FEATURED: { name: string; href: string; icon: string }[] = [
  { name: "Divvlaunches", href: "https://www.divvlaunches.com/product/linkedgrow", icon: "/featured/divvlaunches.webp" },
  { name: "StartupBase", href: "https://startupbase.io/products/linkedgrow", icon: "/featured/startupbase.svg" },
];

function FeaturedOn() {
  if (FEATURED.length === 0) return null;
  // A marquee with 2 badges loops a lot of empty road: stay still until the
  // list is long enough to look like a procession.
  const moving = FEATURED.length >= 4;
  return (
    <div className="mt-7">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-v3-mut dark:text-v3-mut-d">
        Featured on
      </span>
      <div className="relative mt-3 max-w-[320px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
        <div
          className={`flex w-max items-center gap-2.5 ${moving ? "animate-v3-featured hover:[animation-play-state:paused]" : ""}`}
        >
          {(moving ? [...FEATURED, ...FEATURED] : FEATURED).map((f, i) => (
            <a
              key={`${f.name}-${i}`}
              href={f.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`LinkedGrow on ${f.name}`}
              aria-hidden={i >= FEATURED.length ? "true" : undefined}
              tabIndex={i >= FEATURED.length ? -1 : undefined}
              className="inline-flex flex-none items-center gap-2 rounded-[10px] border border-v3-line bg-white/60 px-3 py-1.5 transition-colors hover:border-v3-line2 hover:bg-white dark:border-v3-line-d dark:bg-white/5 dark:hover:border-v3-line2-d dark:hover:bg-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.icon}
                alt=""
                width={20}
                height={20}
                loading="lazy"
                decoding="async"
                className="block h-5 w-auto max-w-[80px] rounded object-contain"
              />
              <span className="whitespace-nowrap text-[12.5px] font-semibold text-v3-ink dark:text-white">
                {f.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function V3Footer() {
  return (
    <div className={V3_BLOCK}>
    <footer className={FOOTER}>
      <div className={WRAP}>
        <div className={FG}>
          <div>
            <Link className={BRAND} href="/"><span className={TILE_S}><svg><use href="#mark" /></svg></span>
              <span className={WORDMARK}>Linked<i>Grow</i></span></Link>
            <p className="max-w-[35ch] text-[14.5px] text-v3-mut dark:text-v3-mut-d">The LinkedIn agent that finds your buyers, warms them up and opens the conversation, every working day, at human pace, from an address of its own.</p>
            <div className={`${SOC} mt-6`}>
              <a href="https://www.linkedin.com/in/lecocq-nicolas/?utm_source=linkedgrow&utm_medium=website_footer" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ "--sc": "#0A66C2" } as React.CSSProperties}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 013.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 112.06-2.06 2.06 2.06 0 01-2.06 2.06zM7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" /></svg></a>
              <a href="https://x.com/NicolasLecocqHQ?utm_source=linkedgrow&utm_medium=website_footer" target="_blank" rel="noopener noreferrer" aria-label="X" style={{ "--sc": "#0f1419" } as React.CSSProperties}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z" /></svg></a>
              <a href="https://www.facebook.com/nl.nicolaslecocq/?utm_source=linkedgrow&utm_medium=website_footer" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ "--sc": "#1877F2" } as React.CSSProperties}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" /></svg></a>
              <a href="https://www.youtube.com/@LinkedGrow?utm_source=linkedgrow&utm_medium=website_footer" target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ "--sc": "#FF0000" } as React.CSSProperties}><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12z" /></svg></a>
            </div>
            <FeaturedOn />
          </div>
          <div><h4 className={H4}>Quick links</h4>
            <div className="grid grid-cols-2 gap-6">
              <ul className={LINKS}>
                <li><Link href="/book-demo">Book a demo</Link></li><li><Link href="/pricing">Pricing</Link></li><li><Link href="/blog">Blog</Link></li>
                <li><Link href="/industries">Industries</Link></li><li><Link href="/for">Who it&apos;s for</Link></li><li><Link href="/use-cases">Use cases</Link></li></ul>
              <ul className={LINKS}>
                <li><Link href="/about">About us</Link></li><li><Link href="/help">Help center</Link></li><li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/privacy">Privacy</Link></li><li><Link href="/terms">Terms</Link></li><li><Link href="/cookies">Cookies</Link></li></ul>
            </div></div>
          <div><h4 className={H4}>Compare</h4><ul className={LINKS}>
            <li><Link href="/compare/dripify-alternative">vs Dripify</Link></li><li><Link href="/compare/heyreach-alternative">vs HeyReach</Link></li><li><Link href="/compare/lemlist-alternative">vs Lemlist</Link></li>
            <li><Link href="/compare/phantombuster-alternative">vs PhantomBuster</Link></li><li><Link href="/compare/linkedin-sales-navigator-alternative">vs Sales Navigator</Link></li><li><Link href="/compare">All comparisons</Link></li></ul></div>
          <div><h4 className={H4}>Leave us a review</h4>
            <div className="grid gap-[11px]">
              <a className={RVB} target="_blank" rel="noopener noreferrer" href="https://g.page/r/CchpLmmQPKcZEAI/review?utm_source=linkedgrow&utm_medium=website_footer" style={{ "--rc": "#4285F4" } as React.CSSProperties}>
                <svg className="lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                <span><span className="strs">★★★★★</span><small>Review us on Google</small></span></a>
              <a className={RVB} target="_blank" rel="noopener noreferrer" href="https://www.trustpilot.com/review/linkedgrow.ai?utm_source=linkedgrow&utm_medium=website_footer" style={{ "--rc": "#00B67A", "--sc": "#00B67A" } as React.CSSProperties}>
                <svg className="lg" viewBox="0 0 240 240" aria-hidden="true"><path d="M240,91.7177h-91.6463L120.0457,0l-28.3994,91.7237-91.6463-.0962,74.2226,56.745-28.3994,91.6275,74.2226-56.6488,74.1311,56.6488-28.3079-91.6275,74.1311-56.6548Z" fill="#00b67a" /><path d="M172.237,169.1169l-6.3681-20.7444-45.8232,34.9787,52.1913-14.2343Z" fill="#005128" /></svg>
                <span><span className="strs">★★★★★</span><small>Review us on Trustpilot</small></span></a>
              <a className={RVB} target="_blank" rel="noopener noreferrer" href="https://www.g2.com/products/linkedgrow/reviews?utm_source=linkedgrow&utm_medium=website_footer" style={{ "--rc": "#FF492C" } as React.CSSProperties}>
                <svg className="lg" viewBox="0 0 500 512" aria-hidden="true"><path d="M350.3667,364.7733c18.8338,32.6825,37.4575,64.994,56.0672,97.2704-82.4065,63.0896-210.616,70.7141-305.527-1.9394C-8.3149,376.4306-26.2665,233.6582,32.2092,130.8846,99.4646,12.6731,225.3217-13.4702,306.3559,5.6997c-2.1914,4.761-50.7251,105.448-50.7251,105.448,0,0-3.8368.2521-6.0072.2941-23.9518,1.0152-41.7913,6.5883-60.9122,16.4743-42.5955,22.2267-71.4016,64.1245-76.9033,111.8543-2.8272,23.8393.4692,48.0058,9.5779,70.217,7.7015,18.7778,18.5957,35.4551,33.2006,49.5349,22.4045,21.6203,49.0658,35.007,79.97,39.4389,29.2658,4.2008,57.4115.042,83.7857-13.2116,9.893-4.964,18.3086-10.4461,28.1456-17.9656,1.2533-.8121,2.3665-1.8414,3.8788-3.0106h0Z" fill="#ff492c" /><path d="M350.5487,78.1431c-4.7819-4.7049-9.2138-9.0458-13.6247-13.4147-2.6325-2.6045-5.167-5.3141-7.8626-7.8556-.9662-.9172-2.1004-2.1704-2.1004-2.1704,0,0,.9172-1.9464,1.3093-2.7445,5.16-10.3551,13.2467-17.9236,22.8386-23.9448,10.6068-6.7088,22.9646-10.1223,35.5111-9.809,16.0542.3151,30.9812,4.3129,43.5767,15.081,9.2979,7.9466,14.0658,18.0286,14.906,30.064,1.4003,20.3041-7.0014,35.8542-23.6857,46.7063-9.802,6.3853-20.374,11.3213-30.9742,17.1674-5.8461,3.2276-10.8452,6.0632-16.5583,11.9024-5.027,5.8602-5.2721,11.3843-5.2721,11.3843l75.9441-.098v33.8238h-117.2244v-3.2697c-.4481-16.6213,1.4913-32.2624,9.1018-47.3575,7.0014-13.8488,17.8816-23.9868,30.9532-31.7933,10.068-6.0142,20.6681-11.1322,30.7571-17.1184,6.2243-3.6897,10.6211-9.1018,10.5861-16.9504,0-6.7353-4.901-12.7215-11.9024-14.5909-16.5093-4.4529-33.3127,2.6535-42.0504,17.7625-1.2743,2.2054-2.5765,4.3969-4.2288,7.2254h0ZM497.445,328.8212l-63.9998-110.524h-126.6483l-64.4129,111.6653h127.5794l62.9566,109.9989,64.5249-111.1402Z" fill="#ff492c" /></svg>
                <span><span className="strs">★★★★★</span><small>Review us on G2</small></span></a>
            </div>
          </div>
        </div>

        <div className={AFF}>
          <div className="min-w-[260px] flex-1">
            <b>Earn 30% recurring commission as a LinkedGrow affiliate</b>
            <p>Refer founders, followers and customers, and earn 30% on every payment they make, for as long as they stay. That is $356 a year from a single Pro signup.</p>
          </div>
          <Link className={FILL_SM} href="/affiliate">Start earning
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg></Link>
        </div>

        <div className={FOUNDERS}>
          <span>By the founders of</span>
          <a href="https://amabrik.com/?utm_source=linkedgrow&utm_medium=website_footer" target="_blank" rel="noopener noreferrer" aria-label="Amabrik"><svg viewBox="0 0 440 102" style={{ height: "15px", width: "auto" }}><g fill="#0a0b0e"><path d="M22.9058,101.2146c-4.1411,0-7.8516-.7236-11.1328-2.168s-5.8594-3.6035-7.7344-6.4746-2.8125-6.4355-2.8125-10.6934c0-3.6328.6636-6.6592,1.9922-9.082,1.3276-2.4219,3.144-4.374,5.4492-5.8594,2.3042-1.4844,4.9312-2.6074,7.8809-3.3691,2.9487-.7617,6.0444-1.2988,9.2871-1.6113,3.7886-.3906,6.8354-.752,9.1406-1.084,2.3042-.332,3.9844-.8496,5.0391-1.5527s1.582-1.7578,1.582-3.1641v-.293c0-1.7969-.4009-3.3301-1.2012-4.5996-.8013-1.2695-1.9629-2.2461-3.4863-2.9297s-3.3794-1.0254-5.5664-1.0254c-2.2266,0-4.1704.3418-5.8301,1.0254-1.6606.6836-3.0083,1.6016-4.043,2.7539-1.0356,1.1523-1.7681,2.4512-2.1973,3.8965l-16.1133-2.0508c.8979-3.9062,2.6167-7.2461,5.1562-10.0195,2.5386-2.7734,5.7808-4.8926,9.7266-6.3574,3.9448-1.4648,8.4375-2.1973,13.4766-2.1973,3.6714,0,7.1577.4297,10.459,1.2891,3.3003.8594,6.2402,2.1875,8.8184,3.9844s4.5996,4.0723,6.0645,6.8262,2.1973,6.0449,2.1973,9.873v43.6523h-16.6992v-9.0234h-.5273c-1.0547,2.0312-2.4517,3.8184-4.1895,5.3613-1.7388,1.5439-3.8188,2.7451-6.2402,3.6035-2.4224.8584-5.2544,1.2891-8.4961,1.2891ZM27.8276,88.9685c2.7729,0,5.1948-.5469,7.2656-1.6406,2.0698-1.0928,3.6914-2.5576,4.8633-4.3945,1.1719-1.8359,1.7578-3.9053,1.7578-6.2109v-6.8555c-.5474.3135-1.3091.625-2.2852.9375-.9771.3135-2.0903.5859-3.3398.8203-1.2505.2344-2.5103.4492-3.7793.6445-1.27.1963-2.4316.3721-3.4863.5273-2.1094.3135-3.9844.8115-5.625,1.4941-1.6406.6836-2.9106,1.6025-3.8086,2.7539-.8989,1.1523-1.3477,2.5879-1.3477,4.3066,0,1.6406.4194,3.0273,1.2598,4.1602.8394,1.1338,1.9922,1.9922,3.457,2.5781s3.1538.8789,5.0684.8789Z" /><path d="M68.6138,99.9841V35.2966h16.3477l.7031,15.7617h-1.2305c1.0151-3.9062,2.5093-7.0996,4.4824-9.5801,1.9722-2.4805,4.2866-4.3066,6.9434-5.4785,2.6558-1.1719,5.4492-1.7578,8.3789-1.7578,4.6875,0,8.5449,1.4648,11.5723,4.3945,3.0264,2.9297,5.165,7.3438,6.416,13.2422h-1.9922c.8984-3.9844,2.4316-7.2754,4.5996-9.873s4.7461-4.541,7.7344-5.8301,6.1611-1.9336,9.5215-1.9336c3.9844,0,7.5488.8691,10.6934,2.6074,3.1436,1.7383,5.625,4.2578,7.4414,7.5586s2.7246,7.334,2.7246,12.0996v43.4766h-17.5195v-40.1367c0-3.7109-.9961-6.4746-2.9883-8.291s-4.4531-2.7246-7.3828-2.7246c-2.2266,0-4.1514.4785-5.7715,1.4355-1.6211.957-2.8711,2.2949-3.75,4.0137s-1.3184,3.75-1.3184,6.0938v39.6094h-16.9336v-40.6641c0-3.2031-.9473-5.752-2.8418-7.6465-1.8955-1.8945-4.3462-2.8418-7.3535-2.8418-2.0708,0-3.936.4688-5.5957,1.4062-1.6606.9375-2.979,2.3145-3.9551,4.1309-.9771,1.8164-1.4648,4.0527-1.4648,6.709v38.9062h-17.4609Z" /><path d="M190.9038,101.2146c-4.1406,0-7.8516-.7236-11.1328-2.168s-5.8594-3.6035-7.7344-6.4746-2.8125-6.4355-2.8125-10.6934c0-3.6328.6641-6.6592,1.9922-9.082,1.3271-2.4219,3.1436-4.374,5.4492-5.8594,2.3047-1.4844,4.9307-2.6074,7.8809-3.3691,2.9492-.7617,6.0439-1.2988,9.2871-1.6113,3.7881-.3906,6.835-.752,9.1406-1.084,2.3047-.332,3.9844-.8496,5.0391-1.5527s1.582-1.7578,1.582-3.1641v-.293c0-1.7969-.4014-3.3301-1.2012-4.5996-.8008-1.2695-1.9629-2.2461-3.4863-2.9297s-3.3789-1.0254-5.5664-1.0254c-2.2266,0-4.1699.3418-5.8301,1.0254-1.6611.6836-3.0088,1.6016-4.043,2.7539-1.0352,1.1523-1.7676,2.4512-2.1973,3.8965l-16.1133-2.0508c.8984-3.9062,2.6162-7.2461,5.1562-10.0195,2.5391-2.7734,5.7803-4.8926,9.7266-6.3574,3.9453-1.4648,8.4375-2.1973,13.4766-2.1973,3.6709,0,7.1572.4297,10.459,1.2891,3.3008.8594,6.2402,2.1875,8.8184,3.9844s4.5996,4.0723,6.0645,6.8262,2.1973,6.0449,2.1973,9.873v43.6523h-16.6992v-9.0234h-.5273c-1.0547,2.0312-2.4521,3.8184-4.1895,5.3613-1.7383,1.5439-3.8184,2.7451-6.2402,3.6035-2.4229.8584-5.2539,1.2891-8.4961,1.2891ZM195.8257,88.9685c2.7734,0,5.1943-.5469,7.2656-1.6406,2.0703-1.0928,3.6914-2.5576,4.8633-4.3945,1.1719-1.8359,1.7578-3.9053,1.7578-6.2109v-6.8555c-.5479.3135-1.3096.625-2.2852.9375-.9766.3135-2.0898.5859-3.3398.8203-1.251.2344-2.5107.4492-3.7793.6445-1.2695.1963-2.4316.3721-3.4863.5273-2.1094.3135-3.9844.8115-5.625,1.4941-1.6406.6836-2.9102,1.6025-3.8086,2.7539-.8994,1.1523-1.3477,2.5879-1.3477,4.3066,0,1.6406.4189,3.0273,1.2598,4.1602.8398,1.1338,1.9922,1.9922,3.457,2.5781s3.1543.8789,5.0684.8789Z" /><path d="M272.9976,101.0974c-3.3604,0-6.2607-.5566-8.7012-1.6699-2.4414-1.1133-4.4629-2.5391-6.0645-4.2773-1.6025-1.7373-2.8516-3.5449-3.75-5.4199h-.7031v10.2539h-17.168V12.6794h17.4609v33.1055h.4688c.9375-1.875,2.1875-3.6816,3.75-5.4199,1.5615-1.7383,3.5537-3.1738,5.9766-4.3066,2.4219-1.1328,5.3701-1.6992,8.8477-1.6992,4.96,0,9.4424,1.2793,13.4473,3.8379,4.0039,2.5586,7.1973,6.3086,9.5801,11.25,2.3818,4.9414,3.5742,11.0254,3.5742,18.252,0,7.1104-1.1631,13.1455-3.4863,18.1055-2.3242,4.9609-5.499,8.751-9.5215,11.3672-4.0234,2.6172-8.5938,3.9258-13.7109,3.9258ZM267.7827,87.0349c3.0469,0,5.6045-.8105,7.6758-2.4316,2.0703-1.6201,3.6416-3.8867,4.7168-6.7969,1.0742-2.9092,1.6113-6.2988,1.6113-10.166,0-3.8281-.5371-7.1875-1.6113-10.0781-1.0752-2.8906-2.6465-5.1367-4.7168-6.7383-2.0713-1.6016-4.6289-2.4023-7.6758-2.4023-2.9688,0-5.5176.791-7.6465,2.373-2.1299,1.582-3.75,3.8086-4.8633,6.6797s-1.6699,6.2598-1.6699,10.166.5654,7.3047,1.6992,10.1953c1.1328,2.8916,2.7627,5.1475,4.8926,6.7676,2.1289,1.6211,4.6582,2.4316,7.5879,2.4316Z" /><path d="M306.5767,99.9841V35.2966h16.9336v11.1914h.5859c1.1719-3.9453,3.125-6.9238,5.8594-8.9355,2.7334-2.0117,5.9766-3.0176,9.7266-3.0176.9375,0,1.9131.0391,2.9297.1172,1.0156.0781,1.8945.1953,2.6367.3516v15.4688c-.7422-.2344-1.8457-.4199-3.3105-.5566s-2.8809-.2051-4.248-.2051c-2.5781,0-4.9131.5664-7.002,1.6992-2.0898,1.1328-3.7207,2.7344-4.8926,4.8047s-1.7578,4.5117-1.7578,7.3242v36.4453h-17.4609Z" /><path d="M350.3511,99.9841V35.2966h17.4609v64.6875h-17.4609Z" /><path d="M377.4263,99.9841V12.6794h17.4609v87.3047h-17.4609ZM393.2466,81.1169v-20.9766h2.5195l21.4453-24.8438h20.332l-28.2422,32.4609h-4.1016l-11.9531,13.3594ZM418.2075,99.9841l-19.6289-28.3008,11.6602-12.4219,28.5352,40.7227h-20.5664Z" /></g><g fill="#7c5bff"><rect x="346.0815" y=".7854" width="12" height="12" rx="1.5" /><rect x="360.0815" y=".7854" width="12" height="12" rx="1.5" /><rect x="346.0815" y="14.7854" width="26" height="12" rx="1.5" /></g></svg></a>
          <a href="https://insightsite.nicolaslecocq.com/?utm_source=linkedgrow&utm_medium=website_footer" target="_blank" rel="noopener noreferrer" aria-label="Insight"><svg viewBox="0 0 100.85 32" style={{ height: "20px", width: "auto" }}><rect width="32" height="32" rx="9" fill="#ffa950" /><rect x="8" y="20" width="4" height="5" rx="2" fill="#fff" fillOpacity=".4" /><rect x="14" y="12" width="4" height="13" rx="2" fill="#fff" fillOpacity=".7" /><rect x="20" y="7" width="4" height="18" rx="2" fill="#fff" /><path fill="#07070b" d="M43.46 21.91V10.09H46.4V21.91ZM48.38 21.91V16.23V12.45H50.7L50.73 15.27H51.09Q51.32 14.25 51.75 13.56Q52.17 12.88 52.83 12.54Q53.5 12.2 54.4 12.2Q56.06 12.2 56.92 13.36Q57.79 14.51 57.79 17.05V21.91H54.88V17.37Q54.88 15.91 54.47 15.25Q54.06 14.59 53.24 14.59Q52.57 14.59 52.13 15Q51.7 15.41 51.48 16.1Q51.26 16.79 51.26 17.65V21.91ZM63.36 22.16Q62.41 22.16 61.63 21.99Q60.86 21.82 60.29 21.49Q59.71 21.17 59.35 20.7Q58.98 20.24 58.85 19.66L61.02 18.74Q61.14 19.06 61.45 19.38Q61.76 19.69 62.28 19.89Q62.8 20.09 63.55 20.09Q64.27 20.09 64.68 19.88Q65.08 19.68 65.08 19.28Q65.08 19 64.85 18.83Q64.62 18.66 64.18 18.52Q63.73 18.39 63.07 18.26Q62.39 18.11 61.69 17.92Q60.99 17.73 60.38 17.4Q59.78 17.07 59.41 16.53Q59.04 15.98 59.04 15.15Q59.04 14.26 59.51 13.61Q59.98 12.95 60.9 12.58Q61.82 12.2 63.14 12.2Q64.32 12.2 65.22 12.51Q66.12 12.81 66.72 13.38Q67.31 13.95 67.54 14.77L65.22 15.56Q65.14 15.17 64.87 14.88Q64.59 14.59 64.17 14.44Q63.74 14.28 63.17 14.28Q62.48 14.28 62.09 14.5Q61.71 14.71 61.71 15.07Q61.71 15.35 61.97 15.54Q62.22 15.73 62.71 15.86Q63.19 15.98 63.85 16.13Q64.56 16.27 65.25 16.46Q65.94 16.65 66.5 16.96Q67.07 17.28 67.4 17.79Q67.74 18.3 67.74 19.11Q67.74 20.05 67.23 20.74Q66.72 21.43 65.74 21.8Q64.77 22.16 63.36 22.16ZM68.98 21.91V12.45H71.87V21.91ZM70.44 11.15Q69.61 11.15 69.17 10.8Q68.73 10.45 68.73 9.8Q68.73 9.12 69.17 8.77Q69.61 8.42 70.44 8.42Q71.28 8.42 71.72 8.77Q72.16 9.12 72.16 9.79Q72.16 10.45 71.72 10.8Q71.28 11.15 70.44 11.15ZM77.53 25.22Q75.95 25.22 74.94 24.98Q73.93 24.73 73.46 24.26Q72.99 23.79 72.99 23.1Q72.99 22.27 73.65 21.76Q74.3 21.24 75.57 21.16V20.8Q74.59 20.8 74.06 20.6Q73.53 20.39 73.53 19.86Q73.53 19.35 74.05 18.94Q74.56 18.53 75.77 18.31V17.95Q74.67 17.85 74.03 17.21Q73.39 16.57 73.39 15.53Q73.39 14.65 73.89 13.93Q74.39 13.21 75.4 12.77Q76.4 12.33 77.9 12.33H82.8V14.5L79.79 14.11V14.52Q80.97 14.69 81.48 15.07Q81.98 15.45 81.98 16.13Q81.98 16.84 81.49 17.4Q81 17.95 80.11 18.26Q79.22 18.58 77.98 18.58Q77.75 18.58 77.49 18.56Q77.22 18.54 76.54 18.47Q76.25 18.71 76.09 18.88Q75.93 19.05 75.93 19.19Q75.93 19.3 76.02 19.37Q76.11 19.44 76.28 19.47Q76.44 19.51 76.64 19.51H79.52Q79.88 19.51 80.47 19.55Q81.05 19.6 81.63 19.83Q82.21 20.06 82.61 20.58Q83.01 21.1 83.01 22.07Q83.01 23.13 82.42 23.83Q81.83 24.54 80.62 24.88Q79.4 25.22 77.53 25.22ZM77.88 22.91Q78.93 22.91 79.51 22.8Q80.08 22.7 80.3 22.47Q80.52 22.24 80.52 21.89Q80.52 21.58 80.4 21.39Q80.27 21.2 80.07 21.13Q79.87 21.06 79.67 21.04Q79.46 21.03 79.32 21.03H77Q76.34 21.04 76.03 21.34Q75.73 21.65 75.73 22.07Q75.73 22.4 75.94 22.59Q76.16 22.77 76.63 22.84Q77.11 22.91 77.88 22.91ZM77.78 17.13Q78.54 17.13 78.92 16.73Q79.3 16.32 79.3 15.69Q79.3 15.01 78.91 14.58Q78.52 14.14 77.8 14.14Q77.06 14.14 76.65 14.58Q76.24 15.01 76.24 15.69Q76.24 16.1 76.42 16.43Q76.6 16.76 76.94 16.95Q77.29 17.13 77.78 17.13ZM84.2 21.91V15.93V9.03H87.09V11.95Q87.09 12.31 87.06 12.71Q87.03 13.11 86.97 13.52Q86.9 13.93 86.84 14.35Q86.77 14.77 86.69 15.16H87.1Q87.35 14.27 87.72 13.61Q88.1 12.94 88.72 12.57Q89.33 12.2 90.28 12.2Q91.95 12.2 92.78 13.37Q93.61 14.54 93.61 16.98V21.91H90.71V17.44Q90.71 16 90.29 15.29Q89.88 14.58 89.04 14.58Q88.36 14.58 87.93 14.99Q87.5 15.4 87.29 16.09Q87.09 16.78 87.09 17.66V21.91ZM98.97 22.15Q97.29 22.15 96.51 21.26Q95.72 20.38 95.72 18.43V14.71H94.38L94.43 12.48H95.36Q95.97 12.47 96.26 12.29Q96.56 12.11 96.63 11.64L96.87 10.35H98.49V12.45H100.78V14.8H98.49V18.3Q98.49 18.91 98.79 19.2Q99.08 19.48 99.7 19.48Q100.04 19.48 100.34 19.41Q100.64 19.34 100.84 19.22V21.88Q100.27 22.06 99.8 22.1Q99.33 22.15 98.97 22.15Z" /></svg></a>
          <a href="https://yeahday.app/?utm_source=linkedgrow&utm_medium=website_footer" target="_blank" rel="noopener noreferrer" aria-label="Yeahday"><svg viewBox="0 0 117.926 25.733" style={{ height: "17px", width: "auto" }}><g transform="translate(-1.556 -1.156) scale(0.444444)"><path d="M10 38 L28 54 L56 18" fill="none" stroke="#ff5c48" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" /><circle cx="61" cy="10" r="5" fill="#f2b705" /><circle cx="68" cy="23" r="4" fill="#0e7c7b" /><circle cx="51" cy="6" r="3.4" fill="#ff7d6b" /></g><g transform="translate(41.444 20.017)" fill="#1f3433"><path d="M7.329 -7.056H5.817L9.492 -14.301H13.104L8.043 -4.452L8.211 -6.195V0H4.809V-6.195L4.977 -4.452L-0.084 -14.301H3.675ZM16.443 0.189Q14.889 0.189 13.724 -0.462Q12.558 -1.113 11.907 -2.31Q11.256 -3.507 11.256 -5.145Q11.256 -6.72 11.907 -7.938Q12.558 -9.156 13.724 -9.86Q14.889 -10.563 16.443 -10.563Q18.06 -10.563 19.215 -9.828Q20.37 -9.093 21 -7.886Q21.63 -6.678 21.63 -5.187Q21.63 -4.851 21.609 -4.578Q21.588 -4.305 21.546 -4.137H13.797V-6.447H18.921L18.627 -5.691Q18.627 -6.678 18.102 -7.308Q17.577 -7.938 16.485 -7.938Q15.477 -7.938 14.889 -7.35Q14.301 -6.762 14.301 -5.775V-4.62Q14.301 -3.549 14.931 -2.972Q15.561 -2.394 16.695 -2.394Q17.598 -2.394 18.134 -2.74Q18.669 -3.087 19.026 -3.633L21.294 -2.415Q20.643 -1.218 19.383 -0.514Q18.123 0.189 16.443 0.189ZM25.725 0.273Q24.633 0.273 23.793 -0.158Q22.953 -0.588 22.481 -1.376Q22.008 -2.163 22.008 -3.171Q22.008 -4.263 22.523 -5.03Q23.037 -5.796 23.888 -6.206Q24.738 -6.615 25.767 -6.615Q27.3 -6.615 28.266 -5.912Q29.232 -5.208 29.526 -3.843L28.14 -4.158V-6.489Q28.14 -7.014 27.762 -7.392Q27.384 -7.77 26.586 -7.77Q26.019 -7.77 25.284 -7.623Q24.549 -7.476 23.73 -7.077L22.764 -9.492Q23.688 -9.954 24.801 -10.259Q25.914 -10.563 27.111 -10.563Q28.56 -10.563 29.558 -10.038Q30.555 -9.513 31.059 -8.558Q31.563 -7.602 31.563 -6.3V0H28.707L28.056 -2.037L29.526 -2.499Q29.211 -1.218 28.277 -0.472Q27.342 0.273 25.725 0.273ZM26.88 -2.037Q27.468 -2.037 27.825 -2.352Q28.182 -2.667 28.182 -3.171Q28.182 -3.654 27.825 -3.969Q27.468 -4.284 26.88 -4.284Q26.25 -4.284 25.904 -3.969Q25.557 -3.654 25.557 -3.171Q25.557 -2.667 25.904 -2.352Q26.25 -2.037 26.88 -2.037ZM32.97 0V-14.301H36.372V0ZM39.354 0V-5.922Q39.354 -6.72 39.102 -6.972Q38.85 -7.224 38.367 -7.224Q38.01 -7.224 37.611 -7.088Q37.212 -6.951 36.824 -6.689Q36.435 -6.426 36.057 -6.069L34.923 -8.295Q35.448 -8.883 36.151 -9.398Q36.855 -9.912 37.684 -10.238Q38.514 -10.563 39.438 -10.563Q40.467 -10.563 41.118 -10.206Q41.769 -9.849 42.126 -9.251Q42.483 -8.652 42.62 -7.896Q42.756 -7.14 42.756 -6.321V0ZM48.216 0.273Q46.851 0.273 45.78 -0.42Q44.709 -1.113 44.1 -2.352Q43.491 -3.591 43.491 -5.145Q43.491 -6.72 44.111 -7.949Q44.73 -9.177 45.812 -9.87Q46.893 -10.563 48.258 -10.563Q49.602 -10.563 50.589 -9.954Q51.576 -9.345 52.122 -8.138Q52.668 -6.93 52.668 -5.145Q52.668 -3.465 52.101 -2.247Q51.534 -1.029 50.537 -0.378Q49.539 0.273 48.216 0.273ZM48.888 -3.003Q49.728 -3.003 50.295 -3.602Q50.862 -4.2 50.862 -5.145Q50.862 -6.069 50.295 -6.689Q49.728 -7.308 48.888 -7.308Q48.069 -7.308 47.513 -6.689Q46.956 -6.069 46.956 -5.145Q46.956 -4.2 47.513 -3.602Q48.069 -3.003 48.888 -3.003ZM51.555 0 50.694 -2.814H50.883V-7.245H50.694V-14.301H54.096V0ZM58.8 0.273Q57.708 0.273 56.868 -0.158Q56.028 -0.588 55.556 -1.376Q55.083 -2.163 55.083 -3.171Q55.083 -4.263 55.598 -5.03Q56.112 -5.796 56.963 -6.206Q57.813 -6.615 58.842 -6.615Q60.375 -6.615 61.341 -5.912Q62.307 -5.208 62.601 -3.843L61.215 -4.158V-6.489Q61.215 -7.014 60.837 -7.392Q60.459 -7.77 59.661 -7.77Q59.094 -7.77 58.359 -7.623Q57.624 -7.476 56.805 -7.077L55.839 -9.492Q56.763 -9.954 57.876 -10.259Q58.989 -10.563 60.186 -10.563Q61.635 -10.563 62.633 -10.038Q63.63 -9.513 64.134 -8.558Q64.638 -7.602 64.638 -6.3V0H61.782L61.131 -2.037L62.601 -2.499Q62.286 -1.218 61.352 -0.472Q60.417 0.273 58.8 0.273ZM59.955 -2.037Q60.543 -2.037 60.9 -2.352Q61.257 -2.667 61.257 -3.171Q61.257 -3.654 60.9 -3.969Q60.543 -4.284 59.955 -4.284Q59.325 -4.284 58.979 -3.969Q58.632 -3.654 58.632 -3.171Q58.632 -2.667 58.979 -2.352Q59.325 -2.037 59.955 -2.037ZM69.006 -0.588 64.869 -10.29H68.292L72.303 -0.861ZM66.99 3.99 73.059 -10.29H76.482L70.413 3.99Z" /></g></svg></a>
        </div>

        <div className={FBOT}>
          <span>
            © 2026 LinkedGrow - Made with love in{" "}
            <svg className={FLAG} viewBox="0 0 512 512" aria-label="Switzerland">
              <circle cx="256" cy="256" fill="#fff" r="256" />
              <path d="m512 256c0-110.071-69.472-203.906-166.957-240.077v480.155c97.485-36.172 166.957-130.007 166.957-240.078z" fill="#d80027" />
              <path d="m0 256c0 110.071 69.473 203.906 166.957 240.077v-480.154c-97.484 36.171-166.957 130.006-166.957 240.077z" fill="#0052b4" />
            </svg>{" "}
            by{" "}
            <a href="https://nicolaslecocq.com/" target="_blank" rel="noopener noreferrer">Nicolas Lecocq</a>
          </span>
          <span className="ml-auto"></span>
          <V3Appearance />
        </div>
      </div>
    </footer>
    </div>
  );
}
