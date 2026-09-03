import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import {
  getAllCategories,
  getAllArticleMetas,
  getAllSlugs,
  getArticle,
  getArticlesForCategory,
  getAdjacentArticles,
  extractTableOfContents,
} from "@/lib/docs";
import { DocsHeader } from "@/components/docs/docs-header";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { ArticleFeedback } from "@/components/docs/article-feedback";
import { ProseContent } from "@/components/docs/prose-content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { requestAppUrl } from "@/lib/app-url-server";
import { isCloud } from "@/lib/edition";

// The default OG image lives on the cloud's R2 bucket.
const CLOUD_OG_IMAGE = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  const categories = getAllCategories();

  const params: { slug: string[] }[] = [];

  // Category pages
  for (const cat of categories) {
    params.push({ slug: [cat.slug] });
  }

  // Article pages
  for (const slug of slugs) {
    params.push({ slug });
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const APP_URL = await requestAppUrl();

  if (slug.length === 1) {
    const categories = getAllCategories();
    const category = categories.find((c) => c.slug === slug[0]);
    if (!category) return {};

    return {
      title: `${category.title} - LinkedGrow Docs`,
      description: category.description,
      // Without this every documentation page inherits metadataBase and tells
      // a crawler it is a copy of the home page.
      alternates: { canonical: `${APP_URL}/docs/${slug[0]}` },
      openGraph: {
        title: `${category.title} - LinkedGrow Docs`,
        description: category.description,
        url: `${APP_URL}/docs/${slug[0]}`,
        siteName: "LinkedGrow",
        type: "website",
        ...(isCloud()
          ? { images: [{ url: CLOUD_OG_IMAGE, width: 1200, height: 630, alt: `${category.title} - LinkedGrow Documentation` }] }
          : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: `${category.title} - LinkedGrow Docs`,
        description: category.description,
        ...(isCloud() ? { images: [CLOUD_OG_IMAGE] } : {}),
      },
    };
  }

  if (slug.length === 2) {
    const article = await getArticle(slug[0], slug[1]);
    if (!article) return {};

    return {
      title: `${article.title} - LinkedGrow Docs`,
      description: article.description,
      alternates: { canonical: `${APP_URL}/docs/${slug[0]}/${slug[1]}` },
      openGraph: {
        title: `${article.title} - LinkedGrow Docs`,
        description: article.description,
        url: `${APP_URL}/docs/${slug[0]}/${slug[1]}`,
        siteName: "LinkedGrow",
        type: "article",
        ...(isCloud()
          ? { images: [{ url: CLOUD_OG_IMAGE, width: 1200, height: 630, alt: `${article.title} - LinkedGrow Documentation` }] }
          : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: `${article.title} - LinkedGrow Docs`,
        description: article.description,
        ...(isCloud() ? { images: [CLOUD_OG_IMAGE] } : {}),
      },
    };
  }

  return {};
}

// Category listing page
function CategoryPage({
  category,
  articles,
  searchIndex,
  APP_URL,
}: {
  category: { slug: string; title: string; description: string; overview?: string[] };
  articles: { slug: string; title: string; description: string; order: number }[];
  searchIndex: { title: string; description: string; category: string; categoryTitle: string; slug: string }[];
  APP_URL: string;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: APP_URL },
          { name: "Documentation", url: `${APP_URL}/docs` },
          { name: category.title, url: `${APP_URL}/docs/${category.slug}` },
        ]}
      />
      <DocsHeader searchIndex={searchIndex} />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-8">
            <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Docs
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-white font-medium">{category.title}</span>
          </nav>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{category.title}</h1>
          <p className={`text-lg text-slate-600 dark:text-slate-400 ${category.overview?.length ? "mb-6" : "mb-10"}`}>
            {category.description}
          </p>

          {category.overview && category.overview.length > 0 && (
            <div className="space-y-4 mb-10">
              {category.overview.map((paragraph) => (
                <p key={paragraph} className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {articles.map((article, index) => (
              <Link
                key={article.slug}
                href={`/docs/${category.slug}/${article.slug}`}
                className="group flex items-start gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition-all"
              >
                <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {article.title}
                  </h2>
                  {article.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 mt-1 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

// Article page
function ArticlePage({
  article,
  tocItems,
  prevArticle,
  nextArticle,
  sidebarArticles,
  searchIndex,
  APP_URL,
}: {
  article: {
    slug: string;
    title: string;
    description: string;
    category: string;
    categoryTitle: string;
    content: string;
  };
  tocItems: { id: string; text: string; level: number }[];
  prevArticle: { slug: string; title: string; category: string } | null;
  nextArticle: { slug: string; title: string; category: string } | null;
  sidebarArticles: { slug: string; title: string }[];
  searchIndex: { title: string; description: string; category: string; categoryTitle: string; slug: string }[];
  APP_URL: string;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: APP_URL },
          { name: "Documentation", url: `${APP_URL}/docs` },
          { name: article.categoryTitle, url: `${APP_URL}/docs/${article.category}` },
          { name: article.title, url: `${APP_URL}/docs/${article.category}/${article.slug}` },
        ]}
      />
      <DocsHeader searchIndex={searchIndex} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-10">
            {/* Sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24">
                <Link
                  href={`/docs/${article.category}`}
                  className="text-sm font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  {article.categoryTitle}
                </Link>
                <ul className="mt-3 space-y-1">
                  {sidebarArticles.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/docs/${article.category}/${a.slug}`}
                        className={`block py-1.5 px-3 text-sm rounded-lg transition-colors ${
                          a.slug === article.slug
                            ? "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 font-medium"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6">
                <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Docs
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/docs/${article.category}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  {article.categoryTitle}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-900 dark:text-white font-medium truncate">{article.title}</span>
              </nav>

              <article className="max-w-3xl">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{article.title}</h1>
                {article.description && (
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">{article.description}</p>
                )}

                <ProseContent
                  html={article.content}
                  className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline prose-a:hover:underline prose-img:rounded-xl prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800"
                />

                <ArticleFeedback articleSlug={article.slug} categorySlug={article.category} />

                {/* Prev / Next navigation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {prevArticle ? (
                    <Link
                      href={`/docs/${prevArticle.category}/${prevArticle.slug}`}
                      className="group flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                        <ArrowLeft className="w-3 h-3" /> Previous
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {prevArticle.title}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}
                  {nextArticle && (
                    <Link
                      href={`/docs/${nextArticle.category}/${nextArticle.slug}`}
                      className="group flex flex-col items-end p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                        Next <ArrowRight className="w-3 h-3" />
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {nextArticle.title}
                      </span>
                    </Link>
                  )}
                </div>
              </article>
            </div>

            {/* Table of Contents */}
            <TableOfContents items={tocItems} />
          </div>
        </div>
      </main>
    </>
  );
}

export default async function DocsSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const APP_URL = await requestAppUrl();
  const allArticles = getAllArticleMetas();
  const searchIndex = allArticles.map((a) => ({
    title: a.title,
    description: a.description,
    category: a.category,
    categoryTitle: a.categoryTitle,
    slug: a.slug,
  }));

  // Category page: /docs/[category]
  if (slug.length === 1) {
    const categories = getAllCategories();
    const category = categories.find((c) => c.slug === slug[0]);
    if (!category) notFound();

    const articles = getArticlesForCategory(slug[0]);
    if (articles.length === 0) notFound();

    return <CategoryPage category={category} articles={articles} searchIndex={searchIndex} APP_URL={APP_URL} />;
  }

  // Article page: /docs/[category]/[article]
  if (slug.length === 2) {
    const article = await getArticle(slug[0], slug[1]);
    if (!article) notFound();

    const tocItems = extractTableOfContents(article.content);
    const { prev, next } = getAdjacentArticles(slug[0], slug[1]);
    const sidebarArticles = getArticlesForCategory(slug[0]);

    return (
      <ArticlePage
        article={article}
        tocItems={tocItems}
        prevArticle={prev}
        nextArticle={next}
        sidebarArticles={sidebarArticles}
        searchIndex={searchIndex}
        APP_URL={APP_URL}
      />
    );
  }

  notFound();
}
