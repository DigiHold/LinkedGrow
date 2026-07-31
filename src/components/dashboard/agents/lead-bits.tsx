"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/dashboard/ui/page";

/**
 * The pieces every agent tab repeats: a person, a step, a match score, a time.
 *
 * They live here rather than in each tab because a lead rendered one way in the
 * Leads table and another way in the queue reads as two different products.
 */

/** Plain words for each step. The database enum is not user-facing copy. */
export const STEP_LABEL: Record<string, string> = {
  found: "Found",
  queued: "Queued",
  invited: "Invitation sent",
  accepted: "Accepted",
  messaged: "Messaged",
  replied: "Replied",
  finished: "Finished",
  skipped: "Skipped",
  excluded: "Left alone",
};

const STEP_TONE: Record<string, "good" | "warn" | "neutral"> = {
  replied: "good",
  accepted: "good",
  excluded: "warn",
  skipped: "warn",
};

export function StepPill({ step }: { step: string }) {
  return (
    <Pill tone={STEP_TONE[step] ?? "neutral"}>{STEP_LABEL[step] ?? step}</Pill>
  );
}

export function Avatar({
  src,
  name,
  size = 36,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

/**
 * A score with no reason beside it is not credible, so this renders both or
 * neither.
 */
export function MatchScore({
  score,
  reason,
}: {
  score: number | null;
  reason: string | null;
}) {
  if (score === null) return null;
  const strong = score >= 75;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
          strong
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
        )}
      >
        {score}
      </span>
      {reason && (
        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
          {reason}
        </span>
      )}
    </div>
  );
}

/** Short relative time. Anything past a week reads better as a date. */
export function When({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-400">-</span>;
  const then = new Date(value).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  let text: string;
  if (mins < 1) text = "just now";
  else if (mins < 60) text = `${mins} min ago`;
  else if (mins < 1440) text = `${Math.round(mins / 60)} h ago`;
  else if (mins < 10080) text = `${Math.round(mins / 1440)} d ago`;
  else text = new Date(value).toLocaleDateString();
  return (
    <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
      {text}
    </span>
  );
}

/**
 * The tables.
 *
 * One table on a screen, cards on a phone: below md every row becomes a card
 * and each cell prints its own column name above itself. Nothing here ever
 * scrolls sideways, which is a standing rule.
 *
 * Column widths are given, not guessed. Left to itself the browser hands a
 * column as much room as its longest cell wants, and Contact, which holds two
 * lines of name and job title, took a third of the table while the message the
 * agent wrote was squeezed into a strip. `table-fixed` plus a share per column
 * is what keeps the important cell the widest one.
 */
export function Table({
  columns,
  children,
}: {
  columns: Array<{ label: string; width?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="block w-full border-collapse md:table md:table-fixed">
        <colgroup className="hidden md:table-column-group">
          {columns.map((column, i) => (
            <col
              key={`${column.label}-${i}`}
              {...(column.width ? { style: { width: column.width } } : {})}
            />
          ))}
        </colgroup>
        <thead className="hidden md:table-header-group">
          <tr>
            {columns.map((column, i) => (
              <th
                key={`${column.label}-${i}`}
                className="truncate border-b border-border px-3.5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block md:table-row-group">{children}</tbody>
      </table>
    </div>
  );
}

export function Row({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <tr
      className={cn(
        "block border-b border-border px-4 py-4 last:border-b-0 md:table-row md:px-0 md:py-0",
        highlight
          ? "bg-blue-50/60 dark:bg-blue-500/10"
          : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
      )}
    >
      {children}
    </tr>
  );
}

export function Cell({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "block pb-2.5 align-top last:pb-0 md:table-cell md:border-b md:border-border md:px-3.5 md:py-3",
        // A fixed column cannot widen for a long word, so anything that does
        // not fit wraps rather than pushing the table sideways.
        "wrap-break-word",
        className
      )}
    >
      {label && (
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400 md:hidden dark:text-slate-500">
          {label}
        </span>
      )}
      {children}
    </td>
  );
}

/** The LinkedIn mark beside a name, so a row reads as a real person's profile. */
export function LinkedInGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500"
    >
      <path d="M19.6 2H4.4A2.4 2.4 0 002 4.4v15.2A2.4 2.4 0 004.4 22h15.2a2.4 2.4 0 002.4-2.4V4.4A2.4 2.4 0 0019.6 2zM8.2 9.6v9H5.3v-9h2.9zM5.3 7a1.4 1.4 0 111.4 1.2A1.3 1.3 0 015.3 7zm13.4 11.6h-2.9v-4.7c0-1-.5-1.9-1.7-1.9h-.03c-1.15 0-1.63.95-1.63 1.9v4.7H9.6v-9h2.9v1.2a3.6 3.6 0 012.8-1.2c1.9 0 3.4 1.3 3.4 3.9v5.1z" />
    </svg>
  );
}

/** Avatar, name, and what they do. The first cell of every table here. */
export function Contact({
  name,
  title,
  avatarUrl,
  profileUrl,
}: {
  name: string;
  title: string | null;
  avatarUrl: string | null;
  profileUrl: string;
}) {
  return (
    <div className="flex min-w-0 gap-2">
      <Avatar src={avatarUrl} name={name} size={28} />
      <div className="min-w-0">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-1 text-[13px] font-semibold text-slate-900 hover:underline dark:text-white"
        >
          <span className="truncate">{name}</span>
          <LinkedInGlyph />
        </a>
        {title && (
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {title}
          </div>
        )}
      </div>
    </div>
  );
}

/** The score as a bar, with the reason under it in words. */
export function MatchBar({
  score,
  reason,
}: {
  score: number | null;
  reason: string | null;
}) {
  if (score === null) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">-</span>;
  }
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-[5px] w-[46px] shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <i
            className="block h-full rounded-full bg-blue-600"
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </span>
        <span className="text-xs font-semibold text-slate-900 tabular-nums dark:text-white">
          {score}
        </span>
      </div>
      {reason && (
        <div className="mt-[3px] max-w-[24ch] text-xs text-slate-500 dark:text-slate-400">
          {reason}
        </div>
      )}
    </div>
  );
}

/** The evidence line. A signal without its link is a claim, so it links out. */
export function Signal({
  text,
  url,
}: {
  text: string | null;
  url: string | null;
}) {
  if (!text) return null;
  if (!url) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">{text}</span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
    >
      {text}
    </a>
  );
}
