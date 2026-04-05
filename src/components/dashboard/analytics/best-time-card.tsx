"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Lightbulb } from "lucide-react";

interface BestTimeCardProps {
  bestDay?: string;
  bestHour?: string;
  insight?: string;
  source?: "industry" | "hybrid" | "personal";
  postCount?: number;
}

export function BestTimeCard({ bestDay, bestHour, insight, source, postCount }: BestTimeCardProps) {
  const isPersonalized = source === "personal" || source === "hybrid";

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Best Time to Post
        </h3>
        <div className="flex items-start gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-xl text-center ${isPersonalized ? "bg-orange-50 dark:bg-orange-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}>
              <p className="text-xs text-muted-foreground mb-1">Best Day</p>
              <p className={`text-base font-bold ${isPersonalized ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-300"}`}>
                {bestDay || "Tue - Thu"}
              </p>
            </div>
            <div className={`p-3 rounded-xl text-center ${isPersonalized ? "bg-orange-50 dark:bg-orange-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}>
              <p className="text-xs text-muted-foreground mb-1">Best Time</p>
              <p className={`text-base font-bold ${isPersonalized ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-300"}`}>
                {bestHour || "9 - 11 AM"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {insight || "Based on LinkedIn industry data, Tuesday through Thursday between 9 AM - 12 PM tend to get the most engagement."}
            {source === "industry" && " Publish more posts through LinkedGrow to get personalized recommendations."}
            {source === "hybrid" && postCount && postCount < 20 && ` Recommendations will become more accurate as you publish more posts (${postCount}/20).`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
