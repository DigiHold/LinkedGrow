"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, BarChart3, Lock } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  type: "no-linkedin" | "no-data" | "upgrade";
  featureName?: string;
}

export function AnalyticsEmptyState({ type, featureName = "Analytics" }: EmptyStateProps) {
  if (type === "no-linkedin") {
    return (
      <Card>
        <CardContent className="py-16 px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Linkedin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect LinkedIn</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Your numbers are read from your own LinkedIn account, so connect one and the
              first reading arrives shortly after your first post.
            </p>
            {/* An OAuth popup used to live here. Connecting is an email and a
                password now, and it belongs on the settings page with the rest
                of the account rather than behind a button on a chart. */}
            <Link href="/dashboard/settings?tab=linkedin">
              <Button variant="primary" size="sm">
                <Linkedin className="w-4 h-4 mr-2" />
                Connect LinkedIn
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "no-data") {
    return (
      <Card>
        <CardContent className="py-16 px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Publish a post and its numbers appear here. They are read from LinkedIn a few
              hours after it goes out, and again as it keeps collecting views.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-16 px-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {featureName} requires a higher plan. Upgrade to unlock this feature.
          </p>
          <Link href="/dashboard/upgrade">
            <Button variant="primary" size="sm">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
