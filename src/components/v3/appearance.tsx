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
    <div className="appearance" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <CurrentIcon width={14} height={14} />
        <span>Appearance</span>
        <ChevronDown width={13} height={13} className={open ? "flip" : ""} />
      </button>

      {open && mounted && (
        <div className="appmenu">
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
                className={selected ? "on" : ""}
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
