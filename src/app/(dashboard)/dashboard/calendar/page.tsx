"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";

// TODO: Get this from user's actual subscription
const userPlan: PlanId = "free";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface ScheduledPost {
  id: string;
  title: string;
  date: string;
  time: string;
  status: "scheduled" | "published";
}

const scheduledPosts: ScheduledPost[] = [
  { id: "1", title: "5 productivity tips for remote workers", date: "2024-01-15", time: "09:00", status: "scheduled" },
  { id: "2", title: "Why I quit my 9-5 (and what I learned)", date: "2024-01-17", time: "14:00", status: "scheduled" },
  { id: "3", title: "The future of AI in content creation", date: "2024-01-20", time: "10:00", status: "scheduled" },
  { id: "4", title: "Career advice I wish I knew earlier", date: "2024-01-22", time: "09:00", status: "scheduled" },
];

function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getPostsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return scheduledPosts.filter((post) => post.date === dateStr);
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

  // Generate calendar days
  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const selectedDatePosts = selectedDate
    ? getPostsForDate(selectedDate.getDate())
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-linkedin" />
            Content Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage your posting schedule
          </p>
        </div>
        <Button variant="linkedin">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const postsForDay = getPostsForDate(day);
                const hasPost = postsForDay.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all hover:bg-accent relative",
                      isToday(day) && "ring-2 ring-linkedin",
                      isSelected(day) && "bg-linkedin text-white hover:bg-linkedin/90",
                      hasPost && !isSelected(day) && "bg-linkedin/10"
                    )}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {hasPost && (
                      <div className="flex gap-0.5 mt-0.5">
                        {postsForDay.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected(day) ? "bg-white" : "bg-linkedin"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Posts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select a Date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDatePosts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDatePosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Clock className="w-3 h-3" />
                          {post.time}
                        </div>
                        <p className="text-sm font-medium line-clamp-2">
                          {post.title}
                        </p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-2" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Post
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No posts scheduled
                    </p>
                    <Button variant="linkedin" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Post
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Click on a date to see scheduled posts
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Posts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Upcoming Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledPosts.slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-linkedin/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-linkedin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {post.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Best Times */}
          <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Best Times to Post
              </h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1.5">
                <li>• Tuesday 8-10 AM</li>
                <li>• Wednesday 12 PM</li>
                <li>• Thursday 8-10 AM</li>
              </ul>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Based on your audience activity
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <FeatureGate feature="calendar" userPlan={userPlan}>
      <CalendarContent />
    </FeatureGate>
  );
}
