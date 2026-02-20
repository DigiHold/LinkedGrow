import { MetadataRoute } from "next";

const BASE_URL = "https://linkedgrow.ai";

export default function robots(): MetadataRoute.Robots {
  const disallowPaths = [
    "/dashboard/",
    "/api/",
    "/onboarding/",
    "/checkout/",
    "/maintenance/",
  ];

  return {
    rules: [
      // General crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowPaths,
      },
      // AI crawlers - explicitly allowed for GEO (Generative Engine Optimization)
      // These bots index content for AI search (ChatGPT, Claude, Perplexity, Google AI)
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: disallowPaths,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: disallowPaths,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: disallowPaths,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: disallowPaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: disallowPaths,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: disallowPaths,
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: disallowPaths,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
