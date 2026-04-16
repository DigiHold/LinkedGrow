"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

interface RealUser {
  firstName: string;
  plan: "free" | "starter" | "pro" | "business";
  isLifetimeDeal: boolean;
  createdAt: number;
}

interface DisplayItem {
  name: string;
  action: string;
  timeAgo: string;
}

function getPlanActionText(plan: string, isLifetimeDeal: boolean): string {
  if (isLifetimeDeal) return "Got Lifetime Deal";
  switch (plan) {
    case "starter":
      return "Joined Starter plan";
    case "pro":
      return "Joined Pro plan";
    case "business":
      return "Joined Business plan";
    case "free":
    default:
      return "Started free trial";
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return "recently";
}

export function ActivityToast() {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState<DisplayItem | null>(null);

  const realUsersRef = useRef<RealUser[]>([]);
  const cycleIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRealUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/social-proof/recent-users");
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.users)) {
        realUsersRef.current = json.users;
        cycleIndexRef.current = 0;
      }
    } catch {
      // Silently fail - notification just won't appear
    }
  }, []);

  const buildNextDisplay = useCallback((): DisplayItem | null => {
    const real = realUsersRef.current;
    if (real.length === 0) return null;

    const u = real[cycleIndexRef.current % real.length];
    cycleIndexRef.current++;

    if (cycleIndexRef.current >= real.length) {
      void fetchRealUsers();
    }

    return {
      name: u.firstName,
      action: getPlanActionText(u.plan, u.isLifetimeDeal),
      timeAgo: formatTimeAgo(u.createdAt),
    };
  }, [fetchRealUsers]);

  const scheduleNext = useCallback(
    (delay: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const next = buildNextDisplay();
        if (!next) {
          scheduleNext(5000);
          return;
        }
        setDisplay(next);
        setVisible(true);

        timeoutRef.current = setTimeout(() => {
          setVisible(false);
          scheduleNext(15000 + Math.random() * 15000);
        }, 4000);
      }, delay);
    },
    [buildNextDisplay]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await fetchRealUsers();
      if (cancelled) return;
      scheduleNext(8000);
    }

    void init();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchRealUsers, scheduleNext]);

  return (
    <AnimatePresence>
      {visible && display && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="hidden sm:block fixed bottom-4 left-4 z-9999 max-w-xs"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {display.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 dark:text-white">
                <span className="font-semibold">{display.name}</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5" />
                {display.action}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {display.timeAgo}
              </p>
            </div>

            <button
              onClick={() => setVisible(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="absolute -inset-1 bg-linear-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-sm -z-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
