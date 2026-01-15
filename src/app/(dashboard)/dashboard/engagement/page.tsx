"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  MessageCircle,
  Heart,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Bell,
  UserPlus,
  Linkedin,
  Check,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EngagementPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const userEmail = session?.user?.email || "";

  const [isConnecting, setIsConnecting] = useState(false);
  const [communityConnected, setCommunityConnected] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if community app is connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/linkedin/community/status");
        if (response.ok) {
          const data = await response.json();
          setCommunityConnected(data.connected);
        }
      } catch (error) {
        console.error("Failed to check community connection:", error);
      }
    };
    checkConnection();
  }, []);

  const handleConnectCommunity = () => {
    setIsConnecting(true);
    setMessage(null);

    // Open LinkedIn OAuth in popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/linkedin/auth?app=community&popup=true",
      "linkedin-community-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    // Listen for message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "linkedin-success") {
        setCommunityConnected(true);
        setMessage({ type: "success", text: "LinkedIn engagement features connected successfully!" });
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      } else if (event.data.type === "linkedin-error") {
        setMessage({ type: "error", text: event.data.error || "Failed to connect" });
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);

    // Check if popup was closed
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      }
    }, 500);
  };

  const handleDisconnectCommunity = async () => {
    try {
      const response = await fetch("/api/linkedin/community/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      setCommunityConnected(false);
      setMessage({ type: "success", text: "Engagement features disconnected" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to disconnect",
      });
    }
  };

  return (
    <FeatureGate feature="engagement" userPlan={userPlan} userEmail={userEmail}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-pink-500 to-rose-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Engagement
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage comments, grow your network, and track interactions
            </p>
          </div>
          {communityConnected && (
            <Button className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync LinkedIn
            </Button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={cn(
            "p-3 rounded-lg text-sm flex items-center gap-2",
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          )}>
            {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* LinkedIn Community Connection */}
        {communityConnected ? (
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Engagement Features Connected</h3>
                    <p className="text-sm text-muted-foreground">
                      You can now track comments, reactions, and engagement metrics
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnectCommunity}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-linkedin/30 bg-linear-to-br from-linkedin/5 to-linkedin/10">
            <CardContent className="py-8">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linkedin/10 flex items-center justify-center">
                    <Linkedin className="w-8 h-8 text-linkedin" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connect LinkedIn for Engagement</h3>
                  <p className="text-muted-foreground">
                    Track comments, reactions, and grow your network with engagement analytics
                  </p>
                </div>

                {/* Why separate connection */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Why do I need to connect again?
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        LinkedIn requires separate permissions for reading engagement data (comments, reactions, followers)
                        versus posting content. This is a separate LinkedIn app that only requests read access to your
                        engagement metrics - it cannot post on your behalf.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions list */}
                <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 mb-6">
                  <h4 className="font-medium mb-3">This connection will allow LinkedGrow to:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      Read comments on your posts
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      View reactions and engagement metrics
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      Track follower growth
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      Analyze your post performance
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleConnectCommunity}
                    disabled={isConnecting}
                    className="bg-linkedin hover:bg-linkedin/90 text-white px-8"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Linkedin className="w-4 h-4 mr-2" />
                        Connect for Engagement
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={cn(!communityConnected && "opacity-50")}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Total Reactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(!communityConnected && "opacity-50")}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(!communityConnected && "opacity-50")}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">New Followers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(!communityConnected && "opacity-50")}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Engagement Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        <Card className={cn(!communityConnected && "opacity-50")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-cyan-600" />
                  Recent Comments
                </CardTitle>
                <CardDescription>
                  Reply to comments on your posts
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search comments..."
                    className="pl-9 w-48"
                    disabled={!communityConnected}
                  />
                </div>
                <Button variant="outline" size="icon" disabled={!communityConnected}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {communityConnected
                  ? "No comments yet. Comments will appear here when you receive them."
                  : "Connect LinkedIn engagement to see your comments"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className={cn(!communityConnected && "opacity-50")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-600" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Choose when to get notified about engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div>
                  <p className="font-medium text-sm">New comments</p>
                  <p className="text-xs text-muted-foreground">Get notified when someone comments</p>
                </div>
                <Button variant="outline" size="sm" disabled={!communityConnected}>
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div>
                  <p className="font-medium text-sm">High engagement posts</p>
                  <p className="text-xs text-muted-foreground">Alert when a post gets high engagement</p>
                </div>
                <Button variant="outline" size="sm" disabled={!communityConnected}>
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
