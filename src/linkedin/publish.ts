import type { Page, Locator } from "patchright";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetch as undiciFetch, ProxyAgent } from "undici";
import { log } from "../logger.ts";
import {
  clickHumanLocator,
  dwell,
  randInt,
  scrollHuman,
  sleep,
  typeHumanHere,
} from "../browser/human.ts";

/**
 * Posting to LinkedIn by using LinkedIn, because there is no API any more.
 *
 * Plan section 7c: the Share API goes, and everything the content half of the
 * product does has to keep working through the same browser session the agent
 * uses. From the customer's side nothing changes; from here, a post is a
 * composer, a file input and a button.
 *
 * Four rules shape this file:
 *
 *  - **A scheduled post is scheduled on LinkedIn, not by us.** The composer has
 *    its own Schedule control, and a person planning tomorrow's post uses it in
 *    the evening. So do we. Nothing of ours is awake at 09:00, and LinkedIn
 *    sees exactly what it sees when a human plans ahead. Publishing at the
 *    minute, every time, from a session that opens at that minute, is the
 *    pattern that would give the whole thing away.
 *  - **Publishing is a human action too.** The feed is read before the composer
 *    opens, text is typed rather than pasted, media goes in through the same
 *    button a person clicks, and the whole thing takes minutes.
 *  - **Never claim a post went up without reading it back.** A user who is told
 *    they posted and did not is the worst thing this system can produce.
 *  - **Uploads get patience, not a fixed sleep.** The image, the PDF and above
 *    all the video are the fragile step, and they are waited on by state.
 */

/** How long to let an attachment settle before the post button is trusted. */
const UPLOAD_TIMEOUT_MS = { image: 90_000, document: 120_000, video: 600_000 };

export interface PublishInput {
  text: string;
  /** A local path, already downloaded. Null for a text-only post. */
  filePath: string | null;
  mimeType: string | null;
  /** The sender's own profile, where the post is read back from. */
  profileUrl: string | null;
  /**
   * When set, LinkedIn is asked to publish it at this moment rather than now.
   *
   * The date and time are typed in the account's own timezone, because that is
   * the clock the browser is running on and the one the composer reads.
   */
  scheduleFor?: { at: Date; timeZone: string };
  /**
   * Walk the whole composer and then throw it away.
   *
   * Everything happens for real: the composer opens, the body is typed through
   * the persona's keyboard, the file is attached and the upload is waited out,
   * the text is read back. Only the last click is not made, and the dialog is
   * discarded instead.
   *
   * It exists because there is no other way to find out whether posting still
   * works. LinkedIn renames its controls without notice, and on 2026-07-31 that
   * had already broken the Message link, the like button and three profile
   * fields. Discovering the same thing about the composer by publishing a test
   * post on a customer's real profile is not an acceptable way to find out.
   */
  rehearse?: boolean;
}

export interface PublishResult {
  /** The post's own URL, read back from the account's activity. */
  url: string | null;
  /**
   * Whether the post was found on the account's feed afterwards.
   *
   * False is not a failure and must never be treated as one: the composer
   * closed, so the post very probably went up, and reposting on a doubt is how
   * somebody ends up publishing twice. It is recorded and shown to the user
   * instead, which is the only honest answer when we genuinely do not know.
   */
  verified: boolean;
  /** True when LinkedIn accepted it into its own scheduler rather than posting it. */
  scheduled: boolean;
  /** Rehearsals only: the composer took the whole post and was ready to send it. */
  rehearsed?: boolean;
}

export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishError";
  }
}

/**
 * Raised when the composer is fine but LinkedIn's scheduler could not be
 * driven. It is deliberately separate: the caller must NOT fall back to posting
 * immediately, because the post is not due for hours. It waits for its slot.
 */
export class ScheduleUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleUnavailableError";
  }
}

// Everything below `dialog` is written RELATIVE to it, because these are all
// used as dialog.locator(...). An earlier version put div[role="dialog"] inside
// postButton, which then only matched a dialog nested in a dialog and never
// found the button at all.
const SEL = {
  /**
   * The control that opens the composer, which is no longer a button.
   *
   * Read off the live feed on 2026-07-31: it is a plain <div> whose only text
   * is "Start a post", with no role, no aria-label and no stable class. Every
   * selector here required a <button>, so publishing failed at the first step
   * with "LinkedIn did not offer the post composer".
   *
   * The text is translated, and the interface language follows the account
   * rather than the address it goes out through, so the wording has to cover
   * the languages we sell into. `:text-is` is exact and matches the innermost
   * element, which keeps it off the container wrapping half the page.
   */
  startPost:
    'button.share-box-feed-entry__trigger, button:has-text("Start a post"), ' +
    'button[aria-label*="Start a post" i], button[aria-label*="Create a post" i], ' +
    '[role="button"]:has-text("Start a post"), [role="button"]:has-text("Commencer un post"), ' +
    '[role="button"]:has-text("Créer un post"), [role="button"]:has-text("Beitrag beginnen"), ' +
    '[role="button"]:has-text("Empezar una publicación"), [role="button"]:has-text("Crea un post"), ' +
    '[role="button"]:has-text("Começar publicação"), [role="button"]:has-text("Bericht schrijven")',
  dialog: 'div[role="dialog"].share-creation-state, div.share-box, div[role="dialog"]',
  editor: '.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]',
  // ":text-is" is exact: "Post" the button, never "Post to anyone" the audience row.
  postButton: 'button.share-actions__primary-action, button:text-is("Post")',
  scheduleButton:
    'button[aria-label*="Schedule post" i], button[aria-label*="Schedule" i], ' +
    "button.share-actions__scheduled-post-btn",
  scheduleDate: 'input[id*="date" i], input[name*="date" i], input[placeholder*="/" ]',
  scheduleTime: 'input[id*="time" i], input[name*="time" i]',
  scheduleConfirm: 'button:text-is("Next"), button:text-is("Done"), button:text-is("Schedule")',
  scheduledPrimary: 'button:text-is("Schedule"), button.share-actions__primary-action',
  fileInput: 'input[type="file"]',
  /**
   * The control that reveals the file input.
   *
   * There is no `input[type=file]` on the composer until this is pressed, which
   * is why attaching failed with "LinkedIn would not accept the attachment"
   * while the composer was open and working. Read off the live page on
   * 2026-07-31: the button's entire label is now "Photo", and everything else
   * (document, video) sits behind "Expand content types".
   */
  addMedia:
    'button[aria-label="Photo" i], button[aria-label*="Add media" i], ' +
    'button[aria-label*="add a photo" i], button[aria-label*="Add a photo" i], ' +
    'button[aria-label*="video" i], button[aria-label*="photo" i], ' +
    'button[aria-label*="image" i]',
  /** Document and video hide behind this on the new composer. */
  moreMediaTypes: '[aria-label*="Expand content types" i]',
  /** The document screen's own picker, which is what creates the file input. */
  chooseFile:
    '[aria-label*="Choose file" i], button:has-text("Choose file"), ' +
    '[role="button"]:has-text("Choose file"), button:has-text("Choisir un fichier")',
  // A document post (which is what a carousel is) will not continue without a
  // title. LinkedIn labels it rather than giving it a stable class.
  documentTitle:
    'input[aria-label*="title" i], input[placeholder*="title" i], ' +
    'input[aria-label*="titre" i], input[placeholder*="titre" i], ' +
    'input[id*="document-title" i]',
  nextButton: 'button:text-is("Next"), button:text-is("Done")',
  uploadProgress: '[role="progressbar"], .share-box-footer__upload-progress',
} as const;

/**
 * Fetches the attachment onto disk so the composer's file input can take it.
 *
 * The first version did this inside the page, on the reasoning that a session's
 * traffic should leave one way. It cannot work: the page's origin is
 * linkedin.com and the bucket is not, so every fetch would have died on CORS,
 * and it would have died silently as "the attachment did not upload".
 *
 * So it is fetched from Node, and routed through the account's own address
 * anyway when there is one. The file is ours rather than LinkedIn's, so nothing
 * is disclosed either way; keeping it on the same address simply means one
 * account's traffic still has one shape.
 */
export async function downloadAttachment(
  url: string,
  fileName: string,
  proxy: { server: string; username: string; password: string } | null
): Promise<{ path: string; cleanup: () => void }> {
  const dispatcher = proxy
    ? new ProxyAgent({
        uri: proxy.server,
        token: `Basic ${Buffer.from(`${proxy.username}:${proxy.password}`).toString("base64")}`,
      })
    : undefined;

  try {
    const response = await undiciFetch(url, dispatcher ? { dispatcher } : {});
    if (!response.ok) {
      throw new PublishError(
        "The attachment could not be read back from storage, so nothing was posted."
      );
    }
    const bytes = Buffer.from(await response.arrayBuffer());

    const dir = mkdtempSync(join(tmpdir(), "lg-publish-"));
    const safeName = fileName.replace(/[^\w.-]/g, "_") || "attachment";
    const path = join(dir, safeName);
    writeFileSync(path, bytes);
    return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
  } finally {
    await dispatcher?.close().catch(() => {});
  }
}

/** The first visible element in a set, because LinkedIn ships hidden duplicates. */
/**
 * Button labels, matched by accessible name rather than by CSS text.
 *
 * Playwright's `:text-is()` only looks at an element's own text nodes, and
 * LinkedIn wraps every button label in a nested span. So `button:text-is("Post")`
 * found nothing while `document.querySelectorAll("button")` filtered by
 * innerText found the button, visible and enabled: the composer worked, the
 * text was typed and verified, and publishing then reported no Post button.
 * Diagnosed on the live page, 2026-07-31.
 *
 * `getByRole` reads the accessible name, which is computed from the
 * descendants, so it sees what a person sees. The names are regexes because
 * the interface language follows the account.
 */
const BUTTON_NAME = {
  post: /^(post|publier|posten|publicar|pubblica|publiceren|publicera|opublikuj|发布|投稿する)$/i,
  next: /^(next|done|suivant|terminé|termine|weiter|fertig|siguiente|hecho|avanti|fatto|volgende|klaar)$/i,
  schedule: /^(schedule|programmer|planen|programar|pianifica|plannen|schemalägg)/i,
  discard: /^(discard|supprimer|verwerfen|descartar|elimina|weggooien|kasta)/i,
} as const;

/** The same lookup for a page or a container, by what the button is called. */
function namedButton(scope: Page | Locator, name: RegExp): Locator {
  return scope.getByRole("button", { name });
}

async function firstVisible(loc: Locator): Promise<Locator | null> {
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    if (await loc.nth(i).isVisible().catch(() => false)) return loc.nth(i);
  }
  return null;
}

function uploadTimeoutFor(mimeType: string | null): number {
  if (!mimeType) return UPLOAD_TIMEOUT_MS.image;
  if (mimeType.startsWith("video/")) return UPLOAD_TIMEOUT_MS.video;
  if (mimeType === "application/pdf") return UPLOAD_TIMEOUT_MS.document;
  return UPLOAD_TIMEOUT_MS.image;
}

/**
 * Arriving on LinkedIn the way somebody who is about to post arrives.
 *
 * Nobody loads the feed and clicks Start a post in the same second. They land,
 * the feed renders, they scroll past a couple of things, and then they write.
 * It costs twenty seconds and it is the difference between a session that reads
 * like a person opening the app and one that reads like a script with an errand.
 */
async function settleOnFeed(page: Page): Promise<void> {
  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main", { timeout: 25_000 }).catch(() => {});
  await dwell(2500, 5000);
  await scrollHuman(page, randInt(1, 3));
  await dwell(1500, 4000);
  // Back to the top, because the composer lives there and that is where a
  // person scrolls back to.
  await page.mouse.wheel(0, -2000).catch(() => {});
  await dwell(1200, 2600);
}

/**
 * Waits for an attachment to finish, by state rather than by clock.
 *
 * Done means two things at once: no progress bar is left, and the composer's
 * own Post button has come back to life. LinkedIn disables it for the whole
 * upload, which makes it the most honest readiness signal on the page, and it
 * is the one that catches a video still transcoding after its bar has gone.
 */
async function waitForUpload(
  page: Page,
  dialog: Locator,
  mimeType: string | null,
  postText = ""
): Promise<void> {
  const deadline = Date.now() + uploadTimeoutFor(mimeType);

  while (Date.now() < deadline) {
    await sleep(1500);

    /**
     * A document will not enable the button until it has a title.
     *
     * This waits for the button to come alive, and for a carousel that never
     * happens on its own: LinkedIn requires a title first, and the code that
     * fills it ran after this. So every carousel timed out here with "the
     * attachment did not finish uploading" while the upload had in fact
     * finished. Filling it inside the loop puts the two in the right order
     * whatever moment the field appears at.
     */
    if (mimeType === "application/pdf") {
      await fillDocumentTitle(page, dialog, postText).catch(() => {});
      /**
       * And then leave the document screen.
       *
       * A carousel is composed on a screen of its own with Back and Done, and
       * the Post button does not exist, let alone enable, until Done is taken.
       * The code that presses Next or Done ran after this wait, so the wait
       * could never end: it timed out on a document that had uploaded fine and
       * was sitting there asking to be confirmed.
       */
      const done = await firstVisible(namedButton(page, BUTTON_NAME.next));
      if (done && !(await done.isDisabled().catch(() => true))) {
        await clickHumanLocator(page, done);
        await dwell(1500, 2800);
      }
    }

    const busy = await dialog.locator(SEL.uploadProgress).count().catch(() => 0);
    if (busy > 0) continue;

    const post =
      (await firstVisible(namedButton(dialog, BUTTON_NAME.post))) ??
      (await firstVisible(namedButton(page, BUTTON_NAME.post)));
    if (!post) continue;
    if (await post.isDisabled().catch(() => true)) continue;

    // Two clean reads in a row: the button flickers back on between the upload
    // finishing and the preview rendering, and clicking in that gap posts a
    // shell with no media in it.
    await sleep(1500);
    if ((await dialog.locator(SEL.uploadProgress).count().catch(() => 0)) > 0) continue;
    if (await post.isDisabled().catch(() => true)) continue;
    return;
  }

  throw new PublishError(
    "The attachment did not finish uploading to LinkedIn, so nothing was posted."
  );
}

/**
 * Attaches the file the way the button is meant to be used.
 *
 * The file input is set directly rather than through the operating system's
 * picker, because there is no picker on a virtual display. Everything around it
 * is a person's sequence though: the media button is clicked with a real mouse
 * move, the preview is looked at once it renders, and the editor is clicked
 * back into before anything else happens, exactly as somebody checking their
 * image before they post.
 */
async function attachMedia(
  page: Page,
  dialog: Locator,
  filePath: string,
  mimeType: string | null,
  postText: string
): Promise<void> {
  /**
   * The right door for the kind of file this is.
   *
   * The composer has one entry per content type and they are not
   * interchangeable: Photo opens an image-only picker, so a PDF pushed into it
   * is taken by the input and then never finishes uploading, which is exactly
   * how a carousel failed on 2026-07-31 with "the attachment did not finish
   * uploading". Document is the one for a carousel, and it only exists after
   * the content types are expanded. Verified on the live composer: the entries
   * carry the aria-labels Photo, Video, Document, Poll and Event.
   */
  const wanted =
    mimeType === "application/pdf"
      ? "Document"
      : mimeType?.startsWith("video/")
        ? "Video"
        : "Photo";

  // Never by tag. Photo is a <button>, Document is not, and assuming the tag is
  // the single mistake that broke the Message link, the connect control, the
  // composer trigger and this, all on the same day.
  const entry = async () =>
    (await firstVisible(page.locator(`[aria-label="${wanted}" i]`))) ??
    (await firstVisible(dialog.locator(`[aria-label="${wanted}" i]`)));

  let addMedia = await entry();
  if (!addMedia) {
    // Document sits behind the overflow; Photo and Video are on the bar.
    const more = await firstVisible(page.locator(SEL.moreMediaTypes));
    if (more) {
      await clickHumanLocator(page, more);
      await dwell(1200, 2400);
      addMedia = await entry();
    }
  }
  // Whatever is offered, rather than nothing at all, for an older layout.
  addMedia ??= await firstVisible(dialog.locator(SEL.addMedia));

  if (!addMedia) {
    throw new PublishError(
      `LinkedIn did not offer a way to attach a ${wanted.toLowerCase()}, so nothing was posted.`
    );
  }
  await clickHumanLocator(page, addMedia);
  await dwell(900, 2200);

  // Mounted by the click above, and not necessarily inside the scoped
  // container, so the page is the fallback here as well.
  await page
    .waitForSelector(SEL.fileInput, { state: "attached", timeout: 10_000 })
    .catch(() => {});
  let input = dialog.locator(SEL.fileInput).first();
  if ((await input.count()) === 0) input = page.locator(SEL.fileInput).first();

  if ((await input.count()) === 0) {
    /**
     * A document has one more step: LinkedIn shows a "Share a document" screen
     * with a Choose file button, and there is no input in the page at all until
     * that button is pressed. Waiting for one is waiting for something that
     * will never exist, which is how a carousel failed with "LinkedIn would not
     * accept the attachment" on a composer that was working perfectly.
     *
     * The file-chooser event covers both shapes: an input created on click, and
     * a native dialog.
     */
    const chooser = await firstVisible(page.locator(SEL.chooseFile));
    if (!chooser) {
      throw new PublishError("LinkedIn would not accept the attachment, so nothing was posted.");
    }
    const [picker] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 15_000 }),
      clickHumanLocator(page, chooser),
    ]);
    await picker.setFiles(filePath);
  } else {
    await input.setInputFiles(filePath);
  }
  await waitForUpload(page, dialog, mimeType, postText);

  // Looking at what was attached. A person does; and it also gives LinkedIn's
  // preview time to finish rendering before the Next button is pressed.
  await dwell(2000, 4500);

  // A carousel is a LinkedIn document post, and a document post asks for a
  // title before it will let you continue. It is required, so leaving it empty
  // keeps Next disabled for ever and the post never goes out. The title is
  // also what readers see on the card, so it is the post's own opening line
  // rather than a filename.
  await fillDocumentTitle(page, dialog, postText);

  const next =
    (await firstVisible(namedButton(dialog, BUTTON_NAME.next))) ??
    (await firstVisible(namedButton(page, BUTTON_NAME.next)));
  if (next && !(await next.isDisabled().catch(() => true))) {
    await clickHumanLocator(page, next);
    await dwell(1500, 3000);
  }
}

/** The first sentence of the post, short enough for a document card. */
export function documentTitleFrom(text: string): string {
  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  const source = (firstLine ?? text).replace(/\s+/g, " ").trim();
  if (source.length <= 60) return source || "Document";
  // Cut at a word rather than mid-word, and never leave trailing punctuation.
  const cut = source.slice(0, 60);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-\s]+$/, "");
}

async function fillDocumentTitle(page: Page, dialog: Locator, postText: string): Promise<void> {
  const field = await firstVisible(dialog.locator(SEL.documentTitle));
  if (!field) return;
  const already = (await field.inputValue().catch(() => "")) || "";
  if (already.trim().length > 0) return;

  await clickHumanLocator(page, field).catch(async () => {
    await field.click();
  });
  await sleep(randInt(250, 700));
  await typeHumanHere(page, documentTitleFrom(postText));
  await dwell(600, 1600);
}

/**
 * Types the body into the composer, line by line.
 *
 * Through the same keyboard model the agent's messages use: this account's own
 * speed, pauses that cluster at words and sentences, and the occasional typo
 * backspaced out a character or two later. The first version of this used a
 * flat random delay, which meant an account's posts went in at a steadier
 * rhythm than its messages. Two rhythms from one person is worth nothing and
 * costs a tell.
 *
 * Enter behaves itself in this editor, unlike the message composer, so a line
 * break is a plain Enter rather than Shift+Enter.
 */
async function typeBody(page: Page, editor: Locator, text: string): Promise<void> {
  await clickHumanLocator(page, editor).catch(async () => {
    await editor.click();
  });
  await sleep(randInt(300, 900));

  const lines = text.replace(/\r/g, "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.length > 0) await typeHumanHere(page, line);
    if (i < lines.length - 1) {
      await page.keyboard.press("Enter");
      await sleep(randInt(90, 260));
    }
    // People stop mid-post. Rarely, and never for the same length of time.
    if (i > 0 && i % 4 === 0) await dwell(400, 1600);
  }
}

/** Whitespace-insensitive comparison, because the editor renders breaks its own way. */
function flatten(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** The day, month, year and 24-hour clock of a moment, in a given timezone. */
export function partsInZone(
  at: Date,
  timeZone: string
): { day: number; month: number; year: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    day: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
    // Midnight comes back as 24 in some ICU versions.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/**
 * Works out whether this composer wants the day or the month first.
 *
 * LinkedIn prefills the field with a date, so the format can be read off it
 * rather than guessed from a locale that may not match the account's LinkedIn
 * language. A prefilled 31/07 settles it; 07/07 does not, and then the locale
 * is the tiebreak. Whatever this returns, the result is read back and checked
 * before anything is scheduled, so a wrong guess costs a fallback rather than a
 * post on the wrong day.
 */
export function dateOrder(prefilled: string, locale: string): "dmy" | "mdy" {
  const bits = prefilled.trim().split(/[^0-9]+/).filter(Boolean);
  const first = Number(bits[0]);
  const second = Number(bits[1]);
  if (Number.isFinite(first) && first > 12) return "dmy";
  if (Number.isFinite(second) && second > 12) return "mdy";
  return locale.toLowerCase().startsWith("en-us") ? "mdy" : "dmy";
}

export function formatDateFor(
  order: "dmy" | "mdy",
  p: { day: number; month: number; year: number }
): string {
  const dd = String(p.day).padStart(2, "0");
  const mm = String(p.month).padStart(2, "0");
  return order === "dmy" ? `${dd}/${mm}/${p.year}` : `${mm}/${dd}/${p.year}`;
}

/** LinkedIn's time field takes a 12-hour clock in English, a 24-hour one elsewhere. */
export function formatTimeFor(
  clock: "h12" | "h24",
  p: { hour: number; minute: number }
): string {
  const mm = String(p.minute).padStart(2, "0");
  if (clock === "h24") return `${String(p.hour).padStart(2, "0")}:${mm}`;
  const suffix = p.hour < 12 ? "AM" : "PM";
  const hour = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${hour}:${mm} ${suffix}`;
}

async function setField(page: Page, field: Locator, value: string): Promise<void> {
  await field.click();
  await sleep(randInt(200, 500));
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await sleep(randInt(150, 400));
  await field.pressSequentially(value, { delay: randInt(45, 130) });
  await sleep(randInt(300, 800));
}

/**
 * Hands the composed post to LinkedIn's own scheduler.
 *
 * Throws ScheduleUnavailableError rather than falling through to posting: the
 * post is not due for hours, and publishing it now because a button moved would
 * be far worse than waiting and publishing it at the minute instead.
 *
 * The date is always read back before the schedule is confirmed. Two things can
 * go wrong silently, a date field that wanted the month first and a time field
 * that wanted a 24-hour clock, and both of them put somebody's post on the
 * wrong day rather than failing.
 */
async function useScheduler(
  page: Page,
  dialog: Locator,
  at: Date,
  timeZone: string
): Promise<void> {
  const opener = await firstVisible(dialog.locator(SEL.scheduleButton));
  if (!opener) {
    throw new ScheduleUnavailableError("The composer has no Schedule control on this account.");
  }
  await clickHumanLocator(page, opener);
  await dwell(900, 2000);

  // The scheduler opens its own layer above the composer.
  const panel = (await firstVisible(page.locator('div[role="dialog"]:has(input)'))) ?? dialog;
  const dateField = await firstVisible(panel.locator(SEL.scheduleDate));
  const timeField = await firstVisible(panel.locator(SEL.scheduleTime));
  if (!dateField || !timeField) {
    throw new ScheduleUnavailableError("The scheduler opened without a date and time to fill in.");
  }

  const wanted = partsInZone(at, timeZone);
  const prefilledDate = (await dateField.inputValue().catch(() => "")) || "";
  const prefilledTime = (await timeField.inputValue().catch(() => "")) || "";
  const locale = await page.evaluate(() => navigator.language).catch(() => "en-US");
  const order = dateOrder(prefilledDate, locale);
  const clock = /am|pm/i.test(prefilledTime) ? "h12" : "h24";

  await setField(page, dateField, formatDateFor(order, wanted));
  await setField(page, timeField, formatTimeFor(clock, wanted));

  // Read it back. A field that reformats what was typed, or silently rejects
  // it, is the failure that would otherwise put the post on the wrong day.
  const dateNow = (await dateField.inputValue().catch(() => "")) || "";
  const timeNow = (await timeField.inputValue().catch(() => "")) || "";
  const dayIn = dateNow.includes(String(wanted.day).padStart(2, "0"));
  const monthIn = dateNow.includes(String(wanted.month).padStart(2, "0"));
  const yearIn = dateNow.includes(String(wanted.year));
  const minuteIn = timeNow.includes(String(wanted.minute).padStart(2, "0"));
  if (!dayIn || !monthIn || !yearIn || !minuteIn) {
    throw new ScheduleUnavailableError(
      `The scheduler would not take the date: asked for ${formatDateFor(order, wanted)} ${formatTimeFor(clock, wanted)}, the fields read ${dateNow} ${timeNow}.`
    );
  }

  const confirm =
    (await firstVisible(namedButton(panel, BUTTON_NAME.next))) ??
    (await firstVisible(namedButton(panel, BUTTON_NAME.schedule))) ??
    (await firstVisible(panel.locator(SEL.scheduleConfirm)));
  if (!confirm) {
    throw new ScheduleUnavailableError("The scheduler had no way to confirm the date.");
  }
  await clickHumanLocator(page, confirm);
  await dwell(1200, 2600);

  // The primary button now says Schedule instead of Post. If it still says
  // Post, the date never took and pressing it would publish immediately.
  const primary =
    (await firstVisible(namedButton(dialog, BUTTON_NAME.schedule))) ??
    (await firstVisible(namedButton(page, BUTTON_NAME.schedule))) ??
    (await firstVisible(dialog.locator(SEL.scheduledPrimary)));
  const label = ((await primary?.innerText().catch(() => "")) ?? "").trim().toLowerCase();
  if (!primary || !label.startsWith("schedule")) {
    throw new ScheduleUnavailableError(
      `The composer did not switch to scheduling: its button still reads "${label || "nothing"}".`
    );
  }
  await clickHumanLocator(page, primary);
  await dialog.waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {});
  await dwell(2000, 4000);
}

/**
 * The URL of the post this account published most recently.
 *
 * Read from the account's own activity feed rather than from the toast that
 * appears after posting: the toast is gone in seconds and its markup has
 * changed twice. The newest card is checked against the opening of the text we
 * typed, so a stale card from yesterday can never be mistaken for this one.
 */
export async function findPublishedUrl(
  page: Page,
  profileUrl: string,
  text: string
): Promise<string | null> {
  const activity = `${profileUrl.replace(/\/?$/, "/")}recent-activity/all/`;
  await page.goto(activity, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
  await dwell(1800, 3200);

  const needle = flatten(text).slice(0, 60).toLowerCase();
  const urn = await page.evaluate((probe) => {
    const cards = Array.from(
      document.querySelectorAll("div[data-urn], div[data-id]")
    ) as HTMLElement[];
    for (const card of cards) {
      const id = card.getAttribute("data-urn") ?? card.getAttribute("data-id") ?? "";
      if (!id.includes("activity")) continue;
      const body = (card.innerText ?? "").replace(/\s+/g, " ").trim().toLowerCase();
      if (probe.length > 0 && !body.includes(probe)) continue;
      return id;
    }
    return "";
  }, needle);

  if (!urn) return null;
  const id = urn.split(":").pop();
  return id ? `https://www.linkedin.com/feed/update/urn:li:activity:${id}/` : null;
}

/**
 * Writes one post, and either publishes it or hands it to LinkedIn's scheduler.
 *
 * Everything that can fail throws with a sentence the customer can read,
 * because the caller writes whatever this says onto the post itself.
 */
export async function publishPost(page: Page, input: PublishInput): Promise<PublishResult> {
  const body = input.text.trim();
  if (!body) throw new PublishError("This post has no text, so nothing was published.");

  await settleOnFeed(page);

  const trigger = await firstVisible(page.locator(SEL.startPost));
  if (!trigger) {
    throw new PublishError("LinkedIn did not offer the post composer, so nothing was published.");
  }
  await clickHumanLocator(page, trigger);

  /**
   * Wait for the editor, and take the composer to be wherever the editor is.
   *
   * The composer used to be a `role="dialog"` and is not one any more. Read off
   * the live feed on 2026-07-31: clicking the trigger produces no dialog at
   * all, only a `div[role="textbox"][contenteditable="true"]` and a Post
   * button, and the only elements still carrying `role="dialog"` on that page
   * belong to a video player's caption settings. Requiring a dialog meant
   * publishing stopped one step after opening, every time, reporting "the post
   * composer did not open" while the composer was plainly open.
   *
   * Quill is gone too, so `.ql-editor` matches nothing and the role selector
   * behind it is what now does the work.
   */
  await page.waitForSelector(SEL.editor, { state: "visible", timeout: 20_000 }).catch(() => {});
  const editor = await firstVisible(page.locator(SEL.editor));
  if (!editor) {
    throw new PublishError("The post composer did not open, so nothing was published.");
  }

  // Everything below scopes its lookups to this. A real dialog when there is
  // one, which keeps the older layout working and keeps hidden mounted dialogs
  // out; the page itself when there is not, where the open composer owns the
  // only editor and the only Post button anyway.
  const realDialog = await firstVisible(page.locator(SEL.dialog));
  const dialog =
    realDialog && (await realDialog.locator(SEL.editor).count()) > 0
      ? realDialog
      : page.locator("body");

  await typeBody(page, editor, body);
  await dwell(700, 1600);

  // What is in the box must be what we meant to say. An autocomplete, a stray
  // keystroke or a half-typed line is caught here rather than on the feed.
  const typed = await editor.innerText().catch(() => "");
  if (flatten(typed) !== flatten(body)) {
    throw new PublishError(
      "The composer did not hold the post as written, so nothing was published."
    );
  }

  if (input.filePath) {
    await attachMedia(page, dialog, input.filePath, input.mimeType, body);
  }

  // Reading it once more before sending. Everybody does this, and on a long
  // post it is the most natural pause in the whole sequence.
  await dwell(3000, 9000);

  if (input.scheduleFor && !input.rehearse) {
    await useScheduler(page, dialog, input.scheduleFor.at, input.scheduleFor.timeZone);
    log("post handed to LinkedIn's scheduler", { at: input.scheduleFor.at.toISOString() });
    return { url: null, verified: false, scheduled: true };
  }

  // Scoped first, then the whole page. The composer is a page of its own now
  // (clicking the trigger navigates to /sharing/compose), and its Post button
  // sits outside whatever container holds the editor, so a scoped lookup found
  // the text, typed it, verified it, and then reported no Post button.
  const postButton =
    (await firstVisible(namedButton(dialog, BUTTON_NAME.post))) ??
    (await firstVisible(namedButton(page, BUTTON_NAME.post))) ??
    (await firstVisible(page.locator(SEL.postButton)));
  if (!postButton) {
    throw new PublishError("The Post button was not there, so nothing was published.");
  }
  const disabled = await postButton.isDisabled().catch(() => true);

  // Everything above happened. Nothing below does.
  if (input.rehearse) {
    log("rehearsal: the composer accepted this post", {
      characters: body.length,
      attachment: input.filePath ? input.mimeType : "none",
      postButton: disabled ? "present but disabled" : "ready",
    });
    await page.keyboard.press("Escape").catch(() => {});
    await dwell(600, 1400);
    // LinkedIn asks whether to keep the draft. Discarding leaves nothing behind.
    const discard = await firstVisible(
      namedButton(page, BUTTON_NAME.discard)
    );
    if (discard) await clickHumanLocator(page, discard);
    return { url: null, verified: false, scheduled: false, rehearsed: !disabled };
  }

  if (disabled) {
    throw new PublishError("LinkedIn kept the Post button disabled, so nothing was published.");
  }
  await clickHumanLocator(page, postButton);

  // The dialog closing is the first sign it went, and it is not proof.
  await dialog.waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {});
  await dwell(2500, 4500);

  if (!input.profileUrl) return { url: null, verified: false, scheduled: false };

  // Read it back. Twice, because the feed lags the post by a few seconds and a
  // single miss would mark every post unconfirmed.
  let url = await findPublishedUrl(page, input.profileUrl, body);
  if (!url) {
    await sleep(8000);
    url = await findPublishedUrl(page, input.profileUrl, body);
  }
  return { url, verified: url !== null, scheduled: false };
}

/**
 * Reacts to the account's own post.
 *
 * There is a switch for this in settings, on by default, and until now nothing
 * read it: v1 did the like through the API and v2 dropped the API without
 * replacing this one. A switch that does nothing is worse than no switch.
 *
 * It happens on the way back to the post rather than in the same second it was
 * published, because that is when a person does it, and it is skipped silently
 * when the post is already liked.
 */
export async function likePost(page: Page, postUrl: string): Promise<boolean> {
  await page.goto(postUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
  await dwell(1800, 3600);

  // Only an unreacted post carries "React Like"; once liked it becomes
  // "Unreact Like", which is also how the click is confirmed.
  const unliked = page.locator('main button[aria-label="React Like"], main button[aria-label^="React Like"]');
  const before = await unliked.count();
  const button = await firstVisible(unliked);
  if (!button) return false;

  await button.scrollIntoViewIfNeeded().catch(() => {});
  await clickHumanLocator(page, button).catch(() => {});
  await dwell(1200, 2400);
  return (await unliked.count()) < before;
}

/**
 * Leaves the first comment under a post that has just gone up.
 *
 * Deliberately its own function called after the post is already marked
 * published: a comment that fails must never cost the post, and a post that
 * succeeded must never be retried because its comment did not.
 *
 * It arrives at the post the way a person does, by opening it and reading it,
 * rather than by firing a comment at a URL the instant the post lands.
 */
export async function postFirstComment(
  page: Page,
  postUrl: string,
  comment: string
): Promise<boolean> {
  const body = comment.trim();
  if (!body) return false;

  await page.goto(postUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
  await dwell(2500, 5000);
  // Looking at your own post before adding to it.
  await scrollHuman(page, 1);
  await dwell(1500, 3500);

  const box = await firstVisible(
    page.locator(
      '.comments-comment-box .ql-editor[contenteditable="true"], ' +
        'main div[role="textbox"][contenteditable="true"]'
    )
  );
  if (!box) {
    log("first comment: no comment box on the post");
    return false;
  }

  await clickHumanLocator(page, box);
  await sleep(randInt(400, 1100));
  await typeHumanHere(page, body);
  await dwell(1200, 3000);

  const submit = await firstVisible(
    namedButton(page.locator("main"), BUTTON_NAME.post)
  );
  if (!submit || (await submit.isDisabled().catch(() => true))) {
    log("first comment: the submit button never became available");
    return false;
  }
  await clickHumanLocator(page, submit);
  await dwell(1500, 2800);

  // Cleared box means it left. Anything else and we say so rather than assume.
  const left = (await box.innerText().catch(() => "x")).trim().length === 0;
  if (!left) log("first comment: typed but the box did not clear");
  return left;
}
