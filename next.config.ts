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
