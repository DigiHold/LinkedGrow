"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Lightbulb } from "lucide-react";

interface BestTimeCardProps {
  bestDay?: string;
  bestHour?: string;
  insight?: string;
}

export function BestTimeCard({ bestDay, bestHour, insight }: BestTimeCardProps) {
  if (!bestDay || !bestHour) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Best Time to Post
          </h3>
          <p className="text-muted-foreground text-sm">
            Publish at least 3 posts to get personalized timing recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Best Time to Post
        </h3>
        <div className="flex items-start gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Best Day</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{bestDay}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Best Time</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{bestHour}</p>
            </div>
          </div>
        </div>
        {insight && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
