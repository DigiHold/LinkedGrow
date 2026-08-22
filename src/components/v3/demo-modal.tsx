"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DemoBooker } from "@/components/booking/demo-booker";

/**
 * The header's Watch Demo popup.
 *
 * The video is the sizing driver: the panel wraps it tightly instead of
 * claiming the viewport and framing the video in dark empty space. Its width
 * is 60vw, capped by what the viewport height allows a full 16:9 to be and by
 * 980px, so the video is always whole, never cropped, with no void around it.
 * The booking column is a fixed 385px on the right; on mobile the video
 * stacks on top and the whole panel scrolls.
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
      <div className="absolute left-1/2 top-1/2 flex max-h-[calc(100vh-24px)] w-fit max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900 max-lg:w-[calc(100vw-24px)] lg:flex-row lg:overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-[3] flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
          aria-label="Close"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* The video side: the panel is exactly as big as this makes it */}
        <div className="relative flex shrink-0 flex-col justify-center bg-slate-950 p-4 lg:p-6">
          <div className="relative w-full overflow-hidden rounded-xl border border-white/10 shadow-[0_28px_70px_-24px_rgba(0,0,0,.85)] lg:w-[min(60vw,calc((100vh-170px)*16/9),980px)]">
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
          <p className="mt-3 text-center text-[13px] text-white/60">
            How the agents find clients, in 3 minutes.
          </p>
        </div>

        {/* The booking side, under its own heading, a fixed 385px on desktop */}
        <div className="flex min-h-0 w-full flex-col lg:w-[385px] lg:overflow-y-auto">
          <div className="px-5 pb-1 pt-6">
            <h2 className="font-display text-[23px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Let&apos;s build an agent{" "}
              <span className="bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">together</span>
            </h2>
            <p className="mt-1.5 text-[14px] text-slate-500 dark:text-slate-400">
              15 minutes live with Nicolas, the founder, on your own website.
            </p>
          </div>
          <div className="px-2 pb-4">
            <DemoBooker avatarUrl={AVATAR} framed stacked />
          </div>
        </div>
      </div>
    </div>
  );
}
