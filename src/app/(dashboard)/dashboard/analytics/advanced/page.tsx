"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Download,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  FileSpreadsheet,
  FileText,
  Loader2,
  Filter,
  Eye,
  Heart,
  MessageSquare,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

// Sample data for demonstration - in production this would come from API
const engagementTrend = [
  { date: "Jan 1", impressions: 1200, engagement: 3.2 },
  { date: "Jan 8", impressions: 1800, engagement: 4.1 },
  { date: "Jan 15", impressions: 2400, engagement: 4.8 },
  { date: "Jan 22", impressions: 2100, engagement: 4.5 },
  { date: "Jan 29", impressions: 2800, engagement: 5.2 },
  { date: "Feb 5", impressions: 3200, engagement: 5.8 },
  { date: "Feb 12", impressions: 2900, engagement: 5.1 },
];

const postTypePerformance = [
  { type: "Text", count: 24, avgEngagement: 4.2, color: "bg-blue-500" },
  { type: "Image", count: 18, avgEngagement: 5.8, color: "bg-green-500" },
  { type: "Carousel", count: 8, avgEngagement: 7.2, color: "bg-purple-500" },
  { type: "Video", count: 4, avgEngagement: 6.5, color: "bg-red-500" },
];

// Heatmap data: hours (0-23) x days (Mon-Sun)
const postingHeatmap = {
  hours: ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"],
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  data: [
    [2, 3, 5, 4, 4, 2, 1, 1], // Mon
    [3, 4, 6, 5, 5, 3, 2, 1], // Tue
    [2, 5, 7, 6, 5, 3, 2, 1], // Wed
    [3, 4, 5, 4, 4, 2, 1, 1], // Thu
    [2, 3, 4, 3, 3, 2, 1, 1], // Fri
    [1, 2, 3, 2, 2, 1, 1, 0], // Sat
    [1, 2, 3, 3, 2, 2, 1, 0], // Sun
  ],
};

const audienceGrowth = [
  { week: "Week 1", followers: 2450, connections: 1820 },
  { week: "Week 2", followers: 2520, connections: 1890 },
  { week: "Week 3", followers: 2610, connections: 1950 },
  { week: "Week 4", followers: 2750, connections: 2040 },
];

export default function AdvancedAnalyticsPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan || "free") as PlanId;

  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState("30");
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | null>(null);

  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      // Simulate export - in production this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (format === "csv") {
        // Generate CSV
        const csvContent = generateCSV();
        downloadFile(csvContent, "analytics-export.csv", "text/csv");
      } else {
        // For PDF, you'd typically generate server-side or use a library
        alert("PDF export coming soon. CSV export is available now.");
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const generateCSV = () => {
    const rows = [
      ["Date", "Impressions", "Engagement Rate", "Reactions", "Comments", "Shares"],
      ...engagementTrend.map((d) => [
        d.date,
        d.impressions.toString(),
        d.engagement.toFixed(1) + "%",
        Math.round(d.impressions * d.engagement / 100).toString(),
        Math.round(d.impressions * d.engagement / 100 * 0.3).toString(),
        Math.round(d.impressions * d.engagement / 100 * 0.1).toString(),
      ]),
    ];
    return rows.map((row) => row.join(",")).join("\n");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getHeatmapColor = (value: number) => {
    if (value === 0) return "bg-slate-100 dark:bg-slate-800";
    if (value <= 2) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (value <= 4) return "bg-emerald-300 dark:bg-emerald-700/50";
    if (value <= 5) return "bg-emerald-500 dark:bg-emerald-600";
    return "bg-emerald-700 dark:bg-emerald-500";
  };

  const maxEngagement = Math.max(...postTypePerformance.map((p) => p.avgEngagement));

  return (
    <FeatureGate
      feature="advancedAnalytics"
      userPlan={userPlan}
      userEmail={session?.user?.email || ""}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Deep insights into your LinkedIn performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {["7", "30", "90"].map((days) => (
                <button
                  key={days}
                  onClick={() => setDateRange(days)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    dateRange === days
                      ? "bg-white dark:bg-slate-700 shadow-sm font-medium"
                      : "hover:bg-white/50 dark:hover:bg-slate-700/50"
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                disabled={isExporting}
              >
                {isExporting && exportFormat === "csv" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
              >
                {isExporting && exportFormat === "pdf" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Engagement Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Engagement Trend
                </CardTitle>
                <CardDescription>
                  Track how your engagement evolves over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-4">
              {engagementTrend.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-1 mb-2 relative group">
                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {data.impressions.toLocaleString()} impressions
                      <br />
                      {data.engagement}% engagement
                    </div>
                    {/* Impressions bar */}
                    <div
                      className="w-full bg-blue-500/80 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${(data.impressions / 3500) * 180}px` }}
                    />
                    {/* Engagement line indicator */}
                    <div
                      className="absolute w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm left-1/2 -translate-x-1/2"
                      style={{ bottom: `${(data.engagement / 7) * 180 + 10}px` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {data.date.split(" ")[1]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Impressions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Engagement Rate</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Post Type Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Content Performance by Type
              </CardTitle>
              <CardDescription>
                Which content formats work best for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {postTypePerformance.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-muted-foreground">
                        {item.count} posts - {item.avgEngagement}% avg
                      </span>
                    </div>
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <div
                        className={cn("h-full rounded-lg transition-all flex items-center justify-end pr-2", item.color)}
                        style={{ width: `${(item.avgEngagement / maxEngagement) * 100}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {item.avgEngagement}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>Insight:</strong> Carousel posts have the highest engagement.
                  Consider creating more carousel content to boost your reach.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Optimal Posting Times Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                Best Times to Post
              </CardTitle>
              <CardDescription>
                When your audience is most engaged
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[300px]">
                  {/* Hours header */}
                  <div className="flex gap-1 mb-2 pl-10">
                    {postingHeatmap.hours.map((hour) => (
                      <div
                        key={hour}
                        className="flex-1 text-xs text-muted-foreground text-center"
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                  {/* Heatmap grid */}
                  <div className="space-y-1">
                    {postingHeatmap.days.map((day, dayIndex) => (
                      <div key={day} className="flex items-center gap-1">
                        <div className="w-8 text-xs text-muted-foreground text-right pr-2">
                          {day}
                        </div>
                        {postingHeatmap.data[dayIndex].map((value, hourIndex) => (
                          <div
                            key={hourIndex}
                            className={cn(
                              "flex-1 h-6 rounded transition-colors cursor-pointer hover:ring-2 hover:ring-emerald-400",
                              getHeatmapColor(value)
                            )}
                            title={`${day} ${postingHeatmap.hours[hourIndex]}: ${value}% engagement`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <span className="text-xs text-muted-foreground">Low</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn("w-4 h-4 rounded", getHeatmapColor(level + 1))}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">High</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>Best time:</strong> Wednesday 10am - 12pm shows the highest engagement rates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audience Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-500" />
              Audience Growth
            </CardTitle>
            <CardDescription>
              Track your network expansion over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-4 mb-6">
              {audienceGrowth.map((week, index) => (
                <div
                  key={week.week}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <p className="text-sm text-muted-foreground">{week.week}</p>
                  <p className="text-2xl font-bold mt-1">
                    {week.followers.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{week.connections - (audienceGrowth[index - 1]?.connections || week.connections - 70)} connections
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Total Growth</p>
                <p className="text-3xl font-bold text-emerald-600">
                  +{audienceGrowth[audienceGrowth.length - 1].followers - audienceGrowth[0].followers}
                </p>
                <p className="text-sm text-emerald-600">
                  +{((audienceGrowth[audienceGrowth.length - 1].followers / audienceGrowth[0].followers - 1) * 100).toFixed(1)}% this month
                </p>
              </div>
              <div className="flex-1 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Avg Weekly Growth</p>
                <p className="text-3xl font-bold text-blue-600">
                  +{Math.round((audienceGrowth[audienceGrowth.length - 1].followers - audienceGrowth[0].followers) / 4)}
                </p>
                <p className="text-sm text-blue-600">
                  followers per week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Impressions", value: "156.2K", change: "+24.5%", icon: Eye, color: "text-blue-500" },
            { label: "Total Reactions", value: "4,821", change: "+18.2%", icon: Heart, color: "text-red-500" },
            { label: "Total Comments", value: "1,247", change: "+32.1%", icon: MessageSquare, color: "text-green-500" },
            { label: "Total Shares", value: "428", change: "+15.7%", icon: Share2, color: "text-purple-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                  <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </FeatureGate>
  );
}
