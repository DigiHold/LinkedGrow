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
