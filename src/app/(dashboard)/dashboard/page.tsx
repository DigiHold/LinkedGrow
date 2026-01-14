import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PenLine,
  FileText,
  TrendingUp,
  Calendar,
  ArrowRight,
  Zap,
  Target,
} from "lucide-react";

const quickActions = [
  {
    title: "Generate Post",
    description: "Create a viral post with AI",
    href: "/dashboard/generator",
    icon: Sparkles,
    color: "text-linkedin",
    bgColor: "bg-linkedin/10",
  },
  {
    title: "Write Post",
    description: "Start from scratch",
    href: "/dashboard/editor",
    icon: PenLine,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Import Reddit",
    description: "Convert viral content",
    href: "/dashboard/reddit",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Get Ideas",
    description: "Browse content ideas",
    href: "/dashboard/ideas",
    icon: Target,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

const stats = [
  { label: "Posts Created", value: "24", change: "+12%", trend: "up" },
  { label: "Scheduled", value: "8", change: "3 this week", trend: "neutral" },
  { label: "Published", value: "16", change: "+5 this month", trend: "up" },
  { label: "Avg. Engagement", value: "4.2%", change: "+0.8%", trend: "up" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, John!</h1>
          <p className="text-muted-foreground mt-1">
            Ready to create some viral content today?
          </p>
        </div>
        <Link href="/dashboard/generator">
          <Button variant="linkedin" className="w-full sm:w-auto">
            <Sparkles className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{stat.value}</p>
              <p
                className={`text-xs mt-1 ${
                  stat.trend === "up"
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <CardContent className="p-4 sm:p-5">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Posts</CardTitle>
            <Link
              href="/dashboard/posts"
              className="text-sm text-linkedin hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {i === 1
                        ? "5 lessons I learned building..."
                        : i === 2
                        ? "Why most people fail at..."
                        : "The secret to growing your..."}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          i === 1
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : i === 2
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {i === 1 ? "Published" : i === 2 ? "Scheduled" : "Draft"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {i === 1 ? "2h ago" : i === 2 ? "Tomorrow" : "3d ago"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
            <Link
              href="/dashboard/calendar"
              className="text-sm text-linkedin hover:underline flex items-center gap-1"
            >
              Calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { day: "Today", time: "2:00 PM", title: "AI productivity tips" },
                { day: "Tomorrow", time: "9:00 AM", title: "Weekly insights thread" },
                { day: "Wed", time: "12:00 PM", title: "Industry trends analysis" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-linkedin/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-linkedin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.day} at {item.time}
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Key Reminder */}
      <Card className="border-linkedin/20 bg-linkedin/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-linkedin/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-linkedin" />
              </div>
              <div>
                <h3 className="font-semibold">Connect Your AI Provider</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your OpenAI, Claude, or Gemini API key to start generating posts.
                </p>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="linkedin" className="w-full sm:w-auto">
                Add API Key
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
