import { Metadata } from "next";
import LifetimeDealClient from "./lifetime-deal-client";

export const metadata: Metadata = {
  title: "Lifetime Deal - LinkedGrow Business Plan Forever | $99 One-Time",
  description: "Get the full LinkedGrow Business plan forever for a one-time payment. AI-powered LinkedIn content tool with BYOK - bring your own API key and pay 96% less than competitors.",
  openGraph: {
    title: "LinkedGrow Lifetime Deal - Business Plan Forever",
    description: "Get the full LinkedGrow Business plan forever for a one-time payment. AI-powered LinkedIn content tool with BYOK.",
    url: "https://linkedgrow.ai/lifetime-deal",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow Lifetime Deal - AI-Powered LinkedIn Growth Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedGrow Lifetime Deal - Business Plan Forever",
    description: "Get the full LinkedGrow Business plan forever for a one-time payment. BYOK model - pay 96% less.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
};

export default function LifetimeDealPage() {
  return <LifetimeDealClient />;
}
