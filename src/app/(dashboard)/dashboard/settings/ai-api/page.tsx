"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirectToCheckout } from "@/lib/checkout";
import {
  Key,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Loader2,
  Plus,
  X,
  MessageSquare,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessFeature, PlanId } from "@/lib/plans";
import { ImageIcon, Sparkles, Crown } from "lucide-react";

// SVG icons for AI providers
const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
  </svg>
);

const AnthropicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"/>
  </svg>
);

const GeminiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65" className="w-5 h-5">
    <defs>
      <linearGradient id="gemini-gradient" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4893FC"/>
        <stop offset=".27" stopColor="#4893FC"/>
        <stop offset=".777" stopColor="#969DFF"/>
        <stop offset="1" stopColor="#BD99FE"/>
      </linearGradient>
    </defs>
    <path fill="url(#gemini-gradient)" d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z"/>
  </svg>
);

const GrokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 492" className="w-5 h-5" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M197.76 315.52l170.197-125.803c8.342-6.186 20.267-3.776 24.256 5.803 20.907 50.539 11.563 111.253-30.08 152.939-41.621 41.685-99.562 50.816-152.512 29.994l-57.834 26.816c82.965 56.768 183.701 42.731 246.656-20.33 49.941-50.006 65.408-118.166 50.944-179.627l.128.149c-20.971-90.282 5.162-126.378 58.666-200.17 1.28-1.75 2.56-3.499 3.819-5.291l-70.421 70.507v-.214l-243.883 245.27m-35.072 30.528c-59.563-56.96-49.28-145.088 1.515-195.926 37.568-37.61 99.136-52.97 152.874-30.4l57.707-26.666a166.554 166.554 0 00-39.019-21.334 191.467 191.467 0 00-208.042 41.942c-54.038 54.101-71.04 137.301-41.856 208.298 21.802 53.056-13.931 90.582-49.92 128.47C23.104 463.915 10.304 477.333 0 491.541l162.56-145.386"/>
  </svg>
);

const PerplexityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z"/>
  </svg>
);

const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4.5, GPT-4o, o3",
    placeholder: "sk-...",
    icon: OpenAIIcon,
    models: [
      { id: "gpt-4.5-preview", name: "GPT-4.5 Preview", tag: "Most Capable", price: "$0.15/post", monthly: "~$4.50/mo" },
      { id: "gpt-4o", name: "GPT-4o", tag: "Recommended", price: "$0.02/post", monthly: "~$0.60/mo" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", tag: "Faster", price: "$0.002/post", monthly: "~$0.06/mo" },
      { id: "o3-mini", name: "o3-mini", tag: "Reasoning", price: "$0.05/post", monthly: "~$1.50/mo" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 4.5, Claude 4",
    placeholder: "sk-ant-...",
    icon: AnthropicIcon,
    models: [
      { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", tag: "Most Capable", price: "$0.20/post", monthly: "~$6.00/mo" },
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", tag: "Recommended", price: "$0.04/post", monthly: "~$1.20/mo" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", tag: "Faster", price: "$0.003/post", monthly: "~$0.09/mo" },
    ],
  },
  {
    id: "google",
    name: "Gemini",
    description: "Gemini 2.5, Gemini 2.0",
    placeholder: "AIza...",
    icon: GeminiIcon,
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Most Capable", price: "$0.02/post", monthly: "~$0.60/mo" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Recommended", price: "$0.001/post", monthly: "~$0.03/mo" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tag: "Faster", price: "$0.0005/post", monthly: "~$0.02/mo" },
    ],
  },
  {
    id: "grok",
    name: "Grok",
    description: "Grok 3, Grok 2",
    placeholder: "xai-...",
    icon: GrokIcon,
    models: [
      { id: "grok-3", name: "Grok 3", tag: "Most Capable", price: "$0.10/post", monthly: "~$3.00/mo" },
      { id: "grok-3-mini", name: "Grok 3 Mini", tag: "Recommended", price: "$0.02/post", monthly: "~$0.60/mo" },
      { id: "grok-2", name: "Grok 2", tag: "Faster", price: "$0.01/post", monthly: "~$0.30/mo" },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Sonar Pro, Sonar Reasoning",
    placeholder: "pplx-...",
    icon: PerplexityIcon,
    models: [
      { id: "sonar-pro", name: "Sonar Pro", tag: "Recommended", price: "$0.01/post", monthly: "~$0.30/mo" },
      { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro", tag: "Deep Research", price: "$0.02/post", monthly: "~$0.60/mo" },
      { id: "sonar", name: "Sonar", tag: "Faster", price: "$0.005/post", monthly: "~$0.15/mo" },
    ],
  },
];

const imageProviders = [
  {
    id: "google",
    name: "Google AI",
    description: "Imagen 3 (Image Generation)",
    placeholder: "AIza...",
    icon: GeminiIcon,
    note: "Uses your Google AI API key for Imagen 3 image generation",
    price: "$0.02/image",
    monthly: "~$0.60/mo (30 images)",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "DALL-E 3, GPT-Image",
    placeholder: "sk-...",
    icon: OpenAIIcon,
    note: "Uses your OpenAI API key for DALL-E/GPT image generation",
    price: "$0.04/image",
    monthly: "~$1.20/mo (30 images)",
  },
];

export default function AIAPISettingsPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");

  // Text AI API state
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isDeletingApiKey, setIsDeletingApiKey] = useState(false);

  // Image AI API state
  const [selectedImageProvider, setSelectedImageProvider] = useState("google");
  const [imageApiKey, setImageApiKey] = useState("");
  const [showImageApiKey, setShowImageApiKey] = useState(false);
  const [hasImageApiKey, setHasImageApiKey] = useState(false);
  const [isSavingImageApiKey, setIsSavingImageApiKey] = useState(false);
  const [isDeletingImageApiKey, setIsDeletingImageApiKey] = useState(false);

  // Voice & Style Settings
  const [samplePosts, setSamplePosts] = useState<string[]>([""]);
  const [neverMention, setNeverMention] = useState("");
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  // Messages
  const [textApiMessage, setTextApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageApiMessage, setImageApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasApiKey);
          if (data.aiProvider) {
            setSelectedProvider(data.aiProvider);
          }
          if (data.aiModel) {
            setSelectedModel(data.aiModel);
          }
          setHasImageApiKey(data.hasImageApiKey || false);
          if (data.imageProvider) {
            setSelectedImageProvider(data.imageProvider);
          }
          // Load voice settings
          if (data.samplePosts && data.samplePosts.length > 0) {
            setSamplePosts(data.samplePosts);
          }
          if (data.neverMention) {
            setNeverMention(data.neverMention);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Update model when provider changes
  useEffect(() => {
    const provider = aiProviders.find(p => p.id === selectedProvider);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  }, [selectedProvider]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setIsSavingApiKey(true);
    setTextApiMessage(null);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: selectedProvider,
          aiModel: selectedModel,
          aiApiKey: apiKey,
        }),
      });
      if (response.ok) {
        setHasApiKey(true);
        setApiKey("");
        setShowApiKey(false);
        setTextApiMessage({ type: "success", text: "API key saved successfully!" });
      } else {
        setTextApiMessage({ type: "error", text: "Failed to save API key" });
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
      setTextApiMessage({ type: "error", text: "Failed to save API key" });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    setIsDeletingApiKey(true);
    setTextApiMessage(null);
    try {
      const response = await fetch("/api/user/settings?field=aiApiKey", {
        method: "DELETE",
      });
      if (response.ok) {
        setHasApiKey(false);
        setApiKey("");
        setTextApiMessage({ type: "success", text: "API key deleted" });
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    } finally {
      setIsDeletingApiKey(false);
    }
  };

  const handleSaveImageApiKey = async () => {
    if (!imageApiKey.trim()) return;
    setIsSavingImageApiKey(true);
    setImageApiMessage(null);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageProvider: selectedImageProvider,
          imageApiKey: imageApiKey,
        }),
      });
      if (response.ok) {
        setHasImageApiKey(true);
        setImageApiKey("");
        setShowImageApiKey(false);
        setImageApiMessage({ type: "success", text: "Image API key saved successfully!" });
      } else {
        setImageApiMessage({ type: "error", text: "Failed to save image API key" });
      }
    } catch (error) {
      console.error("Failed to save image API key:", error);
      setImageApiMessage({ type: "error", text: "Failed to save image API key" });
    } finally {
      setIsSavingImageApiKey(false);
    }
  };

  const handleDeleteImageApiKey = async () => {
    setIsDeletingImageApiKey(true);
    setImageApiMessage(null);
    try {
      const response = await fetch("/api/user/settings?field=imageApiKey", {
        method: "DELETE",
      });
      if (response.ok) {
        setHasImageApiKey(false);
        setImageApiKey("");
        setImageApiMessage({ type: "success", text: "Image API key deleted" });
      }
    } catch (error) {
      console.error("Failed to delete image API key:", error);
    } finally {
      setIsDeletingImageApiKey(false);
    }
  };

  const handleSaveVoiceSettings = async () => {
    setIsSavingVoice(true);
    setVoiceMessage(null);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          samplePosts: samplePosts.filter(p => p.trim()),
          neverMention: neverMention,
        }),
      });
      if (response.ok) {
        setVoiceMessage({ type: "success", text: "Voice settings saved successfully!" });
      } else {
        setVoiceMessage({ type: "error", text: "Failed to save voice settings" });
      }
    } catch (error) {
      console.error("Failed to save voice settings:", error);
      setVoiceMessage({ type: "error", text: "Failed to save voice settings" });
    } finally {
      setIsSavingVoice(false);
    }
  };

  const addSamplePost = () => {
    if (samplePosts.length < 4) {
      setSamplePosts([...samplePosts, ""]);
    }
  };

  const removeSamplePost = (index: number) => {
    setSamplePosts(samplePosts.filter((_, i) => i !== index));
  };

  const updateSamplePost = (index: number, value: string) => {
    const newPosts = [...samplePosts];
    newPosts[index] = value;
    setSamplePosts(newPosts);
  };

  const currentProvider = aiProviders.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          AI API Keys
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect your own AI providers for unlimited post and image generation
        </p>
      </div>

      {/* Text AI API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-600" />
            Text AI API Keys
          </CardTitle>
          <CardDescription>
            Connect your AI provider for post generation. Your keys are encrypted and stored securely.
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

          {/* Provider Selector */}
          <div className="flex flex-wrap gap-2">
            {aiProviders.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                    selectedProvider === provider.id
                      ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon />
                  {provider.name}
                </button>
              );
            })}
          </div>

          {/* Active Provider Config */}
          {currentProvider && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <currentProvider.icon />
                    </div>
                    <div>
                      <h4 className="font-medium">{currentProvider.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentProvider.description}
                      </p>
                    </div>
                  </div>
                  {hasApiKey && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                      <Check className="w-3 h-3" />
                      Connected
                    </span>
                  )}
                </div>

                {/* Model Selector */}
                <div className="mb-4">
                  <Label className="mb-2 block text-sm">Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProvider.models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center justify-between w-full gap-3">
                            <span>{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.tag}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Pricing info for selected model */}
                  {currentProvider.models.find(m => m.id === selectedModel) && (
                    <div className="mt-2 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                      <p className="text-xs text-cyan-700 dark:text-cyan-300">
                        <span className="font-medium">Estimated cost:</span>{" "}
                        {currentProvider.models.find(m => m.id === selectedModel)?.price} = {currentProvider.models.find(m => m.id === selectedModel)?.monthly} for 30 posts
                      </p>
                    </div>
                  )}
                </div>

                {hasApiKey ? (
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
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder={currentProvider.placeholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10 bg-white dark:bg-slate-800"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      onClick={handleSaveApiKey}
                      disabled={isSavingApiKey || !apiKey.trim()}
                      className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      {isSavingApiKey ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save API Key
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800">
            <Key className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              Your API keys are encrypted with AES-256 and never shared. You only pay for what you use directly to the provider.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voice & Style Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-600" />
            Voice & Style Settings
          </CardTitle>
          <CardDescription>
            Help AI replicate your writing style by providing sample posts. This is optional but highly recommended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {voiceMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm flex items-center gap-2",
              voiceMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}>
              {voiceMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {voiceMessage.text}
            </div>
          )}

          {/* Sample Posts */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Sample Posts (Max 4)
              <span className="text-xs text-muted-foreground font-normal">- AI will match your writing style</span>
            </Label>
            {samplePosts.map((post, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  placeholder={`Paste one of your best LinkedIn posts here... (Post ${index + 1})`}
                  value={post}
                  onChange={(e) => updateSamplePost(index, e.target.value)}
                  className="min-h-[100px] flex-1"
                />
                {samplePosts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSamplePost(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {samplePosts.length < 4 && (
              <Button variant="outline" onClick={addSamplePost} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Sample Post
              </Button>
            )}
          </div>

          {/* Never Mention */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              Things AI Should NEVER Mention
            </Label>
            <Textarea
              placeholder="Competitors, sensitive topics, incorrect claims about your business..."
              value={neverMention}
              onChange={(e) => setNeverMention(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              AI will avoid these topics in all generated content.
            </p>
          </div>

          <Button
            onClick={handleSaveVoiceSettings}
            disabled={isSavingVoice}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {isSavingVoice ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Voice Settings
          </Button>
        </CardContent>
      </Card>

      {/* Image AI API Keys */}
      <Card className={cn(!hasImageAccess && "relative overflow-hidden")}>
        {!hasImageAccess && (
          <div className="absolute inset-0 bg-slate-50/95 dark:bg-slate-900/95 z-10 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linear-to-r from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Pro Feature</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI Image Generation is available on the Pro plan and above
              </p>
              <Button
                className="bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                onClick={() => redirectToCheckout("pro", session?.user?.email || "")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            AI Image Generation
            {!hasImageAccess && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-normal">
                Pro
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Connect an image generation API for creating visuals with your posts
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

          {/* Provider Selector */}
          <div className="flex flex-wrap gap-2">
            {imageProviders.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedImageProvider(provider.id)}
                  disabled={!hasImageAccess}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                    selectedImageProvider === provider.id
                      ? "bg-linear-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700",
                    !hasImageAccess && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon />
                  {provider.name}
                </button>
              );
            })}
          </div>

          {/* Active Provider Config */}
          {imageProviders
            .filter((p) => p.id === selectedImageProvider)
            .map((provider) => {
              const Icon = provider.icon;
              return (
                <div key={provider.id} className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <Icon />
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
                          </p>
                        </div>
                      </div>
                      {hasImageApiKey && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>

                    {provider.note && (
                      <p className="text-xs text-muted-foreground mb-2 p-2 rounded bg-purple-50 dark:bg-purple-900/10">
                        {provider.note}
                      </p>
                    )}

                    {/* Pricing info */}
                    <div className="mb-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        <span className="font-medium">Estimated cost:</span> {provider.price} = {provider.monthly}
                      </p>
                    </div>

                    {hasImageApiKey ? (
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
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type={showImageApiKey ? "text" : "password"}
                            placeholder={provider.placeholder}
                            value={imageApiKey}
                            onChange={(e) => setImageApiKey(e.target.value)}
                            disabled={!hasImageAccess}
                            className="pr-10 bg-white dark:bg-slate-800"
                          />
                          <button
                            onClick={() => setShowImageApiKey(!showImageApiKey)}
                            disabled={!hasImageAccess}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            {showImageApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button
                          onClick={handleSaveImageApiKey}
                          disabled={isSavingImageApiKey || !imageApiKey.trim() || !hasImageAccess}
                          className="w-full bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                          {isSavingImageApiKey ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Image API Key
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <ImageIcon className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>BYOK:</strong> Use your own API key - you pay directly to the provider (Google, OpenAI). LinkedGrow never sees your costs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
