import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable edge runtime for Cloudflare Workers
  experimental: {
    // runtime: "edge",
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
    ],
  },
};

export default nextConfig;
