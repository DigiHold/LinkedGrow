/**
 * Which pitch an article carries: leads or posting.
 *
 * What the article is about decides what every CTA on it offers. An article
 * on prospecting that ends with "write your next post" answers a question
 * nobody asked, and an article on hooks that pitches an outreach agent does
 * the same in reverse. Detection is on the words the piece already carries,
 * with `ctaPitch` on the registry entry as the manual override. One function
 * so the mid-article CTA, the magnet box and the exit popup can never
 * disagree about what kind of article they are sitting on.
 */

const LEAD_WORDS =
  /lead|prospect|outreach|client|customer|sales|b2b|pipeline|cold|dm|connection|network|invitation/i;

export type ArticlePitch = "leads" | "posting";

export function articlePitch(topic: string, override?: ArticlePitch): ArticlePitch {
  return override ?? (LEAD_WORDS.test(topic) ? "leads" : "posting");
}
