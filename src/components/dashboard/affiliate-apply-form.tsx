"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, User, Mail, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The affiliate application, inside the dashboard.
 *
 * The public /affiliate/apply page carries a second job this one never has:
 * it takes applications from people with no account, so it also creates the
 * account and sets a password. Here the user is already signed in, so the form
 * is the five fields and nothing else, posting to the same endpoint with the
 * same rules. Sending someone from a paid dashboard out to a marketing page to
 * fill in a form is the kind of detour that loses the application.
 */

const FIELD =
  "w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all";
const LABEL =
  "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";
const ICON =
  "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none";

export function AffiliateApplyForm({ onApplied }: { onApplied: () => void }) {
  const { data: session } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [promotionPlan, setPromotionPlan] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const email = session?.user?.email ?? "";

  useEffect(() => {
    const parts = (session?.user?.name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      setFirstName(parts[0]);
      setLastName(parts.slice(1).join(" "));
    } else if (parts.length === 1) {
      setFirstName(parts[0]);
    }
  }, [session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (honeypot) return;

    // Checked here as well as on the server so the user is told before the
    // round trip, since it is the one rule that is easy to trip.
    if (promotionPlan.trim().length < 20) {
      setError("Tell us a little more about how you would promote LinkedGrow, at least 20 characters.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email,
          paypalEmail: paypalEmail.trim(),
          promotionPlan: promotionPlan.trim(),
          _hp: honeypot,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || "Something went wrong. Try again in a moment.");
        return;
      }
      // The page refetches and swaps itself to the pending state.
      onApplied();
    } catch {
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        name="lg_form_token"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="affiliateFirstName" className={LABEL}>
            First name
          </label>
          <div className="relative">
            <User className={ICON} />
            <input
              id="affiliateFirstName"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={FIELD}
            />
          </div>
        </div>
        <div>
          <label htmlFor="affiliateLastName" className={LABEL}>
            Last name
          </label>
          <div className="relative">
            <User className={ICON} />
            <input
              id="affiliateLastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={FIELD}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="affiliateEmail" className={LABEL}>
          Email
        </label>
        <div className="relative">
          <Mail className={ICON} />
          <input
            id="affiliateEmail"
            type="email"
            value={email}
            readOnly
            className={`${FIELD} cursor-not-allowed bg-slate-50 opacity-75 dark:bg-slate-800/50`}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          This is the email on your account and it cannot be changed here.
        </p>
      </div>

      <div>
        <label htmlFor="affiliatePaypal" className={LABEL}>
          PayPal email
        </label>
        <div className="relative">
          <DollarSign className={ICON} />
          <input
            id="affiliatePaypal"
            type="email"
            placeholder="paypal@example.com"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            required
            className={FIELD}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Where commissions are paid. It can differ from your account email.
        </p>
      </div>

      <div>
        <label htmlFor="affiliatePlan" className={LABEL}>
          How do you plan to promote LinkedGrow?
        </label>
        <div className="relative">
          <MessageSquare className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <textarea
            id="affiliatePlan"
            placeholder="e.g., I have a LinkedIn audience of 50K followers focused on marketing..."
            value={promotionPlan}
            onChange={(e) => setPromotionPlan(e.target.value)}
            required
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          At least 20 characters. Tell us about your audience and your channels.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 font-semibold text-white hover:from-cyan-600 hover:to-blue-700"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Apply to the affiliate program"
        )}
      </Button>

      <p className="text-center text-xs text-slate-500 dark:text-slate-500">
        By applying you agree to our{" "}
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
