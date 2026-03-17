"use client";

import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Wrench } from "lucide-react";

export default function AdvancedAnalyticsPage() {
  return (
    <FeatureGate feature="advancedAnalytics">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground text-sm">Deep insights into your LinkedIn content performance</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-linear-to-br from-violet-500/10 to-purple-600/10 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Advanced analytics with detailed engagement trends, best posting times, content performance breakdowns, and export capabilities are on the way.
            </p>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
