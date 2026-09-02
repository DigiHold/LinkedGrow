"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { PlanId, canAccessFeature, UPGRADE_PATH } from "@/lib/plans";

interface ImageGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postContent: string;
  postTopic?: string;
  userPlan?: PlanId;
  hasImageApiKey?: boolean;
  hasTextApiKey?: boolean;
  userEmail?: string;
  onImageGenerated?: (imageData: { base64: string; mimeType: string; preview: string; storageUrl: string; storageKey: string }) => void;
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
  const hasAccess = true;

  // Track if we already initialized for the current modal open
  const initializedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store postContent in a ref so the async function always has the latest value
  const postContentRef = useRef(postContent);
  postContentRef.current = postContent;

  const generateImagePrompt = useCallback(async () => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStep("loading");
    setIsGeneratingPrompt(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent: postContentRef.current }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image prompt");
      }

      if (!data.prompt || !data.prompt.trim()) {
        throw new Error("AI returned an empty prompt. Please try again.");
      }

      setPrompt(data.prompt);
      setStep("prompt");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to generate prompt");
      setPrompt("");
      setStep("prompt");
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, []);

  // When modal opens: reset state and generate prompt (once)
  useEffect(() => {
    if (open) {
      if (initializedRef.current) return;
      initializedRef.current = true;

      // Reset state
      setGeneratedImage(null);
      setError(null);

      if (postContent && hasTextApiKey && hasImageApiKey && hasAccess) {
        generateImagePrompt();
      } else {
        setStep("prompt");
        setPrompt("");
      }
    } else {
      // Modal closed - reset initialized flag for next open
      initializedRef.current = false;
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [open, postContent, hasTextApiKey, hasImageApiKey, hasAccess, generateImagePrompt]);

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

  const [isUploading, setIsUploading] = useState(false);

  const handleUseImage = async () => {
    if (!generatedImage || !onImageGenerated) {
      onOpenChange(false);
      return;
    }

    // Extract base64 and mime type from data URL
    const match = generatedImage.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      onOpenChange(false);
      return;
    }

    const mimeType = match[1];
    const base64Data = match[2];

    setIsUploading(true);
    try {
      // Convert base64 to blob for R2 upload
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Get presigned URL for R2 upload
      const filename = generatedFilename || `ai-image-${Date.now().toString(36)}.webp`;
      const presignRes = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: filename,
          contentType: mimeType,
          fileSize: blob.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to prepare upload");
      }

      const { uploadUrl, key, publicUrl } = await presignRes.json();

      // Upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: blob,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image to storage");
      }

      onImageGenerated({
        base64: base64Data,
        mimeType,
        preview: generatedImage,
        storageUrl: publicUrl,
        storageKey: key,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
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
        <DialogContent className="sm:max-w-md z-200" overlayClassName="z-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-cyan-600" />
              AI Image Generation
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2">Add your image key first</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Images run on a separate key from the text models. Add one under Settings, AI keys.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Works with Google (Nano Banana), OpenAI (GPT Image) and Replicate (FLUX).
            </p>
            <Button onClick={() => window.location.href = "/dashboard/settings/ai-api"}>
              <Sparkles className="w-4 h-4 mr-2" />
              Connect a key
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
        <DialogContent className="sm:max-w-md z-200" overlayClassName="z-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-cyan-600" />
              AI Image Generation
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="font-semibold mb-2">Pro Feature</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              AI image generation is available on the Pro plan and above. Upgrade to create stunning visuals for your LinkedIn posts.
            </p>
            <a href={UPGRADE_PATH}>
              <Button variant="linkedin">
                Upgrade to Pro
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto z-200" overlayClassName="z-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-cyan-600" />
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
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Uses your Image API key (BYOK) - you pay directly to Google/OpenAI
            </p>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6 animate-pulse">
              <Image className="w-10 h-10 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-600" />
              <span className="font-medium">Generating your image...</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
              <Button onClick={handleUseImage} disabled={isUploading} className="flex-1 bg-green-600 hover:bg-green-700">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isUploading ? "Saving..." : "Use This Image"}
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Image will be automatically attached to your LinkedIn post
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
