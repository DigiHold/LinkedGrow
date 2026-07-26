"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface PostingHeatmapProps {
  data: Array<{ day: number; hour: number; avgEngagement: number; postCount: number }>;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PostingHeatmap({ data }: PostingHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Posting Times Heatmap
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Publish more posts at different times to see your heatmap.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build a lookup map
  const grid: Record<string, { avgEngagement: number; postCount: number }> = {};
  let maxEngagement = 0;
  data.forEach((d) => {
    grid[`${d.day}-${d.hour}`] = { avgEngagement: d.avgEngagement, postCount: d.postCount };
    if (d.avgEngagement > maxEngagement) maxEngagement = d.avgEngagement;
  });

  const getOpacity = (day: number, hour: number): number => {
    const cell = grid[`${day}-${hour}`];
    if (!cell || maxEngagement === 0) return 0;
    return Math.max(0.1, cell.avgEngagement / maxEngagement);
  };

  const getCount = (day: number, hour: number): number => {
    return grid[`${day}-${hour}`]?.postCount || 0;
  };

  const getEngagement = (day: number, hour: number): number => {
    return grid[`${day}-${hour}`]?.avgEngagement || 0;
  };

  const formatHour = (h: number) => h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;

  const handleMouseEnter = (e: React.MouseEvent, dayIndex: number, hour: number) => {
    const count = getCount(dayIndex, hour);
    const engagement = getEngagement(dayIndex, hour);
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.closest(".relative")?.getBoundingClientRect();
    if (!parentRect) return;

    const text = count > 0
      ? `${DAYS[dayIndex]} ${formatHour(hour)} - ${count} post${count > 1 ? "s" : ""}, ${engagement.toFixed(1)}% eng.`
      : `${DAYS[dayIndex]} ${formatHour(hour)} - No data`;

    setTooltip({
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top - 8,
      text,
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Posting Times Heatmap
        </h3>
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[700px] relative" onMouseLeave={() => setTooltip(null)}>
            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute z-10 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium whitespace-nowrap pointer-events-none shadow-lg"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {tooltip.text}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-100" />
              </div>
            )}

            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
                <div key={hour} className="text-[10px] text-slate-500 dark:text-slate-400" style={{ width: `${(100 / 8)}%` }}>
                  {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
                </div>
              ))}
            </div>
            {/* Grid rows */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <div className="w-9 text-xs text-slate-500 dark:text-slate-400 text-right pr-1 shrink-0">{day}</div>
                <div className="flex-1 flex gap-px">
                  {HOURS.map((hour) => {
                    const count = getCount(dayIndex, hour);
                    const opacity = getOpacity(dayIndex, hour);
                    return (
                      <div
                        key={hour}
                        className="flex-1 aspect-square rounded-sm cursor-pointer"
                        style={{
                          backgroundColor: count > 0
                            ? `rgba(6, 182, 212, ${opacity})`
                            : 'var(--color-muted)',
                          opacity: count > 0 ? 1 : 0.3,
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e, dayIndex, hour)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-10">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Less</span>
              {[0.1, 0.3, 0.5, 0.7, 1].map((opacity) => (
                <div
                  key={opacity}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(6, 182, 212, ${opacity})` }}
                />
              ))}
              <span className="text-[10px] text-slate-500 dark:text-slate-400">More engagement</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
