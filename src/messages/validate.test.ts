import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMessage, validateComment, type ValidateContext } from "./validate.ts";

const POST = "We just shipped a new GDPR cookie banner that blocks trackers by default.";

test("clean comment passes", () => {
  const c = "Curious how you handle the sites that break when consent gating kicks in. I hit that a lot with strict setups and never found a clean fix.";
  const r = validateComment(c, { postText: POST });
  assert.equal(r.ok, true, r.reasons.join("; "));
});

test("comment that parrots the post fails", () => {
  const c = "Love that you shipped a new GDPR cookie banner that blocks trackers by default. Nice work here.";
  const r = validateComment(c, { postText: POST });
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("echoes the post")));
});

test("slop comment fails", () => {
  const c = "This is a total game-changer and the insights are seamless. Amazing stuff here today.";
  assert.equal(validateComment(c, { postText: POST }).ok, false);
});

test("colon mid-sentence fails (no human writes that)", () => {
  const c = "We made a shared doc where anyone adds one line about their tool and who owns it. Took five minutes and cut duplicate work.";
  assert.equal(validateComment(c, { postText: POST }).ok, true, "control should pass");
  const withColon = "We made a shared doc where anyone adds one line: what it does and who owns it. Took five minutes.";
  const r = validateComment(withColon, { postText: POST });
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("colon")));
});

test("semicolon fails", () => {
  const c = "We keep a shared doc for internal tools; it saved us from building the same thing twice this year.";
  assert.ok(validateComment(c, { postText: POST }).reasons.some((x) => x.includes("semicolon")));
});

test("two short choppy sentences in a row fails (staccato)", () => {
  const staccato = "The stop button only kills the display. It doesn't touch the backend job. Closing the tab has worked better for me than mashing that button over and over.";
  assert.ok(validateComment(staccato, { postText: POST }).reasons.some((x) => x.includes("staccato")));
  const flowing = "From what I have seen the stop button only hides the output while the model keeps running on the server, so closing the tab works better than mashing it.";
  assert.equal(validateComment(flowing, { postText: POST }).ok, true);
});

const ctx: ValidateContext = {
  senderName: "Maria Lecocq",
  headline: "VP of Marketing at Cloudstack scaling B2B growth",
};

const clean =
  "Hey Alex,\nyou post a lot about AI search, and I keep wondering whether your own site actually gets cited by those tools yet. I built something that checks exactly that in a few seconds. Happy to show you if you are curious.\nBest,\nMaria Lecocq";

test("clean message passes", () => {
  const r = validateMessage(clean, ctx);
  assert.equal(r.ok, true, r.reasons.join("; "));
});

test("rejects unresolved placeholder", () => {
  const msg = "Hey [firstname], you post a lot about AI search and I built a checker for exactly that today. Best, Maria Lecocq";
  assert.equal(validateMessage(msg, ctx).ok, false);
});

test("rejects em dash", () => {
  const msg = "Hey Alex, you post about AI search — I built a checker for exactly that and would show you. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("dash")));
});

test("rejects banned word", () => {
  const msg = "Hey Alex, I think we could leverage your audience and I built a checker for AI search you might like. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("leverage")));
});

test("rejects generic slop opener", () => {
  const msg = "I saw your comment on that post and wanted to connect because I built a checker for AI search you might like. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("generic opener")));
});

test("rejects headline dump", () => {
  const msg = "Hey Alex, since you are VP of Marketing at Cloudstack scaling B2B growth, I built a checker for AI search you might like. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("headline")));
});

test("rejects missing sign-off", () => {
  const msg = "Hey Alex, you post a lot about AI search, and I built something that checks whether your site gets cited by those tools. Happy to show you.";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("sign-off")));
});

test("rejects too long", () => {
  const filler = "and I keep thinking about your site and its content and what could be improved here ".repeat(8);
  const msg = `Hey Alex, ${filler} so anyway that is the idea. Best, Maria Lecocq`;
  assert.equal(validateMessage(msg, ctx).ok, false);
});
