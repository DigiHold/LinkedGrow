/**
 * What the `.v3` wrapper used to declare, as one string every v3 component
 * puts on its own root.
 *
 * It is here rather than copied into each file because the header and the
 * footer were converted without it and lost the whole type scale: 16px instead
 * of 16.5, lining figures instead of tabular, the app's ink instead of the
 * prototype's. Two roots drifting is exactly what a shared constant prevents.
 *
 * `--e` stays because the word splitter writes it into an inline transition,
 * and the grain is the fixed noise layer each wrapper contributes.
 */

export const V3_GRAIN =
  "after:pointer-events-none after:fixed after:inset-0 after:z-[998] after:opacity-[.032] after:content-[''] dark:after:opacity-[.018] " +
  "after:[background-image:var(--v3-grain)]";

/* The grain is a fixed, full-viewport layer. Every wrapper that carried V3_ROOT
   contributed one, so a page built from five shared blocks and four pricing
   sections stacked nine of them and read as sandpaper. V3_BLOCK is the same
   base without it: the page shell keeps V3_ROOT, everything inside uses
   V3_BLOCK, and the grain lands exactly once. */
// `lg-v3` carries no styles of its own. It is the hook globals.css needs to
// reach every marketing subtree at once, the way `lg-v2` reaches the dashboard,
// so a weight change lands in one rule instead of a hundred glyphs.
const V3_BASE =
  "lg-v3 m-0 max-w-full scroll-smooth overflow-x-clip bg-v3-bg font-v3-sans text-[16.5px] leading-[1.6] tabular-nums text-pretty " +
  "text-v3-ink antialiased dark:bg-v3-bg-d dark:text-v3-ink-d " +
  "[--e:cubic-bezier(.2,.7,.3,1)] [&_svg]:max-w-full " +
  "motion-reduce:[&_*]:[animation-duration:.01s!important] motion-reduce:[&_*]:[animation-iteration-count:1!important]";

export const V3_BLOCK = V3_BASE;
export const V3_ROOT = V3_BASE + " " + V3_GRAIN;
