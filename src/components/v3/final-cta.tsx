import { Btn } from "./primitives";

export function V3FinalCta() {
  return (
    <section className="relative isolate overflow-hidden py-[clamp(80px,9vw,130px)]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[#07204f]"
        style={{
          backgroundImage:
            "radial-gradient(60% 60% at 20% 0%, #00c5e8 0%, transparent 60%), radial-gradient(70% 70% at 85% 100%, #2a6ff5 0%, transparent 62%)",
        }}
      />
      <div className="mx-auto w-full max-w-[1180px] px-5 text-center sm:px-7">
        <p className="font-instrument text-[13px] font-medium uppercase tracking-[0.16em] text-white/55">
          Twenty seconds, no card asked
        </p>
        <h2 className="mx-auto mt-5 max-w-[17ch] font-grotesk text-[clamp(32px,5vw,58px)] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
          See your buyers before you spend anything.
        </h2>
        <p className="mx-auto mt-5 max-w-[60ch] font-instrument text-[clamp(15px,1.4vw,17.5px)] leading-[1.62] text-white/70">
          Type your website. LinkedGrow comes back with your ideal customer, the
          competitors who share your audience, and the first real people worth
          talking to.
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

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <span className="font-grotesk text-[20px] font-semibold text-white">179+</span>
          <span className="font-instrument text-[13.5px] text-white/60">
            founders already run their LinkedIn with LinkedGrow
          </span>
        </div>
      </div>
    </section>
  );
}
