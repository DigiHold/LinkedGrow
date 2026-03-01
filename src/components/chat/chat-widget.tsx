"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, ArrowDown, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUGGESTED_QUESTIONS = [
  "How do I create my first post?",
  "What is BYOK and how does it work?",
  "How to connect my LinkedIn account?",
  "What are the pricing plans?",
];

const PRICING_NUDGE_MESSAGES = [
  "Questions about our plans? Let's chat!",
  "Need help choosing a plan? I'm here!",
  "Any questions before signing up?",
];

// Inline support form rendered inside chat messages
function InlineSupportForm({ messages }: { messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

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
          We&apos;ll reply to <strong>{email}</strong> as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <div className="my-1 flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue or question..."
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
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
            <Send className="h-3.5 w-3.5" />
            Send ticket
          </>
        )}
      </button>
    </div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "streaming" || status === "submitted";
  const isDashboard = pathname?.startsWith("/dashboard");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

  // Listen for custom event from dashboard sidebar to open chat
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setHasInteracted(true);
    };
    window.addEventListener("open-chat-widget", handleOpenChat);
    return () => window.removeEventListener("open-chat-widget", handleOpenChat);
  }, []);

  // Pricing page nudge notification
  useEffect(() => {
    if (pathname !== "/pricing" || isOpen || hasInteracted) {
      setNudgeMessage(null);
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      return;
    }

    nudgeTimerRef.current = setTimeout(() => {
      const msg = PRICING_NUDGE_MESSAGES[Math.floor(Math.random() * PRICING_NUDGE_MESSAGES.length)];
      setNudgeMessage(msg);

      // Play a subtle notification sound (two-tone chime)
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();

        const playTone = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.06, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        // Two-note chime like Intercom
        playTone(880, ctx.currentTime, 0.15);
        playTone(1175, ctx.currentTime + 0.12, 0.2);
      } catch {
        // Audio not supported or blocked, ignore
      }

      // Auto-dismiss after 8 seconds
      setTimeout(() => setNudgeMessage(null), 8000);
    }, 25000);

    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, [pathname, isOpen, hasInteracted]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
    setNudgeMessage(null);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading) return;
    sendMessage({ text: question });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollDown(!isNearBottom && messages.length > 3);
  };

  return (
    <>
      {/* Nudge notification bubble - marketing pages only */}
      {!isDashboard && nudgeMessage && !isOpen && (
        <div
          className="fixed bottom-[52px] right-5 z-[9995] sm:bottom-[72px]"
          style={{ animation: "chat-nudge-in 0.4s ease-out forwards" }}
        >
          <style>{`
            @keyframes chat-nudge-in {
              from { opacity: 0; transform: translateY(8px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <button
            onClick={handleOpen}
            className="flex items-center gap-2 rounded-2xl rounded-br-sm bg-white px-4 py-3 shadow-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:shadow-xl transition-shadow max-w-[260px]"
          >
            <Bot className="h-5 w-5 shrink-0 text-cyan-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300 text-left">{nudgeMessage}</span>
          </button>
          <button
            onClick={() => setNudgeMessage(null)}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Chat bubble button - marketing pages only */}
      {!isDashboard && (
        <button
          onClick={isOpen ? handleClose : handleOpen}
          className={cn(
            "fixed bottom-5 right-5 z-[9995] flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95",
            "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
            "h-8 w-8 sm:h-12 sm:w-12"
          )}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
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
              : "sm:bottom-[72px] sm:right-5 sm:h-[min(600px,calc(100vh-120px))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 sm:dark:border-slate-700",
            isOpen
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  LinkedGrow AI
                </h3>
                <p className="text-xs text-white/80">Ask anything about LinkedGrow</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
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
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Hi! I&apos;m LinkedGrow&apos;s AI assistant. I can help you
                        with anything about LinkedGrow - from getting started
                        to setting up your AI API keys. What can I help you
                        with?
                      </p>
                    </div>
                  </div>

                  {/* Suggested questions */}
                  <div className="flex flex-col gap-2 pl-11">
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

              {/* Chat messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      message.role === "user"
                        ? "bg-slate-200 dark:bg-slate-700"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

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
                          return <InlineSupportForm key={i} messages={messages} />;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
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
              className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-md transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
          )}

          {/* Input area */}
          <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
              AI assistant can make mistakes. For urgent help, visit our{" "}
              <a
                href="/help"
                className="text-cyan-500 hover:underline"
              >
                Help Center
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
