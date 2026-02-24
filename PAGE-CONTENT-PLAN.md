# LinkedGrow Page Content Plan

> Landing pages drive organic traffic AND convert visitors into signups. Each page targets a specific keyword, audience, or competitor comparison. The SEO Claw proposes new pages weekly and tracks which ones are missing.

---

## Page Types

Every page belongs to one of these 6 types. Do NOT create new types.

| Type | Path Pattern | Purpose |
|---|---|---|
| **Feature Pages** | `/features/*` | Showcase individual product features, rank for feature-specific keywords |
| **Audience Pages** | `/for/*` | Target specific user personas (coaches, agencies, etc.) |
| **Use Case Pages** | `/use-cases/*` | Target specific goals and outcomes |
| **Industry Pages** | `/industries/*` | Target specific verticals |
| **Comparison Pages** | `/vs/*` | Target competitor comparison keywords (highest buyer intent) |
| **Free Tools** | `/free-tools/*` | Drive traffic with genuinely useful free utilities |

---

## Writing Quality Standards

- **1,500+ words minimum** per page (feature/audience/use-case/industry)
- **Comparison pages: 2,000+ words** (these compete with detailed review content)
- **Free tools: 800+ words** of surrounding content (tool + context)
- Sound human, not AI - write like Nicolas explaining the product to a friend
- Varied sentence length, contractions, personal pronouns
- NO em dashes (use periods or commas instead)
- MAXIMUM 2-3 statistics per page - explain through value, not data dumps
- Every page must have an FAQ section with 3-5 questions + FAQJsonLd schema
- Every page must have a CTA (sign up / start free / try for free)

---

## Content Rules

1. Write in English first. All text must be translation-ready (next-intl)
2. Every page needs proper metadata: title, description, OG image, canonical
3. Include BreadcrumbJsonLd on every page
4. Include FAQJsonLd on every page with a FAQ section
5. 3+ internal links per page (features, blog posts, related pages)
6. First paragraph must mention "LinkedGrow" and the primary keyword
7. Comparison pages: NEVER trash competitors, focus on what makes LinkedGrow different
8. Free tools: the tool must actually work - no fake tools
9. Use the default OG image unless a custom one is generated

---

## COMPARISON PAGES (Highest Priority - Best ROI)

These pages target people actively looking to switch. Highest buyer intent of all page types.

---

### Comparison #1: LinkedGrow vs Taplio

**Target keyword:** "Taplio alternative" / "LinkedGrow vs Taplio"
**Search volume:** High (Taplio is the dominant player)
**Slug:** `/vs/taplio`
**Priority:** #1 - write first

**Internal links:**
- /pricing (primary)
- /features/bring-your-own-key
- /features/ai-post-generator
- Blog #10 (LinkedIn AI Tools Compared)
- Blog #4 (BYOK Explained)

**Content outline:**
- Why people look for Taplio alternatives (price, AI generation caps)
- Feature comparison table (LinkedGrow vs Taplio side by side)
- Pricing comparison: $49/month Taplio vs $19-39 + $2-4 API costs
- BYOK advantage: no generation limits vs Taplio's monthly cap
- Who should use which tool (fair, honest framing)
- FAQ: Is LinkedGrow cheaper than Taplio? Does LinkedGrow have all Taplio features?

---

### Comparison #2: LinkedGrow vs AuthoredUp

**Target keyword:** "AuthoredUp alternative" / "LinkedGrow vs AuthoredUp"
**Search volume:** Medium
**Slug:** `/vs/authoredup`
**Priority:** #2

**Internal links:**
- /pricing
- /features/ai-post-generator
- /features/analytics
- Blog #10 (LinkedIn AI Tools Compared)

**Content outline:**
- AuthoredUp overview (editor + analytics focus, $19.95/month)
- What AuthoredUp does well vs where it falls short
- LinkedGrow's advantages: BYOK, more AI models, scheduling
- Feature and pricing comparison table
- Who each tool is best for
- FAQ

---

### Comparison #3: LinkedGrow vs Supergrow

**Target keyword:** "Supergrow alternative" / "LinkedGrow vs Supergrow"
**Search volume:** Medium
**Slug:** `/vs/supergrow`
**Priority:** #3

**Internal links:**
- /pricing
- /features/bring-your-own-key
- /features/ai-post-generator
- Blog #4 (BYOK Explained)

**Content outline:**
- Supergrow overview ($29/month, AI-focused)
- Pricing comparison: Supergrow markup vs BYOK actual cost
- Feature comparison table
- LinkedGrow's unlimited generations advantage
- FAQ

---

### Comparison #4: LinkedGrow vs Buffer

**Target keyword:** "Buffer alternative for LinkedIn" / "LinkedGrow vs Buffer"
**Search volume:** High (Buffer has large brand recognition)
**Slug:** `/vs/buffer`
**Priority:** #4

**Internal links:**
- /pricing
- /features/post-scheduling
- /features/content-calendar
- /features/ai-post-generator

**Content outline:**
- Buffer as a general social media tool vs LinkedGrow as LinkedIn-specialist
- What Buffer lacks for LinkedIn: no AI generation, no voice training, no BYOK
- Feature comparison (scheduling, analytics, AI)
- Price comparison
- When to use Buffer vs LinkedGrow
- FAQ

---

### Comparison #5: LinkedGrow vs Hootsuite

**Target keyword:** "Hootsuite alternative LinkedIn" / "LinkedGrow vs Hootsuite"
**Search volume:** High
**Slug:** `/vs/hootsuite`
**Priority:** #5

**Internal links:**
- /pricing
- /features/ai-post-generator
- /for/solopreneurs
- /for/agencies

**Content outline:**
- Hootsuite's pricing problem ($99+/month for small users)
- Enterprise tool vs solo founder tool comparison
- LinkedGrow's LinkedIn-specific depth vs Hootsuite's breadth
- Feature comparison for LinkedIn use case specifically
- FAQ

---

## FEATURE PAGES

---

### Feature #1: AI Post Generator

**Target keyword:** "LinkedIn AI post generator" / "AI post writer LinkedIn"
**Search volume:** Very high
**Slug:** `/features/ai-post-generator`
**Priority:** #1

**Internal links:**
- /features/voice-training
- /features/hook-generator
- /features/bring-your-own-key
- /for/solopreneurs
- Blog #17 (AI Posts Without Sounding Robotic)

**Content outline:**
- How the AI post generator works (BYOK model)
- Which AI models are supported (OpenAI, Claude, Gemini, Grok, Perplexity)
- Voice training integration: why it sounds like you, not a robot
- Step-by-step walkthrough of generating a post
- FAQ: How many posts can I generate? Which AI model is best?

---

### Feature #2: Hook Generator

**Target keyword:** "LinkedIn hook generator" / "viral LinkedIn hooks tool"
**Search volume:** High
**Slug:** `/features/hook-generator`
**Priority:** #2

**Internal links:**
- /features/ai-post-generator
- /use-cases/thought-leadership
- /for/creators
- Blog #1 (LinkedIn Hooks Guide)

**Content outline:**
- What a LinkedIn hook is and why the first line decides everything
- How the Hook Generator works
- Hook formulas it uses (curiosity, challenge, story, data)
- Before/after examples
- FAQ

---

### Feature #3: Voice Training

**Target keyword:** "LinkedIn voice training AI" / "AI that writes like me LinkedIn"
**Search volume:** Medium
**Slug:** `/features/voice-training`
**Priority:** #3

**Internal links:**
- /features/ai-post-generator
- /for/coaches
- /for/agencies
- Blog #17 (AI Posts Without Sounding Robotic)
- Blog #13 (Ghostwriter Toolkit)

**Content outline:**
- The problem: AI posts that don't sound like you
- How Voice Training works: analyze your sample posts, extract patterns
- What it learns: sentence structure, vocabulary, tone, topics you avoid
- The result: AI drafts that need minimal editing
- FAQ: How many sample posts do I need? Can I update my voice over time?

---

### Feature #4: Post Scheduling

**Target keyword:** "LinkedIn post scheduler" / "schedule LinkedIn posts"
**Search volume:** Very high
**Slug:** `/features/post-scheduling`
**Priority:** #4

**Internal links:**
- /features/content-calendar
- /free-tools/linkedin-best-time-to-post
- /for/agencies
- Blog #3 (Best Time to Post)
- Blog #18 (Content Calendar)

**Content outline:**
- Why scheduling beats posting manually
- How LinkedIn scheduling works in LinkedGrow
- Optimal time recommendations
- Timezone support
- Direct LinkedIn publishing (no browser extension needed)
- FAQ

---

### Feature #5: Content Calendar

**Target keyword:** "LinkedIn content calendar tool" / "LinkedIn editorial calendar"
**Search volume:** High
**Slug:** `/features/content-calendar`
**Priority:** #5

**Internal links:**
- /features/post-scheduling
- /features/ai-post-generator
- /for/agencies
- Blog #18 (Content Calendar Planning)

**Content outline:**
- Visual calendar overview
- Drag-and-drop scheduling
- Bulk content planning
- Team collaboration on calendar (Business plan)
- FAQ

---

### Feature #6: Carousel Generator

**Target keyword:** "LinkedIn carousel generator" / "create LinkedIn carousel"
**Search volume:** High
**Slug:** `/features/carousel-generator`
**Priority:** #6

**Internal links:**
- /features/ai-image-generation
- /for/creators
- /for/agencies
- Blog #6 (Carousel Guide)

**Content outline:**
- Why carousels perform better on LinkedIn
- How the carousel generator works
- Templates and customization options
- Export and publish directly to LinkedIn
- FAQ

---

### Feature #7: BYOK - Bring Your Own Key

**Target keyword:** "bring your own API key LinkedIn tool" / "BYOK LinkedIn"
**Search volume:** Medium - growing
**Slug:** `/features/bring-your-own-key`
**Priority:** #7

**Internal links:**
- /pricing
- /features/ai-post-generator
- /for/solopreneurs
- Blog #4 (BYOK Explained)
- Blog #10 (LinkedIn AI Tools Compared)

**Content outline:**
- What BYOK means and why LinkedGrow built it this way
- Supported providers: OpenAI, Anthropic, Google, Grok, Perplexity
- Real cost comparison: $2-4/month vs $49/month competitors
- How to set up your API key (step by step)
- Privacy: your key, your data, no middleman
- FAQ

---

### Feature #8: Analytics Dashboard

**Target keyword:** "LinkedIn analytics tool" / "LinkedIn post analytics"
**Search volume:** High
**Slug:** `/features/analytics`
**Priority:** #8

**Internal links:**
- /features/ab-testing
- /for/creators
- /for/agencies
- Blog #14 (Analytics Guide)
- Blog #7 (Algorithm)

**Content outline:**
- What metrics LinkedGrow tracks
- Post performance: impressions, engagement rate, clicks, profile views
- Best time to post insights from your own data
- Advanced analytics (Business plan): trends, charts, CSV export
- FAQ

---

### Feature #9: Reddit to LinkedIn

**Target keyword:** "Reddit to LinkedIn content" / "repurpose Reddit for LinkedIn"
**Search volume:** Low-medium (zero competition)
**Slug:** `/features/reddit-to-linkedin`
**Priority:** #9

**Internal links:**
- /features/ai-post-generator
- /use-cases/content-repurposing
- /for/creators
- Blog #9 (Reddit to LinkedIn)

**Content outline:**
- Why Reddit is the best content inspiration source for LinkedIn
- How the Reddit Importer works
- Finding trending posts in your niche
- The transformation: Reddit thread to LinkedIn post
- FAQ

---

### Feature #10: AI Image Generation

**Target keyword:** "AI image generator LinkedIn posts" / "LinkedIn post image generator"
**Search volume:** Medium
**Slug:** `/features/ai-image-generation`
**Priority:** #10

**Internal links:**
- /features/carousel-generator
- /features/bring-your-own-key
- /for/creators

**Content outline:**
- Why visuals matter on LinkedIn
- Supported image AI providers: Google Imagen, OpenAI GPT Image, Replicate FLUX
- BYOK for images: pay actual API cost, no markup
- Image styles and formats for LinkedIn
- FAQ

---

### Feature #11: Engagement Tools

**Target keyword:** "LinkedIn engagement tool" / "LinkedIn automation engagement"
**Search volume:** Medium
**Slug:** `/features/engagement-tools`
**Priority:** #11

**Internal links:**
- /use-cases/social-selling
- /features/analytics
- /for/small-businesses
- Blog #20 (Social Selling)

**Content outline:**
- View LinkedIn feed inside LinkedGrow dashboard
- Like and comment on posts without leaving the app
- Smart engagement: target relevant posts in your niche
- Engagement as a growth strategy (the reciprocity effect)
- FAQ

---

### Feature #12: A/B Testing

**Target keyword:** "LinkedIn A/B testing tool" / "test LinkedIn post variations"
**Search volume:** Low-medium
**Slug:** `/features/ab-testing`
**Priority:** #12

**Internal links:**
- /features/analytics
- /for/enterprises
- Blog #15 (A/B Testing Guide)
- Blog #14 (Analytics)

**Content outline:**
- Why guessing what works on LinkedIn wastes money
- How LinkedGrow's A/B testing works
- What to test: hooks, CTAs, formats, length
- Reading your results and applying them
- FAQ

---

### Feature #13: Team Collaboration

**Target keyword:** "LinkedIn team collaboration tool" / "manage LinkedIn team content"
**Search volume:** Medium
**Slug:** `/features/team-collaboration`
**Priority:** #13

**Internal links:**
- /for/agencies
- /for/teams
- /features/content-calendar
- Blog #8 (Agency Guide)
- Blog #12 (Employee Advocacy)

**Content outline:**
- Role-based access: owner, admin, member
- Workflow: create, review, approve, publish
- Team content calendar
- Managing multiple LinkedIn accounts
- FAQ

---

## AUDIENCE PAGES

---

### Audience #1: For Solopreneurs

**Target keyword:** "LinkedIn tool for solopreneurs" / "solopreneur LinkedIn"
**Search volume:** Medium
**Slug:** `/for/solopreneurs`

**Internal links:**
- /features/ai-post-generator
- /features/bring-your-own-key
- /features/post-scheduling
- /pricing
- Blog #2 (Personal Branding)

**Content outline:**
- The solopreneur's LinkedIn challenge: time and budget
- How LinkedGrow fits the solopreneur workflow
- BYOK: why solopreneurs save the most ($2-4/month vs $49)
- Key features for solo use
- FAQ

---

### Audience #2: For Coaches and Consultants

**Target keyword:** "LinkedIn tool for coaches" / "LinkedIn for consultants"
**Search volume:** Medium
**Slug:** `/for/coaches`

**Internal links:**
- /features/voice-training
- /features/ai-post-generator
- /use-cases/lead-generation
- Blog #5 (LinkedIn for Coaches)
- Blog #11 (Posts That Generate Leads)

**Content outline:**
- Why LinkedIn is the #1 lead gen platform for coaches
- The challenge: staying consistent while running a practice
- Voice Training: sound like you, not like AI
- Lead generation content strategy for coaches
- FAQ

---

### Audience #3: For Content Creators

**Target keyword:** "LinkedIn tool for content creators" / "LinkedIn creator tools"
**Search volume:** Medium
**Slug:** `/for/creators`

**Internal links:**
- /features/hook-generator
- /features/carousel-generator
- /features/analytics
- Blog #1 (Hooks Guide)
- Blog #6 (Carousels)

**Content outline:**
- The creator economy on LinkedIn
- Consistency is king: how LinkedGrow helps creators post daily
- Hooks, carousels, analytics: the creator toolkit
- Growing from 0 to 10K followers with a system
- FAQ

---

### Audience #4: For Agencies

**Target keyword:** "LinkedIn management tool agencies" / "LinkedIn tool for marketing agencies"
**Search volume:** Medium
**Slug:** `/for/agencies`

**Internal links:**
- /features/team-collaboration
- /features/voice-training
- /features/content-calendar
- /pricing
- Blog #8 (Agency Guide)
- Blog #13 (Ghostwriter Toolkit)

**Content outline:**
- Managing multiple clients on LinkedIn: the agency challenge
- Why each client needs a unique voice (Voice Training per account)
- Team workflow: create, approve, schedule, publish
- BYOK for agencies: pass AI costs to clients transparently
- FAQ

---

### Audience #5: For Small Businesses

**Target keyword:** "LinkedIn tool small business" / "LinkedIn marketing small business"
**Search volume:** Medium
**Slug:** `/for/small-businesses`

**Internal links:**
- /features/ai-post-generator
- /features/bring-your-own-key
- /use-cases/lead-generation
- /pricing
- Blog #16 (LinkedIn for SaaS)

**Content outline:**
- LinkedIn as a sales and marketing channel for small businesses
- Budget-conscious: BYOK vs expensive tools
- From zero LinkedIn presence to consistent posting
- Lead generation for small business on LinkedIn
- FAQ

---

## USE CASE PAGES

---

### Use Case #1: Personal Branding

**Target keyword:** "LinkedIn personal branding tool" / "build personal brand LinkedIn"
**Slug:** `/use-cases/personal-branding`

**Internal links:**
- /features/voice-training
- /features/ai-post-generator
- /for/solopreneurs
- Blog #2 (Personal Branding Guide)

---

### Use Case #2: Lead Generation

**Target keyword:** "LinkedIn lead generation tool" / "generate leads LinkedIn"
**Slug:** `/use-cases/lead-generation`

**Internal links:**
- /features/engagement-tools
- /features/ai-post-generator
- /for/coaches
- Blog #11 (Posts That Generate Leads)
- Blog #20 (Social Selling)

---

### Use Case #3: Thought Leadership

**Target keyword:** "LinkedIn thought leadership" / "thought leader LinkedIn tool"
**Slug:** `/use-cases/thought-leadership`

**Internal links:**
- /features/ai-post-generator
- /features/hook-generator
- /for/solopreneurs
- Blog #2 (Personal Branding)

---

### Use Case #4: Content Repurposing

**Target keyword:** "repurpose content for LinkedIn" / "LinkedIn content repurposing tool"
**Slug:** `/use-cases/content-repurposing`

**Internal links:**
- /features/reddit-to-linkedin
- /features/ai-post-generator
- /for/creators
- Blog #9 (Reddit to LinkedIn)

---

### Use Case #5: Social Selling

**Target keyword:** "social selling LinkedIn tool" / "LinkedIn social selling platform"
**Slug:** `/use-cases/social-selling`

**Internal links:**
- /features/engagement-tools
- /features/analytics
- /for/small-businesses
- Blog #20 (Social Selling)

---

### Use Case #6: Employee Advocacy

**Target keyword:** "LinkedIn employee advocacy platform" / "employee advocacy tool"
**Slug:** `/use-cases/employee-advocacy`

**Internal links:**
- /for/teams
- /features/team-collaboration
- /features/content-calendar
- Blog #12 (Employee Advocacy)

---

## INDUSTRY PAGES

---

### Industry #1: SaaS

**Target keyword:** "LinkedIn tool for SaaS companies" / "SaaS LinkedIn marketing"
**Slug:** `/industries/saas`

**Internal links:**
- /features/ai-post-generator
- /features/analytics
- /for/small-businesses
- Blog #16 (LinkedIn for SaaS)

---

### Industry #2: Real Estate

**Target keyword:** "LinkedIn for real estate agents" / "real estate LinkedIn tool"
**Slug:** `/industries/real-estate`

**Internal links:**
- /features/ai-post-generator
- /features/post-scheduling
- /for/solopreneurs
- Blog #19 (LinkedIn for Real Estate)

---

### Industry #3: Finance and Fintech

**Target keyword:** "LinkedIn for finance professionals" / "financial advisor LinkedIn tool"
**Slug:** `/industries/finance`

**Internal links:**
- /features/voice-training
- /features/ai-post-generator
- /for/solopreneurs

**Content outline:**
- Compliance-conscious content creation for finance
- Building trust and authority on LinkedIn in financial services
- How Voice Training maintains your professional tone
- FAQ

---

### Industry #4: Consulting

**Target keyword:** "LinkedIn for consultants" / "consultant LinkedIn marketing tool"
**Slug:** `/industries/consulting`

**Internal links:**
- /features/voice-training
- /use-cases/thought-leadership
- /for/coaches
- Blog #5 (LinkedIn for Coaches)

---

## FREE TOOLS

---

### Free Tool #1: Best Time to Post on LinkedIn

**Target keyword:** "best time to post on LinkedIn" / "LinkedIn posting time calculator"
**Search volume:** Very high
**Slug:** `/free-tools/linkedin-best-time-to-post`
**Priority:** #1 - highest traffic potential of all free tools

**Internal links:**
- /features/post-scheduling
- /features/content-calendar
- Blog #3 (Best Time to Post)

**What it does:** Input your industry and target audience timezone, get recommended posting windows with engagement data.

---

### Free Tool #2: LinkedIn Post Character Counter

**Target keyword:** "LinkedIn character counter" / "LinkedIn post length checker"
**Search volume:** High
**Slug:** `/free-tools/linkedin-character-counter`
**Priority:** #2

**Internal links:**
- /features/ai-post-generator
- /features/hook-generator
- Blog #1 (Hooks Guide)

**What it does:** Real-time character counter for LinkedIn posts with "see more" cutoff indicator (showing exactly where LinkedIn truncates the preview).

---

### Free Tool #3: LinkedIn Headline Generator

**Target keyword:** "LinkedIn headline generator" / "LinkedIn headline examples"
**Search volume:** High
**Slug:** `/free-tools/linkedin-headline-generator`
**Priority:** #3

**Internal links:**
- /features/ai-post-generator
- /features/voice-training
- /use-cases/personal-branding

**What it does:** Input your role, industry, and value proposition, get 5 LinkedIn headline variations. Requires no account.

---

### Free Tool #4: LinkedIn Engagement Rate Calculator

**Target keyword:** "LinkedIn engagement rate calculator" / "LinkedIn post engagement rate"
**Search volume:** Medium
**Slug:** `/free-tools/linkedin-engagement-rate-calculator`
**Priority:** #4

**Internal links:**
- /features/analytics
- Blog #14 (Analytics Guide)
- Blog #7 (Algorithm)

**What it does:** Input impressions, likes, comments, shares - get engagement rate, benchmark comparison by industry, and tips to improve.

---

## Publishing Priority

**Tier 1 - Comparison pages first (highest buyer intent):**
1. /vs/taplio
2. /vs/authoredup
3. /vs/supergrow
4. /vs/buffer
5. /vs/hootsuite

**Tier 2 - Core feature pages (highest traffic keywords):**
6. /features/ai-post-generator
7. /features/post-scheduling
8. /features/bring-your-own-key
9. /features/hook-generator
10. /features/voice-training

**Tier 3 - Free tools (traffic magnets):**
11. /free-tools/linkedin-best-time-to-post
12. /free-tools/linkedin-character-counter
13. /free-tools/linkedin-headline-generator

**Tier 4 - Audience + use case pages:**
14. /for/solopreneurs
15. /for/coaches
16. /for/creators
17. /for/agencies
18. /use-cases/personal-branding
19. /use-cases/lead-generation
20. /use-cases/social-selling

**Tier 5 - Remaining feature, industry, use case pages**

---

## SEO Claw Instructions

When the SEO Claw proposes new pages each week:

1. **Check this file first** - never propose a page already listed here
2. **Check the sitemap** (`linkedgrow.ai/sitemap.xml`) - never propose a page that already exists on the live site
3. **Propose pages from Tier 1 first** - comparison pages have the highest ROI
4. **Each proposal must include:** target keyword, estimated search volume, slug, 3 internal links, brief content outline
5. **Maximum 3 page proposals per week** - quality over quantity, each page takes real dev time to build
6. **When a page is built and live:** add a note `[LIVE - /slug]` next to the entry. Do not remove entries.
7. **When all Tier 1-3 pages are live:** research 20 new high-potential page ideas and present to Nicolas for approval before adding to this file

---

## When All Planned Pages Are Done

When all pages in Tiers 1-5 are marked `[LIVE]`:

1. Announce: "All planned pages are live. Researching new opportunities..."
2. Research 20 new page ideas: new comparison targets, emerging use cases, new industries, new free tools
3. Present to Nicolas for approval
4. Once approved, add to this file under new Tier 6+
5. Never remove completed entries - the file is the full history
