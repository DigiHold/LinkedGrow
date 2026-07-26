import { test } from "node:test";
import assert from "node:assert/strict";
import type { AgentContext } from "../config.ts";
import { pickAngle } from "./generate.ts";

// pickAngle is pure (no model call), so the angle routing is locked here without touching the API.
// pickAngle reads ctx.cfg, so the fixture is the agent wrapping that config.
const ctx = {
  cfg: {
    product: {
    name: "Amabrik",
    senderName: "Maria Lecocq",
    valueProps: [
      "website security scan: find the vulnerabilities on your site before attackers do",
      "AI visibility / AEO scan: whether your brand is cited by AI search engines",
      "GDPR and worldwide cookie consent: stay compliant in every region",
      "booking, forms, popups, chat and other widgets: a secondary plus, not the lead",
    ],
    },
  },
} as unknown as AgentContext;

function p(headline: string, source = "reaction:test") {
  return { firstName: "X", fullName: "X Y", headline, source };
}

test("routes a security role to the security scan angle", () => {
  assert.match(pickAngle(ctx, p("CISO and application security lead")), /security scan/);
  assert.match(pickAngle(ctx, p("DevSecOps engineer, hunting vulnerabilities")), /security scan/);
});

test("routes a privacy or compliance role to the GDPR angle", () => {
  assert.match(pickAngle(ctx, p("Data Protection Officer, GDPR and privacy")), /GDPR/);
  assert.match(pickAngle(ctx, p("Cookie consent and compliance consultant")), /GDPR/);
});

test("routes a marketing or SEO role to the AI visibility angle", () => {
  assert.match(pickAngle(ctx, p("Head of Growth and content marketing")), /AI visibility/);
  assert.match(pickAngle(ctx, p("SEO lead focused on AI search and brand")), /AI visibility/);
});

test("falls back to the first core angle when nothing matches", () => {
  assert.equal(pickAngle(ctx, p("Founder and generalist")), ctx.cfg.product.valueProps[0]);
});

test("never selects the secondary widgets line as an angle", () => {
  const roles = ["Founder", "Head of Security", "GDPR consultant", "SEO lead", "Operations manager"];
  for (const r of roles) {
    assert.doesNotMatch(pickAngle(ctx, p(r)), /secondary plus/);
  }
});
