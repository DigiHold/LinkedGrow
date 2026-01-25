"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  RefreshCw,
  Copy,
  Trash2,
  Check,
  X,
  ImageIcon,
  Settings,
  Loader2,
  AlertTriangle,
  Layout,
  GripVertical,
  FileDown,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Import carousel components
import { SlideCanvas, createInitialSlides, createDefaultSlide, type SlideData, type BrandingData } from "@/components/dashboard/carousel/slide-canvas";
import { SlideEditor } from "@/components/dashboard/carousel/slide-editor";
import { TemplateGallery, TemplateSelect } from "@/components/dashboard/carousel/template-gallery";
import { BrandingSettings } from "@/components/dashboard/carousel/branding-settings";
import { carouselTemplates, defaultTemplate, getTemplateById, type CarouselTemplate } from "@/lib/carousel-templates";

export default function CarouselPage() {
  // Core state
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("7");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>(() => createInitialSlides(5));
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate>(defaultTemplate);

  // Branding state
  const [branding, setBranding] = useState<BrandingData>({});
  const [showBrandingElements, setShowBrandingElements] = useState({
    logo: true,
    avatar: true,
    handle: true,
    website: false,
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'branding'>('content');

  // API keys state
  const [hasTextApiKey, setHasTextApiKey] = useState<boolean | null>(null);
  const [hasImageApiKey, setHasImageApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'starter' | 'pro' | 'business'>('pro');

  // Toast and copy state
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Refs for export
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hiddenSlideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check API keys on mount
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setHasTextApiKey(data.hasApiKey || false);
          setHasImageApiKey(data.hasImageApiKey || false);
          setUserPlan(data.plan || 'pro');
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

  // Update slide refs array when slides change
  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, slides.length);
    hiddenSlideRefs.current = hiddenSlideRefs.current.slice(0, slides.length);
  }, [slides.length]);

  // Handlers
  const handleTemplateChange = (template: CarouselTemplate) => {
    setSelectedTemplate(template);
  };

  const handleSlideChange = useCallback((updatedSlide: SlideData) => {
    setSlides(prev => prev.map((s, i) => i === currentSlide ? updatedSlide : s));
  }, [currentSlide]);

  const handleAddSlide = () => {
    const newSlide = createDefaultSlide('content', slides.length);
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== currentSlide);
    setSlides(newSlides);
    setCurrentSlide(Math.max(0, currentSlide - 1));
  };

  const handleMoveSlide = (direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentSlide - 1 : currentSlide + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const newSlides = [...slides];
    [newSlides[currentSlide], newSlides[newIndex]] = [newSlides[newIndex], newSlides[currentSlide]];
    setSlides(newSlides);
    setCurrentSlide(newIndex);
  };

  const handleGenerateCarousel = async () => {
    if (!topic.trim() || !hasTextApiKey) return;
    setIsGenerating(true);

    try {
      const count = parseInt(slideCount);
      setGenerationStep("Creating slide content...");

      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "carousel-prompts",
          topic,
          slideCount: count,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate content");
      }

      const data = await response.json();
      const generatedSlides: { title: string; content: string; imagePrompt: string }[] = data.slides || [];

      if (generatedSlides.length === 0) {
        throw new Error("No content generated");
      }

      // Convert to SlideData format
      const newSlides: SlideData[] = generatedSlides.map((slide, index) => ({
        id: `slide-${Date.now()}-${index}`,
        type: index === 0 ? 'hook' : index === generatedSlides.length - 1 ? 'cta' : 'content',
        title: slide.title,
        content: slide.content,
        backgroundType: 'template',
        showBranding: true,
        showProgressBar: true,
      }));

      setSlides(newSlides);
      setCurrentSlide(0);
      showToast("Carousel generated successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate carousel");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleGenerateBackground = async () => {
    if (!hasImageApiKey) return;
    setIsGeneratingBackground(true);

    try {
      const currentSlideData = slides[currentSlide];
      const prompt = `Professional, abstract background for a LinkedIn carousel slide about: ${currentSlideData.title}. ${currentSlideData.content}. Clean, modern, subtle design with soft gradients and minimal elements. No text or logos.`;

      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio: "4:5",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate image");
      }

      const data = await response.json();

      handleSlideChange({
        ...currentSlideData,
        backgroundType: 'ai-image',
        backgroundImageUrl: data.imageUrl,
      });

      showToast("Background generated!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate background");
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  const handleCopyText = () => {
    const text = slides.map((slide, i) => `Slide ${i + 1}: ${slide.title}\n${slide.content}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    showToast("Generating PDF...", "success");

    try {
      // Create PDF with carousel dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1080, 1350],
        hotfixes: ['px_scaling'],
      });

      // Generate each slide
      for (let i = 0; i < slides.length; i++) {
        setGenerationStep(`Exporting slide ${i + 1} of ${slides.length}...`);

        const slideElement = hiddenSlideRefs.current[i];
        if (!slideElement) continue;

        // Render slide to PNG
        const dataUrl = await toPng(slideElement, {
          width: 1080,
          height: 1350,
          pixelRatio: 1,
          cacheBust: true,
        });

        // Add page (except for first slide)
        if (i > 0) {
          pdf.addPage([1080, 1350]);
        }

        // Add image to PDF
        pdf.addImage(dataUrl, 'PNG', 0, 0, 1080, 1350);
      }

      // Download PDF
      const fileName = topic ? `carousel-${topic.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.pdf` : 'carousel.pdf';
      pdf.save(fileName);
      showToast("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("Failed to generate PDF");
    } finally {
      setIsExporting(false);
      setGenerationStep("");
    }
  };

  const handleDownloadImages = async () => {
    setIsExporting(true);
    showToast("Generating images...", "success");

    try {
      for (let i = 0; i < slides.length; i++) {
        setGenerationStep(`Exporting slide ${i + 1} of ${slides.length}...`);

        const slideElement = hiddenSlideRefs.current[i];
        if (!slideElement) continue;

        const dataUrl = await toPng(slideElement, {
          width: 1080,
          height: 1350,
          pixelRatio: 1,
          cacheBust: true,
        });

        // Create download link
        const link = document.createElement('a');
        link.download = `slide-${i + 1}.png`;
        link.href = dataUrl;
        link.click();

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      showToast("Images downloaded!", "success");
    } catch (err) {
      console.error("Image export error:", err);
      showToast("Failed to export images");
    } finally {
      setIsExporting(false);
      setGenerationStep("");
    }
  };

  // Get branding data with visible elements only
  const getVisibleBranding = (): BrandingData => {
    return {
      logoUrl: showBrandingElements.logo ? branding.logoUrl : undefined,
      avatarUrl: showBrandingElements.avatar ? branding.avatarUrl : undefined,
      handle: showBrandingElements.handle ? branding.handle : undefined,
      website: showBrandingElements.website ? branding.website : undefined,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
    };
  };

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

  // Missing Text API key
  if (!hasTextApiKey) {
    return (
      <FeatureGate feature="carouselGenerator">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              Carousel Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Create engaging multi-slide carousels for LinkedIn
            </p>
          </div>

          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="py-12 px-8">
              <div className="text-center max-w-lg mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Text AI API Key Required</h3>
                <p className="text-muted-foreground mb-6">
                  The Carousel Generator uses AI to create slide content. Please configure your Text AI API key to get started.
                </p>
                <Link href="/dashboard/settings/ai-api">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure API Keys
                  </Button>
                </Link>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Carousel Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create professional carousels with 20+ templates
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Editor */}
          <div className="space-y-6">
            {/* AI Generator */}
            <Card>
              <CardHeader className="pb-3">
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
                    rows={2}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Slides</Label>
                    <Select value={slideCount} onValueChange={setSlideCount}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Slides</SelectItem>
                        <SelectItem value="7">7 Slides</SelectItem>
                        <SelectItem value="10">10 Slides</SelectItem>
                        <SelectItem value="12">12 Slides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <TemplateSelect
                      selectedTemplateId={selectedTemplate.id}
                      onSelectTemplate={handleTemplateChange}
                      onOpenGallery={() => setShowTemplateGallery(true)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleGenerateCarousel}
                  disabled={!topic.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {generationStep || "Generating..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Carousel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Slide Navigator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-cyan-600" />
                    Slides
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {currentSlide + 1} of {slides.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentSlide(index)}
                      className={cn(
                        "relative w-14 h-[70px] rounded-lg text-sm font-medium transition-all shrink-0 overflow-hidden group",
                        currentSlide === index
                          ? "ring-2 ring-cyan-600 ring-offset-2"
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <SlideCanvas
                        slide={slide}
                        template={selectedTemplate}
                        slideIndex={index}
                        totalSlides={slides.length}
                        branding={getVisibleBranding()}
                        isPreview={true}
                        className="scale-[0.13] origin-top-left"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 drop-shadow">
                          {index + 1}
                        </span>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={handleAddSlide}
                    className="w-14 h-[70px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Slide reorder buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveSlide('up')}
                    disabled={currentSlide === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Move Left
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveSlide('down')}
                    disabled={currentSlide === slides.length - 1}
                    className="flex-1"
                  >
                    Move Right
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Slide Editor Tabs */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex gap-1 border-b">
                  {(['content', 'style', 'branding'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors capitalize",
                        activeTab === tab
                          ? "text-cyan-600 border-b-2 border-cyan-600"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'content' && slides[currentSlide] && (
                  <SlideEditor
                    slide={slides[currentSlide]}
                    onSlideChange={handleSlideChange}
                    onGenerateBackground={handleGenerateBackground}
                    onDeleteSlide={handleDeleteSlide}
                    isGeneratingBackground={isGeneratingBackground}
                    canDelete={slides.length > 1}
                    hasImageApiKey={hasImageApiKey || false}
                  />
                )}

                {activeTab === 'style' && (
                  <div className="space-y-4">
                    <TemplateSelect
                      selectedTemplateId={selectedTemplate.id}
                      onSelectTemplate={handleTemplateChange}
                      onOpenGallery={() => setShowTemplateGallery(true)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateGallery(true)}
                      className="w-full"
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      Browse All Templates
                    </Button>
                  </div>
                )}

                {activeTab === 'branding' && (
                  <BrandingSettings
                    branding={branding}
                    onBrandingChange={setBranding}
                    showElements={showBrandingElements}
                    onShowElementsChange={setShowBrandingElements}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-600" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Carousel Preview */}
                <div className="relative">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-muted">
                    {slides[currentSlide] && (
                      <SlideCanvas
                        ref={(el) => { slideRefs.current[currentSlide] = el; }}
                        slide={slides[currentSlide]}
                        template={selectedTemplate}
                        slideIndex={currentSlide}
                        totalSlides={slides.length}
                        branding={getVisibleBranding()}
                        isPreview={true}
                        className="w-full h-full"
                      />
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 flex items-center justify-center disabled:opacity-30 shadow-lg transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                    disabled={currentSlide === slides.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 flex items-center justify-center disabled:opacity-30 shadow-lg transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Export Actions */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleCopyText}
                    disabled={isExporting}
                  >
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
                  <Button
                    variant="outline"
                    onClick={handleDownloadImages}
                    disabled={isExporting}
                  >
                    {isExporting && generationStep.includes('Exporting') ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Images className="w-4 h-4 mr-2" />
                    )}
                    Images
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isExporting && generationStep.includes('Exporting') ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4 mr-2" />
                    )}
                    PDF
                  </Button>
                </div>

                {isExporting && generationStep && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {generationStep}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Carousel Best Practices</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>- Start with a bold hook on slide 1</li>
                      <li>- Keep text to 25-50 words per slide</li>
                      <li>- Use 6-10 slides for best engagement</li>
                      <li>- End with a clear call to action</li>
                      <li>- Add your branding for recognition</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden slides for full-resolution export */}
        <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
          {slides.map((slide, index) => (
            <div
              key={`export-${slide.id}`}
              ref={(el) => { hiddenSlideRefs.current[index] = el; }}
            >
              <SlideCanvas
                slide={slide}
                template={selectedTemplate}
                slideIndex={index}
                totalSlides={slides.length}
                branding={getVisibleBranding()}
                isPreview={false}
              />
            </div>
          ))}
        </div>

        {/* Template Gallery Modal */}
        <TemplateGallery
          open={showTemplateGallery}
          onOpenChange={setShowTemplateGallery}
          selectedTemplateId={selectedTemplate.id}
          onSelectTemplate={handleTemplateChange}
          userPlan={userPlan}
        />

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
