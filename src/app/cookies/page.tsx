import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import CookiesClient from "./cookies-client";

export const metadata: Metadata = {
  title: "Cookie Policy | LinkedGrow",
  description:
    "How LinkedGrow uses cookies and similar technologies. Learn what we collect, why we collect it, and how to manage your cookie preferences.",
  openGraph: {
    title: "Cookie Policy | LinkedGrow",
    description:
      "How LinkedGrow uses cookies and similar technologies. Learn what we collect, why we collect it, and how to manage your cookie preferences.",
    url: "https://linkedgrow.ai/cookies",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow Cookie Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | LinkedGrow",
    description:
      "How LinkedGrow uses cookies. Learn what we collect, why, and how to manage your cookie preferences.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/cookies",
  },
};

export default async function CookiesPage() {
  const t = await getTranslations("cookies");

  const translations = {
    title: t("title"),
    lastUpdated: t("lastUpdated"),
    section1: {
      title: t("section1.title"),
      description: t("section1.description"),
    },
    section2: {
      title: t("section2.title"),
      description: t("section2.description"),
      items: t.raw("section2.items") as string[],
    },
    section3: {
      title: t("section3.title"),
      alwaysActive: t("section3.alwaysActive"),
    },
    section4: {
      title: t("section4.title"),
      description: t("section4.description"),
      ga: {
        title: t("section4.ga.title"),
        description: t("section4.ga.description"),
        link: t("section4.ga.link"),
      },
      gads: {
        title: t("section4.gads.title"),
        description: t("section4.gads.description"),
        link: t("section4.gads.link"),
      },
      meta: {
        title: t("section4.meta.title"),
        description: t("section4.meta.description"),
        link: t("section4.meta.link"),
      },
      linkedin: {
        title: t("section4.linkedin.title"),
        description: t("section4.linkedin.description"),
        link: t("section4.linkedin.link"),
      },
      tiktok: {
        title: t("section4.tiktok.title"),
        description: t("section4.tiktok.description"),
        link: t("section4.tiktok.link"),
      },
    },
    section5: {
      title: t("section5.title"),
      description: t("section5.description"),
      items: t.raw("section5.items") as string[],
      reset: {
        title: t("section5.reset.title"),
        description: t("section5.reset.description"),
        button: t("section5.reset.button"),
        cleared: t("section5.reset.cleared"),
      },
    },
    section6: {
      title: t("section6.title"),
      description: t("section6.description"),
    },
    section7: {
      title: t("section7.title"),
      description: t("section7.description"),
    },
    section8: {
      title: t("section8.title"),
      description: t("section8.description"),
    },
    section9: {
      title: t("section9.title"),
      description: t("section9.description"),
      email: t("section9.email"),
      moreInfo: t("section9.moreInfo"),
      privacyLink: t("section9.privacyLink"),
    },
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "Cookie Policy", url: "https://linkedgrow.ai/cookies" },
        ]}
      />
      <CookiesClient translations={translations} />
    </>
  );
}
