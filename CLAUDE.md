# LinkedGrow - AI-Powered LinkedIn Content Platform

## Project Overview

LinkedGrow is a SaaS platform that helps users create, schedule, and optimize LinkedIn content using AI. The key differentiator is the **BYOK (Bring Your Own Key)** model - users connect their own AI API keys (OpenAI, Anthropic, Google, etc.) for unlimited generations without monthly caps.

**Website:** https://linkedgrow.ai
**Status:** Pre-launch (collecting waitlist emails)

## Tech Stack

- **Framework:** Next.js 16.1.1 (App Router, Turbopack)
- **Language:** TypeScript 5.9.3
- **Styling:** Tailwind CSS 4.1.8 + shadcn/ui components
- **Authentication:** NextAuth.js v5 (beta) with Credentials Provider + 2FA/TOTP
- **Database:** Turso (LibSQL edge SQLite) + Drizzle ORM
- **Payments:** Stripe (subscriptions)
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Email:** NOT YET IMPLEMENTED (TODO: Resend for transactional)
- **Hosting:** Vercel
- **AI Providers:** User provides keys (BYOK model) - OpenAI, Anthropic, Google AI, Groq, Replicate, Together AI

## Deployment

### Vercel Auto-Deploy

The project is connected to Vercel via GitHub. Any push to the `main` branch triggers automatic deployment.

**To deploy:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build the Next.js project
3. Deploy to production at https://linkedgrow.ai

### GitHub SSH Access

SSH key is configured for Claude Code. The remote uses SSH:
```
git@github.com:DigiHold/LinkedGrow.git
```

Always use `git push origin main` - SSH authentication is automatic.

## Pricing Plans (from src/lib/plans.ts)

| Plan | Price | Posts/Month | Scheduled | Saved Ideas | Images |
|------|-------|-------------|-----------|-------------|--------|
| **Free** | $0 | 3 | 0 | 5 | 0 |
| **Starter** | $19/mo | Unlimited | 10 | 50 | 0 |
| **Pro** | $39/mo | Unlimited | Unlimited | Unlimited | Unlimited |
| **Business** | $79/mo | Unlimited | Unlimited | Unlimited | Unlimited |

### Feature Matrix (Accurate from plans.ts)

| Feature | Free | Starter | Pro | Business |
|---------|------|---------|-----|----------|
| Post Generation | ✓ | ✓ | ✓ | ✓ |
| Advanced Editor | - | ✓ | ✓ | ✓ |
| Content Calendar | - | ✓ | ✓ | ✓ |
| Post Scheduling | - | ✓ | ✓ | ✓ |
| Reddit Ideas | - | ✓ | ✓ | ✓ |
| AI Image Generation | - | - | ✓ | ✓ |
| Carousel Generator | - | - | ✓ | ✓ |
| Hooks Generator | - | - | ✓ | ✓ |
| Analytics Dashboard | - | - | ✓ | ✓ |
| Engagement Tools | - | - | ✓ | ✓ |
| Algorithm Optimizer | - | - | ✓ | ✓ |
| A/B Testing | - | - | - | ✓ |
| Team Collaboration | - | - | - | ✓ |
| Custom Branding | - | - | - | ✓ |
| Advanced Analytics | - | - | - | ✓ |
| API Access | - | - | - | ✓ |
| Priority Support | - | - | - | ✓ |

## Database Schema (Turso/Drizzle)

Main tables in `src/lib/db/schema.ts`:

### Core Tables
- **users** - Auth, subscription, LinkedIn tokens, AI keys, voice settings, branding
- **sessions** - NextAuth sessions
- **accounts** - OAuth providers
- **verification_tokens** - Email verification
- **posts** - LinkedIn posts (draft/scheduled/published/failed)
- **media** - Images/carousels stored in R2
- **ideas** - Content ideas (Reddit-sourced or manual)
- **waitlist** - Pre-launch email collection
- **password_reset_tokens** - Password reset flow

### Business Plan Tables
- **ab_tests** - A/B testing for posts
- **teams** - Team management
- **team_members** - Team membership with roles (owner/admin/member)
- **team_invites** - Email invitations with tokens
- **api_keys** - REST API key management
- **api_logs** - API request logging
- **post_analytics** - Engagement metrics per post

### User Fields
```
Auth: email, password (bcrypt), twoFactorEnabled, twoFactorSecret, isAdmin
Subscription: plan (free/starter/pro/business), stripeCustomerId, stripeSubscriptionId
LinkedIn: linkedinAccessToken, linkedinRefreshToken, linkedinTokenExpiry, linkedinProfileId, linkedinProfileName
AI Settings: aiProvider, aiApiKey, aiModel, imageProvider, imageApiKey
Voice: samplePosts (JSON), neverMention, businessDescription, targetAudience, writingTone
Branding: brandLogoUrl, brandPrimaryColor, brandSecondaryColor, brandFontFamily
```

## Authentication System

**Using NextAuth.js v5 (beta) - NOT Clerk**

- Email/Password authentication (credentials provider)
- 2FA/TOTP support (QR code generation with `qrcode`, verification with `otplib`)
- Password hashing: bcryptjs
- Session strategy: JWT
- DrizzleAdapter for database integration

Key files:
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/register/route.ts` - User registration
- `src/app/api/auth/2fa/*` - 2FA setup/verify/disable

## Stripe Configuration

```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_STARTER_PRICE_ID=price_1SoKzYDZ5QtFd12cEZHEDn5Q
STRIPE_PRO_PRICE_ID=price_1SoL05DZ5QtFd12capBIf37Q
STRIPE_BUSINESS_PRICE_ID=price_1SoL0rDZ5QtFd12c7kcCeiyu
```

### Coupon System
- **PRELAUNCH30**: 30% off for 12 months (founder's discount)
- Applied via URL: `https://linkedgrow.ai/?coupon=PRELAUNCH30`

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

# Email (TODO)
RESEND_API_KEY=re_xxxxx

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
    │   ├── index.ts        # Drizzle client
    │   └── schema.ts       # Database schema
    ├── auth.ts             # NextAuth configuration
    ├── plans.ts            # Pricing plans & features
    ├── stripe.ts           # Stripe client
    ├── storage/r2.ts       # Cloudflare R2 storage
    ├── api-auth.ts         # API key authentication
    └── i18n/               # Internationalization
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/2fa/setup` | POST | Enable 2FA |
| `/api/auth/2fa/verify` | POST | Verify TOTP code |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/linkedin/auth` | POST | Initiate LinkedIn OAuth |
| `/api/linkedin/callback` | GET | Handle LinkedIn callback |
| `/api/linkedin/post` | POST | Publish post to LinkedIn |
| `/api/posts` | GET/POST | List/create posts |
| `/api/posts/[id]` | GET/PUT/DELETE | Individual post operations |
| `/api/media` | GET/POST | List/upload media |
| `/api/ai/generate-post` | POST | AI post generation |
| `/api/ai/generate-hooks` | POST | Generate viral hooks |
| `/api/ai/generate-image` | POST | AI image generation |
| `/api/ab-tests` | CRUD | A/B testing (Business) |
| `/api/team` | CRUD | Team management (Business) |
| `/api/keys` | CRUD | API key management (Business) |
| `/api/v1/posts` | CRUD | Public REST API (Business) |

## Design System

### Theme: Light & Modern
- **Primary:** Cyan/Blue gradient (`from-cyan-500 to-blue-600`)
- **Background:** White/Light gray (`bg-white`, `bg-slate-50`)
- **Text:** Slate scale (`text-slate-900`, `text-slate-600`)
- **Accents:** Emerald (success), Amber (warnings/BYOK), Violet (Pro plan)

### Key Design Patterns
- Rounded corners: `rounded-2xl` for cards
- Subtle shadows: `shadow-lg shadow-slate-200/50`
- Gradient text: `text-transparent bg-clip-text bg-linear-to-r`
- Animations: Framer Motion for scroll animations
- Dark mode: Supported via `next-themes`

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

## AI Models Supported (BYOK)

- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, DALL-E 3
- **Anthropic**: Claude 4 Opus, Claude 3.5 Sonnet, Claude 3 Haiku
- **Google**: Gemini 2.0 Flash, Gemini 1.5 Pro
- **Groq**: Llama 3.3, Mixtral (ultra fast)
- **Replicate**: Flux, Stable Diffusion 3
- **Together AI**: DeepSeek, Qwen 2.5

### Typical User API Costs
- Light usage: $2-3/month
- Regular posting: $4-6/month
- Heavy usage: $8-15/month

## Marketing Numbers

- "179+ founders" - Trusted by count (update as waitlist grows)
- "30% off" - Early adopter discount for 12 months
- "$3-5/month" - Typical AI API costs
- "96% less" - Savings vs competitors ($39 + $5 API vs $99 competitors)

## Feature Implementation Status

### Implemented
- [x] User authentication (email/password + 2FA)
- [x] BYOK key management (text + image AI)
- [x] Post editor with AI generation
- [x] Post scheduling
- [x] LinkedIn OAuth integration
- [x] File upload (R2 storage)
- [x] Voice training settings
- [x] Pricing page with Stripe checkout
- [x] Pre-launch waitlist
- [x] Dashboard UI for all features
- [x] A/B testing pages (Business)
- [x] Team collaboration pages (Business)
- [x] Custom branding pages (Business)
- [x] API key management pages (Business)
- [x] REST API endpoints (Business)
- [x] Database schema for all features

### TODO
- [ ] Transactional emails (Resend)
- [ ] Weekly report emails
- [ ] LinkedIn analytics sync
- [ ] Content calendar improvements

## Founders

- **Nicolas Lecocq** - Founder & Developer (15+ years web dev, created OceanWP)
- **Maria Lecocq** - Operations & Community

Based in Paris, France. LinkedGrow is a product of Vayalis.
