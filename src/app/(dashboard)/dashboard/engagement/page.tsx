"use client";

import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Wrench } from "lucide-react";

export default function EngagementPage() {
  return (
    <FeatureGate feature="engagement">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Engagement</h1>
            <p className="text-muted-foreground text-sm">Like and comment on posts to grow your network</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-linear-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The engagement feature is being built. You&apos;ll soon be able to follow LinkedIn profiles, view their latest posts, and like or comment directly from here.
            </p>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
