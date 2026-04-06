"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, ArrowRight, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
}

interface YouTubePlayerProps {
  videoId: string;
  thumbnailUrl: string;
  duration?: string;
  ctaText?: string;
  ctaAction?: () => void;
  ctaHref?: string;
}

export function YouTubePlayer({
  videoId,
  thumbnailUrl,
  duration,
  ctaText = "Get Started",
  ctaAction,
  ctaHref,
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    const existingScript = document.getElementById("youtube-iframe-api");
    if (existingScript) {
      window.onYouTubeIframeAPIReady = () => setApiReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    window.onYouTubeIframeAPIReady = () => setApiReady(true);

    document.body.appendChild(script);
  }, []);

  // Initialize player when API is ready and user clicks play
  const initializePlayer = useCallback(() => {
    if (!apiReady || !containerRef.current || playerRef.current) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        rel: 0,
        iv_load_policy: 3,
        fs: 0,
        disablekb: 1,
        cc_load_policy: 0,
        color: "white",
        playsinline: isMobile ? 0 : 1,
        origin: window.location.origin,
        enablejsapi: 1,
      },
      events: {
        onReady: (event) => {
          event.target.playVideo();

          // Request fullscreen on mobile
          if (isMobile) {
            const iframe = event.target.getIframe();
            if (iframe.requestFullscreen) {
              iframe.requestFullscreen().catch(() => {});
            }
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            setShowCTA(true);
          } else if (event.data === window.YT.PlayerState.PLAYING) {
            setShowCTA(false);
          }
        },
      },
    });
  }, [apiReady, videoId]);

  const handlePlayClick = () => {
    setIsPlaying(true);
    setTimeout(initializePlayer, 100);
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
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const handleFullscreen = () => {
    if (playerRef.current) {
      const iframe = playerRef.current.getIframe();
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
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

          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
              {duration}
            </div>
          )}
        </button>
      ) : (
        <>
          {/* Player container */}
          <div ref={containerRef} className="absolute top-1/2 left-1/2 w-[112%] h-[112%] -translate-x-1/2 -translate-y-1/2 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" />

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
