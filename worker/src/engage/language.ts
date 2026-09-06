/**
 * Is this post written in English, decided without reading a word LinkedIn wrote.
 *
 * Nicolas, 2026-09-06: the agent must never comment on a post in another language. The first live
 * draft opened a post written in French by a French creator, and a reply in English under it would
 * mark the account as a bot faster than any wording ever could.
 *
 * LinkedIn does say so itself, with a "Show translation" control under foreign posts, and that is
 * exactly the kind of label this codebase refuses to depend on: it is written in the language of
 * the viewer's own interface, so the tell for a French post is a French word on a French account.
 *
 * Function words settle it instead. They are the most common words in any language, they are short,
 * and no writer avoids them. A post of any real length carries dozens. Counting how many belong to
 * English against how many belong to its neighbours is enough, and it costs nothing: this runs
 * before the model is called at all, so a foreign post never spends a token.
 */

const ENGLISH = new Set([
  "the", "and", "that", "for", "with", "you", "this", "have", "but", "not", "are", "was", "your",
  "they", "from", "what", "when", "would", "there", "their", "been", "were", "will", "about",
  "which", "than", "them", "then", "just", "into", "more", "most", "some", "only", "over", "after",
  "because", "how", "why", "who", "our", "out", "get", "got", "does", "did", "doesn", "don",
]);

/**
 * The languages a post in Nicolas's feed is actually likely to be in. Each entry is a word that is
 * common in that language and absent from ordinary English, so one hit means something.
 */
const OTHERS = new Set([
  // French
  "les", "des", "une", "est", "pas", "vous", "pour", "dans", "avec", "sur", "qui", "que", "mais",
  "plus", "sont", "cette", "nous", "ils", "elle", "leur", "tout", "faire", "chez", "aussi", "donc",
  // Spanish and Portuguese
  "los", "las", "una", "por", "para", "con", "como", "pero", "esta", "este", "muy", "todo", "sus",
  "nao", "uma", "voce", "mais", "isso", "seu",
  // German
  "der", "die", "das", "und", "ist", "nicht", "auch", "eine", "sich", "auf", "wir", "mit", "von",
  "ein", "dass", "aber", "wie", "man", "bei", "oder",
  // Italian and Dutch
  "che", "non", "sono", "della", "come", "anche", "questo", "essere",
  "het", "een", "van", "niet", "voor", "maar", "dat", "zijn", "ook",
]);

/** Letters that essentially never appear in English prose but are ordinary elsewhere. */
const FOREIGN_LETTERS = /[àâäçèéêëîïôöùûüÿœãõñáíóúýåøæßğışœ]/i;

export interface LanguageVerdict {
  english: boolean;
  reason: string;
}

/**
 * The verdict, and why.
 *
 * Short posts are refused rather than guessed at. Under roughly twenty words there are not enough
 * function words for the count to mean anything, and a wrong guess here puts an English comment
 * under a German post. Refusing costs one skipped post out of many.
 */
export function readLanguage(text: string): LanguageVerdict {
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-zà-ÿœ\s']/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length < 20) {
    return { english: false, reason: `only ${words.length} words, too short to tell` };
  }

  let english = 0;
  let other = 0;
  for (const word of words) {
    if (ENGLISH.has(word)) english += 1;
    else if (OTHERS.has(word)) other += 1;
  }

  const accents = (text.match(new RegExp(FOREIGN_LETTERS, "gi")) ?? []).length;

  /**
   * Accents alone do not settle it: an English post can name Zoë or a café. A handful across a long
   * post is noise, a dozen is another language.
   */
  if (accents >= 8 && other > 0) {
    return { english: false, reason: `${accents} accented letters and ${other} foreign function words` };
  }

  if (other >= english) {
    return { english: false, reason: `${other} foreign function words against ${english} English` };
  }

  /**
   * A post can be mostly English and still not be an English post, so the English count has to be a
   * real presence rather than a majority of very few.
   */
  if (english < 5) {
    return { english: false, reason: `only ${english} English function words in ${words.length} words` };
  }

  return { english: true, reason: `${english} English function words against ${other}` };
}
