import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["files.edgestore.dev","imgs.search.brave.com"], // Add the external image domain
  },
};

export default nextConfig;
