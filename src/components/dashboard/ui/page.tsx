import { cn } from "@/lib/utils";

/**
 * v2 page primitives.
 *
 * Every dashboard page used to carry its own wrapper padding and its own
 * header block, which is why no two pages lined up. These are the shared
 * pieces, taken from the approved prototype:
 *
 *   - one wrapper, one max width, one padding scale
 *   - a header that is type only. The v1 saturated gradient tile with a lucide
 *     glyph inside is deliberately gone; it is the single element that dated
 *     the old dashboard most.
 *   - pills for the read-only facts that used to be squeezed into the subtitle
 */

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // pb-24 on mobile keeps the last card clear of the iOS home indicator.
    <div
      className={cn(
        "mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: {
  title: string;
  description?: string;
  /** Buttons, right aligned. */
  actions?: React.ReactNode;
  /** Read-only facts, rendered as pills under the actions. */
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[32px] dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {(actions || meta) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {meta}
          {actions}
        </div>
      )}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "brand";
}) {
  const tones = {
    neutral:
      "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    brand: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/** The v2 surface. Replaces bespoke Card usage as pages are converted. */
export function Panel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        padded && "p-5 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelTitle({
  children,
  description,
  actions,
}: {
  children: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
          {children}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          {icon}
        </div>
      )}
      <p className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  tone?: "neutral" | "good";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-slate-900 tabular-nums dark:text-white">
        {value}
      </p>
      {note && (
        <p
          className={cn(
            "mt-2 text-xs",
            tone === "good"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * One shape for every settings field.
 *
 * The forms had grown three different label/hint arrangements: hint above the
 * control on some, below on others, and none at all on the rest. The hint
 * belongs between the label and the control, because that is where it is read
 * before you type rather than after.
 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-medium text-slate-900 dark:text-white"
        >
          {label}
        </label>
        {hint && (
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * The row a settings card ends on. Keeps every Save in the same place, on a
 * rule, instead of floating at whatever height the form happened to end.
 */
export function FieldActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
      {children}
    </div>
  );
}
