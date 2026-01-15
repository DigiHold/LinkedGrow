"use client";

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
  Send,
  TrendingUp,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Bell,
  UserPlus,
  Linkedin,
} from "lucide-react";

export default function EngagementPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const userEmail = session?.user?.email || "";

  return (
    <FeatureGate feature="engagement" userPlan={userPlan} userEmail={userEmail}>
      <div className="space-y-6">
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
          <Button className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync LinkedIn
          </Button>
        </div>

        {/* LinkedIn Connection Required */}
        <Card className="border-linkedin/30 bg-linkedin/5">
          <CardContent className="py-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linkedin/10 flex items-center justify-center">
                <Linkedin className="w-8 h-8 text-linkedin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Your LinkedIn</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Connect your LinkedIn account to track engagement, manage comments, and grow your network.
              </p>
              <Button variant="linkedin">
                <Linkedin className="w-4 h-4 mr-2" />
                Connect LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
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
          <Card>
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
          <Card>
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
          <Card>
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
        <Card>
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
                    disabled
                  />
                </div>
                <Button variant="outline" size="icon" disabled>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Connect LinkedIn to see your comments</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
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
                <Button variant="outline" size="sm" disabled>
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div>
                  <p className="font-medium text-sm">High engagement posts</p>
                  <p className="text-xs text-muted-foreground">Alert when a post gets high engagement</p>
                </div>
                <Button variant="outline" size="sm" disabled>
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
