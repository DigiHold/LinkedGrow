import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - LinkedGrow",
  description:
    "Learn about how LinkedGrow uses cookies and similar technologies. Understand our cookie policy and manage your preferences.",
  openGraph: {
    title: "Cookie Policy - LinkedGrow",
    description:
      "Learn about how LinkedGrow uses cookies and similar technologies.",
    url: "https://linkedgrow.ai/cookies",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - AI-Powered LinkedIn Growth Platform",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy - LinkedGrow",
    description:
      "Learn about how LinkedGrow uses cookies and similar technologies.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/cookies",
  },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
