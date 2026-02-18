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

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/affiliates");
      if (!response.ok) throw new Error("Failed to fetch affiliates");
      const data = await response.json();
      setAffiliates(data.affiliates || []);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manage Affiliates
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

      {/* Filter tabs */}
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
        <button
          onClick={fetchAffiliates}
          disabled={loading}
          className="ml-auto p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Affiliates table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                  Total Earned
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
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {affiliate.userEmail}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            statusColors[affiliate.status] || statusColors.pending
                          }`}
                        >
                          {affiliate.status}
                        </span>
                      </td>

                      {/* Referral Code */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                          {affiliate.referralCode}
                        </span>
                      </td>

                      {/* Clicks */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {affiliate.totalClicks.toLocaleString()}
                        </span>
                      </td>

                      {/* Sign-ups */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {affiliate.totalSignups.toLocaleString()}
                        </span>
                      </td>

                      {/* Conversions */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {affiliate.totalConversions.toLocaleString()}
                        </span>
                      </td>

                      {/* Total Earned */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatCents(affiliate.totalEarned)}
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(affiliate.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
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
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl ml-6">
                            {/* Promotion Plan */}
                            <div className="md:col-span-2">
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
                                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 truncate max-w-xs">
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

                            {/* Available Balance */}
                            <div>
                              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Available Balance
                              </h4>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {formatCents(affiliate.availableBalance)}
                                {affiliate.availableBalance < 5000 && (
                                  <span className="ml-2 text-xs text-slate-400 font-normal">
                                    (min $50.00 for payout)
                                  </span>
                                )}
                              </p>
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
      </div>
    </div>
  );
}
