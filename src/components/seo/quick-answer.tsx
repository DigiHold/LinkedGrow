import Image from "next/image";
import Script from "next/script";
import { V3_BLOCK } from "@/components/v3/root";
import {
  CHROME_DOT_LT, CHROME_LT, CHROME_URL_LT, EB, EB_DOT, H2, SCREEN_UI, WRAP,
} from "@/components/v3/kit";

interface QuickAnswerProps {
  question: string;
  answer: string;
  className?: string;
  /** A screen from the product, shown beside the answer rather than under it. */
  shot?: { src: string; darkSrc?: string; alt: string; width: number; height: number; url?: string };
}

export function QuickAnswer({ question, answer, className = "", shot }: QuickAnswerProps) {
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
      {/* The first thing under the hero, so it is a section rather than a notice:
          the question as the heading, the answer at reading size, and the screen
          it is describing beside it. The two class names are load-bearing, the
          speakable schema above points at them. */}
      <section
        aria-label="Quick answer"
        className={`${V3_BLOCK} border-b border-v3-line bg-v3-bg2 py-[clamp(48px,6vw,84px)] dark:border-v3-line-d dark:bg-v3-bg2-d ${className}`}
      >
        <div className={WRAP}>
          <div
            className={
              shot
                ? "grid grid-cols-[1.02fr_.98fr] items-center gap-[clamp(30px,5vw,68px)] max-[940px]:[grid-template-columns:minmax(0,1fr)]"
                : "max-w-[76ch]"
            }
          >
            <div>
              <span className={EB}>
                <i className={EB_DOT}></i>Quick answer
              </span>
              <p className={`quick-answer-question ${H2} mt-[18px] text-[clamp(26px,3.2vw,38px)]`}>
                {question}
              </p>
              <p className="quick-answer-text mt-[18px] max-w-[68ch] text-[16.5px] leading-[1.68]! text-v3-mut dark:text-v3-mut-d">
                {answer}
              </p>
            </div>
            {shot ? (
              <figure className={`${SCREEN_UI} m-0`}>
                <div className={CHROME_LT}>
                  <i className={CHROME_DOT_LT}></i>
                  <i className={CHROME_DOT_LT}></i>
                  <i className={CHROME_DOT_LT}></i>
                  {shot.url ? <span className={CHROME_URL_LT}>{shot.url}</span> : null}
                </div>
                <Image
                  alt={shot.alt}
                  className={shot.darkSrc ? "block h-auto w-full dark:hidden" : "block h-auto w-full"}
                  height={shot.height}
                  sizes="(max-width: 940px) 100vw, 600px"
                  src={shot.src}
                  width={shot.width}
                />
                {shot.darkSrc ? (
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="hidden h-auto w-full dark:block"
                    height={shot.height}
                    sizes="(max-width: 940px) 100vw, 600px"
                    src={shot.darkSrc}
                    width={shot.width}
                  />
                ) : null}
              </figure>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
