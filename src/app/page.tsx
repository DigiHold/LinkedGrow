import { Header } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/hero";
import { SocialProof } from "@/components/marketing/social-proof";
import { ProblemSolution } from "@/components/marketing/problem-solution";
import { BYOKSection } from "@/components/marketing/byok-section";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { About } from "@/components/marketing/about";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <BYOKSection />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <About />
      <CTASection />
      <Footer />
    </main>
  );
}
