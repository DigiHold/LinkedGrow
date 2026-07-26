import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The v3 marketing design system.
 *
 * Ported from the approved prototype at
 * ~/Downloads/linkedgrow-v2-design/LinkedGrow v3 — Landing.html. Every other
 * marketing page takes these same pieces, so the scale lives here once rather
 * than being re-derived per page and drifting.
 *
 * Scoped under v3 on purpose: the pages that already rank keep their own text,
 * and only their shell changes.
 */

export function Section({
  children,
  className,
  id,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "light" | "tint" | "cream" | "dark";
}) {
  const tones = {
    light: "bg-white dark:bg-slate-950",
    tint: "bg-[#f6f9fd] dark:bg-slate-900/40",
    cream: "bg-[#faf6f1] dark:bg-slate-900/60",
    dark: "bg-[#07204f] text-white dark:bg-[#050c1d]",
  };
  return (
    <section id={id} className={cn("py-[clamp(70px,8.5vw,126px)]", tones[tone], className)}>
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">{children}</div>
    </section>
  );
}

export function Eyebrow({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-instrument text-[12.5px] font-semibold uppercase tracking-[0.16em]",
        onDark ? "text-cyan-300/80" : "text-[#155dfc]"
      )}
    >
      {children}
    </p>
  );
}

/**
 * The display heading. The prototype leans on tight tracking and a short
 * measure, and both matter more than the size: a wide line of this face reads
 * like a document rather than a statement.
 */
export function H2({
  children,
  className,
  onDark = false,
}: {
  children: React.ReactNode;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <h2
      className={cn(
        "font-grotesk text-[clamp(30px,4.2vw,50px)] font-semibold leading-[1.06] tracking-[-0.035em]",
        onDark ? "text-white" : "text-[#060911] dark:text-white",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function Lead({
  children,
  className,
  onDark = false,
}: {
  children: React.ReactNode;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-instrument text-[clamp(16px,1.35vw,18px)] leading-[1.62]",
        onDark ? "text-white/70" : "text-[#586780] dark:text-slate-400",
        className
      )}
    >
      {children}
    </p>
  );
}

export function Btn({
  href,
  children,
  variant = "plain",
  className,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "plain" | "grad" | "ghost" | "onDark";
  className?: string;
  external?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-[9px] rounded-xl px-[21px] py-[13px] font-instrument text-[15px] font-semibold transition-all active:scale-[0.978]";
  const variants = {
    plain:
      "border border-[#d3dde9] bg-white text-[#060911] hover:border-[#1e2a41] hover:shadow-[0_12px_26px_-16px_rgba(6,9,17,.55)] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/30",
    grad: "bg-linear-to-r from-[#00b8db] to-[#155dfc] text-white shadow-[0_14px_32px_-12px_rgba(21,93,252,.55)] hover:brightness-[1.06]",
    ghost:
      "text-[#1e2a41] hover:bg-[#f6f9fd] dark:text-slate-200 dark:hover:bg-white/5",
    onDark: "border border-white/20 bg-white/10 text-white hover:bg-white/16",
  };
  const props = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 sm:p-7",
        tone === "dark"
          ? "border-white/10 bg-white/[0.04]"
          : "border-[#e7edf5] bg-white dark:border-white/10 dark:bg-slate-900",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * The handwritten annotations from the prototype. They carry the one thing a
 * screenshot cannot: somebody pointing at the part that matters.
 */
export function Scribble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-hand text-[19px] leading-[1.15] text-[#155dfc] dark:text-cyan-300",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * A slot for the product footage that has not been shot yet.
 *
 * Deliberately a labelled placeholder rather than a stock image or a fake
 * screenshot: the prototype calls for eight real captures, and inventing
 * something in their place would ship a promise the product has to keep.
 */
export function VideoSlot({
  label,
  title,
  note,
  url,
}: {
  label: string;
  title: string;
  note: string;
  url?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e7edf5] bg-[#f6f9fd] dark:border-white/10 dark:bg-slate-900/60">
      {url && (
        <div className="flex items-center gap-2 border-b border-[#e7edf5] bg-white px-4 py-2.5 dark:border-white/10 dark:bg-slate-900">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e7edf5] dark:bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e7edf5] dark:bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e7edf5] dark:bg-white/15" />
          </span>
          <span className="truncate font-mono text-[11.5px] text-[#8996ac]">{url}</span>
        </div>
      )}
      <div className="flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8996ac]">
          {label}
        </span>
        <span className="font-instrument text-[15px] font-medium text-[#1e2a41] dark:text-slate-200">
          {title}
        </span>
        <span className="font-instrument text-[13px] text-[#8996ac]">{note}</span>
      </div>
    </div>
  );
}
