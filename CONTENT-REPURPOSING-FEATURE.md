# Content Repurposing Feature - Implementation Guide

> **Goal**: Add YouTube, blog, and web page content repurposing alongside the existing Reddit importer.
> Users paste a URL, the system extracts content, and AI generates LinkedIn posts from it.
> Place this feature below the Reddit importer in the dashboard (`/dashboard/reddit`).

---

## Architecture Overview

All three sources follow the same pattern:

```
User pastes URL → Backend extracts text content → AI generates hooks → AI generates posts
```

The existing Reddit flow already handles Steps 2-4 (hook selection, post generation, edit & publish). The new features only need a **content extraction layer** per source type, then feed into the same AI pipeline.

---

## 1. YouTube Video Repurposing

### How It Works

YouTube auto-generates captions (subtitles) for most videos. We extract those captions as text, then feed that transcript to the AI just like we feed Reddit post content today.

**No YouTube API key needed.** Caption extraction works by scraping YouTube's internal caption endpoint, not the official YouTube Data API.

### Recommended NPM Package

```bash
npm install youtube-caption-extractor
```

**Why this one:**
- TypeScript types included
- Bot detection bypass built in
- Dual extraction methods with automatic fallback (XML captions API + JSON transcript API)
- Actively maintained
- Works without headless browser

**Alternative (simpler, less robust):**
```bash
npm install youtube-transcript
```

### API Route: `POST /api/content/youtube`

```typescript
import { getSubtitles } from "youtube-caption-extractor";

// 1. Extract video ID from URL
//    Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// 2. Fetch captions
const videoId = extractVideoId(url);
const captions = await getSubtitles({ videoID: videoId, lang: "en" });

// 3. Combine caption text into a single transcript
const transcript = captions.map((c) => c.text).join(" ");

// 4. Trim to reasonable length for AI context
//    ~45 min video = ~6,000-8,000 words of transcript
//    Trim to first 4,000 words (~30 min) to stay within token limits
const words = transcript.split(/\s+/);
const trimmedTranscript = words.slice(0, 4000).join(" ");

// 5. Feed to existing AI hook/post generation pipeline
//    Same structure as Reddit: { content: trimmedTranscript, source: "youtube", ... }
```

### Limitations & Error Handling

| Scenario | Detection | User Message |
|----------|-----------|-------------|
| **No captions available** | `getSubtitles` returns empty array | "This video doesn't have captions. YouTube auto-generates captions for most videos, but some (music, very short clips, non-speech content) may not have them. Try a different video." |
| **Video is private/deleted** | Fetch error or 404 | "This video is private, deleted, or unavailable." |
| **Video too long (>60 min)** | Check video duration via oEmbed API before extraction | "This video is over 60 minutes. For best results, use videos under 60 minutes. The AI will focus on the first ~30 minutes of content." (still process it, just warn) |
| **Non-English video** | Try `lang: "en"` first, fallback to auto-detected language | "Captions found in [language]. The AI will do its best to generate an English LinkedIn post from this content." |
| **Rate limited by YouTube** | HTTP 429 or extraction failure | "YouTube is temporarily blocking requests. Please try again in a few minutes." |
| **Invalid URL** | Regex fails to extract video ID | "Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)" |

### Getting Video Duration (for length warning)

Use YouTube's oEmbed endpoint (no API key needed):

```typescript
// Free, no API key, returns basic video metadata
const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
const response = await fetch(oembedUrl);
const data = await response.json();
// Note: oEmbed doesn't return duration directly
// Alternative: parse it from the page HTML or use the caption timestamps
// The last caption's start time + duration = approximate video length
const lastCaption = captions[captions.length - 1];
const videoDurationSeconds = parseFloat(lastCaption.start) + parseFloat(lastCaption.dur);
```

### AI Prompt Adaptation

When sending to the existing AI pipeline, prepend context about the source:

```
Source: YouTube video transcript
Video context: This is a transcript extracted from a YouTube video.
The speaker's key points, stories, data, and actionable advice should
be distilled into a LinkedIn post. Focus on the most insightful or
surprising takeaways rather than summarizing the entire video.
```

---

## 2. Blog Article Repurposing

### How It Works

Fetch the blog URL, extract the main article content (stripping navigation, ads, sidebars), then feed the clean text to AI.

### Recommended Approach

Use a combination of `fetch` + HTML-to-text extraction:

```bash
npm install @mozilla/readability jsdom
```

**Why Readability:**
- Same engine Firefox uses for Reader View
- Excellent at isolating article content from page chrome
- Handles most blog layouts reliably
- Well-maintained by Mozilla

### API Route: `POST /api/content/webpage`

This single endpoint handles both blogs and general web pages (same logic).

```typescript
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

// 1. Fetch the page HTML
const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; LinkedGrow/1.0; +https://linkedgrow.ai)",
    "Accept": "text/html,application/xhtml+xml",
  },
  signal: AbortSignal.timeout(15000), // 15s timeout
});

const html = await response.text();

// 2. Parse with JSDOM
const dom = new JSDOM(html, { url });

// 3. Extract article content with Readability
const reader = new Readability(dom.window.document);
const article = reader.parse();

if (!article || !article.textContent) {
  throw new Error("Could not extract article content from this page.");
}

// 4. Clean and trim
const cleanText = article.textContent
  .replace(/\s+/g, " ")        // Normalize whitespace
  .replace(/\n{3,}/g, "\n\n")  // Max 2 consecutive newlines
  .trim();

// 5. Trim to reasonable length (4,000 words max)
const words = cleanText.split(/\s+/);
const trimmedContent = words.slice(0, 4000).join(" ");

// 6. Build context object for AI pipeline
const contentData = {
  title: article.title || "",
  content: trimmedContent,
  source: "blog",
  wordCount: words.length,
  excerpt: article.excerpt || "",
};
```

### Limitations & Error Handling

| Scenario | Detection | User Message |
|----------|-----------|-------------|
| **Paywall / login required** | Readability returns very short content (<100 words) | "This article appears to be behind a paywall or requires login. Only the preview text was extracted. Try a freely accessible article." |
| **JavaScript-rendered content (SPA)** | Readability returns empty/minimal content | "This page uses JavaScript to load content and we couldn't extract the article. Try copying the article text directly instead." |
| **Non-article page (homepage, listing)** | Readability fails to identify article | "We couldn't identify an article on this page. This works best with blog posts, news articles, and long-form content. Make sure the URL points to a specific article, not a homepage or listing." |
| **Page not found (404)** | HTTP 404 response | "This page doesn't exist or has been removed." |
| **Timeout** | Fetch takes >15s | "This page took too long to load. Please check the URL and try again." |
| **Non-HTML content** | Content-Type isn't text/html | "This URL doesn't point to a web page. Make sure it's a blog post or article URL." |
| **Very short content** | Extracted text < 200 words | Show warning: "This article is very short. The AI may not have enough context to generate a strong post. Consider using a longer article for better results." (still process it) |

---

## 3. Web Page Repurposing

### Same as Blog

The blog and web page extraction use the **exact same API endpoint and logic** (`POST /api/content/webpage`). Readability handles both formats equally well. The only difference is in the AI prompt context:

- If URL contains common blog indicators (`/blog/`, `/post/`, `/article/`, `medium.com`, `substack.com`), label it as "blog article"
- Otherwise, label it as "web page"

This distinction helps the AI adapt its approach (blog = extract insights and opinions, web page = extract facts and data).

---

## UI Integration

### Where to Place

Add a **source selector** at Step 1 of the existing Reddit flow at `/dashboard/reddit`. The page should be renamed or given a broader title like "Content Repurposing" or "Import Content".

### Source Selector UI

```
┌─────────────────────────────────────────────────────┐
│  Import content from:                                │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 🔗 Reddit│ │ ▶ YouTube│ │ 📝 Blog  │ │ 🌐 Web │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Paste URL here...                               │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [Extract Content]                                   │
└─────────────────────────────────────────────────────┘
```

### Auto-Detection

Instead of requiring the user to pick a source type, auto-detect from the URL:

```typescript
function detectSourceType(url: string): "reddit" | "youtube" | "blog" | "webpage" {
  const hostname = new URL(url).hostname.replace("www.", "");

  if (hostname.includes("reddit.com") || hostname.includes("old.reddit.com")) {
    return "reddit";
  }
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return "youtube";
  }
  // Common blog platforms
  if (hostname.includes("medium.com") || hostname.includes("substack.com") ||
      url.includes("/blog/") || url.includes("/post/") || url.includes("/article/")) {
    return "blog";
  }
  return "webpage";
}
```

The tabs can still be shown for visual clarity, but auto-select the right one when a URL is pasted.

### Flow After Extraction

Once content is extracted (from any source), it feeds into the **same pipeline** as Reddit:

1. **Extract content** (source-specific) → returns `{ title, content, source }`
2. **Generate 5 hooks** (existing `/api/reddit/analyze` logic, adapted for generic content)
3. **User selects hook**
4. **Generate 3 posts** (existing `/api/reddit/generate` logic)
5. **Edit & publish** (existing Step 4, unchanged)

The analyze and generate API routes need minor updates to accept a generic content object instead of Reddit-specific `trimmedJson`. Consider renaming to `/api/content/analyze` and `/api/content/generate` (keep old Reddit routes as aliases for backward compat during transition).

---

## API Route Summary

| Route | Method | Purpose | New? |
|-------|--------|---------|------|
| `/api/content/youtube` | POST | Extract YouTube transcript | Yes |
| `/api/content/webpage` | POST | Extract blog/web page content | Yes |
| `/api/reddit/fetch` | POST | Fetch Reddit post (existing) | No |
| `/api/content/analyze` | POST | Generate hooks from any content | Refactor from `/api/reddit/analyze` |
| `/api/content/generate` | POST | Generate posts from hook + content | Refactor from `/api/reddit/generate` |

---

## Dependencies to Install

```bash
npm install youtube-caption-extractor @mozilla/readability jsdom
npm install -D @types/jsdom
```

**Bundle impact:**
- `youtube-caption-extractor`: ~15KB (server-side only, no client bundle impact)
- `@mozilla/readability`: ~40KB (server-side only)
- `jsdom`: ~2MB (server-side only, heavy but only used in API routes, never shipped to client)

All three packages run server-side in API routes only. Zero impact on client bundle size.

---

## Plan Access

Same as Reddit importer: **Starter+ plan required** (uses `redditIdeas` feature flag).

Consider renaming the feature flag from `redditIdeas` to `contentRepurposing` in plans.ts if you want cleaner naming, but functionally it's the same gate.

---

## AI Prompt Templates

### YouTube

```
You are extracting the most insightful, surprising, or actionable content
from a YouTube video transcript to create a viral LinkedIn post.

Source: YouTube video transcript
Title: {videoTitle}
Approximate length: {durationMinutes} minutes
Transcript: {trimmedTranscript}

Focus on:
- The speaker's most counterintuitive or surprising claim
- Specific data points, numbers, or frameworks mentioned
- Actionable advice that LinkedIn professionals can apply immediately
- Personal stories or anecdotes that resonate with a professional audience

Do NOT simply summarize the video. Pick ONE angle and go deep.
```

### Blog / Web Page

```
You are extracting the most compelling insight from a {blog article | web page}
to create a viral LinkedIn post.

Source: {sourceType}
Title: {articleTitle}
Content: {trimmedContent}

Focus on:
- The author's most original or contrarian point
- Statistics, data, or research findings
- Frameworks or methodologies that readers can apply
- Surprising conclusions or counterintuitive advice

Do NOT summarize the entire article. Find the ONE insight that would
make someone stop scrolling on LinkedIn and engage.
```

---

## Testing Checklist

- [ ] YouTube: Video with auto-generated English captions
- [ ] YouTube: Video with manually uploaded captions
- [ ] YouTube: Video with no captions at all (should show clear error)
- [ ] YouTube: Very long video (>60 min) - should warn but still work
- [ ] YouTube: YouTube Shorts URL format
- [ ] YouTube: Private/deleted video (should show error)
- [ ] Blog: Standard WordPress blog post
- [ ] Blog: Medium article
- [ ] Blog: Substack newsletter
- [ ] Blog: Paywalled article (should show warning about limited content)
- [ ] Web: General web page (landing page, documentation, etc.)
- [ ] Web: JavaScript-heavy SPA (should show error about JS rendering)
- [ ] Web: 404 page (should show error)
- [ ] All sources: Generated hooks are relevant to the content
- [ ] All sources: Generated posts maintain user's voice settings
- [ ] All sources: Full flow from URL paste to LinkedIn publish works end-to-end
