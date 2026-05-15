"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Send, AlertCircle, CheckCircle, Star, X, MessageCircle } from "lucide-react";

function MessageAvatar({ name, email, image, isAdmin }: { name?: string | null; email?: string | null; image?: string | null; isAdmin?: boolean }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name || email || "User"}
        width={36}
        height={36}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }
  const initials = (name || email || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold ${
        isAdmin ? "bg-linear-to-br from-cyan-500 to-blue-600" : "bg-linear-to-br from-slate-400 to-slate-500"
      }`}
    >
      {initials}
    </div>
  );
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: string;
  source: string;
  userId: string;
  reviewRequestSentAt?: number | null;
  createdAt: number;
}
interface Message {
  id: string;
  isAdmin: boolean;
  isSystem: boolean;
  body: string;
  createdAt: number;
  senderName?: string | null;
  senderEmail?: string | null;
  senderImage?: string | null;
}

const STATUS_COLORS: Record<Ticket["status"], string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  closed: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send reply");
        return;
      }
      setReply("");
      fetchTicket();
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (template: "review" | "thankyou" | "silent") => {
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      if (res.ok) {
        setShowCloseModal(false);
        fetchTicket();
      }
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="font-semibold mb-2">Ticket not found</h3>
            <Button variant="outline" onClick={() => router.push("/dashboard/admin/support")}>Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";
  // After a user marks resolved, admin can still close with one of two
  // auto-templates. Review-only is hidden after sending once (one ask per
  // ticket). Thank-you stays available so admin always has a no-write close.
  const isResolvedNotClosed = ticket.status === "resolved";
  const canSendReview = isResolvedNotClosed && !ticket.reviewRequestSentAt;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/admin/support")}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> All tickets
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-2">{ticket.subject}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status.replace("_", " ")}
              </span>
              <span>·</span>
              <span>{ticket.category}</span>
              <span>·</span>
              <span>via {ticket.source}</span>
              <span>·</span>
              <span>Opened {formatDate(ticket.createdAt)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isClosed && (
              <Button variant="outline" size="sm" onClick={() => setShowCloseModal(true)}>
                <CheckCircle className="w-4 h-4 mr-2" /> Resolve & close
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.isSystem
                ? "rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300"
                : m.isAdmin
                  ? "rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/20 p-4"
                  : "rounded-xl border border-border bg-white dark:bg-gray-900 p-4"
            }
          >
            {m.isSystem ? (
              <>
                <div className="flex items-center gap-2 mb-1.5 font-medium">
                  <MessageCircle className="w-4 h-4" /> System
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</div>
              </>
            ) : (
              <div className="flex gap-3">
                <MessageAvatar
                  name={m.senderName}
                  email={m.senderEmail}
                  image={m.senderImage}
                  isAdmin={m.isAdmin}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-medium text-sm">
                      {m.senderName || m.senderEmail || (m.isAdmin ? "Support" : "User")}
                    </span>
                    {m.isAdmin && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-600 text-white tracking-wide">
                        SUPPORT
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!isClosed && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleReply} className="space-y-3">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply to the user..."
                rows={5}
                maxLength={10000}
              />
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  {isResolvedNotClosed && (
                    <>
                      {canSendReview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleClose("review")}
                          disabled={closing}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        >
                          <Star className="w-4 h-4 mr-2" /> Send review request
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleClose("thankyou")}
                        disabled={closing}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Send thank-you & close
                      </Button>
                    </>
                  )}
                </div>
                <Button type="submit" disabled={sending || !reply.trim()} className="ml-auto">
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send reply
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isClosed && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            This ticket is closed. The user can reopen it by replying.
          </CardContent>
        </Card>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button onClick={() => setShowCloseModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" disabled={closing}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-2">Close this ticket</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick a closing template - we&apos;ll insert a system message in the thread and email the user. Need to write something custom? Cancel and use the reply box instead.</p>
            <div className="space-y-3">
              <button
                onClick={() => handleClose("review")}
                disabled={closing}
                className="w-full text-left rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-4 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  <Star className="w-5 h-5 fill-current" /> Send review request
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Closes the ticket and emails the user the Google / Trustpilot / G2 review cards.</p>
              </button>
              <button
                onClick={() => handleClose("thankyou")}
                disabled={closing}
                className="w-full text-left rounded-xl border border-border p-4 hover:bg-accent transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle className="w-5 h-5 text-cyan-600" /> Send thank-you &amp; close
                </div>
                <p className="text-sm text-muted-foreground">Friendly thank-you email + invites them to open another ticket anytime.</p>
              </button>
            </div>
            {closing && (
              <div className="flex justify-center mt-4">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
