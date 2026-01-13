"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Monitor, ChevronDown, Check } from "lucide-react";

function AppearanceButton() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
        <div className="w-4 h-4" />
        <span>Appearance</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    );
  }

  const currentIcon = resolvedTheme === "dark" ? Moon : Sun;
  const CurrentIcon = currentIcon;

  const options = [
    { value: "system", label: "Auto", icon: Monitor, description: "Follow system" },
    { value: "light", label: "Light", icon: Sun, description: "Always light" },
    { value: "dark", label: "Dark", icon: Moon, description: "Always dark" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
      >
        <CurrentIcon className="w-4 h-4" />
        <span>Appearance</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 animate-scale-in origin-bottom-left">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                  isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">{option.description}</div>
                </div>
                {isSelected && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PrelaunchFooter() {
  return (
    <footer className="relative z-10 py-6 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Mobile layout: stacked */}
        <div className="flex flex-col items-center gap-4 sm:hidden">
          {/* Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Cookie
            </Link>
            <a href="mailto:contact@linkedgrow.ai" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Contact
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-slate-500 dark:text-slate-500">
            &copy; {new Date().getFullYear()} LinkedGrow - Made with love in <span className="inline-block align-middle">🇨🇭</span>
          </p>

          {/* Appearance button */}
          <AppearanceButton />
        </div>

        {/* Desktop layout: horizontal */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          {/* Copyright + Appearance - Left */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              &copy; {new Date().getFullYear()} LinkedGrow - Made with love in <span className="inline-block align-middle">🇨🇭</span>
            </p>
            <AppearanceButton />
          </div>

          {/* Navigation - Right */}
          <nav className="flex flex-wrap items-center justify-end gap-4 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Cookie
            </Link>
            <a href="mailto:contact@linkedgrow.ai" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
