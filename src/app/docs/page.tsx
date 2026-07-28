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
import { V3Effects } from "@/components/v3/effects";
import {
  ASKCARD, CARVE_BASE, EB_DOT_LT, EB_LT, EM_SKY, FILL_SM, FROW, FROW_GO, FROW_H3, FROW_P,
  H1, HERO_FIELD, HERO_ORB_A, HERO_ORB_B, HERO_RINGS, LEAD, RV, SEC, WRAP, WSPLIT,
} from "@/components/v3/kit";

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
      <V3Effects />

      <main className="flex-1">
        {/* Hero */}
        <section className={`${HERO_FIELD} pb-[clamp(124px,13.5vw,190px)]`}>
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
            <span className={HERO_ORB_A}></span>
            <span className={HERO_ORB_B}></span>
            <div className={HERO_RINGS}><i></i><i></i><i></i></div>
          </div>
          <canvas
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
            id="net"
          ></canvas>
          <div className={`${WRAP} relative z-[3] text-center`}>
            <span className={`${EB_LT} ${RV}`}>
              <i className={EB_DOT_LT}></i>Documentation
            </span>
            <h1
              className={`${H1} ${WSPLIT} mx-auto mt-[26px] max-w-[16ch] text-balance text-white`}
              data-blur="3"
            >
              How can we <em className={EM_SKY}>help?</em>
            </h1>
            <p className={`${LEAD} ${RV} mx-auto mt-6 max-w-[62ch] text-[rgba(255,255,255,.76)]`}>
              Everything you need to know about using LinkedGrow to create, schedule, and grow your LinkedIn presence.
            </p>
          </div>
          <div className={`${CARVE_BASE} bg-v3-bg dark:bg-v3-bg-d`}></div>
        </section>

        {/* the categories, one per line on a rule rather than a wall of cards */}
        <section className={SEC}>
          <div className={WRAP}>
            <div className="grid grid-cols-2 gap-x-[clamp(30px,4vw,64px)] max-[860px]:grid-cols-1">
              {categories.map((category) => (
                <Link className={FROW} href={`/docs/${category.slug}`} key={category.slug}>
                  <span className="flex min-w-0 items-start gap-[13px]">
                    <span className="mt-[3px] grid h-9 w-9 flex-none place-items-center rounded-[11px] border border-v3-line bg-v3-wash text-v3-blue [transition:border-color_.3s,background_.3s,color_.3s] group-hover:border-transparent group-hover:bg-[linear-gradient(135deg,var(--color-v3-cyan),var(--color-v3-blue))] group-hover:text-white dark:border-v3-line-d dark:bg-v3-wash-d">
                      {categoryIcons[category.slug] || <HelpCircle className="h-[17px] w-[17px]" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`${FROW_H3} block`}>{category.title}</span>
                      <span className={`${FROW_P} block`}>{category.description}</span>
                      <span className="mt-1.5 block font-v3-mono text-[11.5px] uppercase tracking-[.12em] text-v3-faint dark:text-v3-faint-d">
                        {category.articleCount} {category.articleCount === 1 ? "article" : "articles"}
                      </span>
                    </span>
                  </span>
                  <span aria-hidden="true" className={FROW_GO}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="pb-[clamp(70px,8.5vw,126px)]">
          <div className={WRAP}>
            <div className={`${ASKCARD} mx-auto max-w-[640px] text-center`}>
              <b>Can&apos;t find what you&apos;re looking for?</b>
              <p>Our team is here to help. Reach out and we&apos;ll get back to you quickly.</p>
              <a className={FILL_SM} href="mailto:contact@linkedgrow.ai">
                Contact support
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
