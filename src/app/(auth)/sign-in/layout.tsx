import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - LinkedGrow",
  description:
    "Sign in to your LinkedGrow account. Access your AI-powered LinkedIn content dashboard and start creating engaging posts.",
  keywords: [
    "LinkedGrow",
    "sign in",
    "login",
    "LinkedIn AI",
    "dashboard",
  ],
  openGraph: {
    title: "Sign In - LinkedGrow",
    description:
      "Sign in to your LinkedGrow account and start creating AI-powered LinkedIn content.",
    url: "https://linkedgrow.ai/sign-in",
    siteName: "LinkedGrow",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign In - LinkedGrow",
    description:
      "Sign in to your LinkedGrow account and start creating AI-powered LinkedIn content.",
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://linkedgrow.ai/sign-in",
  },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
