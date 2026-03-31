# r/WTFisAI Post Writing Guide

> **MANDATORY: Follow this guide every time the user says "write reddit".**

---

## Step 0A: SCAN TRENDING SUBREDDITS (BLOCKING — do this BEFORE topic research)

**Before researching AI news, scan these subreddits for trending/hot topics using RSS feeds to find what real people actually care about:**

```bash
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "https://www.reddit.com/r/SUBREDDIT/hot/.rss?limit=10" | python3 -c "
import sys, xml.etree.ElementTree as ET
ns = {'atom': 'http://www.w3.org/2005/Atom'}
data = sys.stdin.read()
root = ET.fromstring(data)
for e in root.findall('atom:entry', ns)[:10]:
    t = e.find('atom:title', ns)
    if t is not None: print(t.text)
"
```

**AI/Tech:** r/ChatGPT, r/artificial, r/AiAutomations, r/ClaudeAI, r/Anthropic, r/OpenAI, r/ArtificialIntelligence, r/LocalLLaMA

**Business/Startup:** r/SaaS, r/startups, r/smallbusiness, r/SaaSSales, r/Startup_Ideas, r/SideProject, r/EntrepreneurRideAlong, r/buildinpublic, r/indiehackers, r/micro_saas, r/microsaas, r/saasbuild, r/juststart, r/sidehustle

**LinkedIn/Marketing:** r/linkedin, r/socialmedia, r/SEO, r/digital_marketing, r/DigitalIncomePath, r/passive_income

**What to look for:** Recurring themes, heated debates, high-engagement topics. Pick topics that intersect AI with money, jobs, side hustles, or practical tools. Avoid dry corporate/industry news that only VCs care about. The best r/WTFisAI posts come from topics that are already blowing up in other communities.

---

## Step 0B: FETCH EXISTING POSTS (BLOCKING — do this BEFORE anything else)

**STOP. Before you search for trending topics, before you do ANYTHING, you MUST fetch the current r/WTFisAI posts. This is not optional. Do NOT proceed to Step 1 until this is done.**

**WebFetch CANNOT access reddit.com. You MUST use this Bash curl command instead:**

```bash
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "https://www.reddit.com/r/WTFisAI/new/.rss?limit=30" | python3 -c "
import sys, xml.etree.ElementTree as ET
ns = {'atom': 'http://www.w3.org/2005/Atom'}
data = sys.stdin.read()
root = ET.fromstring(data)
for e in root.findall('atom:entry', ns):
    t = e.find('atom:title', ns)
    u = e.find('atom:updated', ns)
    if t is not None:
        date = u.text[:10] if u is not None and u.text else 'unknown'
        print(f'[{date}] {t.text}')
"
```

This will print all recent post titles with dates. From the results, extract and write down:
1. **Every post title** from the last 7 days
2. **Every topic/subject** covered (e.g., "Manus AI agent", "ChatGPT vs Claude", "AI costs")

Save this list. You will check EVERY topic idea against it. **If a topic has already been covered in any recent post, you CANNOT write about it. Pick something else.**

This prevents duplicate posts when Nicolas runs "write reddit" multiple times in a row.

---

## Step 1: Check Today's Format

Check if today is a specific weekly thread day:

| Day | Recurring Format | Flair |
|-----|-----------------|-------|
| Wednesday | "Show What You Built This Week" OR free vs paid comparison | Weekly Thread |
| Sunday | "WTF is Going On? Sunday" (weekly AI news + ask anything) | Weekly Thread |

If today is Wednesday or Sunday AND the weekly thread hasn't been posted yet, write that format. Every other day, pick a standalone post: trending topic, tool review/recommendation, or practical advice. Use the best angle from your subreddit scan and research (Step 2).

---

## Step 2: Research Trending AI Topics

**CHECKPOINT: Do you have the list of existing r/WTFisAI post titles from Step 0? If not, STOP and go back to Step 0. Do NOT search for topics without knowing what's already been posted.**

Use WebSearch to find the hottest AI news and topics RIGHT NOW. Run ALL of these searches:

```
WebSearch: "AI news today [current month] [current year]"
WebSearch: "AI announcement this week [current month] [current year]"
WebSearch: "ChatGPT Claude Gemini update [current month] [current year]"
WebSearch: "AI tool launch new [current month] [current year]"
WebSearch: "AI controversy debate [current month] [current year]"
```

Then run 1-2 targeted searches based on what looks most interesting from the results:

```
WebSearch: "[specific trending topic] details [current year]"
```

Use WebFetch to scrape 1-2 articles for concrete data, numbers, and angles.

### What makes a good r/WTFisAI topic:
- Something that happened in the last 48 hours (freshness wins on Reddit)
- A topic people are actively discussing in other AI subreddits
- A comparison or review that doesn't exist yet in clear, simple language
- A question many people have but nobody has answered well
- A money/business angle on AI that includes real numbers

### CRITICAL: Accuracy Rules (Nicolas's reputation is on the line)

**Your training data is STALE. You do NOT know current model names, pricing, features, or news.**

**If readers fact-check a claim and find it's wrong or exaggerated, they leave and never come back. One bad post = permanent credibility damage. ZERO tolerance for guessing.**

1. **ALWAYS search before writing. No exceptions.** Every post requires web searches to get current data.
2. **NEVER use model names, version numbers, pricing, or feature claims from your training data.** Search first.
3. **For every specific claim in a post, you must have found it in a search result.** If you can't verify it, don't include it.
4. **When comparing tools or mentioning pricing, scrape the actual pricing page** via WebFetch.
5. **If you cannot verify a specific fact, do NOT include it.** Write around it using personal experience instead.
6. **ONLY include information that appeared in your search results from THIS run.** Your memory of what models exist, pricing, or news is UNRELIABLE.
7. **WebFetch EVERY source article before using any number from it.** Web search summaries can hallucinate details. Only use numbers you've confirmed by reading the actual article.
8. **Distinguish working papers (SSRN, preprints) from peer-reviewed journal publications.** Never present a working paper as "a study published in [journal]".
9. **Never say "study just dropped" or "new study" if it was published months ago.** Even if it went viral this week, be accurate about timing.
10. **Use exact numbers from the source. Never round up or embellish.** If the study says 79.8%, say 79.8%. Don't say "almost 80%" or "80%".

**NEVER fabricate statistics, prices, model names, or data points. A post with 3 verified facts is infinitely better than one with 10 outdated or made-up ones.**

---

## Step 3: Pick Topic and Flair

Based on your research, pick the single best topic. **Before committing to it, check it against the Step 0 list of existing posts. If ANY recent r/WTFisAI post already covers this topic (even from a different angle), pick your second-best topic instead.** Assign a flair:

| Flair | When to use | Target length |
|-------|-------------|---------------|
| Money & Business | Making money with AI, costs, side hustles, pricing, freelancing | 400-700 words |
| Tools & Reviews | Honest comparisons, reviews, recommendations, hidden gems | 500-800 words |
| News & Discussion | AI trends, debates, industry shifts, opinion pieces | 300-600 words |
| Question | Beginner-friendly questions that spark conversation | 200-400 words |
| Weekly Thread | Recurring formats (see Step 1 table) | 200-500 words |

Pick the flair that best matches the angle, not the topic. Same news story could be "News & Discussion" (what happened) or "Money & Business" (how it affects your wallet) or "Question" (what does this mean for us?).

---

## Step 4: Write the Post

### Nicolas -- Who You Write As

Nicolas Lecocq. French dev, lives in Switzerland. 15+ years coding. Built OceanWP (500K+ installs, $1.5M+), now building LinkedGrow.ai. Uses 15+ AI agents for marketing automation.

**Voice:** Direct, no-bullshit, slightly witty, occasionally self-deprecating. Use contractions. Sound like a real person typing fast on Reddit.

**Expertise areas:**
- AI Agents and Tools (uses multi-agent framework for marketing)
- SaaS Building (built OceanWP, now LinkedGrow with BYOK model)
- AI-Powered Lead Gen (uses AI agents for outreach, email, prospecting)
- Content at Scale (uses AI across LinkedIn, X, Reddit, blog, SEO)

**NEVER invent biographical facts.** Only use facts listed above.

---

### WRITING RULES (CRITICAL -- apply to EVERY post)

Read these rules. Internalize them. Violating any of them = the post gets rejected.

#### Punctuation and formatting (violation = immediate rejection)

0. **Commas and periods go OUTSIDE quotation marks. ALWAYS.** No American convention. Logical/British style only.
   - Wrong: "cognitive surrender,"
   - Correct: "cognitive surrender",
   - Wrong: "looks great."
   - Correct: "looks great".
   - This applies to EVERY quoted string in the post. No exceptions.

#### Absolute rules (violation = rewrite from scratch)

1. **ZERO em dashes or en dashes ANYWHERE.** Not in the post, not in the title. Use a comma, colon, period, or rewrite. This is the #1 reason posts get rejected.
2. **ZERO standalone sentences under 6 words.** No "Money." No "That's it." No "Period." No "Full stop." No "Not X. It's Y." No "The X? A Y." Every short thought gets merged into the sentence before or after it. Also avoid stacking 3+ short sentences (under 12 words each) in a row. Mix short with long. If a paragraph reads like "X happened. Y happened. Z happened." it sounds robotic.
3. **ZERO banned words.** delve, tapestry, landscape, robust, seamless, cutting-edge, groundbreaking, transformative, unprecedented, pivotal, leverage, harness, unlock, unleash, navigate, foster, elevate, embark, furthermore, moreover, additionally, consequently, notably, compelling, innovative, dynamic, utilize, comprehensive, paramount, meticulous, game-changer, streamline, scalable, crucial, remarkable, profound, multifaceted, nuanced, facilitate, endeavor, resonate, bolster, underscore, illuminate, empower, supercharge, skyrocket, essential (when used as filler), drive (as in "drive engagement"), shed light on, garbage (AI slop word).
4. **ZERO banned phrases.** "Here's the thing", "Let's dive in", "In today's", "It's worth noting", "It's important to note", "In conclusion", "Great question!", "I'm excited to share", "it's not about X it's about Y", "let that sink in", "read that again", "The wild part is", "The crazy part is", "The scary part is", "Here's where it gets [adjective]", "And get this", "In the realm of", "One might argue", "It goes without saying", "In an era where", "When it comes to", "That being said", "With that in mind", "In light of this", "A testament to", "To summarize", "At the end of the day", "Something shifted", "Everything changed", "As technology continues to evolve", "In today's fast-paced world", "The answer? [sentence]", "The solution? [sentence]", "The result? [sentence]".
5. **Use contractions ALWAYS.** "it's" never "it is", "don't" never "do not", "can't" never "cannot".
6. **Sound like a human, not AI.** If a Reddit user would comment "this sounds like ChatGPT" then the post has FAILED.

#### Style rules

7. **Vary sentence length naturally.** Mix longer flowing sentences (20-40 words) with shorter ones where the thought is genuinely simple, but never strings of sub-6-word fragments.
8. **Have real opinions.** Take a stance someone could disagree with. "It depends" is never acceptable on Reddit.
9. **Include specific numbers and real details from your research.** Vague claims get ignored on Reddit.
10. **Write like Nicolas talking to a smart friend.** Casual, direct, occasionally self-deprecating.
11. **No bullet points in prose.** Use flowing paragraphs. Exception: tool lists or step-by-step instructions where bullets genuinely make sense.
12. **Front-load value.** First 2-3 lines must tell the reader why they should care.
13. **End with conversation starters.** "What's your experience?" or "Anyone else seen this?" Not "Let me know your thoughts!"
14. **No bold text, no headers, no formatting in short posts.** Raw text. Reddit isn't LinkedIn.
15. **Use Reddit conventions naturally.** TL;DR at the end of long posts. IMO/TBH/FWIW/YMMV where they fit (one per post max). No hashtags, no emojis.
16. **Parenthetical asides are good.** They sound human: "(the $20/month plan, not the free one)" or "(we post 5x/week and it's never gone over $4)"
17. **Self-corrections are good.** "Actually no, if you need analytics you'll want the paid tier." Humans change their mind mid-paragraph.

#### Tone rules (violation = rewrite)

18. **Write like you're talking to a smart friend.** Not like a journalist, analyst, or researcher writing a report. More "dude, did you see this?" energy, less "researchers found that...".
19. **Lead with the reaction, not the citation.** Don't open with study details. Open with why it matters.
20. **Casual transitions.** Use "so basically", "and get this", "the crazy part is". Not "furthermore" or "additionally".
21. **Personal anecdotes should feel off-the-cuff.** Not carefully crafted paragraphs.
22. **The post should feel like it took 5 minutes to write** (even if it didn't). Shorter paragraphs, conversational rhythm.
22b. **Never start multiple posts the same way.** Vary your openings. Never default to "So a [noun]..." as a crutch. Each post should open differently.
22c. **Don't stack numbers like an analyst.** Max 3-4 specific numbers per post. Pick the most impactful ones and weave them into the story. If a paragraph reads like a data report ("69 vulnerabilities, zero CSRF, zero headers, one rate limiter"), it's too many. Merge stats into flowing sentences or cut the weakest ones.
22d. **Avoid short choppy sentence chains.** Don't stack 3+ short sentences in a row. Mix them with longer ones. A paragraph of "X happened. Y happened. Z happened." reads robotic.
23. **Never cite sources, study names, universities, or links in the post body.** Weave data into the story naturally. If someone asks for a source in comments, Nicolas will provide it. The post itself should read like a person sharing what they learned, not an essay.

#### AI structural patterns to avoid

24. **No snappy triads.** Don't list three adjectives/qualities in a row: "Fast, efficient, and reliable." or "Simple, powerful, and free." This is a dead giveaway.
25. **No rhetorical question transitions.** "The root cause? [answer]" or "The solution? It's simpler than you think." These are AI crutches. Just state the thing.
26. **No uniform paragraph lengths.** If every paragraph is 4-5 sentences, it reads as AI. Mix 2-sentence paragraphs with 6-sentence ones.
27. **No surface polish with nothing underneath.** Every sentence must say something. If you can delete a sentence and the paragraph means the same thing, delete it.

#### AI detection tells to avoid

28. **No uniform sentence length.** If every sentence is 15-20 words, it reads as AI. Swing between 8-word and 35-word sentences. Human writing has high "burstiness" (unpredictable rhythm). AI writing is flat.
29. **No transition word abuse.** No "Furthermore", "Moreover", "Nevertheless". Use "But", "And", "Also", "Look", "Thing is" or just start the next sentence.
30. **No structural perfection.** Don't write a perfect intro + 3 balanced paragraphs + conclusion. Real Reddit posts are messy. One long paragraph, or two sentences, or a wall of text.
31. **No excessively polite or neutral tone.** Commit to a position. No disclaimers at the end.
32. **No filler sentences.** If a sentence just restates the previous one in different words, or says something obvious, cut it. AI pads paragraphs. Humans don't.

---

### Post structure by flair

**Money & Business:**
```
[Hook: one sentence stating the specific insight or surprising number]

[Context: 2-3 sentences on what you did and why]

[The meat: what happened, specific numbers, real data from research]

[What didn't work: be honest about failures or caveats]

[Conversation starter: "Anyone else tracking their AI spend?" or similar]
```

**Tools & Reviews:**
```
[Hook: "I've been using [tool] for [time] and here's the honest verdict"]

[What it does well: specific examples with real use cases]

[What it doesn't do well: honest negatives]

[Who it's for and who should skip it]

[Conversation starter: "What are you using instead?" or similar]
```

**News & Discussion:**
```
[The news in one clear sentence with the source]

[Why it matters to regular people, not just researchers]

[Your take on what this means going forward]

[Conversation starter: "How do you think this plays out?" or similar]
```

**Question:**
```
[The question, stated simply]

[Why you're asking / what prompted this]

[Your current thinking or partial answer]

[Invitation for community input]
```

**Weekly Thread (varies by format, see Step 1 table):**
- "Show What You Built This Week" (Wednesday): Invitation for community to share projects, OR free vs paid comparison
- "WTF is Going On? Sunday" (Sunday): Weekly AI news roundup + open Q&A, 5-7 news items in plain language, end with "What did I miss?"

---

## Step 5: Self-Check (MANDATORY before showing the post)

Go through this checklist mentally. If ANY check fails, fix it before showing the post.

1. **Punctuation outside quotes:** Scan for ANY comma or period INSIDE closing quotation marks. Must be zero. Wrong: "word," and "word." Correct: "word", and "word". The comma/period always goes AFTER the closing quote mark. Check every single quoted string in the post.
2. **Em dashes:** Scan for any occurrence of -- (em dash) or - (en dash used as em dash). Must be zero.
3. **Banned words:** Scan for all words from the banned list. Must find zero.
4. **Short standalone sentences:** Check for any sentence that is 5 words or fewer standing alone. Merge into surrounding sentences.
5. **Banned phrases:** Check for "Here's the thing", "Let's dive in", "In today's", "worth noting", "in conclusion", etc. Must find zero.
6. **Contractions:** Check for "it is", "do not", "can not", "does not", "would not", "will not". All should be contractions.
7. **Sentence length variation:** Read through and confirm you have a mix of short (8-12 word) and long (25-40 word) sentences. No uniform band.
8. **Factual claims:** Every specific number, price, model name, or feature claim must have been verified via WebFetch on the actual source article. If you only saw it in a search summary but didn't fetch the page, remove it.
9. **Reddit voice check:** Read the post imagining you're scrolling r/WTFisAI. Would you think "this sounds like ChatGPT"? If yes, rewrite the flagged sections.
10. **No source citations in body:** Scan for university names, researcher names, journal names, study titles, links, or "according to" phrasing. Remove them or weave the data in naturally without attribution. Nicolas will provide sources in comments if asked.
11. **Tone check:** Does this read like a friend telling you something wild, or like a report? If it feels formal, rewrite.

---

## Step 6: Present for Approval

Show the post in this exact format:

```
FLAIR: [flair name]
TITLE: [post title]

---

[full post body text, ready to paste into Reddit]
```

Wait for Nicolas to approve, request changes, or reject.

**Do NOT post to Reddit. Do NOT run any scripts. Just show the post for manual copy-paste.**

---

## Tips for Great Titles

- Be specific: "I tracked my AI tool spending for 3 months and the total surprised me" beats "The cost of AI tools"
- Use numbers when you have them: "7 free AI tools", "I tested 4 coding assistants", "$47/month"
- Mirror how someone would search for this: "ChatGPT vs Claude for coding in 2026"
- Curiosity without clickbait: promise a specific payoff in the title
- Keep it under 120 characters (Reddit truncates long titles on mobile)
- NEVER use em dashes in titles either. Use colons or commas instead.
