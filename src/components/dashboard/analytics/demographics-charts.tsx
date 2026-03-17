"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Globe, Briefcase, GraduationCap } from "lucide-react";

interface DemographicData {
  byCountry?: Array<{ country: string; count: number; percentage: number }>;
  byIndustry?: Array<{ industry: string; count: number; percentage: number }>;
  byFunction?: Array<{ function: string; count: number; percentage: number }>;
  bySeniority?: Array<{ seniority: string; count: number; percentage: number }>;
}

interface DemographicsChartsProps {
  data: DemographicData;
  isOrganization: boolean;
}

function HorizontalBarChart({ items, labelKey, color }: { items: Array<Record<string, unknown>>; labelKey: string; color: string }) {
  const topItems = items.slice(0, 8);
  const maxPercentage = Math.max(...topItems.map((i) => (i.percentage as number) || 0), 1);

  return (
    <div className="space-y-2">
      {topItems.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-xs text-muted-foreground truncate text-right shrink-0">
            {String(item[labelKey] || 'Unknown')}
          </div>
          <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${Math.max(2, ((item.percentage as number) / maxPercentage) * 100)}%` }}
            />
          </div>
          <div className="w-12 text-xs font-medium tabular-nums text-right shrink-0">
            {((item.percentage as number) || 0).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

export function DemographicsCharts({ data, isOrganization }: DemographicsChartsProps) {
  if (!isOrganization) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Follower Demographics
          </h3>
          <p className="text-muted-foreground text-sm">
            Demographics data is available for company pages only. Switch to a company page to see this data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.byCountry?.length || data.byIndustry?.length || data.byFunction?.length || data.bySeniority?.length;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Follower Demographics
          </h3>
          <p className="text-muted-foreground text-sm">No demographics data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {data.byCountry && data.byCountry.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              By Country
            </h3>
            <HorizontalBarChart items={data.byCountry} labelKey="country" color="bg-emerald-500" />
          </CardContent>
        </Card>
      )}
      {data.byIndustry && data.byIndustry.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              By Industry
            </h3>
            <HorizontalBarChart items={data.byIndustry} labelKey="industry" color="bg-blue-500" />
          </CardContent>
        </Card>
      )}
      {data.byFunction && data.byFunction.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              By Job Function
            </h3>
            <HorizontalBarChart items={data.byFunction} labelKey="function" color="bg-purple-500" />
          </CardContent>
        </Card>
      )}
      {data.bySeniority && data.bySeniority.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              By Seniority
            </h3>
            <HorizontalBarChart items={data.bySeniority} labelKey="seniority" color="bg-amber-500" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
