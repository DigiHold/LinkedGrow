"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Where the demo booker gets its calendar. One button, admin only.
 *
 * Google's verification review asks to see the consent flow start from a
 * visible control inside the app, and a founder reconnecting a year from now
 * should not have to remember a URL.
 */
export function CalendarSettings() {
  const params = useSearchParams();
  const justConnected = params.get("connected") === "1";
  const failure = params.get("error");

  const [state, setState] = useState<{ connected: boolean } | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    fetch("/api/google/calendar/status")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setState)
      .catch(() => setCheckFailed(true));
  }, []);

  const connected = justConnected || state?.connected;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          The booker on{" "}
          <a
            href="/book-demo"
            className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
          >
            /book-demo
          </a>{" "}
          reads this calendar to hide the times you are already busy, and writes each booked demo
          into it with a Google Meet link.
        </p>

        {failure && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {failure === "no_refresh_token"
                ? "Google did not return a refresh token, which happens when the app is already authorised. Remove LinkedGrow from your Google account's third-party access, then connect again."
                : "The connection did not complete. Try again."}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          {state === null && !checkFailed ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking the connection...
            </p>
          ) : connected ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Calendar connected</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Busy times are hidden from visitors and new demos land in your calendar.
                </p>
                <a
                  href="/api/google/calendar/connect"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-200"
                >
                  Reconnect with a different account
                </a>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Not connected yet</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Visitors can still book and every demo is emailed to you, but nothing reaches your
                calendar and your own appointments do not block any slots.
              </p>
              <a
                href="/api/google/calendar/connect"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-3 text-[15px] font-bold text-white shadow-lg shadow-cyan-500/20 transition-shadow hover:shadow-xl"
              >
                <CalendarCheck className="h-5 w-5" />
                Connect Google Calendar
              </a>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            What LinkedGrow asks Google for
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <span className="font-medium text-slate-900 dark:text-white">
                See your availability
              </span>{" "}
              (calendar.freebusy), so a slot you are already busy in is never offered. Titles and
              guests of your other events are never read.
            </li>
            <li>
              <span className="font-medium text-slate-900 dark:text-white">
                Create the demo event
              </span>{" "}
              (calendar.events), so the call appears in your calendar with its Meet link and the
              visitor invited.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
