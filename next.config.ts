import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow rewrites for API proxy
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `https://pipeline.jazzone.click/api/:path*`,
      },
    ];
  },
  // Disable image optimization for external URLs
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pipeline.jazzone.click" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
