"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  FileText,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";

// TODO: Get this from user's actual subscription via auth session
const userPlan: PlanId = "free";

const stats = [
  {
    label: "Total Impressions",
    value: "24,521",
    change: "+18.2%",
    trend: "up",
    icon: Eye,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    label: "Engagement Rate",
    value: "4.8%",
    change: "+0.6%",
    trend: "up",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    label: "Total Followers",
    value: "2,847",
    change: "+124",
    trend: "up",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    label: "Posts This Month",
    value: "12",
    change: "-2",
    trend: "down",
    icon: FileText,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

const topPosts = [
  {
    rank: 1,
    content: "5 lessons I learned from building my first startup...",
    impressions: "8,234",
    likes: 342,
    comments: 87,
    date: "Jan 10",
  },
  {
    rank: 2,
    content: "The uncomfortable truth about 'hustle culture'...",
    impressions: "6,128",
    likes: 256,
    comments: 64,
    date: "Jan 5",
  },
  {
    rank: 3,
    content: "After interviewing 100+ candidates...",
    impressions: "4,892",
    likes: 198,
    comments: 45,
    date: "Dec 28",
  },
];

const weeklyData = [
  { day: "Mon", posts: 2, engagement: 4.2 },
  { day: "Tue", posts: 1, engagement: 5.1 },
  { day: "Wed", posts: 3, engagement: 4.8 },
  { day: "Thu", posts: 2, engagement: 5.5 },
  { day: "Fri", posts: 1, engagement: 3.9 },
  { day: "Sat", posts: 0, engagement: 0 },
  { day: "Sun", posts: 1, engagement: 4.1 },
];

function AnalyticsContent() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-linkedin" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your LinkedIn performance and growth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
            <CardDescription>Posts and engagement rate by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {weeklyData.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-1 mb-2">
                    {/* Engagement bar */}
                    <div
                      className="w-full bg-linkedin/20 rounded-t"
                      style={{ height: `${day.engagement * 30}px` }}
                    >
                      <div
                        className="w-full bg-linkedin rounded-t"
                        style={{ height: `${day.engagement * 30}px` }}
                      />
                    </div>
                    {/* Posts indicator */}
                    {day.posts > 0 && (
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: Math.min(day.posts, 3) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-green-500"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-linkedin" />
                <span>Engagement Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Posts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Likes", value: 1247, icon: Heart, color: "text-red-500" },
                { label: "Comments", value: 342, icon: MessageSquare, color: "text-blue-500" },
                { label: "Shares", value: 89, icon: Share2, color: "text-green-500" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", item.color)} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="font-semibold">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Best Performing Day</h4>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Tuesday
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  5.1% avg engagement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Your best content this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts.map((post) => (
              <div
                key={post.rank}
                className="flex items-start gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                    post.rank === 1
                      ? "bg-yellow-100 text-yellow-700"
                      : post.rank === 2
                      ? "bg-gray-100 text-gray-700"
                      : "bg-orange-100 text-orange-700"
                  )}
                >
                  {post.rank === 1 ? "1" : post.rank === 2 ? "2" : "3"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-1">{post.content}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.impressions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {post.comments}
                    </span>
                    <span>{post.date}</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-linkedin/20 bg-linkedin/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Want more detailed analytics?</h3>
              <p className="text-muted-foreground mt-1">
                Connect your LinkedIn account for real-time performance data
              </p>
            </div>
            <Button variant="linkedin">
              Connect LinkedIn
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <FeatureGate feature="analytics" userPlan={userPlan}>
      <AnalyticsContent />
    </FeatureGate>
  );
}
