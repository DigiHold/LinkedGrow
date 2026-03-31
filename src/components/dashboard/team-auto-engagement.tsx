"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  Linkedin,
  Loader2,
  Check,
  Clock,
  Zap,
  Users,
  RefreshCw,
} from "lucide-react";

interface EngagementSettings {
  autoEngageLike: boolean;
  autoEngageComment: boolean;
  autoEngageShare: boolean;
  linkedinConnected: boolean;
  linkedinProfileName: string | null;
  role: string;
}

interface EngagementJob {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  actionType: "like" | "comment" | "share";
  status: "pending" | "completed" | "failed" | "skipped";
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface TeamAutoEngagementProps {
  isOwnerOrAdmin: boolean;
  teamMembers?: Array<{
    userId: string;
    name: string | null;
    email: string;
    role: string;
  }>;
}

export function TeamAutoEngagement({
  isOwnerOrAdmin,
  teamMembers,
}: TeamAutoEngagementProps) {
  const [settings, setSettings] = useState<EngagementSettings | null>(null);
  const [jobs, setJobs] = useState<EngagementJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/team/engagement-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
}
  }, []);

  const fetchJobs = useCallback(async () => {
    if (!isOwnerOrAdmin) return;
    try {
      const res = await fetch("/api/team/engagement-log");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
}
  }, [isOwnerOrAdmin]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchSettings(), fetchJobs()]).finally(() =>
      setIsLoading(false)
    );
  }, [fetchSettings, fetchJobs]);

  const handleToggle = async (field: string, value: boolean) => {
    setIsUpdating(field);
    try {
      const res = await fetch("/api/team/engagement-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
      }
    } catch (err) {
} finally {
      setIsUpdating(null);
    }
  };

  const handleConnectLinkedIn = () => {
    setIsConnecting(true);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      "/api/linkedin/auth?popup=true&mode=connect",
      "linkedin-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "linkedin-success" ||
        event.data?.type === "linkedin-error"
      ) {
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
        if (event.data?.type === "linkedin-success") {
          fetchSettings();
        }
      }
    };
    window.addEventListener("message", handleMessage);

    const checkInterval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkInterval);
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
        </CardContent>
      </Card>
    );
  }

  const actionIcon = {
    like: Heart,
    comment: MessageCircle,
    share: Share2,
  };

  const statusBadge = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    completed: {
      label: "Done",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    failed: {
      label: "Failed",
      className:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    skipped: {
      label: "Skipped",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    },
  };

  return (
    <div className="space-y-6">
      {/* Auto-Engagement Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-amber-500" />
            Auto-Engagement
          </CardTitle>
          <CardDescription>
            When the company page publishes a post, team members automatically
            like, comment, and share from their personal LinkedIn profiles with
            natural random delays.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* LinkedIn Connection Status */}
          {settings && !settings.linkedinConnected && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Linkedin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Connect Your LinkedIn
                  </p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
                    Connect your personal LinkedIn profile to enable
                    auto-engagement on company posts.
                  </p>
                  <Button
                    variant="linkedin"
                    size="sm"
                    className="mt-3"
                    onClick={handleConnectLinkedIn}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Linkedin className="w-4 h-4 mr-2" />
                    )}
                    Connect LinkedIn
                  </Button>
                </div>
              </div>
            </div>
          )}

          {settings && settings.linkedinConnected && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                LinkedIn connected
                {settings.linkedinProfileName
                  ? ` as ${settings.linkedinProfileName}`
                  : ""}
              </span>
            </div>
          )}

          {/* Toggle Switches */}
          {settings && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Auto-Like</p>
                    <p className="text-xs text-muted-foreground">
                      Like company posts automatically (2-8 min delay)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoEngageLike}
                  onCheckedChange={(v) => handleToggle("autoEngageLike", v)}
                  disabled={
                    !settings.linkedinConnected ||
                    isUpdating === "autoEngageLike"
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Auto-Comment</p>
                    <p className="text-xs text-muted-foreground">
                      AI-generated comments from your profile (5-20 min delay)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoEngageComment}
                  onCheckedChange={(v) => handleToggle("autoEngageComment", v)}
                  disabled={
                    !settings.linkedinConnected ||
                    isUpdating === "autoEngageComment"
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Auto-Share</p>
                    <p className="text-xs text-muted-foreground">
                      Reshare company posts on your profile (15-45 min delay)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoEngageShare}
                  onCheckedChange={(v) => handleToggle("autoEngageShare", v)}
                  disabled={
                    !settings.linkedinConnected ||
                    isUpdating === "autoEngageShare"
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owner/Admin - Team Members Overview */}
      {isOwnerOrAdmin && teamMembers && teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-cyan-500" />
              Team Members
            </CardTitle>
            <CardDescription>
              Overview of each team member&apos;s LinkedIn connection and
              auto-engagement opt-in status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(member.name || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.name || member.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize shrink-0"
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Engagement Jobs - Owner/Admin only */}
      {isOwnerOrAdmin && jobs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-blue-500" />
                Recent Team Engagement
              </CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={fetchJobs}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {jobs.slice(0, 50).map((job) => {
                const ActionIcon = actionIcon[job.actionType];
                const badge = statusBadge[job.status];
                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <ActionIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {job.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {job.actionType}
                        </span>
                      </div>
                      {job.errorMessage && (
                        <p className="text-xs text-red-500 truncate">
                          {job.errorMessage}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={`text-[10px] shrink-0 border-transparent ${badge.className}`}
                    >
                      {badge.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {job.completedAt
                        ? new Date(job.completedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Scheduled"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for jobs when owner/admin has no engagement activity */}
      {isOwnerOrAdmin && jobs.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No engagement activity yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-engagement jobs will appear here when team members interact
              with company posts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
