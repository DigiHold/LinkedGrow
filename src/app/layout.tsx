import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans, Host_Grotesk, Instrument_Sans, Caveat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ScrollLockFix } from "@/components/providers/scroll-lock-fix";
import { ScrollToTop } from "@/components/providers/scroll-to-top";
import { CookieBanner } from "@/components/cookie-consent";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/cookie-consent";
import { ChatWidgetLoader } from "@/components/chat/chat-widget-loader";
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

// Host Grotesk - v2 display face. Scoped to the v2 dashboard for now via
// font-grotesk; --font-display stays on Sora until the marketing rebuild.
const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["400", "500", "600", "700"],
});

// Instrument Sans and Caveat belong to the v3 marketing design. Scoped to those
// components by their own variables, so nothing already shipped changes face.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["400", "600"],
});

// Google Tag Manager ID from environment
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";

export const metadata: Metadata = {
  title: "Lead Generation on LinkedIn, Run by an AI Agent | LinkedGrow",
  description:
    "Lead generation on LinkedIn, run by an agent that finds your leads, sends the invitation and opens the conversation, inside limits that keep your account safe.",
  authors: [{ name: "LinkedGrow" }],
  openGraph: {
    title: "Lead Generation on LinkedIn, Run by an AI Agent | LinkedGrow",
    description:
      "Lead generation on LinkedIn, run by an agent that finds your leads and opens the conversation, inside limits that keep your account safe.",
    url: "https://linkedgrow.ai",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/home.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow, the LinkedIn AI agent that finds leads and opens conversations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lead Generation on LinkedIn, Run by an AI Agent | LinkedGrow",
    description:
      "Lead generation on LinkedIn, run by an agent that finds your leads and opens the conversation, inside limits that keep your account safe.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/home.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai",
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
        {/* Privacy-friendly analytics */}
        <script defer data-site="linkedgrow" data-persist="true" src="https://insight.nicolaslecocq.com/t.js" />
        {/* Google Tag Manager with Consent Mode V2 */}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
        {/* JSON-LD Structured Data for SEO */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <SoftwareApplicationJsonLd />
      </head>
      <body className={`${sora.variable} ${dmSans.variable} ${hostGrotesk.variable} ${instrumentSans.variable} ${caveat.variable} font-sans antialiased`}>
        {/* GTM NoScript Fallback */}
        {GTM_ID && <GoogleTagManagerNoScript gtmId={GTM_ID} />}

        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <SessionProvider>
              <ScrollLockFix />
              <ScrollToTop />
              {children}
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>

        {/* Cookie Consent Banner */}
        <CookieBanner />

        {/* AI Support Chatbot */}
        <ChatWidgetLoader />
      </body>
    </html>
  );
}
