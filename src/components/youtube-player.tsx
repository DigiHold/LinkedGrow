"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, ArrowRight, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YouTubePlayerProps {
  videoId: string;
  thumbnailUrl: string;
  ctaText?: string;
  ctaAction?: () => void;
  ctaHref?: string;
  autoPlay?: boolean;
}

export function YouTubePlayer({
  videoId,
  thumbnailUrl,
  ctaText = "Get Started",
  ctaAction,
  ctaHref,
  autoPlay = false,
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoPlay || isPlaying || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsPlaying(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoPlay, isPlaying]);

  // Listen for YouTube postMessage events to detect video end
  useEffect(() => {
    if (!isPlaying) return;

    const handleMessage = (event: MessageEvent) => {
      // YouTube sends messages from its embed origin
      if (
        event.origin !== "https://www.youtube.com" &&
        event.origin !== "https://www.youtube-nocookie.com"
      ) {
        return;
      }

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        // YouTube sends playerState changes via postMessage when enablejsapi=1
        // State 0 = ended, State 1 = playing
        if (data.event === "onStateChange") {
          if (data.info === 0) {
            setShowCTA(true);
          } else if (data.info === 1) {
            setShowCTA(false);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isPlaying]);

  // When the iframe loads, tell YouTube to send us state change events
  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current) return;

    // Send the "listening" command so YouTube sends us postMessage events
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({
        event: "listening",
        id: 1,
        channel: "widget",
      }),
      "https://www.youtube.com"
    );

    // Also subscribe to events via the command API
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: "addEventListener",
        args: ["onStateChange"],
        id: 1,
        channel: "widget",
      }),
      "https://www.youtube.com"
    );
  }, []);

  const handlePlayClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile, open YouTube directly for best experience
      window.open(
        `https://www.youtube.com/watch?v=${videoId}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    setIsPlaying(true);
  };

  const handleCTAClick = () => {
    if (ctaAction) {
      ctaAction();
    } else if (ctaHref) {
      const element = document.querySelector(ctaHref);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleReplay = () => {
    setShowCTA(false);
    // Reload the iframe by re-setting the src to restart the video
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = "";
      iframeRef.current.src = src;
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  // Build iframe src with all params
  const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&rel=0&playsinline=1&playlist=${videoId}`;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl"
    >
      {!isPlaying ? (
        <button
          onClick={handlePlayClick}
          className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-800 to-slate-900 cursor-pointer group"
          aria-label="Play demo video"
        >
          {/* Thumbnail */}
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Play button */}
          <div className="relative z-10">
            <div className="absolute inset-0 bg-linear-to-r from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
            </div>
          </div>

        </button>
      ) : (
        <>
          {/* Plain iframe embed - no YT.Player API, no black bars */}
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full border-0"
            src={iframeSrc}
            title="Demo video"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
          />

          {/* Fullscreen button */}
          {!showCTA && (
            <button
              onClick={handleFullscreen}
              className="absolute bottom-4 right-4 z-10 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
              aria-label="Enter fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          )}

          {/* CTA Overlay */}
          {showCTA && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
                Ready to grow on LinkedIn?
              </h3>
              <p className="text-slate-300 mb-6 text-center max-w-md">
                Start creating content that gets results
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCTAClick}
                  size="lg"
                  className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8"
                >
                  {ctaText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={handleReplay}
                  size="lg"
                  className="border border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Play className="mr-2 w-4 h-4" />
                  Watch again
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
