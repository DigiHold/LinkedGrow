/**
 * Making the model's answer into the array the route asked for.
 *
 * Every AI route here asks for a JSON array of strings, and every one of them
 * used to hand a naked `JSON.parse` straight to the screen. The model mostly
 * complies, and when it does not the failure is rarely an exception: it is an
 * array of the wrong length. A wizard that promised 3 posts then renders one
 * card per entry, which is how a customer ended up looking at 30 of them on
 * 2026-09-23. These two helpers are the contract: parse defensively, then
 * return the number of posts the screen was promised.
 */

/** A string this short is a line of a post, not a post. */
const FRAGMENT_CHARS = 200;

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Models forget to escape the newlines inside their own string literals. */
function escapeRawNewlines(text: string): string {
  let inString = false;
  let escaped = false;
  const buf: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (escaped) {
      buf.push(c);
      escaped = false;
      continue;
    }
    if (c === "\\") {
      buf.push(c);
      escaped = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      buf.push(c);
      continue;
    }
    if (inString && (c === "\n" || c === "\r")) {
      buf.push("\\n");
      continue;
    }
    buf.push(c);
  }
  return buf.join("");
}

function toArray(value: unknown): unknown[] | null {
  if (!Array.isArray(value)) return null;
  // One nested level: some models answer [["post", "post"]].
  return value.length === 1 && Array.isArray(value[0]) ? (value[0] as unknown[]) : value;
}

/**
 * Extract the JSON array out of a response that may be wrapped in markdown
 * fences, prose preamble, an object, or trailing commentary. Throws when
 * nothing array-shaped survives, so the caller can log the raw answer and tell
 * the customer to try again.
 */
export function parseJsonArray(raw: string): unknown[] {
  if (!raw || !raw.trim()) throw new Error("empty response");

  let text = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  // The outermost [...] - this also unwraps {"posts": [...]}.
  const first = text.indexOf("[");
  const last = text.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }

  const direct = toArray(tryParse(text));
  if (direct) return direct;

  const repaired = toArray(tryParse(escapeRawNewlines(text)));
  if (repaired) return repaired;

  throw new Error("could not parse JSON array");
}

/** The same, kept to the strings, which is what most of these prompts ask for. */
export function parseStringArray(raw: string): string[] {
  return parseJsonArray(raw).filter((x): x is string => typeof x === "string");
}

/**
 * The same, kept to the objects that carry every field the caller reads.
 *
 * A model that answers a hook as a bare string, or leaves out `secondLine`,
 * used to reach a `.replace` on undefined and turn the screen into a 500. An
 * entry that cannot be rendered is dropped here instead.
 */
export function parseRecordArray<T>(raw: string, required: string[]): T[] {
  return parseJsonArray(raw).filter((entry): entry is T => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const record = entry as Record<string, unknown>;
    return required.every((key) => typeof record[key] === "string" && record[key] !== "");
  });
}

/**
 * At most `max` entries, trimmed, with the blanks gone.
 *
 * For the lists where the entries stand on their own (ideas, hooks): there is
 * nothing to reassemble, so anything past what was asked for is simply not
 * shown. `normalizePosts` is the one for posts, which can arrive in pieces.
 */
export function capStrings(items: string[], max: number): string[] {
  return items.map((i) => i.trim()).filter((i) => i.length > 0).slice(0, Math.max(max, 1));
}

const sameLine = (a: string, b: string): boolean =>
  a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Cut `text` into one piece per occurrence of `marker` at the start of a line.
 * The hook is the reliable boundary here: the prompt requires every post to
 * open with it word for word.
 */
function splitOnMarker(text: string, marker: string): string[] {
  if (!marker.trim()) return [];
  const groups: string[][] = [];
  for (const line of text.split("\n")) {
    if (sameLine(line, marker)) {
      groups.push([line]);
      continue;
    }
    if (groups.length > 0) groups[groups.length - 1].push(line);
  }
  return groups.map((g) => g.join("\n").trim()).filter((g) => g.length > 0);
}

/**
 * Turn whatever the model returned into at most `count` posts.
 *
 * More entries than asked means one of two things, and both are handled by
 * gluing the entries back together and cutting on the hook: either the model
 * wrote one entry per line, and the posts are reassembled, or it simply wrote
 * too many posts, and the extras are dropped.
 */
export function normalizePosts(items: string[], count: number, hook: string): string[] {
  const clean = items.map((i) => i.trim()).filter((i) => i.length > 0);
  if (clean.length <= count) return clean;

  const firstHookLine = (hook || "").split("\n")[0] ?? "";
  const rebuilt = splitOnMarker(items.join("\n"), firstHookLine);
  if (rebuilt.length >= 2) return rebuilt.slice(0, count);

  // No hook to cut on. Entries this short are lines of a post rather than
  // posts, and one whole draft beats three orphan lines.
  const median = clean.map((c) => c.length).sort((a, b) => a - b)[Math.floor(clean.length / 2)] ?? 0;
  if (median < FRAGMENT_CHARS) {
    const joined = items.join("\n").trim();
    return joined ? [joined] : [];
  }

  return clean.slice(0, count);
}
