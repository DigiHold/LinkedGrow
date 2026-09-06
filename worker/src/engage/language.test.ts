import { test } from "node:test";
import assert from "node:assert/strict";
import { readLanguage } from "./language.ts";

/** The exact post the first live run opened on 2026-09-06, which the agent must never answer. */
const FRENCH = `J'ai demandé à Claude de refaire mon profil LinkedIn. Résultat en 3 minutes.
Pas un prompt générique du style "améliore mon profil" : un vrai système, avec 3 sorties précises.
Un titre qui respecte la règle des 3 secondes (ce que vous faites, pour qui, quel résultat), fini le
titre de poste générique que personne ne lit. Une bannière alignée à votre activité, générée en
quelques secondes. Une section Infos réécrite comme une page de vente, pas comme un CV.
Ce que la plupart des gens paient 500 euros à un freelance, Claude le fait en 3 minutes.`;

const ENGLISH = `Could Block be the death of the AI SDR? I do not claim to be an expert on email
deliverability and spam, but I know a tiny bit. We send well over a million emails a week in our
newsletters, and when I used to run that other company I spent a huge amount of time worrying about
deliverability. And I wonder, and am worried, about what happens when the people receiving these
messages decide that blocking is easier than replying to any of them.`;

test("the French post that reached the first live run is refused", () => {
  const v = readLanguage(FRENCH);
  assert.equal(v.english, false, v.reason);
});

test("an English post passes", () => {
  const v = readLanguage(ENGLISH);
  assert.equal(v.english, true, v.reason);
});

test("German, Spanish and Dutch are refused", () => {
  const german = `Ich habe das Modell gebeten mein Profil neu zu schreiben und das Ergebnis ist
    nicht schlecht aber auch nicht so gut wie die Leute hier behaupten dass es sein wird.`;
  const spanish = `He pedido al modelo que reescriba mi perfil y el resultado no es malo pero
    tampoco es tan bueno como la gente dice que va a ser para todos los que lo usan.`;
  const dutch = `Ik heb het model gevraagd om mijn profiel opnieuw te schrijven en het resultaat is
    niet slecht maar ook niet zo goed als de mensen hier zeggen dat het zal zijn.`;
  for (const [name, text] of [["de", german], ["es", spanish], ["nl", dutch]] as const) {
    assert.equal(readLanguage(text).english, false, name);
  }
});

/** Guessing on a fragment is how an English comment lands under a German post. */
test("a post too short to judge is refused rather than guessed", () => {
  const v = readLanguage("Big news today for everyone here.");
  assert.equal(v.english, false);
  assert.match(v.reason, /too short/);
});

test("an English post naming a French company is not mistaken for French", () => {
  const text = `We spent the week at a conference in Paris and the café next to the venue had better
    coffee than anything I have had in the last year, which is not what I expected from a place
    that also sells sandwiches to about four hundred people every single morning.`;
  assert.equal(readLanguage(text).english, true, readLanguage(text).reason);
});
