"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FabricObject } from "fabric";
import { jsPDF } from "jspdf";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Layers,
  Sparkles,
  Download,
  Settings,
  Loader2,
  AlertTriangle,
  FileDown,
  Images,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  LayoutTemplate,
  Wand2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Import new carousel components
import { CanvasWorkspace, CanvasWorkspaceRef, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/components/dashboard/carousel/CanvasWorkspace";
import { ElementToolbar } from "@/components/dashboard/carousel/ElementToolbar";
import { ElementProperties } from "@/components/dashboard/carousel/ElementProperties";
import { SlideManager, SlideState } from "@/components/dashboard/carousel/SlideManager";
import { BrandingSettings } from "@/components/dashboard/carousel/branding-settings";
import { TemplateGallery } from "@/components/dashboard/carousel/template-gallery";
import type { BrandingData } from "@/components/dashboard/carousel/types";
import { carouselTemplates, type CarouselTemplate } from "@/lib/carousel-templates";

// Generate unique ID
const generateId = () => `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function CarouselPage() {
  // Canvas ref
  const canvasRef = useRef<CanvasWorkspaceRef>(null);

  // Slides state
  const [slides, setSlides] = useState<SlideState[]>([
    { id: generateId(), canvasJSON: '', thumbnail: '' }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Selected element
  const [selectedElement, setSelectedElement] = useState<FabricObject | null>(null);

  // Branding state
  const [branding, setBranding] = useState<BrandingData>({});

  // UI state
  const [zoom, setZoom] = useState(0.4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showBrandingPanel, setShowBrandingPanel] = useState(false);
  const [showBrandingElements, setShowBrandingElements] = useState({
    logo: true,
    avatar: true,
    handle: true,
    website: false,
  });
  // Responsive sidebar state
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // AI Generation state
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("7");
  const [showAIDialog, setShowAIDialog] = useState(false);

  // API keys state
  const [hasTextApiKey, setHasTextApiKey] = useState<boolean | null>(null);
  const [hasImageApiKey, setHasImageApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'starter' | 'pro' | 'business'>('pro');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
          setUserPlan(data.plan || 'free');
          // Set branding data from API response
          setBranding({
            logoUrl: data.brandLogoUrl || undefined,
            avatarUrl: data.brandAvatarUrl || undefined,
            handle: data.brandHandle || undefined,
          });
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

  // Save current slide before switching
  const saveCurrentSlide = useCallback(() => {
    if (!canvasRef.current) return;

    const canvasJSON = canvasRef.current.exportToJSON();
    const thumbnail = canvasRef.current.exportToDataURL();

    setSlides(prev => prev.map((slide, index) =>
      index === currentSlideIndex
        ? { ...slide, canvasJSON, thumbnail }
        : slide
    ));
  }, [currentSlideIndex]);

  // Load slide when switching
  const loadSlide = useCallback((index: number) => {
    if (!canvasRef.current || index >= slides.length) return;

    const slide = slides[index];
    if (slide.canvasJSON) {
      canvasRef.current.loadFromJSON(slide.canvasJSON);
    } else {
      canvasRef.current.clearCanvas();
    }
  }, [slides]);

  // Handle slide selection
  const handleSlideSelect = useCallback((index: number) => {
    saveCurrentSlide();
    setCurrentSlideIndex(index);
    // Load the new slide after a brief delay to ensure state is updated
    setTimeout(() => loadSlide(index), 50);
  }, [saveCurrentSlide, loadSlide]);

  // Handle adding a new slide
  const handleSlideAdd = useCallback(() => {
    saveCurrentSlide();
    const newSlide: SlideState = {
      id: generateId(),
      canvasJSON: '',
      thumbnail: '',
    };
    setSlides(prev => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
    setTimeout(() => {
      canvasRef.current?.clearCanvas();
    }, 50);
  }, [saveCurrentSlide, slides.length]);

  // Handle duplicating a slide
  const handleSlideDuplicate = useCallback((index: number) => {
    saveCurrentSlide();
    const slideToDuplicate = slides[index];
    const newSlide: SlideState = {
      id: generateId(),
      canvasJSON: slideToDuplicate.canvasJSON,
      thumbnail: slideToDuplicate.thumbnail,
    };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrentSlideIndex(index + 1);
    setTimeout(() => loadSlide(index + 1), 50);
  }, [saveCurrentSlide, slides, loadSlide]);

  // Handle deleting a slide
  const handleSlideDelete = useCallback((index: number) => {
    if (slides.length <= 1) return;

    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);

    const newIndex = Math.max(0, Math.min(currentSlideIndex, newSlides.length - 1));
    setCurrentSlideIndex(newIndex);
    setTimeout(() => loadSlide(newIndex), 50);
  }, [slides, currentSlideIndex, loadSlide]);

  // Handle slides reorder
  const handleSlidesReorder = useCallback((newSlides: SlideState[]) => {
    saveCurrentSlide();
    setSlides(newSlides);
  }, [saveCurrentSlide]);

  // Handle canvas change (update thumbnail)
  const handleCanvasChange = useCallback(() => {
    if (!canvasRef.current) return;

    const thumbnail = canvasRef.current.exportToDataURL();
    setSlides(prev => prev.map((slide, index) =>
      index === currentSlideIndex
        ? { ...slide, thumbnail }
        : slide
    ));
  }, [currentSlideIndex]);

  // Handle background change
  const handleBackgroundChange = useCallback((type: 'solid' | 'gradient' | 'image', value: string) => {
    canvasRef.current?.setBackground(type, value);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  }, []);

  // Handle AI image generation
  const handleAIImageGenerate = useCallback(async (prompt: string): Promise<string> => {
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspectRatio: '4:5',
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.imageUrl;
  }, []);

  // Handle AI carousel generation
  const handleGenerateCarousel = async () => {
    if (!topic.trim() || !hasTextApiKey) return;
    setIsGenerating(true);
    setShowAIDialog(false);

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
      const generatedSlides: { title: string; content: string }[] = data.slides || [];

      if (generatedSlides.length === 0) {
        throw new Error("No content generated");
      }

      // Create new slides with generated content
      const newSlides: SlideState[] = generatedSlides.map((slide, index) => ({
        id: generateId(),
        canvasJSON: '', // Will be populated when loaded
        thumbnail: '',
      }));

      setSlides(newSlides);
      setCurrentSlideIndex(0);

      // Load first slide with content
      setTimeout(() => {
        if (!canvasRef.current) return;

        canvasRef.current.clearCanvas();

        // Add title
        canvasRef.current.addText({
          text: generatedSlides[0].title,
          fontSize: 72,
          fontWeight: 'bold',
          top: 200,
        });

        // Add content
        canvasRef.current.addText({
          text: generatedSlides[0].content,
          fontSize: 36,
          fontWeight: 'normal',
          top: 400,
        });

        // Store generated content for other slides
        (window as unknown as { __generatedSlides: typeof generatedSlides }).__generatedSlides = generatedSlides;
      }, 100);

      showToast("Carousel generated! Edit each slide as needed.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate carousel");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Export functions
  const handleDownloadPDF = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    showToast("Generating PDF...", "success");

    try {
      saveCurrentSlide();

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [CANVAS_WIDTH, CANVAS_HEIGHT],
        hotfixes: ['px_scaling'],
      });

      for (let i = 0; i < slides.length; i++) {
        setGenerationStep(`Exporting slide ${i + 1} of ${slides.length}...`);

        // Load slide if not current
        if (i !== currentSlideIndex && slides[i].canvasJSON) {
          canvasRef.current.loadFromJSON(slides[i].canvasJSON);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const dataUrl = canvasRef.current.exportToDataURL();

        if (i > 0) {
          pdf.addPage([CANVAS_WIDTH, CANVAS_HEIGHT]);
        }

        pdf.addImage(dataUrl, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Restore current slide
      if (slides[currentSlideIndex].canvasJSON) {
        canvasRef.current.loadFromJSON(slides[currentSlideIndex].canvasJSON);
      }

      const fileName = topic
        ? `carousel-${topic.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.pdf`
        : 'carousel.pdf';
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
    if (!canvasRef.current) return;
    setIsExporting(true);
    showToast("Generating images...", "success");

    try {
      saveCurrentSlide();

      for (let i = 0; i < slides.length; i++) {
        setGenerationStep(`Exporting slide ${i + 1} of ${slides.length}...`);

        // Load slide if not current
        if (i !== currentSlideIndex && slides[i].canvasJSON) {
          canvasRef.current.loadFromJSON(slides[i].canvasJSON);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const dataUrl = canvasRef.current.exportToDataURL();

        const link = document.createElement('a');
        link.download = `slide-${i + 1}.png`;
        link.href = dataUrl;
        link.click();

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Restore current slide
      if (slides[currentSlideIndex].canvasJSON) {
        canvasRef.current.loadFromJSON(slides[currentSlideIndex].canvasJSON);
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

  // Handle template selection
  const handleTemplateSelect = (template: CarouselTemplate) => {
    if (!canvasRef.current) return;

    // Clear canvas
    canvasRef.current.clearCanvas();

    // Apply background
    canvasRef.current.setBackground(template.background.type, template.background.value);

    // Add template elements
    if (template.elements && template.elements.length > 0) {
      template.elements.forEach(element => {
        if (element.type === 'text') {
          canvasRef.current?.addText({
            text: element.text,
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fill: element.fill,
            textAlign: element.textAlign,
            left: element.left,
            top: element.top,
            width: element.width,
            opacity: element.opacity,
          });
        } else if (element.type === 'shape' && element.shapeType) {
          canvasRef.current?.addShapeWithOptions({
            shapeType: element.shapeType,
            left: element.left,
            top: element.top,
            width: element.width,
            height: element.height,
            fill: element.fill,
            stroke: element.stroke,
            strokeWidth: element.strokeWidth,
            opacity: element.opacity,
            rx: element.rx,
            ry: element.ry,
          });
        } else if (element.type === 'line') {
          canvasRef.current?.addShapeWithOptions({
            shapeType: 'line',
            left: element.left,
            top: element.top,
            x1: element.x1,
            y1: element.y1,
            x2: element.x2,
            y2: element.y2,
            stroke: element.stroke ?? element.fill,
            strokeWidth: element.strokeWidth,
            opacity: element.opacity,
          });
        }
      });
    }

    setShowTemplateGallery(false);
    showToast(`Template "${template.name}" applied!`, "success");
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));

  // Loading state
  if (isCheckingApiKey) {
    return (
      <div className="h-screen flex items-center justify-center">
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
        <div className="max-w-3xl mx-auto p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              Carousel Editor
            </h1>
            <p className="text-muted-foreground mt-1">
              Create engaging multi-slide carousels for LinkedIn
            </p>
          </div>

          <div className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-8">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Text AI API Key Required</h3>
              <p className="text-muted-foreground mb-6">
                The Carousel Editor uses AI to generate content. Please configure your Text AI API key to unlock AI features.
              </p>
              <Link href="/dashboard/settings/ai-api">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure API Keys
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="carouselGenerator">
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-14 border-b bg-background flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-semibold">Carousel Editor</h1>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => canvasRef.current?.undo()}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => canvasRef.current?.redo()}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
                disabled={zoom <= 0.2}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
                disabled={zoom >= 1}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Generate Button */}
            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? generationStep || "Generating..." : "AI Generate"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Generate Carousel with AI
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
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
                  <div>
                    <Label>Number of Slides</Label>
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
                  <Button
                    onClick={handleGenerateCarousel}
                    disabled={!topic.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Carousel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Templates Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateGallery(true)}
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Templates
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Export Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImages}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Images className="w-4 h-4 mr-2" />
              )}
              Images
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar Toggle Button (visible on small screens or when sidebar hidden) */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-2 top-2 z-20 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm",
              showLeftSidebar && "md:hidden"
            )}
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          >
            {showLeftSidebar ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>

          {/* Left Sidebar - Element Toolbar */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            showLeftSidebar ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden",
            "hidden md:block",
            showLeftSidebar && "block! absolute md:relative z-10 h-full bg-background shadow-lg md:shadow-none"
          )}>
            <ElementToolbar
              canvasRef={canvasRef}
              branding={branding}
              onImageUpload={handleImageUpload}
              onAIImageGenerate={hasImageApiKey ? handleAIImageGenerate : undefined}
            />
          </div>

          {/* Canvas Workspace */}
          <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900 overflow-auto p-4">
            <CanvasWorkspace
              ref={canvasRef}
              zoom={zoom}
              onSelectionChange={setSelectedElement}
              onCanvasChange={handleCanvasChange}
              className="m-auto"
            />
          </div>

          {/* Right Sidebar Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-2 z-20 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm",
              showRightSidebar && "md:hidden"
            )}
            onClick={() => setShowRightSidebar(!showRightSidebar)}
          >
            {showRightSidebar ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </Button>

          {/* Right Sidebar - Properties Panel */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            showRightSidebar ? "w-72 opacity-100" : "w-0 opacity-0 overflow-hidden",
            "hidden md:block",
            showRightSidebar && "block! absolute md:relative right-0 z-10 h-full bg-background shadow-lg md:shadow-none"
          )}>
            <ElementProperties
              selectedElement={selectedElement}
              canvasRef={canvasRef}
              onBackgroundChange={handleBackgroundChange}
            />
          </div>
        </div>

        {/* Bottom - Slide Manager */}
        <SlideManager
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onSlideSelect={handleSlideSelect}
          onSlideAdd={handleSlideAdd}
          onSlideDuplicate={handleSlideDuplicate}
          onSlideDelete={handleSlideDelete}
          onSlidesReorder={handleSlidesReorder}
        />

        {/* Template Gallery Modal */}
        <TemplateGallery
          open={showTemplateGallery}
          onOpenChange={setShowTemplateGallery}
          selectedTemplateId=""
          onSelectTemplate={handleTemplateSelect}
          userPlan={userPlan}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-44 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
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

        {/* Export Progress */}
        {isExporting && generationStep && (
          <div className="fixed bottom-44 left-1/2 -translate-x-1/2 z-40">
            <div className="px-4 py-2 rounded-lg bg-background border shadow-lg">
              <p className="text-sm text-muted-foreground">{generationStep}</p>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
