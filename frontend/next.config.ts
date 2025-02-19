import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["files.edgestore.dev","imgs.search.brave.com"], // Add the external image domain
  },
};

export default nextConfig;
