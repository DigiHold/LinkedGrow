"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DemoBooker } from "@/components/booking/demo-booker";

/**
 * The header's Watch Demo popup, near fullscreen: the booking under its own
 * heading on the left, the presentation video on the right, so watching and
 * booking are one motion instead of two pages.
 */

const YOUTUBE_ID = "1MVCdQZiN9I";
const AVATAR = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/nicolas-lecocq-2026.avif";

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Escape closes, and the page behind stops scrolling while it is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9996]" role="dialog" aria-modal="true" aria-label="LinkedGrow demo">
      <button
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close demo"
        tabIndex={-1}
      />
      <div className="absolute inset-3 grid overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 sm:inset-6 lg:grid-cols-[1fr_1.05fr]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-[3] flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* The booking side, under its own heading */}
        <div className="flex min-h-0 flex-col overflow-y-auto">
          <div className="px-6 pb-2 pt-7 sm:px-9 sm:pt-9">
            <h2 className="font-display text-[26px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[32px]">
              Let&apos;s build an agent{" "}
              <span className="bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">together</span>
            </h2>
            <p className="mt-2 max-w-[52ch] text-[15px] text-slate-500 dark:text-slate-400">
              15 minutes live with Nicolas, the founder. We build an agent from your own website
              and you see exactly what it would go after for you.
            </p>
          </div>
          <div className="px-3 pb-6 sm:px-6">
            <DemoBooker avatarUrl={AVATAR} framed stacked />
          </div>
        </div>

        {/* The video side */}
        <div className="relative hidden flex-col justify-center bg-slate-950 p-6 sm:p-10 lg:flex">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_28px_70px_-24px_rgba(0,0,0,.85)]">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&mute=1&rel=0&playsinline=1`}
                title="LinkedGrow presentation"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          <p className="relative mt-4 text-center text-sm text-white/60">
            How the agents find clients, in 3 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
