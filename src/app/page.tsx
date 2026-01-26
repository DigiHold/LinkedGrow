import { Header } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/hero";
import { SocialProof } from "@/components/marketing/social-proof";
import { ProblemSolution } from "@/components/marketing/problem-solution";
import { BYOKSection } from "@/components/marketing/byok-section";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import { FAQJsonLd, linkedGrowFAQs } from "@/components/seo/json-ld";
import { ConversionElements } from "@/components/marketing/conversion-elements";
import { AnimatedBackground } from "@/components/marketing/animated-background";

// Note: In prelaunch mode, middleware redirects non-logged-in users to /prelaunch
// Logged-in users and admins can still access this full landing page
// About section removed - now has dedicated /about page

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Animated background with floating AI icons */}
      <AnimatedBackground />

      {/* FAQ Rich Results for Google */}
      <FAQJsonLd questions={linkedGrowFAQs} />
      <Header />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <BYOKSection />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />

      {/* Conversion optimization elements */}
      <ConversionElements />
    </main>
  );
}
