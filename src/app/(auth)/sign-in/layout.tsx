import { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Sign In - LinkedGrow",
  description:
    "Sign in to your LinkedGrow account. Access your AI-powered LinkedIn content dashboard and start creating engaging posts.",
  openGraph: {
    title: "Sign In - LinkedGrow",
    description:
      "Sign in to your LinkedGrow account and start creating AI-powered LinkedIn content.",
    url: `${getAppUrl()}/sign-in`,
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
    canonical: `${getAppUrl()}/sign-in`,
  },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
