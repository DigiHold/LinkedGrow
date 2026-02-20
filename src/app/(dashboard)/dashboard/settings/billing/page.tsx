"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Receipt,
  ExternalLink,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Crown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface BillingData {
  hasSubscription: boolean;
  plan: string;
  subscription: Subscription | null;
  invoices: Invoice[];
  cards: PaymentCard[];
}

const planNames: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

const planPrices: Record<string, number> = {
  starter: 19,
  pro: 39,
  business: 79,
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
    case "open":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
    case "void":
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Void</Badge>;
    case "uncollectible":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getCardBrandIcon(brand: string) {
  const brandLower = brand?.toLowerCase();
  switch (brandLower) {
    case "visa":
      return "💳 Visa";
    case "mastercard":
      return "💳 Mastercard";
    case "amex":
      return "💳 Amex";
    default:
      return `💳 ${brand || "Card"}`;
  }
}

function BillingContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPortal = searchParams.get("from") === "portal";
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const response = await fetch("/api/stripe/billing");
        if (!response.ok) {
          throw new Error("Failed to fetch billing information");
        }
        const data = await response.json();
        setBilling(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBilling();
  }, []);

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setIsPortalLoading(false);
    }
  };

  // Redirect free users to upgrade page
  if (!isLoading && session?.user?.plan === "free") {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Active Subscription</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You are currently on the Free plan. Upgrade to unlock billing management, invoices, and premium features.
            </p>
            <Button
              onClick={() => router.push("/dashboard/upgrade")}
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              View Plans & Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Back link - shown when returning from Stripe portal */}
      {fromPortal && (
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            Billing
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and view invoices
          </p>
        </div>

        <Button
          onClick={handleManageBilling}
          disabled={isPortalLoading}
          className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        >
          {isPortalLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4 mr-2" />
          )}
          Manage Billing
        </Button>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold">
                  {planNames[billing?.plan || "free"]}
                </span>
                {billing?.subscription?.status === "active" && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
                {billing?.subscription?.cancelAtPeriodEnd && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    Canceling
                  </Badge>
                )}
              </div>
              {billing?.subscription && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {formatCurrency(billing.subscription.amount, billing.subscription.currency)}
                    /{billing.subscription.interval}
                  </p>
                  {billing.subscription.cancelAtPeriodEnd ? (
                    <p className="text-amber-600 dark:text-amber-400">
                      Access until {formatDate(billing.subscription.currentPeriodEnd)}
                    </p>
                  ) : (
                    <p>
                      Next billing: {formatDate(billing.subscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button variant="outline" onClick={() => router.push("/dashboard/upgrade")}>
              {billing?.plan === "business" ? "View Plans" : "Change Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Card */}
      {billing?.cards && billing.cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-600" />
              Payment Method
            </CardTitle>
            <CardDescription>
              Your saved payment method for automatic billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billing.cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getCardBrandIcon(card.brand)}</span>
                    <div>
                      <p className="font-medium">**** **** **** {card.last4}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires {card.expMonth.toString().padStart(2, "0")}/{card.expYear}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleManageBilling}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-600" />
            Invoices
          </CardTitle>
          <CardDescription>
            Download your past invoices for your records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billing?.invoices && billing.invoices.length > 0 ? (
            <div className="divide-y">
              {billing.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invoice.number || `Invoice`}</p>
                        {getStatusBadge(invoice.status || "paid")}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.created)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-13 sm:ml-0">
                    <span className="font-semibold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </span>
                    <div className="flex gap-2">
                      {invoice.pdfUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </a>
                        </Button>
                      )}
                      {invoice.hostedUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No invoices yet</p>
              <p className="text-sm">Your invoices will appear here after your first payment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Need help with billing?</h3>
              <p className="text-sm text-muted-foreground">
                If you have questions about your subscription or invoices, we are here to help.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="mailto:contact@linkedgrow.ai">Contact Support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
