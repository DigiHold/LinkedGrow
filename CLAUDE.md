# LinkedGrow - AI-Powered LinkedIn Content Platform

## Project Overview

LinkedGrow is a SaaS platform that helps users create, schedule, and optimize LinkedIn content using AI. The key differentiator is the **BYOK (Bring Your Own Key)** model - users connect their own AI API keys (OpenAI, Anthropic, Google, etc.) for unlimited generations without monthly caps.

**Website:** https://linkedgrow.ai
**Status:** Pre-launch (collecting waitlist emails)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe (subscriptions)
- **Email:** Mailchimp (waitlist/marketing), Resend (transactional)
- **Hosting:** Vercel
- **AI Providers:** OpenAI, Anthropic, Google AI, Groq, Replicate, Together AI (user provides keys)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── stripe/        # Stripe checkout & webhooks
│   │   ├── waitlist/      # Waitlist email collection
│   │   ├── posts/         # Post CRUD operations
│   │   └── media/         # Image upload/generation
│   ├── dashboard/         # Authenticated user dashboard
│   ├── prelaunch/         # Pre-launch landing page (current)
│   └── (marketing)/       # Main landing page (post-launch)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── marketing/         # Landing page sections
│   └── dashboard/         # Dashboard components
├── lib/                   # Utilities & configurations
│   ├── stripe.ts          # Stripe client & plans config
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Helper functions
└── styles/                # Global styles
```

## Pricing Plans

| Plan | Price | Key Features |
|------|-------|--------------|
| **Free** | $0 | 3 posts/month, basic editor, BYOK |
| **Starter** | $19/mo | Unlimited posts, 10 scheduled, content calendar |
| **Pro** | $39/mo | Unlimited scheduling, AI images, carousels, analytics |
| **Business** | $79/mo | A/B testing, API access, priority support |

## Stripe Configuration

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_1SoKzYDZ5QtFd12cEZHEDn5Q
STRIPE_PRO_PRICE_ID=price_1SoL05DZ5QtFd12capBIf37Q
STRIPE_BUSINESS_PRICE_ID=price_1SoL0rDZ5QtFd12c7kcCeiyu
```

### Coupon System
- **PRELAUNCH30**: 30% off for 12 months (founder's discount for waitlist users)
- Applied via URL: `https://linkedgrow.ai/?coupon=PRELAUNCH30`
- Auto-applies at Stripe checkout

### Checkout Flow
1. User clicks plan button on pricing page
2. Email input appears
3. Redirect to Stripe Checkout (hosted page)
4. Success → `/checkout/success`
5. Cancel → `/checkout/cancel`

## Key Features

### BYOK (Bring Your Own Key)
Users connect their own AI API keys stored securely in browser localStorage. This enables:
- Unlimited AI generations (no monthly caps)
- Choice of any AI model (GPT-4, Claude, Gemini, etc.)
- AI image generation (DALL-E, Flux, Stable Diffusion)
- Lower costs (~$2-5/month API usage vs $49+ competitors)

### Content Creation
- AI post generation with multiple styles/tones
- Reddit-to-LinkedIn idea finder
- Carousel/document generator
- Image generation for posts
- 40+ language support

### Scheduling & Analytics
- Content calendar
- Post scheduling with optimal time suggestions
- Engagement analytics
- A/B testing (Business plan)

## Current State: Pre-Launch

### Active Page
`/prelaunch` - Waitlist collection with urgency marketing:
- Countdown timer (7 days)
- "Only X spots left" scarcity
- 30% Founder's Discount offer
- Email collection → Mailchimp with "prelaunch" tag

### Post-Launch
Main landing page at `/` with full marketing sections:
- Hero, Features, Pricing, BYOK explanation, About, FAQ

## Design System

### Theme: Light & Modern (2026 design)
- **Primary:** Cyan/Blue gradient (`from-cyan-500 to-blue-600`)
- **Background:** White/Light gray (`bg-white`, `bg-slate-50`)
- **Text:** Slate scale (`text-slate-900`, `text-slate-600`)
- **Accents:** Emerald (success), Amber (warnings/BYOK)

### Key Design Patterns
- Rounded corners: `rounded-2xl` for cards
- Subtle shadows: `shadow-lg shadow-slate-200/50`
- Gradient text: `text-transparent bg-clip-text bg-gradient-to-r`
- Consistent spacing: `py-20 md:py-28` for sections

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/waitlist` | POST | Add email to Mailchimp waitlist |
| `/api/posts` | CRUD | Post management |
| `/api/media` | POST | Image upload/generation |

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=https://linkedgrow.ai

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Mailchimp
MAILCHIMP_API_KEY=xxx-us14
MAILCHIMP_AUDIENCE_ID=xxx
MAILCHIMP_SERVER_PREFIX=us14

# Resend (transactional email)
RESEND_API_KEY=re_...
```

## Important Notes

1. **useSearchParams Hook**: Must be wrapped in `<Suspense>` boundary (Next.js 16 requirement)
2. **Middleware**: Next.js 16 shows deprecation warning for middleware -> proxy migration pending
3. **Static Generation**: Pages using dynamic data need proper handling for SSG
4. **Stripe Price IDs**: Must be set in Vercel env vars for production checkout to work

## Code Style Rules

1. **No em dashes**: Never use em dashes (—) in any text or code. Use regular dashes with spaces ` - ` instead.
   - Wrong: `"no hidden costs—just results"`
   - Correct: `"no hidden costs - just results"`
2. **Contact email**: Use only `contact@linkedgrow.ai` for all contact references

## Founders

- **Nicolas Lecocq** - Founder & Developer (15+ years web dev, created OceanWP)
- **Maria Lecocq** - Operations & Community

Based in Montreux, Switzerland. LinkedGrow is a product of DigiHold.

## Related Projects

- **DigiHold** (https://digihold.me) - Parent company, WordPress products
