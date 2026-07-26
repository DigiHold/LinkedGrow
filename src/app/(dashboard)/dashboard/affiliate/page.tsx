"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Link2,
  Copy,
  Check,
  DollarSign,
  Users,
  MousePointerClick,
  TrendingUp,
  Wallet,
  Mail,
  Loader2,
  Clock,
  AlertCircle,
  ExternalLink,
  BadgeCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Affiliate {
  id: string;
  referralCode: string;
  status: "pending" | "approved" | "rejected";
  paypalEmail: string | null;
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  createdAt: string;
}

interface Earnings {
  pending: number;
  available: number;
  totalEarned: number;
  totalPaidOut: number;
}

interface Referral {
  id: string;
  userName: string | null;
  userEmail: string;
  status: "signed_up" | "converted" | "churned";
  plan: string | null;
  commission: number;
  createdAt: string;
}

interface Commission {
  id: string;
  invoiceAmount: number;
  commissionAmount: number;
  status: "pending" | "available" | "paid";
  availableDate: string;
  createdAt: string;
}

interface AffiliateData {
  affiliate: Affiliate;
  earnings: Earnings;
  referrals: Referral[];
  commissions: Commission[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AffiliateDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [data, setData] = useState<AffiliateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Copy to clipboard state
  const [copied, setCopied] = useState(false);

  // PayPal email settings
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isSavingPaypal, setIsSavingPaypal] = useState(false);
  const [paypalSuccess, setPaypalSuccess] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  const fetchAffiliateData = useCallback(async () => {
    try {
      const response = await fetch("/api/affiliate");

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load affiliate data");
      }

      const result: AffiliateData = await response.json();
      setData(result);
      setPaypalEmail(result.affiliate.paypalEmail || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchAffiliateData();
    } else if (sessionStatus === "unauthenticated") {
      setIsLoading(false);
    }
  }, [sessionStatus, fetchAffiliateData]);

  const handleCopyLink = async () => {
    if (!data) return;
    const link = `https://linkedgrow.ai/?ref=${data.affiliate.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSavePaypal = async () => {
    if (!paypalEmail.trim() || !paypalEmail.includes("@")) {
      setPaypalError("Please enter a valid email address");
      return;
    }

    setIsSavingPaypal(true);
    setPaypalError(null);
    setPaypalSuccess(null);

    try {
      const response = await fetch("/api/affiliate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalEmail: paypalEmail.trim() }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save settings");
      }

      setPaypalSuccess("PayPal email saved successfully");
      setTimeout(() => setPaypalSuccess(null), 3000);
    } catch (err) {
      setPaypalError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSavingPaypal(false);
    }
  };

  // Not logged in
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card>
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <Users className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                You need to be logged in to access the affiliate dashboard.
              </p>
              <Link href="/sign-in">
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6"
            >
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Cards skeleton */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6"
          >
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Something Went Wrong</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
              <Button onClick={() => { setError(null); setIsLoading(true); fetchAffiliateData(); }}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No affiliate account
  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card>
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <Link2 className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                You don&apos;t have an affiliate account yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Join our affiliate program and earn 30% recurring commissions on every referral. Apply now to get started.
              </p>
              <Link href="/affiliate/apply">
                <Button className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Apply to Affiliate Program
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending status
  if (data?.affiliate.status === "pending") {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Application Under Review</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Your affiliate application is being reviewed. We typically process applications within 1 - 2 business days. You&apos;ll receive an email once your application is approved.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3">
                Applied on {formatDate(data.affiliate.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected status
  if (data?.affiliate.status === "rejected") {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Application Not Approved</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Unfortunately, your affiliate application was not approved at this time. If you believe this is an error or your circumstances have changed, feel free to reach out to us.
              </p>
              <a href="mailto:contact@linkedgrow.ai">
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Approved - full dashboard
  if (!data) return null;

  const { affiliate, earnings, referrals, commissions } = data;
  const referralLink = `https://linkedgrow.ai/?ref=${affiliate.referralCode}`;
  const conversionRate =
    affiliate.totalClicks > 0
      ? ((affiliate.totalSignups / affiliate.totalClicks) * 100).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
            Affiliate Dashboard
          </h1>
          <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
            Track your referrals, earnings, and commissions
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 w-fit">
          <BadgeCheck className="w-3.5 h-3.5" />
          Approved
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Clicks</p>
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <MousePointerClick className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{affiliate.totalClicks.toLocaleString()}</p>
        </div>

        {/* Total Sign-ups */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sign-ups</p>
            <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{affiliate.totalSignups.toLocaleString()}</p>
          {conversionRate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {conversionRate}% conversion rate
            </p>
          )}
        </div>

        {/* Total Conversions */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Conversions</p>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{affiliate.totalConversions.toLocaleString()}</p>
        </div>

        {/* Available Balance */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Balance</p>
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCents(earnings.available)}
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-5 h-5 text-cyan-500" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm overflow-hidden">
              <span className="truncate">{referralLink}</span>
            </div>
            <Button
              onClick={handleCopyLink}
              variant={copied ? "default" : "outline"}
              className={cn(
                "shrink-0 transition-all",
                copied && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Share this link on your website, social media, or with your audience. You earn 30% recurring commission on every paying customer you refer.
          </p>
        </CardContent>
      </Card>

      {/* Earnings Overview */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                Pending (in hold)
              </p>
              <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
                {formatCents(earnings.pending)}
              </p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-1.5 leading-snug">
                Commissions in the 14-day refund window - automatically available after hold period
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                Available
                {earnings.available >= 5000 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">
                    Payout eligible
                  </span>
                )}
              </p>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {formatCents(earnings.available)}
              </p>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-1.5 leading-snug">
                Ready for payout - paid monthly via PayPal when balance reaches $50+
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                Total Earned
              </p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {formatCents(earnings.totalEarned)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Total Paid Out
              </p>
              <p className="text-lg font-bold">
                {formatCents(earnings.totalPaidOut)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PayPal Email Settings */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5 text-blue-500" />
            PayPal Email for Payouts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="your@paypal-email.com"
              value={paypalEmail}
              onChange={(e) => {
                setPaypalEmail(e.target.value);
                setPaypalError(null);
                setPaypalSuccess(null);
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSavePaypal}
              disabled={isSavingPaypal || !paypalEmail.trim()}
              className="shrink-0"
            >
              {isSavingPaypal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {paypalError && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {paypalError}
            </p>
          )}
          {paypalSuccess && (
            <p className="text-sm text-emerald-500 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {paypalSuccess}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Payouts are sent to this PayPal email when your available balance reaches $50 or more.
          </p>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-cyan-500" />
            Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No referrals yet. Share your link to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      User
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Signed Up
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Plan
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Commission
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral, index) => (
                    <tr
                      key={referral.id}
                      className={cn(
                        "border-b border-slate-100 dark:border-slate-800 last:border-0",
                        index % 2 === 1 && "bg-slate-50/50 dark:bg-slate-800/30"
                      )}
                    >
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-sm font-medium">
                            {referral.userName || "Anonymous"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {referral.userEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(referral.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        <ReferralStatusBadge status={referral.status} />
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm capitalize">
                          {referral.plan || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <p className="text-sm font-medium">
                          {referral.commission > 0 ? formatCents(referral.commission) : "-"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No commissions yet. Commissions appear when your referrals make a purchase.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Date
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Invoice Amount
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Commission (30%)
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                      Available Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission, index) => (
                    <tr
                      key={commission.id}
                      className={cn(
                        "border-b border-slate-100 dark:border-slate-800 last:border-0",
                        index % 2 === 1 && "bg-slate-50/50 dark:bg-slate-800/30"
                      )}
                    >
                      <td className="px-6 py-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(commission.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <p className="text-sm">
                          {formatCents(commission.invoiceAmount)}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCents(commission.commissionAmount)}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        <CommissionStatusBadge status={commission.status} />
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(commission.availableDate)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralStatusBadge({ status }: { status: Referral["status"] }) {
  const config = {
    signed_up: {
      label: "Signed Up",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    converted: {
      label: "Converted",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    churned: {
      label: "Churned",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

function CommissionStatusBadge({ status }: { status: Commission["status"] }) {
  const config = {
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    available: {
      label: "Available",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    paid: {
      label: "Paid",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
