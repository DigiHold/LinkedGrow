"use client";

import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Wrench } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <FeatureGate feature="analytics">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm">Track your LinkedIn performance and growth</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-linear-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The analytics dashboard is being finalized. You&apos;ll soon be able to track your impressions, reactions, comments, and follower growth over time.
            </p>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
