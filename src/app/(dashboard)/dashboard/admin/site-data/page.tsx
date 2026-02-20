"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Cookie,
  CheckCircle2,
  XCircle,
  Settings2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Monitor,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsentStats {
  total: number;
  acceptedAll: number;
  rejectedAll: number;
  customized: number;
  analyticsAccepted: number;
  marketingAccepted: number;
}

interface ConsentRecord {
  id: string;
  visitorId: string;
  status: "accepted_all" | "rejected_all" | "customized";
  analytics: boolean;
  marketing: boolean;
  ipAddress: string | null;
  country: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface SiteDataResponse {
  consentStats: ConsentStats;
  consentRecords: {
    items: ConsentRecord[];
    total: number;
    page: number;
    totalPages: number;
  };
}

const statusConfig = {
  accepted_all: {
    label: "Accepted All",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  rejected_all: {
    label: "Rejected All",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
  customized: {
    label: "Customized",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Settings2,
  },
};

export default function AdminSiteDataPage() {
  const [loading, setLoading] = useState(true);
  const [consentStats, setConsentStats] = useState<ConsentStats>({
    total: 0,
    acceptedAll: 0,
    rejectedAll: 0,
    customized: 0,
    analyticsAccepted: 0,
    marketingAccepted: 0,
  });
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSiteData();
  }, [page]);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/site-data?page=${page}`);
      if (!response.ok) throw new Error("Failed to fetch site data");

      const data: SiteDataResponse = await response.json();
      setConsentStats(data.consentStats);
      setConsentRecords(data.consentRecords.items);
      setTotalPages(data.consentRecords.totalPages);
      setTotal(data.consentRecords.total);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const getBrowserFromUA = (ua: string | null): string => {
    if (!ua) return "Unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    return "Other";
  };

  if (loading && consentRecords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <Database className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold">Site Data</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor cookie consent choices and visitor analytics
        </p>
      </div>

      {/* Cookie Consent Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Cookie className="w-5 h-5 text-amber-500" />
          Cookie Consent Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Visitors"
            value={consentStats.total}
            color="bg-gray-100 dark:bg-gray-800"
          />
          <StatCard
            label="Accepted All"
            value={consentStats.acceptedAll}
            percentage={calcPercentage(consentStats.acceptedAll, consentStats.total)}
            color="bg-green-100 dark:bg-green-900/30"
            textColor="text-green-700 dark:text-green-400"
          />
          <StatCard
            label="Rejected All"
            value={consentStats.rejectedAll}
            percentage={calcPercentage(consentStats.rejectedAll, consentStats.total)}
            color="bg-red-100 dark:bg-red-900/30"
            textColor="text-red-700 dark:text-red-400"
          />
          <StatCard
            label="Customized"
            value={consentStats.customized}
            percentage={calcPercentage(consentStats.customized, consentStats.total)}
            color="bg-blue-100 dark:bg-blue-900/30"
            textColor="text-blue-700 dark:text-blue-400"
          />
          <StatCard
            label="Analytics On"
            value={consentStats.analyticsAccepted}
            percentage={calcPercentage(consentStats.analyticsAccepted, consentStats.total)}
            color="bg-violet-100 dark:bg-violet-900/30"
            textColor="text-violet-700 dark:text-violet-400"
          />
          <StatCard
            label="Marketing On"
            value={consentStats.marketingAccepted}
            percentage={calcPercentage(consentStats.marketingAccepted, consentStats.total)}
            color="bg-amber-100 dark:bg-amber-900/30"
            textColor="text-amber-700 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Consent Log */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            Consent Log
            {total > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                {total}
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSiteData()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-x-auto">
          {consentRecords.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <Cookie className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No consent records yet</p>
              <p className="text-sm mt-1">Records will appear as visitors interact with the cookie banner</p>
            </div>
          ) : (
            <>
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Choices
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        IP Address
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Country
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Browser
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentRecords.map((record) => {
                      const config = statusConfig[record.status];
                      const StatusIcon = config.icon;
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td data-label="Action" className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {config.label}
                            </span>
                          </td>
                          <td data-label="Choices" className="px-4 py-3">
                            <div className="flex gap-2">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  record.analytics
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                Analytics: {record.analytics ? "Yes" : "No"}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  record.marketing
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                Marketing: {record.marketing ? "Yes" : "No"}
                              </span>
                            </div>
                          </td>
                          <td data-label="IP" className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-mono">
                              <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                              {record.ipAddress || "unknown"}
                            </div>
                          </td>
                          <td data-label="Country" className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                              {record.country || "unknown"}
                            </div>
                          </td>
                          <td data-label="Browser" className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {getBrowserFromUA(record.userAgent)}
                            </span>
                          </td>
                          <td data-label="Date" className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(record.createdAt)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  percentage,
  color,
  textColor = "text-foreground",
}: {
  label: string;
  value: number;
  percentage?: number;
  color: string;
  textColor?: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value.toLocaleString()}</div>
      {percentage !== undefined && (
        <div className="text-xs text-muted-foreground mt-1">{percentage}%</div>
      )}
    </div>
  );
}
