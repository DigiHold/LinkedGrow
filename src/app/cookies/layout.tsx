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
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy - LinkedGrow",
    description:
      "Learn about how LinkedGrow uses cookies and similar technologies.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://linkedgrow.ai/cookies",
  },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
