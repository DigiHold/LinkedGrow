"use client";

import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({ onVerify, onError, onExpire, className }: TurnstileProps) {
  return (
    <TurnstileWidget
      siteKey={SITE_KEY}
      onSuccess={onVerify}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: "auto",
        size: "flexible",
      }}
      className={className}
    />
  );
}

// Invisible Turnstile for forms where you don't want the widget visible
export function InvisibleTurnstile({ onVerify, onError, onExpire }: Omit<TurnstileProps, "className">) {
  return (
    <TurnstileWidget
      siteKey={SITE_KEY}
      onSuccess={onVerify}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: "auto",
        size: "invisible",
      }}
    />
  );
}
