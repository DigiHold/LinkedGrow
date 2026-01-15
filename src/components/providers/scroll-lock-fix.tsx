"use client";

import { useEffect } from "react";

/**
 * Fixes Radix UI scroll-lock behavior that adds margin-right to body
 * when opening Select, Dialog, etc. This causes layout shift.
 */
export function ScrollLockFix() {
  useEffect(() => {
    // Create a MutationObserver to watch for style changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const body = document.body;
          // Check if Radix added margin-right or padding-right
          if (body.style.marginRight || body.style.paddingRight) {
            body.style.marginRight = "";
            body.style.paddingRight = "";
          }
        }
      });
    });

    // Start observing body for style attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
