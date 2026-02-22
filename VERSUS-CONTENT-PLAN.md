# LinkedGrow Versus Pages Content Plan

> **Delete this file once all versus pages are completed.**

---

## SEO Strategy

- **Primary keyword:** `[competitor] alternative` (highest search volume since nobody knows LinkedGrow yet)
- **Secondary keywords:** `[competitor] vs`, `best [competitor] alternative`, `cheaper [competitor] alternative`
- **Slug pattern:** `/compare/[competitor]-alternative` (targets the primary keyword in URL)
- **Meta title:** `Best [Competitor] Alternative (2026) - Save XX% | LinkedGrow`
- **H1 on page:** `The Best [Competitor] Alternative in 2026`
- **Hub page:** `/compare` listing all alternative pages (internal linking hub)
- **Each page:** 1,500-2,500 words, unique content per competitor, never generic copypaste

---

## Versus Page Template (reusable structure)

Every versus page follows this exact section order. LinkedGrow must CLEARLY win every comparison.
No neutral "choose them if" garbage. LinkedGrow is better, period. Show it with data and features.

### 1. Hero Section
- H1: `The Best [Competitor] Alternative in 2026`
- Subtitle: One bold sentence making it clear LinkedGrow is the superior choice
- Two CTAs: "Try LinkedGrow Free" (primary) + "See Full Comparison" (scroll anchor)
- Trust badge: "Trusted by 179+ founders"

### 2. Quick Verdict Box
- Styled card with cyan/blue gradient border
- 2-3 sentences with the key takeaway: why LinkedGrow is the better choice
- Bold the killer stat (e.g., "80% cheaper", "unlimited vs 250 credits/mo")
- No wishy-washy "both are good" - LinkedGrow wins, state it clearly

### 3. Side-by-Side Comparison Table (responsive, matches pricing page design)

**Desktop (md+):** `grid grid-cols-3` table (Feature | [Competitor] | LinkedGrow)
- LinkedGrow column highlighted with `bg-cyan-50/30 dark:bg-cyan-900/5` (like popular plan)
- LinkedGrow column header with cyan gradient badge "RECOMMENDED"
- Emerald checkmarks for LinkedGrow features, slate minus/X for competitor gaps
- Features grouped by category with `bg-slate-50 dark:bg-slate-800/40` category headers
- Sticky header row with plan names + starting prices
- 15-20 features covering ALL differentiators

**Mobile (<md):** Tab selector switching between competitor view and LinkedGrow view
- Same tab design as pricing page: `rounded-xl bg-white border p-1`
- Active tab: `bg-linear-to-r from-cyan-500 to-blue-600 text-white`
- Feature cards grouped by category

**Feature categories to compare (every page):**
- Content Creation: AI post generation (unlimited vs capped), AI models (26 vs 1-2), voice training, hooks generator, content repurposing (YouTube, blogs, web pages, Reddit)
- Scheduling & Publishing: post scheduling, content calendar, direct LinkedIn publishing, first comment
- LinkedIn Integration: OAuth vs cookie-based auth, account safety, connection reliability
- Visual Content: AI image generation (14 models vs none/limited), carousel generator
- Analytics: post analytics, engagement metrics, advanced analytics
- AI Technology: BYOK model, number of AI providers (5 vs 1), model choice
- Pricing: starting price, AI cost included vs extra, generation limits

### 4. Why LinkedGrow Wins (3-5 detailed sections)

Each section is a H2 with a clear LinkedGrow advantage. Not "differences" - advantages.

Example sections:
- "Unlimited AI Generation with BYOK - No Credits, No Caps"
- "26 AI Models from 5 Providers vs [Competitor]'s Single Model"
- "AI Image Generation Built In - [Competitor] Doesn't Have It"
- "Save 80% - Same Features, Fraction of the Price"
- "Your API Keys, Your Data - No Vendor Lock-In"

Each section: 200-400 words, concrete data, bold key phrases, internal links to relevant LinkedGrow feature pages.

**WRITING STYLE RULES (apply to ALL versus pages):**
- Write like a human, not like AI. Use varied sentence lengths and natural paragraph flow.
- NEVER use short choppy sentences one after another. Build ideas across longer sentences that connect logically.
- Avoid generic AI filler phrases like "That is it." or "Let that sink in." or "Here is the thing."
- Each paragraph should be 3-6 sentences minimum. No one-sentence paragraphs except for emphasis.
- Use contractions naturally (you are -> you're is fine in descriptions, but avoid in structured data).
- Reference specific model names from the actual codebase (check `src/app/(dashboard)/dashboard/settings/ai-api/page.tsx`).
- Currently: 26 text models (5 providers), 14 image models (3 providers). Update if the settings page changes.
- Best image model = Nano Banana Pro (not "Imagen 4 Ultra"). Best text models = GPT-5.2, Claude Opus 4.6, Gemini 3 Pro.
- Never say "DALL-E" - the actual OpenAI image models are GPT Image 1.5, GPT Image 1, GPT Image 1 Mini.
- Cookie-based auth warning: Taplio is CONFIRMED to use cookie-based auth. Make this a prominent section.

### 5. Pricing Showdown

Visual pricing comparison card (side-by-side):
- Left card: [Competitor] pricing (all plans, muted/slate styling)
- Right card: LinkedGrow pricing (cyan gradient highlight, popular badge)
- Bottom row: "Total monthly cost" showing LinkedGrow $13 + ~$3 API = $16 vs competitor $XX
- Savings callout: "Save $XX/month by switching to LinkedGrow" in emerald badge

### 6. What [Competitor] is Missing

Bulleted list of LinkedGrow features the competitor simply doesn't have.
Each item: feature name + one sentence explaining why it matters.
Use emerald checkmarks for LinkedGrow, red X for competitor.
This section hammers home the feature gap.

### 7. FAQ Section (5-7 questions with FAQJsonLd)
- "What is the best [Competitor] alternative?"
- "Is LinkedGrow cheaper than [Competitor]?"
- "Can I switch from [Competitor] to LinkedGrow?"
- "Does LinkedGrow have all the features [Competitor] offers?"
- "Why is LinkedGrow's BYOK model better than [Competitor]'s built-in AI?"
- "How many AI models does LinkedGrow support vs [Competitor]?"

### 8. Final CTA Section
- Full-width gradient background (cyan-to-blue)
- H2: "Ready to Switch from [Competitor]?"
- Subtitle reinforcing the key advantage
- Big CTA button: "Start Free - No Credit Card Required"
- Below CTA: "Join 179+ founders already using LinkedGrow"

### Schema Markup (every page)
- `BreadcrumbJsonLd` (Home > Compare > Best [Competitor] Alternative)
- `FAQJsonLd` (from FAQ section)
- `SoftwareApplicationJsonLd` (LinkedGrow with starting price)

### Design Reference
- Match the responsive table from `src/app/pricing/pricing-content.tsx`
- Desktop: `grid grid-cols-3` with sticky headers, category rows, emerald/slate icons
- Mobile: Tab selector + category cards (same as pricing page mobile)
- Use the same Tailwind patterns: `rounded-2xl`, `border-slate-200`, `shadow-lg shadow-cyan-500/10`
- LinkedGrow column always visually highlighted (cyan background tint)
- Competitor column always muted (plain white/slate)

---

## Publishing Priority Order

Write in this exact order (highest search volume / closest competitors first):

### Priority 1 - Primary Direct Competitors

| # | Competitor | Slug | Primary Keyword | Meta Title | Verified Pricing (Feb 2026) | Key Angle |
|---|-----------|------|----------------|------------|----------------------------|-----------|
| 1 | **Taplio** | `/compare/taplio-alternative` | taplio alternative | Best Taplio Alternative (2026) - Save 80% \| LinkedGrow | Starter $39/mo (no AI), Standard $69/mo (250 AI credits), Pro $199/mo | BYOK unlimited AI at $13/mo vs $69/mo for 250 credits |
| 2 | **Supergrow** | `/compare/supergrow-alternative` | supergrow alternative | Best Supergrow Alternative (2026) - Unlimited AI \| LinkedGrow | Starter $19/mo, Pro $29/mo, Agency $49/mo | Same entry price but LinkedGrow = BYOK unlimited vs capped AI |
| 3 | **MagicPost** | `/compare/magicpost-alternative` | magicpost alternative | Best MagicPost Alternative (2026) - No AI Caps \| LinkedGrow | Starter $27/mo (30 posts), Creator $39/mo (unlimited) | BYOK unlimited at $13/mo vs $27/mo for 30 posts |
| 4 | **AuthoredUp** | `/compare/authoredup-alternative` | authoredup alternative | Best AuthoredUp Alternative (2026) - Full AI Suite \| LinkedGrow | Individual $19.95/mo, Business $14.95/profile/mo (min 3) | AuthoredUp = editor-only. LinkedGrow = AI generation + scheduling + analytics |
| 5 | **Kleo** | `/compare/kleo-alternative` | kleo alternative | Best Kleo Alternative (2026) - Save 87% \| LinkedGrow | Standard $99/mo ($999/year), Enterprise custom | LinkedGrow $13/mo vs Kleo $99/mo. BYOK unlimited 26 models vs single Claude model |

### Priority 2 - Strong Direct Competitors

| # | Competitor | Slug | Primary Keyword | Meta Title | Verified Pricing (Feb 2026) | Key Angle |
|---|-----------|------|----------------|------------|----------------------------|-----------|
| 6 | **EasyGen** | `/compare/easygen-alternative` | easygen alternative | Best EasyGen Alternative (2026) - 4x Cheaper \| LinkedGrow | Free (3 posts), Premium $59.99/mo | LinkedGrow $13/mo vs EasyGen $60/mo. 4x cheaper with more features |
| 7 | **ContentIn** | `/compare/contentin-alternative` | contentin alternative | Best ContentIn Alternative (2026) - Unlimited AI \| LinkedGrow | Free, Creator $29/mo (20 AI posts), Pro $49/mo | Similar pricing but LinkedGrow BYOK = unlimited AI + image generation |
| 8 | **RedactAI** | `/compare/redactai-alternative` | redactai alternative | Best RedactAI Alternative (2026) - Full Platform \| LinkedGrow | Free (4 posts), Essential ~$12/mo, Creator $24/mo, Copywriter $66/mo | RedactAI = AI generation only. LinkedGrow = complete platform |
| 9 | **Postdrips** | `/compare/postdrips-alternative` | postdrips alternative | Best Postdrips Alternative (2026) - More AI Models \| LinkedGrow | Starter $18/mo, Pro $29/mo | Similar pricing but LinkedGrow has AI image gen, 26 AI models, BYOK |

### Priority 3 - LinkedIn Adjacent Competitors

| # | Competitor | Slug | Primary Keyword | Meta Title | Verified Pricing (Feb 2026) | Key Angle |
|---|-----------|------|----------------|------------|----------------------------|-----------|
| 10 | **Typefully** | `/compare/typefully-alternative` | typefully alternative | Best Typefully Alternative (2026) - LinkedIn-First \| LinkedGrow | Free, Creator ~$15/mo, Team ~$39/mo | Typefully = X/Twitter first. LinkedGrow = LinkedIn-first with BYOK |
| 11 | **Socialsonic** | `/compare/socialsonic-alternative` | socialsonic alternative | Best Socialsonic Alternative (2026) - BYOK Model \| LinkedGrow | Pro $20/mo ($13.33 annual), Team/Agency coming soon | LinkedGrow has BYOK unlimited, more AI providers, free plan |

### Priority 4 - Multi-Platform Tools (high search volume)

| # | Competitor | Slug | Primary Keyword | Meta Title | Verified Pricing (Feb 2026) | Key Angle |
|---|-----------|------|----------------|------------|----------------------------|-----------|
| 12 | **Buffer** | `/compare/buffer-alternative` | buffer alternative linkedin | Best Buffer Alternative for LinkedIn (2026) \| LinkedGrow | Free (3 ch), Essentials $6/ch/mo, Team $12/ch/mo | Buffer = generic multi-platform. No BYOK, no AI images, no voice training, no carousel |
| 13 | **Hootsuite** | `/compare/hootsuite-alternative` | hootsuite alternative linkedin | Best Hootsuite Alternative for LinkedIn (2026) \| LinkedGrow | Professional $99/mo (annual), Team $249/mo (annual) | Hootsuite = 8x more expensive. LinkedGrow = LinkedIn-focused at $13/mo |

---

## MANDATORY: Data & Price Verification Before Writing Each Page

**CRITICAL RULE: Before writing ANY versus page, you MUST:**

1. **Visit the competitor's official pricing page** and verify EVERY price, plan name, and feature limit
2. **Visit the competitor's official features page** and verify platform type (web app, extension, mobile), analytics export capabilities, and all feature claims
3. **Cross-check every data point** in the comparison table against the competitor's actual website - never guess or use stale data
4. **If a feature is ambiguous** (e.g., competitor has both Chrome extension AND web dashboard), represent it accurately - never oversimplify to make the competitor look worse
5. **After writing**, re-read every competitor data point and ask: "Is this 100% accurate based on what I verified?"

Prices marked as verified above were confirmed from official sources in February 2026. Before writing any page, re-check the competitor's pricing page to ensure nothing changed.

**All verified (Feb 2026):**
- Taplio, Supergrow, MagicPost, AuthoredUp, Kleo, EasyGen, ContentIn, RedactAI, Postdrips, Typefully, Socialsonic, Buffer, Hootsuite

---

## LinkedGrow Pricing Reference (for all pages)

Always show yearly prices (billed yearly) - they look cheaper and more competitive.

| Plan | Price | AI Generation | Scheduling | Images |
|------|-------|--------------|------------|--------|
| **Free** | $0 | 3 posts/mo (BYOK) | 0 | 0 |
| **Starter** | $13/mo (billed yearly) | Unlimited (BYOK) | 10/mo | 0 |
| **Pro** | $27/mo (billed yearly) | Unlimited (BYOK) | Unlimited | Unlimited |
| **Business** | $55/mo (billed yearly) | Unlimited (BYOK) | Unlimited | Unlimited |

Never show the full yearly amount. Always display as "$X/mo billed yearly".

**BYOK = user pays AI provider directly (~$2-4/mo typical usage)**
**Total cost: $13 + $3 API = ~$16/mo vs competitors charging $39-199/mo**

---

## Notes

- **Aware** (useaware.co) shut down August 2025 - do NOT create a versus page
- **ContentCal** acquired by Adobe - no longer exists standalone
- NEVER link to competitor websites - no outbound links to competitors, zero, none
- When all 13 pages are done, delete this file

---

## After All 13 Pages Are Done

1. Delete this `VERSUS-CONTENT-PLAN.md` file
2. Ensure the `/compare` hub page links to all 13 versus pages
3. Update the blog article "Best LinkedIn AI Tools 2026" to link to relevant versus pages
4. Add "Compare" to the main navigation menu
5. Submit all new URLs to IndexNow
