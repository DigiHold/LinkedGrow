import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Switch from ChatGPT to Claude - Free 10-Day Mastery Course | LinkedGrow",
  description:
    "Switching from ChatGPT to Claude? Master Claude in 10 days with our free email course. Learn Projects, Artifacts, Extended Thinking, Claude Code, and everything that makes Claude the best ChatGPT alternative in 2026.",
  keywords: [
    "ChatGPT to Claude",
    "switch to Claude",
    "ChatGPT alternative",
    "ChatGPT vs Claude",
    "Claude AI course",
    "learn Claude AI",
    "Claude tutorial",
    "Claude for beginners",
    "move from ChatGPT to Claude",
    "Claude Projects",
    "Claude Artifacts",
    "Claude Code",
  ],
  openGraph: {
    title: "Switch from ChatGPT to Claude - Free 10-Day Course",
    description:
      "Master Claude in 10 days. Transfer your ChatGPT data, learn Projects, Artifacts, Extended Thinking, and build websites and apps - all in free daily emails.",
    url: "https://linkedgrow.ai/switch-to-claude",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "Switch from ChatGPT to Claude - Free 10-Day Mastery Course",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Switch from ChatGPT to Claude - Free 10-Day Course",
    description:
      "Master Claude in 10 days. Transfer your ChatGPT data, learn Projects, Artifacts, Extended Thinking, and build websites and apps.",
    images: [
      "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
    ],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/switch-to-claude",
  },
};

export default function SwitchToClaudeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
