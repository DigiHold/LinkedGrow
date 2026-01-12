import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CookieBanner } from "@/components/cookie-consent";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/cookie-consent";
import {
  OrganizationJsonLd,
  WebsiteJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Google Tag Manager with Consent Mode V2 */}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
        {/* JSON-LD Structured Data for SEO */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <SoftwareApplicationJsonLd />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
        {/* GTM NoScript Fallback */}
        {GTM_ID && <GoogleTagManagerNoScript gtmId={GTM_ID} />}

        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <SessionProvider>{children}</SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>

        {/* Cookie Consent Banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
