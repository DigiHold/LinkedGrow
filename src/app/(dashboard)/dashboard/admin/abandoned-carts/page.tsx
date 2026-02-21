"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BellOff,
  Copy,
  Check,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stats {
  total: number;
  pending: number;
  recovered: number;
  expired: number;
  unsubscribed: number;
  recoveryRate: number;
  revenueRecovered: number;
  potentialRevenue: number;
  avgRecoveryTimeHours: number;
  byPlan: Record<string, { total: number; recovered: number }>;
}

interface AbandonedCart {
  id: string;
  email: string;
  name: string | null;
  planId: string;
  status: "pending" | "recovered" | "expired" | "unsubscribed";
  recoveryUrl: string | null;
  recoveryUrlExpiresAt: string | null;
  recoveredAt: string | null;
  abandonedAt: string | null;
  createdAt: string | null;
}

interface ApiResponse {
  stats: Stats;
  records: {
    items: AbandonedCart[];
    total: number;
    page: number;
    totalPages: number;
  };
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  recovered: {
    label: "Recovered",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
  unsubscribed: {
    label: "Unsubscribed",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    icon: BellOff,
  },
};

const planConfig: Record<string, { label: string; color: string }> = {
  starter: {
    label: "Starter",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  pro: {
    label: "Pro",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  business: {
    label: "Business",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
};

type FilterStatus = "all" | "pending" | "recovered" | "expired" | "unsubscribed";

export default function AdminAbandonedCartsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    recovered: 0,
    expired: 0,
    unsubscribed: 0,
    recoveryRate: 0,
    revenueRecovered: 0,
    potentialRevenue: 0,
    avgRecoveryTimeHours: 0,
    byPlan: {},
  });
  const [records, setRecords] = useState<AbandonedCart[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [page, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statusParam = filter !== "all" ? `&status=${filter}` : "";
      const response = await fetch(`/api/admin/abandoned-carts?page=${page}${statusParam}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data: ApiResponse = await response.json();
      setStats(data.stats);
      setRecords(data.records.items);
      setTotalPages(data.records.totalPages);
      setTotal(data.records.total);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return "-";
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  };

  const isRecoveryExpired = (expiresAt: string | null) => {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() < Date.now();
  };

  const copyRecoveryUrl = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "recovered", label: "Recovered", count: stats.recovered },
    { key: "expired", label: "Expired", count: stats.expired },
    { key: "unsubscribed", label: "Unsubscribed", count: stats.unsubscribed },
  ];

  if (loading && records.length === 0) {
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
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <ShoppingCart className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Abandoned Carts</h1>
        </div>
        <p className="text-muted-foreground">
          Track checkout abandonments and recovery via Brevo automation
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Total Abandoned"
          value={stats.total.toString()}
          icon={<ShoppingCart className="w-4 h-4 text-gray-500" />}
          color="bg-gray-100 dark:bg-gray-800"
        />
        <StatCard
          label="Pending"
          value={stats.pending.toString()}
          icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
          color="bg-amber-100 dark:bg-amber-900/30"
          textColor="text-amber-700 dark:text-amber-400"
        />
        <StatCard
          label="Recovered"
          value={stats.recovered.toString()}
          icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
          color="bg-green-100 dark:bg-green-900/30"
          textColor="text-green-700 dark:text-green-400"
        />
        <StatCard
          label="Recovery Rate"
          value={`${stats.recoveryRate}%`}
          icon={<TrendingUp className="w-4 h-4 text-cyan-500" />}
          color="bg-cyan-100 dark:bg-cyan-900/30"
          textColor="text-cyan-700 dark:text-cyan-400"
        />
        <StatCard
          label="Revenue Recovered"
          value={`$${stats.revenueRecovered}/mo`}
          icon={<DollarSign className="w-4 h-4 text-green-500" />}
          color="bg-green-100 dark:bg-green-900/30"
          textColor="text-green-700 dark:text-green-400"
        />
        <StatCard
          label="Potential Revenue"
          value={`$${stats.potentialRevenue}/mo`}
          icon={<DollarSign className="w-4 h-4 text-red-500" />}
          color="bg-red-100 dark:bg-red-900/30"
          textColor="text-red-700 dark:text-red-400"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl p-4 bg-violet-100 dark:bg-violet-900/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Timer className="w-4 h-4 text-violet-500" />
            Avg Recovery Time
          </div>
          <div className="text-xl font-bold text-violet-700 dark:text-violet-400">
            {stats.avgRecoveryTimeHours > 0 ? `${stats.avgRecoveryTimeHours}h` : "-"}
          </div>
        </div>
        {(["starter", "pro", "business"] as const).map((plan) => {
          const data = stats.byPlan[plan] || { total: 0, recovered: 0 };
          const rate = data.total > 0 ? Math.round((data.recovered / data.total) * 100) : 0;
          return (
            <div key={plan} className={`rounded-xl p-4 ${planConfig[plan].color.replace("text-", "").split(" ")[0]} dark:${planConfig[plan].color.split("dark:")[1]?.split(" ")[0] || "bg-gray-800"}`}>
              <div className="text-sm text-muted-foreground mb-1 capitalize">{plan} Plan</div>
              <div className="text-xl font-bold">
                {data.recovered}/{data.total}
              </div>
              <div className="text-xs text-muted-foreground">{rate}% recovery</div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs + Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {f.label}
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-x-auto">
        {records.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No abandoned carts{filter !== "all" ? ` with status "${filter}"` : ""}</p>
            <p className="text-sm mt-1">
              Records appear when a Stripe checkout session expires without completing payment
            </p>
          </div>
        ) : (
          <>
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Abandoned
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Recovery Link
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const config = statusConfig[record.status];
                  const StatusIcon = config.icon;
                  const plan = planConfig[record.planId];
                  const recoveryExpired = isRecoveryExpired(record.recoveryUrlExpiresAt);

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td data-label="Contact" className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium truncate max-w-[200px]">
                            {record.name || "-"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {record.email}
                          </div>
                        </div>
                      </td>
                      <td data-label="Plan" className="px-4 py-3">
                        {plan && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${plan.color}`}
                          >
                            {plan.label}
                          </span>
                        )}
                      </td>
                      <td data-label="Status" className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td data-label="Abandoned" className="px-4 py-3">
                        <div className="text-sm">{formatDate(record.abandonedAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {getTimeSince(record.abandonedAt)}
                        </div>
                      </td>
                      <td data-label="Recovery Link" className="px-4 py-3">
                        {record.recoveryUrl ? (
                          <div className="text-xs">
                            {recoveryExpired ? (
                              <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Expired
                              </span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Valid until {formatDate(record.recoveryUrlExpiresAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td data-label="Actions" className="px-4 py-3">
                        {record.recoveryUrl && !recoveryExpired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyRecoveryUrl(record.id, record.recoveryUrl!)}
                            className="h-7 px-2"
                          >
                            {copiedId === record.id ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="ml-1 text-xs">
                              {copiedId === record.id ? "Copied" : "Copy URL"}
                            </span>
                          </Button>
                        )}
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
                  Page {page} of {totalPages} ({total} total)
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
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  textColor = "text-foreground",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  textColor?: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}
