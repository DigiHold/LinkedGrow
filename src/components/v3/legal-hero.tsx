import {
  CARVE_BASE, EB_DOT_LT, EB_LT, H1, HERO_FIELD, HERO_ORB_A, HERO_ORB_B, HERO_RINGS, WRAP,
} from "@/components/v3/kit";
import { V3Effects } from "@/components/v3/effects";

/**
 * The opening band for a legal page.
 *
 * These pages had no hero at all: a heading in black on white under the fixed
 * header, which reads as a document somebody forgot to design. They get the
 * same field as the rest of the site, at a shorter height, because a privacy
 * policy should look like it belongs to the product it governs.
 */
export function LegalHero({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
}) {
  return (
    <section className={`${HERO_FIELD} pt-[clamp(120px,13vw,168px)]`}>
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
      <V3Effects />
      <div className={`${WRAP} relative z-[3] max-w-[900px]! pb-[clamp(104px,12vw,150px)]`}>
        <span className={EB_LT}>
          <i className={EB_DOT_LT}></i>
          {eyebrow}
        </span>
        <h1 className={`${H1} mt-[22px] max-w-[18ch] text-balance text-[clamp(36px,5.2vw,64px)] text-white`}>
          {title}
        </h1>
        {meta ? (
          <p className="mt-5 font-v3-mono text-[12px] uppercase tracking-[.14em] text-[rgba(255,255,255,.6)]">
            {meta}
          </p>
        ) : null}
      </div>
      <div className={`${CARVE_BASE} bg-v3-bg dark:bg-v3-bg-d`}></div>
    </section>
  );
}
