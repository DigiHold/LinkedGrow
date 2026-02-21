import { NextResponse } from "next/server";
import { BLOG_POSTS } from "@/lib/blog";
import { getAllPageSeoData } from "@/lib/page-keywords";

const BASE_URL = "https://linkedgrow.ai";

/**
 * Dynamic llms.txt - auto-updates when pages or blog articles are added.
 * Provides structured content map for AI crawlers (ChatGPT, Claude, Perplexity).
 * Standard: https://llmstxt.org/
 */
export async function GET() {
  const allPages = getAllPageSeoData();

  // Group pages by type
  const features = allPages.filter((p) => p.type === "feature");
  const audiences = allPages.filter((p) => p.type === "audience");
  const useCases = allPages.filter((p) => p.type === "use-case");
  const industries = allPages.filter((p) => p.type === "industry");
  const freeTools = allPages.filter((p) => p.type === "free-tool");
  const marketing = allPages.filter(
    (p) => p.type === "marketing" && p.path !== "/"
  );
  const blogPosts = Object.values(BLOG_POSTS);

  const lines: string[] = [
    "# LinkedGrow",
    "",
    "> LinkedGrow is an AI-powered LinkedIn content creation platform. It helps founders, creators, and teams write, schedule, and optimize LinkedIn posts using 20+ AI models across 5 providers (OpenAI, Anthropic, Google, Grok, Perplexity). The key differentiator is the BYOK (Bring Your Own Key) model - users connect their own AI API keys for unlimited generations at $19-79/month plus $2-4/month in AI costs.",
    "",
    `- Website: ${BASE_URL}`,
    "- Founded by: Nicolas Lecocq (creator of OceanWP, 15+ years web dev)",
    "- Based in: Paris, France",
    "- Pricing: Free ($0), Starter ($19/mo), Pro ($39/mo), Business ($79/mo)",
    "",
  ];

  // Features
  if (features.length > 0) {
    lines.push("## Features");
    for (const page of features) {
      lines.push(`- [${page.title}](${BASE_URL}${page.path})`);
    }
    lines.push("");
  }

  // Audiences
  if (audiences.length > 0) {
    lines.push("## Who It's For");
    for (const page of audiences) {
      lines.push(`- [${page.title}](${BASE_URL}${page.path})`);
    }
    lines.push("");
  }

  // Use Cases
  if (useCases.length > 0) {
    lines.push("## Use Cases");
    for (const page of useCases) {
      lines.push(`- [${page.title}](${BASE_URL}${page.path})`);
    }
    lines.push("");
  }

  // Industries
  if (industries.length > 0) {
    lines.push("## Industries");
    for (const page of industries) {
      lines.push(`- [${page.title}](${BASE_URL}${page.path})`);
    }
    lines.push("");
  }

  // Free Tools
  if (freeTools.length > 0) {
    lines.push("## Free Tools");
    for (const page of freeTools) {
      lines.push(`- [${page.title}](${BASE_URL}${page.path})`);
    }
    lines.push("");
  }

  // Marketing pages
  if (marketing.length > 0) {
    lines.push("## Pages");
    for (const page of marketing) {
      lines.push(`- [${page.title}](${BASE_URL}${page.path})`);
    }
    lines.push("");
  }

  // Blog
  if (blogPosts.length > 0) {
    lines.push("## Blog");
    for (const post of blogPosts) {
      lines.push(
        `- [${post.title}](${BASE_URL}/blog/${post.slug}): ${post.description}`
      );
    }
    lines.push("");
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
