# LinkedGrow - AI-Powered LinkedIn Content Platform

> **CRITICAL: NO BACKWARD COMPATIBILITY CODE**
>
> LinkedGrow is pre-launch with ZERO users. Never add backward compatibility code, legacy field mappings, migration shims, or "for old users" logic. If something needs to change, change it directly. Delete unused code completely - no commented code, no "deprecated" markers, no fallbacks.

> **CRITICAL: SECURITY-FIRST DEVELOPMENT**
>
> Every piece of code you write MUST be evaluated for security vulnerabilities BEFORE committing. This is non-negotiable. For EVERY new route, page, or feature, run through this checklist:
>
> **Authentication & Authorization:**
> - Does this route require authentication? If yes, verify `await auth()` is checked AND the middleware covers it
> - Does this route access user-specific data? Verify ownership check (IDOR prevention) - never trust IDs from the client without checking they belong to the authenticated user
> - For admin routes, verify `session.user.isAdmin` is checked
>
> **Input Validation:**
> - ALL user input MUST be validated: type, length, format, allowed values
> - Email inputs: normalize with `.toLowerCase().trim()`, validate format
> - String inputs: enforce max length to prevent DB bloat and DoS
> - URLs from users: ALWAYS parse with `new URL()` and validate hostname/protocol - NEVER use `.includes()` for URL validation
> - File uploads: validate type against allowlist, enforce size limits, re-encode images
> - Passwords: min 8 chars, max 128 chars, require uppercase + number
>
> **Rate Limiting:**
> - ALL public endpoints (no auth required) MUST have IP-based rate limiting
> - ALL expensive operations (AI generation, file upload, email sending) MUST have per-user rate limiting
> - Import from `@/lib/rate-limit` and use appropriate limits
>
> **Redirect & URL Safety:**
> - NEVER redirect to a URL from user input without validation
> - Use `sanitizeCallbackUrl()` from `@/lib/url` for any callback/redirect URLs
> - NEVER use `router.push(userInput)` without sanitization
>
> **Data Exposure:**
> - NEVER return sensitive data in API responses (passwords, API keys, tokens, secrets)
> - NEVER log sensitive data (passwords, tokens, full API keys)
> - Use gravatar hash instead of raw emails in public endpoints
>
> **Session Security:**
> - Any security-sensitive operation (password change, 2FA disable) MUST set `passwordChangedAt` to invalidate existing sessions
> - The JWT callback in `auth.ts` rejects tokens issued before `passwordChangedAt`
>
> **SSRF Prevention:**
> - When the server fetches a URL provided by the user, validate the hostname against an allowlist
> - Block localhost, private IPs (10.x, 172.16-31.x, 192.168.x), and internal domains
>
> If you're unsure whether something is secure, assume it's NOT and add the protection. False positives are better than vulnerabilities.

## Project Overview

LinkedGrow is a SaaS platform that helps users create, schedule, and optimize LinkedIn content using AI. The key differentiator is the **BYOK (Bring Your Own Key)** model - users connect their own AI API keys (OpenAI, Anthropic, Google, etc.) for unlimited generations without monthly caps.

**Website:** https://linkedgrow.ai
**Status:** Pre-launch (collecting waitlist emails)

## Tech Stack

-   **Framework:** Next.js 16.1.1 (App Router, Turbopack)
-   **Language:** TypeScript 5.9.3
-   **Styling:** Tailwind CSS 4.1.8 + shadcn/ui components
-   **Authentication:** NextAuth.js v5 (beta) with Credentials Provider + 2FA/TOTP
-   **Database:** Turso (LibSQL edge SQLite) + Drizzle ORM (schema only, no migrations)
-   **Payments:** Stripe (subscriptions)
-   **File Storage:** Cloudflare R2 (S3-compatible)
-   **Email:** Brevo (marketing + transactional)
-   **Hosting:** Vercel
-   **Scheduling:** QStash (Upstash) for exact-time post publishing
-   **AI Providers:** User provides keys (BYOK model) - OpenAI, Anthropic, Google AI, Grok (xAI), Perplexity, Kimi (Moonshot AI) (text) + Google, OpenAI, Replicate (images)

## Deployment

### Branching Strategy

LinkedGrow uses a two-branch deployment model:

- **`staging`** - Development/testing branch, deploys to https://staging.linkedgrow.ai
- **`main`** - Production branch, deploys to https://linkedgrow.ai

**IMPORTANT: Always push changes to `staging` first by default.** Only push to `main` when the user explicitly requests a production deploy (e.g., "deploy live", "push to production", "deploy to main").

### Deploy to Staging (Default)

```bash
git checkout staging
git add .
git commit -m "Your commit message"
git push origin staging
```

### Deploy to Production

Only when explicitly requested by the user:

```bash
git checkout main
git merge staging
git push origin main
```

### Vercel Auto-Deploy

The project is connected to Vercel via GitHub. Pushes trigger automatic deployment:

- Push to `staging` -> deploys to https://staging.linkedgrow.ai
- Push to `main` -> deploys to https://linkedgrow.ai

### GitHub SSH Access

SSH key is configured for Claude Code. The remote uses SSH:

```
git@github.com:DigiHold/LinkedGrow.git
```

SSH authentication is automatic.

## Default OG Image

A default Open Graph image is set in `src/app/layout.tsx` and applies to **all pages** automatically:

```
https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp
```

- Blog articles override this with their own featured image via `openGraph.images` in the article's metadata
- To set a custom OG image for a specific page, add `openGraph.images` to that page's metadata export
- **Never remove the default** from `layout.tsx` - it's the fallback for every page

### CRITICAL: Every new page MUST include OG + Twitter images

When creating ANY new page with `export const metadata`, you MUST always include `images` in both the `openGraph` and `twitter` sections. The `layout.tsx` default is NOT enough - social platforms often only read page-level meta tags when sharing links.

```typescript
openGraph: {
  // ...title, description, url, siteName, type
  images: [
    {
      url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp",
      width: 1200,
      height: 630,
      alt: "LinkedGrow - AI-Powered LinkedIn Growth Platform",
    },
  ],
},
twitter: {
  // ...card, title, description
  images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp"],
},
```

**Never skip this.** If a page has no custom OG image, use the default URL above.

## Schema Markup (JSON-LD Structured Data)

All schema components live in `src/components/seo/json-ld.tsx`. The system uses `@id` references to connect entities across schemas.

### Global Schemas (in `layout.tsx` - every page gets these automatically)

- `OrganizationJsonLd` - Company identity with `@id: https://linkedgrow.ai/#organization`
- `WebsiteJsonLd` - Site identity with `@id: https://linkedgrow.ai/#website`
- `SoftwareApplicationJsonLd` - WebApplication schema with all pricing tiers, `@id: https://linkedgrow.ai/#software`

### When Creating a New Page - Schema Checklist

Every new **public-facing, indexed page** MUST include:

1. **`BreadcrumbJsonLd`** - Always. Example:
   ```tsx
   <BreadcrumbJsonLd
     items={[
       { name: "Home", url: "https://linkedgrow.ai" },
       { name: "Page Name", url: "https://linkedgrow.ai/page-slug" },
     ]}
   />
   ```

2. **Page-specific schema** based on page type:

   | Page Type | Required Schema Components |
   |-----------|---------------------------|
   | Feature page | `BreadcrumbJsonLd` + `SoftwareApplicationJsonLd` (with custom name/url/description/offers) + `FAQJsonLd` |
   | Free tool | `BreadcrumbJsonLd` + `WebApplicationJsonLd` + `FAQJsonLd` |
   | Landing/comparison page | `BreadcrumbJsonLd` + `SoftwareApplicationJsonLd` + `FAQJsonLd` |
   | Industry/use-case/for page | `BreadcrumbJsonLd` + `FAQJsonLd` |
   | Blog article | `BreadcrumbJsonLd` + `BlogPostingJsonLd` + `FAQJsonLd` (handled by blog article layout) |
   | Blog listing | `BreadcrumbJsonLd` + `CollectionPageJsonLd` |
   | About page | `BreadcrumbJsonLd` + `AboutPageJsonLd` + `PersonJsonLd` |
   | Legal page (privacy/terms/cookies) | `BreadcrumbJsonLd` only |
   | Auth pages (sign-in/sign-up) | None (noindex pages) |
   | Dashboard pages | None (behind auth, not indexed) |

3. **FAQJsonLd** - Add whenever the page has a FAQ section with Q&A content.

### Important Rules

- **Never add `aggregateRating`** unless real, verified user reviews exist (Google penalizes fake ratings)
- **No `SearchAction`** in WebSite schema (deprecated Jan 2026, and we have no search page)
- Use `@id` references (e.g., `{ "@id": "https://linkedgrow.ai/#organization" }`) to connect schemas instead of duplicating Organization data
- The global `SoftwareApplicationJsonLd` (no props) uses `WebApplication` type with `AggregateOffer` containing all 4 plan tiers
- Feature page `SoftwareApplicationJsonLd` (with props) uses a single `Offer` with the relevant starting price

## Caching Strategy

Cache headers are configured in `next.config.ts` via the `headers()` function. Vercel's CDN automatically invalidates all cached content on every deploy - no manual cache clearing is needed.

### Cache Rules

| Resource | Cache Duration | Strategy |
| --- | --- | --- |
| `/_next/static/*` (JS, CSS) | 1 year, immutable | Content-hashed filenames - new deploy = new URLs |
| `/images/*` (public images) | 30 days + 1 day stale-while-revalidate | Long cache for static marketing images |
| `/favicon.ico`, `/icon.svg`, `/robots.txt`, `/sitemap.xml` | 1 day + 12 hour stale-while-revalidate | Moderate cache for root files |
| Public pages (`/prelaunch`, `/about`, `/privacy`, `/terms`, `/cookies`, `/beta`, `/sign-in`, `/sign-up`) | CDN: 1 hour (`s-maxage=3600`) + 10 min stale-while-revalidate | Browser gets fresh response, CDN serves cached. Only for logged-out pages. |
| Dashboard/API routes | No custom cache headers | Authenticated content - not cached at CDN |

### How It Works

- `max-age=0` means the browser always checks with the server (or CDN)
- `s-maxage=3600` means Vercel's CDN caches the response for 1 hour
- `stale-while-revalidate=600` means the CDN serves stale content while fetching fresh in the background
- `immutable` means the browser never re-validates (used for content-hashed static assets)
- Vercel purges the entire CDN cache on every deployment automatically

### Important

- **Never add cache headers to `/dashboard/*` or `/api/*` routes** - these serve authenticated/dynamic content
- When adding new public marketing pages, add them to the regex pattern in `next.config.ts` `headers()`

## Pricing Plans (from src/lib/plans.ts)

| Plan         | Price  | Posts/Month | Scheduled | Images    |
| ------------ | ------ | ----------- | --------- | --------- |
| **Free**     | $0     | 3           | 0         | 0         |
| **Starter**  | $19/mo | Unlimited   | 10        | 0         |
| **Pro**      | $39/mo | Unlimited   | Unlimited | Unlimited |
| **Business** | $79/mo | Unlimited   | Unlimited | Unlimited |

### Feature Matrix (Accurate from plans.ts)

| Feature             | Free | Starter | Pro | Business |
| ------------------- | ---- | ------- | --- | -------- |
| Post Generation     | ✓    | ✓       | ✓   | ✓        |
| Advanced Editor     | -    | ✓       | ✓   | ✓        |
| Content Calendar    | -    | ✓       | ✓   | ✓        |
| Post Scheduling     | -    | ✓ (10)  | ✓   | ✓        |
| Reddit Ideas        | -    | ✓       | ✓   | ✓        |
| AI Image Generation | -    | -       | ✓   | ✓        |
| Hooks Generator     | -    | -       | ✓   | ✓        |
| Analytics Dashboard | -    | -       | ✓   | ✓        |
| Engagement Tools    | -    | -       | ✓   | ✓        |
| Algorithm Optimizer | -    | -       | ✓   | ✓        |
| Carousel Generator  | -    | -       | -   | ✓        |
| A/B Testing         | -    | -       | -   | ✓        |
| Team Collaboration  | -    | -       | -   | ✓        |
| Advanced Analytics  | -    | -       | -   | ✓        |
| API Access          | -    | -       | -   | ✓        |
| Priority Support    | -    | -       | -   | ✓        |

## Database (Turso)

### How to Modify the Database

**IMPORTANT: Never use drizzle-kit for migrations. Always use Turso CLI directly.**

When you need to add/modify columns or tables:

1. **Update the schema file** (`src/lib/db/schema.ts`) - this is for TypeScript types only
2. **Run SQL directly on Turso** using the CLI:

```bash
# Add a column
turso db shell linkedgrow "ALTER TABLE table_name ADD COLUMN column_name TYPE DEFAULT value"

# Create a table
turso db shell linkedgrow "CREATE TABLE table_name (id TEXT PRIMARY KEY, ...)"

# View table structure
turso db shell linkedgrow "PRAGMA table_info(table_name)"

# Run a query
turso db shell linkedgrow "SELECT * FROM table_name LIMIT 10"
```

**Database name:** `linkedgrow` (not `linkedgrow-database`)

### Schema Location

Main tables in `src/lib/db/schema.ts`:

### Core Tables

-   **users** - Auth, subscription, LinkedIn tokens, AI keys, voice settings, branding
-   **sessions** - NextAuth sessions
-   **accounts** - OAuth providers
-   **verification_tokens** - Email verification
-   **posts** - LinkedIn posts (draft/scheduled/published/failed)
-   **media** - Images/carousels stored in R2
-   **ideas** - Content ideas (Reddit-sourced or manual)
-   **waitlist** - Pre-launch email collection
-   **password_reset_tokens** - Password reset flow

### Business Plan Tables

-   **ab_tests** - A/B testing for posts
-   **teams** - Team management
-   **team_members** - Team membership with roles (owner/admin/member)
-   **team_invites** - Email invitations with tokens
-   **api_keys** - REST API key management
-   **api_logs** - API request logging
-   **post_analytics** - Engagement metrics per post

### User Fields

```
Auth: email, password (bcrypt), twoFactorEnabled, twoFactorSecret, isAdmin
Subscription: plan (free/starter/pro/business), stripeCustomerId, stripeSubscriptionId
LinkedIn: linkedinAccessToken, linkedinRefreshToken, linkedinTokenExpiry, linkedinProfileId, linkedinProfileName
Text AI (per-provider): aiProvider, openaiApiKey, openaiModel, anthropicApiKey, anthropicModel, googleApiKey, googleModel, grokApiKey, grokModel, perplexityApiKey, perplexityModel, kimiApiKey, kimiModel
Image AI (per-provider): imageProvider, googleImageApiKey, googleImageModel, googleImageResolution, googleImageAspectRatio, openaiImageApiKey, openaiImageModel, openaiImageResolution, openaiImageQuality, openaiImageStyle, replicateImageApiKey, replicateImageModel, replicateImageResolution, replicateImageAspectRatio
Voice: samplePosts (JSON), neverMention, businessDescription, targetAudience, writingTone
Branding: brandLogoUrl, brandPrimaryColor, brandSecondaryColor, brandFontFamily
```

## Authentication System

**Using NextAuth.js v5 (beta) - NOT Clerk**

-   Email/Password authentication (credentials provider)
-   2FA/TOTP support (QR code generation with `qrcode`, verification with `otplib`)
-   Password hashing: bcryptjs
-   Session strategy: JWT
-   DrizzleAdapter for database integration

Key files:

-   `src/lib/auth.ts` - NextAuth configuration
-   `src/app/api/auth/register/route.ts` - User registration
-   `src/app/api/auth/2fa/*` - 2FA setup/verify/disable

## Stripe Configuration

```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_STARTER_PRICE_ID=price_1SoKzYDZ5QtFd12cEZHEDn5Q
STRIPE_PRO_PRICE_ID=price_1SoL05DZ5QtFd12capBIf37Q
STRIPE_BUSINESS_PRICE_ID=price_1SoL0rDZ5QtFd12c7kcCeiyu
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_xxxxx
```

### Yearly Pricing (30% off)

| Plan | Monthly | Yearly (total) | Yearly (per month) | Savings |
|------|---------|----------------|-------------------|---------|
| Starter | $19/mo | $160/year | ~$13/mo | Save $68 |
| Pro | $39/mo | $328/year | ~$27/mo | Save $140 |
| Business | $79/mo | $664/year | ~$55/mo | Save $284 |

### Coupon System

-   **PRELAUNCH30**: 30% off for 12 months (founder's discount)
-   Applied via URL: `https://linkedgrow.ai/?coupon=PRELAUNCH30`

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=https://linkedgrow.ai
NEXT_PUBLIC_APP_NAME=LinkedGrow
NEXT_PUBLIC_PRELAUNCH_MODE=true

# NextAuth
AUTH_SECRET=your-auth-secret-here
AUTH_URL=https://linkedgrow.ai

# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxx

# LinkedIn (2 apps)
LINKEDIN_CLIENT_ID=xxxxx
LINKEDIN_CLIENT_SECRET=xxxxx
LINKEDIN_COMMUNITY_CLIENT_ID=xxxxx
LINKEDIN_COMMUNITY_CLIENT_SECRET=xxxxx
LINKEDIN_REDIRECT_URI=https://linkedgrow.ai/api/linkedin/callback

# Cloudflare R2
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=linkedgrow-media

# Email (Brevo)
BREVO_API_KEY=xkeysib-xxxxx

# QStash (Upstash - for scheduled posts)
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=xxxxx
QSTASH_NEXT_SIGNING_KEY=xxxxx

# Vercel Cron (fallback)
CRON_SECRET=xxxxx

# Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Sign-in, sign-up, forgot-password
│   ├── (dashboard)/        # All dashboard pages
│   │   └── dashboard/
│   │       ├── ab-testing/ # A/B tests (Business)
│   │       ├── analytics/
│   │       │   └── advanced/ # Advanced analytics (Business)
│   │       ├── calendar/
│   │       ├── carousel/
│   │       ├── editor/
│   │       ├── engagement/
│   │       ├── generator/
│   │       ├── hooks/
│   │       ├── ideas/
│   │       ├── posts/
│   │       ├── reddit/
│   │       ├── settings/
│   │       │   ├── ai-api/
│   │       │   ├── api/     # API keys (Business)
│   │       │   └── branding/ # Custom branding (Business)
│   │       ├── team/        # Team management (Business)
│   │       └── upgrade/
│   ├── (marketing)/        # Checkout pages
│   ├── api/
│   │   ├── ab-tests/       # A/B test CRUD
│   │   ├── ai/             # AI generation endpoints
│   │   ├── analytics/      # Analytics data
│   │   ├── auth/           # Authentication
│   │   ├── geo/            # Geolocation
│   │   ├── indexnow/       # Search engine indexing
│   │   ├── keys/           # API key management
│   │   ├── linkedin/       # LinkedIn OAuth & posting
│   │   ├── media/          # File upload/management
│   │   ├── posts/          # Post CRUD
│   │   ├── reddit/         # Reddit integration
│   │   ├── stripe/         # Payments
│   │   ├── team/           # Team management
│   │   ├── user/           # User settings
│   │   ├── v1/             # Public REST API (Business)
│   │   └── waitlist/       # Pre-launch emails
│   ├── prelaunch/          # Pre-launch landing page
│   ├── about/
│   ├── privacy/
│   └── cookies/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── marketing/          # Landing page sections
│   ├── dashboard/          # Dashboard components
│   ├── prelaunch/          # Pre-launch components
│   ├── providers/          # Context providers
│   ├── seo/                # SEO components (JSON-LD)
│   └── cookie-consent/     # GDPR cookie banner
└── lib/
    ├── db/
    │   ├── index.ts        # Drizzle client (runtime queries)
    │   └── schema.ts       # Database schema (TypeScript types only)
    ├── auth.ts             # NextAuth configuration
    ├── plans.ts            # Pricing plans & features
    ├── stripe.ts           # Stripe client
    ├── storage/r2.ts       # Cloudflare R2 storage
    ├── api-auth.ts         # API key authentication
    └── i18n/               # Internationalization
```

## API Routes

| Route                    | Method         | Purpose                        |
| ------------------------ | -------------- | ------------------------------ |
| `/api/auth/register`     | POST           | User registration              |
| `/api/auth/2fa/setup`    | POST           | Enable 2FA                     |
| `/api/auth/2fa/verify`   | POST           | Verify TOTP code               |
| `/api/stripe/checkout`   | POST           | Create Stripe checkout session |
| `/api/stripe/webhook`    | POST           | Handle Stripe events           |
| `/api/linkedin/auth`     | POST           | Initiate LinkedIn OAuth        |
| `/api/linkedin/callback` | GET            | Handle LinkedIn callback       |
| `/api/linkedin/post`     | POST           | Publish post to LinkedIn       |
| `/api/posts`             | GET/POST       | List/create posts              |
| `/api/posts/[id]`        | GET/PUT/DELETE | Individual post operations     |
| `/api/media`             | GET/POST       | List/upload media              |
| `/api/ai/generate-post`  | POST           | AI post generation             |
| `/api/ai/generate-hooks` | POST           | Generate viral hooks           |
| `/api/ai/generate-image` | POST           | AI image generation            |
| `/api/ab-tests`          | CRUD           | A/B testing (Business)         |
| `/api/team`              | CRUD           | Team management (Business)     |
| `/api/keys`              | CRUD           | API key management (Business)  |
| `/api/v1/posts`          | CRUD           | Public REST API (Business)     |

## Design System

### Theme: Light & Modern

-   **Primary:** Cyan/Blue gradient (`from-cyan-500 to-blue-600`)
-   **Background:** White/Light gray (`bg-white`, `bg-slate-50`)
-   **Text:** Slate scale (`text-slate-900`, `text-slate-600`)
-   **Accents:** Emerald (success), Amber (warnings/BYOK), Violet (Pro plan)

### Key Design Patterns

-   Rounded corners: `rounded-2xl` for cards
-   Subtle shadows: `shadow-lg shadow-slate-200/50`
-   Gradient text: `text-transparent bg-clip-text bg-linear-to-r`
-   Animations: Framer Motion for scroll animations
-   Dark mode: Supported via `next-themes`

## Code Style Rules

1. **No em dashes**: Never use em dashes in any text or code. Use regular dashes with spaces `-` instead.

    - Wrong: `"no hidden costs—just results"`
    - Correct: `"no hidden costs - just results"`

2. **Contact email**: Use only `contact@linkedgrow.ai` for all contact references

3. **useSearchParams Hook**: Must be wrapped in `<Suspense>` boundary (Next.js 16 requirement)

4. **NEVER USE INLINE STYLES**: Use Tailwind CSS exclusively.

    - Wrong: `style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}`
    - Correct: `className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"`

5. **Font weights**: Use Tailwind's font weight classes

    - `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-black` (900)

6. **No Co-Author Attribution in Git Commits**: NEVER add "Co-Authored-By" lines to git commit messages. No attribution, no credits, no signatures of any kind.

## AI Models Supported (BYOK)

### Text Generation Models (6 providers, 26 models)

-   **OpenAI**: GPT-5.2, GPT-5, GPT-5 Nano, o4-mini, o3, o3-mini
-   **Anthropic**: Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, Claude Sonnet 4
-   **Google**: Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite
-   **Grok (xAI)**: Grok 4, Grok 4.1 Fast, Grok Code Fast, Grok 3
-   **Perplexity**: Sonar Deep Research, Sonar Reasoning Pro, Sonar Reasoning, Sonar Pro, Sonar
-   **Kimi (Moonshot AI)**: Kimi K2.5, Kimi K2

### Image Generation Models (3 providers, 14 models)

-   **Google**: Nano Banana Pro (Gemini 3 Pro Image), Nano Banana (Gemini 2.5 Flash Image), Imagen 4 Ultra, Imagen 4, Imagen 4 Fast
-   **OpenAI**: GPT Image 1.5, GPT Image 1, GPT Image 1 Mini
-   **Replicate**: FLUX.2 Pro, FLUX.2 Flex, FLUX.2 Dev, FLUX 1.1 Pro Ultra, FLUX 1.1 Pro, FLUX Schnell

> **IMPORTANT**: Always check `src/app/(dashboard)/dashboard/settings/ai-api/page.tsx` for the actual current model list before referencing models anywhere. Never guess or use outdated names. The models listed above are the source of truth as of March 2026.

### Typical User API Costs

-   Light usage: $2-3/month
-   Regular posting: $4-6/month
-   Heavy usage: $8-15/month

## Marketing Numbers

-   "179+ founders" - Trusted by count (update as waitlist grows)
-   "30% off" - Early adopter discount for 12 months
-   "$2-4/month" - Typical AI API costs
-   "96% less" - Savings vs competitors ($19 + $2 API vs $49 competitors)

## LinkedGrow Features (Complete List)

### Content Creation

-   **Post Editor** - Rich text editor with formatting, emoji support, character count (3000 char limit)
-   **AI Post Generator** - Generate posts from topics/ideas using user's AI API key (BYOK)
-   **Ideas Generator** - AI-powered content ideas based on user's niche/industry
-   **Hooks Generator** - Generate viral opening hooks to boost engagement
-   **Carousel Generator** - Create multi-slide carousels for LinkedIn (Pro+)
-   **Reddit Importer** - Turn any viral Reddit post URL into LinkedIn content ideas

### Voice & Personalization

-   **Voice Training** - Analyze user's sample posts to match their writing style
-   **Business Description** - Context about user's business for more relevant content
-   **Target Audience** - Define ideal reader persona
-   **Writing Tone** - Set preferred tone (professional, casual, inspirational, etc.)
-   **Never Mention** - List of topics/competitors to avoid in generated content

### LinkedIn Integration

-   **OAuth Connection** - Connect LinkedIn account securely
-   **Post Publishing** - Publish posts directly to LinkedIn (personal profiles)
-   **Company Page Publishing** - Post to company pages user manages
-   **Feed Viewing** - View LinkedIn feed within dashboard (Pro+)
-   **Engagement Tools** - Like, comment, and interact with posts from dashboard (Pro+)
-   **Profile Picture Sync** - Store user's LinkedIn profile picture in R2

### Scheduling & Calendar

-   **Post Scheduling** - Schedule posts for future dates/times
-   **Content Calendar** - Visual calendar view of all scheduled posts
-   **Optimal Time Suggestions** - AI-recommended posting times based on audience
-   **Timezone Support** - Schedule in user's local timezone

### Analytics

-   **Basic Analytics** - Post performance metrics (Pro+)
-   **Advanced Analytics** - Detailed engagement trends, charts, best times (Business)
-   **Engagement Rate** - Track likes, comments, shares, impressions
-   **Export Reports** - Export analytics data to CSV/PDF (Business)

### Business Plan Features

-   **A/B Testing** - Test different post versions to find best performers
-   **Team Collaboration** - Invite team members with role-based access (owner/admin/member)
-   **API Access** - REST API for integrations with custom applications
-   **API Key Management** - Create/revoke API keys with scopes
-   **Priority Support** - Dedicated support channel

### Account & Settings

-   **Email/Password Auth** - Traditional registration with password
-   **Social Login** - Sign in with LinkedIn or Google
-   **Two-Factor Authentication (2FA)** - TOTP-based security with QR code setup
-   **Password Reset** - Secure password recovery flow
-   **Plan Management** - Upgrade/downgrade via Stripe Customer Portal
-   **BYOK Configuration** - Configure AI provider and API keys

## LinkedIn API Requirements

LinkedGrow requires the following LinkedIn Developer products:

### 1. Sign In with LinkedIn using OpenID Connect

-   **Purpose:** Social login (Sign in with LinkedIn button)
-   **Scopes:** `openid`, `profile`, `email`
-   **Usage:** Authentication only, get user's name/email/picture

### 2. Share on LinkedIn

-   **Purpose:** Publish posts to LinkedIn
-   **Scopes:** `w_member_social`
-   **Usage:** Create posts on user's personal profile and company pages they manage
-   **Critical for:** Core posting functionality

### 3. Community Management API

-   **Purpose:** Engagement features (feed viewing, liking, commenting)
-   **Scopes:** `r_organization_social`, `w_organization_social`
-   **Usage:** View feed, like posts, comment on posts from dashboard
-   **Required for:** Pro/Business engagement tools

### LinkedIn App Configuration

LinkedGrow uses TWO separate LinkedIn apps:

1. **Poster App** (`LINKEDIN_CLIENT_ID`) - Sign In + Share on LinkedIn
2. **Community App** (`LINKEDIN_COMMUNITY_CLIENT_ID`) - Community Management API

This separation is required because Community Management API has stricter approval requirements.

## Feature Implementation Status

### Implemented

-   [x] User authentication (email/password + 2FA)
-   [x] Social login (Google + LinkedIn OAuth)
-   [x] BYOK key management (text + image AI)
-   [x] Post editor with AI generation
-   [x] Post scheduling
-   [x] LinkedIn OAuth integration
-   [x] LinkedIn post publishing
-   [x] File upload (R2 storage)
-   [x] Voice training settings
-   [x] Pricing page with Stripe checkout
-   [x] Pre-launch waitlist
-   [x] Dashboard UI for all features
-   [x] A/B testing pages (Business)
-   [x] Team collaboration pages (Business)
-   [x] Custom branding pages (Business)
-   [x] API key management pages (Business)
-   [x] REST API endpoints (Business)
-   [x] Database schema for all features
-   [x] Transactional emails (Brevo)
-   [x] Welcome emails on registration

### TODO

-   [ ] Weekly report emails
-   [ ] LinkedIn analytics sync (requires Advertising API or manual input)
-   [ ] Content calendar improvements
-   [ ] Company page management UI

## Documentation System (`/docs`)

LinkedGrow has a `/docs` section that serves two purposes simultaneously:
1. **Public documentation pages** at `linkedgrow.ai/docs/...` for users to browse
2. **AI chatbot knowledge base** - the same markdown files are embedded as vectors for RAG (Retrieval Augmented Generation) so the AI support chatbot can answer user questions

### Documentation Structure

All documentation lives in `src/content/docs/` as markdown (`.md`) files organized by category:

```
src/content/docs/
├── getting-started/
│   ├── _category.json          # Category metadata (title, description, order)
│   ├── quick-start.md
│   ├── connecting-linkedin.md
│   └── ...
├── features/
│   ├── _category.json
│   ├── post-generator.md
│   ├── carousel-generator.md
│   └── ...
├── billing/
│   ├── _category.json
│   ├── pricing-plans.md
│   └── ...
└── ...
```

### Markdown File Format

Every docs article MUST follow this frontmatter format:

```markdown
---
title: "Article Title"
description: "Short description for SEO and chatbot context"
category: "category-slug"
order: 1
---

Article content here...
```

### CRITICAL Rules for Documentation Changes

1. **Single source of truth**: The `.md` files in `src/content/docs/` power BOTH the website pages AND the chatbot RAG embeddings. Never create separate content for the chatbot.
2. **When adding a new docs article**: Follow the exact same structure - create the `.md` file in the appropriate category folder with proper frontmatter. If the category doesn't exist, create a new folder with a `_category.json` file.
3. **When editing a docs article**: Edit the `.md` file directly. The chatbot embeddings will be re-generated on the next build.
4. **When adding a new category**: Create a folder in `src/content/docs/` with a `_category.json` containing `{ "title": "Category Name", "description": "...", "order": N }`.
5. **Keep articles accurate**: The chatbot will use this content to answer users. Outdated or wrong information means wrong chatbot answers. When features change, update the relevant docs articles.
6. **Do NOT write docs for unimplemented features**: Analytics, Advanced Analytics, and Engagement features are not done yet (waiting for LinkedIn API). Do not create docs articles for these until they are implemented.

## Writing Commands

| Command | Guide | What it does |
|---------|-------|-------------|
| "write linkedin" | `LINKEDIN-POST-GUIDE.md` | Write a LinkedIn post for today's format (Authority/Carousel/Lead Magnet/Hot Take/Blog Promo), generate image, schedule via API |
| "write reddit" | `REDDIT-POST-GUIDE.md` | Research trending AI topics, write a r/WTFisAI post with flair, title, and content ready to paste |

When the user says any of these commands, read the corresponding guide and follow it step by step.

## Founders

-   **Nicolas Lecocq** - Founder & Developer (15+ years web dev, created OceanWP)
-   **Maria Lecocq** - Operations & Community

Based in Paris, France.
