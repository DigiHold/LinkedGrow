"use client";

import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import { useCallback } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({ onVerify, onError, onExpire, className }: TurnstileProps) {
  // Handle errors silently - the 401 errors for Private Access Token are normal
  const handleError = useCallback(() => {
    // Only call user's onError if provided, don't log to console
    onError?.();
  }, [onError]);

  // If no site key, don't render (dev environment without key)
  if (!SITE_KEY) {
    console.warn("[Turnstile] No site key configured, skipping widget");
    // Auto-verify in development when no key is set
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => onVerify("dev-token"), 100);
    }
    return null;
  }

  return (
    <TurnstileWidget
      siteKey={SITE_KEY}
      onSuccess={onVerify}
      onError={handleError}
      onExpire={onExpire}
      options={{
        theme: "auto",
        size: "invisible",
      }}
      className={className}
    />
  );
}

// Invisible Turnstile for forms where you don't want the widget visible
export function InvisibleTurnstile({ onVerify, onError, onExpire }: Omit<TurnstileProps, "className">) {
  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  if (!SITE_KEY) {
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => onVerify("dev-token"), 100);
    }
    return null;
  }

  return (
    <TurnstileWidget
      siteKey={SITE_KEY}
      onSuccess={onVerify}
      onError={handleError}
      onExpire={onExpire}
      options={{
        theme: "auto",
        size: "invisible",
      }}
    />
  );
}
