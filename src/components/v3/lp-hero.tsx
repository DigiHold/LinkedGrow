"use client";

import type { ReactNode } from "react";

import {
  ANN,
  AVS,
  CARVE,
  CHROME_DK,
  CHROME_DOT_DK,
  CHROME_URL_DK,
  EB_DOT_LT,
  EB_LT,
  H1,
  HERO_FIELD,
  HERO_ORB_A,
  HERO_ORB_B,
  HERO_RINGS,
  LEAD,
  NOTE,
  PH,
  PH_CHIP,
  PH_MK,
  RV,
  SCREEN_DK,
  TR,
  VID,
  WRAP,
  WSPLIT,
} from "./kit";
import { V3UrlForm } from "./url-form";

/**
 * The home's converting hero, lifted so a landing page can use it too.
 *
 * The keyword pages were built as explanation: a headline, a paragraph, then
 * sections. The home converts because the first screen asks for the website
 * address before it argues anything, backs the ask with the trial line and the
 * founder count, and then shows the product moving. Same order here, so a
 * visitor arriving on a keyword meets the same funnel as one arriving on the
 * home rather than a document about the product.
 */

const AVATARS = [1, 2, 3, 4, 5].map(
  (n) => `https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person${n}.avif`
);

export function LpHero({
  badge,
  headline,
  em,
  lead,
  formLabel,
  video,
  annotations,
}: {
  badge: string;
  headline: string;
  /** The run that renders in sky. Kept separate so the H1 never carries a br. */
  em: ReactNode;
  lead: string;
  formLabel?: string;
  video: { url: string; caption: string; number: string };
  /** Two handwritten notes with arrows, as on the home. Wide screens only. */
  annotations?: { left: string; right: string };
}) {
  return (
    <section className={HERO_FIELD}>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
        <span className={HERO_ORB_A}></span>
        <span className={HERO_ORB_B}></span>
        <div className={HERO_RINGS}><i></i><i></i><i></i></div>
        <canvas
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          id="net"
        ></canvas>
      </div>

      <div className={`${WRAP} relative z-[3] text-center`}>
        <span className={`${EB_LT} ${RV}`}>
          <i className={EB_DOT_LT}></i>
          {badge}
        </span>

        <h1
          className={`${H1} ${WSPLIT} mx-auto mt-[26px] max-w-[21ch] text-balance text-white`}
          data-blur="3"
        >
          {headline} {em}
        </h1>

        <p
          className={`${LEAD} ${RV} mx-auto mt-6 max-w-[62ch] text-[rgba(255,255,255,.76)]`}
          style={{ "--d0": ".1s" } as React.CSSProperties}
        >
          {lead}
        </p>

        <V3UrlForm className={`${RV} mt-9`} label={formLabel} />

        <p
          className={`${RV} mt-[15px] text-[13.5px] text-[rgba(255,255,255,.55)] [&_b]:font-semibold [&_b]:text-[rgba(255,255,255,.85)]`}
          style={{ "--d0": ".28s" } as React.CSSProperties}
        >
          <b>7-day free trial</b> on the Pro plan · Everything included · The AI is
          in the price
        </p>

        <div
          className={`${TR} ${RV} mt-[38px]`}
          style={{ "--d0": ".35s" } as React.CSSProperties}
        >
          <span aria-hidden="true" className={AVS}>
            {AVATARS.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" key={src} loading="lazy" src={src} />
            ))}
          </span>
          <span>
            <b>179+</b> founders already run their LinkedIn with LinkedGrow
          </span>
        </div>
      </div>

      {/* The product, moving, directly under the ask. */}
      <div className={`${WRAP} relative z-[3]`}>
        <div className="relative z-[4] mt-[clamp(44px,5.5vw,72px)]">
          {annotations && (
            <>
              <div className={`${ANN} left-[-250px] top-[10%]`}>
                <div className={NOTE}>{annotations.left}</div>
                <svg
                  fill="none"
                  height="58"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  viewBox="0 0 92 58"
                  width="92"
                >
                  <path d="M3 6c25 2 51 15 68 36" />
                  <path d="M61 44l12 1-3-12" />
                </svg>
              </div>
              <div className={`${ANN} right-[-250px] top-[55%]`}>
                <svg
                  fill="none"
                  height="58"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  viewBox="0 0 92 58"
                  width="92"
                >
                  <path d="M89 8C63 12 35 25 21 48" />
                  <path d="M32 46l-12 3 2-12" />
                </svg>
                <div className={`${NOTE} [transform:rotate(2.5deg)]`}>
                  {annotations.right}
                </div>
              </div>
            </>
          )}

          <div className={`crop relative ${RV}`}>
            <span></span>
            <figure className={SCREEN_DK}>
              <div className={CHROME_DK}>
                <i className={CHROME_DOT_DK}></i>
                <i className={CHROME_DOT_DK}></i>
                <i className={CHROME_DOT_DK}></i>
                <span className={CHROME_URL_DK}>{video.url}</span>
              </div>
              <div className={VID}>
                <video autoPlay loop muted playsInline></video>
                <div className={PH}>
                  <span className={PH_MK}>
                    <svg>
                      <use href="#mark" />
                    </svg>
                  </span>
                  <small>{video.number}</small>
                  <b>{video.caption}</b>
                  <span className={PH_CHIP}>
                    1920 × 1080 · silent loop · around 18 seconds
                  </span>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </div>

      <div className={CARVE}></div>
    </section>
  );
}
