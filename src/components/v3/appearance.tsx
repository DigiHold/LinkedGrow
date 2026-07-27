"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";

/**
 * The appearance control, in the v3 footer where the email used to sit.
 *
 * Same three options as the existing marketing footer, restyled to the
 * prototype's own tokens rather than the app's slate palette, so it reads as
 * part of the footer rather than pasted into it. Mounted-guarded, because
 * reading the resolved theme before hydration renders the wrong icon.
 */

const TRIGGER =
  "inline-flex cursor-pointer items-center gap-[7px] rounded-[9px] border border-v3-line bg-transparent px-[11px] py-1.5 " +
  "font-v3-sans text-[13px] font-medium text-v3-mut [transition:all_.2s_var(--ease-v3)]! " +
  "hover:border-v3-line2 hover:text-v3-ink dark:border-v3-line-d dark:text-v3-mut-d dark:hover:border-v3-line2-d dark:hover:text-v3-ink-d";
const MENU =
  "absolute bottom-[calc(100%+8px)] right-0 z-20 w-[196px] overflow-hidden rounded-[13px] border border-v3-line bg-v3-bg p-[5px] " +
  "shadow-[0_22px_44px_-22px_rgba(6,9,17,.4)] dark:border-v3-line-d dark:bg-v3-bg-d";
const ITEM =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-2.5 py-2 text-left font-v3-sans text-v3-ink2 " +
  "[transition:background_.16s_var(--ease-v3)]! hover:bg-v3-bg2 dark:text-v3-ink2-d dark:hover:bg-v3-bg2-d " +
  "[&>span]:block [&>span]:flex-1 [&_b]:block [&_b]:text-[13.5px] [&_b]:font-semibold " +
  "[&_small]:block [&_small]:text-[11.5px] [&_small]:text-v3-faint dark:[&_small]:text-v3-faint-d";

const OPTIONS = [
  { value: "system", label: "Auto", icon: Monitor, description: "Follow system" },
  { value: "light", label: "Light", icon: Sun, description: "Always light" },
  { value: "dark", label: "Dark", icon: Moon, description: "Always dark" },
];

export function V3Appearance() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const CurrentIcon = !mounted ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={TRIGGER} onClick={() => setOpen(!open)} aria-expanded={open}>
        <CurrentIcon width={14} height={14} />
        <span>Appearance</span>
        <ChevronDown width={13} height={13} className={open ? "[transform:rotate(180deg)]" : ""} />
      </button>

      {open && mounted && (
        <div className={MENU}>
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                className={selected ? `${ITEM} text-v3-blue dark:text-v3-blue` : ITEM}
              >
                <Icon width={14} height={14} />
                <span>
                  <b>{option.label}</b>
                  <small>{option.description}</small>
                </span>
                {selected && <Check width={13} height={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
