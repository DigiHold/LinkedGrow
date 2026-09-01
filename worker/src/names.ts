/**
 * Getting a first name out of what LinkedIn calls a name.
 *
 * The field is free text and people fill it like a billboard: "Mr Happiness -
 * Sasho Jovanovski", "Dr Veronique BLANC-BRUDE", "🚀 Tom Meyer | We are hiring".
 * Splitting on the first space returns "Mr", "Dr" and an emoji, and an empty or
 * wrong first name is worse than none: the model is told to greet somebody by
 * name, finds no name in the prompt, and invents one. That is exactly how a DM
 * to Sasho went out addressed to Marija on 2026-08-06.
 *
 * The rule here is deliberately conservative. When nothing looks like a given
 * name, this returns an empty string and the caller writes a message with no
 * name in it, which reads fine. Guessing is the failure mode being fixed.
 */

/** Titles and honorifics, which are never the name. */
const TITLES = new Set([
  "mr",
  "mrs",
  "ms",
  "miss",
  "mx",
  "dr",
  "prof",
  "professor",
  "sir",
  "madam",
  "rev",
  "eng",
  "ing",
  "arch",
]);

/**
 * A branded prefix is separated from the real name by one of these. LinkedIn
 * users put a company, a tagline or a hiring notice on either side of them.
 */
const SEPARATORS = /[|•·—–]|(?:\s-\s)|(?:\s\/\s)/;

/** Credentials people append: "Tom Meyer, PhD", "Ana Ruiz MBA". */
const CREDENTIALS = new Set([
  "phd",
  "mba",
  "md",
  "msc",
  "bsc",
  "ba",
  "ma",
  "cpa",
  "cfa",
  "pmp",
  "jd",
  "esq",
  "rn",
  "dds",
  "cissp",
]);

/** Everything that is not a letter, an apostrophe or an inner hyphen. */
function clean(token: string): string {
  return token
    .replace(/[^\p{L}'’-]/gu, "")
    .replace(/^-+|-+$/g, "")
    .trim();
}

/** A token that could be a given name: letters, not a title, not a credential. */
function plausible(token: string): boolean {
  const lower = token.toLowerCase();
  if (token.length < 2) return false;
  if (TITLES.has(lower)) return false;
  if (CREDENTIALS.has(lower)) return false;
  return /^\p{L}/u.test(token);
}

/**
 * Restore the casing a human would type. "BLANC-BRUDE" becomes "Blanc-Brude"
 * and "sasho" becomes "Sasho", because a name shouted back in a DM reads as a
 * mail merge.
 */
function titleCase(name: string): string {
  return name
    .split(/([-'’])/)
    .map((part) =>
      /[-'’]/.test(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("");
}

/**
 * The first name to greet somebody by, or an empty string when the field holds
 * nothing that looks like one.
 */
export function firstNameOf(fullName: string | null | undefined): string {
  const raw = (fullName ?? "").trim();
  if (!raw) return "";

  // "Jovanovski, Sasho" is surname-first, and only when there is exactly one
  // comma with words on both sides. "Tom Meyer, PhD" is not that shape once
  // credentials are dropped, so the credential list runs first.
  const commaParts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !CREDENTIALS.has(clean(p).toLowerCase()));

  // Each separator-delimited chunk is a candidate, scanned left to right.
  const chunks =
    commaParts.length === 2
      ? [commaParts[1], commaParts[0]]
      : commaParts.join(" ").split(SEPARATORS);

  const perChunk = chunks.map((chunk) =>
    (chunk ?? "")
      .split(/\s+/)
      .map(clean)
      .filter(plausible)
  );

  // A person's name is a given name and a surname. Preferring the leftmost
  // chunk holding exactly two is what separates "Sasho Jovanovski" from the
  // "Mr Happiness" billboard in front of it, and "Tom Meyer" from the "We are
  // hiring" behind it.
  const pair = perChunk.find((tokens) => tokens.length === 2);
  const found = pair ?? perChunk.find((tokens) => tokens.length > 0);
  if (!found || found.length === 0) return "";

  // A lone token carrying an interior capital is a brand, not a person:
  // "LinkedGrow", "StartupRevolution". A real mononym ("Madonna") has no inner
  // capital, and a hyphenated given name is exempt.
  const only = found[0] ?? "";
  if (found.length === 1 && !/[-'’]/.test(only) && /\p{Lu}/u.test(only.slice(1))) {
    return "";
  }

  return titleCase(only);
}

/**
 * Does this message greet somebody who is not the prospect?
 *
 * The last line of defence. Even with a correct first name in the prompt, a
 * model can localise it, shorten it, or reach for the sender's name instead.
 * A capitalised word sitting where a name goes, matching neither side of the
 * conversation, means the message is regenerated rather than sent.
 */
export function namesSomebodyElse(
  text: string,
  prospectFullName: string | null | undefined,
  senderFirstName: string
): string | null {
  // With no name to check against there is no verdict to give. Rejecting here
  // would fail every message whose caller does not know the prospect's name.
  if (!(prospectFullName ?? "").trim()) return null;

  const greeting =
    /(?:^|\n)\s*(?:hi|hey|hello|good morning|good afternoon|good evening|glad we connected|good to be connected|great to connect|thanks for connecting)[,\s]+([\p{Lu}][\p{L}'’-]+)/iu.exec(
      text
    );
  if (!greeting) return null;

  const used = (greeting[1] ?? "").toLowerCase();
  const allowed = new Set<string>([senderFirstName.toLowerCase()]);
  for (const token of (prospectFullName ?? "").split(/[\s,|•·—–/-]+/)) {
    const cleaned = clean(token).toLowerCase();
    if (cleaned) allowed.add(cleaned);
  }

  return allowed.has(used) ? null : (greeting[1] ?? null);
}
