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
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Save,
  FolderOpen,
  Copy,
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
import { MyCarousels } from "@/components/dashboard/carousel/MyCarousels";
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
  const [elementUpdateTrigger, setElementUpdateTrigger] = useState(0);

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

  // Save Template state
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // My Carousels state
  const [showMyCarousels, setShowMyCarousels] = useState(false);
  const [showSaveCarouselDialog, setShowSaveCarouselDialog] = useState(false);
  const [carouselName, setCarouselName] = useState("");
  const [carouselDescription, setCarouselDescription] = useState("");
  const [isSavingCarousel, setIsSavingCarousel] = useState(false);
  const [currentCarouselId, setCurrentCarouselId] = useState<string | null>(null); // Track loaded carousel for updates

  // API keys state
  const [hasTextApiKey, setHasTextApiKey] = useState<boolean | null>(null);
  const [hasImageApiKey, setHasImageApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
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
    if (!canvasRef.current || index === currentSlideIndex) return;

    // Save current slide state directly from canvas
    const canvasJSON = canvasRef.current.exportToJSON();
    const thumbnail = canvasRef.current.exportToDataURL();

    // Get the slide we're switching to before any state updates
    const targetSlideJSON = slides[index].canvasJSON;

    // Update state with functional update
    setSlides(prev => prev.map((slide, i) =>
      i === currentSlideIndex
        ? { ...slide, canvasJSON, thumbnail }
        : slide
    ));

    setCurrentSlideIndex(index);

    // Load the target slide using the JSON we captured
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          if (targetSlideJSON) {
            canvasRef.current.loadFromJSON(targetSlideJSON);
          } else {
            canvasRef.current.clearCanvas();
          }
        }
      });
    });
  }, [currentSlideIndex, slides]);

  // Handle adding a new slide
  const handleSlideAdd = useCallback(() => {
    if (!canvasRef.current) return;

    // Save current slide state directly from canvas
    const canvasJSON = canvasRef.current.exportToJSON();
    const thumbnail = canvasRef.current.exportToDataURL();

    const newSlide: SlideState = {
      id: generateId(),
      canvasJSON: '',
      thumbnail: '',
    };

    // Use functional update to ensure we have the latest state
    setSlides(prev => {
      const updated = prev.map((slide, i) =>
        i === currentSlideIndex
          ? { ...slide, canvasJSON, thumbnail }
          : slide
      );
      return [...updated, newSlide];
    });

    setCurrentSlideIndex(slides.length);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        canvasRef.current?.clearCanvas();
      });
    });
  }, [currentSlideIndex, slides.length]);

  // Handle duplicating a slide
  const handleSlideDuplicate = useCallback((index: number) => {
    if (!canvasRef.current) return;

    // IMPORTANT: Capture the JSON BEFORE any state changes
    // If duplicating the current slide, get fresh data from canvas
    let canvasJSON: string;
    let thumbnail: string;

    if (index === currentSlideIndex) {
      // Get current canvas state directly (fresh, not from stale state)
      canvasJSON = canvasRef.current.exportToJSON();
      thumbnail = canvasRef.current.exportToDataURL();
    } else {
      // Duplicating a different slide - use its saved state
      canvasJSON = slides[index].canvasJSON;
      thumbnail = slides[index].thumbnail;
    }

    // Store the JSON in a variable that won't be affected by state changes
    const capturedJSON = canvasJSON;

    const newSlide: SlideState = {
      id: generateId(),
      canvasJSON: capturedJSON,
      thumbnail,
    };

    // Use functional update to ensure we have the latest state
    setSlides(prev => {
      const newSlides = [...prev];
      // Also update the current slide if we're duplicating it
      if (index === currentSlideIndex) {
        newSlides[index] = { ...newSlides[index], canvasJSON: capturedJSON, thumbnail };
      }
      newSlides.splice(index + 1, 0, newSlide);
      return newSlides;
    });

    setCurrentSlideIndex(index + 1);

    // Load the duplicated slide - use requestAnimationFrame for proper timing
    // This ensures the state updates have been processed
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (canvasRef.current && capturedJSON) {
          canvasRef.current.loadFromJSON(capturedJSON);
        }
      });
    });
  }, [currentSlideIndex, slides]);

  // Handle deleting a slide
  const handleSlideDelete = useCallback((index: number) => {
    if (slides.length <= 1) return;

    // Calculate which slide to show after deletion
    const newLength = slides.length - 1;
    const newIndex = index >= newLength ? newLength - 1 : index;

    // Get the JSON of the slide we'll switch to (after deletion)
    // If we're deleting before newIndex, the target slide is at newIndex + 1 in current array
    // If we're deleting at or after newIndex, the target slide is at newIndex in current array
    const targetIndex = index <= newIndex ? newIndex + 1 : newIndex;
    const targetSlideJSON = targetIndex < slides.length ? slides[targetIndex].canvasJSON : '';

    setSlides(prev => prev.filter((_, i) => i !== index));
    setCurrentSlideIndex(newIndex);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          if (targetSlideJSON) {
            canvasRef.current.loadFromJSON(targetSlideJSON);
          } else {
            canvasRef.current.clearCanvas();
          }
        }
      });
    });
  }, [slides]);

  // Handle slides reorder
  const handleSlidesReorder = useCallback((newSlides: SlideState[]) => {
    if (!canvasRef.current) return;

    // Save current slide state directly from canvas before reordering
    const canvasJSON = canvasRef.current.exportToJSON();
    const thumbnail = canvasRef.current.exportToDataURL();

    // Update the current slide's data in the new array
    const currentSlideId = slides[currentSlideIndex]?.id;
    const updatedSlides = newSlides.map(slide =>
      slide.id === currentSlideId
        ? { ...slide, canvasJSON, thumbnail }
        : slide
    );

    // Find new index of the current slide after reorder
    const newCurrentIndex = updatedSlides.findIndex(s => s.id === currentSlideId);

    setSlides(updatedSlides);
    if (newCurrentIndex !== -1) {
      setCurrentSlideIndex(newCurrentIndex);
    }
  }, [currentSlideIndex, slides]);

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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    // Media API returns { media: { storageUrl: string, ... } }
    return data.media?.storageUrl || data.url;
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

      pdf.save('carousel.pdf');
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
  const handleTemplateSelect = async (template: CarouselTemplate) => {
    if (!canvasRef.current) return;

    // Collect unique font families from template elements (default to Inter)
    const fonts = new Set<string>(['Inter']);
    template.elements?.forEach(el => {
      if (el.type === 'text' && el.fontFamily) {
        fonts.add(el.fontFamily);
      }
    });

    // Pre-load all fonts so Fabric.js Textbox computes correct metrics
    const { loadGoogleFont } = await import("@/components/dashboard/carousel/GoogleFontPicker");
    await Promise.all(
      Array.from(fonts).map(f => loadGoogleFont(f, true).catch(() => {}))
    );

    // Clear canvas (this preserves zoom)
    canvasRef.current.clearCanvas();

    // Apply background
    canvasRef.current.setBackground(template.background.type, template.background.value);

    // Add template elements in batch mode (no setActiveObject/renderAll per element)
    if (template.elements && template.elements.length > 0) {
      template.elements.forEach(element => {
        if (element.type === 'text') {
          canvasRef.current?.addText({
            text: element.text,
            fontSize: element.fontSize,
            fontFamily: element.fontFamily || 'Inter',
            fontWeight: element.fontWeight,
            fill: element.fill,
            textAlign: element.textAlign,
            left: element.left,
            top: element.top,
            width: element.width,
            opacity: element.opacity,
          }, true);
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
          }, true);
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
          }, true);
        }
      });

      // Single render pass after all elements are added
      canvasRef.current.finishBatch();
    }

    setShowTemplateGallery(false);
    showToast(`Template "${template.name}" applied!`, "success");
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));

  // Save template handler
  const handleSaveTemplate = async () => {
    if (!canvasRef.current || !templateName.trim()) return;

    setIsSavingTemplate(true);
    try {
      // Get canvas JSON and thumbnail directly from canvas
      const canvasJson = canvasRef.current.exportToJSON();
      const thumbnail = canvasRef.current.exportToDataURL();

      const response = await fetch('/api/user/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim() || null,
          thumbnail,
          canvasJson,
          category: 'custom',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      showToast(`Template "${templateName}" saved!`, "success");
      setShowSaveTemplateDialog(false);
      setTemplateName("");
      setTemplateDescription("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Load user template handler
  const handleLoadUserTemplate = (canvasJson: string) => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.loadFromJSON(canvasJson);
      showToast("Template loaded!", "success");
    } catch (err) {
      showToast("Failed to load template");
    }
  };

  // Helper to compress thumbnail for storage (reduce size significantly)
  const compressThumbnail = useCallback(async (dataUrl: string, maxWidth: number = 200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Use JPEG with lower quality for smaller size
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }, []);

  // Save carousel handler (saves all slides) - updates existing or creates new
  const handleSaveCarousel = async (saveAsNew: boolean = false) => {
    if (!canvasRef.current || !carouselName.trim()) return;

    setIsSavingCarousel(true);
    try {
      // First, save the current slide state
      const currentCanvasJSON = canvasRef.current.exportToJSON();
      const currentThumbnail = canvasRef.current.exportToDataURL();

      // Build slides array with current slide updated
      // IMPORTANT: Don't include thumbnails in slides - they're too large
      // Thumbnails are only needed for the UI, not for restoring the carousel
      const slidesData = slides.map((slide, index) => {
        if (index === currentSlideIndex) {
          return {
            id: slide.id,
            canvasJSON: currentCanvasJSON,
            // No thumbnail - will be regenerated when loaded
          };
        }
        return {
          id: slide.id,
          canvasJSON: slide.canvasJSON,
          // No thumbnail - will be regenerated when loaded
        };
      });

      // Compress the carousel preview thumbnail (first slide)
      const rawThumbnail = currentSlideIndex === 0 ? currentThumbnail : (slides[0]?.thumbnail || currentThumbnail);
      const carouselThumbnail = await compressThumbnail(rawThumbnail, 200);

      const payload = {
        name: carouselName.trim(),
        description: carouselDescription.trim() || null,
        thumbnail: carouselThumbnail,
        slidesJson: JSON.stringify(slidesData),
        slideCount: slidesData.length,
      };

      // If we have a current carousel ID and not saving as new, update it
      const isUpdate = currentCarouselId && !saveAsNew;
      const url = isUpdate ? `/api/carousels/${currentCarouselId}` : '/api/carousels';
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save carousel');
      }

      // If creating new, get the new ID and set it as current
      if (!isUpdate) {
        const data = await response.json();
        if (data.id) {
          setCurrentCarouselId(data.id);
        }
      }

      showToast(`Carousel "${carouselName}" ${isUpdate ? 'updated' : 'saved'}!`, "success");
      setShowSaveCarouselDialog(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save carousel");
    } finally {
      setIsSavingCarousel(false);
    }
  };

  // Load carousel handler
  const handleLoadCarousel = (data: { id: string; name: string; description: string | null; slidesJson: string }) => {
    if (!canvasRef.current) return;
    try {
      const loadedSlides = JSON.parse(data.slidesJson) as Array<{ id: string; canvasJSON: string; thumbnail?: string }>;
      if (!loadedSlides || loadedSlides.length === 0) {
        throw new Error("No slides in carousel");
      }

      // Convert to SlideState format (thumbnails will be empty, will be generated on render)
      const slidesWithEmptyThumbnails: SlideState[] = loadedSlides.map(slide => ({
        id: slide.id,
        canvasJSON: slide.canvasJSON,
        thumbnail: slide.thumbnail || '', // Use saved thumbnail or empty (will regenerate)
      }));

      // Set carousel metadata for future saves
      setCurrentCarouselId(data.id);
      setCarouselName(data.name);
      setCarouselDescription(data.description || '');

      // Set slides state
      setSlides(slidesWithEmptyThumbnails);
      setCurrentSlideIndex(0);

      // Load first slide and generate its thumbnail
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (canvasRef.current && slidesWithEmptyThumbnails[0].canvasJSON) {
            canvasRef.current.loadFromJSON(slidesWithEmptyThumbnails[0].canvasJSON);
            // After loading, update the thumbnail for the first slide
            setTimeout(() => {
              if (canvasRef.current) {
                const thumbnail = canvasRef.current.exportToDataURL();
                setSlides(prev => prev.map((s, i) => i === 0 ? { ...s, thumbnail } : s));
              }
            }, 100);
          }
        });
      });

      showToast(`Loaded "${data.name}"`, "success");
    } catch (err) {
      showToast("Failed to load carousel");
    }
  };

  // Duplicate carousel handler (loads slides but clears ID so it saves as new)
  const handleDuplicateCarousel = (slidesJson: string, name: string) => {
    if (!canvasRef.current) return;
    try {
      const loadedSlides = JSON.parse(slidesJson) as Array<{ id: string; canvasJSON: string; thumbnail?: string }>;
      if (!loadedSlides || loadedSlides.length === 0) {
        throw new Error("No slides in carousel");
      }

      const slidesWithEmptyThumbnails: SlideState[] = loadedSlides.map(slide => ({
        id: slide.id,
        canvasJSON: slide.canvasJSON,
        thumbnail: slide.thumbnail || '',
      }));

      // Clear carousel ID so it saves as new (not update original)
      setCurrentCarouselId(null);
      setCarouselName(name);
      setCarouselDescription('');

      setSlides(slidesWithEmptyThumbnails);
      setCurrentSlideIndex(0);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (canvasRef.current && slidesWithEmptyThumbnails[0].canvasJSON) {
            canvasRef.current.loadFromJSON(slidesWithEmptyThumbnails[0].canvasJSON);
            setTimeout(() => {
              if (canvasRef.current) {
                const thumbnail = canvasRef.current.exportToDataURL();
                setSlides(prev => prev.map((s, i) => i === 0 ? { ...s, thumbnail } : s));
              }
            }, 100);
          }
        });
      });

      // Open save dialog immediately for duplicate
      setShowSaveCarouselDialog(true);
      showToast("Duplicated - save with a new name", "success");
    } catch (err) {
      showToast("Failed to duplicate carousel");
    }
  };

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
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
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
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Text AI API Key Required</h3>
              <p className="text-muted-foreground mb-6">
                The Carousel Editor uses AI to generate content. Please configure your Text AI API key to unlock AI features.
              </p>
              <Link href="/dashboard/settings/ai-api">
                <Button className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
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
              <div className="w-8 h-8 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
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
            {/* Templates Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateGallery(true)}
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Templates
            </Button>

            {/* Save Template Button */}
            <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Save className="w-5 h-5 text-cyan-600" />
                    Save as Template
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      placeholder="My Custom Template"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="A brief description of this template..."
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Save the current slide design as a reusable template. You can access your saved templates from the Templates gallery.
                  </p>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim() || isSavingTemplate}
                    className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isSavingTemplate ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSavingTemplate ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-border" />

            {/* My Carousels Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMyCarousels(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              My Carousels
            </Button>

            {/* Save Carousel Button - saves directly if editing existing, opens dialog for new */}
            {currentCarouselId ? (
              <>
                {/* Quick Save button for existing carousel */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveCarousel(false)}
                  disabled={isSavingCarousel}
                >
                  {isSavingCarousel ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSavingCarousel ? "Saving..." : "Save"}
                </Button>
                {/* Save As button to open dialog */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveCarouselDialog(true)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Save As
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveCarouselDialog(true)}
              >
                <Layers className="w-4 h-4 mr-2" />
                Save Carousel
              </Button>
            )}

            {/* Save Carousel Dialog */}
            <Dialog open={showSaveCarouselDialog} onOpenChange={setShowSaveCarouselDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-600" />
                    {currentCarouselId ? "Save As New Carousel" : "Save Carousel"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Carousel Name</Label>
                    <Input
                      placeholder="My Carousel"
                      value={carouselName}
                      onChange={(e) => setCarouselName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="A brief description of this carousel..."
                      value={carouselDescription}
                      onChange={(e) => setCarouselDescription(e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Save all {slides.length} slides as a carousel. You can reuse or duplicate it later from "My Carousels".
                  </p>
                  <Button
                    onClick={() => handleSaveCarousel(true)}
                    disabled={!carouselName.trim() || isSavingCarousel}
                    className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isSavingCarousel ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Layers className="w-4 h-4 mr-2" />
                    )}
                    {isSavingCarousel ? "Saving..." : `Save ${slides.length} Slides`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

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
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
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
              onElementMoving={() => setElementUpdateTrigger(prev => prev + 1)}
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
              updateTrigger={elementUpdateTrigger}
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
          onLoadUserTemplate={handleLoadUserTemplate}
        />

        {/* My Carousels Modal */}
        <MyCarousels
          open={showMyCarousels}
          onOpenChange={setShowMyCarousels}
          onLoadCarousel={handleLoadCarousel}
          onDuplicateCarousel={handleDuplicateCarousel}
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
