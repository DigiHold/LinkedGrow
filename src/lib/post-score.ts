import { slopWarnings } from "./post-style";

/**
 * What a post is scored on, and the checklist beside it, from one place.
 *
 * These were two separate blocks inside the generator page and they disagreed
 * with each other and with the writing rules. That is not cosmetic: it made the
 * number unreachable.
 *
 * The old scorer gave 35 points for a closing question, 35 for the words
 * "follow", "repost", "share", "comment" or "what do you think", and 10 for an
 * emoji. POST_STYLE_RULES forbids every one of those, and `stripSlop` deletes
 * them from the output before the customer ever sees it. So a post that obeyed
 * the product scored 20 out of 100 on engagement, which is a quarter of the
 * total, and the number was pinned in the 70s no matter what the model wrote.
 * Two of the four checks could never pass for the same reason.
 *
 * Mohamed Elmelegey rewrote one post twelve times chasing it on 2026-09-01. He
 * was not doing anything wrong and neither was the model: the target was
 * impossible. A score has to be reachable by writing well, or it is noise that
 * costs the customer twelve API calls to discover.
 *
 * So the four dimensions are now the four things the product actually asks for:
 * a hook that carries, paragraphs a person would read, the length the prompt
 * requests, and none of the markers `slopWarnings` names. All four are
 * reachable, and every one of them moves when the writing gets better.
 */

export interface PostCheck {
  label: string;
  passed: boolean;
  /** What to change, shown when it has not passed. */
  hint: string;
}

export interface PostScore {
  /** 0 to 100, the average of the four dimensions. */
  score: number;
  checks: PostCheck[];
}

/** The length the generate prompt asks for, so the score and the prompt agree. */
export const TARGET_MIN_CHARS = 800;
export const TARGET_MAX_CHARS = 1500;

/**
 * Paragraphs, in the sense the style rules mean: blocks separated by a blank
 * line, each running two to four sentences rather than one line each.
 */
function paragraphsOf(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function scorePost(content: string): PostScore {
  const body = content.trim();

  if (!body) {
    return {
      score: 0,
      checks: [
        { label: "An opening that carries", passed: false, hint: "Write the post first." },
        { label: "Paragraphs, not one line each", passed: false, hint: "Write the post first." },
        { label: `Length between ${TARGET_MIN_CHARS} and ${TARGET_MAX_CHARS}`, passed: false, hint: "Write the post first." },
        { label: "None of the AI tells", passed: false, hint: "Write the post first." },
      ],
    };
  }

  const lines = body.split("\n").filter((l) => l.trim());
  const firstLine = lines[0]?.trim() ?? "";

  /* 1. The opening. Under 100 characters is the rule the hook prompt states,
        and it has to actually say something rather than being three words. */
  const hookLength = firstLine.length;
  let hookScore = 40;
  if (hookLength >= 25 && hookLength <= 100) hookScore = 100;
  else if (hookLength > 100 && hookLength <= 140) hookScore = 70;
  else if (hookLength >= 10 && hookLength < 25) hookScore = 60;
  const hookPassed = hookScore === 100;

  /* 2. Shape. Blank-line separated paragraphs that are not one sentence each,
        because the staccato one-line-per-sentence post is the tell the rules
        name first. Two paragraphs is the floor for a post of this length. */
  const paragraphs = paragraphsOf(body);
  const multiSentence = paragraphs.filter((p) => sentencesOf(p).length >= 2).length;
  let shapeScore = 40;
  if (paragraphs.length >= 3 && multiSentence >= 2) shapeScore = 100;
  else if (paragraphs.length >= 2 && multiSentence >= 1) shapeScore = 75;
  else if (paragraphs.length >= 2) shapeScore = 55;
  const shapePassed = shapeScore === 100;

  /* 3. Length, against the same numbers the generate prompt asks the model for.
        A post outside the band is not wrong, it is just off the target the
        product set, so the band earns full marks and the edges lose some. */
  const length = body.length;
  let lengthScore = 30;
  if (length >= TARGET_MIN_CHARS && length <= TARGET_MAX_CHARS) lengthScore = 100;
  else if (length >= 600 && length < TARGET_MIN_CHARS) lengthScore = 80;
  else if (length > TARGET_MAX_CHARS && length <= 2200) lengthScore = 75;
  else if (length >= 300 && length < 600) lengthScore = 55;
  const lengthPassed = lengthScore === 100;

  /* 4. The tells, taken from the product's own list rather than a second one
        written here. Nothing found is full marks; each finding costs 25. */
  const warnings = slopWarnings(body);
  const cleanScore = Math.max(0, 100 - warnings.length * 25);
  const cleanPassed = warnings.length === 0;

  const score = Math.round((hookScore + shapeScore + lengthScore + cleanScore) / 4);

  return {
    score,
    checks: [
      {
        label: "An opening that carries",
        passed: hookPassed,
        hint:
          hookLength > 100
            ? "The first line runs long. Under 100 characters is what most readers see."
            : "Open with something concrete: a number, a name, a thing that happened.",
      },
      {
        label: "Paragraphs, not one line each",
        passed: shapePassed,
        hint: "Group the lines into paragraphs of two to four sentences, separated by a blank line.",
      },
      {
        label: `Length between ${TARGET_MIN_CHARS} and ${TARGET_MAX_CHARS} characters`,
        passed: lengthPassed,
        hint:
          length < TARGET_MIN_CHARS
            ? `${TARGET_MIN_CHARS - length} characters short. Add the detail or the example the point is missing.`
            : `${length - TARGET_MAX_CHARS} characters over. Cut the paragraph that repeats another one.`,
      },
      {
        label: "None of the AI tells",
        passed: cleanPassed,
        hint: warnings.length > 0 ? warnings.join("; ") : "",
      },
    ],
  };
}
