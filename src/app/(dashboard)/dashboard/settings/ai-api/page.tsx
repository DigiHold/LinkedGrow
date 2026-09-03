"use client";

import { useState, useEffect } from "react";
import { PageShell } from "@/components/dashboard/ui/page";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Key,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessFeature, PlanId, UPGRADE_PATH } from "@/lib/plans";
import { ImageIcon, Sparkles, Crown, ExternalLink, HelpCircle } from "lucide-react";
import Link from "next/link";
import { VideoModal } from "@/components/dashboard/video-modal";

import {
  OpenAIIcon,
  AnthropicIcon,
  GeminiIcon,
  GrokIcon,
  PerplexityIcon,
  KimiIcon,
  ReplicateIcon,
} from "@/components/dashboard/provider-icons";

const providerHelpUrls: Record<string, string> = {
  openai: "/docs/byok/openai-setup",
  anthropic: "/docs/byok/anthropic-setup",
  google: "/docs/byok/google-ai-setup",
  grok: "/docs/byok/grok-setup",
  perplexity: "/docs/byok/perplexity-setup",
  kimi: "/docs/byok/kimi-setup",
};

const providerVideoIds: Record<string, string> = {
  openai: "tdw3icQGIv0",
  anthropic: "D5Fl6ACfsis",
  google: "srqZeIOCQ-w",
  grok: "Tgw-b13tKEI",
  kimi: "jcEwghFuLeM",
};

const imageProviderVideoIds: Record<string, string> = {
  google: "MAZB_3ci8RA",
  openai: "sM0hUjVR4gg",
  replicate: "sNTjyC0NjhE",
};

const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-5.6 Sol, Terra, Luna, GPT-5.5, GPT-5.4",
    placeholder: "sk-...",
    icon: OpenAIIcon,
    apiKeyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", tag: "Most Capable", price: "$0.04/post", monthly: "~$1.20/mo" },
      { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", tag: "Recommended", price: "$0.02/post", monthly: "~$0.66/mo" },
      { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", tag: "Fastest", price: "$0.002/post", monthly: "~$0.07/mo" },
      { id: "gpt-5.5", name: "GPT-5.5", tag: "Previous Generation", price: "$0.06/post", monthly: "~$1.80/mo" },
      { id: "gpt-5.4", name: "GPT-5.4", tag: "Previous Generation", price: "$0.03/post", monthly: "~$0.90/mo" },
      { id: "gpt-5.4-mini", name: "GPT-5.4 mini", tag: "Previous Generation", price: "$0.008/post", monthly: "~$0.25/mo" },
      { id: "gpt-5.4-nano", name: "GPT-5.4 nano", tag: "Previous Generation", price: "$0.002/post", monthly: "~$0.07/mo" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Fable 5.1, Opus 5, Sonnet 5, Haiku 4.5",
    placeholder: "sk-ant-...",
    icon: AnthropicIcon,
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-fable-5-1", name: "Claude Fable 5.1", tag: "Most Capable", price: "$0.10/post", monthly: "~$3.00/mo" },
      { id: "claude-opus-5", name: "Claude Opus 5", tag: "Recommended", price: "$0.05/post", monthly: "~$1.50/mo" },
      { id: "claude-sonnet-5", name: "Claude Sonnet 5", tag: "Best Value", price: "$0.02/post", monthly: "~$0.60/mo" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", tag: "Fastest", price: "$0.01/post", monthly: "~$0.30/mo" },
      { id: "claude-opus-4-8", name: "Claude Opus 4.8", tag: "Legacy", price: "$0.05/post", monthly: "~$1.50/mo" },
      { id: "claude-fable-5", name: "Claude Fable 5", tag: "Legacy", price: "$0.10/post", monthly: "~$3.00/mo" },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", tag: "Legacy", price: "$0.03/post", monthly: "~$0.90/mo" },
    ],
  },
  {
    id: "google",
    name: "Gemini",
    description: "Gemini 3.7 Flash, 3.5 Flash, 3.1 Pro, 2.5 Pro",
    placeholder: "AIza...",
    icon: GeminiIcon,
    apiKeyUrl: "https://aistudio.google.com/apikey",
    models: [
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", tag: "Recommended", price: "$0.007/post", monthly: "~$0.21/mo" },
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", tag: "Balanced", price: "$0.007/post", monthly: "~$0.21/mo" },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", tag: "Powerful", price: "$0.017/post", monthly: "~$0.50/mo" },
      { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", tag: "Faster", price: "$0.004/post", monthly: "~$0.12/mo" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", tag: "Most Capable", price: "$0.02/post", monthly: "~$0.66/mo" },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", tag: "Fastest", price: "$0.003/post", monthly: "~$0.09/mo" },
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", tag: "Previous Generation", price: "$0.006/post", monthly: "~$0.18/mo" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Previous Generation", price: "$0.018/post", monthly: "~$0.53/mo" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Previous Generation", price: "$0.004/post", monthly: "~$0.12/mo" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", tag: "Cheapest", price: "$0.001/post", monthly: "~$0.03/mo" },
    ],
  },
  {
    id: "grok",
    name: "Grok",
    description: "Grok 4.6, Grok 4.5, Grok 4.3, Grok 4.20",
    placeholder: "xai-...",
    icon: GrokIcon,
    apiKeyUrl: "https://console.x.ai/team/default/api-keys",
    models: [
      { id: "grok-4.6", name: "Grok 4.6", tag: "Recommended", price: "$0.013/post", monthly: "~$0.39/mo" },
      { id: "grok-4.5", name: "Grok 4.5", tag: "Powerful", price: "$0.013/post", monthly: "~$0.39/mo" },
      { id: "grok-4.3", name: "Grok 4.3", tag: "Fastest", price: "$0.006/post", monthly: "~$0.19/mo" },
      { id: "grok-4.20-0309-reasoning", name: "Grok 4.20 Reasoning", tag: "Reasoning", price: "$0.006/post", monthly: "~$0.19/mo" },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Sonar Pro, Sonar Reasoning Pro, Sonar",
    placeholder: "pplx-...",
    icon: PerplexityIcon,
    apiKeyUrl: "https://www.perplexity.ai/settings/api",
    models: [
      { id: "sonar-deep-research", name: "Sonar Deep Research", tag: "Best Research", price: "$0.02/post", monthly: "~$0.60/mo" },
      { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro", tag: "Deep Reasoning", price: "$0.02/post", monthly: "~$0.60/mo" },
      { id: "sonar-pro", name: "Sonar Pro", tag: "Recommended", price: "$0.03/post", monthly: "~$0.90/mo" },
      { id: "sonar", name: "Sonar", tag: "Fastest", price: "$0.004/post", monthly: "~$0.11/mo" },
    ],
  },
  {
    id: "kimi",
    name: "Kimi",
    description: "Kimi K3, K2.7 Code, K2.6 by Moonshot AI",
    placeholder: "sk-...",
    icon: KimiIcon,
    apiKeyUrl: "https://platform.kimi.ai/console/api-keys",
    models: [
      { id: "kimi-k3", name: "Kimi K3", tag: "Most Capable", price: "$0.03/post", monthly: "~$0.90/mo" },
      { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", tag: "Coding", price: "$0.008/post", monthly: "~$0.24/mo" },
      { id: "kimi-k2.6", name: "Kimi K2.6", tag: "Recommended", price: "$0.008/post", monthly: "~$0.24/mo" },
    ],
  },
];

// Resolution options for different providers/models
const resolutionOptions = {
  google: [
    { id: "1K", name: "1K (~1376x768)", price: "$0.13" },
    { id: "2K", name: "2K (~2752x1536)", price: "$0.13" },
    { id: "4K", name: "4K (~4096x2304)", price: "$0.24" },
  ],
  openai: [
    { id: "1024x1024", name: "Square (1024x1024)", price: "$0.02-0.17" },
    { id: "1792x1024", name: "Landscape (1792x1024)", price: "$0.04-0.19" },
    { id: "1024x1792", name: "Portrait (1024x1792)", price: "$0.04-0.19" },
  ],
  replicate: [
    { id: "1024x1024", name: "Square (1024x1024)", price: "$0.012-0.06" },
    { id: "1536x1024", name: "Landscape (1536x1024)", price: "$0.02-0.09" },
    { id: "1024x1536", name: "Portrait (1024x1536)", price: "$0.02-0.09" },
    { id: "2048x2048", name: "4MP Square (2048x2048)", price: "$0.05-0.24" },
  ],
};

// Aspect ratio options for different providers
const aspectRatioOptions = {
  google: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
  replicate: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
};

// Quality options for OpenAI
const qualityOptions = {
  openai: [
    { id: "high", name: "High Quality", description: "Best quality, slower" },
    { id: "medium", name: "Medium Quality", description: "Balanced" },
    { id: "low", name: "Low Quality", description: "Fastest" },
  ],
};

const imageProviders = [
  {
    id: "google",
    name: "Google AI",
    description: "Nano Banana Pro, Nano Banana 2, Nano Banana 2 Lite",
    placeholder: "AIza...",
    icon: GeminiIcon,
    apiKeyUrl: "https://aistudio.google.com/apikey",
    note: "Nano Banana Pro (Gemini 3 Pro Image) - state-of-the-art image generation up to 4K",
    price: "$0.03-0.24/image",
    monthly: "~$0.90-7.20/mo (30 images)",
    hasResolution: true,
    hasAspectRatio: true,
    models: [
      { id: "gemini-3-pro-image", name: "Nano Banana Pro", tag: "Best Quality ($0.13-0.24)" },
      { id: "gemini-3.1-flash-image", name: "Nano Banana 2", tag: "Balanced ($0.07-0.15)" },
      { id: "gemini-3.1-flash-lite-image", name: "Nano Banana 2 Lite", tag: "Cheapest ($0.03)" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT Image 2, GPT Image 1.5, GPT Image 1",
    placeholder: "sk-...",
    icon: OpenAIIcon,
    apiKeyUrl: "https://platform.openai.com/api-keys",
    note: "GPT Image models with transparency support and base64 output",
    price: "$0.006-0.21/image",
    monthly: "~$0.18-6.30/mo (30 images)",
    hasResolution: true,
    hasQuality: true,
    models: [
      { id: "gpt-image-2", name: "GPT Image 2", tag: "Recommended" },
      { id: "gpt-image-1.5", name: "GPT Image 1.5", tag: "Legacy" },
      { id: "gpt-image-1", name: "GPT Image 1", tag: "Legacy" },
      { id: "gpt-image-1-mini", name: "GPT Image 1 Mini", tag: "Legacy" },
    ],
  },
  {
    id: "replicate",
    name: "Replicate",
    description: "FLUX.2 Max, FLUX.2 Pro, FLUX Schnell",
    placeholder: "r8_...",
    icon: ReplicateIcon,
    apiKeyUrl: "https://replicate.com/account/api-tokens",
    note: "FLUX - best open-source image generation with fine-tuning support",
    price: "$0.003-0.06/image",
    monthly: "~$0.09-1.80/mo (30 images)",
    hasResolution: true,
    hasAspectRatio: true,
    hasGuidanceScale: true,
    models: [
      { id: "flux-2-max", name: "FLUX.2 Max", tag: "Highest Fidelity" },
      { id: "flux-2-pro", name: "FLUX.2 Pro", tag: "Best Quality + 8 refs" },
      { id: "flux-2-flex", name: "FLUX.2 Flex", tag: "Typography + 10 refs" },
      { id: "flux-2-dev", name: "FLUX.2 Dev", tag: "Standard + refs" },
      { id: "flux-2-klein-4b", name: "FLUX.2 Klein 4B", tag: "Sub-second" },
      { id: "flux-1.1-pro-ultra", name: "FLUX 1.1 Pro Ultra", tag: "4MP ($0.06)" },
      { id: "flux-schnell", name: "FLUX Schnell", tag: "Fastest ($0.003)" },
    ],
  },
];

// Per-provider settings types
interface TextProviderSettings {
  hasKey: boolean;
  model: string | null;
}

interface ImageProviderSettings {
  hasKey: boolean;
  model: string | null;
  resolution: string | null;
  aspectRatio: string | null;
  quality: string | null;
}

// Turn a failed response into a message that says WHAT went wrong, not just "failed".
// `action` is a short verb phrase, e.g. "save your API key".
async function describeResponseError(response: Response, action: string): Promise<string> {
  if (response.status === 401) {
    return "Your session expired. Sign out, sign back in, then try again.";
  }
  let serverError = "";
  try {
    const data = await response.json();
    if (data?.error) serverError = String(data.error);
  } catch {
    // No JSON body to read.
  }
  if (response.status === 429) {
    return `Too many requests. Wait a moment, then try to ${action} again.`;
  }
  const detail = serverError || `server error ${response.status}`;
  return `Could not ${action} (${detail}). Please try again.`;
}

// Network-level failure (request never reached the server): connection, ad blocker, extension, etc.
function describeNetworkError(action: string): string {
  return `Could not reach the server to ${action}. Check your connection, or disable ad blockers and browser extensions for this site, then try again.`;
}

export default function AIAPISettingsPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasImageAccess = true;
  const isTeamMember = session?.user?.isTeamMember === true;

  // Team members cannot access this page - they use owner's API keys
  if (isTeamMember) {
    return (
      <PageShell>
        <Card >
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Key className="w-10 h-10 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Access restricted</h3>
              <p className="text-slate-500 dark:text-slate-400">
                As a team member, you use the AI API keys configured by the team owner.
                Contact the team owner if you need changes to the AI settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // Text AI API state
  const [activeProvider, setActiveProvider] = useState("openai"); // The provider used for generation
  const [viewingProvider, setViewingProvider] = useState("openai"); // The provider being configured
  const [selectedModel, setSelectedModel] = useState("gpt-5");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  // Per-provider settings: { openai: { hasKey: true, model: "gpt-5" }, ... }
  const [textProviderSettings, setTextProviderSettings] = useState<Record<string, TextProviderSettings>>({});
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isDeletingApiKey, setIsDeletingApiKey] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);

  // Image AI API state
  const [activeImageProvider, setActiveImageProvider] = useState("google"); // The provider used for generation
  const [viewingImageProvider, setViewingImageProvider] = useState("google"); // The provider being configured
  const [selectedImageModel, setSelectedImageModel] = useState("gemini-3-pro-image");
  const [selectedImageResolution, setSelectedImageResolution] = useState("1K");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("16:9");
  const [selectedQuality, setSelectedQuality] = useState("high");
  const [imageApiKey, setImageApiKey] = useState("");
  const [showImageApiKey, setShowImageApiKey] = useState(false);
  // Per-provider image settings
  const [imageProviderSettings, setImageProviderSettings] = useState<Record<string, ImageProviderSettings>>({});
  const [isSavingImageApiKey, setIsSavingImageApiKey] = useState(false);
  const [isDeletingImageApiKey, setIsDeletingImageApiKey] = useState(false);
  const [isSettingActiveImage, setIsSettingActiveImage] = useState(false);
  const [isSavingImageSettings, setIsSavingImageSettings] = useState(false);

  // Messages
  const [textApiMessage, setTextApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageApiMessage, setImageApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if viewing text provider has an API key
  const viewingProviderHasKey = textProviderSettings[viewingProvider]?.hasKey || false;
  // Check if viewing image provider has an API key
  const viewingImageProviderHasKey = imageProviderSettings[viewingImageProvider]?.hasKey || false;

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          // Load per-provider settings
          if (data.textProviderSettings) {
            setTextProviderSettings(data.textProviderSettings);
          }
          if (data.imageProviderSettings) {
            setImageProviderSettings(data.imageProviderSettings);
          }
          if (data.aiProvider) {
            setActiveProvider(data.aiProvider);
            setViewingProvider(data.aiProvider);
            // Load saved model for this provider
            const providerSettings = data.textProviderSettings?.[data.aiProvider];
            if (providerSettings?.model) {
              setSelectedModel(providerSettings.model);
            }
          }
          if (data.imageProvider) {
            setActiveImageProvider(data.imageProvider);
            setViewingImageProvider(data.imageProvider);
            // Load saved settings for this provider
            const providerSettings = data.imageProviderSettings?.[data.imageProvider];
            if (providerSettings?.model) {
              setSelectedImageModel(providerSettings.model);
            }
            if (providerSettings?.resolution) {
              setSelectedImageResolution(providerSettings.resolution);
            }
            if (providerSettings?.aspectRatio) {
              setSelectedAspectRatio(providerSettings.aspectRatio);
            }
            if (providerSettings?.quality) {
              setSelectedQuality(providerSettings.quality);
            }
          }
        }
      } catch (error) {
}
    };
    loadSettings();
  }, []);

  // When viewing provider changes, load saved model for that provider
  useEffect(() => {
    const providerSettings = textProviderSettings[viewingProvider];
    if (providerSettings?.model) {
      setSelectedModel(providerSettings.model);
    } else {
      // Default to first model if no saved model
      const provider = aiProviders.find(p => p.id === viewingProvider);
      if (provider && provider.models.length > 0) {
        setSelectedModel(provider.models[0].id);
      }
    }
  }, [viewingProvider, textProviderSettings]);

  // When viewing image provider changes, load saved settings for that provider
  useEffect(() => {
    const providerSettings = imageProviderSettings[viewingImageProvider];
    const providerDef = imageProviders.find(p => p.id === viewingImageProvider);

    if (providerSettings?.model) {
      setSelectedImageModel(providerSettings.model);
    } else if (providerDef?.models?.length) {
      setSelectedImageModel(providerDef.models[0].id);
    }

    if (providerSettings?.resolution) {
      setSelectedImageResolution(providerSettings.resolution);
    } else {
      // Set default resolution based on provider
      const defaultRes = viewingImageProvider === "google" ? "1K" : "1792x1024";
      setSelectedImageResolution(defaultRes);
    }

    if (providerSettings?.aspectRatio) {
      setSelectedAspectRatio(providerSettings.aspectRatio);
    } else {
      setSelectedAspectRatio("16:9");
    }

    if (providerSettings?.quality) {
      setSelectedQuality(providerSettings.quality);
    } else {
      setSelectedQuality("high");
    }
  }, [viewingImageProvider, imageProviderSettings]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setIsSavingApiKey(true);
    setTextApiMessage(null);
    try {
      // Build provider-specific field names
      const keyFieldName = `${viewingProvider}ApiKey`;
      const modelFieldName = `${viewingProvider}Model`;

      // Build settings object
      const settings: Record<string, string> = {
        [keyFieldName]: apiKey,
        [modelFieldName]: selectedModel,
      };

      // If no active provider yet, set this one as active
      if (!activeProvider || !textProviderSettings[activeProvider]?.hasKey) {
        settings.aiProvider = viewingProvider;
      }

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        // Update per-provider settings
        setTextProviderSettings(prev => ({
          ...prev,
          [viewingProvider]: { hasKey: true, model: selectedModel }
        }));
        // Set as active if it was set
        if (!activeProvider || !textProviderSettings[activeProvider]?.hasKey) {
          setActiveProvider(viewingProvider);
        }
        setApiKey("");
        setShowApiKey(false);
        setTextApiMessage({ type: "success", text: `${aiProviders.find(p => p.id === viewingProvider)?.name} API key saved!` });
      } else {
        setTextApiMessage({ type: "error", text: await describeResponseError(response, "save your API key") });
      }
    } catch {
      setTextApiMessage({ type: "error", text: describeNetworkError("save your API key") });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    setIsDeletingApiKey(true);
    setTextApiMessage(null);
    try {
      const response = await fetch(`/api/user/settings?field=textApiKey&provider=${viewingProvider}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Update per-provider settings
        setTextProviderSettings(prev => ({
          ...prev,
          [viewingProvider]: { hasKey: false, model: null }
        }));
        setApiKey("");
        setTextApiMessage({ type: "success", text: `${aiProviders.find(p => p.id === viewingProvider)?.name} API key deleted` });
        // If we deleted the active provider's key, clear the active provider
        if (viewingProvider === activeProvider) {
          setActiveProvider("");
        }
      }
    } catch (error) {
} finally {
      setIsDeletingApiKey(false);
    }
  };

  // Set a provider as active for generation
  const handleSetActiveProvider = async () => {
    if (!viewingProviderHasKey) return;
    setIsSettingActive(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: viewingProvider,
        }),
      });
      if (response.ok) {
        setActiveProvider(viewingProvider);
        setTextApiMessage({ type: "success", text: `${aiProviders.find(p => p.id === viewingProvider)?.name} is now your active AI provider!` });
      }
    } catch (error) {
} finally {
      setIsSettingActive(false);
    }
  };

  // Set an image provider as active for generation
  const handleSetActiveImageProvider = async () => {
    if (!viewingImageProviderHasKey) return;
    setIsSettingActiveImage(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageProvider: viewingImageProvider,
        }),
      });
      if (response.ok) {
        setActiveImageProvider(viewingImageProvider);
        setImageApiMessage({ type: "success", text: `${imageProviders.find(p => p.id === viewingImageProvider)?.name} is now your active image provider!` });
      }
    } catch (error) {
} finally {
      setIsSettingActiveImage(false);
    }
  };

  // Save model only (when API key already exists)
  const handleSaveModelOnly = async () => {
    setIsSavingModel(true);
    setTextApiMessage(null);
    try {
      const modelFieldName = `${viewingProvider}Model`;
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [modelFieldName]: selectedModel,
        }),
      });
      if (response.ok) {
        setTextProviderSettings(prev => ({
          ...prev,
          [viewingProvider]: { ...prev[viewingProvider], model: selectedModel }
        }));
        setTextApiMessage({ type: "success", text: `Model updated to ${selectedModel}!` });
      } else {
        setTextApiMessage({ type: "error", text: await describeResponseError(response, "save your model") });
      }
    } catch {
      setTextApiMessage({ type: "error", text: describeNetworkError("save your model") });
    } finally {
      setIsSavingModel(false);
    }
  };

  // Save image settings only (when API key already exists)
  const handleSaveImageSettingsOnly = async () => {
    setIsSavingImageSettings(true);
    setImageApiMessage(null);
    try {
      const provider = imageProviders.find(p => p.id === viewingImageProvider);
      const providerPrefix = viewingImageProvider;

      const imageSettings: Record<string, string> = {
        [`${providerPrefix}ImageModel`]: selectedImageModel,
      };

      if (provider?.hasResolution) {
        imageSettings[`${providerPrefix}ImageResolution`] = selectedImageResolution;
      }
      if (provider?.hasAspectRatio) {
        imageSettings[`${providerPrefix}ImageAspectRatio`] = selectedAspectRatio;
      }
      if (provider?.hasQuality) {
        imageSettings[`${providerPrefix}ImageQuality`] = selectedQuality;
      }

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageSettings),
      });
      if (response.ok) {
        setImageProviderSettings(prev => ({
          ...prev,
          [viewingImageProvider]: {
            ...prev[viewingImageProvider],
            model: selectedImageModel,
            resolution: selectedImageResolution,
            aspectRatio: selectedAspectRatio,
            quality: selectedQuality,
          }
        }));
        setImageApiMessage({ type: "success", text: "Image settings saved!" });
      } else {
        setImageApiMessage({ type: "error", text: await describeResponseError(response, "save your image settings") });
      }
    } catch {
      setImageApiMessage({ type: "error", text: describeNetworkError("save your image settings") });
    } finally {
      setIsSavingImageSettings(false);
    }
  };

  const handleSaveImageApiKey = async () => {
    if (!imageApiKey.trim()) return;
    setIsSavingImageApiKey(true);
    setImageApiMessage(null);
    try {
      // Build provider-specific field names
      const provider = imageProviders.find(p => p.id === viewingImageProvider);
      const providerPrefix = viewingImageProvider;

      // Build settings object with provider-specific keys
      const imageSettings: Record<string, string> = {
        [`${providerPrefix}ImageApiKey`]: imageApiKey,
        [`${providerPrefix}ImageModel`]: selectedImageModel,
      };

      // Add provider-specific settings based on what the provider supports
      if (provider?.hasResolution) {
        imageSettings[`${providerPrefix}ImageResolution`] = selectedImageResolution;
      }
      if (provider?.hasAspectRatio) {
        imageSettings[`${providerPrefix}ImageAspectRatio`] = selectedAspectRatio;
      }
      if (provider?.hasQuality) {
        imageSettings[`${providerPrefix}ImageQuality`] = selectedQuality;
      }

      // If no active image provider yet, set this one as active
      if (!activeImageProvider || !imageProviderSettings[activeImageProvider]?.hasKey) {
        imageSettings.imageProvider = viewingImageProvider;
      }

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageSettings),
      });
      if (response.ok) {
        // Update per-provider settings
        setImageProviderSettings(prev => ({
          ...prev,
          [viewingImageProvider]: {
            hasKey: true,
            model: selectedImageModel,
            resolution: selectedImageResolution,
            aspectRatio: selectedAspectRatio,
            quality: selectedQuality,
          }
        }));
        // Set as active if it was set
        if (!activeImageProvider || !imageProviderSettings[activeImageProvider]?.hasKey) {
          setActiveImageProvider(viewingImageProvider);
        }
        setImageApiKey("");
        setShowImageApiKey(false);
        setImageApiMessage({ type: "success", text: `${provider?.name} API key saved!` });
      } else {
        setImageApiMessage({ type: "error", text: await describeResponseError(response, "save your image API key") });
      }
    } catch {
      setImageApiMessage({ type: "error", text: describeNetworkError("save your image API key") });
    } finally {
      setIsSavingImageApiKey(false);
    }
  };

  const handleDeleteImageApiKey = async () => {
    setIsDeletingImageApiKey(true);
    setImageApiMessage(null);
    try {
      const response = await fetch(`/api/user/settings?field=imageApiKey&provider=${viewingImageProvider}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Update per-provider settings
        setImageProviderSettings(prev => ({
          ...prev,
          [viewingImageProvider]: {
            hasKey: false,
            model: null,
            resolution: null,
            aspectRatio: null,
            quality: null,
            style: null,
          }
        }));
        setImageApiKey("");
        const providerName = imageProviders.find(p => p.id === viewingImageProvider)?.name;
        setImageApiMessage({ type: "success", text: `${providerName} API key deleted` });
        // If we deleted the active provider's key, clear the active provider
        if (viewingImageProvider === activeImageProvider) {
          setActiveImageProvider("");
        }
      }
    } catch (error) {
} finally {
      setIsDeletingImageApiKey(false);
    }
  };

  // Get viewing provider details
  const viewingProviderDetails = aiProviders.find(p => p.id === viewingProvider);
  const viewingImageProviderDetails = imageProviders.find(p => p.id === viewingImageProvider);

  // Check if model has changed from saved value (for showing Save button)
  const savedTextModel = textProviderSettings[viewingProvider]?.model;
  const textModelHasChanged = viewingProviderHasKey && selectedModel !== savedTextModel;

  // Check if image settings have changed from saved values
  const savedImageSettings = imageProviderSettings[viewingImageProvider];
  const imageSettingsHaveChanged = viewingImageProviderHasKey && (
    selectedImageModel !== savedImageSettings?.model ||
    selectedImageResolution !== savedImageSettings?.resolution ||
    selectedAspectRatio !== savedImageSettings?.aspectRatio ||
    selectedQuality !== savedImageSettings?.quality
  );

  return (
    <PageShell className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
            AI keys
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Your own provider keys. You pay the provider directly, so nothing here is capped.
          </p>
        </div>
        <Link href="/docs/byok" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
          <HelpCircle className="w-3.5 h-3.5" />
          Docs
        </Link>
      </div>

      {/* Text models */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Text models
          </CardTitle>
          <CardDescription>
            The key that writes your posts, ideas and hooks. Stored encrypted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {textApiMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              textApiMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}>
              {textApiMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {textApiMessage.text}
            </div>
          )}

          {/* Active Provider Banner */}
          {activeProvider && textProviderSettings[activeProvider]?.hasKey && (
            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                  {(() => {
                    const ActiveIcon = aiProviders.find(p => p.id === activeProvider)?.icon;
                    return ActiveIcon ? <ActiveIcon /> : null;
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                    Active Provider: {aiProviders.find(p => p.id === activeProvider)?.name}
                  </p>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    This provider will be used for all post generation
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-cyan-700 dark:text-cyan-300 font-medium bg-cyan-100 dark:bg-cyan-800/50 px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
                <Check className="w-3 h-3" />
                Active
              </span>
            </div>
          )}

          {/* Provider Selector - for viewing/configuring */}
          <div>
            <Label className="mb-2 block text-sm text-slate-500 dark:text-slate-400">Pick a provider</Label>
            <div className="flex flex-wrap gap-2">
              {aiProviders.map((provider) => {
                const Icon = provider.icon;
                const hasKey = textProviderSettings[provider.id]?.hasKey || false;
                const isActive = provider.id === activeProvider;
                const isViewing = provider.id === viewingProvider;
                return (
                  <button
                    key={provider.id}
                    onClick={() => setViewingProvider(provider.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 relative",
                      isViewing
                        ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                        : isActive
                          ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 ring-2 ring-cyan-500/50"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <Icon />
                    {provider.name}
                    {hasKey && !isViewing && (
                      <Check className="w-3 h-3 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Config */}
          {viewingProviderDetails && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <viewingProviderDetails.icon />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium">{viewingProviderDetails.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {viewingProviderDetails.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {providerVideoIds[viewingProvider] && (
                      <VideoModal videoId={providerVideoIds[viewingProvider]} triggerClassName="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors" />
                    )}
                    {providerHelpUrls[viewingProvider] && (
                      <Link href={providerHelpUrls[viewingProvider]} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
                        <HelpCircle className="w-3 h-3" />
                        Setup guide
                      </Link>
                    )}
                    {viewingProvider === activeProvider && viewingProviderHasKey && (
                      <span className="flex items-center gap-1 text-xs text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 px-2.5 py-1 rounded-full font-medium">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                    {viewingProviderHasKey && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                </div>

                {/* Model Selector */}
                <div className="mb-4">
                  <Label className="mb-2 block text-sm">Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {viewingProviderDetails.models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center justify-between w-full gap-3">
                            <span>{model.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{model.tag}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Pricing info for selected model */}
                  {viewingProviderDetails.models.find(m => m.id === selectedModel) && (
                    <div className="mt-2 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                      <p className="text-xs text-cyan-700 dark:text-cyan-300">
                        <span className="font-medium">Estimated cost:</span>{" "}
                        {viewingProviderDetails.models.find(m => m.id === selectedModel)?.price} = {viewingProviderDetails.models.find(m => m.id === selectedModel)?.monthly} for 30 posts
                      </p>
                    </div>
                  )}
                </div>

                {viewingProviderHasKey ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        value="••••••••••••••••••••••••"
                        disabled
                        className="flex-1 bg-white dark:bg-slate-800"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDeleteApiKey}
                        disabled={isDeletingApiKey}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {isDeletingApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                    <a
                      href={viewingProviderDetails.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Manage your {viewingProviderDetails.name} API keys
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {/* Save Model button - show when model changed */}
                    {textModelHasChanged && (
                      <Button
                        type="button"
                        onClick={handleSaveModelOnly}
                        disabled={isSavingModel}
                        className="w-full"
                      >
                        {isSavingModel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Model
                      </Button>
                    )}
                    {/* Set as Active button - only show if this provider is not already active */}
                    {viewingProvider !== activeProvider && (
                      <Button
                        type="button"
                        onClick={handleSetActiveProvider}
                        disabled={isSettingActive}
                        className="w-full"
                      >
                        {isSettingActive ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Set as Active Provider
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        id="text-ai-api-key"
                        name="text-ai-api-key"
                        type={showApiKey ? "text" : "password"}
                        placeholder={viewingProviderDetails.placeholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        autoComplete="off"
                        className="pr-10 bg-white dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <a
                      href={viewingProviderDetails.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Get your {viewingProviderDetails.name} API key
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Button
                      type="button"
                      onClick={handleSaveApiKey}
                      disabled={isSavingApiKey || !apiKey.trim()}
                      className="w-full"
                    >
                      {isSavingApiKey ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save key
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800">
            <Key className="w-4 h-4 mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              Keys are encrypted with AES-256 and never leave your account. You pay the provider directly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image AI API Keys */}
      <Card className={cn(!hasImageAccess && "relative overflow-hidden")}>
        {!hasImageAccess && (
          <div className="absolute inset-0 bg-slate-50/95 dark:bg-slate-900/95 z-10 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <Crown className="w-8 h-8 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Pro Feature</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Image models is available on the Pro plan and above
              </p>
              <a href={UPGRADE_PATH}>
                <Button
                                  >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </a>
            </div>
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyan-600" />
            Image models
            {!hasImageAccess && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-normal">
                Pro
              </span>
            )}
          </CardTitle>
          <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>A separate key, only used when you generate an image for a post.</span>
            <Link href="/docs/byok/image-providers" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors shrink-0">
              <HelpCircle className="w-3 h-3" />
              Setup guide
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageApiMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              imageApiMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}>
              {imageApiMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {imageApiMessage.text}
            </div>
          )}

          {/* Active Image Provider Banner */}
          {activeImageProvider && imageProviderSettings[activeImageProvider]?.hasKey && (
            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                  {(() => {
                    const ActiveIcon = imageProviders.find(p => p.id === activeImageProvider)?.icon;
                    return ActiveIcon ? <ActiveIcon /> : null;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                    Active Provider: {imageProviders.find(p => p.id === activeImageProvider)?.name}
                  </p>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    This provider will be used for all image generation
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-cyan-700 dark:text-cyan-300 font-medium bg-cyan-100 dark:bg-cyan-800/50 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" />
                Active
              </span>
            </div>
          )}

          {/* Provider Selector - for viewing/configuring */}
          <div>
            <Label className="mb-2 block text-sm text-slate-500 dark:text-slate-400">Pick a provider</Label>
            <div className="flex flex-wrap gap-2">
              {imageProviders.map((provider) => {
                const Icon = provider.icon;
                const hasKey = imageProviderSettings[provider.id]?.hasKey || false;
                const isActive = provider.id === activeImageProvider;
                const isViewing = provider.id === viewingImageProvider;
                return (
                  <button
                    key={provider.id}
                    onClick={() => setViewingImageProvider(provider.id)}
                    disabled={!hasImageAccess}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 relative",
                      isViewing
                        ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                        : isActive
                          ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 ring-2 ring-cyan-500/50"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700",
                      !hasImageAccess && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon />
                    {provider.name}
                    {hasKey && !isViewing && (
                      <Check className="w-3 h-3 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Config */}
          {viewingImageProviderDetails && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <viewingImageProviderDetails.icon />
                    </div>
                    <div>
                      <h4 className="font-medium">{viewingImageProviderDetails.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {viewingImageProviderDetails.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {imageProviderVideoIds[viewingImageProvider] && (
                      <VideoModal videoId={imageProviderVideoIds[viewingImageProvider]} triggerClassName="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors" />
                    )}
                    {viewingImageProvider === activeImageProvider && viewingImageProviderHasKey && (
                      <span className="flex items-center gap-1 text-xs text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 px-2.5 py-1 rounded-full font-medium">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                    {viewingImageProviderHasKey && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                </div>

                {viewingImageProviderDetails.note && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 p-2 rounded bg-cyan-50 dark:bg-cyan-900/10">
                    {viewingImageProviderDetails.note}
                  </p>
                )}

                {/* Model Selector */}
                {viewingImageProviderDetails.models && viewingImageProviderDetails.models.length > 0 && (
                  <div className="mb-4">
                    <Label className="mb-2 block text-sm">Model</Label>
                    <Select value={selectedImageModel} onValueChange={setSelectedImageModel} disabled={!hasImageAccess}>
                      <SelectTrigger className="bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {viewingImageProviderDetails.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center justify-between w-full gap-3">
                              <span>{model.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{model.tag}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Resolution/Size Selector - hidden for models that don't support it (Nano Banana, Imagen 4 - fixed 1024px) */}
                {viewingImageProviderDetails.hasResolution && resolutionOptions[viewingImageProvider as keyof typeof resolutionOptions] && !["gemini-2.5-flash-image", "gemini-3.1-flash-lite-image"].includes(selectedImageModel) && (
                  <div className="mb-4">
                    <Label className="mb-2 block text-sm">Resolution</Label>
                    <Select value={selectedImageResolution} onValueChange={setSelectedImageResolution} disabled={!hasImageAccess}>
                      <SelectTrigger className="bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        {resolutionOptions[viewingImageProvider as keyof typeof resolutionOptions].map((res) => (
                          <SelectItem key={res.id} value={res.id}>
                            <div className="flex items-center justify-between w-full gap-3">
                              <span>{res.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{res.price}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Aspect ratio Selector (Google & Replicate) */}
                {viewingImageProviderDetails.hasAspectRatio && aspectRatioOptions[viewingImageProvider as keyof typeof aspectRatioOptions] && (
                  <div className="mb-4">
                    <Label className="mb-2 block text-sm">Aspect ratio</Label>
                    <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio} disabled={!hasImageAccess}>
                      <SelectTrigger className="bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        {aspectRatioOptions[viewingImageProvider as keyof typeof aspectRatioOptions].map((ratio) => (
                          <SelectItem key={ratio} value={ratio}>
                            {ratio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quality Selector (OpenAI) */}
                {viewingImageProviderDetails.hasQuality && qualityOptions[viewingImageProvider as keyof typeof qualityOptions] && (
                  <div className="mb-4">
                    <Label className="mb-2 block text-sm">Quality</Label>
                    <Select value={selectedQuality} onValueChange={setSelectedQuality} disabled={!hasImageAccess}>
                      <SelectTrigger className="bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        {qualityOptions[viewingImageProvider as keyof typeof qualityOptions].map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            <div className="flex items-center justify-between w-full gap-3">
                              <span>{q.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{q.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Pricing info */}
                <div className="mb-3 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    <span className="font-medium">Estimated cost:</span> {viewingImageProviderDetails.price} = {viewingImageProviderDetails.monthly}
                  </p>
                </div>

                {viewingImageProviderHasKey ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        value="••••••••••••••••••••••••"
                        disabled
                        className="flex-1 bg-white dark:bg-slate-800"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDeleteImageApiKey}
                        disabled={isDeletingImageApiKey || !hasImageAccess}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {isDeletingImageApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                    <a
                      href={viewingImageProviderDetails.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Manage your {viewingImageProviderDetails.name} API keys
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {/* Save Settings button - show when settings changed */}
                    {imageSettingsHaveChanged && (
                      <Button
                        type="button"
                        onClick={handleSaveImageSettingsOnly}
                        disabled={isSavingImageSettings || !hasImageAccess}
                        className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      >
                        {isSavingImageSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Settings
                      </Button>
                    )}
                    {/* Set as Active button - only show if this provider is not already active */}
                    {viewingImageProvider !== activeImageProvider && (
                      <Button
                        type="button"
                        onClick={handleSetActiveImageProvider}
                        disabled={isSettingActiveImage || !hasImageAccess}
                        className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      >
                        {isSettingActiveImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Set as Active Provider
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        id="image-ai-api-key"
                        name="image-ai-api-key"
                        type={showImageApiKey ? "text" : "password"}
                        placeholder={viewingImageProviderDetails.placeholder}
                        value={imageApiKey}
                        onChange={(e) => setImageApiKey(e.target.value)}
                        disabled={!hasImageAccess}
                        autoComplete="off"
                        className="pr-10 bg-white dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowImageApiKey(!showImageApiKey)}
                        disabled={!hasImageAccess}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-foreground disabled:opacity-50"
                      >
                        {showImageApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <a
                      href={viewingImageProviderDetails.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Get your {viewingImageProviderDetails.name} API key
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Button
                      type="button"
                      onClick={handleSaveImageApiKey}
                      disabled={isSavingImageApiKey || !imageApiKey.trim() || !hasImageAccess}
                      className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      {isSavingImageApiKey ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save key
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800">
            <ImageIcon className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              <strong>BYOK:</strong> Use your own API key - you pay directly to the provider (Google, OpenAI). LinkedGrow never sees your costs.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
