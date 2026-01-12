# LinkedGrow - AI-Powered LinkedIn Content Platform

## Project Overview

LinkedGrow is a SaaS platform that helps users create, schedule, and optimize LinkedIn content using AI. The key differentiator is the **BYOK (Bring Your Own Key)** model - users connect their own AI API keys (OpenAI, Anthropic, Google, etc.) for unlimited generations without monthly caps.

**Website:** https://linkedgrow.ai
**Status:** Pre-launch (collecting waitlist emails)

## Tech Stack (ACTUAL)

- **Framework:** Next.js 16.1.1 (App Router, Turbopack)
- **Language:** TypeScript 5.9.3
- **Styling:** Tailwind CSS 4.1.8 + shadcn/ui components
- **Authentication:** NextAuth.js v5 (beta) with Credentials Provider + 2FA/TOTP
- **Database:** Turso (LibSQL edge SQLite) + Drizzle ORM
- **Payments:** Stripe (subscriptions)
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Email:** NOT YET IMPLEMENTED (TODO: Resend for transactional, MailerLite for marketing)
- **Hosting:** Vercel
- **AI Providers:** User provides keys (BYOK model) - OpenAI, Anthropic, Google AI

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── analytics/
│   │   │   ├── calendar/
│   │   │   ├── editor/
│   │   │   ├── generator/
│   │   │   ├── ideas/
│   │   │   ├── posts/
│   │   │   ├── reddit/
│   │   │   └── settings/
│   │   └── onboarding/
│   ├── (marketing)/
│   │   └── checkout/
│   ├── api/
│   │   ├── ai/generate-image/
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   ├── 2fa/
│   │   │   └── [...nextauth]/
│   │   ├── linkedin/
│   │   ├── stripe/
│   │   ├── media/
│   │   ├── posts/
│   │   ├── waitlist/
│   │   ├── geo/
│   │   └── indexnow/
│   ├── prelaunch/
│   ├── about/               # TODO: Create
│   ├── privacy/
│   └── cookies/
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── marketing/           # Landing page sections
│   ├── dashboard/           # Dashboard components
│   ├── prelaunch/           # Pre-launch page components
│   ├── providers/           # Context providers
│   ├── seo/                 # SEO components (JSON-LD)
│   └── cookie-consent/      # GDPR cookie banner
├── lib/
│   ├── db/
│   │   ├── index.ts         # Drizzle client
│   │   └── schema.ts        # Database schema
│   ├── auth.ts              # NextAuth configuration
│   ├── stripe.ts            # Stripe client & plans
│   ├── storage/r2.ts        # Cloudflare R2 storage
│   ├── linkedin.ts          # LinkedIn API integration
│   ├── i18n/languages.ts    # Language detection
│   └── utils.ts             # Helper functions
└── types/                   # TypeScript types
```

## Database Schema (Turso/Drizzle)

```typescript
// Main tables in src/lib/db/schema.ts
- users          // Auth, subscription, LinkedIn tokens, AI keys
- sessions       // NextAuth sessions
- accounts       // OAuth providers
- verification_tokens
- posts          // LinkedIn posts (draft/scheduled/published/failed)
- media          // Images/carousels stored in R2
- ideas          // Content ideas (Reddit-sourced or manual)
- waitlist       // Pre-launch email collection
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

## Pricing Plans

| Plan         | Price  | Key Features                                          |
| ------------ | ------ | ----------------------------------------------------- |
| **Free**     | $0     | 3 posts/month, basic editor, BYOK                     |
| **Starter**  | $19/mo | Unlimited posts, 10 scheduled, content calendar       |
| **Pro**      | $39/mo | Unlimited scheduling, AI images, carousels, analytics |
| **Business** | $79/mo | A/B testing, API access, priority support, team       |

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

## LinkedIn Integration

Uses TWO separate LinkedIn apps:
1. **Poster App**: For publishing posts (`w_member_social` scope)
2. **Community App**: For engagement features (`r_organization_social` scope)

```env
LINKEDIN_CLIENT_ID=xxxxx
LINKEDIN_CLIENT_SECRET=xxxxx
LINKEDIN_COMMUNITY_CLIENT_ID=xxxxx
LINKEDIN_COMMUNITY_CLIENT_SECRET=xxxxx
LINKEDIN_REDIRECT_URI=https://linkedgrow.ai/api/linkedin/callback
```

## File Storage (Cloudflare R2)

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=linkedgrow-media
R2_PUBLIC_URL=  # Optional custom domain
```

Files organized: `users/{userId}/posts/{postId}/{filename}`
Images optimized with Sharp (WebP conversion, metadata stripping)

## Environment Variables (Complete)

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

# Email (TODO - not yet implemented)
RESEND_API_KEY=re_xxxxx

# Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## API Routes

| Route                    | Method         | Purpose                         |
| ------------------------ | -------------- | ------------------------------- |
| `/api/auth/register`     | POST           | User registration               |
| `/api/auth/2fa/setup`    | POST           | Enable 2FA                      |
| `/api/auth/2fa/verify`   | POST           | Verify TOTP code                |
| `/api/auth/2fa/disable`  | POST           | Disable 2FA                     |
| `/api/stripe/checkout`   | POST           | Create Stripe checkout session  |
| `/api/stripe/webhook`    | POST           | Handle Stripe events            |
| `/api/linkedin/auth`     | POST           | Initiate LinkedIn OAuth         |
| `/api/linkedin/callback` | GET            | Handle LinkedIn callback        |
| `/api/linkedin/post`     | POST           | Publish post to LinkedIn        |
| `/api/posts`             | GET/POST       | List/create posts               |
| `/api/posts/[id]`        | GET/PUT/DELETE | Individual post operations      |
| `/api/media`             | GET/POST       | List/upload media               |
| `/api/media/[id]`        | GET/DELETE     | Media operations                |
| `/api/ai/generate-image` | POST           | Generate/optimize images        |
| `/api/waitlist`          | POST           | Add to pre-launch waitlist      |
| `/api/geo`               | GET            | Geolocation (country detection) |
| `/api/indexnow`          | POST           | Search engine indexing          |

## Current State: Pre-Launch

### Active Page
`/prelaunch` - Waitlist collection with:
- Countdown timer
- 30% Founder's Discount offer
- Email collection (stored in database - NO email sending yet)
- Language detection from geolocation

### Post-Launch
Main landing page at `/` with full marketing sections

## Design System

### Theme: Light & Modern
- **Primary:** Cyan/Blue gradient (`from-cyan-500 to-blue-600`)
- **Background:** White/Light gray (`bg-white`, `bg-slate-50`)
- **Text:** Slate scale (`text-slate-900`, `text-slate-600`)
- **Accents:** Emerald (success), Amber (warnings/BYOK), Violet (Pro plan)

### Key Design Patterns
- Rounded corners: `rounded-2xl` for cards
- Subtle shadows: `shadow-lg shadow-slate-200/50`
- Gradient text: `text-transparent bg-clip-text bg-gradient-to-r`
- Animations: Framer Motion for scroll animations
- Dark mode: Supported via `next-themes`

## Code Style Rules

1. **No em dashes**: Never use em dashes in any text or code. Use regular dashes with spaces ` - ` instead.
   - Wrong: `"no hidden costs—just results"`
   - Correct: `"no hidden costs - just results"`

2. **Contact email**: Use only `contact@linkedgrow.ai` for all contact references

3. **useSearchParams Hook**: Must be wrapped in `<Suspense>` boundary (Next.js 16 requirement)

4. **Middleware**: Next.js 16 shows deprecation warning for middleware - proxy migration pending

## Founders

- **Nicolas Lecocq** - Founder & Developer (15+ years web dev, created OceanWP)
- **Maria Lecocq** - Operations & Community

Based in Montreux, Switzerland. LinkedGrow is a product of DigiHold.

## Related Projects

- **DigiHold** (https://digihold.me) - Parent company

---

## TODO / Next Steps

### Email Integration (Priority)

1. **Professional Email Setup**
   - [ ] Configure Zoho Mail Lite ($1/mo) or Cloudflare Email Routing (free)
   - [ ] Create contact@linkedgrow.ai mailbox
   - [ ] Add DNS records (MX, SPF, DKIM)

2. **Transactional Emails (Resend)**
   - [ ] Sign up at resend.com
   - [ ] Verify linkedgrow.ai domain
   - [ ] Add `RESEND_API_KEY` to Vercel env vars
   - [ ] Implement welcome email on user registration
   - [ ] Implement password reset flow
   - [ ] Implement weekly report emails (user opt-in in settings)

3. **Marketing Emails (MailerLite)**
   - [ ] Create MailerLite account with contact@linkedgrow.ai
   - [ ] Set up waitlist automation
   - [ ] Configure welcome sequence for waitlist subscribers
   - [ ] Add `MAILERLITE_API_KEY` to env vars
   - [ ] Update `/api/waitlist` to sync with MailerLite

### Pages to Create

- [ ] `/about` - About Us page (founders, mission, trust signals)
- [ ] Remove About section from homepage once `/about` exists

### Dashboard Features (In Progress)

- [ ] AI voice training interface
- [ ] Content calendar view
- [ ] Analytics dashboard
- [ ] Weekly report toggle in settings

## Claude Code Configuration

### GitHub SSH Access

SSH key is configured for Claude Code. The remote uses SSH:

```
git@github.com:DigiHold/LinkedGrow.git
```

Always use `git push origin main` - SSH authentication is automatic.
