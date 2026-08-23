"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { X, ArrowDown, Loader2, RotateCcw, Smile, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmojiPicker } from "./emoji-picker";

/** The same photo as the blog author box, so the site shows one face. */
const NICOLAS_AVATAR =
  "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/nicolas-lecocq-2026.avif";

/** The pricing-page teaser: Nicolas waving, 4 seconds, looped by the player. */
const PRICING_VIDEO_URL =
  "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/videos/chatbot-teaser-nicolas.mp4";

const SUGGESTED_QUESTIONS = [
  "How do I create my first agent?",
  "What are the pricing plans?",
  "Can I book a demo?",
];

const BOOK_DEMO_QUESTION = "Can I book a demo?";
const BOOK_DEMO_ANSWER =
  "Of course, click the link below and pick the date and time that suits you best:\n\n**[Book your 15-minute demo](/book-demo)**";

// Inline support form rendered inside chat messages
function InlineSupportForm({
  messages,
  defaultName,
  defaultEmail,
  isPaidUser,
}: {
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>;
  defaultName?: string;
  defaultEmail?: string;
  isPaidUser?: boolean;
}) {
  const [name, setName] = useState(defaultName || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);

  const buildConversationSummary = (): string => {
    if (messages.length === 0) return "";
    return messages
      .map((m) => {
        let text = "";
        if (m.parts) {
          text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join(" ");
        }
        return `${m.role === "user" ? "User" : "AI"}: ${text}`;
      })
      .join("\n");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !description.trim()) return;
    setStatus("sending");

    try {
      const conversationSummary = buildConversationSummary();
      const res = await fetch("/api/chat/support-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: description.trim(),
          conversationSummary: conversationSummary || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.ticketUrl) setTicketUrl(data.ticketUrl);
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="my-1 flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
          <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Ticket sent!</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-500">
          {ticketUrl ? "We'll reply on your ticket page and email you when we answer." : <>We&apos;ll reply to <strong>{email}</strong> as soon as possible.</>}
        </p>
        {ticketUrl && (
          <a
            href={ticketUrl}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
          >
            View ticket
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="my-1 flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {isPaidUser
          ? "This message will create a support ticket on your dashboard. We'll reply by email."
          : "Fill in the fields below to create a support ticket."}
      </p>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue or question..."
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
        />
      </div>
      {status === "error" && (
        <p className="text-xs text-red-500">
          Failed to send. Please email{" "}
          <a href="mailto:contact@linkedgrow.ai" className="underline">contact@linkedgrow.ai</a>{" "}
          directly.
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !email.trim() || !description.trim() || status === "sending"}
        className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <ArrowRight className="h-3.5 w-3.5" />
            Send ticket
          </>
        )}
      </button>
    </div>
  );
}

const CHAT_STORAGE_KEY = "linkedgrow-chat";
const CHAT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes inactivity

function loadSavedChat() {
  if (typeof window === "undefined") return undefined;
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!saved) return undefined;
    const { messages: msgs, stamps, timestamp } = JSON.parse(saved);
    if (!Array.isArray(msgs) || msgs.length === 0) return undefined;
    if (timestamp && Date.now() - timestamp > CHAT_EXPIRY_MS) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return undefined;
    }
    return {
      messages: msgs,
      stamps: (stamps && typeof stamps === "object" ? stamps : {}) as Record<string, number>,
    };
  } catch {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    return undefined;
  }
}

/** 22 August, 2026 - the shape the message list groups days under. */
function dayLabelOf(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "long" })}, ${d.getFullYear()}`;
}

function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** The small face next to what the team side says. */
function TeamAvatar({ size = "h-7 w-7" }: { size?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={NICOLAS_AVATAR}
      alt="Nicolas from LinkedGrow"
      className={cn(size, "shrink-0 rounded-full object-cover")}
    />
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoDismissed, setVideoDismissed] = useState(false);
  const pathname = usePathname();

  const { messages, sendMessage, status, setMessages } = useChat();
  const [stamps, setStamps] = useState<Record<string, number>>({});
  const [sessionUser, setSessionUser] = useState<{ name?: string; email?: string; isPaid?: boolean } | null>(null);
  const restoredRef = useRef(false);

  const isLoading = status === "streaming" || status === "submitted";
  const isDashboard = pathname?.startsWith("/dashboard");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Restore messages from localStorage on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadSavedChat();
    if (saved) {
      setMessages(saved.messages);
      setStamps(saved.stamps);
    }
  }, [setMessages]);

  // Every message carries the moment it appeared, for the times in the list.
  useEffect(() => {
    const missing = messages.filter((m) => !(m.id in stamps));
    if (missing.length === 0) return;
    setStamps((prev) => {
      const next = { ...prev };
      for (const m of missing) next[m.id] = Date.now();
      return next;
    });
  }, [messages, stamps]);

  // Save messages to localStorage with timestamp
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      if (messages.length > 0) {
        localStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify({ messages, stamps, timestamp: Date.now() })
        );
      }
    } catch {}
  }, [messages, stamps]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch session user info for form pre-fill (no SessionProvider needed)
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          const u = data.user as {
            name?: string;
            email?: string;
            plan?: string;
            stripeSubscriptionId?: string | null;
            isLifetimeDeal?: boolean;
            trialEndedAt?: number | null;
          };
          // Same rule as src/lib/is-paid-user.ts - duplicated here because
          // the chat widget runs on every page (incl. marketing) and we
          // want a tiny inline check, not a heavier lib import in the
          // marketing bundle.
          const inActiveTrial =
            u.plan === "pro" &&
            !u.stripeSubscriptionId &&
            !u.isLifetimeDeal &&
            !!u.trialEndedAt &&
            u.trialEndedAt > Date.now();
          const isPaid =
            !!u.stripeSubscriptionId ||
            !!u.isLifetimeDeal ||
            (!!u.plan && u.plan !== "free" && !inActiveTrial);
          setSessionUser({ name: u.name, email: u.email, isPaid });
        }
      })
      .catch(() => {});
  }, []);

  // Listen for custom event from dashboard sidebar to open chat
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setHasInteracted(true);
    };
    window.addEventListener("open-chat-widget", handleOpenChat);
    return () => window.removeEventListener("open-chat-widget", handleOpenChat);
  }, []);

  // The pricing-page teaser: a short video of a person instead of a text
  // nudge, shortly after the page settles. Closing it keeps it closed for
  // this visit; opening the chat replaces it.
  useEffect(() => {
    if (pathname !== "/pricing" || isOpen || hasInteracted || videoDismissed) {
      setShowVideo(false);
      return;
    }
    const timer = setTimeout(() => setShowVideo(true), 1800);
    return () => clearTimeout(timer);
  }, [pathname, isOpen, hasInteracted, videoDismissed]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
    setShowVideo(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowEmoji(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setStamps({});
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {}
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
    setShowEmoji(false);
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading) return;
    if (question === BOOK_DEMO_QUESTION) {
      // No model in this loop: the answer is always the same link, and it
      // should appear instantly.
      const now = Date.now();
      const asked = { id: `local-${now}-q`, role: "user" as const, parts: [{ type: "text" as const, text: question }] };
      const answered = { id: `local-${now}-a`, role: "assistant" as const, parts: [{ type: "text" as const, text: BOOK_DEMO_ANSWER }] };
      setMessages([...messages, asked, answered] as typeof messages);
      return;
    }
    sendMessage({ text: question });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollDown(!isNearBottom && messages.length > 3);
  };

  return (
    <>
      {/* Pricing teaser video: it takes the launcher's own spot, over the
          face, and the face comes back the moment it is dismissed. Desktop
          only: under 640px it never shows. */}
      {!isDashboard && showVideo && !isOpen && (
        <div
          className="fixed bottom-5 right-5 z-[9994] hidden sm:block"
          style={{ animation: "chat-teaser-in 0.45s ease-out forwards" }}
        >
          <style>{`
            @keyframes chat-teaser-in {
              from { opacity: 0; transform: translateY(14px) scale(0.94); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div className="group relative rounded-[20px] bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px] shadow-[0_16px_44px_-16px_rgba(21,93,252,.6)] transition-transform duration-300 hover:scale-[1.05]">
            <button
              onClick={handleOpen}
              className="block h-[172px] w-[112px] cursor-pointer overflow-hidden rounded-[18px]"
              aria-label="Open chat"
            >
              <video
                src={PRICING_VIDEO_URL}
                className="h-full w-full object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
              />
            </button>
            <button
              onClick={() => setVideoDismissed(true)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/65 group-hover:opacity-100"
              aria-label="Dismiss video"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chat bubble button - marketing pages only. While the teaser video
          occupies its spot it hides on the SAME breakpoint the teaser shows
          on: under 640px the teaser never renders, so the launcher must stay,
          which is exactly what vanished on mobile pricing (2026-08-23). */}
      {!isDashboard && (
        <button
          onClick={isOpen ? handleClose : handleOpen}
          className={cn(
            "fixed bottom-5 right-5 z-[9995] block rounded-full transition-transform duration-300 hover:scale-105 active:scale-95",
            showVideo && !isOpen && "sm:hidden"
          )}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg sm:h-14 sm:w-14">
              <X className="h-5 w-5" />
            </span>
          ) : (
            <span className="relative block rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-[2.5px] shadow-[0_14px_38px_-14px_rgba(21,93,252,.65)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={NICOLAS_AVATAR}
                alt="Chat with the LinkedGrow team"
                className="h-11 w-11 rounded-full object-cover sm:h-[54px] sm:w-[54px]"
              />
              <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </span>
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {(isOpen || (!isDashboard && hasInteracted)) && (
        <div
          className={cn(
            "fixed z-[9995] flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ease-in-out dark:bg-slate-900",
            // Mobile: full screen
            "inset-0 sm:inset-auto",
            // Desktop: floating panel
            isDashboard
              ? "sm:bottom-5 sm:right-5 sm:h-[min(600px,calc(100vh-60px))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 sm:dark:border-slate-700"
              : "sm:bottom-[88px] sm:right-5 sm:h-[min(600px,calc(100vh-120px))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 sm:dark:border-slate-700",
            isOpen
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={NICOLAS_AVATAR}
                  alt="Nicolas from LinkedGrow"
                  className="h-10 w-10 rounded-full border-2 border-white/40 object-cover"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  LinkedGrow team
                </h3>
                <p className="text-xs text-white/80">Ask anything about LinkedGrow</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleNewChat}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="New chat"
                  title="New chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <ScrollArea
            className="flex-1"
            onScrollCapture={handleScroll}
          >
            <div className="flex flex-col gap-4 p-4">
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2.5">
                    <TeamAvatar />
                    <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        How can I help you?
                      </p>
                    </div>
                  </div>

                  {/* Suggested questions */}
                  <div className="flex flex-col gap-2 pl-[38px]">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-600 dark:hover:bg-cyan-950 dark:hover:text-cyan-400"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages, grouped under the day they happened */}
              {messages.map((message, index) => {
                const ts = stamps[message.id];
                const prevTs = index > 0 ? stamps[messages[index - 1].id] : undefined;
                const showDay =
                  !!ts && (!prevTs || dayLabelOf(prevTs) !== dayLabelOf(ts));
                return (
                  <div key={message.id} className="flex flex-col gap-4">
                    {showDay && (
                      <p className="text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                        {dayLabelOf(ts)}
                      </p>
                    )}
                    <div
                      className={cn(
                        "flex flex-col gap-1",
                        message.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      {/* w-full, not max-w-full: the bubble's 80% cap resolves
                          against this row, and a content-sized row shrank the
                          cap onto the text itself, wrapping 4 words on 2 lines. */}
                      <div
                        className={cn(
                          "flex w-full gap-2.5",
                          message.role === "user" && "flex-row-reverse"
                        )}
                      >
                        {message.role !== "user" && <TeamAvatar />}

                        {/* Message bubble */}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-3",
                            message.role === "user"
                              ? "rounded-tr-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                              : "rounded-tl-sm bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <div
                            className={cn(
                              "text-sm leading-relaxed",
                              message.role === "user"
                                ? "text-white"
                                : "text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {message.parts?.map((part, i) => {
                              if (part.type === "text") {
                                if (message.role === "user") {
                                  return (
                                    <p key={i} className="m-0 whitespace-pre-wrap">
                                      {part.text}
                                    </p>
                                  );
                                }
                                return (
                                  <ReactMarkdown
                                    key={i}
                                    components={{
                                      p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                      a: ({ href, children }) => (
                                        <a href={href} className="text-cyan-600 underline hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300" target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>
                                          {children}
                                        </a>
                                      ),
                                      ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
                                      ol: ({ children }) => <ol className="my-1 ml-4 list-decimal space-y-0.5">{children}</ol>,
                                      li: ({ children }) => <li className="m-0">{children}</li>,
                                      code: ({ children }) => <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700">{children}</code>,
                                      pre: ({ children }) => <pre className="my-1 overflow-x-auto rounded-lg bg-slate-200 p-2 text-xs dark:bg-slate-700">{children}</pre>,
                                    }}
                                  >
                                    {part.text}
                                  </ReactMarkdown>
                                );
                              }
                              // Tool call: render inline support form immediately
                              if (part.type === "tool-invocation" || part.type.startsWith("tool-")) {
                                return (
                                  <InlineSupportForm
                                    key={i}
                                    messages={messages}
                                    defaultName={sessionUser?.name || undefined}
                                    defaultEmail={sessionUser?.email || undefined}
                                    isPaidUser={sessionUser?.isPaid}
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>

                      {/* The moment it was sent, under the bubble like any
                          messenger, with a delivered check on ours */}
                      {!!ts && (
                        <div
                          className={cn(
                            "flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500",
                            message.role === "user" ? "pr-1" : "pl-[38px]"
                          )}
                        >
                          <span>{timeOf(ts)}</span>
                          {message.role === "user" && (
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-500">
                              <svg className="h-2 w-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator */}
              {isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-2.5">
                    <TeamAvatar />
                    <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Scroll to bottom button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-md transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
          )}

          {/* Input area */}
          <div className="relative bg-white p-3 dark:bg-slate-900">
            {showEmoji && (
              <>
                <button
                  className="fixed inset-0 z-[1] cursor-default"
                  onClick={() => setShowEmoji(false)}
                  aria-label="Close emoji picker"
                  tabIndex={-1}
                />
                <div className="absolute bottom-full left-3 right-3 z-[2] mb-1">
                  <EmojiPicker onPick={handlePickEmoji} />
                </div>
              </>
            )}
            <div className="flex flex-col rounded-2xl border border-slate-200 transition-all focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30 dark:border-slate-700 dark:focus-within:border-cyan-500">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="max-h-28 min-h-[52px] w-full resize-none rounded-t-2xl bg-transparent px-3.5 pb-2 pt-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  aria-label="Insert emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
