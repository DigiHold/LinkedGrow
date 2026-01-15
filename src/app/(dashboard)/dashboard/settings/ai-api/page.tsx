"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessFeature, PlanId } from "@/lib/plans";
import { ImageIcon, Sparkles, Crown } from "lucide-react";
import Link from "next/link";

// SVG icons for AI providers
const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
  </svg>
);

const AnthropicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.257 0h3.603l6.57 16.96h-3.603L6.57 3.52zM0 20.48h3.603L6.57 3.52H3.603L0 20.48z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GroqIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, GPT-4o, GPT-3.5",
    placeholder: "sk-...",
    icon: OpenAIIcon,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5, Claude 3",
    placeholder: "sk-ant-...",
    icon: AnthropicIcon,
  },
  {
    id: "google",
    name: "Google AI",
    description: "Gemini Pro, Gemini Flash",
    placeholder: "AIza...",
    icon: GoogleIcon,
  },
  {
    id: "groq",
    name: "Groq",
    description: "Llama 3, Mixtral (Fast)",
    placeholder: "gsk_...",
    icon: GroqIcon,
  },
];

const imageProviders = [
  {
    id: "google",
    name: "Google AI",
    description: "Gemini 2.0 Flash (Image Generation)",
    placeholder: "AIza...",
    icon: GoogleIcon,
    note: "Uses your Google AI API key for Gemini image generation",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "DALL-E 3",
    placeholder: "sk-...",
    icon: OpenAIIcon,
    note: "Uses your OpenAI API key for DALL-E image generation",
  },
];

export default function AIAPISettingsPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan as PlanId) || "free";
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");

  // Text AI API state
  const [selectedProvider, setSelectedProvider] = useState("openai");
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

  // Messages
  const [textApiMessage, setTextApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageApiMessage, setImageApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          setHasImageApiKey(data.hasImageApiKey || false);
          if (data.imageProvider) {
            setSelectedImageProvider(data.imageProvider);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
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
          {aiProviders
            .filter((p) => p.id === selectedProvider)
            .map((provider) => {
              const Icon = provider.icon;
              return (
                <div key={provider.id} className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Icon />
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
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
                            placeholder={provider.placeholder}
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
              );
            })}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800">
            <Key className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              Your API keys are encrypted with AES-256 and never shared. You only pay for what you use directly to the provider.
            </p>
          </div>
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
                      <p className="text-xs text-muted-foreground mb-3 p-2 rounded bg-purple-50 dark:bg-purple-900/10">
                        {provider.note}
                      </p>
                    )}

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
