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
          <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Best Days</p>
              <p className="text-base font-bold text-slate-600 dark:text-slate-300">Tue - Thu</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Best Time</p>
              <p className="text-base font-bold text-slate-600 dark:text-slate-300">8 - 10 AM</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Based on LinkedIn research. Publish at least 3 posts through LinkedGrow to get personalized recommendations based on your actual engagement data.
            </p>
          </div>
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
