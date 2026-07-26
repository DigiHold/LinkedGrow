import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
        source: "/:path(about|privacy|terms|cookies|beta|sign-in|sign-up|pricing|blog|blog/.*|docs|docs/.*|help|for/.*|features/.*|free-tools/.*|use-cases/.*|industries/.*|compare/.*|affiliate|affiliate/.*|free-linkedin-course|switch-to-claude|linkedin-profile-views-guide|linkedin-analytics-tool|linkedin-new-job-announcement|linkedin-automation-tools|linkedin-marketing-tool|linkedin-lead-generation-tools)",
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
        // ai-post-generator consolidated into the homepage
        source: "/features/ai-post-generator",
        destination: "/",
        permanent: true,
      },
      {
        // best-time-to-post blog post consolidated into the free tool
        source: "/blog/best-time-to-post-linkedin",
        destination: "/free-tools/linkedin-best-time-to-post",
        permanent: true,
      },
      {
        // carousel-guide consolidated into the carousel-templates guide
        source: "/blog/linkedin-carousel-guide",
        destination: "/blog/linkedin-carousel-templates",
        permanent: true,
      },
      {
        // byok-explained consolidated into the AI API cost comparison
        source: "/blog/byok-bring-your-own-key-explained",
        destination: "/blog/ai-api-cost-comparison-linkedin-tools",
        permanent: true,
      },
      {
        // off-topic news article removed
        source: "/blog/claude-refused-pentagon-switch",
        destination: "/blog",
        permanent: true,
      },
    ];
  },
  // Rewrite IndexNow key files to the API route
  async rewrites() {
    return [
      {
        source: "/:key.txt",
        destination: "/api/indexnow?key=:key",
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
