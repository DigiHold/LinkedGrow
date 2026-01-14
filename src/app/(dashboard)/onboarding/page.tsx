"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Linkedin,
  Key,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Rocket,
  ExternalLink,
  Image as ImageIcon,
  Infinity,
  DollarSign,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Welcome", icon: Rocket },
  { id: 2, title: "LinkedIn", icon: Linkedin },
  { id: 3, title: "AI Setup", icon: Key },
  { id: 4, title: "Image AI", icon: ImageIcon },
  { id: 5, title: "Profile", icon: Building2 },
  { id: 6, title: "Done", icon: CheckCircle2 },
];

const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4, o1",
    placeholder: "sk-...",
    icon: "🤖",
    docsUrl: "https://platform.openai.com/api-keys",
    recommended: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Opus",
    placeholder: "sk-ant-...",
    icon: "🧠",
    docsUrl: "https://console.anthropic.com/settings/keys",
    recommended: false,
  },
  {
    id: "google",
    name: "Google AI",
    description: "Gemini 2.0, 1.5 Pro",
    placeholder: "AIza...",
    icon: "✨",
    docsUrl: "https://aistudio.google.com/apikey",
    recommended: false,
  },
  {
    id: "groq",
    name: "Groq",
    description: "Llama 3.3 (Ultra Fast)",
    placeholder: "gsk_...",
    icon: "⚡",
    docsUrl: "https://console.groq.com/keys",
    recommended: false,
  },
];

const imageAiProviders = [
  {
    id: "openai-dalle",
    name: "DALL-E 3",
    description: "OpenAI's best image model",
    placeholder: "sk-... (same as OpenAI)",
    icon: "🎨",
    docsUrl: "https://platform.openai.com/api-keys",
    recommended: true,
  },
  {
    id: "replicate",
    name: "Replicate",
    description: "Flux, Stable Diffusion",
    placeholder: "r8_...",
    icon: "🖼️",
    docsUrl: "https://replicate.com/account/api-tokens",
    recommended: false,
  },
  {
    id: "together",
    name: "Together AI",
    description: "Flux Schnell (Fast & Cheap)",
    placeholder: "...",
    icon: "🚀",
    docsUrl: "https://api.together.xyz/settings/api-keys",
    recommended: false,
  },
  {
    id: "fal",
    name: "Fal.ai",
    description: "Flux Pro, SDXL Lightning",
    placeholder: "...",
    icon: "⚡",
    docsUrl: "https://fal.ai/dashboard/keys",
    recommended: false,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedImageProvider, setSelectedImageProvider] = useState<string | null>(null);
  const [imageApiKey, setImageApiKey] = useState("");
  const [showImageApiKey, setShowImageApiKey] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: "",
    description: "",
    niche: "",
    audience: "",
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return true; // LinkedIn is optional
      case 3:
        return selectedProvider && apiKey.length > 10;
      case 4:
        return true; // Image AI is optional
      case 5:
        return businessProfile.name.trim().length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex flex-col">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-linkedin/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linkedin-gradient flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
              </svg>
            </div>
            <span className="text-xl font-bold">
              Linked<span className="text-linkedin">Grow</span>
            </span>
          </div>

          {currentStep > 1 && currentStep < 6 && (
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip for now
            </Button>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="relative z-10 px-4 sm:px-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    currentStep > step.id
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                      ? "bg-linkedin text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 sm:w-24 h-1 mx-1 sm:mx-2 rounded-full transition-all",
                      currentStep > step.id
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-800"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
        <div className="w-full max-w-2xl">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-linkedin-gradient flex items-center justify-center mb-6 animate-pulse-glow">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                  Welcome to LinkedGrow!
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Let&apos;s set up your account in just a few steps. This will help us
                  create better content tailored to your brand.
                </p>
                <Button variant="linkedin" size="xl" onClick={handleNext} className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Connect LinkedIn */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto rounded-xl bg-linkedin/10 flex items-center justify-center mb-4">
                  <Linkedin className="w-8 h-8 text-linkedin" />
                </div>
                <CardTitle className="text-2xl">Connect Your LinkedIn</CardTitle>
                <CardDescription className="text-base">
                  This allows you to publish posts directly from LinkedGrow
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                {isLinkedInConnected ? (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-medium text-green-600 mb-2">Connected!</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Your LinkedIn account is now connected
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      size="xl"
                      className="w-full bg-linkedin hover:bg-linkedin-dark text-white mb-4"
                      onClick={() => setIsLinkedInConnected(true)}
                    >
                      <Linkedin className="w-5 h-5 mr-2" />
                      Connect LinkedIn Account
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      We only request permissions to post on your behalf.
                      <br />
                      You can skip this and connect later.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: AI Setup */}
          {currentStep === 3 && (
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                  <Key className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl">Connect Your AI</CardTitle>
                <CardDescription className="text-base">
                  Bring your own API key for unlimited AI generations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                {/* BYOK Benefits Banner */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 mb-6 border border-green-200/50 dark:border-green-800/50">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                    <Infinity className="w-4 h-4" />
                    Why Bring Your Own Key?
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      <strong>Unlimited generations</strong> - no monthly limits
                    </li>
                    <li className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      <strong>Pay only what you use</strong> - ~$0.01-0.03 per post
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      <strong>Choose your model</strong> - GPT-4o, Claude, Gemini...
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {aiProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all relative",
                        selectedProvider === provider.id
                          ? "border-linkedin bg-linkedin/5"
                          : "border-border hover:border-linkedin/50"
                      )}
                    >
                      {provider.recommended && (
                        <span className="absolute -top-2 -right-2 bg-linkedin text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                      <span className="text-2xl mb-2 block">{provider.icon}</span>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </button>
                  ))}
                </div>

                {selectedProvider && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder={aiProviders.find((p) => p.id === selectedProvider)?.placeholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10 h-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <span>Need help?</span>
                      <a
                        href={aiProviders.find((p) => p.id === selectedProvider)?.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-linkedin hover:underline inline-flex items-center gap-1"
                      >
                        Get your {aiProviders.find((p) => p.id === selectedProvider)?.name} API key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Your API key is encrypted and stored securely. You pay the provider directly.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Image AI Setup (Optional) */}
          {currentStep === 4 && (
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto rounded-xl bg-pink-500/10 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-pink-600" />
                </div>
                <CardTitle className="text-2xl">AI Image Generation</CardTitle>
                <CardDescription className="text-base">
                  Create stunning visuals for your LinkedIn posts (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                {/* Image AI Benefits Banner */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-xl p-4 mb-6 border border-pink-200/50 dark:border-pink-800/50">
                  <h4 className="font-semibold text-pink-800 dark:text-pink-300 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Why Add Image AI?
                  </h4>
                  <ul className="text-sm text-pink-700 dark:text-pink-400 space-y-1">
                    <li>Generate custom images for your posts</li>
                    <li>Create infographics, illustrations, and visuals</li>
                    <li>Stand out with unique, AI-generated content</li>
                    <li>Pay only what you use (~$0.02-0.08 per image)</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {imageAiProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedImageProvider(provider.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all relative",
                        selectedImageProvider === provider.id
                          ? "border-pink-500 bg-pink-500/5"
                          : "border-border hover:border-pink-500/50"
                      )}
                    >
                      {provider.recommended && (
                        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                      <span className="text-2xl mb-2 block">{provider.icon}</span>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </button>
                  ))}
                </div>

                {selectedImageProvider && (
                  <div className="space-y-4">
                    {selectedImageProvider === "openai-dalle" && selectedProvider === "openai" ? (
                      <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Using your OpenAI key for DALL-E 3
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          No additional API key needed!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Input
                            type={showImageApiKey ? "text" : "password"}
                            placeholder={imageAiProviders.find((p) => p.id === selectedImageProvider)?.placeholder}
                            value={imageApiKey}
                            onChange={(e) => setImageApiKey(e.target.value)}
                            className="pr-10 h-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowImageApiKey(!showImageApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showImageApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <span>Need help?</span>
                          <a
                            href={imageAiProviders.find((p) => p.id === selectedImageProvider)?.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:underline inline-flex items-center gap-1"
                          >
                            Get your {imageAiProviders.find((p) => p.id === selectedImageProvider)?.name} API key
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center mt-4">
                  This step is optional. You can add image AI later in settings.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Business Profile */}
          {currentStep === 5 && (
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Tell Us About You</CardTitle>
                <CardDescription className="text-base">
                  This helps AI create content that matches your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Your Name or Brand *
                  </label>
                  <Input
                    placeholder="e.g., John Doe or Acme Inc"
                    value={businessProfile.name}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, name: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    What do you do?
                  </label>
                  <Textarea
                    placeholder="e.g., I help startups build their brand through content marketing..."
                    value={businessProfile.description}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Industry/Niche
                    </label>
                    <Input
                      placeholder="e.g., SaaS, Marketing"
                      value={businessProfile.niche}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, niche: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Target Audience
                    </label>
                    <Input
                      placeholder="e.g., Founders, Marketers"
                      value={businessProfile.audience}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, audience: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Complete */}
          {currentStep === 6 && (
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                  You&apos;re All Set!
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Your account is ready. Let&apos;s start creating viral LinkedIn content!
                </p>

                <div className="grid grid-cols-4 gap-3 mb-8 text-center">
                  <div className="p-3 rounded-xl bg-accent/50">
                    <Linkedin className={cn("w-5 h-5 mx-auto mb-1", isLinkedInConnected ? "text-green-600" : "text-muted-foreground")} />
                    <p className="text-xs font-medium">{isLinkedInConnected ? "Connected" : "Not set"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/50">
                    <Key className={cn("w-5 h-5 mx-auto mb-1", selectedProvider ? "text-green-600" : "text-muted-foreground")} />
                    <p className="text-xs font-medium">{selectedProvider ? "AI Ready" : "Not set"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/50">
                    <ImageIcon className={cn("w-5 h-5 mx-auto mb-1", selectedImageProvider ? "text-green-600" : "text-muted-foreground")} />
                    <p className="text-xs font-medium">{selectedImageProvider ? "Images" : "Not set"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/50">
                    <Building2 className={cn("w-5 h-5 mx-auto mb-1", businessProfile.name ? "text-green-600" : "text-muted-foreground")} />
                    <p className="text-xs font-medium">{businessProfile.name ? "Profile" : "Not set"}</p>
                  </div>
                </div>

                <Button variant="linkedin" size="xl" onClick={handleNext} className="w-full sm:w-auto">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          {currentStep > 1 && currentStep < 6 && (
            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button variant="linkedin" onClick={handleNext} disabled={!canProceed()}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
