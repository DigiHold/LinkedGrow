"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Bot, CalendarDays, Check, Clock, Loader2, Users, Video } from "lucide-react";

/**
 * The demo booker that stands where a hero video usually stands.
 *
 * Availability is defined in the host's timezone on the server and arrives
 * here as UTC seconds; every label is formatted in the visitor's own zone,
 * because a slot shown in the wrong zone is a call nobody turns up to.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface SlotsPayload {
  slots: number[];
  durationMinutes: number;
}

export function DemoBooker({
  avatarUrl,
  framed = false,
  stacked = false,
}: {
  avatarUrl: string;
  framed?: boolean;
  /**
   * The demo-modal shape: no brand rail, calendar full width, and the hours
   * of the picked day inline below it in one scrollable row. The page keeps
   * the wide three-column layout; the modal cannot afford it.
   */
  stacked?: boolean;
}) {
  const [slots, setSlots] = useState<number[]>([]);
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
    } catch {
      return "Europe/Paris";
    }
  }, []);
  const tzShort = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/book-demo/slots")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("slots"))))
      .then((data: SlotsPayload) => {
        if (cancelled) return;
        setSlots(data.slots ?? []);
        setDuration(data.durationMinutes ?? 15);
      })
      .catch(() => setError("The calendar did not load. Reload the page or write to contact@linkedgrow.ai."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Visitor-local calendar key (YYYY-MM-DD) for a slot. */
  const dayKey = (seconds: number) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(seconds * 1000));

  const byDay = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const s of slots) {
      const k = dayKey(s);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, tz]);

  const time = (seconds: number) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(seconds * 1000));

  const longDay = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(y as number, (m as number) - 1, d as number));
  };

  const monthGrid = () => {
    const first = new Date(view.y, view.m, 1);
    const blanks = (first.getDay() + 6) % 7;
    const count = new Date(view.y, view.m + 1, 0).getDate();
    return { blanks, count };
  };

  const keyFor = (day: number) =>
    `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const submit = async () => {
    if (armed === null) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotStart: armed, name, email, website, note, timezone: tz }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.taken) {
          setSlots((prev) => prev.filter((s) => s !== armed));
          setArmed(null);
          setStep(1);
        }
        throw new Error(data?.error || "The booking could not be saved");
      }
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The booking could not be saved");
    } finally {
      setSending(false);
    }
  };

  const daySlots = pickedDay ? byDay.get(pickedDay) ?? [] : [];
  const open = !!pickedDay && step === 1;

  return (
    <div className={`mx-auto w-fit max-w-full overflow-hidden bg-white dark:bg-slate-900 ${framed ? "" : "rounded-3xl border border-slate-200 shadow-[0_24px_60px_rgba(11,33,84,0.10)] dark:border-white/10 dark:shadow-[0_24px_60px_rgba(0,0,0,0.5)]"}`}>
      {!framed && <div className="h-1 w-full bg-linear-to-r from-blue-600 to-cyan-500" />}

      {step === 1 && (
        <div
          className={stacked ? "" : "grid transition-[grid-template-columns] duration-500 ease-out lg:min-h-[520px]"}
          style={{ gridTemplateColumns: undefined }}
        >
          <div className={stacked ? "" : "grid lg:grid-cols-[300px_440px_auto]"}>
            {/* Brand rail */}
            {!stacked && (
            <aside className="relative overflow-hidden bg-linear-to-br from-blue-500 via-blue-600 to-blue-800 p-7 text-white">
              <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:46px_46px]" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/30 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <Image
                    src={avatarUrl}
                    alt="Nicolas Lecocq"
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full border-2 border-white/75 object-cover"
                  />
                  <div className="text-sm">
                    <strong className="block text-[15px] font-semibold text-white">Nicolas Lecocq</strong>
                    <span className="text-white/75">Founder</span>
                  </div>
                </div>
                <h2 className="mt-5 font-display text-[27px] font-bold leading-tight tracking-tight text-balance">
                  Pick a time, we <span className="text-cyan-300">show you</span> the agent
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  A short Google Meet where we build an agent from your own website, show what it
                  would go after, and answer every question you have.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-white/80">
                  <li className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-cyan-300" />
                    <span><b className="font-semibold text-white">{duration} minutes</b>, no fluff</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Video className="h-4 w-4 shrink-0 text-cyan-300" />
                    <span><b className="font-semibold text-white">Google Meet</b>, link sent by email</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 shrink-0 text-cyan-300" />
                    <span>No account needed</span>
                  </li>
                </ul>
              </div>
            </aside>
            )}

            {/* Calendar */}
            <section className="p-7">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-[17px] font-bold text-slate-900 dark:text-white">
                  {MONTHS[view.m]} {view.y}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }))}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }))}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    ›
                  </button>
                </div>
              </div>

              {!pickedDay && (
                <p className="mb-3.5 text-[13px] text-slate-500 dark:text-slate-400">
                  {loading ? "Loading open times..." : "Days in blue have open times. Pick one to see the hours."}
                </p>
              )}

              <div className="mb-1.5 grid grid-cols-7 gap-1.5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d} className="py-1 text-center text-[11px] uppercase tracking-widest text-slate-400">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: monthGrid().blanks }).map((_, i) => (
                  <span key={`b${i}`} />
                ))}
                {Array.from({ length: monthGrid().count }).map((_, i) => {
                  const day = i + 1;
                  const k = keyFor(day);
                  const has = byDay.has(k);
                  const isPicked = pickedDay === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={!has}
                      onClick={() => { setPickedDay(k); setArmed(null); }}
                      className={[
                        "relative grid aspect-square place-items-center rounded-xl text-sm tabular-nums transition-colors",
                        isPicked
                          ? "bg-linear-to-br from-blue-600 to-cyan-500 font-bold text-white"
                          : has
                            ? "bg-blue-50 font-bold text-blue-600 hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                            : "text-slate-400/60 dark:text-slate-600",
                      ].join(" ")}
                    >
                      {day}
                      {has && (
                        <span
                          className={`absolute bottom-1.5 h-1 w-1 rounded-full ${isPicked ? "bg-white" : "bg-cyan-500"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-[13px] text-slate-500 dark:text-slate-400">
                Times shown in {tzShort}
              </p>
            </section>

            {/* Hours, hidden until a day is picked. Stacked: one scrollable
                row right under the calendar, the modal's shape. */}
            {stacked && pickedDay && (
              <div className="border-t border-slate-200 px-5 py-4 dark:border-white/10">
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                  <span className="font-display text-[14.5px] font-bold text-slate-900 dark:text-white">
                    {longDay(pickedDay)}
                  </span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400">Your time</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#475569_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                  {daySlots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setArmed(s)}
                      className={
                        armed === s
                          ? "shrink-0 rounded-xl border-[1.5px] border-blue-600 bg-blue-50 px-4 py-2.5 text-center text-sm font-bold tabular-nums text-blue-600 dark:bg-blue-500/10"
                          : "shrink-0 rounded-xl border-[1.5px] border-slate-200 px-4 py-2.5 text-center text-sm font-semibold tabular-nums text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white"
                      }
                    >
                      {time(s)}
                    </button>
                  ))}
                  {daySlots.length === 0 && (
                    <p className="text-sm text-slate-500">Nothing left on this day.</p>
                  )}
                </div>
                {/* Under the row rather than inline: squeezed between two
                    chips, half out of view, nobody read it as the way forward. */}
                {armed !== null && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-3 w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01]"
                  >
                    Next ›
                  </button>
                )}
              </div>
            )}
            {!stacked && (
            <aside
              ref={listRef}
              className={[
                "overflow-hidden border-slate-200 dark:border-white/10",
                "transition-all duration-500 ease-out",
                open
                  ? "w-full border-t p-6 lg:w-[250px] lg:border-l lg:border-t-0 lg:py-7"
                  : "max-h-0 w-full border-t-0 p-0 opacity-0 lg:max-h-none lg:w-0",
              ].join(" ")}
            >
              {pickedDay && (
                <>
                  <span className="block font-display text-[15px] font-bold text-slate-900 dark:text-white">
                    {longDay(pickedDay)}
                  </span>
                  <span className="mb-4 block text-[13px] text-slate-500 dark:text-slate-400">
                    Your time. Nicolas hosts from Paris.
                  </span>
                  <div className="grid max-h-[380px] grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden">
                    {daySlots.map((s, i) => {
                      const isArmed = armed === s;
                      if (isArmed) {
                        return (
                          <div key={s} className="col-span-2 grid grid-cols-2 gap-2">
                            <span className="rounded-xl border-[1.5px] border-blue-600 py-3 text-center text-sm font-semibold text-blue-600">
                              {time(s)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-sm font-bold text-white"
                            >
                              Next ›
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setArmed(s)}
                          style={{ transitionDelay: `${Math.min(i * 26, 420)}ms` }}
                          className="animate-in fade-in slide-in-from-right-3 rounded-xl border-[1.5px] border-slate-200 py-3 text-center text-sm font-semibold tabular-nums text-slate-900 duration-300 hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white"
                        >
                          {time(s)}
                        </button>
                      );
                    })}
                    {daySlots.length === 0 && (
                      <p className="col-span-2 text-sm text-slate-500">Nothing left on this day.</p>
                    )}
                  </div>
                </>
              )}
            </aside>
            )}
          </div>
        </div>
      )}

      {step === 2 && armed !== null && (
        <div className="w-[560px] max-w-full p-8">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-[13.5px] font-semibold text-blue-600 hover:underline"
          >
            ‹ Change time
          </button>
          <h2 className="mt-1 font-display text-[22px] font-bold text-slate-900 dark:text-white">Almost there</h2>
          <span className="my-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-2 text-sm font-bold tabular-nums text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <CalendarDays className="h-4 w-4" />
            {longDay(dayKey(armed))} · {time(armed)} · {duration} min
          </span>

          <div className="mt-4 space-y-4">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Ada Lovelace"
                className="w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </Field>
            <Field label="Work email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="ada@company.com"
                className="w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </Field>
            <Field label="Your website" hint="The demo builds your agent straight from it.">
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                type="url"
                autoComplete="url"
                placeholder="https://yourcompany.com"
                className="w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </Field>
            <Field label="What do you want the agent to find for you?" optional>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Who you sell to, and what a great client looks like."
                className="w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </Field>
          </div>

          {error && <p className="mt-3 text-[13.5px] text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={sending || !name.trim() || !email.includes("@")}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 py-4 text-base font-bold text-white disabled:opacity-50"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm the demo
          </button>
          <p className="mt-3 text-center text-[12.5px] text-slate-500 dark:text-slate-400">
            A Google Meet invitation lands in your inbox right away.
          </p>
        </div>
      )}

      {step === 3 && armed !== null && (
        <div className="w-[520px] max-w-full px-8 py-14 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">You are booked in</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-slate-500 dark:text-slate-400">
            The invitation and the Meet link are on their way to {email}.
          </p>
          <div className="mt-6 space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left dark:border-slate-700 dark:bg-slate-800/50">
            <p className="flex items-center gap-2.5 text-[14.5px] text-slate-900 dark:text-white">
              <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
              <b className="font-semibold">{longDay(dayKey(armed))} · {time(armed)}</b>
            </p>
            <p className="flex items-center gap-2.5 text-[14.5px] text-slate-700 dark:text-slate-300">
              <Clock className="h-4 w-4 shrink-0 text-blue-600" />
              {duration} minutes, Google Meet
            </p>
            <p className="flex items-center gap-2.5 text-[14.5px] text-slate-700 dark:text-slate-300">
              <Bot className="h-4 w-4 shrink-0 text-blue-600" />
              Built on your business, live
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13.5px] font-semibold text-slate-900 dark:text-white">
        {label} {optional && <span className="font-normal text-slate-500">(optional)</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12.5px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
