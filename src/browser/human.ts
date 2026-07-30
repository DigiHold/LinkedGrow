import { createHash } from "node:crypto";
import type { Page, Locator } from "patchright";

import { beat } from "../safety/heartbeat.ts";
import { currentRun } from "../safety/run-context.ts";

/**
 * The behaviour layer: what makes the session look like a person rather than a
 * script that happens to move a cursor.
 *
 * Two ideas run through all of it, and they pull in opposite directions on
 * purpose.
 *
 * **Randomness within an action.** No two keystrokes, moves or pauses are the
 * same. A perfectly regular interval is the cheapest thing in the world to
 * detect, so every duration here is sampled rather than chosen.
 *
 * **Consistency across sessions.** A person does not type at 40 words per
 * minute on Monday and 75 on Tuesday. The speed, the error rate and the
 * mouse habits are therefore derived from the account id, exactly as the device
 * fingerprint is, so one account behaves like one person for as long as it
 * exists while two accounts behind the same address behave like two people.
 *
 * Everything is tuned against measured human ranges rather than against what
 * feels fast. Adults type roughly 40 to 50 words per minute, and composing an
 * original message is slower still, so the defaults here sit far below what a
 * machine could do.
 */

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Gaussian sample via Box-Muller. */
export function randGauss(mean: number, sd: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + n * sd;
}

/** Gaussian clamped to a floor, since a negative delay is a teleport. */
function gaussAtLeast(mean: number, sd: number, floor: number): number {
  return Math.max(floor, randGauss(mean, sd));
}

export function sleep(ms: number): Promise<void> {
  // Every pacing helper funnels through here, so this one line is what tells the watchdog the
  // agent is still alive. A stuck page never reaches it.
  beat();
  return new Promise((r) => setTimeout(r, Math.max(0, Math.round(ms))));
}

/* ── the per-account persona ───────────────────────────────────────────────
   Same derivation as the device fingerprint: hashed from the account id, so it
   survives a redeploy with nothing stored, and differs between two accounts of
   the same customer. */

export interface Persona {
  /** Mean milliseconds between keystrokes. 240ms is about 50 words per minute. */
  keyMean: number;
  /** Spread around that mean, so no two keystrokes match. */
  keySd: number;
  /** Chance per character of a typo that gets noticed and corrected. */
  typoRate: number;
  /** How long this person tends to think before the first character. */
  openingThink: number;
  /** How far past a target this person's cursor tends to travel. */
  overshoot: number;
  /** Multiplier on every reading pause, so some people skim and some do not. */
  readingPace: number;
}

function hash(seed: string, label: string): number {
  return createHash("sha256").update(`${seed}:${label}`).digest().readUInt32BE(0);
}

/** A value in [min, max] derived deterministically from the seed. */
function spread(seed: string, label: string, min: number, max: number): number {
  return min + (hash(seed, label) / 0xffffffff) * (max - min);
}

/**
 * Between 38 and 62 words per minute, which is the band most working adults
 * fall in. The slowest persona here is still a plausible person and the fastest
 * is nowhere near what a script would do.
 */
export function personaFor(accountId: string): Persona {
  return {
    keyMean: spread(accountId, "keyMean", 195, 310),
    keySd: spread(accountId, "keySd", 55, 95),
    typoRate: spread(accountId, "typoRate", 0.004, 0.014),
    openingThink: spread(accountId, "openingThink", 700, 2600),
    overshoot: spread(accountId, "overshoot", 0.02, 0.09),
    readingPace: spread(accountId, "readingPace", 0.75, 1.45),
  };
}

/** A persona for a run with no account behind it, used by tests and one-offs. */
function anonymousPersona(): Persona {
  return personaFor(`anon-${Math.random()}`);
}

// Only used outside a run. Inside one, the persona and the cursor belong to that run: the worker
// drives every account at once, and a single shared pair meant the last browser to open set the
// motor habits and the cursor trail for every other account running beside it.
let active: Persona = anonymousPersona();
let cursor = { x: randInt(200, 900), y: randInt(150, 600) };

/** Called once per session by the driver, before any action runs. */
export function usePersona(accountId: string): void {
  const run = currentRun();
  if (run) {
    run.persona = personaFor(accountId);
    run.cursor = { x: randInt(200, 900), y: randInt(150, 600) };
    return;
  }
  active = personaFor(accountId);
  cursor = { x: randInt(200, 900), y: randInt(150, 600) };
}

export function currentPersona(): Persona {
  const run = currentRun();
  if (run?.persona) return run.persona;
  return active;
}

/** Where this account's cursor actually is, which is not where another account's cursor is. */
function cursorNow(): { x: number; y: number } {
  return currentRun()?.cursor ?? cursor;
}

function setCursor(x: number, y: number): void {
  const run = currentRun();
  if (run) {
    run.cursor = { x, y };
    return;
  }
  cursor = { x, y };
}

/* ── the mouse ─────────────────────────────────────────────────────────────*/

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Slow at both ends, fast through the middle, which is how a hand moves. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

async function traverse(page: Page, sx: number, sy: number, tx: number, ty: number): Promise<void> {
  const distance = Math.hypot(tx - sx, ty - sy);
  // Step count follows the distance. A fixed count made a 40-pixel nudge and a
  // 900-pixel sweep take the same number of samples, which no hand does.
  const steps = Math.max(8, Math.min(70, Math.round(distance / randGauss(14, 3))));

  // Control points sit off the straight line by an amount proportional to the
  // distance, so long moves arc and short ones stay nearly straight.
  const bow = distance * spreadRandom(0.06, 0.22);
  const side = Math.random() < 0.5 ? 1 : -1;
  const nx = -(ty - sy) / (distance || 1);
  const ny = (tx - sx) / (distance || 1);
  const cx1 = sx + (tx - sx) * 0.3 + nx * bow * side;
  const cy1 = sy + (ty - sy) * 0.3 + ny * bow * side;
  const cx2 = sx + (tx - sx) * 0.7 + nx * bow * side * spreadRandom(0.4, 1.1);
  const cy2 = sy + (ty - sy) * 0.7 + ny * bow * side * spreadRandom(0.4, 1.1);

  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    const x = cubicBezier(sx, cx1, cx2, tx, t) + randGauss(0, 0.7);
    const y = cubicBezier(sy, cy1, cy2, ty, t) + randGauss(0, 0.7);
    await page.mouse.move(x, y);
    // Sampling interval varies per step rather than being a fixed tick.
    await sleep(gaussAtLeast(11, 4, 3));
  }
}

function spreadRandom(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Moves the cursor along a randomized arc from wherever it actually is, with an
 * overshoot and correction on longer moves. A cursor that lands dead on target
 * every time, from a position it was never at, is the tell this replaces.
 */
export async function moveMouseHuman(
  page: Page,
  toX: number,
  toY: number,
  fromX?: number,
  fromY?: number
): Promise<void> {
  const here = cursorNow();
  const sx = fromX ?? here.x;
  const sy = fromY ?? here.y;
  const distance = Math.hypot(toX - sx, toY - sy);

  // Short moves are single gestures. Longer ones overshoot and come back, which
  // is what a hand does when it is aiming rather than nudging.
  if (distance > 180 && Math.random() < 0.72) {
    const over = currentPersona().overshoot * spreadRandom(0.6, 1.5);
    const px = toX + (toX - sx) * over + randGauss(0, 3);
    const py = toY + (toY - sy) * over + randGauss(0, 3);
    await traverse(page, sx, sy, px, py);
    await sleep(gaussAtLeast(70, 25, 20));
    await traverse(page, px, py, toX, toY);
  } else {
    await traverse(page, sx, sy, toX, toY);
  }

  setCursor(toX, toY);
}

async function clickBox(page: Page, box: { x: number; y: number; width: number; height: number }): Promise<void> {
  // Off-centre, and biased differently every time rather than always the middle
  // 40 percent of the element.
  const x = box.x + box.width * (0.22 + Math.random() * 0.56);
  const y = box.y + box.height * (0.24 + Math.random() * 0.52);
  await moveMouseHuman(page, x, y);
  // A person settles before pressing, and sometimes hesitates.
  await sleep(gaussAtLeast(190, 90, 60));
  if (Math.random() < 0.08) await sleep(randInt(280, 1100));
  await page.mouse.down();
  await sleep(gaussAtLeast(72, 22, 28)); // press duration, not an instant click
  await page.mouse.up();
}

/** Clicks an element at a varying offset, after a human-paced mouse move. */
export async function clickHuman(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw new Error(`No bounding box for selector: ${selector}`);
  await clickBox(page, box);
}

/**
 * Human click on a specific locator, for nth-element or dynamically-found
 * targets where a selector string is not enough.
 */
export async function clickHumanLocator(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("No bounding box for the target locator");
  await clickBox(page, box);
}

/* ── the keyboard ──────────────────────────────────────────────────────────*/

// Keys physically next to each other, which is where real typos land. Hitting a
// random letter from across the board is a different mistake from the one a
// finger makes.
const NEIGHBOURS: Record<string, string> = {
  a: "sqwz", b: "vghn", c: "xdfv", d: "serfcx", e: "wsdr", f: "drtgvc",
  g: "ftyhbv", h: "gyujnb", i: "ujko", j: "huikmn", k: "jiolm", l: "kop",
  m: "njk", n: "bhjm", o: "iklp", p: "ol", q: "wa", r: "edft", s: "awedxz",
  t: "rfgy", u: "yhji", v: "cfgb", w: "qase", x: "zsdc", y: "tghu", z: "asx",
};

function neighbourOf(ch: string): string | null {
  const row = NEIGHBOURS[ch.toLowerCase()];
  if (!row) return null;
  const pick = row[randInt(0, row.length - 1)] as string;
  return ch === ch.toUpperCase() ? pick.toUpperCase() : pick;
}

/**
 * Types character by character at this account's own pace, with pauses where
 * people actually pause and mistakes people actually make.
 *
 * The three things this fixes: the old mean of 95ms was about 126 words per
 * minute, which is faster than almost anybody writing an original message; the
 * pauses were uniform noise rather than clustered at word and sentence
 * boundaries; and nobody types several hundred characters without a single
 * correction.
 */
export async function typeHuman(page: Page, selector: string, text: string): Promise<void> {
  await clickHuman(page, selector);
  // The long one: deciding how to open, before a single character exists.
  await sleep(gaussAtLeast(currentPersona().openingThink, currentPersona().openingThink * 0.4, 300));

  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] as string;

    // A typo, noticed one to three characters later and backspaced out.
    if (Math.random() < currentPersona().typoRate) {
      const wrong = neighbourOf(ch);
      if (wrong) {
        const overrun = randInt(0, 2);
        await page.keyboard.type(wrong);
        await sleep(gaussAtLeast(currentPersona().keyMean, currentPersona().keySd, 45));
        for (let k = 1; k <= overrun && i + k < chars.length; k++) {
          await page.keyboard.type(chars[i + k] as string);
          await sleep(gaussAtLeast(currentPersona().keyMean, currentPersona().keySd, 45));
        }
        // The moment of noticing.
        await sleep(gaussAtLeast(340, 150, 120));
        for (let k = 0; k <= overrun; k++) {
          await page.keyboard.press("Backspace");
          await sleep(gaussAtLeast(105, 35, 40));
        }
        await sleep(gaussAtLeast(160, 70, 60));
      }
    }

    await page.keyboard.type(ch);

    let gap = gaussAtLeast(currentPersona().keyMean, currentPersona().keySd, 45);
    // Structural pauses: a breath between words, a longer one after a sentence.
    if (ch === " ") gap *= spreadRandom(1.15, 1.9);
    if (ch === "," || ch === ";") gap *= spreadRandom(1.4, 2.4);
    if (ch === "." || ch === "?" || ch === "!") gap *= spreadRandom(2.2, 4.5);
    // And the occasional stop to think mid-sentence.
    if (Math.random() < 0.012) gap += randInt(600, 2400);
    await sleep(gap);
  }
}

/* ── being present without acting ──────────────────────────────────────────*/

/** A reading pause, scaled by how fast this particular person reads. */
export async function dwell(minMs = 800, maxMs = 4000): Promise<void> {
  await sleep(randInt(minMs, maxMs) * currentPersona().readingPace);
}

/** A few variable scroll bursts, like someone skimming a feed. */
export async function scrollHuman(page: Page, times = randInt(2, 6)): Promise<void> {
  for (let i = 0; i < times; i++) {
    // Scrolls are not all downward and not all the same size, and people
    // sometimes bounce back up to re-read something.
    const up = Math.random() < 0.14;
    await page.mouse.wheel(0, up ? -randInt(120, 380) : randInt(180, 760));
    await sleep(randInt(400, 1500) * currentPersona().readingPace);
  }
}

/**
 * Ambient behaviour between actions, which the detection writeups name more
 * often than any single bad click: a person who is present on a page moves the
 * cursor, drifts, and reads, rather than sitting perfectly still and then
 * firing an action.
 */
export async function idleHuman(page: Page, maxMs = 9000): Promise<void> {
  const until = Date.now() + randInt(1200, maxMs) * currentPersona().readingPace;
  while (Date.now() < until) {
    const roll = Math.random();
    if (roll < 0.45) {
      const size = await page.viewportSize();
      const w = size?.width ?? 1440;
      const h = size?.height ?? 900;
      await moveMouseHuman(page, randInt(40, w - 40), randInt(60, h - 60));
    } else if (roll < 0.75) {
      await scrollHuman(page, randInt(1, 2));
    } else {
      await sleep(randInt(500, 2200));
    }
  }
}
