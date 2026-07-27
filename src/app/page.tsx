import { FAQJsonLd } from "@/components/seo/json-ld";
import { V3Landing } from "@/components/v3/v3-landing";
import { V3_FAQS } from "@/components/v3/faq-data";

/**
 * The home.
 *
 * The whole page is the ported prototype: its markup, its stylesheet and its
 * behaviour, in src/components/v3/. It brings its own header and footer,
 * because the prototype's nav and footer are part of the design rather than
 * decoration around it.
 */
export default function HomePage() {
  return (
    <>
      <FAQJsonLd
        questions={V3_FAQS.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <V3Landing />
    </>
  );
}
