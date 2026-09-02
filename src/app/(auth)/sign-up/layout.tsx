import { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Sign Up - Create Your LinkedGrow Account",
  description:
    "Create your LinkedGrow account and start a 7-day Pro trial. Bring your own API key for unlimited AI post generation. Everything included.",
  openGraph: {
    title: "Sign Up - Create Your LinkedGrow Account",
    description:
      "Create your free LinkedGrow account and start growing your LinkedIn presence with AI-powered content.",
    url: `${getAppUrl()}/sign-up`,
    siteName: "LinkedGrow",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign Up - LinkedGrow",
    description:
      "Create your free LinkedGrow account and start growing your LinkedIn presence.",
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${getAppUrl()}/sign-up`,
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
