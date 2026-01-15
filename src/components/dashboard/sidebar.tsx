"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  PenLine,
  MessageSquareText,
  Lightbulb,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

const navigation = [
  {
    name: "Generator",
    href: "/dashboard/generator",
    icon: Sparkles,
    description: "Create posts from ideas",
  },
  {
    name: "Editor",
    href: "/dashboard/editor",
    icon: PenLine,
    description: "Write and edit posts",
  },
  {
    name: "Reddit Import",
    href: "/dashboard/reddit",
    icon: MessageSquareText,
    description: "Convert Reddit posts",
  },
  {
    name: "Ideas",
    href: "/dashboard/ideas",
    icon: Lightbulb,
    description: "Get content ideas",
  },
  {
    name: "My Posts",
    href: "/dashboard/posts",
    icon: FileText,
    description: "Manage all posts",
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    description: "Schedule content",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Track performance",
  },
];

const planNames: Record<string, string> = {
  free: "Free Plan",
  starter: "Starter Plan",
  pro: "Pro Plan",
  business: "Business Plan",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userPlan = planNames[session?.user?.plan || "free"] || "Free Plan";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 w-14 h-14 rounded-full bg-linkedin text-white shadow-lg flex items-center justify-center touch-target"
        aria-label="Open menu"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen flex flex-col bg-white dark:bg-gray-950 border-r border-border transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2",
              isCollapsed && "lg:justify-center"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
              </svg>
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold">
                Linked<span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">Grow</span>
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-target",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  isCollapsed && "lg:justify-center lg:px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive && "text-cyan-600 dark:text-cyan-400"
                  )}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{item.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section with Dropdown */}
        <div className="p-3 border-t border-border">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer",
                  isCollapsed && "lg:justify-center lg:p-2"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 text-white text-sm font-medium">
                  {userInitials}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {userPlan}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
