import { Metadata } from "next";
import { requestAppUrl } from "@/lib/app-url-server";

export async function generateMetadata(): Promise<Metadata> {
  const APP_URL = await requestAppUrl();
  return {
    title: "Sign In - LinkedGrow",
    description:
      "Sign in to your LinkedGrow account. Access your AI-powered LinkedIn content dashboard and start creating engaging posts.",
    openGraph: {
      title: "Sign In - LinkedGrow",
      description:
        "Sign in to your LinkedGrow account and start creating AI-powered LinkedIn content.",
      url: `${APP_URL}/sign-in`,
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
      canonical: `${APP_URL}/sign-in`,
    },
  };
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
