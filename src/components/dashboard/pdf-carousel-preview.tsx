"use client";

import dynamic from "next/dynamic";

interface PdfCarouselPreviewProps {
  url: string;
}

// Dynamically import the actual PDF viewer to avoid SSR issues
// react-pdf uses DOMMatrix and other browser-only APIs
const PdfCarouselPreviewInner = dynamic(
  () => import("./pdf-carousel-preview-inner").then((mod) => mod.PdfCarouselPreviewInner),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg overflow-hidden border flex items-center justify-center aspect-4/5">
        <div className="animate-pulse text-sm text-muted-foreground">Loading carousel...</div>
      </div>
    ),
  }
);

export function PdfCarouselPreview({ url }: PdfCarouselPreviewProps) {
  return <PdfCarouselPreviewInner url={url} />;
}
