"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DemoBooker } from "@/components/booking/demo-booker";

/**
 * The header's Watch Demo popup: the presentation video on the left, the
 * booking calendar on the right, so watching and booking are one motion
 * instead of two pages.
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
    <div className="fixed inset-0 z-[9996] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="LinkedGrow demo">
      <button
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close demo"
        tabIndex={-1}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-[1060px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 lg:grid lg:grid-cols-[1.15fr_1fr]">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-[3] flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
          aria-label="Close"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* The video side */}
        <div className="relative flex flex-col justify-center gap-5 bg-slate-950 p-5 sm:p-8">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-[22px] font-bold leading-tight text-white sm:text-[26px]">
              See LinkedGrow find clients, in 3 minutes
            </h2>
            <p className="mt-1.5 text-sm text-white/70">
              Then pick a slot and we build an agent live on your own website.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_60px_-24px_rgba(0,0,0,.8)]">
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
        </div>

        {/* The booking side */}
        <div className="min-h-0 overflow-y-auto">
          <DemoBooker avatarUrl={AVATAR} framed stacked />
        </div>
      </div>
    </div>
  );
}
