"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black border-slate-800" overlayClassName="z-[100]" style={{ zIndex: 101 }}>
          <DialogTitle className="sr-only">Feature Video</DialogTitle>
          <div className="aspect-video w-full">
            {open && (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
