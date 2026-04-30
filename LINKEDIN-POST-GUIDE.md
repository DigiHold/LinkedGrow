# LinkedIn Post Writing Guide

> **MANDATORY: Follow this guide every time the user says "write linkedin".**

---

## Step 1: Determine Today's Format

Check today's day of the week and pick the format:

| Day | Format | Image |
|-----|--------|-------|
| Monday | Authority | AI generated (Banana Pro) |
| Tuesday | Carousel | NO image gen. Generate HTML slides + text-only post on LinkedGrow |
| Wednesday | Lead Magnet | AI generated (Banana Pro) |
| Thursday | Hot Take | AI generated (Banana Pro) |
| Friday | Blog Promotion | Use article's existing featured WebP from R2 |

If it's Saturday or Sunday, ask the user which format they want.

---

## Step 2: Check Existing Posts (Dedup)

Fetch all existing posts to avoid duplicate topics:

```bash
curl -s "https://linkedgrow.ai/api/v1/posts?status=published&limit=100" -H "Authorization: Bearer REMOVED"
curl -s "https://linkedgrow.ai/api/v1/posts?status=scheduled&limit=100" -H "Authorization: Bearer REMOVED"
```

Extract:
1. **All post topics** — one-line summary of each post's main topic
2. **All blog URLs in first comments** — for Friday blog promo dedup
3. **All scheduled dates** — to avoid scheduling on a date that already has a post
4. **Latest scheduled date** — to determine the next available slot

**Your new post MUST NOT cover the same topic as any existing post.**

---

## Step 3: Web Research

Use WebSearch to find fresh, current angles. Run ALL searches for the day's format:

### Authority (Monday)
- "AI tools founders are using right now [current month] [current year]"
- "AI automation real results case study [current month] [current year]"
- "solo founder AI workflow scaling [current month] [current year]"
- "Claude AI practical use cases business [current month] [current year]"

### Carousel (Tuesday)
- "LinkedIn growth tactics [current month] [current year]"
- "AI content workflow automation founders [current month] [current year]"
- "LinkedIn carousel best practices engagement [current year]"

### Lead Magnet (Wednesday)
~70% of the time, focus on getting leads with AI/Claude. ~30% of the time, go with whatever's trending.
- "getting leads with Claude AI [current month] [current year]"
- "AI lead generation strategy founders [current month] [current year]"
- "trending AI tools automation [current month] [current year]"
- "viral LinkedIn growth hack AI [current month] [current year]"

### Hot Take (Thursday)
- "controversial AI opinion debate [current month] [current year]"
- "AI replacing jobs founders hiring debate [current month] [current year]"
- "biggest AI news this week debate"
- "AI startup drama funding controversy [current month] [current year]"

### Blog Promotion (Friday)
- Fetch the RSS feed: use WebFetch on `https://linkedgrow.ai/blog/feed.xml`
- Pick the latest article NOT in the existing blog URLs blacklist
- Search for related trending context to frame the promotion

**Use WebFetch to scrape 2-3 interesting results for concrete data, numbers, and angles.**

---

## Step 4: Write the Post

### Nicolas — Who You Write As

Nicolas Lecocq. French dev, lives in Switzerland. 15+ years coding. Built OceanWP (500K+ installs, $1.5M+), lost it all from bad spending, building back with LinkedGrow + Maria.

**Voice:** Direct, no-bullshit, self-deprecating humor. Use contractions. Sound like a real person talking.

**Expertise areas:**
- AI Agents & Tools — Uses OpenClaw (multi-agent framework) to run 15+ agents. **NEVER say Nicolas built or created OpenClaw. He USES it.**
- LinkedIn Growth — Building LinkedGrow (LinkedIn content platform)
- SaaS Building — Built OceanWP ($1.5M+), now LinkedGrow with BYOK model
- AI-Powered Lead Gen — Uses AI agents for outreach, email, prospecting
- Content at Scale — Uses AI across LinkedIn, X, Reddit, blog, SEO

**NEVER invent biographical facts.** Only use facts listed above.
**NEVER say** "12-hour shifts" for the bakery. Just say "waking up at 4am" and "minimum wage".

### LinkedGrow Features (Weave Naturally Into Posts)

| Feature | What it does | Post angle |
|---------|-------------|-----------|
| Reddit to LinkedIn | Paste Reddit URL, turns thread into LinkedIn post | "I find trends on Reddit before they hit LinkedIn" |
| YouTube to LinkedIn | Paste YouTube URL, extracts key points | "One YouTube video = 3 LinkedIn posts" |
| AI Post Generator | Creates posts in your voice | "A week of content in 30 minutes" |
| Hook Generator | 10+ scroll-stopping hooks per topic | "Your post dies because of line 1" |
| Carousel Generator | Multi-slide carousel posts | "Carousels get 3x engagement" |
| Voice Training | AI learns your style (99% accuracy) | "My AI writes exactly like me" |
| Virality Scoring | Predicts engagement (91% accurate) | "I know which posts flop BEFORE publishing" |
| BYOK | Own API key, $2-4/month vs $49-79/month | "You're paying $49/month for 100 AI gens. I pay $3 for unlimited." |

**NEVER lead with the product. Lead with the problem and value. LinkedGrow is the punchline, not the headline.**

---

## Format Structures

### Authority (Monday) — 1300-1700 chars

```
[HOOK — Lines 1-2] Specificity framework. Real numbers. Surprising finding.

[AGITATION — Lines 3-5] Wrong assumptions most people make.

[SHIFT — Lines 6-8] Your insight that changes the picture.

[EVIDENCE — Lines 9-16] 3-5 → findings with specific metrics.

[TAKEAWAY — Lines 17-20] 2-3 → actionable arrows.

[CTA — Final line] Emoji + question.
```

**What makes a GREAT authority post:** Practical setups people can copy, real costs, real results. "Would a founder screenshot this and send it to a friend?"
**What makes a SHIT authority post:** Generic model comparisons, news recaps nobody cares about, abstract industry analysis.

### Carousel (Tuesday) — Companion 800-1600 chars + 8 slides (15-25 words each)

```
[COMPANION POST]
[HOOK — Lines 1-2]
[BODY — Why this matters + what's in the slides]
[CTA — "Save this" or question]

[SLIDES]
Slide 1 (Cover): 6-8 word headline
Slides 2-7: Step/tip with 15-25 words each
Slide 8 (CTA): Save + follow + "Founder of LinkedGrow.ai"
```

### Lead Magnet (Wednesday) — 1300-1800 chars

```
[HOOK — Lines 1-2] Specific number + result. Must create instant "I need this" reaction.

[AGITATION — Lines 3-5] The painful manual way.

[VALUE DUMP — Lines 6-16] 5-8 → arrows with REAL, actionable tactics.
NOT "→ Use AI for prospecting" (vague)
YES "→ Feed Claude your ICP description and ask it to build Boolean search strings for LinkedIn Sales Nav, then run 3 variations" (specific)
EVERY tactic MUST be real and actually doable. People will try this.

[BRIDGE — Lines 17-18] "I turned this into a full playbook with the exact prompts, templates, and workflows."

[CTA — Lines 19-22]
"👇 Comment [KEYWORD] and I'll DM it to you."
""
"♻️ Repost this to help others, and you'll get it first."
```

**Keyword:** ONE word, ALL CAPS, relates to the resource. Examples: LEADS, PROSPECT, OUTREACH, STACK, PROMPTS.

### Hot Take (Thursday) — 1200-1600 chars

```
[HOOK — Lines 1-2] Contrarian or Negative Bias. NEVER start with "I".

[AGITATION — Lines 3-6] What everyone does wrong. Name the company/event.

[SHIFT — Lines 7-10] Your contrarian take. New Way vs Old Way.

[EVIDENCE — Lines 11-16] 3-4 → proof points with numbers or named companies.

[TAKEAWAY — Lines 17-20] Reframe or 2-3 → arrows.

[CTA — Final line] Emoji + debate question that forces a position.
```

**GREAT hot take:** Splits the room. At least 30% of readers should disagree. "Hiring a social media manager in 2026 is like hiring a typist in 2005."
**SHIT hot take:** Everyone agrees. "AI is changing everything." "Most founders are sleeping on AI."

### Blog Promotion (Friday) — 1200-1800 chars

```
[HOOK — Lines 1-2] Tied to the article topic. Must stand alone as valuable.

[BODY — Lines 3-16] Extract 3-5 key insights from the article as → bullets.
Deliver real value from the article. NOT just a teaser.

[CTA — Final lines] Emoji + question related to the article topic.
```

**Post body: ZERO URLs.** The article link goes in the first comment ONLY.

---

## Post Ideas Bank

Use these as inspiration when picking topics. Combine with fresh web research to make them current. Adapt the hook to fit the day's format.

### Theme 1: AI Authority (Position Nicolas as ahead of the curve)

| Idea | Hook | Best format |
|------|------|-------------|
| 3 practical AI use cases for lead gen that actually work | "Most founders are using AI wrong." | Authority |
| How to create AI agents with OpenClaw (beginner breakdown) | "This will replace 5+ hours of your weekly work." | Carousel |
| Top AI tools founders are quietly using in 2026 | "If you're not using these, you're behind." | Authority, Carousel |
| How I automated a repetitive task using AI (real results) | "This saved me X hours/week." | Authority |
| 5 mistakes people make when building AI agents | "Avoid these or you'll waste weeks." | Carousel |
| AI stack for founders in 2026 (minimal, powerful) | "Minimal. Powerful." | Carousel |
| The exact prompts I use daily | "Copy-paste these into Claude right now." | Lead Magnet |
| Behind the scenes: my full AI setup | "15 agents, $47/month." | Authority |

### Theme 2: Lead Generation with AI

| Idea | Hook | Best format |
|------|------|-------------|
| How to use AI agents to generate leads while you sleep | "No ads. No outreach burnout." | Lead Magnet |
| Build your first AI lead-gen agent (simple framework) | "You can set this up in 30 minutes." | Carousel, Lead Magnet |
| 3 real-world examples of AI driving revenue for small businesses | "These are not theories." | Authority |
| Why most lead generation strategies fail in 2026 | "And what's replacing them." | Hot Take |
| AI workflows every consultant should automate | "Start with these 5." | Carousel |
| The exact AI outreach stack that sends personalized emails at scale | "41 got replies out of 200." | Lead Magnet |
| Cold email is dead. What replaced it. | "My AI agent books 3 calls a day." | Hot Take |

### Theme 3: Differentiation (Stand Out Using AI)

| Idea | Hook | Best format |
|------|------|-------------|
| Your competitors are using AI, but they're all doing the same thing | "Here's how to stand out." | Hot Take |
| Why personal branding will shift from "you" to "AI-you" | "Most people aren't ready for this." | Hot Take |
| How AI changes the solo founder advantage | "1-person business with AI vs 10-person team without it." | Authority |
| I replaced my $2,000/month SaaS stack with 4 AI prompts | "Here's the exact setup." | Lead Magnet |
| Tools I stopped using after discovering this AI workflow | "Killed 6 subscriptions in one week." | Authority, Carousel |

### Theme 4: Scaling Without Hiring

| Idea | Hook | Best format |
|------|------|-------------|
| How AI agents help you scale without hiring | "Your next 'employee' isn't human." | Authority |
| How founders are building "AI teams" instead of hiring | "This changes the hiring equation completely." | Hot Take |
| Your first AI team: 5 agents you should build | "Lead gen, content, support, research, ops." | Carousel |
| Solo founder with AI vs 10-person team without it | "The numbers might surprise you." | Authority |
| From overwhelmed to optimized: AI workflow blueprint | "Clarity in 5 slides." | Carousel |

### Theme 5: Viral / Trending Hooks (Use Anytime)

These are proven high-engagement angles. Plug them into any format when you need a spike:

- "I replaced X hours of work with 1 AI agent"
- "Solo founder? Here's your unfair advantage with AI"
- "The exact prompts I use daily"
- "AI vs human teams: what's actually better?"
- "What I'd do if I had to grow from 0 using AI today"
- "Biggest AI shifts this month (what to pay attention to)"
- "AI won't replace you. But founders using AI will."
- "I tested X for 30 days. Here's the data."
- "Everyone is talking about AI but few are actually using it to get clients."
- "Your hiring process is designed to fail in 2026."

### How to Use This Bank

1. **Check existing posts first** (Step 2) — don't repeat a topic already covered
2. **Pick an idea** that matches today's format AND the freshest web research
3. **Adapt the hook** — never copy-paste these hooks directly, they're starting points. Make them more specific with real numbers from your research
4. **Combine with trending context** — the best posts take a proven idea and tie it to something current

---

## First Comment Rules

Every post MUST have a first comment (1-3 sentences).

| Format | First comment contains |
|--------|----------------------|
| Authority | A deeper data point or behind-the-scenes detail. ZERO URLs. |
| Carousel | A bonus tip that didn't make the slides. ZERO URLs. |
| Lead Magnet | Reinforces the DM offer + extra insight. ZERO URLs. |
| Hot Take | Proof, nuance, or counterpoint. ZERO URLs. |
| Blog Promotion | Extra value + article URL. This is the ONLY format with a URL. |

**BANNED in first comments:**
- "Pro tip:" or "Bonus tip:" or any label prefix
- "The part I didn't mention:" or any variation
- "Link in the first comment" / "Check the first comment"
- All writing rules below apply to first comments too

---

## Writing Rules — ANTI-AI SLOP

**THE GOLDEN RULE: After any sentence under 8 words, the NEXT sentence MUST be at least 15 words. No exceptions.**

**CRITICAL: NEVER write standalone sentences under 6 words for dramatic emphasis.** Merge them into surrounding text.

**NEVER use these AI patterns:**
- "Not X. It's Y." / "It's not about X, it's about Y." (negative parallelism)
- "The X? A Y." / "The result? Complete failure." (self-answered rhetorical questions)
- "No X. No Y. Just Z." (dramatic countdown)
- "X. Period." (fragment + period)
- Strings of 2-5 word sentences in a row

**BAD → GOOD examples:**

BAD: `The first months were silent. A few hundred downloads. Crickets.`
GOOD: `The first months were almost completely silent, just a few hundred downloads and crickets in the forums while I waited for something to happen.`

BAD: `No bootcamp. No courses. Just YouTube.`
GOOD: `I didn't do any bootcamp or courses, just YouTube tutorials and reading other people's code until things clicked.`

BAD: `It's not about posting more. It's about posting better.`
GOOD: `The solution isn't posting more but posting content that's actually worth stopping for.`

BAD: `The result? A complete transformation.`
GOOD: `The result was a complete transformation of how we approached content.`

### Hook Rules

- Line 1: 4-8 words, under 50 chars. One short declarative sentence.
- Line 2: Under 60 chars. Creates an open loop. NO blank line between line 1 and 2.
- Line 1 + Line 2: Under 200 chars total.
- After line 2, add a BLANK LINE before the body.
- NO questions as openers ("Did you know?")
- NO labels ("Here's how to...", "5 tips for...")
- NO "excited to share"
- Must sound human, not like a marketer

### CTA Rules

- ONE CTA per post. Never stack multiple.
- 1-3 lines max.
- Add a context-appropriate emoji before the CTA line.
- CTA must connect to the value delivered (Earned Ask Principle).

| Format | CTA type |
|--------|----------|
| Authority | Question |
| Carousel | Question + "Save this" on CTA slide |
| Lead Magnet | Handraiser ALWAYS ("Comment [KEYWORD] and I'll DM it") |
| Hot Take | Debate question forcing a position |
| Blog Promo | Question related to article |

### Absolute Rules Table

| Rule | Details |
|------|---------|
| No staccato stacks | NEVER 2+ short sentences (under 8 words) in a row |
| No mic-drop fragments | NEVER standalone sentences under 6 words for emphasis |
| No negative parallelism | NEVER "Not X. It's Y." patterns |
| No self-answered questions | NEVER "The X? A Y." patterns |
| Vary sentence length | In every 5 sentences: at least one under 8 words AND one over 20 words |
| Contractions always | "I'd", "didn't", "it's". Never "I would", "did not" |
| No banned words | Never: delve, leverage, robust, pivotal, seamless, cutting-edge, revolutionary, groundbreaking, transformative, unprecedented, empower, unlock, harness, showcase, game-changer, disrupt, streamline, crucial, innovative, dynamic, resonate, navigate, testament, foster, landscape, elevate, unleash, tapestry, utilize, synergy |
| No banned phrases | Never: "here's the thing", "let that sink in", "read that again", "the truth is", "here's what nobody tells you", "in today's", "it's not about X, it's about Y", "in conclusion", "furthermore", "moreover", "additionally", "let's talk about", "I'm excited to share", "in today's world", "link in the first comment", "check the first comment", "see the first comment" |
| No engagement bait | Never: "Comment YES", "Like if you agree", "Tag someone" |
| Bar Test | Every sentence: would you say this out loud at a bar? |
| Current year is 2026 | NEVER reference 2024 or 2025 as current year |
| Only claim real things | NEVER claim AI can do things it can't. Every tactic must be actually doable. |
| No em dashes | NEVER use — (em dash). Use comma or period instead |
| No separators | No ───, no ---, no ***. Blank lines only |
| Specificity | NOT "many months" but "five months". NOT "lost money" but "burned through $500K" |
| White space | Blank line between every 1-3 sentences. Mobile-first |
| One idea per post | Each post covers ONE topic |

---

## Step 5: Self-Check

Before showing the post, scan for ALL of these. If ANY violation, rewrite that section:

1. Em dashes (—) → replace with comma or period
2. Banned words → rewrite the sentence
3. Two short sentences in a row → merge with "and", "but", "which", "because"
4. "Not X. It's Y." pattern → rewrite as one sentence
5. "The X? Y." self-answered question → rewrite
6. Year wrong → must be 2026
7. Fragment under 6 words → merge into surrounding sentence
8. Char count within range for the format
9. Hook under 200 chars total (line 1 < 50, line 2 < 60)
10. First comment follows ALL the same rules

---

## Step 6: Show Post & Wait for Approval

Output the post in this format:

```
📅 [DAY] — [Format]
Will be saved as: Draft

---

[COMPLETE POST TEXT]

---

First Comment:
[COMPLETE FIRST COMMENT TEXT]

---

[For carousel only: slide texts]
```

Then ask: "Approve, edit, or reject?"
- If user wants changes → rewrite and show again
- If user approves → proceed to Step 7

---

## Step 7: Generate Image

### For Authority, Lead Magnet, Hot Take (AI-generated image)

**7a. Write image prompt** following these rules (same as LinkedGrow's generate-image-prompt system):
- 300-450 words, extremely detailed
- "Professional editorial photograph, photorealistic documentary style, landscape 16:9 format"
- Include: specific measurements, precise ages, exact products, detailed clothing, camera specs (35mm lens at f/2.0), lighting setup, spatial relationships, color specifics, texture details, background, composition rules, atmosphere
- The image must be SPECIFIC to this post's content. Someone should guess the topic from the image alone.
- Forbes/Wired/Harvard Business Review aesthetic
- Return ONLY the prompt text

**7b. Generate image** using the blog image generation script approach:

```bash
cd /Users/nicolas/Documents/GitHub/linkedgrow && node -e "
const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
const fs = require('fs');
const ai = new GoogleGenAI({ apiKey: 'REMOVED' });

(async () => {
  const prompt = fs.readFileSync('/tmp/linkedin-image-prompt.txt', 'utf8');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: { imageConfig: { aspectRatio: '16:9', imageSize: '1K' } }
  });
  const candidate = response.candidates[0];
  if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
    console.error('Image blocked:', candidate.finishReason);
    process.exit(1);
  }
  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      const buf = Buffer.from(part.inlineData.data, 'base64');
      const webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
      fs.writeFileSync('/tmp/linkedin-post-image.webp', webp);
      console.log('Image saved to /tmp/linkedin-post-image.webp');
      return;
    }
  }
  console.error('No image data in response');
  process.exit(1);
})();
"
```

Show the generated image path to the user so they can preview it.

### For Carousel (HTML slides)

Generate a single HTML file with all slides. Save to `/Users/nicolas/Downloads/linkedin-carousel-YYYY-MM-DD.html`.

Design specs:
- Each slide: 1080x1350px (LinkedIn carousel size)
- Background: white
- Primary color: #00b8db (teal/cyan)
- Secondary color: #155dfc (blue)
- Clean modern typography (system fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)
- Cover slide: bold headline + "Nicolas Lecocq" + "Founder of LinkedGrow.ai"
- Content slides: slide number, headline, body text
- CTA slide: "Save this post" + "Follow for more" + "Nicolas Lecocq | Founder of LinkedGrow.ai"
- Each slide as a separate div with page-break-after for easy screenshotting

Tell the user: "Carousel HTML saved to [path]. Open it in a browser to preview, then create the carousel in LinkedGrow."

### For Blog Promotion (existing image)

Get the featured WebP URL from the RSS feed data (already fetched in Step 3). Download it:

```bash
curl -s -o /tmp/linkedin-blog-image.webp "FEATURED_WEBP_URL_FROM_RSS"
```

---

## Step 8: Save as Draft on LinkedGrow

Save the post as a **draft**. The user will schedule it manually.

### Posts with AI-generated image (Authority, Lead Magnet, Hot Take)

```bash
IMAGE_BASE64=$(base64 -i /tmp/linkedin-post-image.webp)
curl -s -X POST "https://linkedgrow.ai/api/v1/posts" \
  -H "Authorization: Bearer REMOVED" \
  -H "Content-Type: application/json" \
  -d '{"content": "POST_TEXT", "status": "draft", "firstComment": "COMMENT_TEXT", "mediaData": {"base64": "data:image/webp;base64,'"$IMAGE_BASE64"'"}}'
```

### Posts with blog featured image (Blog Promotion)

```bash
IMAGE_BASE64=$(base64 -i /tmp/linkedin-blog-image.webp)
curl -s -X POST "https://linkedgrow.ai/api/v1/posts" \
  -H "Authorization: Bearer REMOVED" \
  -H "Content-Type: application/json" \
  -d '{"content": "POST_TEXT", "status": "draft", "firstComment": "COMMENT_TEXT", "mediaData": {"base64": "data:image/webp;base64,'"$IMAGE_BASE64"'"}}'
```

### Carousel (text only, no image)

```bash
curl -s -X POST "https://linkedgrow.ai/api/v1/posts" \
  -H "Authorization: Bearer REMOVED" \
  -H "Content-Type: application/json" \
  -d '{"content": "COMPANION_POST_TEXT", "status": "draft", "firstComment": "COMMENT_TEXT"}'
```

### After saving, show:

```
✅ Post saved as draft!
Format: [format]
Post ID: [id from API response]
LinkedGrow: https://linkedgrow.ai/dashboard/editor?edit=[post_id]
[For carousel: "Add your carousel slides in the LinkedGrow editor"]
```

---

## Step 9: Generate X (Twitter) Version

After every LinkedIn post is saved as draft, generate ONE X version that the user can copy-paste.

### Hard rules

- 280 chars MAX (count strictly, including spaces and emojis)
- ONE core idea, ONE hook
- No hashtags (dead for organic growth on X)
- No "Comment KEYWORD" CTA (X DMs are restricted, doesn't work)
- No em dashes, no AI slop, same Anti-AI Slop rules from Step 4
- Same Nicolas voice: direct, contractions, self-deprecating, sound like a real person
- No links in body unless Blog Promo (X doesn't penalize links the way LinkedIn does, but inline links eat chars)

### Format mapping

| LinkedIn Format | X Version Strategy |
|---|---|
| Authority (Mon) | Hook + biggest specific data point + one-line takeaway. Numbers > narrative. |
| Carousel (Tue) | Hook from cover slide + the single sharpest insight. No "save this". |
| Lead Magnet (Wed) | Hook + value tease + "Reply with [KEYWORD], I'll send the playbook". X DMs work via reply-then-DM only. |
| Hot Take (Thu) | The full opinion punch + one supporting line. X is home turf for hot takes, deliver it complete. |
| Blog Promo (Fri) | Hook + 1-line tease + blog URL. URL counts toward 280 chars (~23 chars for short URL). |

### Output format

Show the X version below the LinkedIn draft success message:

```
🐦 X version (280 chars max, copy-paste ready):

[X POST TEXT]

Char count: [N]/280
```

### Self-check before showing

1. Char count strict (≤280)
2. No em dashes
3. No banned words (delve, leverage, robust, etc. — full list in Step 4)
4. No hashtags
5. No "Comment X" CTA
6. Sounds like Nicolas, not a marketer
7. Bar Test: would you say this out loud at a bar?
