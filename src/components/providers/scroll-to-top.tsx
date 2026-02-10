"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls to top on every client-side route change.
 * Uses behavior: 'instant' to override the CSS scroll-behavior: smooth
 * which otherwise turns scrollTo into an animation that gets interrupted
 * by browser scroll restoration, leaving the user mid-page.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
