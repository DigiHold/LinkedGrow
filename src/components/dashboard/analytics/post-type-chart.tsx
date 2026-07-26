"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PostTypeChartProps {
  data: Array<{ type: string; count: number; avgEngagement: string }>;
}

const TYPE_COLORS: Record<string, string> = {
  text: "#64748b",
  image: "#3b82f6",
  carousel: "#8b5cf6",
  video: "#10b981",
};

export function PostTypeChart({ data }: PostTypeChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            Content Performance by Type
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    type: d.type.charAt(0).toUpperCase() + d.type.slice(1),
    engagement: parseFloat(d.avgEngagement),
    count: d.count,
    rawType: d.type,
  }));

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-500" />
          Content Performance by Type
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} className="text-slate-500" />
              <YAxis tick={{ fontSize: 12 }} className="text-slate-500" label={{ value: 'Avg Engagement %', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Avg Engagement']}
              />
              <Bar dataKey="engagement" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={TYPE_COLORS[entry.rawType] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-4 justify-center">
          {chartData.map((d) => (
            <div key={d.rawType} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[d.rawType] || '#64748b' }} />
              {d.type} ({d.count})
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
