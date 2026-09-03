import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// The self hosted image runs the traced standalone server (docker/Dockerfile.app).
const selfHosted = (process.env.LINKEDGROW_EDITION ?? "self-hosted") !== "cloud";

const nextConfig: NextConfig = {
  ...(selfHosted ? { output: "standalone" } : {}),
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
        // Files the local storage driver serves. A key is minted once per upload
        // and never rewritten, so the file behind it never changes either.
        source: "/uploads/:path*",
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
        // The documentation, the only pages that are the same for every visitor.
        // The sign in and sign up pages read their configuration at request time.
        source: "/:path(docs|docs/.*)",
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
