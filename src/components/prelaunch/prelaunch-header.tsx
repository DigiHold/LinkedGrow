"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";

interface PrelaunchHeaderProps {
  showCountdown?: boolean;
  timeLeft?: {
    days: number;
    hours: number;
  };
}

export function PrelaunchHeader({ showCountdown = false, timeLeft }: PrelaunchHeaderProps) {
  return (
    <header className="relative z-10 py-6 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/prelaunch" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            Linked<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Grow</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {showCountdown && timeLeft && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>Launching in {timeLeft.days}d {timeLeft.hours}h</span>
            </div>
          )}
          <LanguageSelector />
          <Link href="/sign-in">
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
