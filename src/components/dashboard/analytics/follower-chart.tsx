"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FollowerChartProps {
  data: Array<{ date: string; count: number }>;
}

export function FollowerChart({ data }: FollowerChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Follower Growth
          </h3>
          <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
            Not enough data to show follower growth yet
          </div>
        </CardContent>
      </Card>
    );
  }

  let cumulative = 0;
  const chartData = data.map((d) => {
    cumulative += d.count;
    return {
      date: d.date,
      followers: cumulative,
      gained: d.count,
    };
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500" />
          Follower Growth
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <YAxis tick={{ fontSize: 12 }} className="text-slate-500" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(value) => {
                  const d = new Date(value as string);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }}
                formatter={(value, name) => [
                  Number(value).toLocaleString(),
                  String(name) === 'followers' ? 'Cumulative' : 'Gained',
                ]}
              />
              <Area
                type="monotone"
                dataKey="followers"
                stroke="#8b5cf6"
                fill="url(#followerGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
