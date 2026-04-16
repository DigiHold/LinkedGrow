"use client";

import { useEffect, useRef, type VideoHTMLAttributes } from "react";

export function AutoplayVideo(props: VideoHTMLAttributes<HTMLVideoElement>) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return <video ref={videoRef} muted playsInline loop {...props} />;
}
