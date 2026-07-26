"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FabricObject, Textbox, Rect, Circle, Line, Gradient } from "fabric";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Button } from "@/components/ui/button";
import { AiKeyGate } from "@/components/dashboard/ai-key-gate";
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
  PanelBottomClose,
  PanelBottomOpen,
  Save,
  FolderOpen,
  Copy,
  FilePlus,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoModal } from "@/components/dashboard/video-modal";
import Link from "next/link";

// Import new carousel components
import { CanvasWorkspace, CanvasWorkspaceRef, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/components/dashboard/carousel/CanvasWorkspace";
import { ElementToolbar } from "@/components/dashboard/carousel/ElementToolbar";
import { ElementProperties } from "@/components/dashboard/carousel/ElementProperties";
import { LayersPanel } from "@/components/dashboard/carousel/LayersPanel";
import { SlideManager, SlideState } from "@/components/dashboard/carousel/SlideManager";
import { BrandingSettings } from "@/components/dashboard/carousel/branding-settings";
import { TemplateGallery } from "@/components/dashboard/carousel/template-gallery";
import { MyCarousels } from "@/components/dashboard/carousel/MyCarousels";
import type { BrandingData } from "@/components/dashboard/carousel/types";
import { carouselTemplates, type CarouselTemplate } from "@/lib/carousel-templates";

// Generate unique ID
const generateId = () => `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Auto-save localStorage key
const DRAFT_STORAGE_KEY = 'carousel-draft';

interface CarouselDraft {
  slides: Array<{ id: string; canvasJSON: string }>;
  currentSlideIndex: number;
  currentCarouselId: string | null;
  carouselName: string;
  carouselDescription: string;
  lastModified: number;
}

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
  const [brandColors, setBrandColors] = useState<string[]>([]);

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
  const [showLeftSidebar, setShowLeftSidebar] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1080;
    return true;
  });
  const [showRightSidebar, setShowRightSidebar] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1080;
    return true;
  });
  const [showSlideManager, setShowSlideManager] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1080;
    return true;
  });

  // Auto-close panels when viewport crosses below 1080px, auto-open when crossing above.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let wasSmall = window.innerWidth < 1080;
    const onResize = () => {
      const isSmall = window.innerWidth < 1080;
      if (isSmall && !wasSmall) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
        setShowSlideManager(false);
      } else if (!isSmall && wasSmall) {
        setShowLeftSidebar(true);
        setShowRightSidebar(true);
        setShowSlideManager(true);
      }
      wasSmall = isSmall;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // On small screens (<1080px), opening one panel closes the others to avoid overlay overlap.
  const toggleLeftSidebar = useCallback(() => {
    const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 1080;
    setShowLeftSidebar((prev) => {
      const next = !prev;
      if (next && isSmallScreen) {
        setShowRightSidebar(false);
        setShowSlideManager(false);
      }
      return next;
    });
  }, []);
  const toggleRightSidebar = useCallback(() => {
    const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 1080;
    setShowRightSidebar((prev) => {
      const next = !prev;
      if (next && isSmallScreen) {
        setShowLeftSidebar(false);
        setShowSlideManager(false);
      }
      return next;
    });
  }, []);
  const toggleSlideManager = useCallback(() => {
    const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 1080;
    setShowSlideManager((prev) => {
      const next = !prev;
      if (next && isSmallScreen) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      }
      return next;
    });
  }, []);

  // Save Template state
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // My Carousels state
  const [showMyCarousels, setShowMyCarousels] = useState(false);
  const [showSaveCarouselDialog, setShowSaveCarouselDialog] = useState(false);
  const [showNewCarouselDialog, setShowNewCarouselDialog] = useState(false);
  const [carouselName, setCarouselName] = useState("");
  const [carouselDescription, setCarouselDescription] = useState("");
  const [isSavingCarousel, setIsSavingCarousel] = useState(false);
  const [currentCarouselId, setCurrentCarouselId] = useState<string | null>(null); // Track loaded carousel for updates

  // API keys state
  const [hasTextApiKey, setHasTextApiKey] = useState<boolean | null>(null);
  const [hasImageApiKey, setHasImageApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slidesRef = useRef(slides);
  const currentSlideIndexRef = useRef(currentSlideIndex);
  const draftRestoredRef = useRef(false);
  const loadFailedRef = useRef(false); // Prevents auto-save from overwriting DB after a failed canvas load

  // Left sidebar view (toolbar or layers)
  const [leftPanelView, setLeftPanelView] = useState<'toolbar' | 'layers'>('toolbar');

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
          setBrandColors(data.brandColors || []);
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

  // Keep refs in sync
  useEffect(() => { slidesRef.current = slides; }, [slides]);
  useEffect(() => { currentSlideIndexRef.current = currentSlideIndex; }, [currentSlideIndex]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    if (draftRestoredRef.current || isCheckingApiKey) return;
    draftRestoredRef.current = true;

    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft: CarouselDraft = JSON.parse(raw);
      // Skip if draft is older than 7 days
      if (Date.now() - draft.lastModified > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      if (!draft.slides || draft.slides.length === 0) return;

      const restoredSlides: SlideState[] = draft.slides.map(s => ({
        id: s.id,
        canvasJSON: s.canvasJSON,
        thumbnail: '',
      }));
      const targetIndex = Math.min(draft.currentSlideIndex || 0, restoredSlides.length - 1);

      setSlides(restoredSlides);
      setCurrentSlideIndex(targetIndex);
      if (draft.currentCarouselId) setCurrentCarouselId(draft.currentCarouselId);
      if (draft.carouselName) setCarouselName(draft.carouselName);
      if (draft.carouselDescription) setCarouselDescription(draft.carouselDescription);

      // Load the target slide after canvas is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (canvasRef.current && restoredSlides[targetIndex]?.canvasJSON) {
            canvasRef.current.loadFromJSON(restoredSlides[targetIndex].canvasJSON).then((success) => {
              if (!success) {
                // Load failed (e.g. missing images) - block auto-save to prevent data corruption
                loadFailedRef.current = true;
                return;
              }
              loadFailedRef.current = false;
              setTimeout(() => {
                if (canvasRef.current) {
                  const thumbnail = canvasRef.current.exportToDataURL();
                  setSlides(prev => prev.map((s, i) =>
                    i === targetIndex ? { ...s, thumbnail } : s
                  ));
                }
              }, 200);
            });
          }
        });
      });
    } catch (e) {
}
  }, [isCheckingApiKey]);

  // Flush save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!canvasRef.current) return;
      // Don't flush save if canvas load failed
      if (loadFailedRef.current) return;
      try {
        const canvasJSON = canvasRef.current.exportToJSON();
        const curSlides = slidesRef.current;
        const curIdx = currentSlideIndexRef.current;
        const draft: CarouselDraft = {
          slides: curSlides.map((slide, i) => ({
            id: slide.id,
            canvasJSON: i === curIdx ? canvasJSON : slide.canvasJSON,
          })),
          currentSlideIndex: curIdx,
          currentCarouselId,
          carouselName,
          carouselDescription,
          lastModified: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentCarouselId, carouselName, carouselDescription]);

  // Save current slide before switching
  const saveCurrentSlide = useCallback(() => {
    if (!canvasRef.current) return;
    if (loadFailedRef.current) return;

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
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }, []);

  // --- Auto-save functions ---

  const saveToLocalStorage = useCallback(() => {
    if (!canvasRef.current) return;
    // Don't save if canvas load failed - would save blank data
    if (loadFailedRef.current) return;
    try {
      const canvasJSON = canvasRef.current.exportToJSON();
      const curSlides = slidesRef.current;
      const curIdx = currentSlideIndexRef.current;
      const draft: CarouselDraft = {
        slides: curSlides.map((slide, i) => ({
          id: slide.id,
          canvasJSON: i === curIdx ? canvasJSON : slide.canvasJSON,
        })),
        currentSlideIndex: curIdx,
        currentCarouselId,
        carouselName,
        carouselDescription,
        lastModified: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setSaveStatus('saved');
    } catch (e) {
}
  }, [currentCarouselId, carouselName, carouselDescription]);

  const saveToDatabase = useCallback(async () => {
    if (!canvasRef.current || !currentCarouselId || !carouselName.trim()) return;
    // Don't auto-save if canvas load failed - would overwrite good data with blank canvas
    if (loadFailedRef.current) return;
    setSaveStatus('saving');
    try {
      const currentCanvasJSON = canvasRef.current.exportToJSON();
      const currentThumbnail = canvasRef.current.exportToDataURL();
      const curSlides = slidesRef.current;
      const curIdx = currentSlideIndexRef.current;
      const slidesData = curSlides.map((slide, i) => ({
        id: slide.id,
        canvasJSON: i === curIdx ? currentCanvasJSON : slide.canvasJSON,
      }));
      const rawThumbnail = curIdx === 0 ? currentThumbnail : (curSlides[0]?.thumbnail || currentThumbnail);
      const carouselThumbnail = await compressThumbnail(rawThumbnail, 200);
      const payload = {
        name: carouselName.trim(),
        description: carouselDescription.trim() || null,
        thumbnail: carouselThumbnail,
        slidesJson: JSON.stringify(slidesData),
        slideCount: slidesData.length,
      };
      const response = await fetch(`/api/carousels/${currentCarouselId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) setSaveStatus('saved');
    } catch (e) {
setSaveStatus('idle');
    }
  }, [currentCarouselId, carouselName, carouselDescription, compressThumbnail]);

  // Handle canvas change (update thumbnail + schedule auto-saves)
  const handleCanvasChange = useCallback(() => {
    if (!canvasRef.current) return;

    const thumbnail = canvasRef.current.exportToDataURL();
    setSlides(prev => prev.map((slide, index) =>
      index === currentSlideIndex
        ? { ...slide, thumbnail }
        : slide
    ));

    // Schedule debounced localStorage save (2s)
    setSaveStatus('saving');
    if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    localSaveTimerRef.current = setTimeout(() => saveToLocalStorage(), 2000);

    // Schedule debounced DB save (5s) if carousel is already saved
    if (currentCarouselId) {
      if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);
      dbSaveTimerRef.current = setTimeout(() => saveToDatabase(), 5000);
    }
  }, [currentSlideIndex, currentCarouselId, saveToLocalStorage, saveToDatabase]);

  // Also save to localStorage when slides array changes (covers add/delete/reorder)
  useEffect(() => {
    if (!draftRestoredRef.current) return; // Don't save during initial restore
    if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    localSaveTimerRef.current = setTimeout(() => saveToLocalStorage(), 1000);
  }, [slides, saveToLocalStorage]);

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
      // Discard selection first to avoid artifacts in the capture
      const canvas = canvasRef.current.getCanvas();
      canvas?.discardActiveObject();
      canvas?.renderAll();

      // Save current canvas JSON before export loop
      const currentCanvasJSON = canvasRef.current.exportToJSON();
      saveCurrentSlide();

      // jspdf and its html2canvas dependency are ~500 KB and are only needed
      // the moment somebody exports. Loading them here keeps them out of the
      // page bundle entirely.
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [CANVAS_WIDTH, CANVAS_HEIGHT],
        hotfixes: ['px_scaling'],
      });

      for (let i = 0; i < slides.length; i++) {
        setGenerationStep(`Exporting slide ${i + 1} of ${slides.length}...`);

        // Always load from JSON for every slide to ensure correct content
        const slideJSON = i === currentSlideIndex ? currentCanvasJSON : slides[i].canvasJSON;
        if (slideJSON) {
          await canvasRef.current.loadFromJSON(slideJSON);
        }

        const dataUrl = canvasRef.current.exportToDataURL('jpeg');

        if (i > 0) {
          pdf.addPage([CANVAS_WIDTH, CANVAS_HEIGHT]);
        }

        pdf.addImage(dataUrl, 'JPEG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, undefined, 'FAST');
      }

      // Restore current slide
      await canvasRef.current.loadFromJSON(currentCanvasJSON);

      pdf.save('carousel.pdf');
      showToast("PDF downloaded successfully!", "success");
    } catch (err) {
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
      // Discard selection first to avoid artifacts in the capture
      const canvas = canvasRef.current.getCanvas();
      canvas?.discardActiveObject();
      canvas?.renderAll();

      // Save current canvas JSON before export loop
      const currentCanvasJSON = canvasRef.current.exportToJSON();
      saveCurrentSlide();

      for (let i = 0; i < slides.length; i++) {
        setGenerationStep(`Exporting slide ${i + 1} of ${slides.length}...`);

        // Always load from JSON for every slide to ensure correct content
        const slideJSON = i === currentSlideIndex ? currentCanvasJSON : slides[i].canvasJSON;
        if (slideJSON) {
          await canvasRef.current.loadFromJSON(slideJSON);
        }

        const dataUrl = canvasRef.current.exportToDataURL();

        const link = document.createElement('a');
        link.download = `slide-${i + 1}.png`;
        link.href = dataUrl;
        link.click();

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Restore current slide
      await canvasRef.current.loadFromJSON(currentCanvasJSON);

      showToast("Images downloaded!", "success");
    } catch (err) {
showToast("Failed to export images");
    } finally {
      setIsExporting(false);
      setGenerationStep("");
    }
  };

  // Handle template selection - creates Fabric objects directly and adds to canvas
  const handleTemplateSelect = async (template: CarouselTemplate) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.getCanvas();
    if (!canvas) return;

    // Pre-load Inter font
    const { loadGoogleFont } = await import("@/components/dashboard/carousel/GoogleFontPicker");
    await loadGoogleFont('Inter', true).catch(() => {});

    // Save current zoom before clearing
    const currentZoom = canvas.getZoom();

    // Clear canvas
    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    // Set background
    if (template.background.type === 'solid') {
      canvas.backgroundColor = template.background.value;
    } else if (template.background.type === 'gradient') {
      canvas.backgroundColor = '';
      const gradientMatch = template.background.value.match(/linear-gradient\((\d+)deg,\s*([^)]+)\)/);
      if (gradientMatch) {
        const angle = parseInt(gradientMatch[1], 10);
        const angleRad = (angle - 90) * Math.PI / 180;
        const colorRegex = /(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3})\s*(\d+)?%?/g;
        const colorStops: { offset: number; color: string }[] = [];
        let cm;
        let idx = 0;
        while ((cm = colorRegex.exec(gradientMatch[2])) !== null) {
          colorStops.push({
            offset: cm[2] ? parseInt(cm[2], 10) / 100 : idx,
            color: cm[1],
          });
          idx++;
        }
        const bgRect = new Rect({
          left: 0, top: 0,
          width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
          selectable: false, evented: false, strokeWidth: 0,
          originX: 'left', originY: 'top',
        });
        bgRect.isBackgroundRect = true;
        const gradient = new Gradient({
          type: 'linear',
          coords: {
            x1: (0.5 - Math.cos(angleRad) * 0.5) * CANVAS_WIDTH,
            y1: (0.5 - Math.sin(angleRad) * 0.5) * CANVAS_HEIGHT,
            x2: (0.5 + Math.cos(angleRad) * 0.5) * CANVAS_WIDTH,
            y2: (0.5 + Math.sin(angleRad) * 0.5) * CANVAS_HEIGHT,
          },
          colorStops,
        });
        bgRect.set('fill', gradient);
        canvas.add(bgRect);
      }
    }

    // Create all template element objects
    const fabricObjects: FabricObject[] = [];

    if (template.elements) {
      for (const el of template.elements) {
        if (el.type === 'text') {
          fabricObjects.push(new Textbox(el.text || '', {
            left: el.left ?? 0,
            top: el.top ?? 0,
            width: el.width ?? 400,
            fontSize: el.fontSize ?? 48,
            fontFamily: el.fontFamily || 'Inter',
            fontWeight: String(el.fontWeight ?? 'normal'),
            fill: el.fill ?? '#000000',
            textAlign: el.textAlign ?? 'center',
            opacity: el.opacity ?? 1,
            editable: true,
            originX: 'left',
            originY: 'top',
          }));
        } else if (el.type === 'shape' && el.shapeType === 'rect') {
          fabricObjects.push(new Rect({
            left: el.left ?? 0,
            top: el.top ?? 0,
            width: el.width ?? 200,
            height: el.height ?? 150,
            fill: el.fill ?? '#0891b2',
            stroke: el.stroke || undefined,
            strokeWidth: el.strokeWidth ?? 0,
            opacity: el.opacity ?? 1,
            rx: el.rx ?? 0,
            ry: el.ry ?? 0,
            originX: 'left',
            originY: 'top',
          }));
        } else if (el.type === 'shape' && el.shapeType === 'circle') {
          fabricObjects.push(new Circle({
            left: el.left ?? 0,
            top: el.top ?? 0,
            radius: (el.width ?? 150) / 2,
            fill: el.fill ?? '#0891b2',
            stroke: el.stroke || undefined,
            strokeWidth: el.strokeWidth ?? 0,
            opacity: el.opacity ?? 1,
            originX: 'left',
            originY: 'top',
          }));
        } else if (el.type === 'line' || (el.type === 'shape' && el.shapeType === 'line')) {
          fabricObjects.push(new Line([
            el.x1 ?? 0, el.y1 ?? 0,
            el.x2 ?? 300, el.y2 ?? 0,
          ], {
            left: el.left ?? 0,
            top: el.top ?? 0,
            stroke: el.stroke ?? el.fill ?? '#0891b2',
            strokeWidth: el.strokeWidth ?? 4,
            opacity: el.opacity ?? 1,
            originX: 'left',
            originY: 'top',
          }));
        }
      }
    }

    // Add all objects in one call
    if (fabricObjects.length > 0) {
      canvas.add(...fabricObjects);
    }

    // Re-apply zoom after clear + add (critical - clear may reset internal state)
    canvas.setZoom(currentZoom);
    canvas.setDimensions({
      width: CANVAS_WIDTH * currentZoom,
      height: CANVAS_HEIGHT * currentZoom,
    });

    canvas.renderAll();

    setShowTemplateGallery(false);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
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
      loadFailedRef.current = false; // Reset flag for new load
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (canvasRef.current && slidesWithEmptyThumbnails[0].canvasJSON) {
            canvasRef.current.loadFromJSON(slidesWithEmptyThumbnails[0].canvasJSON).then((success) => {
              if (!success) {
                loadFailedRef.current = true;
                showToast("Some images failed to load. Auto-save is paused to protect your data.");
                return;
              }
              loadFailedRef.current = false;
              // After loading, update the thumbnail for the first slide
              setTimeout(() => {
                if (canvasRef.current) {
                  const thumbnail = canvasRef.current.exportToDataURL();
                  setSlides(prev => prev.map((s, i) => i === 0 ? { ...s, thumbnail } : s));
                }
              }, 100);
            });
          }
        });
      });

      localStorage.removeItem(DRAFT_STORAGE_KEY);
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

  // Start a fresh blank carousel - clears the editor and the saved draft
  const confirmNewCarousel = () => {
    // Cancel pending auto-saves so they don't re-write the draft we're about to clear
    if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);

    // Wipe the localStorage draft so a refresh doesn't restore the old project
    localStorage.removeItem(DRAFT_STORAGE_KEY);

    // Reset all carousel state to a single blank slide
    loadFailedRef.current = false;
    setCurrentCarouselId(null);
    setCarouselName("");
    setCarouselDescription("");
    setSelectedElement(null);
    setSlides([{ id: generateId(), canvasJSON: '', thumbnail: '' }]);
    setCurrentSlideIndex(0);
    setSaveStatus('idle');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        canvasRef.current?.clearCanvas();
      });
    });

    setShowNewCarouselDialog(false);
    showToast("New blank carousel ready", "success");
  };

  // Loading state
  if (isCheckingApiKey) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Missing Text API key
  if (!hasTextApiKey) {
    return (
      <FeatureGate feature="carouselGenerator">
        <div className="max-w-3xl mx-auto p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
                Carousel
              </h1>
              <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
                Build a multi-slide PDF carousel and publish it as a document post.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <VideoModal videoId="LwxqG4Y5Z6g" />
              <Link href="/docs/carousel/carousel-generator" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
                <HelpCircle className="w-3.5 h-3.5" />
                Docs
              </Link>
            </div>
          </div>

          <AiKeyGate what="write the slides for a carousel" />
        </div>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="carouselGenerator">
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Top Toolbar - horizontally scrollable on small screens, full height always */}
        <div className="h-14 border-b border-border bg-background shrink-0 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="h-full flex items-center justify-between gap-4 px-4 min-w-max">
          <div className="flex items-center gap-4">
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

            {/* Auto-save Status */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving changes...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span>All changes saved</span>
                </>
              ) : null}
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
              <span className="text-sm text-slate-500 dark:text-slate-400 w-12 text-center">
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

            <div className="h-6 w-px bg-border" />

            <VideoModal videoId="LwxqG4Y5Z6g" />

            <div className="h-6 w-px bg-border" />

            <Link href="/docs/carousel/carousel-generator" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Templates Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateGallery(true)}
            >
              <LayoutTemplate className="w-4 h-4" />
              Templates
            </Button>

            {/* Save Template Button */}
            <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Save the current slide design as a reusable template. You can access your saved templates from the Templates gallery.
                  </p>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim() || isSavingTemplate}
                    className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isSavingTemplate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSavingTemplate ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-border" />

            {/* New Carousel Button - clears the editor for a fresh blank canvas */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewCarouselDialog(true)}
            >
              <FilePlus className="w-4 h-4" />
              New Carousel
            </Button>

            {/* My Carousels Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMyCarousels(true)}
            >
              <FolderOpen className="w-4 h-4" />
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSavingCarousel ? "Saving..." : "Save"}
                </Button>
                {/* Save As button to open dialog */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveCarouselDialog(true)}
                >
                  <Copy className="w-4 h-4" />
                  Save As
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveCarouselDialog(true)}
              >
                <Layers className="w-4 h-4" />
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Save all {slides.length} slides as a carousel. You can reuse or duplicate it later from "My Carousels".
                  </p>
                  <Button
                    onClick={() => handleSaveCarousel(true)}
                    disabled={!carouselName.trim() || isSavingCarousel}
                    className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isSavingCarousel ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                    {isSavingCarousel ? "Saving..." : `Save ${slides.length} Slides`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* New Carousel Confirmation Dialog */}
            <Dialog open={showNewCarouselDialog} onOpenChange={setShowNewCarouselDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FilePlus className="w-5 h-5 text-cyan-600" />
                    Start a New Carousel
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your current canvas will be cleared so you can start from a blank slide.
                  </p>
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-900/10">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Saved carousels in &quot;My Carousels&quot; are not affected - this only clears the
                      editor. If you have unsaved work, save it first.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCarouselDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={confirmNewCarousel}
                      className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                    >
                      <FilePlus className="w-4 h-4" />
                      Start New Carousel
                    </Button>
                  </div>
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Images className="w-4 h-4" />
              )}
              Export As Images
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              Export As PDF
            </Button>
          </div>
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
              showLeftSidebar && "min-[1080px]:hidden"
            )}
            onClick={toggleLeftSidebar}
          >
            {showLeftSidebar ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>

          {/* Left Sidebar - Element Toolbar or Layers Panel */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            showLeftSidebar ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden",
            "hidden min-[1080px]:block",
            showLeftSidebar && "block! absolute min-[1080px]:relative z-10 h-full bg-background shadow-lg min-[1080px]:shadow-none"
          )}>
            {leftPanelView === 'layers' ? (
              <LayersPanel
                canvasRef={canvasRef}
                onClose={() => setLeftPanelView('toolbar')}
              />
            ) : (
              <ElementToolbar
                canvasRef={canvasRef}
                branding={branding}
                onImageUpload={handleImageUpload}
                onAIImageGenerate={hasImageApiKey ? handleAIImageGenerate : undefined}
              />
            )}
          </div>

          {/* Canvas Workspace */}
          <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900 overflow-auto p-4">
            <CanvasWorkspace
              ref={canvasRef}
              zoom={zoom}
              onSelectionChange={setSelectedElement}
              onCanvasChange={handleCanvasChange}
              onElementMoving={() => setElementUpdateTrigger(prev => prev + 1)}
              onShowLayers={() => {
                setLeftPanelView('layers');
                setShowLeftSidebar(true);
                if (typeof window !== "undefined" && window.innerWidth < 1080) {
                  setShowRightSidebar(false);
                  setShowSlideManager(false);
                }
              }}
              className="m-auto"
            />
          </div>

          {/* Right Sidebar Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-2 z-20 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm",
              showRightSidebar && "min-[1080px]:hidden"
            )}
            onClick={toggleRightSidebar}
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
            "hidden min-[1080px]:block",
            showRightSidebar && "block! absolute min-[1080px]:relative right-0 z-10 h-full bg-background shadow-lg min-[1080px]:shadow-none"
          )}>
            <ElementProperties
              selectedElement={selectedElement}
              canvasRef={canvasRef}
              onBackgroundChange={handleBackgroundChange}
              updateTrigger={elementUpdateTrigger}
              brandColors={brandColors}
              onBrandColorsChange={(colors) => {
                setBrandColors(colors);
                fetch("/api/user/settings", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ brandColors: colors }),
                });
              }}
            />
          </div>

        </div>

        {/* Slide Manager Toggle Button - fixed so it sits above the slide overlay on small screens */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-40 h-8 w-8 bg-background/95 backdrop-blur-sm shadow-md min-[1080px]:hidden",
            showSlideManager ? "bottom-42" : "bottom-3"
          )}
          onClick={toggleSlideManager}
          title={showSlideManager ? "Hide slides" : "Show slides"}
        >
          {showSlideManager ? (
            <PanelBottomClose className="w-4 h-4" />
          ) : (
            <PanelBottomOpen className="w-4 h-4" />
          )}
        </Button>

        {/* Bottom - Slide Manager */}
        <div className={cn(
          "hidden min-[1080px]:block",
          showSlideManager && "block! fixed bottom-0 left-0 right-0 z-30 shadow-lg min-[1080px]:relative min-[1080px]:bottom-auto min-[1080px]:shadow-none min-[1080px]:z-auto"
        )}>
          <SlideManager
            slides={slides}
            currentSlideIndex={currentSlideIndex}
            onSlideSelect={handleSlideSelect}
            onSlideAdd={handleSlideAdd}
            onSlideDuplicate={handleSlideDuplicate}
            onSlideDelete={handleSlideDelete}
            onSlidesReorder={handleSlidesReorder}
          />
        </div>

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
            <div className="px-4 py-2 rounded-lg bg-background border border-border shadow-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">{generationStep}</p>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
