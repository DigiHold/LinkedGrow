import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { CookieBanner } from "@/components/cookie-consent";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/cookie-consent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Google Tag Manager ID - Replace with your actual GTM ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";

export const metadata: Metadata = {
  title: "LinkedGrow - Grow Your LinkedIn Presence with AI",
  description:
    "Create viral LinkedIn posts, schedule content, and grow your audience with AI-powered tools. Bring your own AI API key and take control.",
  keywords: [
    "LinkedIn",
    "AI",
    "content creation",
    "social media",
    "marketing",
    "post generator",
  ],
  authors: [{ name: "LinkedGrow" }],
  openGraph: {
    title: "LinkedGrow - Grow Your LinkedIn Presence with AI",
    description:
      "Create viral LinkedIn posts, schedule content, and grow your audience with AI-powered tools.",
    url: "https://linkedgrow.ai",
    siteName: "LinkedGrow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedGrow - Grow Your LinkedIn Presence with AI",
    description:
      "Create viral LinkedIn posts, schedule content, and grow your audience with AI-powered tools.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager with Consent Mode V2 */}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* GTM NoScript Fallback */}
        {GTM_ID && <GoogleTagManagerNoScript gtmId={GTM_ID} />}

        <SessionProvider>{children}</SessionProvider>

        {/* Cookie Consent Banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
