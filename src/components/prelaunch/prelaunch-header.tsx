"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";

interface PrelaunchHeaderProps {
  showCountdown?: boolean;
  timeLeft?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export function PrelaunchHeader({ showCountdown = false, timeLeft }: PrelaunchHeaderProps) {
  return (
    <header className="relative z-[9990] py-6 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/prelaunch" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-6 h-6 text-white" fill="currentColor">
              <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
            </svg>
          </div>
          <span className="text-xl font-bold font-display flex gap-[0.07rem] text-slate-900 dark:text-white">
            Linked<span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">Grow</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {showCountdown && timeLeft && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
            </div>
          )}
          <LanguageSelector />
          <Link href="/sign-in">
            <Button variant="outline" size="sm" className="rounded-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
