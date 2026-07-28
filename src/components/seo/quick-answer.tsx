import Script from "next/script";

interface QuickAnswerProps {
  question: string;
  answer: string;
  className?: string;
}

export function QuickAnswer({ question, answer, className = "" }: QuickAnswerProps) {
  const wordCount = answer.trim().split(/\s+/).length;

  if (process.env.NODE_ENV !== "production") {
    if (wordCount < 30 || wordCount > 80) {
      console.warn(
        `[QuickAnswer] Answer is ${wordCount} words. Target: 40-60 words for optimal AI Overview extraction.`
      );
    }
  }

  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".quick-answer-question", ".quick-answer-text"],
    },
  };

  return (
    <>
      <Script
        id="speakable-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
      />
      {/* The answer a search engine lifts, so it stays one block with its own
          ground: a gradient rule down the side, the question in the display
          face, the answer at reading size. The two class names are load-bearing,
          the speakable schema above points at them. */}
      <aside
        aria-label="Quick answer"
        className={`relative my-[clamp(26px,3vw,38px)] overflow-hidden rounded-[18px] border border-v3-line bg-v3-wash py-[clamp(22px,2.6vw,30px)] pl-[clamp(24px,3vw,34px)] pr-[clamp(20px,2.6vw,30px)] dark:border-v3-line-d dark:bg-v3-wash-d ${className}`}
      >
        <span className="absolute bottom-0 left-0 top-0 w-[3px] [background:linear-gradient(180deg,var(--color-v3-cyan),var(--color-v3-blue))]"></span>
        <p className="quick-answer-question m-0 font-v3-display text-[clamp(17px,1.8vw,20px)] font-semibold leading-[1.3] tracking-[-.03em] text-v3-ink dark:text-v3-ink-d">
          <span className="mb-[9px] block font-v3-mono text-[10.5px] font-medium uppercase tracking-[.15em] text-v3-blue">
            Quick answer
          </span>
          {question}
        </p>
        <p className="quick-answer-text mt-[13px] max-w-[68ch] text-[16px] leading-[1.66]! text-v3-ink2 dark:text-v3-ink2-d">
          {answer}
        </p>
      </aside>
    </>
  );
}
