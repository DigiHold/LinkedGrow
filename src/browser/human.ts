import type { Page, Locator } from "patchright";

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

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, Math.round(ms))));
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Moves the cursor along a randomized cubic Bezier path, never a straight line or teleport. */
export async function moveMouseHuman(page: Page, toX: number, toY: number, fromX?: number, fromY?: number): Promise<void> {
  const sx = fromX ?? toX - randInt(80, 220);
  const sy = fromY ?? toY - randInt(60, 180);
  const steps = randInt(18, 34);
  const cx1 = sx + (toX - sx) * Math.random();
  const cy1 = sy + (toY - sy) * Math.random();
  const cx2 = sx + (toX - sx) * Math.random();
  const cy2 = sy + (toY - sy) * Math.random();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cubicBezier(sx, cx1, cx2, toX, t) + randGauss(0, 0.6);
    const y = cubicBezier(sy, cy1, cy2, toY, t) + randGauss(0, 0.6);
    await page.mouse.move(x, y);
    await sleep(randGauss(12, 4));
  }
}

/** Clicks an element at a random offset from its center, after a human-paced mouse move. */
export async function clickHuman(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw new Error(`No bounding box for selector: ${selector}`);
  const x = box.x + box.width * (0.3 + Math.random() * 0.4);
  const y = box.y + box.height * (0.3 + Math.random() * 0.4);
  await moveMouseHuman(page, x, y);
  await sleep(randInt(120, 380));
  await page.mouse.click(x, y);
}

/**
 * Human click on a specific locator, for nth-element or dynamically-found targets where a selector
 * string is not enough. Same bezier move plus off-center click as clickHuman, never a bare programmatic click.
 */
export async function clickHumanLocator(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("No bounding box for the target locator");
  const x = box.x + box.width * (0.3 + Math.random() * 0.4);
  const y = box.y + box.height * (0.3 + Math.random() * 0.4);
  await moveMouseHuman(page, x, y);
  await sleep(randInt(120, 380));
  await page.mouse.click(x, y);
}

/** Types character by character with Gaussian delays and occasional pauses, never a bulk value inject. */
export async function typeHuman(page: Page, selector: string, text: string): Promise<void> {
  await clickHuman(page, selector);
  await sleep(randInt(150, 400));
  for (const ch of text) {
    await page.keyboard.type(ch);
    await sleep(Math.max(20, randGauss(95, 45)));
    if (Math.random() < 0.03) await sleep(randInt(300, 900));
  }
}

/** A short reading pause. */
export async function dwell(minMs = 800, maxMs = 4000): Promise<void> {
  await sleep(randInt(minMs, maxMs));
}

/** A few variable scroll bursts, like someone skimming a feed. */
export async function scrollHuman(page: Page, times = randInt(2, 6)): Promise<void> {
  for (let i = 0; i < times; i++) {
    await page.mouse.wheel(0, randInt(200, 700));
    await sleep(randInt(400, 1500));
  }
}
