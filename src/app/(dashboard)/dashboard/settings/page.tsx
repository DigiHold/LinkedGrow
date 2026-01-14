"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Key,
  User,
  Building2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Linkedin,
  Sparkles,
  Shield,
  Save,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, GPT-4o, GPT-3.5",
    placeholder: "sk-...",
    icon: "🤖",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5, Claude 3",
    placeholder: "sk-ant-...",
    icon: "🧠",
  },
  {
    id: "google",
    name: "Google AI",
    description: "Gemini Pro, Gemini Flash",
    placeholder: "AIza...",
    icon: "✨",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Llama 3, Mixtral (Fast)",
    placeholder: "gsk_...",
    icon: "⚡",
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: "",
    description: "",
    products: "",
    niche: "",
    audience: "",
    topics: "",
    doNotMention: "",
    context: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const toggleShowKey = (providerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-500" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your AI providers and business profile
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              AI API Keys
            </CardTitle>
            <CardDescription>
              Connect your own AI providers. Your keys are encrypted and stored
              securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Selector */}
            <div className="flex flex-wrap gap-2">
              {aiProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2",
                    selectedProvider === provider.id
                      ? "bg-linkedin text-white"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <span>{provider.icon}</span>
                  {provider.name}
                </button>
              ))}
            </div>

            {/* Active Provider Config */}
            {aiProviders
              .filter((p) => p.id === selectedProvider)
              .map((provider) => (
                <div key={provider.id} className="space-y-3">
                  <div className="p-4 rounded-lg bg-accent/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">
                          {provider.icon} {provider.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                      {apiKeys[provider.id] && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Input
                        type={showApiKeys[provider.id] ? "text" : "password"}
                        placeholder={provider.placeholder}
                        value={apiKeys[provider.id] || ""}
                        onChange={(e) =>
                          setApiKeys((prev) => ({
                            ...prev,
                            [provider.id]: e.target.value,
                          }))
                        }
                        className="pr-10"
                      />
                      <button
                        onClick={() => toggleShowKey(provider.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKeys[provider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your API keys are encrypted and never shared. You only pay for
                what you use directly to the provider.
              </p>
            </div>

            <Button variant="linkedin" className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save API Keys"}
            </Button>
          </CardContent>
        </Card>

        {/* LinkedIn Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-linkedin" />
              LinkedIn Connection
            </CardTitle>
            <CardDescription>
              Connect your LinkedIn account for direct publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkedInConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                  <div className="w-12 h-12 rounded-full bg-linkedin/20 flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-linkedin" />
                  </div>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">
                      john@example.com
                    </p>
                  </div>
                  <Check className="w-5 h-5 text-green-600 ml-auto" />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLinkedInConnected(false)}
                >
                  Disconnect Account
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-linkedin/10 flex items-center justify-center mb-4">
                  <Linkedin className="w-8 h-8 text-linkedin" />
                </div>
                <h4 className="font-medium mb-2">Connect LinkedIn</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Publish posts directly from LinkedGrow to your LinkedIn
                  profile
                </p>
                <Button
                  variant="linkedin"
                  onClick={() => setLinkedInConnected(true)}
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  Connect LinkedIn
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Profile
          </CardTitle>
          <CardDescription>
            Help AI understand your brand and create more relevant content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input
                placeholder="Your company or personal brand name"
                value={businessProfile.name}
                onChange={(e) =>
                  setBusinessProfile({ ...businessProfile, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Niche / Industry</label>
              <Input
                placeholder="e.g., SaaS, Marketing, Tech"
                value={businessProfile.niche}
                onChange={(e) =>
                  setBusinessProfile({ ...businessProfile, niche: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">What do you do?</label>
            <Textarea
              placeholder="Brief description of your business or what you help people with"
              value={businessProfile.description}
              onChange={(e) =>
                setBusinessProfile({
                  ...businessProfile,
                  description: e.target.value,
                })
              }
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Products / Services</label>
            <Textarea
              placeholder="List your main products or services (one per line)"
              value={businessProfile.products}
              onChange={(e) =>
                setBusinessProfile({
                  ...businessProfile,
                  products: e.target.value,
                })
              }
              className="min-h-[80px]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Input
                placeholder="e.g., Startup founders, Marketing managers"
                value={businessProfile.audience}
                onChange={(e) =>
                  setBusinessProfile({
                    ...businessProfile,
                    audience: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Key Topics</label>
              <Input
                placeholder="e.g., Productivity, Leadership, AI"
                value={businessProfile.topics}
                onChange={(e) =>
                  setBusinessProfile({
                    ...businessProfile,
                    topics: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              Things AI Should NEVER Mention
            </label>
            <Textarea
              placeholder="Competitors, sensitive topics, incorrect claims about your business..."
              value={businessProfile.doNotMention}
              onChange={(e) =>
                setBusinessProfile({
                  ...businessProfile,
                  doNotMention: e.target.value,
                })
              }
              className="min-h-[80px] border-red-200 dark:border-red-800 focus-visible:ring-red-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Context / FAQ
            </label>
            <Textarea
              placeholder="Any other information that would help AI create better content for you..."
              value={businessProfile.context}
              onChange={(e) =>
                setBusinessProfile({
                  ...businessProfile,
                  context: e.target.value,
                })
              }
              className="min-h-[100px]"
            />
          </div>

          <Button variant="linkedin" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Business Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-500" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how LinkedGrow looks for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Theme Preference</label>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your preferred theme. System follows your device&apos;s dark/light mode setting automatically.
            </p>
            {mounted && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[140px]",
                    theme === "system"
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    theme === "system" ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">System</p>
                    <p className="text-xs text-muted-foreground">Auto</p>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[140px]",
                    theme === "light"
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    theme === "light" ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Light</p>
                    <p className="text-xs text-muted-foreground">Always</p>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[140px]",
                    theme === "dark"
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    theme === "dark" ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Dark</p>
                    <p className="text-xs text-muted-foreground">Always</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Enabled via authenticator app
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <Check className="w-4 h-4" />
              Active
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
