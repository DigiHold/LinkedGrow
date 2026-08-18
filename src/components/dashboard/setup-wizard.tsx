"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Rocket,
  Linkedin,
  Key,
  Mic,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Zap,
  PenLine,
  Target,
  DollarSign,
  Infinity,
  Loader2,
  Check,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoModal } from "@/components/dashboard/video-modal";

// ─── Provider SVG Icons ─────────────────────────────────────────────────────

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

const AnthropicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
  </svg>
);

const GeminiIcon = () => (
  <svg viewBox="0 0 65 65" className="w-5 h-5">
    <defs>
      <linearGradient id="wiz-gemini" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4893FC" />
        <stop offset=".27" stopColor="#4893FC" />
        <stop offset=".777" stopColor="#969DFF" />
        <stop offset="1" stopColor="#BD99FE" />
      </linearGradient>
    </defs>
    <path fill="url(#wiz-gemini)" d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" />
  </svg>
);

const GrokIcon = () => (
  <svg viewBox="0 0 512 492" className="w-5 h-5" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M197.76 315.52l170.197-125.803c8.342-6.186 20.267-3.776 24.256 5.803 20.907 50.539 11.563 111.253-30.08 152.939-41.621 41.685-99.562 50.816-152.512 29.994l-57.834 26.816c82.965 56.768 183.701 42.731 246.656-20.33 49.941-50.006 65.408-118.166 50.944-179.627l.128.149c-20.971-90.282 5.162-126.378 58.666-200.17 1.28-1.75 2.56-3.499 3.819-5.291l-70.421 70.507v-.214l-243.883 245.27m-35.072 30.528c-59.563-56.96-49.28-145.088 1.515-195.926 37.568-37.61 99.136-52.97 152.874-30.4l57.707-26.666a166.554 166.554 0 00-39.019-21.334 191.467 191.467 0 00-208.042 41.942c-54.038 54.101-71.04 137.301-41.856 208.298 21.802 53.056-13.931 90.582-49.92 128.47C23.104 463.915 10.304 477.333 0 491.541l162.56-145.386" />
  </svg>
);

const PerplexityIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z" />
  </svg>
);

const KimiIcon = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5" fill="currentColor">
    <path d="M415.6348,125.5545c3.7139-4.7655,6.973-9.1175,10.4152-13.3317,1.5951-1.983,1.4572-3.4875-.0906-5.5611-14.9267-19.6233-16.3406-41.4089-7.7489-63.5154,6.4492-16.636,20.7162-24.4302,38.1498-26.0923,10.8701-1.026,21.5355.0906,31.4269,5.376,12.989,6.9514,20.5548,17.5498,23.0163,32.1791,1.9594,11.6696,1.5951,23.0636-1.7093,34.3669-5.8565,20.0093-20.2378,30.3793-39.9497,33.0003-16.3643,2.1858-32.9531,2.4615-49.4532,3.5781-1.2761.0906-2.5758,0-4.0566,0h0Z" fill="#027aff" fillRule="evenodd" />
    <path d="M375.1613,35.9448h-98.5873l-78.0542,177.9866h-110.3476V36.7207H0v458.5698h88.1958v-193.187h155.5157c26.7775,0,51.2295-15.6101,62.5111-39.8808v233.0678h88.1957v-193.187c0-45.9657-35.9167-84.6177-81.7682-87.9673v-.2284h-48.4292c23.5903-8.0538,42.7687-25.5557,52.9407-48.313l57.9996-129.6499Z" fillRule="evenodd" />
  </svg>
);

// ─── Provider Data ──────────────────────────────────────────────────────────

const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-5.2, GPT-5.4 mini",
    icon: OpenAIIcon,
    placeholder: "sk-...",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    docsUrl: "/docs/byok/openai-setup",
    videoId: "tdw3icQGIv0",
    keyField: "openaiApiKey",
    modelField: "openaiModel",
    models: [
      { id: "gpt-5.4-mini", name: "GPT-5.4 mini", recommended: true, price: "~$0.008/post" },
      { id: "gpt-5.6-terra", name: "GPT-5.2", price: "~$0.03/post" },
      { id: "gpt-5.6-sol", name: "GPT-5.2", price: "~$0.06/post" },
      { id: "gpt-5.6-luna", name: "GPT-5 Nano", price: "~$0.012/post" },
      { id: "gpt-5.4", name: "GPT-5.4", price: "~$0.03/post" },
      { id: "gpt-5.4-nano", name: "GPT-5.4 nano", price: "~$0.002/post" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Sonnet, Opus",
    icon: AnthropicIcon,
    placeholder: "sk-ant-...",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    docsUrl: "/docs/byok/anthropic-setup",
    videoId: "D5Fl6ACfsis",
    keyField: "anthropicApiKey",
    modelField: "anthropicModel",
    models: [
      { id: "claude-sonnet-5", name: "Claude Sonnet 5", recommended: true, price: "~$0.03/post" },
      { id: "claude-opus-4-8", name: "Claude Opus 4.8", price: "~$0.05/post" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", price: "~$0.01/post" },
    ],
  },
  {
    id: "google",
    name: "Gemini",
    description: "Gemini 3 Flash, 3.1 Pro",
    icon: GeminiIcon,
    placeholder: "AIza...",
    apiKeyUrl: "https://aistudio.google.com/apikey",
    docsUrl: "/docs/byok/google-ai-setup",
    videoId: "srqZeIOCQ-w",
    keyField: "googleApiKey",
    modelField: "googleModel",
    models: [
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", recommended: true, price: "~$0.006/post" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3 Pro", price: "~$0.02/post" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", price: "~$0.001/post" },
    ],
  },
  {
    id: "grok",
    name: "Grok",
    description: "Grok 4, Grok 4.3",
    icon: GrokIcon,
    placeholder: "xai-...",
    apiKeyUrl: "https://console.x.ai/team/default/api-keys",
    docsUrl: "/docs/byok/grok-setup",
    videoId: "Tgw-b13tKEI",
    keyField: "grokApiKey",
    modelField: "grokModel",
    models: [
      { id: "grok-4.3", name: "Grok 4.3", recommended: true, price: "~$0.006/post" },
      { id: "grok-4.5", name: "Grok 4", price: "~$0.013/post" },
      { id: "grok-4.20-0309-reasoning", name: "Grok 4.20 Reasoning", price: "~$0.006/post" },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Sonar Pro, Research",
    icon: PerplexityIcon,
    placeholder: "pplx-...",
    apiKeyUrl: "https://www.perplexity.ai/settings/api",
    docsUrl: "/docs/byok/perplexity-setup",
    keyField: "perplexityApiKey",
    modelField: "perplexityModel",
    models: [
      { id: "sonar-pro", name: "Sonar Pro", recommended: true, price: "~$0.03/post" },
      { id: "sonar-deep-research", name: "Sonar Deep Research", price: "~$0.02/post" },
      { id: "sonar", name: "Sonar", price: "~$0.004/post" },
    ],
  },
  {
    id: "kimi",
    name: "Kimi",
    description: "K3, K2.6, K2.7 Code by Moonshot",
    icon: KimiIcon,
    placeholder: "sk-...",
    apiKeyUrl: "https://platform.kimi.ai/console/api-keys",
    docsUrl: "/docs/byok/kimi-setup",
    videoId: "jcEwghFuLeM",
    keyField: "kimiApiKey",
    modelField: "kimiModel",
    models: [
      { id: "kimi-k2.6", name: "Kimi K2.6", recommended: true, price: "~$0.008/post" },
      { id: "kimi-k3", name: "Kimi K3", price: "~$0.03/post" },
      { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", price: "~$0.008/post" },
    ],
  },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const toneOptions = [
  "Professional",
  "Casual",
  "Inspirational",
  "Witty",
  "Educational",
  "Storytelling",
  "Bold",
  "Empathetic",
];

const quickActions = [
  { title: "Generate a Post", description: "Create with AI", href: "/dashboard/generator", icon: Sparkles, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { title: "Repurpose Content", description: "URL to LinkedIn post", href: "/dashboard/repurpose", icon: Zap, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-white/5" },
  { title: "Get Ideas", description: "Browse content ideas", href: "/dashboard/ideas", icon: Target, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-white/5" },
  { title: "Write a Post", description: "Start from scratch", href: "/dashboard/editor", icon: PenLine, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-white/5" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.98,
  }),
};

const springTransition = { type: "spring" as const, stiffness: 350, damping: 32 };

// ─── Success Animation ──────────────────────────────────────────────────────

function SuccessAnimation() {
  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * 360;
    const rad = (angle * Math.PI) / 180;
    const distance = 55 + Math.random() * 30;
    const colors = ["bg-cyan-400", "bg-blue-400", "bg-green-400", "bg-emerald-400", "bg-teal-400", "bg-sky-400", "bg-indigo-400"];
    const size = 4 + Math.random() * 4;
    return { x: Math.cos(rad) * distance, y: Math.sin(rad) * distance, color: colors[i % colors.length], delay: i * 0.02, size };
  });

  return (
    <div className="relative flex items-center justify-center mb-8">
      {/* Ambient glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute w-40 h-40 rounded-full bg-green-500/15 dark:bg-green-500/10 blur-2xl"
      />

      {/* Burst particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${p.color}`}
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 0.8, delay: 0.6 + p.delay, ease: "easeOut" }}
        />
      ))}

      {/* Animated checkmark circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        className="relative w-28 h-28 rounded-full bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center shadow-lg shadow-green-500/20"
      >
        <svg viewBox="0 0 52 52" className="w-16 h-16">
          <motion.circle
            cx="26" cy="26" r="23"
            fill="none" stroke="currentColor" strokeWidth="2"
            className="text-green-300 dark:text-green-700"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.path
            d="M15 27l7 7 15-15"
            fill="none" stroke="currentColor" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-green-600 dark:text-green-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

// ─── Segmented Progress Bar ─────────────────────────────────────────────────

function SegmentedProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex-1 relative">
          <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                currentStep > s
                  ? "bg-linear-to-r from-cyan-500 to-blue-600"
                  : currentStep === s
                  ? "bg-linear-to-r from-cyan-500 to-blue-600"
                  : ""
              )}
              initial={{ width: "0%" }}
              animate={{ width: currentStep >= s ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [linkedinName, setLinkedinName] = useState("");

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [aiSaved, setAiSaved] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [writingTone, setWritingTone] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const allowed = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      if (event.origin !== allowed) return;
      if (event.data?.type === "linkedin-success") {
        setLinkedinConnected(true);
        setLinkedinName(event.data.name || "");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      const provider = aiProviders.find((p) => p.id === selectedProvider);
      const recommended = provider?.models.find((m) => m.recommended);
      setSelectedModel(recommended?.id || provider?.models[0]?.id || "");
      setApiKey("");
      setShowApiKey(false);
      setAiSaved(false);
    }
  }, [selectedProvider]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (data.linkedinConnected) {
          setLinkedinConnected(true);
          setLinkedinName(data.linkedinProfileName || "");
        }
        if (data.businessName) setBusinessName(data.businessName);
        if (data.businessDescription) setBusinessDescription(data.businessDescription);
        if (data.businessNiche) setBusinessNiche(data.businessNiche);
        if (data.targetAudience) setTargetAudience(data.targetAudience);
        if (data.writingTone) setWritingTone(data.writingTone);
        if (data.aiProvider && data.hasApiKey) {
          setSelectedProvider(data.aiProvider);
          setAiSaved(true);
        }
      } catch {
        // Silently fail
      }
    };
    fetchSettings();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────

  const saveAISettings = async (): Promise<boolean> => {
    if (!selectedProvider || !apiKey) return true;
    const provider = aiProviders.find((p) => p.id === selectedProvider);
    if (!provider) return true;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: selectedProvider,
          [provider.keyField]: apiKey,
          [provider.modelField]: selectedModel,
        }),
      });
      if (!res.ok) throw new Error();
      setAiSaved(true);
      return true;
    } catch {
      setError("Failed to save. You can always set this up later in Settings.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveVoiceSettings = async (): Promise<boolean> => {
    const hasData = businessName || businessDescription || businessNiche || targetAudience || writingTone;
    if (!hasData) return true;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || null,
          businessDescription: businessDescription || null,
          businessNiche: businessNiche || null,
          targetAudience: targetAudience || null,
          writingTone: writingTone || null,
        }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      setError("Failed to save. You can always set this up later in Settings.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = useCallback(async () => {
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
    } catch { /* worst case wizard shows once more */ }
    onComplete();
  }, [onComplete]);

  const goNext = () => { setDirection(1); setStep((s) => s + 1); setError(null); };
  const goBack = () => { setDirection(-1); setStep((s) => s - 1); setError(null); };

  const handleContinue = async () => {
    if (step === 2 && selectedProvider && apiKey.length > 5 && !aiSaved) {
      const ok = await saveAISettings();
      if (ok) goNext();
    } else if (step === 3) {
      const ok = await saveVoiceSettings();
      if (ok) goNext();
    } else {
      goNext();
    }
  };

  const currentProvider = selectedProvider ? aiProviders.find((p) => p.id === selectedProvider) : null;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleComplete(); }}>
      <DialogContent
        className="max-w-2xl w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden rounded-2xl border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-900/10 dark:shadow-black/50"
        overlayClassName="bg-black/50 backdrop-blur-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">LinkedGrow Setup Wizard</DialogTitle>

        {/* Ambient gradient glow behind card (visible through semi-transparent overlay) */}
        <div className="absolute -inset-px rounded-2xl bg-linear-to-br from-cyan-500/10 via-transparent to-blue-500/10 dark:from-cyan-500/5 dark:to-blue-500/5 pointer-events-none" />

        <div className="relative flex flex-col max-h-[85vh]">
          {/* Segmented progress bar - steps 1-3 */}
          {step >= 1 && step <= 3 && (
            <div className="px-8 pt-6 pb-1">
              <SegmentedProgress currentStep={step} />
              <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase mt-3">
                Step {step} of 3
              </p>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 sm:py-8 min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
              >
                {/* ── Step 0: Welcome ────────────────────────────────── */}
                {step === 0 && (
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="relative w-24 h-24 mx-auto mb-8"
                    >
                      {/* Ambient glow */}
                      <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 blur-xl opacity-40" />
                      <div className="relative w-24 h-24 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
                        <Rocket className="w-12 h-12 text-white" />
                      </div>
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
                    >
                      Welcome to{" "}
                      <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                        LinkedGrow
                      </span>
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed"
                    >
                      Let&apos;s get everything ready in about 2 minutes so your agent can start finding your leads.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-8"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Takes about 2 minutes</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        size="lg"
                        onClick={goNext}
                        className="px-10 h-12 text-base shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300"
                      >
                        Get Started
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>

                      <div className="mt-5">
                        <button
                          onClick={handleComplete}
                          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                        >
                          I&apos;ll set up later
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* ── Step 1: LinkedIn ────────────────────────────────── */}
                {step === 1 && (
                  <div className="text-center">
                    <div className="relative w-18 h-18 mx-auto mb-5">
                      <div className="absolute inset-0 rounded-xl bg-[#0A66C2]/20 blur-lg" />
                      <div className="relative w-18 h-18 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
                        <Linkedin className="w-9 h-9 text-[#0A66C2]" />
                      </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                      Connect{" "}
                      <span className="text-[#0A66C2]">LinkedIn</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                      We request permissions to publish, schedule, and engage with content on your behalf so LinkedGrow can work at its full potential. Your data stays private and secure.
                    </p>

                    {linkedinConnected ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-sm mx-auto"
                      >
                        <div className="p-6 rounded-2xl bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/80 dark:border-green-800/60 shadow-sm">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                            className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3"
                          >
                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                          </motion.div>
                          <p className="font-semibold text-green-700 dark:text-green-300 text-lg">Connected!</p>
                          {linkedinName && (
                            <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">{linkedinName}</p>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="max-w-sm mx-auto">
                        {/* An OAuth popup used to open here, and the line under
                            it promised we never store the password. Neither is
                            true any more: v2 signs a real browser session in on
                            the customer's behalf, so the connection form lives
                            in settings and the promise had to be corrected. */}
                        <Link href="/dashboard/settings?tab=linkedin">
                          <Button
                            size="lg"
                            className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white mb-5 h-12 text-base shadow-lg shadow-[#0A66C2]/20 hover:shadow-xl hover:shadow-[#0A66C2]/30 transition-all duration-300"
                          >
                            <Linkedin className="w-5 h-5 mr-2" />
                            Connect your LinkedIn account
                          </Button>
                        </Link>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-left">
                          <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            You sign in with your LinkedIn email and password. They are encrypted
                            before they are stored and used only to keep your own session signed
                            in, on an address reserved for your account.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step 2: AI Setup ────────────────────────────────── */}
                {step === 2 && (
                  <div>
                    <div className="text-center mb-6">
                      <div className="relative w-18 h-18 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-lg" />
                        <div className="relative w-18 h-18 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Key className="w-9 h-9 text-amber-600 dark:text-amber-400" />
                        </div>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                        Set Up Your{" "}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">AI</span>
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                        Connect your own AI provider for unlimited content generation. You pay the provider directly - typically $2-4/month.
                      </p>
                    </div>

                    {/* BYOK benefits */}
                    <div className="grid grid-cols-3 gap-2.5 mb-6">
                      {[
                        { icon: Infinity, text: "Unlimited posts", color: "text-green-600 dark:text-green-400" },
                        { icon: DollarSign, text: "~$0.01-0.03/post", color: "text-emerald-600 dark:text-emerald-400" },
                        { icon: Sparkles, text: "Choose your model", color: "text-cyan-600 dark:text-cyan-400" },
                      ].map((b, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                          <b.icon className={`w-4 h-4 ${b.color}`} />
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{b.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Provider cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
                      {aiProviders.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => setSelectedProvider(provider.id)}
                          className={cn(
                            "p-3.5 rounded-xl border text-left transition-all duration-200 relative group",
                            selectedProvider === provider.id
                              ? "border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 shadow-sm shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                              : "border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 hover:-translate-y-0.5 hover:shadow-md"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-all duration-200",
                            selectedProvider === provider.id
                              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                          )}>
                            <provider.icon />
                          </div>
                          <p className="font-semibold text-sm">{provider.name}</p>
                        </button>
                      ))}
                    </div>

                    {/* API key + model when provider selected */}
                    {currentProvider && !aiSaved && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Fade-out divider */}
                        <div className="h-px bg-linear-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />

                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">API Key</label>
                          <div className="relative">
                            <Input
                              type={showApiKey ? "text" : "password"}
                              placeholder={currentProvider.placeholder}
                              value={apiKey}
                              onChange={(e) => { setApiKey(e.target.value); setError(null); }}
                              className="pr-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Model</label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                              {currentProvider.models.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  <span className="flex items-center gap-2">
                                    {model.name}
                                    <span className="text-xs text-slate-400">{model.price}</span>
                                    {model.recommended && (
                                      <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded-full font-medium">
                                        Recommended
                                      </span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1">
                          <a
                            href={currentProvider.apiKeyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 transition-colors"
                          >
                            Get your API key <ExternalLink className="w-3 h-3" />
                          </a>
                          {currentProvider.videoId && (
                            <>
                              <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                              <VideoModal
                                videoId={currentProvider.videoId}
                                triggerClassName="text-xs text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 transition-colors"
                              />
                            </>
                          )}
                          <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                          <Link
                            href={currentProvider.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 transition-colors"
                          >
                            Setup guide <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>

                        <p className="text-[11px] text-slate-400 text-center">
                          Your API key is encrypted and stored securely. You pay {currentProvider.name} directly.
                        </p>
                      </motion.div>
                    )}

                    {/* AI saved success */}
                    {aiSaved && currentProvider && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 rounded-2xl bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/80 dark:border-green-800/60 text-center shadow-sm"
                      >
                        <CheckCircle2 className="w-7 h-7 text-green-600 mx-auto mb-2" />
                        <p className="font-semibold text-green-700 dark:text-green-300">
                          {currentProvider.name} connected!
                        </p>
                        <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
                          Model: {currentProvider.models.find((m) => m.id === selectedModel)?.name || selectedModel}
                        </p>
                      </motion.div>
                    )}

                    {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
                  </div>
                )}

                {/* ── Step 3: Voice & Profile ─────────────────────────── */}
                {step === 3 && (
                  <div>
                    <div className="text-center mb-6">
                      <div className="relative w-18 h-18 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-lg" />
                        <div className="relative w-18 h-18 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                          <Mic className="w-9 h-9 text-cyan-600 dark:text-cyan-400" />
                        </div>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                        Your{" "}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">Voice</span>
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                        Help the AI create content that sounds like you, not a robot. The more details, the better.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Your name or brand</label>
                        <Input
                          placeholder="e.g., John Doe or Acme Inc"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">What do you do?</label>
                        <Textarea
                          placeholder="e.g., I help startups grow through content marketing and personal branding on LinkedIn..."
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                          className="min-h-[80px] resize-none bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Industry / Niche</label>
                          <Input
                            placeholder="e.g., SaaS, Marketing"
                            value={businessNiche}
                            onChange={(e) => setBusinessNiche(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Target audience</label>
                          <Input
                            placeholder="e.g., Founders, CTOs"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Writing tone</label>
                        <div className="flex flex-wrap gap-2">
                          {toneOptions.map((tone) => (
                            <button
                              key={tone}
                              onClick={() => setWritingTone(writingTone === tone ? "" : tone)}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                                writingTone === tone
                                  ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-sm shadow-cyan-500/25"
                                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                              )}
                            >
                              {tone}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
                  </div>
                )}

                {/* ── Step 4: Completion ──────────────────────────────── */}
                {step === 4 && (
                  <div className="text-center py-4">
                    <SuccessAnimation />

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                        You&apos;re{" "}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                          All Set!
                        </span>
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                        Your account is ready. Start creating content that grows your LinkedIn presence.
                      </p>
                    </motion.div>

                    {/* Setup summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="flex items-center justify-center gap-5 mb-8"
                    >
                      {[
                        { icon: Linkedin, label: "LinkedIn", done: linkedinConnected },
                        { icon: Key, label: "AI Provider", done: aiSaved },
                        { icon: Mic, label: "Voice", done: !!(businessName || businessDescription) },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                            item.done
                              ? "bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-sm shadow-green-500/10"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            <item.icon className={cn(
                              "w-5 h-5",
                              item.done ? "text-green-600 dark:text-green-400" : "text-slate-400"
                            )} />
                          </div>
                          <span className={cn(
                            "text-[11px] font-medium",
                            item.done ? "text-green-600 dark:text-green-400" : "text-slate-400"
                          )}>
                            {item.done ? "Done" : "Skipped"}
                          </span>
                        </div>
                      ))}
                    </motion.div>

                    {/* Quick actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">What would you like to do first?</p>
                      <div className="grid grid-cols-2 gap-2.5 mb-6">
                        {quickActions.map((action, i) => (
                          <Link key={i} href={action.href} onClick={handleComplete}>
                            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left group cursor-pointer bg-white dark:bg-slate-800/50">
                              <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-200`}>
                                <action.icon className={`w-4 h-4 ${action.color}`} />
                              </div>
                              <p className="text-sm font-semibold">{action.title}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{action.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <Button
                        onClick={handleComplete}
                        className="h-11 px-8 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300"
                      >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer - steps 1-3 */}
          {step >= 1 && step <= 3 && (
            <>
              {/* Fade-out divider */}
              <div className="h-px bg-linear-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <div className="px-6 sm:px-10 py-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={step === 1 ? () => { setDirection(-1); setStep(0); } : goBack}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                <button
                  onClick={goNext}
                  className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  Skip for now
                </button>

                <Button
                  size="sm"
                  onClick={handleContinue}
                  disabled={isSaving || (step === 2 && !aiSaved && (selectedProvider === null || apiKey.length <= 5))}
                  className="min-w-[110px] shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {step === 3 ? "Finish" : "Continue"}
                  {!isSaving && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
