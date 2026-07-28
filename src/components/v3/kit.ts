/**
 * The v3 design system, as Tailwind class strings.
 *
 * Every marketing page composes from here: the type scale, the reveals, the
 * bracketed eyebrow, the sliding-fill button, the mock browser frame. It exists
 * because the pricing block and the FAQ had each been copied into a second file
 * and had already drifted, and because seventeen pages are about to need the
 * same vocabulary.
 *
 * Two rules the strings encode, both learned the hard way:
 *
 * - Anything a variant overrides lives on the variant, never on the shared
 *   base. Two utilities fighting for one property inside one class attribute
 *   are decided by the generated stylesheet, not by the order written here.
 * - globals.css styles h1..h6, p, li, button and a outside any cascade layer,
 *   so those declarations beat every utility. The contested ones carry the
 *   important modifier until that file is layered.
 */

/* ── the layout primitives ── */
export const WRAP = "mx-auto max-w-[1220px] px-6";
export const NARROW = "mx-auto max-w-[940px] px-6";
export const SEC = "py-[clamp(70px,8.5vw,126px)]";

/* ── the type scale ── */
export const H1 =
  "m-0 font-v3-display! text-[clamp(43px,6.8vw,88px)] font-semibold! leading-[.98] tracking-[-.048em]!";
export const H2 =
  "m-0 font-v3-display! text-[clamp(32px,4.6vw,55px)] font-semibold! leading-[1.03] tracking-[-.042em]!";
export const H3 =
  "m-0 font-v3-display! text-[21px] font-semibold! leading-[1.2] tracking-[-.032em]!";
/* LEAD carries no colour: three grounds override it, and two utilities fighting
   for the same property inside one class attribute is decided by the generated
   sheet rather than by the order written here. */
export const LEAD = "max-w-[58ch] text-[clamp(16.5px,1.35vw,19px)] leading-[1.58]!";
export const LEAD_MUT = LEAD + " text-v3-mut dark:text-v3-mut-d";
export const MONO = "font-v3-mono text-[11px] font-medium uppercase tracking-[.15em]";

/* The emphasised run inside a heading: gradient on a light ground, flat sky on
   a dark one, warm on the problem section. */
export const EM_GRAD =
  "not-italic [background-image:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] bg-clip-text text-transparent";
/* Inside a section header the run renders solid blue: `.sh em` out-specified
   the gradient rule's colour, so the gradient is still painted and then covered
   by opaque text. Kept as it was rather than tidied, because tidying it would
   change what the page looks like. */
export const EM_SH =
  "not-italic text-v3-blue [background-image:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] bg-clip-text";
export const EM_SKY = "not-italic text-v3-sky [-webkit-text-fill-color:#8ce4f5]";
export const EM_WARM =
  "not-italic text-[#b8442c] [-webkit-text-fill-color:#b8442c] dark:text-[#ff8f70] dark:[-webkit-text-fill-color:#ff8f70]";

/* ── scroll reveals ──
   The observer adds `seen`; both states live here so no rule sits elsewhere. */
/* RV_STATE is the reveal without a transition of its own. Cards that already
   declare one (a lift on hover, a growing bar) took that declaration in the
   stylesheet too, because it sat further down the file and reset the shorthand.
   Splitting it keeps that outcome deliberate rather than dependent on the order
   Tailwind happens to emit two utilities in. */
export const RV_STATE =
  "rv opacity-0 [transform:translateY(26px)] [filter:blur(6px)] " +
  "[&.seen]:opacity-100 [&.seen]:[transform:none] [&.seen]:[filter:none] " +
  "motion-reduce:opacity-100 motion-reduce:[transform:none] motion-reduce:[filter:none] motion-reduce:transition-none";
export const RV =
  RV_STATE +
  " [transition-property:opacity,transform,filter] [transition-duration:850ms] [transition-timing-function:var(--ease-v3)] [transition-delay:var(--d0,0s)]";

export const STAG_STATE =
  "stag [&>*]:opacity-0 [&>*]:[transform:translateY(22px)] [&>*]:[filter:blur(5px)] " +
  "[&.seen>*]:opacity-100 [&.seen>*]:[transform:none] [&.seen>*]:[filter:none] " +
  "[&.seen>*:nth-child(1)]:[transition-delay:.04s] [&.seen>*:nth-child(2)]:[transition-delay:.12s] " +
  "[&.seen>*:nth-child(3)]:[transition-delay:.2s] [&.seen>*:nth-child(4)]:[transition-delay:.28s] " +
  "[&.seen>*:nth-child(5)]:[transition-delay:.36s] [&.seen>*:nth-child(6)]:[transition-delay:.44s] " +
  "motion-reduce:[&>*]:opacity-100 motion-reduce:[&>*]:[transform:none] motion-reduce:[&>*]:[filter:none] motion-reduce:[&>*]:transition-none";
export const STAG =
  STAG_STATE +
  " [&>*]:[transition-property:opacity,transform,filter] [&>*]:[transition-duration:720ms] [&>*]:[transition-timing-function:var(--ease-v3)]";

/* The title splitter wraps every word in span.w and staggers it. */
export const WSPLIT =
  "wsplit [&_.w]:inline-block [&_.w]:opacity-0 [&_.w]:[transform:translateY(.42em)_rotate(1.2deg)] [&_.w]:[filter:blur(7px)] " +
  "[&_.w]:[transition-property:opacity,transform,filter] [&_.w]:[transition-duration:660ms] [&_.w]:[transition-timing-function:var(--ease-v3)] " +
  "[&.seen_.w]:opacity-100 [&.seen_.w]:[transform:none] [&.seen_.w]:[filter:none] " +
  "motion-reduce:[&_.w]:opacity-100 motion-reduce:[&_.w]:[transform:none] motion-reduce:[&_.w]:[filter:none] motion-reduce:[&_.w]:transition-none";

/* ── the bracketed eyebrow ──
   Two corner marks drawn as pseudo-elements, in three grounds. */
export const EB_BASE =
  "relative inline-flex items-center gap-2.5 px-[15px] py-[7px] font-v3-mono text-[12px] font-medium uppercase tracking-[.14em] " +
  "before:absolute before:left-0 before:top-0 before:size-[9px] before:border-l-[1.5px] before:border-t-[1.5px] before:[transition:border-color_.35s_var(--ease-v3)] before:content-[''] " +
  "after:absolute after:bottom-0 after:right-0 after:size-[9px] after:border-b-[1.5px] after:border-r-[1.5px] after:[transition:border-color_.35s_var(--ease-v3)] after:content-['']";
export const EB =
  EB_BASE +
  " text-v3-mut before:border-v3-line2 after:border-v3-line2 dark:text-v3-mut-d dark:before:border-v3-line2-d dark:after:border-v3-line2-d";
export const EB_LT =
  EB_BASE + " text-[rgba(255,255,255,.82)] before:border-[rgba(255,255,255,.36)] after:border-[rgba(255,255,255,.36)]";
export const EB_NIGHT =
  EB_BASE +
  " text-[#8fa0b8] before:border-[rgba(148,163,184,.32)] after:border-[rgba(148,163,184,.32)]";
export const EB_DOT =
  "h-[6px] w-[6px] flex-none rounded-full bg-v3-blue shadow-[0_0_0_3px_rgba(21,93,252,.16)]";
export const EB_DOT_LT =
  "h-[6px] w-[6px] flex-none rounded-full bg-v3-sky shadow-[0_0_0_3px_rgba(140,228,245,.22)]";
export const EB_DOT_NIGHT =
  "h-[6px] w-[6px] flex-none rounded-full bg-[#2ec8ea] shadow-[0_0_0_3px_rgba(46,200,234,.16)]";

/* ── the section header: a gradient bullet beside the heading ── */
export const SH = "flex items-start gap-[14px]";
export const SH_BUL_BASE =
  "mt-[.42em] grid h-[19px] w-[19px] flex-none place-items-center rounded-full " +
  "before:h-[6px] before:w-[6px] before:rounded-full before:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] before:content-['']";
export const SH_BUL = SH_BUL_BASE + " border border-[rgba(21,93,252,.16)] bg-v3-wash dark:bg-v3-wash-d";
export const SH_BUL_WARM = SH_BUL_BASE + " border border-[rgba(21,93,252,.16)] bg-v3-wash dark:border-[#3d2b23] dark:bg-[#2a1d18]";
export const SH_BUL_NIGHT =
  "mt-[.42em] grid h-[19px] w-[19px] flex-none place-items-center rounded-full border border-[rgba(140,228,245,.22)] bg-[rgba(140,228,245,.1)] " +
  "before:h-[6px] before:w-[6px] before:rounded-full before:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] before:content-['']";

/* ── the button whose gradient slides up from underneath ──
   `fill` stays on the element because the click ripple is delegated to it. */
export const FILL =
  "fill relative isolate inline-flex cursor-pointer items-center justify-center gap-[9px] overflow-hidden whitespace-nowrap " +
  "border border-transparent font-v3-sans font-semibold text-v3-deep " +
  "shadow-[0_2px_6px_-2px_rgba(6,9,17,.16),0_10px_26px_-14px_rgba(6,9,17,.4)] " +
  "[transition-property:transform,box-shadow,color]! [transition-duration:240ms,280ms,340ms]! [transition-timing-function:var(--ease-v3),ease,var(--ease-v3)]! " +
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] " +
  "before:[transform:translateY(102%)] before:[transition:transform_.46s_var(--ease-v3)] before:content-[''] " +
  "hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_16px_34px_-14px_rgba(21,93,252,.62)] hover:before:[transform:translateY(0)] " +
  "active:[transform:translateY(0)_scale(.972)] active:[transition-duration:.09s] " +
  "[&_svg]:[transition:transform_.26s_var(--ease-v3)] hover:[&_svg]:[transform:translateX(4px)]";
/* The white pill and the gradient one slide a different fill up from under. */
export const FILL_LIGHT =
  "bg-white before:[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))]";
export const FILL_MD = "rounded-[13px] px-[22px] py-3 text-[15px]";
export const FILL_LG = "rounded-[14px] px-[28px] py-4 text-[16.5px]";
export const FILL_WIDE = "mt-auto w-full";
export const FILL_PRI =
  "[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] text-white " +
  "shadow-[0_14px_32px_-12px_rgba(21,93,252,.55),inset_0_1px_0_rgba(255,255,255,.26)] " +
  "before:[background:linear-gradient(96deg,var(--color-v3-blue-dark),var(--color-v3-deep))] " +
  "hover:text-white hover:shadow-[0_20px_40px_-14px_rgba(11,63,196,.6)]";

/* ── the mock browser frame around each product shot ── */
export const SCREEN_LT =
  "m-0 overflow-hidden rounded-[16px] border border-v3-line2 bg-[#0b1220] shadow-[0_44px_90px_-50px_rgba(6,9,17,.5)] dark:border-v3-line2-d";
export const SCREEN_DK =
  "m-0 overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[#0b1220] shadow-[0_60px_110px_-46px_rgba(0,10,40,.75)]";
export const CHROME_LT =
  "flex items-center gap-[7px] border-b border-v3-line bg-v3-bg2 px-[14px] py-[10px] dark:border-v3-line-d dark:bg-v3-bg2-d";
export const CHROME_DK =
  "flex items-center gap-[7px] border-b border-[rgba(255,255,255,.07)] bg-[#131c2e] px-[14px] py-[10px] dark:border-v3-line-d dark:bg-v3-bg2-d";
export const CHROME_DOT_LT = "block h-[9px] w-[9px] rounded-full bg-v3-line2 dark:bg-v3-line2-d";
export const CHROME_DOT_DK = "block h-[9px] w-[9px] rounded-full bg-[rgba(255,255,255,.16)]";
export const CHROME_URL_LT =
  "ml-3 overflow-hidden text-ellipsis whitespace-nowrap rounded-[6px] border border-v3-line bg-white px-3 py-1 font-v3-mono text-[10.5px] text-v3-faint dark:border-v3-line-d dark:bg-v3-bg2-d dark:text-v3-faint-d";
export const CHROME_URL_DK =
  "ml-3 overflow-hidden text-ellipsis whitespace-nowrap rounded-[6px] bg-[rgba(255,255,255,.05)] px-3 py-1 font-v3-mono text-[10.5px] text-[rgba(255,255,255,.42)]";
export const VID =
  "vid relative aspect-video overflow-hidden [background:radial-gradient(96%_96%_at_50%_-10%,#173663,#0a1120_70%)] [&>video]:h-full [&>video]:w-full [&>video]:object-cover";
export const PH =
  "absolute inset-0 grid place-content-center justify-items-center gap-[14px] p-5 text-center " +
  "[background:radial-gradient(62%_76%_at_50%_50%,rgba(8,14,28,.94)_35%,rgba(8,14,28,.55)_100%)] " +
  "after:absolute after:left-0 after:right-0 after:top-[-34%] after:h-[34%] after:animate-v3-scan after:content-[''] " +
  "after:[background:linear-gradient(180deg,transparent,rgba(140,228,245,.11),transparent)] " +
  "[&>b]:relative [&>b]:font-v3-display [&>b]:text-[17px] [&>b]:font-semibold [&>b]:tracking-[-.03em] [&>b]:text-white max-[660px]:[&>b]:text-[14px] " +
  "[&>small]:relative [&>small]:font-v3-mono [&>small]:text-[10px] [&>small]:uppercase [&>small]:tracking-[.14em] [&>small]:text-[rgba(140,228,245,.72)]";
export const PH_MK =
  "relative grid h-[54px] w-[54px] place-items-center rounded-[17px] [background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "shadow-[0_16px_40px_-14px_rgba(0,184,219,.7)] [&>svg]:h-7 [&>svg]:w-7 [&>svg]:fill-white " +
  "after:absolute after:-inset-[9px] after:animate-v3-pulse-ring after:rounded-[24px] after:border after:border-[rgba(140,228,245,.3)] after:content-[''] " +
  "max-[660px]:h-[42px] max-[660px]:w-[42px]";
export const PH_CHIP =
  "relative inline-flex items-center gap-[7px] rounded-full border border-dashed border-[rgba(255,255,255,.16)] px-[13px] py-1.5 text-[12.5px] text-[#93a7c5] max-[660px]:hidden";

/* The handwritten annotations flanking the hero shot, wide screens only. */
export const ANN = "absolute z-[5] hidden min-[1500px]:block [&_svg]:text-v3-sky [&_svg]:opacity-70";
export const NOTE =
  "font-v3-hand text-[22px] leading-[1.12] text-v3-sky [transform:rotate(-3deg)]";

/* The six-up logo row: one grid with hairlines drawn by the cells. */
export const CELLS =
  "grid [grid-template-columns:repeat(6,1fr)] overflow-hidden rounded-[16px] border-l border-t border-v3-line dark:border-v3-line-d max-[900px]:[grid-template-columns:repeat(3,1fr)] max-[520px]:[grid-template-columns:repeat(2,1fr)]";
export const CL =
  "group relative grid place-items-center border-b border-r border-v3-line px-[18px] py-[30px] [transition:background_.3s] hover:bg-v3-wash dark:hover:bg-v3-wash-d " +
  "dark:border-v3-line-d dark:bg-v3-bg2-d dark:hover:bg-v3-bg2-d";
export const CL_B =
  "font-v3-display text-[15.5px] font-bold tracking-[-.035em] text-v3-faint [transition:color_.3s] group-hover:text-v3-ink2 dark:text-v3-faint-d dark:group-hover:text-v3-ink2-d";

/* The four warm statistics under the problem heading. */
export const PSTAT =
  "relative rounded-[18px] border border-[#f1e6da] bg-white px-6 py-[26px] shadow-[0_22px_44px_-38px_rgba(123,36,25,.4)] " +
  "[transition:transform_.32s_var(--ease-v3),box-shadow_.32s] hover:[transform:translateY(-6px)] hover:shadow-[0_34px_60px_-36px_rgba(123,36,25,.45)] " +
  "dark:border-[#2a1d18] dark:bg-v3-bg2-d dark:shadow-[0_22px_44px_-38px_rgba(0,0,0,.7)] dark:hover:shadow-[0_34px_60px_-36px_rgba(0,0,0,.8)]";
export const PSTAT_IX = "font-v3-mono text-[10px] tracking-[.14em] text-[#c99a84] dark:text-[#8a6250]";
export const PSTAT_N =
  "mt-[14px] font-v3-display text-[clamp(37px,4.2vw,51px)] font-semibold leading-none tracking-[-.055em] text-[#7b2419] dark:text-[#ffb9a4]";
export const PSTAT_P = "mt-3 text-[14.5px] leading-[1.55]! text-[#6d5c52] dark:text-[#a89386]";
export const PSTAT_IC = "mt-5 text-[#cd8a70] dark:text-[#a3654d]";

/* ── the monthly / yearly switch and the two plans ── */
export const TOGGLE =
  "toggle relative inline-flex items-center gap-[3px] rounded-full bg-v3-bg3 p-[5px] dark:bg-v3-bg2-d " +
  "[&>button]:relative [&>button]:z-[1] [&>button]:cursor-pointer [&>button]:rounded-full [&>button]:border-0 [&>button]:bg-none " +
  "[&>button]:px-[22px] [&>button]:py-[9px] [&>button]:font-v3-sans [&>button]:text-[14.5px] [&>button]:font-semibold [&>button]:text-v3-mut " +
  "[&>button]:[transition:color_.24s]! dark:[&>button]:text-v3-mut-d " +
  "[&>button.on]:text-v3-ink";
export const PIP =
  "absolute left-[5px] top-[5px] h-[calc(100%-10px)] rounded-full bg-white shadow-[0_3px_12px_-4px_rgba(6,9,17,.35)] " +
  "[transition:transform_.34s_var(--ease-v3),width_.34s_var(--ease-v3)]";
export const TGNOTE =
  "tgnote pointer-events-none absolute left-[calc(100%+10px)] top-[calc(100%-14px)] flex items-start gap-0.5 whitespace-nowrap max-[820px]:hidden " +
  "[&>svg]:mt-0.5 [&>svg]:flex-none [&>svg]:text-v3-blue [&>svg]:opacity-75 " +
  "[&>b]:mt-[22px] [&>b]:font-v3-hand [&>b]:text-[22px] [&>b]:font-semibold [&>b]:leading-none [&>b]:text-v3-blue [&>b]:[transform:rotate(-4deg)]";
export const PLANS = "plans mx-auto grid max-w-[960px] [grid-template-columns:repeat(2,1fr)] gap-[22px] max-[860px]:[grid-template-columns:1fr]";
export const PLAN =
  "relative flex flex-col rounded-[24px] bg-white p-[34px] dark:bg-v3-bg2-d " +
  "[transition:transform_.32s_var(--ease-v3),box-shadow_.32s] hover:[transform:translateY(-6px)] hover:shadow-[0_44px_80px_-48px_rgba(6,9,17,.45)]";
export const PLAN_PLAIN = "border border-v3-line2 dark:border-v3-line-d";
export const PLAN_BEST =
  "border-2 border-transparent shadow-[0_44px_84px_-46px_rgba(21,93,252,.5)] " +
  "[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(140deg,var(--color-v3-cyan),var(--color-v3-blue))_border-box] " +
  "dark:border-v3-line-d dark:[background:var(--color-v3-bg2-d)]";
export const PLAN_TAG =
  "absolute left-[34px] top-[-14px] rounded-full px-[14px] py-[5px] text-[12px] font-semibold text-white " +
  "[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] shadow-[0_10px_22px_-9px_rgba(21,93,252,.6)]";
export const PN = "font-v3-display text-[20px] font-semibold tracking-[-.035em]";
export const PD = "mt-1.5 text-[14.5px] text-v3-mut dark:text-v3-mut-d";
export const PR =
  "mt-5 flex items-baseline gap-[9px] font-v3-display text-[clamp(43px,5.1vw,59px)] font-semibold leading-none tracking-[-.055em] " +
  "[&>small]:font-v3-sans [&>small]:text-[16px] [&>small]:font-medium [&>small]:tracking-normal [&>small]:text-v3-mut dark:[&>small]:text-v3-mut-d";
export const YR = "mt-[9px] min-h-[20px] text-[13.5px] text-v3-mut dark:text-v3-mut-d";
export const WORTH =
  "mt-[22px] rounded-[15px] border border-[rgba(21,93,252,.12)] bg-v3-wash px-[19px] py-[17px] text-[14px] leading-[1.58] text-v3-ink2 dark:bg-v3-wash-d dark:text-v3-ink2-d";
export const INC =
  "mt-6 border-t border-v3-line pt-[22px] font-v3-mono text-[10.5px] uppercase tracking-[.14em] text-v3-faint dark:border-v3-line-d dark:text-v3-faint-d";
export const PLAN_UL = "mx-0 mb-7 mt-[22px] grid list-none gap-3 p-0 text-[15px]";
export const PLAN_LI =
  "flex items-start gap-[11px] text-v3-ink2 dark:text-v3-ink2-d [&_b]:font-bold [&_b]:text-v3-ink dark:[&_b]:text-v3-ink-d";
export const PLAN_LI_I =
  "mt-0.5 grid h-[19px] w-[19px] flex-none place-items-center rounded-full bg-v3-wash text-v3-blue dark:bg-v3-wash-d";

/* ── the FAQ: a sticky side panel beside the accordion ── */
export const FAQWRAP =
  "grid grid-cols-[.82fr_1.18fr] items-start gap-[clamp(30px,5vw,70px)] max-[940px]:[grid-template-columns:minmax(0,1fr)]";

/* ── the closing panel, the same field the shared CTA block uses ── */
export const FINALE =
  "relative overflow-hidden rounded-[30px] p-[clamp(48px,7.5vw,94px)] text-center " +
  "[background:radial-gradient(88%_88%_at_14%_0%,#3a86ff,#0b3499_54%,#07204f_100%)] " +
  "before:absolute before:bottom-[-330px] before:right-[-200px] before:h-[680px] before:w-[680px] before:rounded-full before:bg-[rgba(0,197,232,.34)] before:[filter:blur(120px)] before:content-[''] " +
  "after:absolute after:inset-0 after:opacity-[.16] after:content-[''] " +
  "after:[background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] " +
  "after:[background-size:64px_64px] " +
  "after:[-webkit-mask-image:radial-gradient(72%_70%_at_50%_20%,#000,transparent_80%)] " +
  "after:[mask-image:radial-gradient(72%_70%_at_50%_20%,#000,transparent_80%)]";
export const RINGS_FIN =
  "pointer-events-none absolute bottom-[-58%] left-1/2 z-0 h-[1180px] w-[1180px] [transform:translateX(-50%)] " +
  "[&>i]:absolute [&>i]:inset-0 [&>i]:rounded-full [&>i]:border [&>i]:border-[rgba(140,228,245,.13)] " +
  "[&>i:nth-child(2)]:inset-[130px] [&>i:nth-child(2)]:border-[rgba(140,228,245,.1)] " +
  "[&>i:nth-child(3)]:inset-[260px] [&>i:nth-child(3)]:border-[rgba(140,228,245,.07)]";

/* ── the trust strip and the three quotes ── */
export const TRUST =
  "border-y border-v3-line bg-v3-bg2 py-8 text-center dark:border-v3-line-d dark:bg-v3-bg2-d";
export const BADGES = "mb-[14px] flex flex-wrap items-center justify-center gap-8";
export const BADGE =
  "flex items-center gap-[9px] text-[13px] font-semibold text-v3-ink2 dark:text-v3-ink2-d [&>svg]:flex-none [&>svg]:text-v3-blue";
export const QUOTE =
  "relative m-0 flex flex-col gap-[22px] rounded-[20px] border border-v3-line bg-white p-[30px] dark:border-v3-line-d dark:bg-v3-bg2-d " +
  "[transition:.32s_var(--ease-v3)] hover:border-v3-line2 hover:[transform:translateY(-6px)] hover:shadow-[0_32px_60px_-42px_rgba(6,9,17,.45)] " +
  "before:absolute before:left-[30px] before:top-[-1px] before:h-[3px] before:w-[44px] before:rounded-b-[3px] before:opacity-0 before:[transition:opacity_.3s] before:content-[''] " +
  "before:[background:linear-gradient(90deg,var(--color-v3-cyan),var(--color-v3-blue))] hover:before:opacity-100 " +
  "[&_b]:block [&_b]:text-[14.5px] [&_b]:font-semibold [&_small]:text-[13px] [&_small]:text-v3-mut dark:[&_small]:text-v3-mut-d";
export const QUOTE_BQ = "m-0 text-[17px] leading-[1.58] text-v3-ink2 dark:text-v3-ink2-d";
export const QUOTE_CAP = "mt-auto flex items-center gap-3";
export const QAV =
  "grid h-10 w-10 flex-none place-items-center rounded-full bg-v3-wash text-[13px] font-bold text-v3-blue dark:bg-v3-wash-d";

/* ── the safety section ──
   The prototype called this ground `.dark`, which now collides with Tailwind's
   own dark variant: every `dark:` utility inside would match `.dark *` in light
   mode. The ground is `v3-night`, and landing-effects.js follows the same name
   for the cursor halo it parents here. */
export const NIGHT =
  "relative isolate overflow-hidden bg-v3-ink text-[#e8effa] " +
  "before:absolute before:left-1/2 before:top-[-360px] before:z-[-1] before:h-[780px] before:w-[1050px] before:rounded-full before:bg-[rgba(21,93,252,.24)] " +
  "before:[filter:blur(150px)] before:[transform:translateX(-50%)] before:content-[''] " +
  "after:absolute after:bottom-[-280px] after:right-[-160px] after:z-[-1] after:h-[520px] after:w-[620px] after:rounded-full after:bg-[rgba(0,184,219,.15)] " +
  "after:[filter:blur(130px)] after:content-['']";
export const SPOT =
  "pointer-events-none absolute z-0 h-[520px] w-[520px] rounded-full opacity-0 [transition:opacity_.5s] " +
  "[background:radial-gradient(circle,rgba(0,184,219,.14),transparent_62%)]";
export const SGRID = "relative z-[1] grid [grid-template-columns:repeat(2,1fr)] gap-5 max-[880px]:[grid-template-columns:1fr]";
export const SC =
  "sc rounded-[20px] border border-[rgba(255,255,255,.09)] bg-[rgba(255,255,255,.028)] p-7 [backdrop-filter:blur(8px)] " +
  "[transition:transform_.34s_var(--ease-v3),border-color_.34s,background_.34s] " +
  "hover:border-[rgba(46,200,234,.36)] hover:bg-[rgba(255,255,255,.05)] hover:[transform:translateY(-5px)] " +
  "dark:border-v3-line-d dark:bg-v3-bg2-d dark:hover:bg-v3-bg2-d";
export const SC_HD = "flex items-center gap-[11px] [&>svg]:flex-none [&>svg]:text-[#2ec8ea]";
export const SC_H3 = "m-0 font-v3-display! text-[19.5px] font-semibold! leading-[1.2] tracking-[-.032em]! text-white";
export const SC_P = "mt-3 text-[15px] text-[#93a7c5]";
export const IPCHIP =
  "mt-[22px] flex items-start gap-[11px] rounded-[13px] border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.032)] px-4 py-[14px] " +
  "[&_code]:block [&_code]:font-v3-mono [&_code]:text-[13.5px] [&_code]:text-[#dbe6f5] " +
  "[&_small]:mt-1 [&_small]:block [&_small]:text-[12px] [&_small]:text-[#6f8199]";
export const IPCHIP_LAMP =
  "mt-1.5 h-[7px] w-[7px] flex-none animate-v3-breathe rounded-full bg-[#22c55e] shadow-[0_0_0_4px_rgba(34,197,94,.16)] [animation-duration:2.4s]";
/* Four bars that grow to their --h once the card is seen. */
export const BARS =
  "mt-6 grid h-[132px] [grid-template-columns:repeat(4,1fr)] items-end gap-3 " +
  "[&>div]:flex [&>div]:h-full [&>div]:flex-col [&>div]:justify-end [&>div]:text-center " +
  "[&_b]:mb-2 [&_b]:font-v3-mono [&_b]:text-[11.5px] [&_b]:font-medium [&_b]:text-[#dbe6f5] " +
  "[&_i]:block [&_i]:h-0 [&_i]:rounded-t-[10px] [&_i]:rounded-b-[3px] [&_i]:[background:linear-gradient(180deg,#2ec8ea,#1b62f0)] " +
  "[&_i]:[transition:height_1.15s_var(--ease-v3)] [.sc.seen_&_i]:h-[var(--h)] " +
  "[&_span]:mt-2.5 [&_span]:font-v3-mono [&_span]:text-[9.5px] [&_span]:tracking-[.1em] [&_span]:text-[#6f8199]";
export const WEEK =
  "mt-6 grid [grid-template-columns:repeat(7,1fr)] gap-2 " +
  "[&_u]:relative [&_u]:block [&_u]:h-[76px] [&_u]:overflow-hidden [&_u]:rounded-[9px] [&_u]:bg-[rgba(255,255,255,.05)] " +
  "[&_u]:after:absolute [&_u]:after:left-0 [&_u]:after:right-0 [&_u]:after:top-[var(--t)] [&_u]:after:h-0 [&_u]:after:opacity-[.85] [&_u]:after:content-[''] " +
  "[&_u]:after:[background:linear-gradient(180deg,#2ec8ea,#1b62f0)] [&_u]:after:[transition:height_.9s_var(--ease-v3)_var(--dl,0s)] " +
  "[.sc.seen_&_u]:after:h-[var(--hh)] " +
  "[&_span]:mt-2 [&_span]:block [&_span]:text-center [&_span]:font-v3-mono [&_span]:text-[9.5px] [&_span]:tracking-[.08em] [&_span]:text-[#6f8199]";
export const WEEK_OFF = "[&_u]:after:hidden";
export const ALERT =
  "mt-[22px] flex items-start gap-3 rounded-[13px] border border-[rgba(245,158,11,.3)] bg-[rgba(245,158,11,.07)] px-4 py-[14px] " +
  "[&>svg]:mt-px [&>svg]:flex-none [&>svg]:text-[#f59e0b] " +
  "[&_b]:block [&_b]:text-[13.5px] [&_b]:font-semibold [&_b]:text-[#fbe3b4] " +
  "[&_small]:mt-1 [&_small]:block [&_small]:text-[12.5px] [&_small]:text-[#a89376]";
export const HARD =
  "relative z-[1] mt-5 grid [grid-template-columns:repeat(4,1fr)] gap-[18px] max-[860px]:[grid-template-columns:repeat(2,1fr)]";
export const HARD_CELL =
  "rounded-[18px] border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.02)] px-[22px] py-[26px] text-center " +
  "[transition:transform_.3s_var(--ease-v3),border-color_.3s] hover:border-[rgba(46,200,234,.32)] hover:[transform:translateY(-4px)]";
export const HARD_B =
  "block font-v3-display text-[clamp(37px,4.3vw,49px)] font-semibold leading-none tracking-[-.055em] text-transparent bg-clip-text " +
  "[background-image:linear-gradient(96deg,#2ec8ea,#6a9bff)]";
export const HARD_P = "mt-[14px] text-[14px] text-[#93a7c5]";
export const SFOOT =
  "relative z-[1] mt-7 max-w-[76ch] border-l-2 border-[#1b62f0] pl-[18px] text-[15px] text-[#93a7c5]";

/* ── the rejected / sent message pair ── */
export const MSG = "relative rounded-[20px] border p-7";
export const MSG_BAD = "border-[#f5ded5] bg-[#fdf6f3] dark:border-[#3a1f24] dark:bg-[#1b1114]";
export const MSG_GOOD = "border-[#cbe9dc] bg-[#f1fbf7] dark:border-[#1d3a2f] dark:bg-[#0d1a16]";
export const MSG_TG =
  "mb-[18px] inline-flex items-center gap-[7px] rounded-full px-[11px] py-[5px] font-v3-mono text-[10px] uppercase tracking-[.13em]";
export const MSG_TG_BAD = "bg-[#fae4dc] text-[#b03d27] dark:bg-[#3a1f24] dark:text-[#f0b8ab]";
export const MSG_TG_GOOD = "bg-[#d6f1e4] text-[#0a7853]";
export const MSG_BD =
  "text-[15.5px] leading-[1.66] text-v3-ink2 dark:text-v3-ink2-d [&_s]:text-[#b03d27] [&_s]:[text-decoration-color:#e0a08e]";
export const REJ =
  "mt-[15px] flex flex-wrap gap-[7px] [&>span]:rounded-[7px] [&>span]:bg-[#fae4dc] [&>span]:px-2.5 [&>span]:py-[5px] [&>span]:font-v3-mono [&>span]:text-[10.5px] [&>span]:text-[#b03d27] " +
  "dark:[&>span]:bg-[#3a1f24] dark:[&>span]:text-[#f0b8ab]";
export const MSG_WHY =
  "mt-5 border-t border-dashed border-v3-line2 pt-[18px] text-[13.5px] text-v3-mut dark:border-v3-line2-d dark:text-v3-mut-d";

/* ── the MCP panel: a near-black ground with four branded cards ── */
export const MCP =
  "relative isolate overflow-hidden bg-v3-ink text-[#e8effa] " +
  "before:absolute before:left-1/2 before:top-[-340px] before:z-[-1] before:h-[760px] before:w-[1000px] before:rounded-full before:bg-[rgba(21,93,252,.2)] " +
  "before:[filter:blur(150px)] before:[transform:translateX(-50%)] before:content-['']";
/* The hand-drawn ellipse around one word, drawn on when it scrolls in. */
export const CIRCLED =
  "circled relative inline-block whitespace-nowrap " +
  "after:pointer-events-none after:absolute after:bottom-[-4%] after:top-[4%] after:left-[calc(-1*clamp(13px,2.1vw,30px))] after:right-[calc(-1*clamp(13px,2.1vw,30px))] " +
  "after:rounded-[50%] after:border-[2.4px] after:border-[#2ec8ea] after:opacity-0 after:content-[''] " +
  "after:[transform:rotate(-2.5deg)_scale(.72)] after:[transition:transform_.9s_var(--ease-v3)_.2s,opacity_.5s_var(--ease-v3)_.2s] " +
  "[&.seen]:after:opacity-100 [&.seen]:after:[transform:rotate(-2.5deg)_scale(1)]";
export const MCPGRID = "mt-14 grid [grid-template-columns:repeat(2,1fr)] gap-[22px] max-[900px]:[grid-template-columns:1fr]";
export const MCARD =
  "relative isolate flex flex-col overflow-hidden rounded-[32px] p-9 dark:bg-v3-bg2-d " +
  "[transition:transform_.38s_var(--ease-v3),box-shadow_.38s_var(--ease-v3)] hover:[transform:translateY(-6px)] " +
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] before:p-px before:content-[''] " +
  "before:[background:linear-gradient(180deg,rgba(255,255,255,.16),transparent_34%)] " +
  "before:[-webkit-mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] " +
  "after:absolute after:inset-0 after:z-[-1] after:rounded-[inherit] after:content-['']";
export const MCARD_A =
  "hover:shadow-[0_40px_80px_-40px_#10a37f] after:[background:linear-gradient(327deg,#10a37f_2%,#04352b_78%)]";
export const MCARD_B =
  "hover:shadow-[0_40px_80px_-40px_#ff4d4d] after:[background:linear-gradient(327deg,#ff4d4d_2%,#3f0d0d_78%)]";
export const MCARD_C =
  "hover:shadow-[0_40px_80px_-40px_#d97757] after:[background:linear-gradient(327deg,#d97757_2%,#3d1a10_78%)]";
export const MCARD_D =
  "hover:shadow-[0_40px_80px_-40px_#00b8db] after:[background:linear-gradient(327deg,#00b8db_2%,#062a4d_78%)]";
export const MCARD_FLIP = "justify-start [&>div:last-child]:[order:-1] [&>div:last-child]:mb-7 [&>div:last-child]:mt-0";
export const MCARD_H3 =
  "mt-6 font-v3-display! text-[clamp(24px,2.6vw,31px)] font-semibold! leading-[1.2] tracking-[-.04em]! text-white";
export const MCARD_P = "mt-[11px] max-w-[44ch] text-[15.5px] text-[rgba(255,255,255,.78)]";
export const MTILE =
  "relative grid h-[68px] w-[68px] flex-none place-items-center rounded-[21px] border border-[rgba(255,255,255,.24)] bg-[rgba(255,255,255,.16)] shadow-[0_10px_30px_-12px_rgba(0,0,0,.5)] " +
  "[&>svg]:h-10 [&>svg]:w-10 [&>svg]:fill-white " +
  "after:absolute after:-inset-4 after:z-[-1] after:rounded-[30px] after:content-[''] after:[background:radial-gradient(circle,rgba(255,255,255,.22),transparent_70%)]";
export const CHAT =
  "mt-[26px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,.09)] bg-[rgba(6,10,20,.55)] [backdrop-filter:blur(14px)_saturate(1.2)]";
export const CHATHEAD =
  "flex items-center gap-2.5 border-b border-[rgba(255,255,255,.07)] px-[15px] py-3 " +
  "[&_b]:block [&_b]:text-[13.5px] [&_b]:font-semibold [&_b]:leading-[1.2] [&_b]:text-white " +
  "[&_small]:text-[11.5px] [&_small]:text-[#6f8199]";
export const CHAT_AV =
  "grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[rgba(255,255,255,.08)] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:fill-white";
export const CHATBODY = "grid gap-[11px] px-[15px] py-4";
export const BUB = "max-w-[88%] rounded-[14px] px-[14px] py-[11px] text-[13.5px] leading-[1.5]";
export const BUB_ME =
  "ml-auto rounded-br-[5px] text-white [background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))]";
export const BUB_IT = "rounded-bl-[5px] bg-[rgba(255,255,255,0.1)] text-[#eaf2fb] [&_b]:font-semibold [&_b]:text-white";
export const MRUN =
  "flex items-center gap-2 px-[15px] pb-[15px] font-v3-mono text-[11px] text-[rgba(255,255,255,.55)]";
export const MRUN_DOT = "h-[6px] w-[6px] flex-none animate-v3-breathe rounded-full bg-[#22c55e]";
export const MCPFOOT =
  "mt-[26px] flex flex-wrap items-center justify-between gap-7 border-t border-[rgba(255,255,255,.09)] pt-[34px]";

/* The hairline between sections, with a mono plus sign sitting on it. */
export const RULE =
  "relative mx-auto h-px max-w-[1220px] bg-v3-line dark:bg-v3-line-d " +
  "after:absolute after:left-1/2 after:top-1/2 after:px-[9px] after:font-v3-mono after:text-[14px] after:leading-none after:text-v3-line2 after:content-['+'] " +
  "after:[transform:translate(-50%,-50%)] after:bg-v3-bg dark:after:bg-v3-bg-d dark:after:text-v3-line2-d";
export const RULE_ON2 = RULE.replace("after:bg-v3-bg ", "after:bg-v3-bg2 ").replace(
  "dark:after:bg-v3-bg-d",
  "dark:after:bg-v3-bg2-d",
);

/* The four capability rows, alternating ground and side. */
export const CAPS =
  "overflow-hidden rounded-[24px] border border-v3-line bg-white dark:border-v3-line-d dark:bg-v3-bg-d";
export const CAP =
  "grid grid-cols-[1fr_1.12fr] items-center gap-[clamp(26px,4vw,58px)] border-b border-v3-line p-[clamp(30px,4vw,52px)] last:border-b-0 dark:border-v3-line-d max-[940px]:[grid-template-columns:minmax(0,1fr)]";
export const CAP_ALT = CAP + " bg-v3-bg2 dark:bg-v3-bg2-d";
export const CAP_TXT = "dark:bg-v3-bg2-d";
export const CAP_TXT_ALT = "[order:2] dark:bg-v3-bg2-d max-[940px]:[order:0]";
export const CAP_H3 =
  "mt-[18px] font-v3-display! text-[clamp(23px,2.7vw,31px)] font-semibold! leading-[1.2] tracking-[-.04em]!";
export const CAP_P = "mt-[13px] max-w-[46ch] text-[16px] text-v3-mut dark:text-v3-mut-d";

/* ── the hub band: an editorial split whose figure changes side ──
   A hub page lists things, and the shape every hub reaches for is a grid of
   tiles, which is the shape you get when nobody decided what the section was
   for. These bands decide: each one is a stage of the same job, its items are
   rows on a hairline rather than boxes, and the figure beside them shows that
   stage happening. /features, /industries, /for and /use-cases all have the
   same problem, so the vocabulary is shared rather than drawn again. */
export const BAND =
  "grid grid-cols-[1.02fr_.98fr] items-center gap-[clamp(30px,5vw,74px)] max-[940px]:[grid-template-columns:minmax(0,1fr)]";
/* The figure leads on the even bands. On a phone the text always leads, because
   a picture of a thing you have not been told about yet explains nothing. */
export const BAND_FIG_FIRST = "[order:-1] max-[940px]:[order:0]";

/* The contents rail under a hub hero: vertical hairlines, no boxes. */
export const FINDEX =
  "grid [grid-template-columns:repeat(6,1fr)] gap-y-7 max-[900px]:[grid-template-columns:repeat(3,1fr)] max-[560px]:[grid-template-columns:repeat(2,1fr)]";
export const FIX =
  "group flex flex-col gap-2 border-l border-v3-line pl-[18px] pr-3 dark:border-v3-line-d " +
  "max-[900px]:[&:nth-child(3n+1)]:border-l-0 max-[900px]:[&:nth-child(3n+1)]:pl-0 " +
  "max-[560px]:[&:nth-child(2n+1)]:border-l-0 max-[560px]:[&:nth-child(2n+1)]:pl-0 " +
  "min-[901px]:first:border-l-0 min-[901px]:first:pl-0";
export const FIX_N =
  "font-v3-mono text-[10.5px] tracking-[.14em] text-v3-faint [transition:color_.3s]! group-hover:text-v3-blue dark:text-v3-faint-d";
export const FIX_T =
  "font-v3-display text-[15.5px] font-semibold leading-[1.25] tracking-[-.032em] text-v3-ink [transition:color_.3s]! group-hover:text-v3-blue dark:text-v3-ink-d";
export const FIX_C = "font-v3-sans text-[13px] font-normal text-v3-faint dark:text-v3-faint-d";

/* One item inside a band: a row on a hairline that grows a gradient edge and
   pushes right under the cursor.
   The reveal is built into the row rather than staggered from the parent.
   globals.css sets `transition: all .2s ease` on every `a` outside any cascade
   layer, so it beats any utility whatever the specificity, and the marked
   shorthand here is the only way to keep both the hover and the reveal. That
   also means the stagger delay has to travel inside the shorthand, as --d0,
   rather than as a transition-delay utility it would reset. */
export const FROW =
  "rv group relative grid grid-cols-[1fr_auto] items-center gap-5 border-t border-v3-line py-[19px] last:border-b " +
  "opacity-0 [transform:translateY(18px)] [filter:blur(5px)] dark:border-v3-line-d " +
  "[transition:padding_.34s_var(--ease-v3),opacity_.72s_var(--ease-v3)_var(--d0,0s),transform_.72s_var(--ease-v3)_var(--d0,0s),filter_.72s_var(--ease-v3)_var(--d0,0s)]! " +
  "[&.seen]:opacity-100 [&.seen]:[transform:none] [&.seen]:[filter:none] hover:pl-[15px] " +
  "before:absolute before:bottom-[13px] before:left-0 before:top-[13px] before:w-[2px] before:rounded-full before:opacity-0 before:content-[''] " +
  "before:[background:linear-gradient(180deg,var(--color-v3-cyan),var(--color-v3-blue))] before:[transition:opacity_.34s_var(--ease-v3)] " +
  "hover:before:opacity-100";
export const FROW_H3 =
  "font-v3-display! text-[17.5px] font-semibold! leading-[1.25] tracking-[-.032em]! text-v3-ink [transition:color_.3s] group-hover:text-v3-blue dark:text-v3-ink-d";
export const FROW_P =
  "mt-[7px] max-w-[52ch] text-[14.5px] leading-[1.55]! text-v3-mut dark:text-v3-mut-d";
export const FROW_GO =
  "grid h-9 w-9 flex-none place-items-center rounded-full border border-v3-line text-v3-faint dark:border-v3-line-d dark:text-v3-faint-d " +
  "[transition:transform_.3s_var(--ease-v3),border-color_.3s,color_.3s,background_.3s] " +
  "group-hover:border-transparent group-hover:text-white group-hover:[transform:translateX(3px)] " +
  "group-hover:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))]";

/* The mock frame again, holding a light interface instead of a video. */
export const SCREEN_UI =
  "m-0 overflow-hidden rounded-[16px] border border-v3-line2 bg-white shadow-[0_44px_90px_-50px_rgba(6,9,17,.5)] dark:border-v3-line-d dark:bg-v3-bg2-d";

/* The setup section: a sticky index beside a dotted spine of steps. */
export const RAILWRAP =
  "grid grid-cols-[250px_1fr] items-start gap-[clamp(28px,5vw,72px)] max-[940px]:[grid-template-columns:minmax(0,1fr)]";
export const RAIL =
  "sticky top-[112px] grid gap-0.5 max-[940px]:hidden " +
  "[&>a]:border-b [&>a]:border-v3-line [&>a]:pb-3 [&>a]:pt-[14px] [&>a]:font-v3-display [&>a]:text-[23px] [&>a]:font-semibold [&>a]:tracking-[-.035em] [&>a]:text-v3-line2 " +
  "[&>a]:[transition:color_.45s_var(--ease-v3),border-color_.45s_var(--ease-v3)]! dark:[&>a]:border-v3-line-d dark:[&>a]:text-v3-line2-d " +
  "[&>a.on]:border-b-v3-blue [&>a.on]:text-v3-ink dark:[&>a.on]:text-v3-ink-d " +
  "[&_small]:mt-[3px] [&_small]:block [&_small]:max-h-0 [&_small]:overflow-hidden [&_small]:font-v3-sans [&_small]:text-[13px] [&_small]:font-normal [&_small]:tracking-normal [&_small]:text-v3-faint [&_small]:opacity-0 " +
  "[&_small]:[transition:opacity_.45s_var(--ease-v3),max-height_.45s_var(--ease-v3)] dark:[&_small]:text-v3-faint-d " +
  "[&>a.on_small]:max-h-[44px] [&>a.on_small]:opacity-100";
export const STEPS =
  "relative grid [grid-template-columns:minmax(0,1fr)] gap-[clamp(34px,4.5vw,60px)] pl-[34px] max-[600px]:pl-6 " +
  "before:absolute before:bottom-[14px] before:left-[5px] before:top-[14px] before:w-px before:content-[''] " +
  "before:[background:repeating-linear-gradient(180deg,var(--color-v3-line2)_0_5px,transparent_5px_11px)] " +
  "dark:before:[background:repeating-linear-gradient(180deg,var(--color-v3-line2-d)_0_5px,transparent_5px_11px)]";
export const STEP =
  "step relative dark:bg-v3-bg2-d [&_.crop]:mt-6 " +
  "before:absolute before:left-[-34px] before:top-[9px] before:h-[11px] before:w-[11px] before:rounded-full before:border-[1.5px] before:border-v3-line2 before:bg-white before:content-[''] " +
  "before:[transition:.5s_var(--ease-v3)] dark:before:border-v3-line2-d max-[600px]:before:left-[-24px] " +
  "[&.seen]:before:border-v3-blue [&.seen]:before:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] [&.seen]:before:shadow-[0_0_0_5px_rgba(21,93,252,.1)]";
export const STEP_H3 =
  "mt-[14px] font-v3-display! text-[clamp(22px,2.6vw,28px)] font-semibold! leading-[1.2] tracking-[-.04em]!";
export const STEP_P = "mt-[11px] max-w-[54ch] text-v3-mut dark:text-v3-mut-d";

/* The numbered pill that opens a capability or a step. */
export const NUMPILL =
  "inline-flex items-center gap-2 rounded-[9px] border border-[rgba(21,93,252,.14)] bg-v3-wash px-[13px] dark:bg-v3-wash-d py-1.5 font-v3-mono text-[11.5px] font-medium text-v3-blue";
export const TICK =
  "mt-5 grid gap-[9px] [&>div]:flex [&>div]:items-start [&>div]:gap-2.5 [&>div]:text-[14.5px] [&>div]:text-v3-ink2 dark:[&>div]:text-v3-ink2-d [&_svg]:mt-1 [&_svg]:flex-none [&_svg]:text-v3-blue";

/* The pill-shaped avatar row and its trust line, on the dark grounds. */
export const TR =
  "flex flex-wrap items-center justify-center gap-[13px] text-[14.5px] text-[rgba(255,255,255,0.7)] [&_b]:font-bold [&_b]:text-white";
export const AVS =
  "flex flex-none [&_img]:-ml-2.5 [&_img]:h-8 [&_img]:w-8 [&_img]:rounded-full [&_img]:border-2 [&_img]:border-[rgba(255,255,255,.85)] [&_img]:bg-[#0b3499] [&_img]:object-cover " +
  "[&_img]:[transition:transform_.3s_var(--ease-v3)] [&_img:first-child]:ml-0 hover:[&_img]:[transform:translateY(-3px)] " +
  "[&_img:hover]:relative [&_img:hover]:z-[2] [&_img:hover]:[transform:translateY(-6px)_scale(1.08)]";

/* The URL capture bar, used in the hero and again in the closing panel. */
export const URLWRAP =
  "relative isolate mx-auto max-w-[600px] " +
  "before:absolute before:-inset-[3px] before:z-[-1] before:rounded-[19px] before:opacity-0 before:[filter:blur(16px)] " +
  "before:[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] before:[transition:opacity_.4s_var(--ease-v3)] before:content-[''] " +
  "hover:before:opacity-70 focus-within:before:opacity-70";
export const URLBAR =
  "flex items-center gap-1 rounded-[16px] border border-[rgba(255,255,255,.22)] bg-[rgba(255,255,255,0.1)] py-[7px] pl-5 pr-[7px] [backdrop-filter:blur(16px)] " +
  "[transition:border-color_.3s,background_.3s] group-focus-within:border-v3-sky group-focus-within:bg-[rgba(255,255,255,.14)] " +
  "max-[600px]:flex-wrap max-[600px]:p-3";
export const URLBAR_INPUT =
  "min-w-0 flex-1 border-0 bg-none px-1.5 py-[13px] font-v3-sans text-[16.5px] text-white outline-0 placeholder:text-[rgba(255,255,255,.45)] " +
  "max-[600px]:[flex:1_0_100%] max-[600px]:px-1 max-[600px]:pb-3 max-[600px]:pt-1.5";



/* ── the FAQ accordion, shared by the home, /pricing and every landing FAQ ── */
export const FAQSIDE = "sticky top-[112px] max-[940px]:static";
export const ASKCARD =
  "mt-[30px] rounded-[18px] border border-v3-line2 bg-v3-bg2 p-6 dark:border-v3-line-d dark:bg-v3-bg2-d " +
  "[&>b]:block [&>b]:font-v3-display [&>b]:text-[17px] [&>b]:font-semibold [&>b]:tracking-[-.032em] " +
  "[&>p]:mt-2 [&>p]:text-[14.5px] [&>p]:text-v3-mut dark:[&>p]:text-v3-mut-d";
export const FILL_SM =
  "fill relative isolate mt-[18px] inline-flex cursor-pointer items-center justify-center gap-[9px] overflow-hidden whitespace-nowrap " +
  "rounded-[11px] border border-transparent bg-white px-[17px] py-[9px] font-v3-sans text-[14px] font-semibold text-v3-deep " +
  "shadow-[0_2px_6px_-2px_rgba(6,9,17,.16),0_10px_26px_-14px_rgba(6,9,17,.4)] " +
  "[transition-property:transform,box-shadow,color]! [transition-duration:240ms,280ms,340ms]! [transition-timing-function:var(--ease-v3),ease,var(--ease-v3)]! " +
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] before:content-[''] " +
  "before:[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))] " +
  "before:[transform:translateY(102%)] before:[transition:transform_.46s_var(--ease-v3)] " +
  "hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_16px_34px_-14px_rgba(21,93,252,.62)] hover:before:[transform:translateY(0)] " +
  "[&_svg]:[transition:transform_.26s_var(--ease-v3)] hover:[&_svg]:[transform:translateX(4px)]";
export const Q =
  "q relative rounded-[16px] border border-v3-line bg-white dark:border-v3-line-d dark:bg-v3-bg2-d " +
  "[transition:border-color_.3s_var(--ease-v3),box-shadow_.3s_var(--ease-v3),transform_.3s_var(--ease-v3)] " +
  "hover:border-v3-line2 hover:[transform:translateY(-2px)] hover:shadow-[0_20px_40px_-32px_rgba(6,9,17,.55)] " +
  "dark:hover:border-v3-line2-d dark:hover:shadow-[0_20px_40px_-32px_rgba(0,0,0,.75)] " +
  "[&.open]:border-transparent [&.open]:shadow-[0_28px_54px_-38px_rgba(21,93,252,.5)] [&.open]:[transform:none] " +
  "[&.open]:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(140deg,var(--color-v3-cyan),var(--color-v3-blue))_border-box] " +
  "dark:[&.open]:shadow-[0_28px_54px_-38px_rgba(21,93,252,.55)] " +
  "dark:[&.open]:[background:linear-gradient(var(--color-v3-bg2-d),var(--color-v3-bg2-d))_padding-box,linear-gradient(140deg,var(--color-v3-cyan),var(--color-v3-blue))_border-box]";
export const Q_BTN =
  "flex w-full cursor-pointer items-center gap-[15px] border-0 bg-none px-6 py-[22px] text-left font-v3-display text-[17.5px] font-semibold leading-[1.3] tracking-[-.032em] text-v3-ink dark:text-v3-ink-d";
export const Q_IX =
  "flex-none font-v3-mono text-[11px] text-v3-faint [transition:color_.3s] dark:text-v3-faint-d [.open_&]:text-v3-blue";
export const Q_PM =
  "ml-auto grid h-7 w-7 flex-none place-items-center rounded-full bg-v3-bg3 dark:bg-v3-bg3-d dark:text-v3-ink2-d " +
  "[transition:transform_.36s_var(--ease-v3),background_.26s,color_.26s] " +
  "[.open_&]:text-white [.open_&]:[transform:rotate(135deg)] [.open_&]:[background:linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))]";
export const Q_A_P =
  "max-w-[70ch] pb-6 pl-[58px] pr-6 pt-0 text-[15.5px] text-v3-mut dark:text-v3-mut-d max-[560px]:pl-6";

/* `.hard` was drawn for the dark safety panel; on a light ground it needs its
   own border, ground and numeral. */
export const HARD_LT_CELL =
  "rounded-[18px] border border-v3-line bg-white px-[22px] py-[26px] text-center " +
  "[transition:transform_.3s_var(--ease-v3),border-color_.3s] hover:border-v3-line2 hover:[transform:translateY(-4px)] " +
  "dark:border-v3-line-d dark:bg-v3-bg2-d";
export const HARD_LT_B =
  "block font-v3-display text-[clamp(37px,4.3vw,49px)] font-semibold leading-none tracking-[-.055em] text-transparent bg-clip-text " +
  "[background-image:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))]";
export const HARD_LT_P = "mt-[14px] text-[14px] text-v3-mut dark:text-v3-mut-d";

/* ── the hero field, shared by the home and by every inner page ──
   The inner pages get the same dark ground rather than a light variant of it,
   because a page that is not the home should still look like the same product. */
export const HERO_FIELD =
  "relative isolate overflow-visible pt-[clamp(146px,17vw,204px)] " +
  "[background:radial-gradient(48%_40%_at_12%_-6%,#7fd4f0_0%,transparent_62%),radial-gradient(56%_46%_at_88%_-8%,#00c5e8_0%,transparent_58%),radial-gradient(70%_52%_at_50%_22%,#2a6ff5_0%,transparent_70%),radial-gradient(90%_74%_at_50%_108%,#04143a_0%,transparent_72%),linear-gradient(168deg,#1a5df0_0%,#0a3096_44%,#061a45_100%)] " +
  "before:absolute before:inset-0 before:z-[-1] before:opacity-[.22] before:content-[''] " +
  "before:[background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] " +
  "before:[background-size:80px_80px] " +
  "before:[-webkit-mask-image:radial-gradient(78%_62%_at_50%_16%,#000,transparent_82%)] " +
  "before:[mask-image:radial-gradient(78%_62%_at_50%_16%,#000,transparent_82%)]";
export const HERO_ORB_A =
  "pointer-events-none absolute left-[-180px] top-[-140px] z-0 h-[640px] w-[640px] animate-v3-float rounded-full bg-[rgba(0,197,232,.3)] [filter:blur(90px)]";
export const HERO_ORB_B =
  "pointer-events-none absolute right-[-160px] top-[60px] z-0 h-[560px] w-[560px] rounded-full bg-[rgba(94,150,255,.32)] [animation:v3-float_23s_ease-in-out_infinite_reverse] [filter:blur(90px)]";
export const HERO_RINGS =
  "pointer-events-none absolute left-1/2 top-[34%] z-0 h-[1440px] w-[1440px] [transform:translateX(-50%)] " +
  "[&>i]:absolute [&>i]:inset-0 [&>i]:rounded-full [&>i]:border [&>i]:border-[rgba(140,228,245,.13)] " +
  "[&>i:nth-child(2)]:inset-[130px] [&>i:nth-child(2)]:border-[rgba(140,228,245,.1)] " +
  "[&>i:nth-child(3)]:inset-[260px] [&>i:nth-child(3)]:border-[rgba(140,228,245,.07)]";
export const CARVE =
  "absolute bottom-[-2px] left-[-8%] right-[-8%] z-[2] h-[clamp(50px,7.5vw,120px)] bg-v3-bg [border-radius:50%_50%_0_0/100%_100%_0_0] dark:bg-v3-bg-d";

/** A frosted pill in the hero, one per value proposition. */
export const VPROP =
  "inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,.13)] bg-[rgba(255,255,255,.07)] px-[14px] py-[7px] " +
  "font-v3-sans text-[13.5px] font-medium text-[rgba(255,255,255,.82)] [backdrop-filter:blur(6px)] [&>svg]:flex-none [&>svg]:text-v3-sky";

/** The secondary button beside the hero's primary one, on the dark field. */
export const HERO_BTN =
  "relative inline-flex cursor-pointer items-center justify-center gap-[9px] overflow-hidden rounded-[12px] " +
  "border border-[rgba(255,255,255,.16)] bg-[rgba(255,255,255,.06)] px-[21px] py-[13px] font-v3-sans text-[15px] font-semibold text-white " +
  "[transition:transform_.2s_var(--ease-v3),box-shadow_.22s,border-color_.22s,background_.22s]! " +
  "hover:border-[rgba(255,255,255,.34)] active:[transform:scale(.978)]";

/** The product shot under an inner hero: wider than the reading column. */
export const HVIDEO =
  "relative z-[4] mx-auto mt-[clamp(44px,5.5vw,72px)] w-[min(1080px,100%)] overflow-hidden rounded-[20px] " +
  "border border-[rgba(255,255,255,.12)] shadow-[0_60px_120px_-50px_rgba(0,0,0,.8),0_0_0_1px_rgba(255,255,255,.04)_inset] " +
  "min-[1180px]:w-[calc(100%+110px)] min-[1180px]:[margin-inline:-55px] [&>*]:block [&>*]:w-full";

/* ── the pricing page ──
   The plans sit half on the hero's dark ground and half on the section below.
   The pull is always smaller than the hero's bottom padding, so the cards can
   never ride up over the switch, and it is applied from outside the hero
   because inside it a negative bottom margin collapsed through the container
   and took the whole section with it. */
export const HERO_PRICING = HERO_FIELD + " pb-[clamp(330px,29vw,470px)]";
export const PRHERO =
  "relative z-[6] mx-auto mt-[clamp(-410px,-25vw,-215px)] px-6 text-left max-[820px]:mt-[-170px] " +
  "[&_.plans]:max-w-[1000px] max-[820px]:[&_.plans]:[grid-template-columns:1fr]";
export const PRICING_NEXT = "pt-[clamp(90px,9vw,130px)] max-[820px]:pt-20";
/* The switch sits on the dark field here, and its track and note were drawn
   for a light one. */
export const TOGGLE_ON_DARK =
  "[&_.toggle]:border-[rgba(255,255,255,.18)] [&_.toggle]:bg-[rgba(255,255,255,.1)] " +
  "[&_.toggle>button]:text-[rgba(255,255,255,.7)] [&_.toggle>button.on]:text-v3-ink " +
  "[&_.tgnote]:text-[rgba(255,255,255,.62)] [&_.tgnote>b]:text-v3-sky";

/* What the same job costs assembled, as one bar per row rather than a grid of
   cards. What converts under a plan table is a comparison a person reads in one
   pass, not another card wall. */
export const STACK = "mt-[46px] grid gap-[26px]";
export const SROW =
  "grid grid-cols-[186px_1fr_auto] items-center gap-5 max-[780px]:[grid-template-columns:1fr] max-[780px]:gap-[9px]";
export const SROW_LAB =
  "font-v3-display text-[16px] font-semibold tracking-[-.03em] text-v3-ink dark:text-v3-ink-d " +
  "[&_small]:mt-[3px] [&_small]:block [&_small]:font-v3-sans [&_small]:text-[13px] [&_small]:font-normal [&_small]:text-v3-faint dark:[&_small]:text-v3-faint-d " +
  "max-[760px]:[&_small]:mt-0.5";
export const SROW_TOT =
  "whitespace-nowrap font-v3-display text-[25px] font-semibold tracking-[-.045em] text-v3-ink dark:text-v3-ink-d max-[780px]:text-[21px]";
export const SROW_TOT_WIN =
  "whitespace-nowrap font-v3-display text-[25px] font-semibold tracking-[-.045em] text-v3-blue max-[780px]:text-[21px]";
export const BAR =
  "flex h-[46px] overflow-hidden rounded-[11px] bg-v3-bg3 dark:bg-v3-bg3-d max-[760px]:h-[34px] " +
  "[&>i]:grid [&>i]:place-items-center [&>i]:overflow-hidden [&>i]:whitespace-nowrap [&>i]:not-italic " +
  "[&>i]:font-v3-mono [&>i]:text-[10.5px] [&>i]:tracking-[.04em] [&>i]:text-white max-[760px]:[&>i]:text-[0px]";
export const BAR_US =
  BAR + " [&>i]:[background:linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))]";
export const BAR_A = "bg-[#6a7f9c] dark:bg-[#46586f]";
export const BAR_B = "bg-[#8090ab] dark:bg-[#3a4a5e]";
export const BAR_C = "bg-[#9aa7bd] dark:bg-[#31404f]";
export const BAR_D = "bg-[#b3bccd] dark:bg-[#293440]";
/* Under about 760px the segment labels cannot fit inside their own segments, so
   the amounts move to a legend and the bar keeps doing its job as a proportion. */
export const SLEGEND =
  "mt-2.5 hidden flex-wrap gap-x-[14px] gap-y-[7px] max-[760px]:flex " +
  "[&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:font-v3-mono [&>span]:text-[11px] [&>span]:text-v3-mut dark:[&>span]:text-v3-mut-d " +
  "[&>span]:before:h-[9px] [&>span]:before:w-[9px] [&>span]:before:rounded-[3px] [&>span]:before:bg-current [&>span]:before:content-['']";

/* A real comparison table: rows, not tiles. Below 1023px .responsive-table turns
   every row into a card, and these only restate the v3 palette on top of it. */
export const CTAB =
  "mt-[42px] w-full border-collapse font-v3-sans " +
  "[&_th]:border-b [&_th]:border-v3-line [&_th]:px-[18px] [&_th]:py-[17px] [&_th]:text-left [&_th]:text-[14.8px] " +
  "[&_td]:border-b [&_td]:border-v3-line [&_td]:px-[18px] [&_td]:py-[17px] [&_td]:text-left [&_td]:align-top [&_td]:text-[14.8px] [&_td]:text-v3-mut " +
  "dark:[&_th]:border-v3-line-d dark:[&_td]:border-v3-line-d dark:[&_td]:text-v3-mut-d " +
  "[&_thead_th]:border-b [&_thead_th]:border-v3-line2 [&_thead_th]:pb-[13px] [&_thead_th]:font-v3-mono [&_thead_th]:text-[10.5px] " +
  "[&_thead_th]:uppercase [&_thead_th]:tracking-[.13em] [&_thead_th]:text-v3-faint dark:[&_thead_th]:border-v3-line2-d dark:[&_thead_th]:text-v3-faint-d " +
  "[&_tbody_th]:w-[30%] [&_tbody_th]:font-v3-display [&_tbody_th]:text-[15.5px] [&_tbody_th]:font-semibold [&_tbody_th]:tracking-[-.03em] [&_tbody_th]:text-v3-ink dark:[&_tbody_th]:text-v3-ink-d " +
  "[&_.own]:bg-v3-wash [&_.own]:font-medium [&_.own]:text-v3-ink dark:[&_.own]:bg-v3-wash-d dark:[&_.own]:text-v3-ink-d " +
  "[&_thead_.own]:rounded-t-[12px] [&_thead_.own]:text-v3-blue [&_tr:last-child_.own]:rounded-b-[12px] " +
  "[&_.no]:text-v3-faint dark:[&_.no]:text-v3-faint-d " +
  "max-[1023px]:[&_thead]:hidden max-[1023px]:[&_tbody_tr]:bg-v3-bg max-[1023px]:[&_tbody_tr]:border-v3-line " +
  "max-[1023px]:[&_tbody_th]:block max-[1023px]:[&_tbody_th]:w-auto max-[1023px]:[&_tbody_th]:bg-v3-bg3 max-[1023px]:[&_tbody_th]:text-[14.5px] " +
  "max-[1023px]:[&_tbody_td]:gap-[18px] max-[1023px]:[&_.own]:rounded-none " +
  "dark:max-[1023px]:[&_tbody_tr]:bg-v3-bg-d dark:max-[1023px]:[&_tbody_th]:bg-v3-bg3-d";

/* The trust strip, on the dark ground, borrowed from the home's hard limits. */
export const TSTRIP =
  "mt-[46px] rounded-[26px] bg-[#060c18] px-[clamp(24px,3.4vw,48px)] py-[clamp(38px,4.6vw,60px)] " +
  "[&_h3]:max-w-[22ch] [&_h3]:font-v3-display! [&_h3]:text-[clamp(23px,2.7vw,31px)] [&_h3]:font-semibold! [&_h3]:leading-[1.2]! [&_h3]:tracking-[-.04em]! [&_h3]:text-white " +
  "[&_p.sub]:mt-[13px] [&_p.sub]:max-w-[62ch] [&_p.sub]:text-[15.5px] [&_p.sub]:leading-[1.6]! [&_p.sub]:text-[rgba(255,255,255,.62)]";

/* The guarantee block. It was styled with the split-button class, which gave a
   block of prose a pointer cursor and a button's radius; kept as it renders. */
export const GUARANTEE =
  "relative inline-flex items-stretch overflow-hidden rounded-[13px] border border-transparent bg-white text-v3-deep dark:bg-v3-bg2-d dark:text-v3-ink-d";
