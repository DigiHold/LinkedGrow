import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { generateCMSMetadata } from "@/components/cms/cms-page";
import { getPublishedPage } from "@/lib/cms";
import CookiesClient from "./cookies-client";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("cookies");
  if (page) return generateCMSMetadata(page);
  return {
    title: "Cookie Policy - LinkedGrow",
    description: "Learn about how LinkedGrow uses cookies and similar technologies.",
  };
}

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

  return <CookiesClient translations={translations} />;
}
