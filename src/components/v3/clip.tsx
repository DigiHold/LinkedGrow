"use client";

import { useEffect, useRef, useState } from "react";

const R2 = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/video";

/**
 * A feature clip that costs nothing until it is nearly on screen.
 *
 * The home page must paint in under a second, and eight autoplaying videos in
 * the markup would blow that on their own, so nothing is fetched at first
 * paint: no `src`, `preload="none"`, and a poster small enough to be free.
 *
 * The sources are attached one full screen before the clip scrolls into view,
 * which is far enough ahead that it is already playing by the time anybody
 * looks at it, and close enough that a visitor who never scrolls there never
 * pays for it. AV1 first for the browsers that decode it, H.264 behind it for
 * Safari, and a smaller cut for phones so a 4G connection is not asked for a
 * desktop-width file.
 */
export function V3Clip({ name, label }: { name: string; label: string }) {
  const box = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const io = new IntersectionObserver(
      (es) => { if (es[0].isIntersecting) { setNear(true); io.disconnect(); } },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const el = box.current;
    if (!el) return;
    el.load();
    /* autoplay does not always fire on a source attached after mount, and a
       clip stuck on its poster is the one thing that reads as a broken video */
    el.play().catch(() => {});
  }, [near]);

  return (
    <video
      ref={box}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster={`${R2}/${name}-poster.jpg`}
      aria-label={label}
    >
      {near && <source src={`${R2}/${name}.webm`} type="video/webm" media="(min-width: 700px)" />}
      {near && <source src={`${R2}/${name}-1920.mp4`} type="video/mp4" media="(min-width: 700px)" />}
      {near && <source src={`${R2}/${name}-900.mp4`} type="video/mp4" />}
    </video>
  );
}
