import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { getAppUrl } from "./src/lib/app-url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// The self hosted edition serves its own uploads from the app origin, and
// next/image only optimises hosts it was told about.
const appUrl = new URL(getAppUrl());
const appProtocol: "http" | "https" = appUrl.protocol === "http:" ? "http" : "https";

const nextConfig: NextConfig = {
  // Inlined into the server and browser bundles alike, so a client component
  // gating on the edition answers the same as the route behind it.
  env: {
    LINKEDGROW_EDITION: process.env.LINKEDGROW_EDITION ?? "self-hosted",
  },
  // Performance optimizations
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "framer-motion",
      "recharts",
      "date-fns",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-accordion",
      "@radix-ui/react-switch",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      {
        protocol: "https",
        hostname: "pub-86332bae77404495924b3ef7d4cbe7db.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: appProtocol,
        hostname: appUrl.hostname,
        port: appUrl.port,
      },
    ],
  },
  // Security and cache headers
  async headers() {
    // Security headers applied to all routes
    const securityHeaders = [
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      },
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
    ];

    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Static assets (JS, CSS, fonts) - immutable, 1 year cache
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Favicon and other root static files
        source: "/:path(favicon.ico|icon.svg|robots.txt|sitemap.xml)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
      {
        // Public marketing pages only (logged-out) - CDN cache 1 hour, stale-while-revalidate
        source: "/:path(about|privacy|terms|cookies|beta|sign-in|sign-up|pricing|blog|blog/.*|docs|docs/.*|help|for/.*|features/.*|free-tools/.*|use-cases/.*|industries/.*|compare/.*|affiliate|affiliate/.*|free-linkedin-course|switch-to-claude|linkedin-profile-views-guide|linkedin-analytics-tool|linkedin-new-job-announcement|linkedin-automation-tools|linkedin-marketing-tool|linkedin-lead-generation-tools|linkedin-prospecting-tools|b2b-lead-generation-tools|linkedin-scraper|linkedin-ai-agent|ai-bdr|ai-sdr-software|ai-sales-tools|ai-sales-agent|book-demo|uploads/.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },
  // Permanent redirects for removed/consolidated pages
  async redirects() {
    return [
      {
        // API access and MCP are Pro features, so both docs left the Business
        // category. This path is in the live sitemap and keeps working.
        source: "/docs/business-features/api-access",
        destination: "/docs/integrations/api-access",
        permanent: true,
      },
    ];
  },
  // Compress responses
  compress: true,
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Reduce powered-by header for security
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
