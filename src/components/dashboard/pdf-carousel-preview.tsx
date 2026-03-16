"use client";

import dynamic from "next/dynamic";

interface PdfCarouselPreviewProps {
  url: string;
  maxHeight?: number;
}

// Dynamically import the actual PDF viewer to avoid SSR issues
// react-pdf uses DOMMatrix and other browser-only APIs
const PdfCarouselPreviewInner = dynamic(
  () => import("./pdf-carousel-preview-inner").then((mod) => mod.PdfCarouselPreviewInner),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg overflow-hidden bg-muted/30 border flex items-center justify-center" style={{ height: 320 }}>
        <div className="animate-pulse text-sm text-muted-foreground">Loading carousel...</div>
      </div>
    ),
  }
);

export function PdfCarouselPreview({ url, maxHeight = 320 }: PdfCarouselPreviewProps) {
  return <PdfCarouselPreviewInner url={url} maxHeight={maxHeight} />;
}
