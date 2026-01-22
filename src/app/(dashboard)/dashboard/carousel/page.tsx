"use client";

import { useState, useEffect } from "react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Layers,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Palette,
  Type,
  Layout,
  RefreshCw,
  Copy,
  Trash2,
  Check,
  X,
  ImageIcon,
  Settings,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const templates = [
  { id: "minimal", name: "Minimal", colors: "bg-white text-gray-900" },
  { id: "dark", name: "Dark Mode", colors: "bg-gray-900 text-white" },
  { id: "gradient-blue", name: "Blue Gradient", colors: "bg-linear-to-br from-blue-600 to-cyan-500 text-white" },
  { id: "gradient-purple", name: "Purple Gradient", colors: "bg-linear-to-br from-purple-600 to-pink-500 text-white" },
  { id: "linkedin", name: "LinkedIn Blue", colors: "bg-linkedin text-white" },
];

interface SlideData {
  title: string;
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export default function CarouselPage() {
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("5");
  const [template, setTemplate] = useState("minimal");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([
    { title: "Slide 1 Title", content: "Your content here..." },
    { title: "Slide 2 Title", content: "More content..." },
    { title: "Slide 3 Title", content: "Keep them engaged..." },
    { title: "Slide 4 Title", content: "Almost there..." },
    { title: "Call to Action", content: "Follow for more!" },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [hasTextApiKey, setHasTextApiKey] = useState<boolean | null>(null);
  const [hasImageApiKey, setHasImageApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check if user has both Text AI and Image AI API keys configured
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setHasTextApiKey(data.hasApiKey || false);
          setHasImageApiKey(data.hasImageApiKey || false);
        } else {
          setHasTextApiKey(false);
          setHasImageApiKey(false);
        }
      } catch {
        setHasTextApiKey(false);
        setHasImageApiKey(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };

    checkApiKeys();
  }, []);

  const handleGenerateCarousel = async () => {
    if (!topic.trim() || !hasTextApiKey || !hasImageApiKey) return;
    setIsGenerating(true);

    try {
      const count = parseInt(slideCount);

      // Step 1: Use Text AI to generate detailed image prompts for each slide
      setGenerationStep("Creating detailed prompts...");

      const promptResponse = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "carousel-prompts",
          topic,
          slideCount: count,
        }),
      });

      if (!promptResponse.ok) {
        const data = await promptResponse.json();
        throw new Error(data.error || "Failed to generate prompts");
      }

      const promptData = await promptResponse.json();
      const slidePrompts: { title: string; content: string; imagePrompt: string }[] = promptData.slides || [];

      if (slidePrompts.length === 0) {
        throw new Error("No slide prompts generated");
      }

      // Step 2: Generate images for each slide using Image AI
      const generatedSlides: SlideData[] = [];

      for (let i = 0; i < slidePrompts.length; i++) {
        setGenerationStep(`Generating image ${i + 1} of ${slidePrompts.length}...`);

        const slide = slidePrompts[i];

        try {
          const imageResponse = await fetch("/api/ai/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: slide.imagePrompt,
              aspectRatio: "1:1",
            }),
          });

          if (!imageResponse.ok) {
            const data = await imageResponse.json();
            console.error(`Failed to generate image for slide ${i + 1}:`, data.error);
            // Continue with other slides even if one fails
            generatedSlides.push({
              title: slide.title,
              content: slide.content,
              imagePrompt: slide.imagePrompt,
              imageUrl: undefined,
            });
            continue;
          }

          const imageData = await imageResponse.json();

          generatedSlides.push({
            title: slide.title,
            content: slide.content,
            imagePrompt: slide.imagePrompt,
            imageUrl: imageData.imageUrl,
          });
        } catch (err) {
          console.error(`Error generating image for slide ${i + 1}:`, err);
          generatedSlides.push({
            title: slide.title,
            content: slide.content,
            imagePrompt: slide.imagePrompt,
            imageUrl: undefined,
          });
        }
      }

      setSlides(generatedSlides);
      setCurrentSlide(0);

      const successCount = generatedSlides.filter(s => s.imageUrl).length;
      if (successCount === generatedSlides.length) {
        showToast("Carousel generated successfully!", "success");
      } else if (successCount > 0) {
        showToast(`Generated ${successCount} of ${generatedSlides.length} images`, "success");
      } else {
        showToast("Generated content but failed to create images", "error");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate carousel");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleCopyText = () => {
    const text = slides.map((slide, i) => `Slide ${i + 1}: ${slide.title}\n${slide.content}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTemplate = templates.find(t => t.id === template) || templates[0];

  // Loading state
  if (isCheckingApiKey) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Missing API keys
  if (!hasTextApiKey || !hasImageApiKey) {
    return (
      <FeatureGate feature="carouselGenerator">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              Carousel Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Create engaging multi-slide carousels for LinkedIn
            </p>
          </div>

          {/* API Keys Required Card */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="py-12 px-8">
              <div className="text-center max-w-lg mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4">API Keys Required</h3>
                <p className="text-muted-foreground mb-6">
                  The Carousel Generator uses both Text AI (to create detailed prompts) and Image AI (to generate visual slides).
                  Please configure the missing API keys:
                </p>

                <div className="space-y-3 mb-6 text-left max-w-sm mx-auto">
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    hasTextApiKey
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  )}>
                    {hasTextApiKey ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className={hasTextApiKey ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                      Text AI API Key {hasTextApiKey ? "(Configured)" : "(Missing)"}
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    hasImageApiKey
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  )}>
                    {hasImageApiKey ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className={hasImageApiKey ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                      AI Image API Key {hasImageApiKey ? "(Configured)" : "(Missing)"}
                    </span>
                  </div>
                </div>

                <Link href="/dashboard/settings/ai-api">
                  <Button className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure API Keys
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground mt-6">
                  Text AI: OpenAI, Anthropic, Google AI, Groq, Perplexity<br />
                  Image AI: OpenAI DALL-E, Google Imagen, Replicate FLUX
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="carouselGenerator">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Carousel Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create engaging multi-slide carousels for LinkedIn
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Generator */}
          <div className="space-y-6">
            {/* Topic Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Generate with AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Topic or Title</Label>
                  <Textarea
                    placeholder="e.g., 10 productivity tips for remote workers..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Slides</Label>
                    <Select value={slideCount} onValueChange={setSlideCount}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Slides</SelectItem>
                        <SelectItem value="5">5 Slides</SelectItem>
                        <SelectItem value="7">7 Slides</SelectItem>
                        <SelectItem value="10">10 Slides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Template</Label>
                    <Select value={template} onValueChange={setTemplate}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateCarousel}
                  disabled={!topic.trim() || isGenerating}
                  className="w-full bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {generationStep || "Generating..."}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Generate Carousel
                    </>
                  )}
                </Button>
                {isGenerating && (
                  <p className="text-xs text-muted-foreground text-center">
                    This may take a minute. Creating {slideCount} unique slides...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Slide Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-cyan-600" />
                    Edit Slides
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {currentSlide + 1} of {slides.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Slide Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {slides.map((slide, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg text-sm font-medium transition-colors shrink-0 relative overflow-hidden",
                        currentSlide === index
                          ? "ring-2 ring-cyan-600 ring-offset-2"
                          : "opacity-60 hover:opacity-100"
                      )}
                    >
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className={cn(
                          "w-full h-full flex items-center justify-center",
                          currentSlide === index
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          {index + 1}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSlides([...slides, { title: `Slide ${slides.length + 1}`, content: "" }]);
                      setCurrentSlide(slides.length);
                    }}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Current Slide Editor */}
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={slides[currentSlide]?.title || ""}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[currentSlide] = { ...newSlides[currentSlide], title: e.target.value };
                        setSlides(newSlides);
                      }}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={slides[currentSlide]?.content || ""}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[currentSlide] = { ...newSlides[currentSlide], content: e.target.value };
                        setSlides(newSlides);
                      }}
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>
                  {slides[currentSlide]?.imagePrompt && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Image Prompt (AI Generated)</Label>
                      <p className="text-xs text-muted-foreground mt-1 p-2 bg-muted/30 rounded-lg">
                        {slides[currentSlide].imagePrompt}
                      </p>
                    </div>
                  )}
                  {slides.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSlides = slides.filter((_, i) => i !== currentSlide);
                        setSlides(newSlides);
                        setCurrentSlide(Math.max(0, currentSlide - 1));
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Slide
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-600" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Carousel Preview */}
                <div className="relative">
                  <div
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden flex flex-col items-center justify-center text-center",
                      !slides[currentSlide]?.imageUrl && currentTemplate.colors
                    )}
                  >
                    {slides[currentSlide]?.imageUrl ? (
                      <img
                        src={slides[currentSlide].imageUrl}
                        alt={slides[currentSlide].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-8">
                        <h2 className="text-2xl font-bold mb-4">
                          {slides[currentSlide]?.title || "Title"}
                        </h2>
                        <p className="text-lg opacity-90">
                          {slides[currentSlide]?.content || "Content"}
                        </p>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {slides.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            currentSlide === index
                              ? "bg-white"
                              : "bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                    disabled={currentSlide === slides.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" onClick={handleCopyText}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Text
                      </>
                    )}
                  </Button>
                  <Button className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Design Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-600" />
                  Design Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={cn(
                        "aspect-square rounded-lg transition-all",
                        t.colors,
                        template === t.id
                          ? "ring-2 ring-cyan-600 ring-offset-2"
                          : "opacity-60 hover:opacity-100"
                      )}
                      title={t.name}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Layout className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Carousel Best Practices</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>- Keep text concise and readable</li>
                      <li>- Use a strong hook on slide 1</li>
                      <li>- End with a clear call to action</li>
                      <li>- 5-7 slides perform best</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={cn(
              "px-6 py-3 rounded-lg shadow-lg flex items-center gap-3",
              toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            )}>
              {toast.type === "success" ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
