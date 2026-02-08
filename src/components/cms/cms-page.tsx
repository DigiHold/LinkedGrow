// Shared CMS page layout for all public CMS-rendered pages
// Server component - zero client JS for visitors
import { notFound } from "next/navigation";
import { getPublishedPage, getCanonicalUrl } from "@/lib/cms";
import type { CMSPageData } from "@/lib/cms";
import type { Metadata } from "next";
import { CMSRenderer } from "./cms-renderer";
import { FAQJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { PrelaunchHeader } from "@/components/prelaunch/prelaunch-header";
import { PrelaunchFooter } from "@/components/prelaunch/prelaunch-footer";

const APP_URL = "https://linkedgrow.ai";

/**
 * Generate Next.js metadata from CMS page data
 */
export function generateCMSMetadata(page: CMSPageData): Metadata {
  const canonicalUrl = page.canonicalUrl || getCanonicalUrl(page.slug);

  return {
    title: page.seoTitle || page.slug,
    description: page.seoDescription || undefined,
    keywords: page.seoKeywords?.split(",").map((k) => k.trim()) || undefined,
    openGraph: {
      title: page.ogTitle || page.seoTitle || page.slug,
      description: page.ogDescription || page.seoDescription || undefined,
      url: canonicalUrl,
      siteName: "LinkedGrow",
      type: "website",
      ...(page.ogImage ? { images: [{ url: page.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: page.ogTitle || page.seoTitle || page.slug,
      description: page.ogDescription || page.seoDescription || undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

interface CMSPageProps {
  slug: string;
}

/**
 * Render a CMS page with layout, toolbar, JSON-LD, header, footer
 */
export async function CMSPage({ slug }: CMSPageProps) {
  const page = await getPublishedPage(slug);

  if (!page) {
    notFound();
  }

  // Build breadcrumb items
  const parts = page.slug.split("/");
  const breadcrumbs = [
    { name: "Home", url: APP_URL },
    ...parts.map((part, i) => ({
      name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
      url: `${APP_URL}/${parts.slice(0, i + 1).join("/")}`,
    })),
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      {page.faq && page.faq.length > 0 && <FAQJsonLd questions={page.faq} />}

      <PrelaunchHeader editSlug={page.slug} pageStatus={page.status} />

      <main className="pt-20">
        {/* Hero area with page title */}
        {page.seoTitle && (
          <section className="py-16 sm:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                {page.seoTitle.replace(" | LinkedGrow", "").replace(" - LinkedGrow", "")}
              </h1>
              {page.seoDescription && (
                <p className="mt-4 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {page.seoDescription}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Content blocks */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <CMSRenderer blocks={page.content} />
          </div>
        </section>
      </main>

      <PrelaunchFooter />
    </>
  );
}
