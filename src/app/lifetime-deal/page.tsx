import { Metadata } from "next";
import LifetimeDealClient from "./lifetime-deal-client";

export const metadata: Metadata = {
  title: "Lifetime Deal: LinkedGrow Business Plan for $99",
  description: "Get the full LinkedGrow Business plan forever for a one-time $99 payment. AI-powered LinkedIn content with BYOK: pay 96% less in AI costs than competitors.",
  openGraph: {
    title: "Lifetime Deal: LinkedGrow Business Plan for $99",
    description: "Get the full LinkedGrow Business plan forever for a one-time $99 payment. AI-powered LinkedIn content with BYOK: pay 96% less in AI costs than competitors.",
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
    title: "Lifetime Deal: LinkedGrow Business Plan for $99",
    description: "Get the full LinkedGrow Business plan forever for a one-time $99 payment. AI-powered LinkedIn content with BYOK: pay 96% less in AI costs than competitors.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
};

export default function LifetimeDealPage() {
  return <LifetimeDealClient />;
}
