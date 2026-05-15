"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Plus, Loader2, MessageCircle, Lock, ArrowRight, AlertCircle } from "lucide-react";

import { statusColor, STATUS_LABELS as STATUS_LABEL, type TicketStatus } from "@/lib/support-status";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  preview: string;
  hasUnreadForUser: boolean;
  resolvedAt?: number | string | null;
  updatedAt: number;
}
const CATEGORIES: { value: string; label: string }[] = [
  { value: "billing", label: "Billing" },
  { value: "bug", label: "Bug report" },
  { value: "feature_request", label: "Feature request" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

export default function SupportPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      if (res.status === 403) {
        setNeedsUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create ticket");
        return;
      }
      router.push(`/dashboard/support/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (needsUpgrade) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="py-12 px-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Direct support is a paid feature</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upgrade to any paid plan to open a support ticket and get a personal reply from the LinkedGrow team. Conversations happen on the ticket page, with email notifications when we answer.
            </p>
            <Link href="/dashboard/upgrade">
              <Button>
                See plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            Support
          </h1>
          <p className="text-muted-foreground mt-1">Open a ticket - we&apos;ll reply right here. You&apos;ll get an email notification when we answer.</p>
        </div>
        {!showCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New ticket
          </Button>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefly describe the issue"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Walk us through what you're seeing. Include steps to reproduce and what you expected to happen."
                  rows={8}
                  maxLength={10000}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Need to share a screenshot? Upload it for free on{" "}
                  <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">imgur.com</a>{" "}
                  and paste the link in your message.
                </p>
              </div>
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !subject.trim() || !message.trim()}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {session?.user?.email ? `Send to LinkedGrow team` : "Send"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      )}

      {!loading && tickets && tickets.length === 0 && !showCreate && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No tickets yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Open your first ticket - we&apos;ll reply right here and email you when we do.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> New ticket
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && tickets && tickets.length > 0 && (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/support/${t.id}`}>
              <Card className="hover:border-cyan-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{t.subject}</h3>
                        {t.hasUnreadForUser && (
                          <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" title="New reply" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{t.preview}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor(t)}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
