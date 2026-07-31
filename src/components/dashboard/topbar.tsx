"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  ChevronRightIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
} from "@/components/dashboard/nav-icons";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { useCrumbLabel } from "@/components/dashboard/crumb-context";

/**
 * Labels for path segments that do not read well when de-slugified, plus the
 * ones whose plain title differs from the nav label.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Home",
  agents: "Agents",
  replies: "Replies",
  "linkedin-accounts": "LinkedIn accounts",
  generator: "Generator",
  editor: "Editor",
  repurpose: "Repurpose",
  ideas: "Ideas",
  carousel: "Carousels",
  hooks: "Hooks",
  posts: "My posts",
  calendar: "Calendar",
  analytics: "Analytics",
  advanced: "Advanced",
  "network-notifications": "Network notifications",
  "ab-testing": "A/B testing",
  team: "Team",
  settings: "Settings",
  "ai-api": "AI API keys",
  api: "API keys",
  billing: "Billing",
  upgrade: "Upgrade",
  affiliate: "Affiliate",
  support: "Support",
  admin: "Admin",
  new: "New",
};

function labelFor(segment: string): string {
  const known = SEGMENT_LABELS[segment];
  if (known) return known;
  // Unknown segments are ids (an agent, a ticket). Showing a raw uuid in a
  // breadcrumb helps nobody, so long opaque segments collapse to a dash.
  if (segment.length > 12 && !segment.includes("-")) return "Detail";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function Topbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { toggle, isOpen } = useSidebar();
  const namedCrumb = useCrumbLabel();
  const [mounted, setMounted] = useState(false);

  // The theme is only known on the client, so the toggle renders a stable
  // placeholder until then rather than flashing the wrong icon.
  useEffect(() => setMounted(true), []);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: labelFor(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
    isLast: index === segments.length - 1,
  }));

  // A detail page hands up the name of the record it loaded, which beats
  // anything derivable from a url ending in an id.
  const named = crumbs[crumbs.length - 1];
  if (named && namedCrumb) named.label = namedCrumb;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl lg:px-6 dark:border-white/10 dark:bg-card/80">
      <button
        onClick={toggle}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-white/5"
      >
        <MenuIcon className="h-[18px] w-[18px]" />
      </button>

      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5 text-sm"
      >
        {crumbs.map((crumb) => (
          <span key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            {crumb.isLast ? (
              <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                {crumb.label}
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 sm:flex">
                <Link
                  href={crumb.href}
                  prefetch={false}
                  className="truncate text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {crumb.label}
                </Link>
                <ChevronRightIcon className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto" />

      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
        aria-label="Toggle theme"
      >
        {mounted && resolvedTheme === "dark" ? (
          <SunIcon className="h-[18px] w-[18px]" />
        ) : (
          <MoonIcon className="h-[18px] w-[18px]" />
        )}
      </button>
    </header>
  );
}
