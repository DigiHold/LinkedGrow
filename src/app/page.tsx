import { FAQJsonLd } from "@/components/seo/json-ld";
import { V3Header } from "@/components/v3/header";
import { V3Landing } from "@/components/v3/v3-landing";
import { V3Footer } from "@/components/v3/footer";
import { V3_FAQS } from "@/components/v3/faq-data";

/**
 * The home: the prototype's header, its sections and its footer.
 *
 * onDark because the hero is a dark field the nav sits directly on. Every
 * other marketing page starts on white and leaves it off.
 */
export default function HomePage() {
  return (
    <>
      <FAQJsonLd
        questions={V3_FAQS.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <V3Header onDark />
      <V3Landing />
      <V3Footer />
    </>
  );
}
