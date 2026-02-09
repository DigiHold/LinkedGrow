import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ScrollLockFix } from "@/components/providers/scroll-lock-fix";
import { CookieBanner } from "@/components/cookie-consent";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/cookie-consent";
import {
  OrganizationJsonLd,
  WebsiteJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import "./globals.css";

// Sora - premium geometric sans-serif, bold and futuristic for headings
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

// DM Sans - clean, modern body font
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

// Google Tag Manager ID from environment
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
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.avif",
        width: 1920,
        height: 1080,
        alt: "LinkedGrow - AI-Powered LinkedIn Growth Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedGrow - Grow Your LinkedIn Presence with AI",
    description:
      "Create viral LinkedIn posts, schedule content, and grow your audience with AI-powered tools.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.avif"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (theme === 'system' || !theme) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Google Tag Manager with Consent Mode V2 */}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
        {/* JSON-LD Structured Data for SEO */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <SoftwareApplicationJsonLd />
      </head>
      <body className={`${sora.variable} ${dmSans.variable} font-sans antialiased`}>
        {/* GTM NoScript Fallback */}
        {GTM_ID && <GoogleTagManagerNoScript gtmId={GTM_ID} />}

        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <SessionProvider>
              <ScrollLockFix />
              {children}
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>

        {/* Cookie Consent Banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
