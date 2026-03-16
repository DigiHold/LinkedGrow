"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfCarouselPreviewInnerProps {
  url: string;
  maxHeight?: number;
}

export function PdfCarouselPreviewInner({ url, maxHeight = 500 }: PdfCarouselPreviewInnerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width to render PDF at full width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    // Initial measurement
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const goToPrevPage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentPage((prev) => Math.min(numPages, prev + 1));
  }, [numPages]);

  // Calculate height from width using 4:5 carousel aspect ratio
  const pageHeight = containerWidth > 0 ? containerWidth * (5 / 4) : 0;
  // Clamp to maxHeight
  const effectiveHeight = pageHeight > 0 ? Math.min(pageHeight, maxHeight) : maxHeight;
  const effectiveWidth = pageHeight > maxHeight ? maxHeight * (4 / 5) : containerWidth;

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden bg-muted/30 border">
      {/* Fixed-height container prevents layout shift on page change */}
      <div
        className="flex items-center justify-center"
        style={{ height: effectiveHeight, minHeight: 200 }}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div
              className="flex items-center justify-center"
              style={{ height: effectiveHeight }}
            >
              <div className="animate-pulse text-sm text-muted-foreground">Loading carousel...</div>
            </div>
          }
          error={
            <div
              className="flex items-center justify-center"
              style={{ height: effectiveHeight }}
            >
              <div className="text-sm text-muted-foreground">Failed to load PDF</div>
            </div>
          }
        >
          {containerWidth > 0 && (
            <Page
              pageNumber={currentPage}
              width={effectiveWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={null}
            />
          )}
        </Document>
      </div>

      {/* Navigation arrows */}
      {!loading && numPages > 1 && (
        <>
          {currentPage > 1 && (
            <button
              type="button"
              onClick={goToPrevPage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentPage < numPages && (
            <button
              type="button"
              onClick={goToNextPage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* Page indicator */}
      {!loading && numPages > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
          {currentPage} / {numPages}
        </div>
      )}
    </div>
  );
}
