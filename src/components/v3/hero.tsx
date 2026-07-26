import { Btn, Scribble, VideoSlot } from "./primitives";

/**
 * The v3 hero.
 *
 * A dark gradient field with a faint grid, the statement in white, and the
 * product footage sitting half in and half out of it. The trust line under the
 * button carries the three things a founder checks before typing a URL: what
 * the trial is, that it cancels, and that the address and the AI are included.
 */
export function V3Hero() {
  return (
    <section className="relative isolate overflow-visible pt-[clamp(146px,17vw,204px)]">
      {/* The field itself. Three overlapping radials rather than one gradient,
          which is what stops it reading as a template header. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[#07204f]"
        style={{
          backgroundImage:
            "radial-gradient(48% 40% at 12% -6%, #7fd4f0 0%, transparent 62%), radial-gradient(56% 46% at 88% -8%, #00c5e8 0%, transparent 58%), radial-gradient(70% 52% at 50% 22%, #2a6ff5 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(78% 62% at 50% 20%, #000 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(78% 62% at 50% 20%, #000 0%, transparent 78%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 text-center sm:px-7">
        <p className="font-instrument text-[13px] font-medium uppercase tracking-[0.16em] text-white/60">
          The LinkedIn agent for founders and sales teams
        </p>

        <h1 className="mx-auto mt-[26px] max-w-[19ch] font-grotesk text-[clamp(38px,6.4vw,74px)] font-semibold leading-[1.02] tracking-[-0.04em] text-white">
          Your agent finds your buyers and starts the conversation.
        </h1>

        <p className="mx-auto mt-6 max-w-[62ch] font-instrument text-[clamp(16px,1.5vw,19px)] leading-[1.6] text-white/[0.76]">
          Enter your website. LinkedGrow works out who actually buys from you,
          finds those exact people on LinkedIn, and opens a real conversation
          every working day. You show up when somebody answers.
        </p>

        <div className="mx-auto mt-9 flex max-w-[560px] flex-col items-stretch gap-3 sm:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-white/20 bg-white/10 px-4 backdrop-blur-sm">
            <span className="font-mono text-[13px] text-white/45">https://</span>
            <input
              type="text"
              aria-label="Your website"
              placeholder="yourcompany.com"
              className="w-full bg-transparent py-[13px] pl-1 font-instrument text-[15px] text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
          <Btn href="/sign-up" variant="grad" className="shrink-0">
            Launch my agent for free
          </Btn>
        </div>

        <p className="mt-4 font-instrument text-[13.5px] text-white/55">
          <span className="font-semibold text-white/80">7-day free trial</span> on
          the Pro plan · Cancel any time · Dedicated IP and AI included
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <span className="font-grotesk text-[22px] font-semibold text-white">179+</span>
          <span className="font-instrument text-[14px] text-white/60">
            founders already run their LinkedIn with LinkedGrow
          </span>
        </div>
      </div>

      {/* The footage overlaps the fold, so the first scroll lands inside the
          product rather than on another band of marketing. */}
      <div className="relative z-10 mx-auto mt-14 w-full max-w-[1180px] px-5 pb-[clamp(70px,8vw,110px)] sm:px-7">
        <div className="relative">
          <Scribble className="absolute -left-2 -top-10 hidden -rotate-6 text-white/80 lg:block">
            no template,
            <br />
            no &ldquo;I saw your post&rdquo;
          </Scribble>
          <Scribble className="absolute -right-4 -top-10 hidden rotate-3 text-white/80 lg:block">
            every lead shows you
            <br />
            the post it came from
          </Scribble>
          <div className="overflow-hidden rounded-[20px] border border-white/15 bg-white/[0.06] p-2 shadow-[0_40px_100px_-40px_rgba(3,12,35,.8)] backdrop-blur-sm">
            <VideoSlot
              url="app.linkedgrow.ai/agents/saas-founders"
              label="Video 01"
              title="Agent overview, the funnel filling in real time"
              note="1920 × 1080 · silent loop · around 18 seconds"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
