import { cn } from "@/lib/utils";

/**
 * The LinkedGrow mark, the same path as src/app/icon.svg.
 *
 * Kept here so nobody draws their own again: the dashboard sidebar carried an
 * invented chart-line icon until 2026-07-26. If the brand mark changes, it
 * changes in icon.svg and here, and nowhere else.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 379 230"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="LinkedGrow"
    >
      <defs>
        <linearGradient
          id="lg-mark-gradient"
          x1=".4809"
          y1="115"
          x2="378.9112"
          y2="115"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#155dfc" />
          <stop offset="1" stopColor="#00b8db" />
        </linearGradient>
      </defs>
      <path
        d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"
        fill="url(#lg-mark-gradient)"
      />
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

export function Logo({ size = "lg", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-bold font-display flex gap-[0.07rem] text-slate-900 dark:text-white",
        sizeClasses[size],
        className
      )}
    >
      Linked
      <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
        Grow
      </span>
    </span>
  );
}
