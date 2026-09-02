import { MetadataRoute } from "next";
import { isSelfHosted } from "@/lib/edition";
import { getAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  // A self hosted instance is a private product, never a site to index.
  if (isSelfHosted()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const disallowPaths = [
    "/dashboard/",
    "/api/",
    "/checkout/",
    "/maintenance/",
    "/redeem/",
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
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
