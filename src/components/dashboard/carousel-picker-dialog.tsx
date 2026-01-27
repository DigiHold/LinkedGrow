"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedCarousel {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CarouselPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: File) => void;
  onError?: (message: string) => void;
}

export function CarouselPickerDialog({
  open,
  onOpenChange,
  onSelect,
  onError,
}: CarouselPickerDialogProps) {
  const [carousels, setCarousels] = useState<SavedCarousel[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open) {
      fetchCarousels();
    }
  }, [open]);

  const fetchCarousels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/carousels");
      if (!res.ok) throw new Error("Failed to fetch carousels");
      const data = await res.json();
      setCarousels(data.carousels || []);
    } catch {
      onError?.("Failed to load saved carousels");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      onError?.("Only PDF files are supported for carousels");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      onError?.("PDF must be less than 100MB");
      return;
    }

    onSelect(file);
    onOpenChange(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderCarouselToPdf = useCallback(async (carouselId: string) => {
    setRendering(carouselId);
    try {
      // Fetch full carousel data
      const res = await fetch(`/api/carousels/${carouselId}`);
      if (!res.ok) throw new Error("Failed to load carousel");
      const data = await res.json();
      const carousel = data.carousel;

      if (!carousel?.slidesJson) {
        throw new Error("Carousel has no slides");
      }

      const slides = typeof carousel.slidesJson === "string"
        ? JSON.parse(carousel.slidesJson)
        : carousel.slidesJson;

      if (!slides || slides.length === 0) {
        throw new Error("Carousel has no slides");
      }

      // Dynamically import jsPDF and fabric
      const [{ jsPDF }, fabricModule] = await Promise.all([
        import("jspdf"),
        import("fabric"),
      ]);

      const CANVAS_WIDTH = 1080;
      const CANVAS_HEIGHT = 1350;

      // Create offscreen canvas
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = CANVAS_WIDTH;
      offscreenCanvas.height = CANVAS_HEIGHT;

      const fabricCanvas = new fabricModule.Canvas(offscreenCanvas, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [CANVAS_WIDTH, CANVAS_HEIGHT],
        hotfixes: ["px_scaling"],
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (!slide.canvasJSON) continue;

        const canvasJSON = typeof slide.canvasJSON === "string"
          ? JSON.parse(slide.canvasJSON)
          : slide.canvasJSON;

        await new Promise<void>((resolve) => {
          fabricCanvas.loadFromJSON(canvasJSON).then(() => {
            fabricCanvas.renderAll();
            setTimeout(resolve, 150);
          });
        });

        const dataUrl = offscreenCanvas.toDataURL("image/png");

        if (i > 0) {
          pdf.addPage([CANVAS_WIDTH, CANVAS_HEIGHT]);
        }

        pdf.addImage(dataUrl, "PNG", 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Clean up
      fabricCanvas.dispose();

      // Convert PDF to File
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File(
        [pdfBlob],
        `${carousel.name || "carousel"}.pdf`,
        { type: "application/pdf" }
      );

      onSelect(pdfFile);
      onOpenChange(false);
    } catch (error) {
      console.error("Carousel render error:", error);
      onError?.(error instanceof Error ? error.message : "Failed to generate PDF from carousel");
    } finally {
      setRendering(null);
    }
  }, [onSelect, onOpenChange, onError]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Add Carousel (PDF)
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
          {/* Upload from computer */}
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Upload PDF from computer
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Saved carousels */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : carousels.length > 0 ? (
            <>
              <div className="text-sm font-medium text-muted-foreground">
                Or select a saved carousel
              </div>
              <div className="grid grid-cols-2 gap-3">
                {carousels.map((carousel) => (
                  <button
                    key={carousel.id}
                    type="button"
                    disabled={rendering !== null}
                    onClick={() => renderCarouselToPdf(carousel.id)}
                    className={cn(
                      "relative rounded-lg border p-2 text-left transition-colors hover:border-primary hover:bg-accent/50",
                      rendering === carousel.id && "border-primary bg-accent/50"
                    )}
                  >
                    {carousel.thumbnail ? (
                      <img
                        src={carousel.thumbnail}
                        alt={carousel.name}
                        className="w-full aspect-[4/5] object-cover rounded-md bg-muted"
                      />
                    ) : (
                      <div className="w-full aspect-[4/5] rounded-md bg-muted flex items-center justify-center">
                        <Layers className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="text-sm font-medium truncate">{carousel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {carousel.slideCount} slide{carousel.slideCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {rendering === carousel.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-xs font-medium">Generating PDF...</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No saved carousels yet. Create one in the Carousel page.
            </div>
          )}
        </div>

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
