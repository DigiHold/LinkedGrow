"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The progress rail on the generator and repurpose wizards.
 *
 * Both had their own copy, and both painted "done" and "current" the same
 * brand blue, so the rail told you how far the wizard went but not where you
 * were in it. Done is a tick, current is filled, ahead is quiet.
 */
export function StepRail({
  steps,
  current,
  onSelect,
  className,
}: {
  steps: { num: number; label: string }[];
  current: number;
  /** Passed when earlier steps are safe to jump back to. */
  onSelect?: (num: number) => void;
  className?: string;
}) {
  return (
    <ol
      // Wraps rather than scrolls: a rail you have to drag sideways hides the
      // steps it is meant to show, and nothing on this site scrolls horizontally.
      className={cn("flex flex-wrap items-center gap-y-2 gap-x-1 pb-1", className)}
      aria-label="Progress"
    >
      {steps.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        const clickable = done && onSelect;

        const Tag = clickable ? "button" : "div";

        return (
          <li key={s.num} className="flex items-center">
            <Tag
              {...(clickable
                ? { type: "button" as const, onClick: () => onSelect(s.num) }
                : {})}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors",
                active && "bg-cyan-500 text-white",
                done &&
                  "text-slate-600 dark:text-slate-300" +
                    (clickable
                      ? " hover:bg-slate-100 dark:hover:bg-white/5"
                      : ""),
                !active && !done && "text-slate-400 dark:text-slate-500"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                  active && "bg-white/25 text-white",
                  done && "bg-cyan-500 text-white",
                  !active && !done && "bg-slate-100 dark:bg-white/5"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </Tag>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-1 h-px w-5 shrink-0",
                  current > s.num
                    ? "bg-cyan-500"
                    : "bg-slate-200 dark:bg-white/10"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
