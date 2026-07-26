"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useSession } from "next-auth/react";
import {
  Check,
  X,
  Ban,
  DollarSign,
  Copy,
  ChevronDown,
  ChevronUp,
  Users,
  Filter,
  Loader2,
  RefreshCw,
  Download,
} from "lucide-react";

interface AffiliateData {
  id: string;
  userId: string;
  referralCode: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  promotionPlan: string | null;
  paypalEmail: string | null;
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  totalEarned: number;
  availableBalance: number;
  holdBalance: number;
  totalPaidOut: number;
  createdAt: string | number;
  updatedAt: string | number;
  userName: string | null;
  userEmail: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string | Date | number): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusColors: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  suspended:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default function AdminAffiliatesPage() {
  const { data: session } = useSession();
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Mark as paid dialog state
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payableAffiliates, setPayableAffiliates] = useState<AffiliateData[]>([]);
  const [payingProgress, setPayingProgress] = useState<number>(0);
  const [isPaying, setIsPaying] = useState(false);

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/affiliates");
      if (!response.ok) throw new Error("Failed to fetch affiliates");
      const data = await response.json();
      setAffiliates(data.affiliates || []);
    } catch (error) {
setFeedback({
        type: "error",
        message: "Failed to load affiliates",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // Auto-dismiss feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleAction = async (
    affiliateId: string,
    action: "approve" | "reject" | "suspend"
  ) => {
    setActionLoading(affiliateId);
    try {
      const response = await fetch("/api/admin/affiliates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, action }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }
      setFeedback({
        type: "success",
        message: `Affiliate ${action}${action === "approve" ? "d" : action === "reject" ? "ed" : "ed"} successfully`,
      });
      await fetchAffiliates();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to perform action",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePayout = async (affiliateId: string) => {
    setActionLoading(affiliateId);
    try {
      const response = await fetch(
        `/api/admin/affiliates/${affiliateId}/payout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create payout");
      }
      setFeedback({
        type: "success",
        message: "Payout created successfully",
      });
      await fetchAffiliates();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create payout",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setFeedback({ type: "success", message: "Copied to clipboard" });
  };

  // Get affiliates eligible for PayPal payout (available >= $50)
  const getPayableAffiliates = () => {
    return affiliates.filter(
      (a) => a.status === "approved" && a.availableBalance >= 5000 && a.paypalEmail
    );
  };

  // Export PayPal Mass Pay CSV
  const handleExportCSV = () => {
    const payable = getPayableAffiliates();
    if (payable.length === 0) return;

    const header = "Email,Amount,Currency Code,Note";
    const rows = payable.map(
      (a) =>
        `${a.paypalEmail},${(a.availableBalance / 100).toFixed(2)},USD,LinkedGrow affiliate commission payout - ${a.referralCode}`
    );
    const csv = [header, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `paypal-payouts-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show mark-as-paid dialog
    setPayableAffiliates(payable);
    setShowPayDialog(true);
  };

  // Mark all payable affiliates as paid
  const handleMarkAsPaid = async () => {
    setIsPaying(true);
    setPayingProgress(0);

    let successCount = 0;
    for (let i = 0; i < payableAffiliates.length; i++) {
      try {
        const response = await fetch(
          `/api/admin/affiliates/${payableAffiliates[i].id}/payout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (response.ok) successCount++;
      } catch {
        // Continue with next affiliate
      }
      setPayingProgress(i + 1);
    }

    setIsPaying(false);
    setShowPayDialog(false);
    setPayableAffiliates([]);
    setFeedback({
      type: "success",
      message: `${successCount} of ${payableAffiliates.length} payouts recorded successfully`,
    });
    await fetchAffiliates();
  };

  const filteredAffiliates =
    filter === "all"
      ? affiliates
      : affiliates.filter((a) => a.status === filter);

  const statusCounts = {
    all: affiliates.length,
    pending: affiliates.filter((a) => a.status === "pending").length,
    approved: affiliates.filter((a) => a.status === "approved").length,
    rejected: affiliates.filter((a) => a.status === "rejected").length,
    suspended: affiliates.filter((a) => a.status === "suspended").length,
  };

  const payableCount = getPayableAffiliates().length;

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Ban className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Affiliates
          </h1>
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
            ({affiliates.length} total)
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Review affiliate applications, manage status, and process payouts
        </p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter tabs + CSV export */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {(
          ["all", "pending", "approved", "rejected", "suspended"] as const
        ).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? "bg-cyan-500 text-white dark:bg-cyan-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            <span className="capitalize">{status}</span>
            <span className="ml-1.5 opacity-75">({statusCounts[status]})</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {payableCount > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <Download className="w-4 h-4" />
              PayPal CSV ({payableCount})
            </button>
          )}
          <button
            onClick={fetchAffiliates}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Affiliates table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full responsive-table">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Referral Code
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Clicks
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sign-ups
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Conversions
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                To Pay
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Applied
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Loading affiliates...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredAffiliates.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  {filter === "all"
                    ? "No affiliate applications yet"
                    : `No ${filter} affiliates`}
                </td>
              </tr>
            ) : (
              filteredAffiliates.map((affiliate) => (
                <Fragment key={affiliate.id}>
                  <tr
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Name */}
                    <td data-label="Name" className="px-4 py-3">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === affiliate.id
                              ? null
                              : affiliate.id
                          )
                        }
                        className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        {expandedId === affiliate.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span>{affiliate.userName || "No name"}</span>
                      </button>
                    </td>

                    {/* Email */}
                    <td data-label="Email" className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {affiliate.userEmail}
                      </span>
                    </td>

                    {/* Status */}
                    <td data-label="Status" className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusColors[affiliate.status] || statusColors.pending
                        }`}
                      >
                        {affiliate.status}
                      </span>
                    </td>

                    {/* Referral Code */}
                    <td data-label="Code" className="px-4 py-3">
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                        {affiliate.referralCode}
                      </span>
                    </td>

                    {/* Clicks */}
                    <td data-label="Clicks" className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {affiliate.totalClicks.toLocaleString()}
                      </span>
                    </td>

                    {/* Sign-ups */}
                    <td data-label="Sign-ups" className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {affiliate.totalSignups.toLocaleString()}
                      </span>
                    </td>

                    {/* Conversions */}
                    <td data-label="Conversions" className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {affiliate.totalConversions.toLocaleString()}
                      </span>
                    </td>

                    {/* To Pay (available balance) */}
                    <td data-label="To Pay" className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          affiliate.availableBalance >= 5000
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {formatCents(affiliate.availableBalance)}
                      </span>
                    </td>

                    {/* Applied Date */}
                    <td data-label="Applied" className="px-4 py-3">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(affiliate.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td data-label="" className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {actionLoading === affiliate.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            {affiliate.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(affiliate.id, "approve")
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors"
                                  title="Approve"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleAction(affiliate.id, "reject")
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                  title="Reject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}

                            {affiliate.status === "approved" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(affiliate.id, "suspend")
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                                  title="Suspend"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Suspend
                                </button>
                                {affiliate.availableBalance >= 5000 && (
                                  <button
                                    onClick={() =>
                                      handleCreatePayout(affiliate.id)
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/40 transition-colors"
                                    title="Create payout"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Payout
                                  </button>
                                )}
                              </>
                            )}

                            {affiliate.status === "suspended" && (
                              <button
                                onClick={() =>
                                  handleAction(affiliate.id, "approve")
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors"
                                title="Reactivate"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Reactivate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === affiliate.id && (
                    <tr
                      className="bg-slate-50 dark:bg-slate-800/30"
                    >
                      <td colSpan={10} className="px-4 py-4">
                        {/* Financial stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 ml-0 sm:ml-6">
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300 mb-0.5">
                              On Hold
                            </p>
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                              {formatCents(affiliate.holdBalance)}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 mb-0.5">
                              To Pay
                            </p>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                              {formatCents(affiliate.availableBalance)}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                            <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300 mb-0.5">
                              Total Earned
                            </p>
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                              {formatCents(affiliate.totalEarned)}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                              Total Paid Out
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatCents(affiliate.totalPaidOut)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl ml-0 sm:ml-6">
                          {/* Promotion Plan */}
                          <div className="sm:col-span-2 md:col-span-2">
                            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Promotion Plan
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {affiliate.promotionPlan || "No plan provided"}
                            </p>
                          </div>

                          {/* PayPal Email */}
                          <div>
                            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                              PayPal Email
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {affiliate.paypalEmail || "Not provided"}
                            </p>
                          </div>

                          {/* Referral Code with copy */}
                          <div>
                            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Referral Code
                            </h4>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                                {affiliate.referralCode}
                              </code>
                              <button
                                onClick={() =>
                                  copyToClipboard(affiliate.referralCode)
                                }
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                title="Copy referral code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Referral Link with copy */}
                          <div>
                            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Referral Link
                            </h4>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                                linkedgrow.ai/?ref={affiliate.referralCode}
                              </code>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `https://linkedgrow.ai/?ref=${affiliate.referralCode}`
                                  )
                                }
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                title="Copy referral link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mark as Paid Dialog */}
      {showPayDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isPaying && setShowPayDialog(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Mark as Paid?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              CSV downloaded. Mark these affiliates as paid to reset their available balance.
            </p>

            <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
              {payableAffiliates.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                >
                  <span className="text-slate-700 dark:text-slate-300 truncate mr-2">
                    {a.userName || a.userEmail}
                  </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                    {formatCents(a.availableBalance)}
                  </span>
                </div>
              ))}
            </div>

            {isPaying && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Processing payouts...</span>
                  <span>
                    {payingProgress}/{payableAffiliates.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(payingProgress / payableAffiliates.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPayDialog(false)}
                disabled={isPaying}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={isPaying}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isPaying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Mark All as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
