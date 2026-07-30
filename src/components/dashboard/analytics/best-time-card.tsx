"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Lightbulb } from "lucide-react";

interface BestTimeCardProps {
  bestDay?: string;
  bestHour?: string;
  insight?: string;
  source?: "personal";
  postCount?: number;
}

/**
 * When this person's own posts do best, or an honest blank.
 *
 * This card used to fill itself in with "Tue - Thu", "9 - 11 AM" and a sentence
 * beginning "Based on LinkedIn industry data". None of it came from anywhere,
 * and it looked exactly like a measurement. A card that admits it needs more
 * posts is worth more than one that invents a recommendation.
 */
export function BestTimeCard({ bestDay, bestHour, insight, postCount }: BestTimeCardProps) {
  const measured = Boolean(bestDay && bestHour);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Best Time to Post
        </h3>

        {measured ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl text-center bg-orange-50 dark:bg-orange-900/20">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Best Day</p>
                <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                  {bestDay}
                </p>
              </div>
              <div className="p-3 rounded-xl text-center bg-orange-50 dark:bg-orange-900/20">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Best Time</p>
                <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                  {bestHour}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{insight}</p>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This reads your own results rather than a general rule, so it needs a few more
              measured posts before it can tell you anything worth acting on
              {typeof postCount === "number" && postCount > 0 ? ` (${postCount} so far)` : ""}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
