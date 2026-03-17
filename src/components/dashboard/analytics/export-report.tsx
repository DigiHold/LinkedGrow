"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

interface ExportData {
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    avgEngagement: string;
    followerCount?: number;
    followersGained?: number;
  };
  posts: Array<{
    content: string | null;
    postType: string | null;
    publishedAt: string | null;
    analytics?: {
      impressions: number;
      reactions: number;
      comments: number;
      reshares: number;
    };
  }>;
  dateRange: string;
}

interface ExportReportProps {
  data: ExportData;
}

export function ExportReport({ data }: ExportReportProps) {
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const exportCsv = () => {
    setIsExportingCsv(true);
    try {
      const headers = ["Post Content", "Type", "Published", "Impressions", "Reactions", "Comments", "Shares", "Engagement Rate"];
      const rows = data.posts
        .filter((p) => p.analytics)
        .map((p) => {
          const a = p.analytics!;
          const rate = a.impressions > 0
            ? ((a.reactions + a.comments + a.reshares) / a.impressions * 100).toFixed(2)
            : "0.00";
          return [
            `"${(p.content || '').replace(/"/g, '""')}"`,
            p.postType || "text",
            p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "",
            a.impressions,
            a.reactions,
            a.comments,
            a.reshares,
            `${rate}%`,
          ].join(",");
        });

      const summaryRows = [
        "",
        "Summary",
        `Total Posts,${data.summary.totalPosts}`,
        `Total Impressions,${data.summary.totalImpressions}`,
        `Total Reactions,${data.summary.totalReactions}`,
        `Total Comments,${data.summary.totalComments}`,
        `Total Shares,${data.summary.totalShares}`,
        `Avg Engagement Rate,${data.summary.avgEngagement}%`,
        data.summary.followerCount ? `Followers,${data.summary.followerCount}` : "",
        data.summary.followersGained ? `Followers Gained,${data.summary.followersGained}` : "",
      ].filter(Boolean);

      const csv = [headers.join(","), ...rows, ...summaryRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `linkedgrow-analytics-${data.dateRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const exportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("LinkedGrow Analytics Report", 20, 20);
      doc.setFontSize(10);
      doc.text(`Date range: ${data.dateRange}`, 20, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 34);

      doc.setFontSize(14);
      doc.text("Summary", 20, 48);
      doc.setFontSize(10);
      let y = 56;
      doc.text(`Total Posts: ${data.summary.totalPosts}`, 20, y); y += 6;
      doc.text(`Total Impressions: ${data.summary.totalImpressions.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Total Reactions: ${data.summary.totalReactions.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Total Comments: ${data.summary.totalComments.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Total Shares: ${data.summary.totalShares.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Avg Engagement Rate: ${data.summary.avgEngagement}%`, 20, y); y += 6;
      if (data.summary.followerCount) {
        doc.text(`Followers: ${data.summary.followerCount.toLocaleString()}`, 20, y); y += 6;
      }
      if (data.summary.followersGained) {
        doc.text(`Followers Gained: ${data.summary.followersGained.toLocaleString()}`, 20, y); y += 6;
      }

      y += 8;
      doc.setFontSize(14);
      doc.text("Top Posts", 20, y);
      y += 8;
      doc.setFontSize(9);

      const topPosts = data.posts
        .filter((p) => p.analytics)
        .sort((a, b) => (b.analytics!.impressions || 0) - (a.analytics!.impressions || 0))
        .slice(0, 10);

      topPosts.forEach((post) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const content = (post.content || 'Untitled').substring(0, 60);
        const a = post.analytics!;
        doc.text(`${content}...`, 20, y);
        doc.text(`Views: ${a.impressions} | Reactions: ${a.reactions} | Comments: ${a.comments} | Shares: ${a.reshares}`, 25, y + 5);
        y += 12;
      });

      doc.save(`linkedgrow-analytics-${data.dateRange}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-500" />
          Export Report
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={isExportingCsv}>
            {isExportingCsv ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={isExportingPdf}>
            {isExportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
