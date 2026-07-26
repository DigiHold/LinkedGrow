"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface EngagementTrendChartProps {
  data: Array<{ date: string; impressions: number; avgEngagement: string }>;
}

export function EngagementTrendChart({ data }: EngagementTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            Engagement Trends
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Not enough data to show trends yet.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    impressions: d.impressions,
    engagement: parseFloat(d.avgEngagement),
  }));

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          Engagement Trends
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                className="text-slate-500"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                className="text-slate-500"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                className="text-slate-500"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(value) => {
                  const d = new Date(value as string);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                formatter={(value, name) => {
                  const v = Number(value) || 0;
                  return [
                    String(name) === 'impressions' ? v.toLocaleString() : `${v.toFixed(2)}%`,
                    String(name) === 'impressions' ? 'Impressions' : 'Engagement Rate',
                  ];
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => value === 'impressions' ? 'Impressions' : 'Engagement Rate'}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagement"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
