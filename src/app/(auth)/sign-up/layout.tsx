import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Create Your LinkedGrow Account",
  description:
    "Create your LinkedGrow account and start a 7-day Pro trial. Bring your own API key for unlimited AI post generation. No credit card required.",
  openGraph: {
    title: "Sign Up - Create Your LinkedGrow Account",
    description:
      "Create your free LinkedGrow account and start growing your LinkedIn presence with AI-powered content.",
    url: "https://linkedgrow.ai/sign-up",
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
    canonical: "https://linkedgrow.ai/sign-up",
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
