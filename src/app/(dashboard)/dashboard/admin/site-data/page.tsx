"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Cookie,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
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

interface DataRemovalRequest {
  id: string;
  email: string;
  userId: string | null;
  status: "pending" | "processing" | "completed" | "rejected";
  reason: string | null;
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface SiteDataResponse {
  consentStats: ConsentStats;
  removalRequests: {
    items: DataRemovalRequest[];
    total: number;
    page: number;
    totalPages: number;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  processing: RefreshCw,
  completed: CheckCircle2,
  rejected: XCircle,
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
  const [removalRequests, setRemovalRequests] = useState<DataRemovalRequest[]>([]);
  const [removalPage, setRemovalPage] = useState(1);
  const [removalTotalPages, setRemovalTotalPages] = useState(1);
  const [removalTotal, setRemovalTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteData();
  }, [removalPage]);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/site-data?page=${removalPage}`);
      if (!response.ok) throw new Error("Failed to fetch site data");

      const data: SiteDataResponse = await response.json();
      setConsentStats(data.consentStats);
      setRemovalRequests(data.removalRequests.items);
      setRemovalTotalPages(data.removalRequests.totalPages);
      setRemovalTotal(data.removalRequests.total);
    } catch (error) {
      console.error("Error fetching site data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    id: string,
    status: "processing" | "completed" | "rejected",
    adminNotes?: string
  ) => {
    try {
      setProcessingId(id);
      const response = await fetch(`/api/admin/site-data/removal-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) throw new Error("Failed to update request");

      // Refresh data
      await fetchSiteData();
    } catch (error) {
      console.error("Error updating request:", error);
    } finally {
      setProcessingId(null);
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

  if (loading) {
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
          Monitor cookie consent choices and manage data removal requests
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

      {/* Data Removal Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-500" />
          Data Removal Requests
          {removalTotal > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {removalTotal}
            </span>
          )}
        </h2>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-hidden">
          {removalRequests.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No data removal requests yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Reason
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Requested
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {removalRequests.map((request) => {
                      const StatusIcon = statusIcons[request.status];
                      return (
                        <tr
                          key={request.id}
                          className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <span className="text-sm font-medium">{request.email}</span>
                              {request.userId && (
                                <span className="block text-xs text-muted-foreground font-mono">
                                  User: {request.userId.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                statusColors[request.status]
                              }`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {request.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {request.reason || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(request.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateRequestStatus(request.id, "processing")}
                                  disabled={processingId === request.id}
                                >
                                  {processingId === request.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Process"
                                  )}
                                </Button>
                              </div>
                            )}
                            {request.status === "processing" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateRequestStatus(request.id, "completed")}
                                  disabled={processingId === request.id}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => updateRequestStatus(request.id, "rejected")}
                                  disabled={processingId === request.id}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {(request.status === "completed" || request.status === "rejected") && (
                              <span className="text-xs text-muted-foreground">
                                {request.processedAt && formatDate(request.processedAt)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {removalTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Page {removalPage} of {removalTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemovalPage((p) => Math.max(1, p - 1))}
                      disabled={removalPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemovalPage((p) => Math.min(removalTotalPages, p + 1))}
                      disabled={removalPage === removalTotalPages}
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
