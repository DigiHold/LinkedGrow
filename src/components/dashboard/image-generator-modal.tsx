"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Image,
  Sparkles,
  RefreshCw,
  Download,
  Check,
  Wand2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PlanId, canAccessFeature } from "@/lib/plans";
import { redirectToCheckout } from "@/lib/checkout";

interface ImageGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postContent: string;
  postTopic?: string;
  userPlan?: PlanId;
  hasImageApiKey?: boolean;
  hasTextApiKey?: boolean;
  userEmail?: string;
  onImageGenerated?: (imageData: { base64: string; mimeType: string; filename: string }) => void;
}

export function ImageGeneratorModal({
  open,
  onOpenChange,
  postContent,
  userPlan = "free",
  hasImageApiKey = false,
  hasTextApiKey = false,
  userEmail = "",
  onImageGenerated,
}: ImageGeneratorModalProps) {
  const [step, setStep] = useState<"loading" | "prompt" | "generating" | "result">("loading");
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Check if user has access to image generation
  const hasAccess = canAccessFeature(userPlan, "imageGeneration");

  // Generate image prompt using AI when modal opens
  useEffect(() => {
    if (open && postContent && hasTextApiKey && hasImageApiKey && hasAccess) {
      generateImagePrompt();
    } else if (open) {
      // If no text API key, show empty prompt for manual entry
      setStep("prompt");
      setPrompt("");
      setGeneratedImage(null);
      setError(null);
    }
  }, [open, postContent, hasTextApiKey, hasImageApiKey, hasAccess]);

  const generateImagePrompt = async () => {
    setStep("loading");
    setIsGeneratingPrompt(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image prompt");
      }

      setPrompt(data.prompt);
      setStep("prompt");
    } catch (err) {
      // If prompt generation fails, show empty prompt for manual entry
      setError(err instanceof Error ? err.message : "Failed to generate prompt");
      setPrompt("");
      setStep("prompt");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStep("generating");
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, postContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedImage(data.imageUrl);
      setGeneratedFilename(data.filename || "image.webp");
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      setStep("prompt");
    }
  };

  const handleUseImage = () => {
    if (generatedImage && onImageGenerated) {
      // Extract base64 and mime type from data URL
      const match = generatedImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        onImageGenerated({
          base64: match[2],
          mimeType: match[1],
          filename: generatedFilename,
        });
      }
    }
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = generatedFilename || `linkedin-image-${Date.now().toString(36)}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = () => {
    setStep("prompt");
    setGeneratedImage(null);
  };

  const handleRegeneratePrompt = () => {
    generateImagePrompt();
  };

  // No Image API key connected
  if (!hasImageApiKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-600" />
              AI Image Generation
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2">AI Image API Key Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To generate AI images, you need to add an Image AI API key. Go to Settings &gt; AI API and scroll down to the &quot;AI Image Generation&quot; section.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported providers: Google AI (Gemini), OpenAI (DALL-E 3), Replicate (FLUX)
            </p>
            <Button onClick={() => window.location.href = "/dashboard/settings/ai-api"}>
              <Sparkles className="w-4 h-4 mr-2" />
              Configure AI Image API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No access to feature
  if (!hasAccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-600" />
              AI Image Generation
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Pro Feature</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI image generation is available on the Pro plan and above. Upgrade to create stunning visuals for your LinkedIn posts.
            </p>
            <Button
              variant="linkedin"
              onClick={() => redirectToCheckout("pro", userEmail)}
            >
              Upgrade to Pro - $39/mo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-600" />
            Generate AI Image
          </DialogTitle>
          <DialogDescription>
            Create a custom image for your LinkedIn post using AI
          </DialogDescription>
        </DialogHeader>

        {/* Loading Step - Generating Prompt */}
        {step === "loading" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
              <span className="font-medium">Analyzing your post...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI is creating a detailed image prompt based on your post content
            </p>
          </div>
        )}

        {/* Prompt Step */}
        {step === "prompt" && (
          <div className="space-y-4">
            {!hasTextApiKey && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Add a Text AI API key in{" "}
                <a href="/dashboard/settings/ai-api" className="underline font-medium hover:text-amber-800 dark:hover:text-amber-200">
                  Settings &gt; AI API
                </a>{" "}
                to auto-generate detailed image prompts from your post content.
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Image Prompt</label>
                {hasTextApiKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegeneratePrompt}
                    disabled={isGeneratingPrompt}
                    className="text-xs h-7"
                  >
                    {isGeneratingPrompt ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Regenerate Prompt
                  </Button>
                )}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={hasTextApiKey
                  ? "AI is generating a detailed prompt based on your post..."
                  : "Describe the image you want to generate. Be specific about the scene, lighting, composition, and style..."
                }
                className="min-h-[200px] text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {prompt
                  ? "AI generated this prompt from your post. Feel free to edit it!"
                  : "Write a detailed description of the image you want."
                }
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Uses your Image API key (BYOK) - you pay directly to Google/OpenAI
            </p>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 animate-pulse">
              <Image className="w-10 h-10 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <span className="font-medium">Generating your image...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This usually takes 10-30 seconds depending on your AI provider
            </p>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && generatedImage && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border bg-accent/30">
              <img
                src={generatedImage}
                alt="Generated image"
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRegenerate} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button onClick={handleUseImage} className="flex-1 bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Use This Image
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Image will be automatically attached to your LinkedIn post
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
