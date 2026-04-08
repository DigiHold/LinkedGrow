import { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  PenTool,
  Layers,
  Calendar,
  Linkedin,
  Key,
  Settings,
  CreditCard,
  Shield,
  Building2,
  HelpCircle,
} from "lucide-react";
import { getAllCategories, getAllArticleMetas } from "@/lib/docs";
import { DocsHeader } from "@/components/docs/docs-header";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Documentation - LinkedGrow Help Center",
  description: "Learn how to use LinkedGrow to create, schedule, and optimize your LinkedIn content. Guides for BYOK setup, content creation, scheduling, and more.",
  openGraph: {
    title: "Documentation - LinkedGrow Help Center",
    description: "Learn how to use LinkedGrow to create, schedule, and optimize your LinkedIn content. Guides for BYOK setup, content creation, scheduling, and more.",
    url: "https://linkedgrow.ai/docs",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation - LinkedGrow Help Center",
    description: "Learn how to use LinkedGrow to create, schedule, and optimize your LinkedIn content.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
};

const categoryIcons: Record<string, React.ReactNode> = {
  "getting-started": <Rocket className="w-6 h-6" />,
  "content-creation": <PenTool className="w-6 h-6" />,
  carousel: <Layers className="w-6 h-6" />,
  scheduling: <Calendar className="w-6 h-6" />,
  "linkedin-integration": <Linkedin className="w-6 h-6" />,
  byok: <Key className="w-6 h-6" />,
  settings: <Settings className="w-6 h-6" />,
  billing: <CreditCard className="w-6 h-6" />,
  "account-security": <Shield className="w-6 h-6" />,
  "business-features": <Building2 className="w-6 h-6" />,
  faq: <HelpCircle className="w-6 h-6" />,
};

const categoryColors: Record<string, string> = {
  "getting-started": "from-emerald-500 to-teal-600",
  "content-creation": "from-violet-500 to-purple-600",
  carousel: "from-pink-500 to-rose-600",
  scheduling: "from-blue-500 to-indigo-600",
  "linkedin-integration": "from-sky-500 to-blue-600",
  byok: "from-amber-500 to-orange-600",
  settings: "from-slate-500 to-slate-600",
  billing: "from-green-500 to-emerald-600",
  "account-security": "from-red-500 to-rose-600",
  "business-features": "from-cyan-500 to-blue-600",
  faq: "from-indigo-500 to-violet-600",
};

export default function DocsPage() {
  const categories = getAllCategories();
  const allArticles = getAllArticleMetas();

  const searchIndex = allArticles.map((a) => ({
    title: a.title,
    description: a.description,
    category: a.category,
    categoryTitle: a.categoryTitle,
    slug: a.slug,
  }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "Documentation", url: "https://linkedgrow.ai/docs" },
        ]}
      />
      <DocsHeader searchIndex={searchIndex} />

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-linear-to-br from-cyan-50 via-blue-50 to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to know about using LinkedGrow to create, schedule, and grow your LinkedIn presence.
            </p>
          </div>
        </div>

        {/* Categories grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/docs/${category.slug}`}
                className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${categoryColors[category.slug] || "from-slate-500 to-slate-600"} flex items-center justify-center text-white mb-4`}>
                  {categoryIcons[category.slug] || <HelpCircle className="w-6 h-6" />}
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {category.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {category.description}
                </p>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-500">
                  {category.articleCount} {category.articleCount === 1 ? "article" : "articles"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center p-8 sm:p-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Our team is here to help. Reach out and we&apos;ll get back to you quickly.
            </p>
            <a
              href="mailto:contact@linkedgrow.ai"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all"
            >
              Contact support
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
