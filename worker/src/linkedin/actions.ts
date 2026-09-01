import type { Page, Locator } from "patchright";
import type { ProspectRow } from "../store.ts";
import { log } from "../logger.ts";
import {
  dwell,
  scrollHuman,
  clickHumanLocator,
  sleep,
  randInt,
  typeHumanHere,
} from "../browser/human.ts";

/**
 * Everything the sequence engine needs LinkedIn to do, behind one interface so the engine is
 * testable without a browser. The browser implementation below is the real thing; a fake one drives
 * the offline tests.
 */
/** What an attempt to connect actually ran into. See sendConnect below. */
export type ConnectOutcome = "sent" | "already-pending" | "cannot-connect" | "failed";

export interface LinkedInActions {
  /** Warm-up touch: like a recent post from the prospect. Returns true if a like landed. */
  warmUp(p: ProspectRow): Promise<boolean>;
  /** Send a connection request with a short note. */
  sendConnect(p: ProspectRow, note: string): Promise<ConnectOutcome>;
  /**
   * True when this profile can be messaged right now without being connected. LinkedIn allows that
   * for members who turned on Open Profile, and it is the only way a first message goes out without
   * waiting for an invite to be accepted.
   */
  canMessageNow(p: ProspectRow): Promise<boolean>;
  /**
   * Names in the account's connections list, newest first, read in one page load. Checking who
   * accepted this way costs a single visit instead of one profile visit per pending invite.
   */
  recentConnections(): Promise<string[]>;
  /**
   * Names of conversation participants whose latest message is inbound (a reply), read from the
   * messaging inbox in one pass. The sequence matches these against active prospects.
   */
  inboxRepliers(): Promise<string[]>;
  /**
   * The messages in one prospect's thread, oldest first.
   *
   * The inbox scan says who wrote back; this says what they wrote, which the
   * converse step needs before it can answer anything. It costs a page load per
   * replier, so it is only ever called for the handful the inbox scan named.
   */
  readThread(p: ProspectRow): Promise<{ from: "us" | "them"; body: string }[]>;
  /**
   * What happened when the agent tried to connect, rather than just whether it
   * worked.
   *
   * A boolean sent three very different situations down one path. On a live
   * account on 2026-08-10, of thirteen attempts in one pass eleven returned
   * false: six profiles that cannot be connected with at all, and five that
   * already had an invitation pending from a previous pass. All eleven stayed
   * in the queue and were retried on the next pass, and the next, for ever,
   * which is why the customer had been looking at the same names in Today's
   * queue since the day the agent started.
   *
   *   sent            a new invitation went out just now
   *   already-pending one is out there from before; the state was simply lost
   *   cannot-connect  no Connect control at all, and there never will be
   *   failed          something transient, worth trying again later
   */
  sendDm(p: ProspectRow, body: string): Promise<boolean>;
  /** Withdraw a stale, still-unaccepted connection request. */
  withdrawInvite(p: ProspectRow): Promise<boolean>;
}

// Verified against the real logged-in DOM:
// - like button: aria "React Like"
// - connect button: aria "Invite <Name> to connect" (scoped by name in sendConnect)
// - profile Message button lives in <main> and its aria starts with "Message" (the global nav is
//   "Messaging", excluded); the composer is .msg-form__contenteditable and send is .msg-form__send-button
// - a message from the other party carries .msg-s-event-listitem--other; our own does not; body is
//   in .msg-s-event-listitem__body
const SEL = {
  addNote: 'button[aria-label*="Add a note"]',
  noteBox: 'textarea[name="message"], #custom-message',
  sendInvite: 'button[aria-label*="Send invitation"], button[aria-label*="Send now"], button[aria-label*="Send"]',
  // Renamed by LinkedIn: the control now reads "Reaction button state: Like".
  // The old names are kept behind it because they cost nothing and an older
  // layout should still work. Verified on the live page 2026-07-31.
  likeFirstPost:
    'button[aria-label*="Reaction button state: Like" i], button[aria-label="React Like"], button[aria-label^="React Like"]',
  msgBox: '.msg-form__contenteditable, div[role="textbox"][contenteditable="true"]',
  msgSend: "button.msg-form__send-button",
  firstDegree: "span.dist-value, .distance-badge .dist-value",
} as const;

// The profile's own Message button: in <main>, aria starts with "Message", never the nav "Messaging".
// The profile's own Message button. Two lookalikes have to be excluded: the global nav "Messaging",
// and "Message with Premium", an upsell LinkedIn shows on profiles you cannot message for free.
// Clicking the upsell opens a sales page, which is how a send once ended up in the wrong thread.
/**
 * Can this person be written to right now, read off their top card?
 *
 * Pure, and exported, so the judgement can be held by tests against the exact
 * two cards it was built from. Both were read off the live site on 2026-08-08:
 *
 *   "Shibam B. He/Him · 1st Co-founder, RazorBooking.com ..."
 *   "Jerin Mariam · 2nd Product Architect ... Message Pending More"
 *
 * A pending invitation is refused even when the degree cannot be read, and an
 * unreadable card is refused rather than guessed at: waiting a pass costs
 * nothing, and a message that cannot be delivered costs the sequence its place.
 */
export function canMessageFromCard(topcardText: string): boolean {
  const card = (topcardText ?? "").replace(/\s+/g, " ").trim();
  if (!card) return false;
  if (/\bpending\b/i.test(card)) return false;
  return /·\s*1st\b/i.test(card);
}

const MESSAGE_BTN =
  'main button[aria-label^="Message"]:not([aria-label*="Messaging"]):not([aria-label*="Premium"]), ' +
  'main a[aria-label^="Message"]:not([aria-label*="Messaging"]):not([aria-label*="Premium"])';

/**
 * Types a message that contains line breaks into the LinkedIn composer.
 *
 * Enter sends in that composer, so typing a body straight through fires the message at its first
 * line break and posts the rest as separate messages. A sign-off on its own line is enough to turn
 * one message into two. Lines are typed one at a time with Shift+Enter between them, which is the
 * key a person uses for a new line, and every character still goes through the keyboard.
 */
async function typeMultiline(page: Page, box: Locator, body: string): Promise<void> {
  const lines = body.replace(/\r/g, "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    // Through the persona's own keyboard: this account's speed, pauses that
    // cluster at words and sentences, and the occasional typo backspaced out.
    // A flat 25-90ms delay was 130 to 260 words a minute with no corrections,
    // which nobody writing an original message produces.
    if (line.length > 0) await typeHumanHere(page, line);
    if (i < lines.length - 1) {
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
      await sleep(randInt(120, 320));
    }
  }
}

/** Returns the first visible element in a locator set (LinkedIn keeps hidden duplicate composers around). */
async function firstVisibleLoc(loc: Locator): Promise<Locator | null> {
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    if (await loc.nth(i).isVisible().catch(() => false)) return loc.nth(i);
  }
  return null;
}

/**
 * Clicks an element even when a decorative overlay swallows the pointer. LinkedIn menu rows put an
 * icon on top of the row, so a real mouse click at the centre lands on the icon and is rejected
 * ("subtree intercepts pointer events"). We try the human click first and fall back to the element's
 * own click(), which ignores hit-testing.
 */
async function clickThrough(page: Page, loc: Locator): Promise<boolean> {
  try {
    await clickHumanLocator(page, loc);
    return true;
  } catch {
    // fall through to the native click
  }
  try {
    await loc.click({ timeout: 3000, force: true });
    return true;
  } catch {
    // fall through to the DOM click
  }
  try {
    await loc.evaluate((el) => (el as HTMLElement).click());
    return true;
  } catch {
    return false;
  }
}

/**
 * The URL behind this profile's Connect control, or null when the profile is follow-only.
 *
 * LinkedIn's Connect is an anchor to /preload/custom-invite/?vanityName=..., not a button that opens
 * a modal, and on Follow-primary profiles it only renders once the overflow menu is open. Reading the
 * href and navigating to it is far more reliable than clicking a menu row, whose centre is covered by
 * its own icon and rejects real mouse clicks.
 */
export async function inviteHref(page: Page, fullName: string): Promise<string | null> {
  const exact = `a[aria-label="Invite ${fullName} to connect"]`;
  // Some profiles label the row, others render the very same link bare, so the href is what to trust.
  const byHref = 'a[href*="/preload/custom-invite/"]';
  const read = async () => {
    const labelled = page.locator(exact).first();
    if ((await labelled.count()) > 0) return labelled.getAttribute("href").catch(() => null);
    const bare = page.locator(byHref).first();
    if ((await bare.count()) > 0) return bare.getAttribute("href").catch(() => null);
    return null;
  };

  if ((await page.locator(`${exact}, ${byHref}`).count()) > 0) return read();

  // Not rendered yet: open the profile's overflow menu, which mounts the dropdown contents.
  const buttons = page.locator("main button");
  const n = await buttons.count();
  for (let i = 0; i < n; i++) {
    const b = buttons.nth(i);
    const text = (await b.innerText().catch(() => "")).trim();
    const aria = (await b.getAttribute("aria-label").catch(() => "")) ?? "";
    if (!(text === "More" || aria === "More" || /^more actions/i.test(aria))) continue;
    if (!(await b.isVisible().catch(() => false))) continue;
    const box = await b.boundingBox().catch(() => null);
    if (!box || box.height < 24) continue; // skip the 18px "…more" post expander
    await clickThrough(page, b);
    // The dropdown mounts in a portal a moment after the click, so wait for the link rather than a
    // fixed delay: a short sleep here is what made most profiles look follow-only.
    await page
      .waitForSelector(`${exact}, ${byHref}`, { timeout: 5000, state: "attached" })
      .catch(() => {});
    break;
  }
  return read();
}

/**
 * The visible invite modal, or null. LinkedIn ships hidden video-player dialogs (vjs-*) on profile
 * pages, so matching div[role="dialog"] alone picks up an empty modal that has no buttons.
 */
async function inviteModal(page: Page): Promise<Locator | null> {
  const modals = page.locator('.artdeco-modal, div[role="dialog"]:not([class*="vjs-"])');
  const n = await modals.count();
  for (let i = 0; i < n; i++) {
    const m = modals.nth(i);
    if (!(await m.isVisible().catch(() => false))) continue;
    const cls = (await m.getAttribute("class").catch(() => "")) ?? "";
    if (cls.includes("vjs-")) continue;
    if ((await m.locator("button").count()) > 0) return m;
  }
  return null;
}

/** True when the profile shows the invite already went out. */
async function invitePending(page: Page): Promise<boolean> {
  if ((await page.locator('button[aria-label*="Pending" i]').count()) > 0) return true;
  const main = await page.locator("main").innerText().catch(() => "");
  return /\bpending\b/i.test(main);
}

/** The real browser-driven actions. */
export function browserActions(page: Page): LinkedInActions {
  async function goToProfile(p: ProspectRow): Promise<void> {
    await page.goto(p.profile_url, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
    await dwell(1800, 3000);
    // The profile top card lazy-renders; a scroll down then back up forces its actions to appear.
    await scrollHuman(page, randInt(1, 2));
    await page.mouse.wheel(0, -1400).catch(() => {});
    await dwell(1500, 2500);
  }

  async function clickFirst(selector: string, timeoutMs = 4000): Promise<boolean> {
    const el = page.locator(selector).first();
    if ((await el.count()) === 0) return false;
    try {
      await el.waitFor({ state: "visible", timeout: timeoutMs });
      await clickHumanLocator(page, el);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Closes every message overlay that is still open.
   *
   * LinkedIn keeps a conversation bubble open after you send, and opening the next prospect's thread
   * does not necessarily focus it. Leaving them open once cost three messages: they all went to the
   * first prospect's thread because his composer was the visible one. Nothing is ever typed until
   * the desk is clear.
   */
  async function closeOpenThreads(): Promise<void> {
    for (let i = 0; i < 6; i++) {
      const closer = await firstVisibleLoc(page.locator('button[aria-label^="Close your conversation"]'));
      if (!closer) return;
      await closer.click().catch(() => {});
      await dwell(400, 900);
    }
  }

  /**
   * The compose link for this prospect, taken from their own profile.
   *
   * A profile page carries several compose links: the prospect's own, in the top card, and one per
   * suggestion in the sidebar. The sidebar ones are labelled "Message <someone else>", so they can be
   * ruled out by name. The prospect's own link is unreliable to name: LinkedIn labels it after the
   * relationship, and on a fresh connection it reads "Say hello" under an aria-label of
   * "Message with Premium". So the rule is the reverse one: take the first compose link that is not
   * addressed to a different person. Order helps too, the top card comes before the sidebar.
   */
  async function composeHref(p: ProspectRow): Promise<{ href: string; certain: boolean } | null> {
    const id = (p.profile_id ?? "").trim();
    const full = (p.full_name ?? "").trim();

    /**
     * The Message control in the profile's own top card, which is the only one
     * on the page that certainly belongs to the person being looked at.
     *
     * This is the primary route now, and it had to become one. The compose
     * links carry the member URN, `recipient=ACoAAD-hVfAB...`, and never the
     * vanity slug we store, so matching the slug against the href never
     * succeeded. The fallback then read an aria-label that the control no
     * longer has: it is a plain <a> whose only text is "Message". Every DM
     * therefore failed with "could not open a conversation", on 2026-07-31,
     * with six compose links sitting on the page.
     *
     * Position is the identity here. The page carries other people's compose
     * links in the sidebar and in the feed below, which is exactly why this
     * cannot simply take the first one.
     */
    const topcard = page.locator('[componentkey$="Topcard"]').first();
    if (await topcard.count()) {
      const own = topcard.locator('a[href*="/messaging/compose"]').first();
      if (await own.count()) {
        const href = (await own.getAttribute("href").catch(() => "")) ?? "";
        if (href) {
          // Cross-checked when it can be: the top card's own key ends in the
          // member's URN, and the compose link names its recipient.
          const key = (await topcard.getAttribute("componentkey").catch(() => "")) ?? "";
          const urn = /profile\.card\.ref(.+?)Topcard$/.exec(key)?.[1] ?? "";
          if (!urn || href.includes(urn)) return { href, certain: true };
        }
      }
    }

    const anchors = page.locator('a[href*="/messaging/compose"]');
    const n = await anchors.count();

    let byName: string | null = null;
    for (let i = 0; i < n; i++) {
      const a = anchors.nth(i);
      const href = (await a.getAttribute("href").catch(() => "")) ?? "";
      if (!href) continue;
      // Kept for the older layout, where the slug did appear in the link.
      if (id && href.includes(id)) return { href, certain: true };
      const aria = (await a.getAttribute("aria-label").catch(() => "")) ?? "";
      if (full && aria.includes(full)) byName ??= href;
    }
    // Only for prospects stored under a vanity URL, where there is no member id to match on.
    return byName ? { href: byName, certain: false } : null;
  }

  /**
   * Opens this prospect's conversation and returns the element the message must be typed into.
   * Navigating to their compose link is safer than clicking a button whose label lies, and the
   * conversation is confirmed to be theirs before anything is typed.
   */
  async function openThread(p: ProspectRow): Promise<Locator | null> {
    await closeOpenThreads();
    await goToProfile(p);
    const link = await composeHref(p);
    if (!link) return null;

    await page.goto(new URL(link.href, "https://www.linkedin.com").toString(), { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForSelector(".msg-form__contenteditable", { timeout: 12_000 }).catch(() => {});
    await dwell(1500, 2500);

    // An overlay bubble is checked against the name in its header; the full messaging page has no
    // such header to read, so it is trusted only when the link itself carried the member id.
    const bubble = await bubbleFor(p);
    if (bubble) return bubble;
    if (!link.certain) return null;
    const thread = page.locator(".msg-convo-wrapper, .msg-s-message-list-container, main").first();
    return (await thread.locator(".msg-form__contenteditable").count()) > 0 ? thread : null;
  }

  /** The open conversation bubble whose header names this prospect. */
  async function bubbleFor(p: ProspectRow): Promise<Locator | null> {
    const full = (p.full_name ?? "").trim();
    const first = (p.first_name ?? "").trim();
    if (!full && !first) return null;
    const bubbles = page.locator(".msg-overlay-conversation-bubble");
    const n = await bubbles.count();
    for (let i = 0; i < n; i++) {
      const b = bubbles.nth(i);
      if (!(await b.isVisible().catch(() => false))) continue;
      if ((await b.locator(".msg-form__contenteditable").count()) === 0) continue;
      const header = (await b.innerText().catch(() => "")).slice(0, 200);
      if (full && header.includes(full)) return b;
      if (!full && first && header.includes(first)) return b;
    }
    return null;
  }

  return {
    async warmUp(p) {
      // The profile page only teases recent posts and renders no reaction buttons, so the like has to
      // happen on the member's activity feed, where each post carries its own React Like control.
      const activityUrl = `${p.profile_url.replace(/\/?$/, "/")}recent-activity/all/`;
      await page.goto(activityUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
      await dwell(2000, 3500);
      await scrollHuman(page, randInt(1, 2));
      await dwell(1200, 2500);

      // Only unliked posts carry "React Like"; a liked one flips to "Unreact Like". So the count of
      // unliked posts dropping by one is the proof the like registered. Re-reading the clicked
      // locator cannot work: its aria-label changes, so it stops matching after a successful like.
      const unliked = page.locator(SEL.likeFirstPost);
      const before = await unliked.count();
      const like = await firstVisibleLoc(unliked);
      if (!like) {
        log(`warmUp: ${p.first_name} has no likeable recent post.`);
        return false;
      }
      await like.scrollIntoViewIfNeeded().catch(() => {});
      await clickThrough(page, like);
      await dwell(1500, 2500);
      const liked = (await unliked.count()) < before;
      if (!liked) log(`warmUp: like click did not register for ${p.first_name}.`);
      return liked;
    },

    async sendConnect(p, note) {
      await goToProfile(p);
      const name = p.full_name ?? "";
      if (await invitePending(page)) {
        // Not a failure: an invitation is out there, our record of it was lost.
        log(`sendConnect: invite to ${p.first_name} is already pending.`);
        return "already-pending";
      }
      const href = await inviteHref(page, name);
      if (!href) {
        log(`sendConnect: Connect control not found for ${p.first_name} (likely follow-only).`);
        return "cannot-connect";
      }
      await dwell(700, 1500);
      await page.goto(new URL(href, "https://www.linkedin.com").toString(), { waitUntil: "domcontentloaded" }).catch(() => {});
      await dwell(2000, 3200);

      // Some profiles send straight through with no modal at all.
      if (await invitePending(page)) return "sent";

      const modal = await inviteModal(page);
      if (!modal) {
        log(`sendConnect: no invite modal appeared for ${p.first_name}.`);
        return "failed";
      }
      if (note) {
        const addNote = modal.locator(SEL.addNote).first();
        if ((await addNote.count()) > 0) {
          await clickThrough(page, addNote);
          await dwell(500, 1200);
          const box = page.locator(SEL.noteBox).first();
          if ((await box.count()) > 0) {
            await box.click().catch(() => {});
            await typeHumanHere(page, note).catch(() => {});
          }
          await dwell(500, 1200);
        }
      }
      // "Send", "Send now" or "Send without a note" depending on the profile and account type.
      const send = await firstVisibleLoc(modal.locator("button").filter({ hasText: /^send/i }));
      const sendBtn = send ?? (await firstVisibleLoc(modal.locator(SEL.sendInvite)));
      if (!sendBtn) {
        const seen = await modal.locator("button").allInnerTexts().catch(() => []);
        log(`sendConnect: no Send button for ${p.first_name}. Modal buttons: ${seen.join(" | ")}`);
        return "failed";
      }
      await clickThrough(page, sendBtn);
      await dwell(1500, 2500);
      // Confirm it left: the modal closes and the profile flips to Pending.
      const stillOpen = (await inviteModal(page)) !== null;
      const sent = !stillOpen || (await invitePending(page));
      if (!sent) log(`sendConnect: clicked Send but the invite did not register for ${p.first_name}.`);
      return sent ? "sent" : "failed";
    },

    async canMessageNow(p) {
      /**
       * The Message button is necessary and nowhere near sufficient.
       *
       * The premise here used to be that "LinkedIn only renders it when this
       * account is actually allowed to message the person". It does not. Read
       * off Jerin Mariam's live top card on 2026-08-08, second degree with an
       * invitation still pending: `Message`, `Pending`, `More`. The button is
       * there for everybody, and pressing it on a free account opens a Premium
       * upsell headed "grow your network smarter with Premium" instead of a
       * composer.
       *
       * So this returned true for prospects who had only just been invited,
       * the sequence sent them straight to connected without waiting for the
       * acceptance, and every hello afterwards failed with "could not open a
       * conversation". Three of them on 2026-08-07, and the account looked
       * broken for two days.
       *
       * The degree is the real test and the top card states it in words:
       * "Shibam B. He/Him · 1st" against "Jerin Mariam · 2nd ... Pending". No
       * selector changes here, only a second question asked of a card this
       * codebase already reads for the compose link.
       *
       * A genuine Open Profile at second degree is turned away by this, which
       * costs the wait for an acceptance that was going to happen anyway. That
       * is the cheap side of being wrong.
       */
      await goToProfile(p);
      if ((await page.locator(MESSAGE_BTN).count()) === 0) return false;

      const card = await page
        .locator('[componentkey$="Topcard"]')
        .first()
        .innerText()
        .catch(() => "");
      return canMessageFromCard(card);
    },

    async recentConnections() {
      await page.goto("https://www.linkedin.com/mynetwork/invite-connect/connections/", { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
      await dwell(2500, 4000);
      await scrollHuman(page, randInt(1, 2));
      // The list is newest first, so whoever accepted recently is near the top. One row per person,
      // name on its first line.
      return page.evaluate(() => {
        const names: string[] = [];
        const seen = new Set<string>();
        for (const a of Array.from(document.querySelectorAll('main a[href*="/in/"]')) as HTMLAnchorElement[]) {
          const href = a.href.split("?")[0] ?? a.href;
          if (seen.has(href)) continue;
          seen.add(href);
          const row = a.closest("li") ?? a.parentElement;
          const first = ((row as HTMLElement)?.innerText ?? "").split("\n").map((l) => l.trim()).find(Boolean);
          if (first) names.push(first);
        }
        return names;
      });
    },

    async inboxRepliers() {
      await page.goto("https://www.linkedin.com/messaging/", { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
      await dwell(2500, 4000);
      // The inbox previews each conversation's last message. It is prefixed with "You" when we sent
      // it, and with the other person's name when they did, so a non-"You" preview means they replied.
      return page.evaluate(() => {
        const items = Array.from(document.querySelectorAll("li.msg-conversation-listitem"));
        const out: string[] = [];
        for (const el of items) {
          const name = (el.querySelector('[class*="participant-names"]') as HTMLElement | null)?.innerText?.trim() ?? "";
          const snippet = (el.querySelector('[class*="message-snippet"]') as HTMLElement | null)?.innerText?.trim() ?? "";
          if (name && snippet && !/^you\b/i.test(snippet)) out.push(name);
        }
        return out;
      });
    },

    async readThread(p) {
      // Reuses the same scoped-bubble opener as sendDm. Reading the first
      // message list on the page returned another prospect's conversation
      // during testing, which is the same bug openThread already exists to
      // prevent, so it is not solved a second way here.
      const bubble = await openThread(p);
      if (!bubble) return [];
      await dwell(1200, 2200);
      const turns = await bubble
        .locator(".msg-s-event-listitem")
        .evaluateAll((nodes) => {
          const out: { from: "us" | "them"; body: string }[] = [];
          for (const node of nodes) {
            const el = node as HTMLElement;
            const body = (
              el.querySelector(".msg-s-event-listitem__body") as HTMLElement | null
            )?.innerText?.trim();
            if (!body) continue;
            // LinkedIn marks the OTHER person's messages with this modifier.
            // Unverified against the live DOM, so the default is "ours":
            // mislabelling one of our messages as theirs would have the agent
            // answering itself, which is the worse of the two failures.
            const mine = el.className.includes("msg-s-event-listitem--other")
              ? false
              : true;
            out.push({ from: mine ? "us" : "them", body });
          }
          return out;
        })
        .catch(() => [] as { from: "us" | "them"; body: string }[]);
      return turns;
    },

    async sendDm(p, body) {
      // Everything below is scoped to this prospect's own conversation bubble. Reaching for the
      // first composer on the page sent three different messages into one prospect's thread.
      const bubble = await openThread(p);
      if (!bubble) {
        log(`sendDm: could not open a conversation with ${p.first_name}.`);
        return false;
      }
      const box = bubble.locator(SEL.msgBox).first();
      if ((await box.count()) === 0) {
        log(`sendDm: composer did not open for ${p.first_name}.`);
        return false;
      }

      // LinkedIn pre-fills new conversations with a suggested greeting. Typing on top of it shipped
      // a message that began with LinkedIn's own words, so the field is emptied first and checked.
      await box.click().catch(() => {});
      await sleep(randInt(300, 700));
      await page.keyboard.press("ControlOrMeta+A").catch(() => {});
      await page.keyboard.press("Backspace").catch(() => {});
      await sleep(randInt(200, 500));
      const leftover = (await box.innerText().catch(() => "")).trim();
      if (leftover.length > 0) {
        log(`sendDm: composer for ${p.first_name} would not clear, leaving it alone.`);
        return false;
      }

      await typeMultiline(page, box, body);
      await dwell(700, 1500);
      // Guard against a stray keystroke, an autocomplete, or LinkedIn's own suggested greeting: what
      // sits in the field must be our message. Line breaks come back rendered differently from how
      // they were typed, so both sides are compared with their whitespace collapsed.
      const flatten = (s: string) => s.replace(/\s+/g, " ").trim();
      const typed = await box.innerText().catch(() => "");
      if (flatten(typed) !== flatten(body)) {
        log(`sendDm: composer content does not match the message for ${p.first_name}, not sending.`);
        return false;
      }

      const send = bubble.locator(SEL.msgSend).first();
      if ((await send.count()) > 0 && !(await send.isDisabled().catch(() => true))) {
        await send.click().catch(() => {});
      }
      await dwell(1200, 2200);
      let empty = (await box.innerText().catch(() => "x")).trim().length === 0;
      if (!empty) {
        await page.keyboard.press("Enter").catch(() => {});
        await dwell(1000, 1800);
        empty = (await box.innerText().catch(() => "x")).trim().length === 0;
      }
      if (!empty) log(`sendDm: message typed but composer did not clear for ${p.first_name}.`);
      await closeOpenThreads();
      return empty;
    },

    async withdrawInvite(p) {
      await page.goto("https://www.linkedin.com/mynetwork/invitation-manager/sent/", { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForSelector("main", { timeout: 15_000 }).catch(() => {});
      await dwell(1500, 3000);
      const name = p.full_name ?? "";
      if (!name) return false;
      const card = page.locator("li").filter({ hasText: name }).first();
      const withdrawBtn = card.locator('button[aria-label*="Withdraw"], button:has-text("Withdraw")').first();
      if ((await withdrawBtn.count()) === 0) return false;
      try {
        await clickHumanLocator(page, withdrawBtn);
        await dwell(600, 1400);
        const confirm = page.locator('div[role="dialog"] button', { hasText: /withdraw/i }).first();
        if ((await confirm.count()) > 0) await clickHumanLocator(page, confirm);
        return true;
      } catch {
        return false;
      }
    },
  };
}
