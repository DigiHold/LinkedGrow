/**
 * Light-stroke icon set for the v2 dashboard navigation.
 *
 * These are not lucide icons. Lucide's 2px stroke reads heavy next to Host
 * Grotesk at nav sizes, so every glyph here is drawn at 1.5 and traced from the
 * approved prototype. Keep the stroke width and the 24 viewBox when adding one.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.8V20h12V9.8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function AgentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 3.8v2.4M12 17.8v2.4M3.8 12h2.4M17.8 12h2.4" />
    </svg>
  );
}

export function ReplyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.2A7.5 7.5 0 1 1 20 12z" />
    </svg>
  );
}

export function LinkedInAccountIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M7.6 10.4v6M7.6 7.7v.01M11.4 16.4v-6M11.4 12.8c0-1.3 1-1.9 2.1-1.9 1.4 0 2.1.9 2.1 2.4v3.1" />
    </svg>
  );
}

export function GeneratorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4.5 13.5 9l4.5 1.5L13.5 12 12 16.5 10.5 12 6 10.5 10.5 9z" />
      <path d="M18 5.5v3M19.5 7h-3" />
    </svg>
  );
}

export function EditorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16.5 4.5a2.1 2.1 0 0 1 3 3L9 18l-4 1 1-4z" />
      <path d="M14 7l3 3" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

export function PostsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M7 9h10M7 12.5h10M7 16h6" />
    </svg>
  );
}

export function CarouselIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="7.5" y="5" width="9" height="14" rx="2" />
      <path d="M4.5 8v8M19.5 8v8" />
    </svg>
  );
}

export function HookIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 5h6" />
      <path d="M12 5v8.5a3.5 3.5 0 1 1-3.5-3.5" />
    </svg>
  );
}

export function IdeaIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9.5 17h5M10 20h4" />
      <path d="M12 3.5a5.5 5.5 0 0 1 3.2 9.9c-.5.4-.7.9-.7 1.4v.2h-5v-.2c0-.5-.2-1-.7-1.4A5.5 5.5 0 0 1 12 3.5z" />
    </svg>
  );
}

export function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19.5h16" />
      <path d="M7 16V10M12 16V5.5M17 16v-4" />
    </svg>
  );
}

export function RepurposeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 9.5A7.5 7.5 0 0 1 18 6.4" />
      <path d="M19.5 14.5A7.5 7.5 0 0 1 6 17.6" />
      <path d="M18 3.5v3h-3M6 20.5v-3h3" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9z" />
      <path d="M13.7 19a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function SplitTestIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 20V9a3 3 0 0 1 3-3h9" />
      <path d="M15 3l3 3-3 3" />
      <circle cx="6" cy="20" r="1.6" />
    </svg>
  );
}

export function TeamIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 6M17.5 14.4c2 .7 3.3 2.6 3.3 5.1" />
    </svg>
  );
}

/* ── account menu ── */

export function CrownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8.5l3.4 3L12 5.5l4.6 6 3.4-3-1.6 9.5H5.6z" />
      <path d="M5.6 19.5h12.8" />
    </svg>
  );
}

export function KeyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l8 8M16.5 16.5l2-2M19 19l1.5-1.5" />
    </svg>
  );
}

export function CodeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
    </svg>
  );
}

/**
 * Affiliate. A handshake at 18px turns to mush, so this is a share graph
 * instead: one node paying forward into two others. It reads at nav size,
 * which the handshake did not.
 */
export function AffiliateIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="6.5" r="2.6" />
      <circle cx="17.5" cy="17.5" r="2.6" />
      <path d="M8.3 10.8 15.2 7.6M8.3 13.2l6.9 3.2" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v12.5H7.5A2.5 2.5 0 0 1 5 17z" />
      <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H17" />
      <path d="M8.5 8.5h5" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 12.5c0 3.8-3.6 6.9-8 6.9a9.3 9.3 0 0 1-2.6-.4L4.5 20.5l1.3-3.4A6.5 6.5 0 0 1 4 12.5c0-3.8 3.6-6.9 8-6.9s8 3.1 8 6.9z" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function LifeBuoyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M6 6l3.6 3.6M18 6l-3.6 3.6M6 18l3.6-3.6M18 18l-3.6-3.6" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.2 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-2.6-1.1l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.2a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1.1-2.6l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4v-.2a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 2.6 1.1l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0 1.1 2.6h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9z" />
    </svg>
  );
}

export function CardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M6.5 14.5h3" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.2l7.2 3v5c0 4.1-2.9 7.3-7.2 8.6-4.3-1.3-7.2-4.5-7.2-8.6v-5z" />
    </svg>
  );
}

export function SignOutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 5.5h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3" />
      <path d="M10 8.5 6.5 12l3.5 3.5M6.5 12H15" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
