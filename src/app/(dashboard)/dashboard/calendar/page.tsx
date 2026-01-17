"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FileText,
  Loader2,
  CalendarDays,
  Edit3,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  Sparkles,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import Link from "next/link";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/posts?status=scheduled,published&limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data.posts || []);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getPostsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter((post) => {
      const postDate = post.scheduledAt || post.publishedAt;
      if (!postDate) return false;
      const postDateStr = new Date(postDate).toISOString().split("T")[0];
      return postDateStr === dateStr;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  };

  // Generate calendar days with previous month padding
  const days = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }
  // Fill remaining cells
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const selectedDatePosts = selectedDate
    ? getPostsForDate(selectedDate.getDate())
    : [];

  // Get upcoming posts (next 7 days)
  const upcomingPosts = posts
    .filter((post) => {
      if (!post.scheduledAt || post.status !== "scheduled") return false;
      const schedDate = new Date(post.scheduledAt);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return schedDate >= today && schedDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getPostPreview = (content: string, maxLength = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const getStatusColor = (status: Post["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "published":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-400";
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
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

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            {error}
            <Button variant="link" className="ml-2 text-red-700 dark:text-red-300 p-0 h-auto" onClick={fetchPosts}>
              Try again
            </Button>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Calendar - Main Area */}
          <div className="lg:col-span-3">
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
                  const postsForDay = item.isCurrentMonth ? getPostsForDate(item.day) : [];
                  const hasPost = postsForDay.length > 0;
                  const dayIsToday = item.isCurrentMonth && isToday(item.day);
                  const dayIsSelected = item.isCurrentMonth && isSelected(item.day);
                  const dayIsPast = item.isCurrentMonth && isPast(item.day);

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (item.isCurrentMonth) {
                          setSelectedDate(new Date(year, month, item.day));
                        }
                      }}
                      disabled={!item.isCurrentMonth}
                      className={cn(
                        "min-h-25 p-2 border-b border-r border-border transition-all text-left flex flex-col",
                        !item.isCurrentMonth && "bg-gray-50/50 dark:bg-gray-800/30 text-muted-foreground/50",
                        item.isCurrentMonth && "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer",
                        dayIsSelected && "bg-linkedin/5 dark:bg-linkedin/10 ring-2 ring-inset ring-linkedin",
                        dayIsPast && item.isCurrentMonth && "bg-gray-50/30 dark:bg-gray-800/20",
                        index % 7 === 6 && "border-r-0"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1",
                          dayIsToday && "bg-linkedin text-white",
                          !dayIsToday && item.isCurrentMonth && "text-foreground",
                        )}
                      >
                        {item.day}
                      </span>
                      {hasPost && (
                        <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                          {postsForDay.slice(0, 2).map((post) => (
                            <div
                              key={post.id}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded truncate",
                                post.status === "scheduled" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                post.status === "published" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                post.status === "failed" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {formatTime(post.scheduledAt || post.publishedAt || post.createdAt)}
                            </div>
                          ))}
                          {postsForDay.length > 2 && (
                            <span className="text-xs text-muted-foreground px-1.5">
                              +{postsForDay.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Date Details */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a Date"}
                </h3>
              </div>
              <div className="p-4">
                {selectedDate ? (
                  selectedDatePosts.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDatePosts.map((post) => (
                        <div
                          key={post.id}
                          className="group p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-2 h-2 rounded-full", getStatusColor(post.status))} />
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {post.status}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatTime(post.scheduledAt || post.publishedAt || post.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{getPostPreview(post.content)}</p>
                          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/dashboard/editor?id=${post.id}`}>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      <Link href="/dashboard/generator" className="block">
                        <Button variant="outline" className="w-full" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Schedule Another
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <CalendarDays className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        No posts scheduled for this day
                      </p>
                      <Link href="/dashboard/generator">
                        <Button variant="linkedin" size="sm">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create Post
                        </Button>
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                      <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click on a date to view scheduled posts
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Posts */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Upcoming</h3>
                <span className="text-xs text-muted-foreground">Next 7 days</span>
              </div>
              <div className="p-2">
                {upcomingPosts.length > 0 ? (
                  <div className="space-y-1">
                    {upcomingPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/dashboard/editor?id=${post.id}`}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-linkedin/10 flex items-center justify-center shrink-0">
                          <Send className="w-4 h-4 text-linkedin" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {getPostPreview(post.content, 40)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(post.scheduledAt!)} at {formatTime(post.scheduledAt!)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      No upcoming posts scheduled
                    </p>
                    <Link href="/dashboard/generator">
                      <Button variant="link" size="sm" className="mt-1">
                        Schedule your first post
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-linear-to-br from-linkedin/10 to-blue-500/10 dark:from-linkedin/20 dark:to-blue-500/20 rounded-2xl border border-linkedin/20 p-4">
              <h4 className="font-semibold text-linkedin dark:text-blue-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-linkedin">-</span>
                  Best times: Tuesday-Thursday, 8-10 AM
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-linkedin">-</span>
                  Post consistently, 3-5 times per week
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-linkedin">-</span>
                  Engage with comments within first hour
                </li>
              </ul>
            </div>
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
