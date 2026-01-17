"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarPlus,
  Lightbulb,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface Post {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  postType: "text" | "image" | "carousel" | "video";
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{ day: number; month: number; year: number } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/posts?status=scheduled,published&limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data.posts || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getPostsForDate = (day: number, m: number, y: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter((post) => {
      const postDate = post.scheduledAt || post.publishedAt;
      if (!postDate) return false;
      const postDateStr = new Date(postDate).toISOString().split("T")[0];
      return postDateStr === dateStr;
    });
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === m &&
      today.getFullYear() === y
    );
  };

  const isPast = (day: number, m: number, y: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(y, m, day);
    return checkDate < today;
  };

  // Generate calendar days with previous month padding
  const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthIndex = month === 0 ? 11 : month - 1;

  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      month: prevMonthIndex,
      year: prevMonthYear,
      isCurrentMonth: false
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, year, isCurrentMonth: true });
  }
  // Fill remaining cells
  const remainingCells = 42 - days.length;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthIndex = month === 11 ? 0 : month + 1;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: nextMonthIndex,
      year: nextMonthYear,
      isCurrentMonth: false
    });
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPostPreview = (content: string, maxLength = 30) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const handleDayClick = (item: typeof days[0]) => {
    if (item.isCurrentMonth && !isPast(item.day, item.month, item.year)) {
      setSelectedDay({ day: item.day, month: item.month, year: item.year });
      setDropdownOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-linkedin" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-linkedin/10">
                <CalendarDays className="w-6 h-6 text-linkedin" />
              </div>
              Content Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan and visualize your content schedule
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Link href="/dashboard/generator">
              <Button variant="linkedin">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-gray-50/50 dark:bg-gray-800/50">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-3"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((item, index) => {
              const postsForDay = getPostsForDate(item.day, item.month, item.year);
              const hasPost = postsForDay.length > 0;
              const dayIsToday = isToday(item.day, item.month, item.year);
              const dayIsPast = isPast(item.day, item.month, item.year);
              const isClickable = item.isCurrentMonth && !dayIsPast;
              const isSelected = selectedDay &&
                selectedDay.day === item.day &&
                selectedDay.month === item.month &&
                selectedDay.year === item.year;

              return (
                <DropdownMenu
                  key={index}
                  open={isSelected && dropdownOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setDropdownOpen(false);
                      setSelectedDay(null);
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={() => handleDayClick(item)}
                      disabled={!isClickable}
                      className={cn(
                        "min-h-32 p-2 border-b border-r border-border transition-all text-left flex flex-col relative",
                        !item.isCurrentMonth && "bg-gray-50/50 dark:bg-gray-800/30",
                        item.isCurrentMonth && !dayIsPast && "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer",
                        dayIsPast && item.isCurrentMonth && "bg-gray-50/30 dark:bg-gray-800/20",
                        isSelected && "bg-linkedin/5 dark:bg-linkedin/10 ring-2 ring-inset ring-linkedin",
                        index % 7 === 6 && "border-r-0"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1",
                          dayIsToday && "bg-linkedin text-white",
                          !dayIsToday && item.isCurrentMonth && !dayIsPast && "text-foreground",
                          !dayIsToday && item.isCurrentMonth && dayIsPast && "text-muted-foreground",
                          !item.isCurrentMonth && "text-muted-foreground/50",
                        )}
                      >
                        {item.day}
                      </span>
                      {hasPost && (
                        <div className="flex flex-col gap-1 mt-1 overflow-hidden flex-1">
                          {postsForDay.slice(0, 3).map((post) => (
                            <Link
                              key={post.id}
                              href={`/dashboard/editor?id=${post.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "text-xs px-2 py-1 rounded truncate block hover:opacity-80 transition-opacity",
                                post.status === "scheduled" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                post.status === "published" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                post.status === "failed" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {formatTime(post.scheduledAt || post.publishedAt || post.createdAt)} - {getPostPreview(post.content)}
                            </Link>
                          ))}
                          {postsForDay.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2">
                              +{postsForDay.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="p-3 flex flex-col gap-2 shadow-lg"
                  >
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/dashboard/generator" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create a post
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href={`/dashboard/generator?schedule=${selectedDay?.year}-${String((selectedDay?.month ?? 0) + 1).padStart(2, '0')}-${String(selectedDay?.day ?? 1).padStart(2, '0')}`}
                        className="flex items-center gap-2"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        Schedule a post
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/dashboard/ideas" className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Insert an idea
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";

  return (
    <FeatureGate feature="calendar" userPlan={userPlan}>
      <CalendarContent />
    </FeatureGate>
  );
}
