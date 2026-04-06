"use client";

import { useState } from "react";
import { Video, X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface VideoModalProps {
  videoId: string;
  triggerClassName?: string;
}

export function VideoModal({ videoId, triggerClassName }: VideoModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClassName || "text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"}
      >
        <Video className="w-3.5 h-3.5" />
        Watch Video
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="z-100" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-101 w-[95vw] max-w-6xl translate-x-[-50%] translate-y-[-50%] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <DialogPrimitive.Title className="sr-only">Feature Video</DialogPrimitive.Title>
            <DialogPrimitive.Close className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors cursor-pointer">
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            <div className="aspect-video w-full rounded-xl overflow-hidden">
              {open && (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&color=white`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
