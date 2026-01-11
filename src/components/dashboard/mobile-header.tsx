"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/generator": "Post Generator",
  "/dashboard/editor": "Post Editor",
  "/dashboard/reddit": "Reddit Import",
  "/dashboard/ideas": "Content Ideas",
  "/dashboard/posts": "My Posts",
  "/dashboard/calendar": "Calendar",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

export function MobileHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linkedin-gradient flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <span className="font-bold">
            Linked<span className="text-linkedin">Grow</span>
          </span>
        </Link>

        {/* Page Title (visible on smaller screens) */}
        <h1 className="text-sm font-medium text-muted-foreground sm:hidden">
          {title}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-linkedin rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
}
