# LinkedGrow v2 - Operating Manual

**This repo is v2 and v2 is a different product wearing the same name.** The category moved from "write LinkedIn posts" to "find leads and clients on LinkedIn, on autopilot". Agents discover an ICP, mine engagement, send connection requests and run DM sequences, every day, without the user touching it. The content half (generator, editor, calendar, carousels, hooks, ideas, analytics) is all kept and all still works, but it is a supporting feature and it never leads the pitch.

Two things about v2 that change almost every answer:

1. **There is no LinkedIn API.** Not for posting, not for reading. Everything happens in a real Chrome, signed in to the customer's own account, on an address reserved for that account, driven by a separate worker (`~/Documents/GitHub/linkedgrow-worker`, deployed to a VPS). The app queues work; the worker does it.
2. **AI is billed two different ways and they must never be mixed.** Anything the agents do runs on Nicolas's own `ANTHROPIC_API_KEY` inside the worker, under a per-agent daily cap and a per-account monthly cap. Anything the customer generates for a post runs on **the customer's own key** (BYOK), through `/api/ai/*` with `decryptApiKey`. A post generated on Nicolas's key is a direct loss on every customer.

`linkedgrow` (the other repo) is live v1 and keeps running untouched until cutover. Nothing here goes to production before Nicolas says so; see RULE ZERO in the v2 plan.

This file is the operating manual for working in this repo. Read the section that matches your task before touching anything. `SEO-GUIDE.md` holds the marketing-page design system; this file holds the hard rules and the known failure modes.

**How to resolve conflicts between sources, in order:**

1. Nicolas's explicit instruction in the current conversation
2. Nicolas's global operating manual (`~/.claude/CLAUDE.md`) and its memory files
3. This file
4. The specific guide for the deliverable (SEO-GUIDE.md, BLOG-ARTICLE-GUIDE.md, etc.)
5. The nearest existing code of the same type (copy its pattern exactly)

If two current sources genuinely contradict and the choice changes the outcome, ask. Otherwise pick by this ladder and note the choice.

---

## 1. Non-negotiables

These override everything else in this file.

1. **No backward compatibility code.** Early-stage product moving fast. No legacy field mappings, migration shims, "for old users" logic, commented-out code, or "deprecated" markers. Change things directly, delete dead code completely.
2. **LinkedGrow has NO free plan, and v2's trial takes a card.** Every signup gets a 7-day trial and **a payment card is required at signup**; at the end of day 7 the card is charged and the subscription begins. There is no flip to a usable free tier and no cardless trial. Copy says "7-day trial", "cancel any time before day 7". Copy never says "free plan", "starts free", or **"no credit card required"** - that last one was true of v1 and is now false, and a scan on 2026-07-25 found 298 occurrences of it across 139 files. Every one has to go before cutover. Comparison tables: LinkedGrow's free-plan cell is `"7-day trial"` with the trial-state icon, never a positive check.
3. **Security first.** Every new route, page, or feature passes the security bar in section 5 before commit. If you are unsure whether something is secure, assume it is not and add the protection.
4. **No em dashes anywhere** - not in code, not in copy, not in commits. Use a regular dash with spaces, or restructure the sentence.
5. **No fabricated facts.** No invented numbers, features, dates, stories, or capabilities in any external-facing text. If a fact is not in section 7 (reference data) or verifiable in the code, it does not go in the copy. A missing fact is a question for Nicolas, not a blank to fill.
6. **All prose goes through the anti-slop pipeline.** Invoke `no-slop` while drafting, `humanizer` after drafting, then the `prose-preflight` skill (programmatic scan) before showing anything to Nicolas. No deliverable prose ships without all three.
7. **No git attribution.** Never add Co-Authored-By, credits, or signatures of any kind to commits.
8. **TypeScript strict.** No `any`, no `@ts-ignore`, no console.log or TODO left in delivered code.

---

## 2. Tech stack and deployment

| Layer      | Choice                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16.1.x (App Router, Turbopack), React server components                                    |
| Language   | TypeScript 5.9, `strict: true`, path alias `@/*` -> `src/*`                                        |
| Styling    | Tailwind CSS v4 + shadcn/ui. **Gradient syntax is `bg-linear-to-r`, not `bg-gradient-to-r`**       |
| Auth       | NextAuth.js v5 beta, credentials + Google + LinkedIn OAuth, 2FA/TOTP, JWT sessions                 |
| Database   | Turso (LibSQL edge SQLite) + Drizzle ORM (schema file is types only, no migrations)                |
| Payments   | Stripe subscriptions                                                                               |
| Storage    | Cloudflare R2 (`linkedgrow-media` bucket)                                                          |
| Email      | Brevo (marketing + transactional)                                                                  |
| Scheduling | QStash (Upstash) for daily crons and blog scheduling. **Not for posts**: a scheduled post is a row the worker reads (section 3.11) |
| Hosting    | Vercel, auto-deploy from GitHub (SSH remote `git@github.com:DigiHold/LinkedGrow.git`)              |
| AI (posts) | BYOK: OpenAI, Anthropic, Google, Grok, Perplexity, Kimi (text); Google, OpenAI, Replicate (images) |
| AI (agents)| Nicolas's own Anthropic key, inside the worker, capped per agent and per account                   |
| LinkedIn   | **No API.** Real Chrome (Patchright) per account, on that account's own residential address        |
| Worker     | `DigiHold/linkedgrow-worker`, Node 24, systemd on the Netcup box, polls this same database         |

**Build gate:** `npx next build` is the only automated gate. There is no ESLint config and no typecheck script; do not assume lint runs anywhere. If the build passes, the code ships.

**Deployment: `staging` only, and this is the one rule with no exception.** `staging` -> https://staging.linkedgrow.ai, and every branch of v2 work goes there. `main` serves live v1 to paying customers and nothing from this repo reaches it until Nicolas triggers the cutover. This reverses the "default is main" rule that applies in the v1 repo; if you find yourself about to push v2 anywhere else, stop.

Vercel purges the whole CDN cache on every deploy; no manual cache clearing exists or is needed. The worker deploys separately: `git pull` in `/opt/linkedgrow/app` on the VPS, then `systemctl restart linkedgrow-worker`.

---

## 3. Codebase conventions

### 3.1 Marketing page anatomy

Every public marketing page is a folder with exactly two files:

- `page.tsx` - server component (no `"use client"`). Holds `export const metadata`, the FAQ data array, JSON-LD components, and renders the content component.
- `<slug>-content.tsx` - starts with `"use client"`, one named export, composed from `@/components/landing/*` blocks (`LandingHero`, `LandingPainPoints`, `LandingFeatures`, `LandingBYOK`, `LandingFAQ`, `LandingCTA`, `LandingRelatedContent`, `QuickAnswer`).

Copy a recent sibling of the same page type before writing (e.g. `src/app/for/agencies/`, `src/app/compare/taplio-alternative/`, `src/app/free-tools/linkedin-character-counter/`). The design system (exact Tailwind classes for typography, cards, CTAs, badges) is in **SEO-GUIDE.md** and is mandatory for every marketing page. Content shell root is always `<main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">` with `AnimatedBackground`, `Header`, `Footer`.

**FAQ pattern:** define the FAQ array once in `page.tsx`, pass it to BOTH `<FAQJsonLd questions={faqs}>` and the content component as a prop (the taplio-alternative pattern). Never write the array twice; duplicated arrays drift and the visible FAQ stops matching the schema.

**URL structure and where each page type gets registered:**

| Page type  | URL                      | Must also update                                                                                |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| Audience   | `/for/[segment]`         | `src/app/for/for-content.tsx` grid                                                              |
| Feature    | `/features/[feature]`    | header dropdown if nav-worthy                                                                   |
| Free tool  | `/free-tools/[tool]`     | `src/app/free-tools/page.tsx` tools array + Related Tools sections on ALL other free-tool pages |
| Use case   | `/use-cases/[case]`      | cluster links only                                                                              |
| Industry   | `/industries/[industry]` | `src/app/industries/industries-content.tsx` grid                                                |
| Comparison | `/compare/[slug]`        | `src/app/compare/compare-content.tsx` + `footer.tsx` `compareLinks` if top-6 worthy             |
| Blog       | `/blog/[slug]`           | `src/lib/blog.ts` `BLOG_POSTS` array                                                            |

### 3.2 Metadata, OG images, and schema (every public page)

Every page with `export const metadata` MUST include images in both `openGraph` and `twitter` sections. The `layout.tsx` default is not enough; social platforms read page-level tags. Default OG image (never remove it from `layout.tsx`, it is the site-wide fallback):

```
https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp  (1200x630)
```

Metadata shape (copy from `src/app/for/agencies/page.tsx`): `title` (keyword first, max 60 chars, ends "| LinkedGrow"), `description` (150-160 chars, primary keyword in first 20 words), `openGraph { title, description, url, siteName: "LinkedGrow", type, images: [{url, width: 1200, height: 630, alt}] }`, `twitter { card: "summary_large_image", title, description, images }`, `alternates: { canonical }`. Canonical and `openGraph.url` are the absolute `https://linkedgrow.ai/<path>`, hardcoded.

All JSON-LD components live in `src/components/seo/json-ld.tsx` and connect via `@id` references (`ORG_ID`, `WEBSITE_ID`, `SOFTWARE_ID`). `OrganizationJsonLd`, `WebsiteJsonLd`, and the global `SoftwareApplicationJsonLd` render once in `layout.tsx` - never re-add them per page.

| Page type                 | Required JSON-LD in page.tsx                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Feature page              | `BreadcrumbJsonLd` + `SoftwareApplicationJsonLd` (with props: custom name/url/offers) + `FAQJsonLd`              |
| Free tool                 | `BreadcrumbJsonLd` + `WebApplicationJsonLd` (price "0") + `FAQJsonLd`                                            |
| Comparison                | `BreadcrumbJsonLd` + `SoftwareApplicationJsonLd` + `FAQJsonLd` + `ItemListJsonLd` (alternatives list)            |
| Industry / use-case / for | `BreadcrumbJsonLd` + `FAQJsonLd`                                                                                 |
| Blog article              | `FAQJsonLd` in page.tsx; `BlogPostingJsonLd` + `BreadcrumbJsonLd` + `PersonJsonLd` come from `BlogArticleLayout` |
| Blog listing              | `BreadcrumbJsonLd` + `CollectionPageJsonLd`                                                                      |
| Legal                     | `BreadcrumbJsonLd` only                                                                                          |
| Auth / dashboard          | none (noindex / behind auth)                                                                                     |

Never add `aggregateRating` (no verified public reviews exist; Google penalizes fakes). No `SearchAction` in WebSite schema.

### 3.3 Caching

Cache headers live in the `headers()` function of `next.config.ts`. Section prefixes (`for/.*`, `features/.*`, `free-tools/.*`, `use-cases/.*`, `industries/.*`, `compare/.*`, `blog/.*`, `docs/.*`) are already covered by the public-page regex. **Only a new top-level route** (e.g. `/linkedin-something`) needs to be added to the alternation. Never add cache headers to `/dashboard/*` or `/api/*`.

| Resource                              | Cache                                                      |
| ------------------------------------- | ---------------------------------------------------------- |
| `/_next/static/*`                     | 1 year immutable (content-hashed)                          |
| `/images/*`                           | 30 days + 1 day stale-while-revalidate                     |
| root files (favicon, robots, sitemap) | 1 day + 12h SWR                                            |
| public pages                          | CDN 1h (`s-maxage=3600`) + 10 min SWR, browser `max-age=0` |
| dashboard / API                       | no cache headers, ever                                     |

### 3.4 Sitemap and indexing

`src/app/sitemap.ts` **auto-discovers** every static `page.tsx` by walking `src/app` (skips `api`, `_`-prefixed, `[dynamic]`, route groups). New static pages need no registration. Blog articles are the exception: they enter the sitemap only when their `blog_posts` DB row is `status='published'`. Exclusions and priorities are manual (`EXCLUDED_PATHS`, `PRIORITY_CONFIG`). `src/lib/public-pages.ts` duplicates the walk for the IndexNow cron. `robots.ts` explicitly allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.).

### 3.5 API route anatomy

House style, from real routes (`api/carousels/[id]`, `api/blog/comments`, `api/admin/users`, `api/cron/expire-trials`):

```ts
// Dynamic segments are Promises in Next 16 - always this shape:
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Ownership lives IN the WHERE clause, not in a separate check:
  const row = await db.select().from(savedCarousels)
    .where(and(eq(savedCarousels.id, id), eq(savedCarousels.userId, session.user.id)));
```

- Validation is **manual** (`if (!field || field.length > MAX) return 400`). Do not introduce zod; the only zod importer in the repo is `api/chat/route.ts`. Emails: `.toLowerCase().trim()` + format check. User URLs: parse with `new URL()` and validate hostname/protocol, never `.includes()`.
- Error shape is always `NextResponse.json({ error: "..." }, { status })`, body wrapped in try/catch returning 500.
- Admin gate: `if (!session?.user?.isAdmin) return 403`.
- Cron routes: QStash signature verification via `Receiver.verify()` on the `upstash-signature` header, with an admin-session fallback for manual runs. Not a bearer secret.
- Rate limiting: `src/lib/rate-limit.ts` exports `rateLimit(identifier, config)`, named configs in `AUTH_RATE_LIMITS`, `checkAIRateLimit(userId)` (30/min), and `getClientIP(request)`. Public endpoints key by IP; expensive authed operations key by user id. It is in-memory (single instance), good enough here.
- Plan gating server-side: fetch the user's plan, then `canAccessFeature(plan, "featureName")` from `src/lib/plans.ts`, return 403 with the feature name.
- AI routes: resolve the effective settings user via `getAISettingsUser(userId)` from `@/lib/team-utils` (team members use the owner's keys), and decrypt keys with `decryptApiKey` from `@/lib/encryption`.
- Public REST API (`/api/v1/*`): separate system in `src/lib/api-auth.ts` (`authenticateApiRequest`, SHA-256 hashed `lg_live_` keys, `{data|error, success}` envelope), Business plan only.

**Middleware is `src/proxy.ts`** (Next 16 renamed it; there is no `middleware.ts`, do not create one). It holds: the `/dashboard` auth redirect, the post-trial paywall (plan free + hasUsedTrial + no Stripe sub + no LTD -> redirect to `/dashboard/upgrade`, except `PAYWALL_ALLOWED_PREFIXES`), affiliate `?ref=` cookie, maintenance mode, and `publicApiPrefixes` - the allowlist of API prefixes reachable without a session. **A new public API route must be added to `publicApiPrefixes` or it 401s in production.** Conversely, never add an authenticated route's prefix to that list.

### 3.6 Dashboard pages

Gate every plan-restricted dashboard page with the `<FeatureGate feature="...">` wrapper from `src/components/dashboard/feature-gate.tsx` (or `FeatureGateInline` for sections). Never roll a custom upgrade card. FeatureGate is client-side convenience; the API route behind the feature still needs its own server-side `canAccessFeature` check - both, always.

`useSearchParams()` must be wrapped in `<Suspense>`: put the hook in an inner component, export a default that wraps it with a fallback (pattern: `src/app/(marketing)/checkout/success/page.tsx`). Forgetting this fails the build.

Theme: `next-themes`, every component ships `dark:` variants. Client components that read the theme guard with a `mounted` flag to avoid hydration mismatch. i18n: `next-intl` is wired but single-locale (`en` hardcoded in `src/i18n/request.ts`); marketing copy is hardcoded English, structured to be extractable later (rules in SEO-GUIDE.md).

### 3.7 Database (Turso)

**Never use drizzle-kit. There are no migrations.** The flow for any schema change:

1. Update `src/lib/db/schema.ts` (TypeScript types only, ~36 tables)
2. Apply directly: `turso db shell linkedgrow "ALTER TABLE t ADD COLUMN c TYPE DEFAULT v"`
3. Verify: `turso db shell linkedgrow "PRAGMA table_info(t)"`

Database name is `linkedgrow`. Additive changes (ADD COLUMN, CREATE TABLE) you may run directly. Anything destructive (DROP, DELETE, UPDATE without a tight WHERE, type changes requiring table rebuild) needs Nicolas's explicit go-ahead first.

Key `users` fields: `plan` (free/starter/pro/business), `isAdmin`, `isLifetimeDeal`, `hasUsedTrial`, `trialStartedAt/trialEndedAt`, `stripeCustomerId/stripeSubscriptionId`, `passwordChangedAt`, LinkedIn OAuth tokens + `linkedinProfileId`, per-provider AI keys and models (encrypted), voice settings (`samplePosts`, `businessDescription`, `targetAudience`, `writingTone`, `neverMention`), branding fields.

### 3.8 Blog system

`src/lib/blog.ts` is the single source of truth: `R2_URL` constant, `AUTHORS` (nicolas, maria), and the `BLOG_POSTS` array where every article is registered (slug, title, description, authorId, publishedAt, readingTime, category, featuredImage, featuredImageOg, featuredImageAlt, keywords, relatedSlugs, wordCount). Each article is hardcoded JSX in `src/app/blog/<slug>/page.tsx` wrapped in `<BlogArticleLayout>`, which enforces draft visibility (draft/scheduled 404s for non-admins) and emits the article schemas.

Publishing state lives in the `blog_posts` DB table (`draft | scheduled | published`). **No DB row = draft.** The article enters the sitemap only when published. Images: prompts in `public/images/blog/<slug>/image-prompts.json` (each 350-450 words, all 15 elements), generated by `node scripts/generate-blog-images.js <slug>` (Gemini -> AVIF/WebP -> R2 -> deletes local folder). Full procedure: ask Nicolas for the current blog workflow.

### 3.9 Docs system (`src/content/docs/`)

Markdown files power BOTH the public `/docs` pages AND the support chatbot's RAG embeddings (regenerated at build via `scripts/embed-docs.ts`). One source of truth: edit the `.md` files, never create separate chatbot content. Frontmatter: `title`, `description`, `category`, `order`; categories are folders with `_category.json`. Keep docs accurate - wrong docs mean wrong chatbot answers.

**The docs are written for v1 and most of them are wrong the day v2 ships.** Rewriting them is a blocking cutover item, not polish, because the chatbot answers from them. Anything describing OAuth, the Share API, QStash publishing, or "we never store your LinkedIn password" is false now; the last one was corrected on 2026-07-31 along with the publishing and scheduling articles. Analytics is no longer "waiting on the LinkedIn API": the worker reads the real numbers off the posts.

### 3.11 Publishing (there is no Share API)

The posting side runs through the worker. Read this before touching anything under `/dashboard/editor`, `/calendar`, `/generator`, `/repurpose` or `/posts`.

- **The `posts` table is the queue.** No separate queue table: it would hold a second copy of the status, the time, the URL and the error, and those disagree the first time a publish half fails. Extra columns: `linkedin_account_id`, `publish_attempts`, `publish_claimed_at`, `first_comment_posted_at`, `linkedin_scheduled_at`. Extra statuses: `queued` (Publish pressed) and `publishing` (a worker owns it).
- **`POST /api/linkedin/post` queues and returns.** A 200 means queued, never published. Screens use `queuePost`/`publishAndWatch` from `src/lib/publish-client.ts` and watch the post's own row. Never write "Published" from a 200.
- **A scheduled post is scheduled on LinkedIn.** Hours before the slot, during the account's own day, the worker writes it into the composer and uses LinkedIn's own Schedule control. LinkedIn publishes it. Nothing of ours is awake at 09:00. If the scheduler cannot be driven the post is **not** published early: it falls back to going out at its slot.
- **A scheduled post never comes back as `queued`.** Every failure path restores the status it had. Turning a post due tomorrow into one due now publishes it a day early, and that is the worst bug this side of the product can have.
- **Nothing is marked published without being read back** off the account's own feed. When it cannot be found, the post is still marked published with a note asking the user to check, because reposting on a doubt publishes twice.
- **Analytics are scraped, not fetched.** The worker reads impressions, reactions, comments and reposts off each post every few hours, and the follower count off the profile once a day. Never put a number on that page that LinkedIn did not show us, and never fall back to an industry average.

### 3.10 Code style

1. No em dashes (non-negotiable #4).
2. Contact email is only `contact@linkedgrow.ai`.
3. No inline styles, Tailwind exclusively.
4. Font weights via Tailwind classes (`font-medium`, `font-semibold`, ...). Fonts are Sora (display) + DM Sans (body) via `next/font/google`.
5. Catch-block style in routes: `return` directly under `} catch (error) {` (house quirk; match it).
6. No new dependencies without asking. The stack is deliberately small.
7. Match the nearest neighbor. Before writing a new file of any type, open the most recently shipped file of the same type and copy its structure, imports, and class strings exactly.

---

## 4. Named failure modes

These are the mistakes that have actually been made in this repo (each traced to a correction from Nicolas or a production incident) plus the traps a model discovering this codebase falls into. Scan the category that matches your task before starting.

### Product truth

| #   | Failure mode                                                                                                  | The rule that prevents it                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **The free-plan mirage** - describing `plan='free'` as a usable tier, or promising a cardless trial            | Non-negotiable #2. v2 takes a card at signup and charges it on day 7. "No credit card required" is v1 copy and is now false                                                                                                   |
| P2  | **Feature fiction** - describing a capability from imagination, in either direction                           | Read the code before writing about it. v2 genuinely does act on the account: it likes, it leaves the first comment, it invites and it messages. What it still does not do is Network/Team Notifications, which remain email-only nudges that link out |
| P3  | **Revenue cosplay** - implying MRR, profitability, or salaries                                                | LinkedGrow has no recurring-revenue claims. Bootstrapped, founders take no salary. Only section 7 numbers go in copy                                                                                                          |
| P4  | **Model-name drift** - listing AI models from memory                                                          | `src/app/(dashboard)/dashboard/settings/ai-api/page.tsx` is the source of truth. Read it every time                                                                                                                           |
| P5  | **Cost inflation, or billing the wrong key** - quoting BYOK ranges, or generating a post on our own key       | "$2-4/month", content side only. Agent AI is ours and included. `/api/ai/*` decrypts the customer's key; the worker uses `ANTHROPIC_API_KEY`. Never cross them                                                                |
| P6  | **Content-first copy** - opening with posts, repurposing or BYOK                                              | v2 leads with finding leads and clients on autopilot. Content is a supporting feature; BYOK is a footnote near the end                                                                                                        |
| P7  | **Biography drift** - "solo founder", "10 years on OceanWP", "1M+ sites", invented ages/dates/medical details | Nicolas + Maria, never "solo". OceanWP: created 2016, sold 2019, 500K sites. Personal-story facts come only from Nicolas directly; compute derived dates yourself; never escalate medical severity |

### Code

| #   | Failure mode                                                                             | The rule that prevents it                                                                                                                |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Creating `middleware.ts`**                                                             | Middleware is `src/proxy.ts` in Next 16. Edit it, never create middleware.ts                                                             |
| C2  | **The silent 401** - new public API route that works locally, 401s in prod               | Every unauthenticated route's prefix must be in `publicApiPrefixes` in `src/proxy.ts`. And never add an authed prefix to that list       |
| C3  | **IDOR by trust** - fetching a row by client-supplied id without ownership               | `eq(table.userId, session.user.id)` inside the WHERE of every read/update/delete on user data. No exceptions                             |
| C4  | **drizzle-kit reflex** - generating migrations                                           | Schema changes go through `turso db shell` (section 3.7)                                                                                 |
| C5  | **The zod import** - adding schema-validation libraries                                  | Validation is manual in this codebase. Match the style                                                                                   |
| C6  | **Naked useSearchParams** - build fails on Vercel                                        | Inner component + `<Suspense>` wrapper, always                                                                                           |
| C7  | **Tailwind v3 muscle memory** - `bg-gradient-to-r`                                       | Tailwind v4 syntax: `bg-linear-to-r`                                                                                                     |
| C8  | **Sync params** - `{ params }: { params: { id: string } }`                               | Next 16: params is a Promise. Type it as one and `await` it                                                                              |
| C9  | **Compat shims** - "keep the old field just in case"                                     | Non-negotiable #1. Change directly, delete completely                                                                                    |
| C10 | **OG-less metadata** - new page without page-level OG/Twitter images                     | Section 3.2. Every metadata export carries both image blocks, default URL if no custom image                                             |
| C11 | **Schema drift** - visible FAQ differs from FAQJsonLd                                    | One FAQ array in page.tsx, passed to both schema and content                                                                             |
| C12 | **Layout schema duplication** - re-adding Organization/Website/Software JSON-LD per page | They render once in layout.tsx. Page schemas reference them by `@id`                                                                     |
| C13 | **Client-only gating** - FeatureGate in the UI but the API route unguarded               | Both sides: FeatureGate wrapper AND server-side `canAccessFeature` in the route                                                          |
| C14 | **Cache headers on auth'd content**                                                      | Never on `/dashboard/*` or `/api/*`                                                                                                      |
| C15 | **Manual sitemap surgery** - registering new pages in sitemap.ts                         | The sitemap auto-walks src/app. Only blog articles need a published DB row                                                               |
| C16 | **Light-mode-only components** - missing `dark:` variants                                | Every visual class pairs with its dark variant. Copy the neighbor's class strings                                                        |
| C17 | **Session left alive after password change**                                             | Security-sensitive operations set `passwordChangedAt`; the JWT callback rejects older tokens                                             |
| C18 | **Rate-limit amnesia** - public or expensive endpoint without limiting                   | Public: IP-keyed `rateLimit()`. AI/expensive: `checkAIRateLimit(userId)`. Import from `@/lib/rate-limit`                                 |
| C19 | **Secret leakage** - keys/tokens/emails in responses or logs                             | Never return or log secrets. Public endpoints use gravatar hash, not raw emails                                                          |
| C20 | **Trusting a user URL** - fetching or redirecting to unparsed input                      | `new URL()` + hostname/protocol allowlist; block localhost and private IP ranges; `sanitizeCallbackUrl()` from `@/lib/url` for redirects |

### Content and process

| #   | Failure mode                                                                                              | The rule that prevents it                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | **Slop vocabulary** - "leverage", "seamless", "delve", "game-changer", "hits different", the whole family | Run the prose pipeline (non-negotiable #6). The banned lists live in the `no-slop` skill's `banned-vocabulary.md`    |
| W2  | **Staccato theater** - "Period.", "Wild.", fragment chains, "Not X. It's Y."                              | No sentence under 6 words in article prose; after a sub-8-word sentence the next is 15+ words. Programmatically enforced by `prose-preflight`                        |
| W3  | **The essay-transition opener** - "Here's the thing", "What gets me is", "The timing is wild"             | Lead with the substance (the fact, the name, the number), never with scaffolding that announces it                                                                   |
| W4  | **Opinion announcers** - "My take:", "Hot take:", "IMO:"                                                  | State the opinion directly                                                                                                                                           |
| W5  | **TL;DR label**                                                                                           | Banned everywhere. Use "At a glance", "Quick comparison", "The shortlist"                                                                                            |
| W6  | **Spelled-out numbers**                                                                                   | Numerals always: 15, $13, 10%, 2x                                                                                                                                    |
| W7  | **ALT-text bloat**                                                                                        | Every image ALT is 125 chars or fewer. Hero ALT = primary keyword + descriptor; other images get unique section-specific ALTs that do not repeat the primary keyword |
| W8  | **Orphan pages** - shipping a page without its cluster links                                              | SEO-GUIDE.md cluster map: link to ALL cluster siblings, then edit each sibling to link back. The backlink pass is the step most often skipped; it is not optional    |
| W9  | **Hub amnesia** - new free tool or compare page missing from its index                                    | Registration matrix in 3.1. Free tools also update Related Tools on every other free-tool page and the footer                                                        |
| W10 | **Stat stuffing** - "According to..." every paragraph                                                     | Blog: max 3-4 statistics total. Pages: 2-3. Reddit: 3 numbers hard cap, default zero                                                                                 |
| W11 | **Punctuation inside quotes**                                                                             | Commas and periods go AFTER the closing quote                                                                                                                        |
| W12 | **Content-plan archaeology** - marking entries `[LIVE]`                                                   | Remove completed entries from the content plan files entirely (memory rule overrides the older guide)                                                                |
| W13 | **Cannibalization** - writing a page/article that already exists                                          | Before any content job: `curl -s https://linkedgrow.ai/sitemap.xml`, check `blog.ts` slugs, check both content plans in the OpenClaw repo                            |
| W14 | **Discount-first emails**                                                                                 | Never offer a discount in the first email of a sequence; save it for the final one                                                                                   |
| W15 | **Competitor linking** - external links to Taplio, AuthoredUp, etc.                                       | 1-2 external links per article, verified neutral sources only, `target="_blank" rel="noopener noreferrer"`                                                           |

---

## 5. Quality bars

Each bar is a checklist. An item you cannot check is a fail, not a "probably fine". Claim done only after every box is verifiable, and say which checks you ran.

### 5.1 New or modified API route

- [ ] `await auth()` present, or the route is deliberately public AND its prefix added to `publicApiPrefixes` in `src/proxy.ts`
- [ ] Dynamic params typed `Promise<{...}>` and awaited
- [ ] Every query touching user data has ownership in the WHERE clause
- [ ] Plan-gated feature checked server-side with `canAccessFeature`
- [ ] Admin route checks `session.user.isAdmin`
- [ ] Public endpoint: IP rate limit. AI/expensive endpoint: per-user rate limit
- [ ] Every input validated: presence, type, max length; emails normalized; URLs parsed with `new URL()` and hostname-checked (SSRF: block localhost, 10.x, 172.16-31.x, 192.168.x)
- [ ] No secrets in any response or log line
- [ ] Password/2FA changes set `passwordChangedAt`
- [ ] Errors return `{ error }` with correct status; try/catch wraps the body
- [ ] `node .claude/skills/route-security-gate/verify-route.js <route.ts>` exits 0 (automates half this bar; the printed MANUAL list is the other half)
- [ ] `npx next build` passes

### 5.2 New marketing page

- [ ] `page.tsx` + `<slug>-content.tsx` split; classes copied from the newest sibling of the same type
- [ ] Metadata complete per 3.2 (title <= 60 chars keyword-first, description 150-160 chars, canonical, OG + Twitter images)
- [ ] JSON-LD per the 3.2 table; FAQ array defined once, feeds schema and UI
- [ ] QuickAnswer block right after the hero, answer 40-60 words
- [ ] Word count: feature/audience/use-case/industry >= 1,500; comparison >= 2,000; free tool >= 800 surrounding
- [ ] Exactly 5 FAQ questions, natural-language, primary keyword in at least 2
- [ ] One h1 with the primary keyword; section h2s phrased as questions; first paragraph states "LinkedGrow is [category] for [audience]"
- [ ] "LinkedGrow" appears 5-8 times, at least twice adjacent to the primary keyword
- [ ] > = 5 internal links + every cluster sibling linked (SEO-GUIDE cluster map); reciprocal links added back from each sibling
- [ ] Registered in its hub/index per the 3.1 matrix (plus footer/Related Tools for compare/free-tool)
- [ ] New top-level route added to the cache regex in `next.config.ts` (skip if under an existing section prefix)
- [ ] Every ALT <= 125 chars; max 2-3 statistics; no em dashes; numerals only
- [ ] Prose pipeline ran (no-slop, humanizer, prose-preflight)
- [ ] `node .claude/skills/ship-public-page/verify-page.js <page-dir>` exits 0 and its MANUAL list was walked through
- [ ] `npx next build` passes; entry removed from PAGE-CONTENT-PLAN.md after deploy

### 5.3 New blog article

- [ ] Registered in `BLOG_POSTS` in `src/lib/blog.ts` with all fields including `relatedSlugs` and `wordCount`
- [ ] > = 2,500 words; intro 300-400 words; 4-5 question-form h2 sections; QuickAnswer 40-60 words
- [ ] Exactly 5 FAQ questions, answers 40-60 words each, wired to `FAQJsonLd`
- [ ] > = 5 internal links; 1-2 external links (never competitors); `<strong>` on 10-15 key phrases; max 3-4 statistics
- [ ] No `keywords` meta tag on articles
- [ ] `image-prompts.json` prompts 350-450 words each with all 15 elements; images generated via `scripts/generate-blog-images.js`; featured filename is never `featured.avif`
- [ ] Every ALT <= 125 chars
- [ ] 1-line internal-link edits added to 1-2 related existing articles (cross-link pass)
- [ ] Prose pipeline ran; no sentence under 6 words; after a sub-8-word sentence the next is 15+
- [ ] `npx next build` passes; article stays draft until a `blog_posts` row publishes it

### 5.4 New dashboard feature

- [ ] Page wrapped in `<FeatureGate feature="...">`, no custom upgrade card
- [ ] Backing API route passes the 5.1 bar including its own plan check
- [ ] Dark mode variants on every element; `useSearchParams` under Suspense
- [ ] No console.log, no TODO, no `any`
- [ ] `npx next build` passes and the flow was exercised, not just compiled

### 5.5 Database change

- [ ] `schema.ts` updated AND the same change applied via `turso db shell linkedgrow "..."`
- [ ] `PRAGMA table_info(...)` output confirms the change
- [ ] Destructive statements (DROP, DELETE, UPDATE without tight WHERE, table rebuilds) were approved by Nicolas first
- [ ] If trial fields changed in bulk: run the Brevo backfill (`/api/admin/backfill-free-users`)

### 5.6 Any prose deliverable

- [ ] `no-slop` invoked before drafting, `humanizer` after, `prose-preflight` skill passed with exit code 0
- [ ] Platform caps respected: LinkedIn post <= 1,200 chars; first comment <= 140 chars, sentences >= 8 words, no bullets, no colon-openers; Reddit <= 280 words with <= 3 numbers; DM 50-100 words; newsletter 500-800 words; Facebook version 250-500 chars
- [ ] Every factual claim traced to a verified source (section 7, verified stories, or the code)
- [ ] Zero em dashes, zero banned words/phrases, numerals only, punctuation outside quotes
- [ ] Platform guide's own checklist ran last (it always wins over generic prose rules on format)

### 5.7 Commit and deploy

- [ ] Message follows house format: lowercase prefix (`seo:`, `feat:`, `fix:`, `docs:`, `chore:`); SEO commits carry keyword metadata, e.g. `seo: new blog article - Title (KW: keyword, vol 880, KD 0)`
- [ ] No attribution lines of any kind
- [ ] `npx next build` passed locally before push
- [ ] Pushed to `main` by default; `staging` only if Nicolas chose it
- [ ] Nothing gitignored got committed (.claude/, generate-blog-images.js, .env\*)

---

## 6. Escalation rules

**Stop and ask Nicolas before acting when any of these is true:**

1. The change touches pricing, plan limits, trial mechanics, Stripe products/webhooks, or the paywall logic - in code OR in copy. Any number that differs from `src/lib/plans.ts` or section 7 is a stop.
2. A public-facing claim (number, date, story detail, feature capability) has no verified source. Do not approximate, do not average, do not "roughly". Ask, or ship the text without the claim.
3. A DB statement is destructive (section 5.5), or any operation deletes user data, R2 objects, or Brevo contacts.
4. The task requires a new dependency, a new external service, or an architecture change (new table, new auth flow, new queue).
5. Auth, session, 2FA, password, or encryption code needs modification beyond an additive route.
6. Two current instruction sources contradict each other and the outcome differs (after applying the precedence ladder at the top of this file).
7. A security bar item cannot be satisfied as specified (e.g. no sensible rate-limit key exists). Add the strictest protection you can, then flag it.
8. Content-plan ambiguity: two candidate keywords overlap or a new piece risks cannibalizing an existing URL.
9. You are about to send anything external (email, API POST to a third party, publishing a post) that was not explicitly requested in this conversation.

**Proceed without asking when:** the action is reversible, matches an existing pattern in the repo, is covered by a guide checklist, or is the obvious reading of the request. Escalating "should I use the same button style as the other pages?" wastes Nicolas's time; the answer is always yes, copy the neighbor.

**When a fact is missing mid-draft:** write the rest, mark the gap explicitly as `[NEEDS FACT: ...]` in the draft you show Nicolas, and list the open questions at the end. Never fill the gap with a plausible invention - that failure mode has burned this project multiple times (fabricated stats incident, 2026-05-11).

## 7. Business logic reference

### 7.1 Trial lifecycle (the critical model)

**Decided for v2, and it replaces the v1 mechanics below wherever they disagree:** the 7-day trial stays, a payment card is required at signup, and the card is charged automatically at the end of day 7. A trial converts by default rather than by hope. On a failed payment the customer has 2 days to fix it; after that the agents are **paused, never deleted**, which stops the LinkedIn activity and therefore our cost while the leads, sequences and history stay intact. Say the deadline plainly, with the exact date.

The code still implements the v1 flow, so this is the gap to close before cutover:

1. **Signup** creates `plan='pro'`, `trialStartedAt=now`, `trialEndedAt=now+7d`, `hasUsedTrial=false`. Brevo Welcome automation (#9) runs the in-trial nurture.
2. **Day 7**: daily `expire-trials` cron flips to `plan='free'`, `hasUsedTrial=true`. Middleware paywall engages. **v2: charge the card instead, and pause the agents only if it fails.**
3. **Day 55**: `inactive-accounts` cron adds never-connected-LinkedIn accounts to Brevo list #28; "deletion in 5 days" email.
4. **Day 60**: same cron deletes via `deleteUserData()` with a paranoid re-check (no LinkedIn profile, plan free, no Stripe, no LTD, not admin). Brevo contact survives deletion.

The paywall condition itself lives in `src/proxy.ts` and is copied, deliberately, into the worker's due-posts query. Change one and you change both, or a cancelled account keeps publishing.

**Anti-abuse fingerprint:** the first account per LinkedIn identity is never flagged; a later account reusing it gets `hasUsedTrial=true` + `plan='free'` immediately. v1 checked this in the OAuth callback, which no longer exists, so in v2 it belongs on the connect-an-account path.

### 7.2 Pricing

**v2 prices, decided (plan section 9). Two paid plans, no Starter, no lifetime deal.**

| Plan            | Monthly | What it is                                        |
| --------------- | ------- | ------------------------------------------------- |
| Trial (7 days)  | $0, card required at signup | Charged automatically at the end of day 7 |
| Pro             | $99/mo  | One person running agents                         |
| Business        | $179/mo | A team running agents: seats, routing, shared inbox, CRM sync |
| Extra agent     | $49/mo  | Available on both plans, bought from the upsell modal |

`src/lib/plans.ts` still holds the v1 tiers ($19/$39/$79) because production still sells them. **Read it before writing any feature-availability copy, and never assume the file and this table agree yet.** The Stripe products are recreated at cutover; the old ones are archived, never deleted, and existing subscribers keep what they bought.

Open question, do not guess: the plan contradicts itself on how many agents each tier includes (section 9 says Pro 2 / Business 3 in prose and Pro 1 / Business 2 in the table). Ask Nicolas rather than picking one.

### 7.3 Marketing numbers (the only approved external claims)

- "179+ founders" trusted-by count
- Voice training accepts max 5 sample posts (not "5-10")
- Language support is never tied to BYOK; all AI speaks all languages, UI is English-only
- **"$2-4/month" BYOK AI cost applies to the content side only.** Agent AI is included in the price and runs on our key, so it is never quoted as a customer cost.
- **Dead as of v2, never write them again:** "no credit card required", the 30%-off early-adopter discount, the "96% less than competitors" line (it was built on $19 + $2 API vs $49 and none of those numbers survive), and the post-trial 3-cycle residual.

### 7.4 Brevo

Lists in active use: #9 Welcome (signup nurture), #28 Inactive Warning (Day 55), #16/17/18/23 paid lists (Starter/Pro/Business/LTD, moved by `syncBrevoOnSubscription` from the Stripe webhook). Lists #26/27/29 are no longer populated. Real-time hooks live in `src/lib/newsletter.ts`. Custom attributes: SIGNUP_DATE, TRIAL_STARTED_DATE, TRIAL_ENDS_DATE, LINKEDIN_CONNECTED, AI_KEY_ADDED, POSTS_CREATED, POSTS_PUBLISHED, LAST_POST_DATE. Backfill endpoint `/api/admin/backfill-free-users` (attributes only, never touches lists, skips paying/LTD, idempotent).

### 7.5 How LinkedIn is reached (there is no API)

v2 uses none of LinkedIn's API products, deliberately: the moment LinkedGrow becomes visible the app gets revoked, and doing this migration twice under pressure with paying customers watching is the outcome being avoided.

Instead: one persistent Chrome profile per connected account, launched headful under Xvfb by the worker, signed in with the email and password the customer gave us (encrypted at rest), going out through a residential address reserved for that one account. Every action moves at a human pace, through the same mouse and keyboard model, and no two agents on one account are ever signed in at the same time.

What this changes for copy: the product **does** act on the user's behalf now. It likes, it comments the first comment, it sends invitations and messages. Say so plainly. What v1 could not do and v2 can is not a detail to leave stale in the docs.

Selector maintenance is the standing cost of this choice. LinkedIn changes its interface, and when it does, publishing or mining stops until a selector is fixed. Plan for it rather than discovering it.

### 7.6 AI models (BYOK)

Source of truth: `src/app/(dashboard)/dashboard/settings/ai-api/page.tsx`. Read it before naming models anywhere. As of March 2026: text = OpenAI (GPT-5.2/5/Nano, o4-mini, o3, o3-mini), Anthropic (Opus 4.7/4.6/4.5, Sonnet 4.6/4.5/4, Haiku 4.5), Google (Gemini 3 Pro/Flash, 2.5 Pro/Flash/Flash Lite), Grok (4, 4.1 Fast, Code Fast, 3), Perplexity (Sonar family), Kimi (K2.5, K2). Images = Google (Nano Banana Pro, Nano Banana, Imagen 4 family), OpenAI (GPT Image 1.5/1/1 Mini), Replicate (FLUX.2 + FLUX 1.1 families).

---

## 8. Environment and structure reference

### Env vars

```env
NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_APP_NAME
AUTH_SECRET / AUTH_URL
TURSO_DATABASE_URL / TURSO_AUTH_TOKEN
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_{STARTER,PRO,BUSINESS}_PRICE_ID (+ _YEARLY variants)
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET   (Google sign-in and sign-up)
R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME
BREVO_API_KEY
QSTASH_TOKEN / QSTASH_CURRENT_SIGNING_KEY / QSTASH_NEXT_SIGNING_KEY
CRON_SECRET (legacy fallback)
NEXT_PUBLIC_GTM_ID
ENCRYPTION_KEY            LinkedIn passwords, TOTP secrets, BYOK keys, proxy credentials
ANTHROPIC_API_KEY         wizard website analysis only. Agent AI lives in the worker
```

The worker has its own environment file on the VPS (`/opt/linkedgrow/worker.env`) and nothing
propagates between the two. `ENCRYPTION_KEY` must be identical in both, and at cutover it must be
the key production already uses: a new one makes every stored LinkedIn password, 2FA secret and
BYOK key permanently unreadable. That is the one line of the migration with no recovery path.
`PROXY_SELLER_API_KEY` belongs on the VPS only, never on Vercel.

### Key paths

```
src/app/(auth)/              sign-in, sign-up, forgot-password (noindex)
src/app/(dashboard)/dashboard/  all app pages (generator, editor, calendar, hooks, carousel,
                             ideas, reddit, posts, analytics, ab-testing, team,
                             network-notifications, settings/{ai-api,api,branding}, upgrade)
src/app/api/                 routes (auth, ai, posts, linkedin, stripe, media, team, keys,
                             v1, cron, admin, blog, reddit, waitlist, geo, indexnow)
src/app/{for,features,free-tools,use-cases,industries,compare,blog,docs}/  public pages
src/components/{landing,marketing,dashboard,blog,seo,ui}/
src/lib/                     auth.ts, plans.ts, blog.ts, rate-limit.ts, api-auth.ts,
                             newsletter.ts, encryption.ts, team-utils.ts, url.ts,
                             db/{index,schema}.ts, storage/r2.ts
src/proxy.ts                 middleware (auth, paywall, publicApiPrefixes)
src/lib/publish-client.ts    queue a post, then watch its row. Every publish button uses this
src/lib/best-time.ts         best posting time from the user's own measured posts, or nothing
src/content/docs/            docs markdown = website + chatbot RAG
scripts/                     generate-blog-images.js (gitignored), gsc/weekly.js,
                             embed-docs.ts, aeo-*-batch.js
```

The worker is a separate repo, `~/Documents/GitHub/linkedgrow-worker`:

```
src/worker.ts                three loops: agents (5 min), publishing (1 min), insights (30 min)
src/linkedin/publish.ts      the composer: type, attach, schedule or post, read it back, comment, like
src/linkedin/insights.ts     reads a post's numbers and the profile's follower count
src/publish/{store,pass}.ts  the queue over the posts table, and the loop that drains it
src/insights/{store,pass}.ts what is stale, and the session that refreshes it
src/browser/{driver,human,fingerprint}.ts   Chrome per account, the persona's mouse and keyboard
src/safety/                  slots, address lock, watchdog, warm-up envelope, test allowlist
```

### Founders

Nicolas Lecocq (founder/developer, 16+ years web dev, created OceanWP 2016, sold 2019) and Maria Lecocq (operations & community). Husband and wife, based in Paris. Never "solo".
