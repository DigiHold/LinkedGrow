import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { FAQJsonLd } from "@/components/seo/json-ld";
import { StickyMobileCTA } from "@/components/marketing/sticky-mobile-cta";
import { V3Hero } from "@/components/v3/hero";
import { V3Problem } from "@/components/v3/problem";
import { V3AgentJobs } from "@/components/v3/agent-jobs";
import { V3Setup } from "@/components/v3/setup";
import { V3Mcp } from "@/components/v3/mcp";
import { V3AntiSlop } from "@/components/v3/anti-slop";
import { V3Safety } from "@/components/v3/safety";
import { V3Testimonials } from "@/components/v3/testimonials";
import { V3Pricing } from "@/components/v3/pricing";
import { V3Faq } from "@/components/v3/faq";
import { V3_FAQS } from "@/components/v3/faq-data";
import { V3FinalCta } from "@/components/v3/final-cta";

/**
 * The v3 home.
 *
 * Rebuilt from the approved prototype. The story is the repositioning: the
 * agent finds the buyers and opens the conversation, and the content half is
 * mentioned once, near the end, where it belongs now.
 *
 * The animated background and the old marketing sections are gone from this
 * page. They still serve the other marketing pages until each one is moved
 * across, which is the order plan section 10d sets.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white dark:bg-slate-950">
      <FAQJsonLd
        questions={V3_FAQS.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <Header onDark />
      <V3Hero />
      <V3Problem />
      <V3AgentJobs />
      <V3Setup />
      <V3Mcp />
      <V3AntiSlop />
      <V3Safety />
      <V3Testimonials />
      <V3Pricing />
      <V3Faq />
      <V3FinalCta />
      <Footer />
      <StickyMobileCTA />
    </main>
  );
}
