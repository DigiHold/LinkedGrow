"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/ui/logo";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/generator": "Post Generator",
  "/dashboard/editor": "Post Editor",
  "/dashboard/repurpose": "Repurpose",
  "/dashboard/ideas": "Content Ideas",
  "/dashboard/posts": "My Posts",
  "/dashboard/calendar": "Calendar",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

export function MobileHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title = pageTitles[pathname] || "Dashboard";

  // User display info
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userImage = session?.user?.image;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linkedin-gradient flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
            </svg>
          </div>
          <Logo size="md" />
        </Link>

        {/* Page Title + User Avatar */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-muted-foreground">
            {title}
          </h1>
          <Link href="/dashboard/settings">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                {userInitials}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
