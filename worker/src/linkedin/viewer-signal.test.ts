import { test } from "node:test";
import assert from "node:assert/strict";
import { signalSentence } from "./sourcing.ts";
import { toViewer } from "./sources.ts";

/**
 * The profile-viewer path shipped two blanks to production on 2026-08-11: no
 * avatar and no signal sentence, while every other source carried both. The
 * sentence existed but the leads self-inserted and claimAll then skipped them
 * as duplicates, so it was never written. These lock the sentence and the
 * carrier the fix relies on.
 */
test("a profile viewer gets a real signal sentence, not a blank", () => {
  assert.equal(signalSentence("viewer", "People who viewed your profile"), "Viewed your profile");
});

test("every source kind the agent mines has a non-empty signal sentence", () => {
  for (const kind of ["comment", "reaction", "search", "question", "viewer", "own"]) {
    const sentence = signalSentence(`${kind}:whatever`, "Some Source");
    assert.ok(sentence && sentence.trim().length > 0, `${kind} produced an empty signal`);
  }
});

test("a viewer lead carries the avatar the caller attaches", () => {
  // toViewer builds the person; mineProfileViewers attaches the photo it climbed
  // for. The spread the fix uses must survive onto the lead.
  const base = toViewer({ href: "https://www.linkedin.com/in/jane/", text: "Jane Doe\n• 1st\nFounder, Acme" });
  assert.ok(base, "a named viewer row is a lead");
  const withPhoto = { ...base!, avatarUrl: "https://media.licdn.com/x.jpg" };
  assert.equal(withPhoto.avatarUrl, "https://media.licdn.com/x.jpg");
});
