import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
